import { SPHttpClient } from '@microsoft/sp-http';
import { COMPLIANCE_ASSESSMENT_SEED_DATA, COMPLIANCE_BUILT_IN_FRAMEWORKS, resolveComplianceSeedItemStatuses, type ComplianceAssessmentSeedProfile } from '../constants/complianceSeedData';
import {
  AssessmentStatus,
  ComplianceItemStatus,
  IComplianceAssessment,
  IComplianceAssessmentDetail,
  IComplianceAssessmentItem,
  IComplianceControl,
  IComplianceFramework,
  ICustomFrameworkInput
} from '../models/ICompliance';
import {
  COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE,
  COMPLIANCE_ASSESSMENTS_LIST_TITLE,
  COMPLIANCE_CONTROLS_LIST_TITLE,
  COMPLIANCE_FRAMEWORKS_LIST_TITLE,
  RISK_CONTROL_LINKS_LIST_TITLE,
  RISK_MANAGEMENT_LISTS
} from '../models/IListDefinitions';
import { toDateOnlyFieldValue } from '../utils/sharePointFieldPayload';
import { ListProvisioningService } from './ListProvisioningService';
import { RiskControlLinkService } from './RiskControlLinkService';
import { SharePointRestService } from './SharePointRestService';
import { AuditService } from './AuditService';
import type {
  IRiskControlLink,
  IRiskLinkOption,
  RiskControlLinkType
} from '../models/IRiskControlLink';

interface IFrameworkListItem {
  Id: number;
  Title: string;
  Code?: string;
  Version?: string;
  FrameworkDescription?: string;
  IsBuiltIn?: boolean;
  IsActive?: boolean;
}

interface IControlListItem {
  Id: number;
  Title: string;
  ControlCode?: string;
  Category?: string;
  SortOrder?: string;
  ControlDescription?: string;
  Framework?: { Id: number; Title?: string };
}

interface IAssessmentListItem {
  Id: number;
  Title: string;
  AssessmentStatus?: string;
  DueDate?: string;
  CompletedDate?: string;
  Created?: string;
  Framework?: { Id: number; Title?: string };
}

interface IAssessmentItemListItem {
  Id: number;
  Title: string;
  ItemStatus?: string;
  Evidence?: string;
  Notes?: string;
  CompletedDate?: string;
  Assessment?: { Id: number };
  Control?: { Id: number; Title?: string };
}

interface ICreateAssessmentInternalOptions {
  seedItemProfile?: ComplianceAssessmentSeedProfile;
  assessmentStatus?: AssessmentStatus;
  completedDate?: string;
}

export class ComplianceService {
  private readonly rest: SharePointRestService;
  private readonly provisioning: ListProvisioningService;
  private readonly audit: AuditService;
  private readonly spHttpClient: SPHttpClient;
  private readonly webUrl: string;
  private riskControlLinks?: RiskControlLinkService;
  private complianceSeedPromise?: Promise<void>;
  private listsReadyPromise?: Promise<void>;
  private dashboardCache?: {
    loadedAt: number;
    frameworks: IComplianceFramework[];
    assessments: IComplianceAssessment[];
  };

  private static readonly DASHBOARD_CACHE_MS = 120000;
  private static readonly ASSESSMENT_ITEM_CREATE_BATCH = 8;
  private static readonly CONTROL_CREATE_BATCH = 8;

  constructor(spHttpClient: SPHttpClient, webUrl: string) {
    this.spHttpClient = spHttpClient;
    this.webUrl = webUrl;
    this.rest = new SharePointRestService(spHttpClient, webUrl);
    this.provisioning = new ListProvisioningService(spHttpClient, webUrl);
    this.audit = new AuditService(this.rest, () => this.rest.getCurrentUser(), spHttpClient, webUrl);
  }

  private getRiskControlLinkService(): RiskControlLinkService {
    if (!this.riskControlLinks) {
      this.riskControlLinks = new RiskControlLinkService(this.spHttpClient, this.webUrl);
    }
    return this.riskControlLinks;
  }

  /** Risk ↔ control links for every control in a framework (by framework code). */
  public getControlRiskLinks(frameworkCode: string): Promise<IRiskControlLink[]> {
    if (!frameworkCode) {
      return Promise.resolve([]);
    }
    return this.getRiskControlLinkService().getLinksForFramework(frameworkCode);
  }

  /** Risk register options for the link picker. */
  public getRiskLinkOptions(): Promise<IRiskLinkOption[]> {
    return this.getRiskControlLinkService().getRiskLinkOptions();
  }

  public async addRiskControlLink(
    riskId: number,
    controlId: number,
    linkType: RiskControlLinkType,
    rationale?: string
  ): Promise<number> {
    return this.getRiskControlLinkService().createLink({ riskId, controlId, linkType, rationale });
  }

  public async removeRiskControlLink(linkId: number): Promise<void> {
    await this.getRiskControlLinkService().deleteLink(linkId);
  }

  /** Optimized single round-trip for the compliance dashboard page. */
  public async getComplianceDashboardData(
    forceRefresh = false
  ): Promise<{ frameworks: IComplianceFramework[]; assessments: IComplianceAssessment[] }> {
    await this.ensureListsReady();

    if (
      !forceRefresh &&
      this.dashboardCache &&
      Date.now() - this.dashboardCache.loadedAt < ComplianceService.DASHBOARD_CACHE_MS
    ) {
      return {
        frameworks: this.dashboardCache.frameworks,
        assessments: this.dashboardCache.assessments
      };
    }

    const [frameworkItems, controls, assessments, items] = await Promise.all([
      this.rest.getAllItems<IFrameworkListItem>(
        COMPLIANCE_FRAMEWORKS_LIST_TITLE,
        'Id,Title,Code,Version,FrameworkDescription,IsBuiltIn,IsActive',
        undefined,
        undefined,
        'Title asc'
      ),
      this.rest.getAllItems<IControlListItem>(
        COMPLIANCE_CONTROLS_LIST_TITLE,
        'Id,Framework/Id',
        'Framework'
      ),
      this.rest.getAllItems<IAssessmentListItem>(
        COMPLIANCE_ASSESSMENTS_LIST_TITLE,
        'Id,Title,AssessmentStatus,DueDate,CompletedDate,Created,Framework/Id,Framework/Title',
        'Framework',
        undefined,
        'Created desc'
      ),
      this.rest.getAllItems<IAssessmentItemListItem>(
        COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE,
        'Id,Assessment/Id,ItemStatus',
        'Assessment'
      )
    ]);

    const frameworkMeta = new Map(
      frameworkItems.map((framework) => [
        framework.Id,
        { code: framework.Code || '', version: framework.Version }
      ])
    );

    const controlCounts = new Map<number, number>();
    controls.forEach((control) => {
      const frameworkId = control.Framework?.Id;
      if (!frameworkId) {
        return;
      }
      controlCounts.set(frameworkId, (controlCounts.get(frameworkId) || 0) + 1);
    });

    const frameworks = frameworkItems
      .filter((framework) => framework.IsActive !== false)
      .map((framework) => this.mapFramework(framework, controlCounts.get(framework.Id) || 0))
      .sort((a, b) => {
        if (a.isBuiltIn !== b.isBuiltIn) {
          return a.isBuiltIn ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

    const itemStats = new Map<number, { total: number; compliant: number; assessed: number }>();
    items.forEach((item) => {
      const assessmentId = item.Assessment?.Id;
      if (!assessmentId) {
        return;
      }
      const stats = itemStats.get(assessmentId) || { total: 0, compliant: 0, assessed: 0 };
      stats.total += 1;
      if (item.ItemStatus === 'Compliant') {
        stats.compliant += 1;
      }
      if (item.ItemStatus && item.ItemStatus !== 'Not Assessed') {
        stats.assessed += 1;
      }
      itemStats.set(assessmentId, stats);
    });

    const assessmentRows = assessments.map((assessment) => {
      const frameworkId = assessment.Framework?.Id || 0;
      const framework = frameworkMeta.get(frameworkId);
      const stats = itemStats.get(assessment.Id) || { total: 0, compliant: 0, assessed: 0 };
      return {
        id: assessment.Id,
        name: assessment.Title,
        status: (assessment.AssessmentStatus || 'Draft') as AssessmentStatus,
        frameworkId,
        frameworkName: assessment.Framework?.Title || '',
        frameworkCode: framework?.code || '',
        frameworkVersion: framework?.version,
        dueDate: assessment.DueDate,
        completedDate: assessment.CompletedDate,
        createdAt: assessment.Created,
        totalItems: stats.total,
        compliantItems: stats.compliant,
        assessedItems: stats.assessed
      };
    });

    this.dashboardCache = {
      loadedAt: Date.now(),
      frameworks,
      assessments: assessmentRows
    };

    return { frameworks, assessments: assessmentRows };
  }

  public async getFrameworks(activeOnly = true): Promise<IComplianceFramework[]> {
    const cached = this.getCachedDashboardData();
    if (cached) {
      return activeOnly ? cached.frameworks.filter((framework) => framework.isActive) : cached.frameworks;
    }

    await this.ensureListsReady();
    const [frameworks, controls] = await Promise.all([
      this.rest.getAllItems<IFrameworkListItem>(
        COMPLIANCE_FRAMEWORKS_LIST_TITLE,
        'Id,Title,Code,Version,FrameworkDescription,IsBuiltIn,IsActive',
        undefined,
        undefined,
        'Title asc'
      ),
      this.rest.getAllItems<IControlListItem>(
        COMPLIANCE_CONTROLS_LIST_TITLE,
        'Id,Framework/Id',
        'Framework'
      )
    ]);

    const controlCounts = new Map<number, number>();
    controls.forEach((control) => {
      const frameworkId = control.Framework?.Id;
      if (!frameworkId) {
        return;
      }
      controlCounts.set(frameworkId, (controlCounts.get(frameworkId) || 0) + 1);
    });

    return frameworks
      .filter((framework) => !activeOnly || framework.IsActive !== false)
      .map((framework) => this.mapFramework(framework, controlCounts.get(framework.Id) || 0))
      .sort((a, b) => {
        if (a.isBuiltIn !== b.isBuiltIn) {
          return a.isBuiltIn ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  }

  public async getFrameworkById(
    frameworkId: number,
    activeOnly = false
  ): Promise<IComplianceFramework | undefined> {
    const cached = this.getCachedDashboardData();
    if (cached) {
      const match = cached.frameworks.find((framework) => framework.id === frameworkId);
      if (match && (!activeOnly || match.isActive)) {
        return match;
      }
    }

    await this.ensureListsReady();
    const [frameworkItems, controls] = await Promise.all([
      this.rest.getAllItems<IFrameworkListItem>(
        COMPLIANCE_FRAMEWORKS_LIST_TITLE,
        'Id,Title,Code,Version,FrameworkDescription,IsBuiltIn,IsActive',
        undefined,
        `Id eq ${frameworkId}`
      ),
      this.rest.getAllItems<IControlListItem>(
        COMPLIANCE_CONTROLS_LIST_TITLE,
        'Id,Framework/Id',
        'Framework',
        `Framework/Id eq ${frameworkId}`
      )
    ]);

    const framework = frameworkItems[0];
    if (!framework || (activeOnly && framework.IsActive === false)) {
      return undefined;
    }

    return this.mapFramework(framework, controls.length);
  }

  public async getFrameworkControls(frameworkId: number): Promise<IComplianceControl[]> {
    await this.ensureListsReady();
    const controls = await this.rest.getAllItems<IControlListItem>(
      COMPLIANCE_CONTROLS_LIST_TITLE,
      'Id,Title,ControlCode,Category,SortOrder,ControlDescription,Framework/Id',
      'Framework',
      `Framework/Id eq ${frameworkId}`,
      'SortOrder asc,Title asc'
    );

    return controls
      .map((control) => this.mapControl(control))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.controlCode.localeCompare(b.controlCode));
  }

  public async getAssessments(): Promise<IComplianceAssessment[]> {
    const cached = this.getCachedDashboardData();
    if (cached) {
      return cached.assessments;
    }

    await this.ensureListsReady();
    const [assessments, items, frameworks] = await Promise.all([
      this.rest.getAllItems<IAssessmentListItem>(
        COMPLIANCE_ASSESSMENTS_LIST_TITLE,
        'Id,Title,AssessmentStatus,DueDate,CompletedDate,Created,Framework/Id,Framework/Title',
        'Framework',
        undefined,
        'Created desc'
      ),
      this.rest.getAllItems<IAssessmentItemListItem>(
        COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE,
        'Id,Assessment/Id,ItemStatus',
        'Assessment'
      ),
      this.rest.getAllItems<IFrameworkListItem>(COMPLIANCE_FRAMEWORKS_LIST_TITLE, 'Id,Code,Version')
    ]);

    const frameworkById = new Map(frameworks.map((framework) => [framework.Id, framework]));
    const itemStats = new Map<number, { total: number; compliant: number; assessed: number }>();

    items.forEach((item) => {
      const assessmentId = item.Assessment?.Id;
      if (!assessmentId) {
        return;
      }
      const stats = itemStats.get(assessmentId) || { total: 0, compliant: 0, assessed: 0 };
      stats.total += 1;
      if (item.ItemStatus === 'Compliant') {
        stats.compliant += 1;
      }
      if (item.ItemStatus && item.ItemStatus !== 'Not Assessed') {
        stats.assessed += 1;
      }
      itemStats.set(assessmentId, stats);
    });

    return assessments.map((assessment) => {
      const frameworkId = assessment.Framework?.Id || 0;
      const framework = frameworkById.get(frameworkId);
      const stats = itemStats.get(assessment.Id) || { total: 0, compliant: 0, assessed: 0 };
      return {
        id: assessment.Id,
        name: assessment.Title,
        status: (assessment.AssessmentStatus || 'Draft') as AssessmentStatus,
        frameworkId,
        frameworkName: assessment.Framework?.Title || '',
        frameworkCode: framework?.Code || '',
        frameworkVersion: framework?.Version,
        dueDate: assessment.DueDate,
        completedDate: assessment.CompletedDate,
        createdAt: assessment.Created,
        totalItems: stats.total,
        compliantItems: stats.compliant,
        assessedItems: stats.assessed
      };
    });
  }

  public async getAssessmentDetail(assessmentId: number): Promise<IComplianceAssessmentDetail | undefined> {
    await this.ensureListsReady();

    const cachedAssessment = this.getCachedDashboardData()?.assessments.find(
      (entry) => entry.id === assessmentId
    );

    const assessmentRow = await this.rest.getListItemById<IAssessmentListItem>(
      COMPLIANCE_ASSESSMENTS_LIST_TITLE,
      assessmentId,
      'Id,Title,AssessmentStatus,DueDate,CompletedDate,Created,Framework/Id,Framework/Title',
      'Framework'
    );

    if (!assessmentRow) {
      return undefined;
    }

    const frameworkId = assessmentRow.Framework?.Id || 0;

    const [items, controls, frameworkItems] = await Promise.all([
      this.rest.getAllItems<IAssessmentItemListItem>(
        COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE,
        'Id,Title,ItemStatus,Evidence,Notes,CompletedDate,Assessment/Id,Control/Id',
        'Assessment,Control',
        `Assessment/Id eq ${assessmentId}`
      ),
      this.getFrameworkControls(frameworkId),
      cachedAssessment
        ? Promise.resolve([] as IFrameworkListItem[])
        : this.rest.getAllItems<IFrameworkListItem>(
            COMPLIANCE_FRAMEWORKS_LIST_TITLE,
            'Id,Code,Version',
            undefined,
            `Id eq ${frameworkId}`
          )
    ]);

    const stats = { total: 0, compliant: 0, assessed: 0 };
    items.forEach((item) => {
      stats.total += 1;
      if (item.ItemStatus === 'Compliant') {
        stats.compliant += 1;
      }
      if (item.ItemStatus && item.ItemStatus !== 'Not Assessed') {
        stats.assessed += 1;
      }
    });

    const framework = frameworkItems[0];
    const assessment: IComplianceAssessment = cachedAssessment || {
      id: assessmentRow.Id,
      name: assessmentRow.Title,
      status: (assessmentRow.AssessmentStatus || 'Draft') as AssessmentStatus,
      frameworkId,
      frameworkName: assessmentRow.Framework?.Title || '',
      frameworkCode: framework?.Code || '',
      frameworkVersion: framework?.Version,
      dueDate: assessmentRow.DueDate,
      completedDate: assessmentRow.CompletedDate,
      createdAt: assessmentRow.Created,
      totalItems: stats.total,
      compliantItems: stats.compliant,
      assessedItems: stats.assessed
    };

    const controlById = new Map(controls.map((control) => [control.id, control]));
    const mappedItems: IComplianceAssessmentItem[] = [];
    items.forEach((item) => {
      const controlId = item.Control?.Id || 0;
      const control = controlById.get(controlId);
      if (!control) {
        return;
      }
      mappedItems.push({
        id: item.Id,
        assessmentId,
        controlId,
        controlCode: control.controlCode,
        title: control.title,
        description: control.description,
        category: control.category,
        sortOrder: control.sortOrder,
        status: (item.ItemStatus || 'Not Assessed') as ComplianceItemStatus,
        evidence: item.Evidence,
        notes: item.Notes,
        completedDate: item.CompletedDate
      });
    });
    mappedItems.sort((a, b) => a.sortOrder - b.sortOrder || a.controlCode.localeCompare(b.controlCode));

    return {
      ...assessment,
      items: mappedItems
    };
  }

  public async createAssessment(
    name: string,
    frameworkId: number,
    dueDate?: string
  ): Promise<number> {
    await this.ensureComplianceReadyForWrite();
    return this.createAssessmentInternal(name, frameworkId, dueDate);
  }

  private async createAssessmentInternal(
    name: string,
    frameworkId: number,
    dueDate?: string,
    options?: ICreateAssessmentInternalOptions
  ): Promise<number> {
    const framework = await this.fetchFrameworkRecord(frameworkId);
    if (!framework || framework.IsActive === false) {
      throw new Error('Framework is not available or has been deactivated.');
    }

    const controls = await this.fetchFrameworkControls(frameworkId);
    if (controls.length === 0) {
      throw new Error('Selected framework has no controls.');
    }

    const assessmentDef = RISK_MANAGEMENT_LISTS.find((list) => list.title === COMPLIANCE_ASSESSMENTS_LIST_TITLE);
    const itemDef = RISK_MANAGEMENT_LISTS.find((list) => list.title === COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE);
    if (!assessmentDef || !itemDef) {
      throw new Error('Compliance list definitions are missing.');
    }

    const assessmentList = await this.rest.getListByTitle(COMPLIANCE_ASSESSMENTS_LIST_TITLE);
    const itemList = await this.rest.getListByTitle(COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE);
    if (!assessmentList || !itemList) {
      throw new Error('Compliance lists are not ready.');
    }

    const statusByControlCode = options?.seedItemProfile
      ? resolveComplianceSeedItemStatuses(
          options.seedItemProfile,
          controls.map((control) => control.controlCode)
        )
      : {};
    const completedDateValue = toDateOnlyFieldValue(
      options?.completedDate ||
        (options?.assessmentStatus === 'Complete' ? new Date().toISOString() : '')
    );

    const assessmentId = await this.rest.addListItemResolved(
      COMPLIANCE_ASSESSMENTS_LIST_TITLE,
      assessmentList.Id,
      {
        Title: name,
        FrameworkId: frameworkId,
        AssessmentStatus: options?.assessmentStatus || 'Draft',
        DueDate: toDateOnlyFieldValue(dueDate || ''),
        CompletedDate:
          options?.assessmentStatus === 'Complete'
            ? completedDateValue
            : null
      },
      assessmentDef.fields
    );

    const batchSize = ComplianceService.ASSESSMENT_ITEM_CREATE_BATCH;
    for (let index = 0; index < controls.length; index += batchSize) {
      const batch = controls.slice(index, index + batchSize);
      await Promise.all(
        batch.map((control) => {
          const itemStatus = statusByControlCode[control.controlCode] || 'Not Assessed';
          return this.rest.addListItemResolved(
            COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE,
            itemList.Id,
            {
              Title: `${control.controlCode} - ${control.title}`,
              AssessmentId: assessmentId,
              ControlId: control.id,
              ItemStatus: itemStatus,
              CompletedDate:
                itemStatus === 'Compliant'
                  ? toDateOnlyFieldValue(options?.completedDate || dueDate || new Date().toISOString())
                  : null
            },
            itemDef.fields
          );
        })
      );
    }

    await this.audit.write({
      entity: 'ComplianceAssessments',
      action: 'CREATE',
      entityId: String(assessmentId),
      details: {
        name,
        frameworkId,
        frameworkName: framework.Title,
        controlCount: controls.length,
        dueDate: dueDate || null
      }
    });

    this.invalidateDashboardCache();

    return assessmentId;
  }

  public async updateAssessmentItem(
    itemId: number,
    status: ComplianceItemStatus,
    evidence?: string,
    notes?: string
  ): Promise<void> {
    await this.ensureListsReady();
    await this.rest.updateItem(COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE, itemId, {
      ItemStatus: status,
      Evidence: evidence || '',
      Notes: notes || '',
      CompletedDate: status === 'Compliant' ? toDateOnlyFieldValue(new Date().toISOString()) : null
    });

    await this.audit.write({
      entity: 'ComplianceAssessmentItems',
      action: 'UPDATE',
      entityId: String(itemId),
      details: { status, evidence: evidence || '', notes: notes || '' }
    });

    this.invalidateDashboardCache();
  }

  public async updateAssessmentStatus(assessmentId: number, status: AssessmentStatus): Promise<void> {
    await this.ensureListsReady();

    if (status === 'Complete') {
      const detail = await this.getAssessmentDetail(assessmentId);
      if (!detail || detail.items.length === 0) {
        throw new Error('Cannot complete an assessment with no items.');
      }
      const unassessed = detail.items.filter((item) => item.status === 'Not Assessed').length;
      if (unassessed > 0) {
        throw new Error(
          `Cannot complete assessment: ${unassessed} of ${detail.items.length} items have not been assessed yet.`
        );
      }
    }

    await this.rest.updateItem(COMPLIANCE_ASSESSMENTS_LIST_TITLE, assessmentId, {
      AssessmentStatus: status,
      CompletedDate: status === 'Complete' ? toDateOnlyFieldValue(new Date().toISOString()) : null
    });

    await this.audit.write({
      entity: 'ComplianceAssessments',
      action: 'UPDATE',
      entityId: String(assessmentId),
      details: { AssessmentStatus: status }
    });

    this.invalidateDashboardCache();
  }

  public async deleteAssessment(assessmentId: number): Promise<void> {
    await this.ensureListsReady();
    const detail = await this.getAssessmentDetail(assessmentId);
    const items = await this.rest.getAllItems<IAssessmentItemListItem>(
      COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE,
      'Id,Assessment/Id',
      'Assessment',
      `Assessment/Id eq ${assessmentId}`
    );

    for (const item of items) {
      await this.rest.deleteItem(COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE, item.Id);
    }

    await this.rest.deleteItem(COMPLIANCE_ASSESSMENTS_LIST_TITLE, assessmentId);

    await this.audit.write({
      entity: 'ComplianceAssessments',
      action: 'DELETE',
      entityId: String(assessmentId),
      details: detail
        ? { name: detail.name, frameworkName: detail.frameworkName, itemCount: detail.items.length }
        : undefined
    });

    this.invalidateDashboardCache();
  }

  public async setFrameworkActive(frameworkId: number, isActive: boolean): Promise<void> {
    await this.ensureListsReady();
    await this.rest.updateItem(COMPLIANCE_FRAMEWORKS_LIST_TITLE, frameworkId, {
      IsActive: isActive
    });

    this.invalidateDashboardCache();

    await this.audit.write({
      entity: 'ComplianceFrameworks',
      action: 'UPDATE',
      entityId: String(frameworkId),
      details: { IsActive: isActive }
    });
  }

  public async createCustomFramework(input: ICustomFrameworkInput): Promise<number> {
    await this.ensureListsReady();
    this.validateCustomFrameworkInput(input);
    const code = this.normalizeFrameworkCode(input.code);
    await this.assertFrameworkCodeAvailable(code);

    const frameworkDef = RISK_MANAGEMENT_LISTS.find((list) => list.title === COMPLIANCE_FRAMEWORKS_LIST_TITLE);
    const controlDef = RISK_MANAGEMENT_LISTS.find((list) => list.title === COMPLIANCE_CONTROLS_LIST_TITLE);
    if (!frameworkDef || !controlDef) {
      throw new Error('Compliance list definitions are missing.');
    }

    const frameworkList = await this.rest.getListByTitle(COMPLIANCE_FRAMEWORKS_LIST_TITLE);
    const controlList = await this.rest.getListByTitle(COMPLIANCE_CONTROLS_LIST_TITLE);
    if (!frameworkList || !controlList) {
      throw new Error('Compliance lists are not ready.');
    }

    const frameworkId = await this.rest.addListItemResolved(
      COMPLIANCE_FRAMEWORKS_LIST_TITLE,
      frameworkList.Id,
      {
        Title: input.name.trim(),
        Code: code,
        Version: (input.version || '1.0').trim(),
        FrameworkDescription: input.description?.trim() || '',
        IsBuiltIn: false,
        IsActive: true
      },
      frameworkDef.fields
    );

    await this.replaceFrameworkControls(
      frameworkId,
      input.controls,
      String(controlList.Id),
      controlDef.fields
    );

    this.invalidateDashboardCache();

    await this.audit.write({
      entity: 'ComplianceFrameworks',
      action: 'CREATE',
      entityId: String(frameworkId),
      details: {
        name: input.name.trim(),
        code,
        controlCount: input.controls.length,
        isBuiltIn: false
      }
    });

    return frameworkId;
  }

  public async updateCustomFramework(frameworkId: number, input: ICustomFrameworkInput): Promise<void> {
    await this.ensureListsReady();
    await this.assertCustomFramework(frameworkId);
    this.validateCustomFrameworkInput(input);
    const code = this.normalizeFrameworkCode(input.code);
    await this.assertFrameworkCodeAvailable(code, frameworkId);

    const controlDef = RISK_MANAGEMENT_LISTS.find((list) => list.title === COMPLIANCE_CONTROLS_LIST_TITLE);
    const controlList = await this.rest.getListByTitle(COMPLIANCE_CONTROLS_LIST_TITLE);
    if (!controlDef || !controlList) {
      throw new Error('Compliance lists are not ready.');
    }

    await this.rest.updateItem(COMPLIANCE_FRAMEWORKS_LIST_TITLE, frameworkId, {
      Title: input.name.trim(),
      Code: code,
      Version: (input.version || '1.0').trim(),
      FrameworkDescription: input.description?.trim() || ''
    });

    await this.deleteFrameworkControls(frameworkId);
    await this.replaceFrameworkControls(
      frameworkId,
      input.controls,
      String(controlList.Id),
      controlDef.fields
    );

    this.invalidateDashboardCache();

    await this.audit.write({
      entity: 'ComplianceFrameworks',
      action: 'UPDATE',
      entityId: String(frameworkId),
      details: {
        name: input.name.trim(),
        code,
        controlCount: input.controls.length
      }
    });
  }

  public async deleteCustomFramework(frameworkId: number): Promise<void> {
    await this.ensureListsReady();
    await this.assertCustomFramework(frameworkId);

    const assessments = await this.rest.getAllItems<IAssessmentListItem>(
      COMPLIANCE_ASSESSMENTS_LIST_TITLE,
      'Id,Framework/Id',
      'Framework',
      `Framework/Id eq ${frameworkId}`
    );
    if (assessments.length > 0) {
      throw new Error(
        `Cannot delete this framework while ${assessments.length} assessment(s) still reference it.`
      );
    }

    const framework = await this.rest.getListItemById<IFrameworkListItem>(
      COMPLIANCE_FRAMEWORKS_LIST_TITLE,
      frameworkId,
      'Id,Title,Code'
    );

    await this.deleteFrameworkControls(frameworkId);
    await this.rest.deleteItem(COMPLIANCE_FRAMEWORKS_LIST_TITLE, frameworkId);

    this.invalidateDashboardCache();

    await this.audit.write({
      entity: 'ComplianceFrameworks',
      action: 'DELETE',
      entityId: String(frameworkId),
      details: framework
        ? { name: framework.Title, code: framework.Code || '' }
        : undefined
    });
  }

  public async seedBuiltInFrameworks(): Promise<number> {
    await this.ensureListsReady();
    const existing = await this.rest.getAllItems<IFrameworkListItem>(
      COMPLIANCE_FRAMEWORKS_LIST_TITLE,
      'Id,Code,IsBuiltIn'
    );
    const existingCodes = new Set(
      existing.filter((framework) => framework.IsBuiltIn).map((framework) => framework.Code || '')
    );

    const frameworkDef = RISK_MANAGEMENT_LISTS.find((list) => list.title === COMPLIANCE_FRAMEWORKS_LIST_TITLE);
    const controlDef = RISK_MANAGEMENT_LISTS.find((list) => list.title === COMPLIANCE_CONTROLS_LIST_TITLE);
    if (!frameworkDef || !controlDef) {
      throw new Error('Compliance list definitions are missing.');
    }

    const frameworkList = await this.rest.getListByTitle(COMPLIANCE_FRAMEWORKS_LIST_TITLE);
    const controlList = await this.rest.getListByTitle(COMPLIANCE_CONTROLS_LIST_TITLE);
    if (!frameworkList || !controlList) {
      throw new Error('Compliance lists are not ready.');
    }

    let seeded = 0;
    for (const framework of COMPLIANCE_BUILT_IN_FRAMEWORKS) {
      if (existingCodes.has(framework.code)) {
        continue;
      }

      const frameworkId = await this.rest.addListItemResolved(
        COMPLIANCE_FRAMEWORKS_LIST_TITLE,
        frameworkList.Id,
        {
          Title: framework.name,
          Code: framework.code,
          Version: framework.version,
          FrameworkDescription: framework.description,
          IsBuiltIn: true,
          IsActive: true
        },
        frameworkDef.fields
      );

      const batchSize = ComplianceService.CONTROL_CREATE_BATCH;
      for (let index = 0; index < framework.controls.length; index += batchSize) {
        const batch = framework.controls.slice(index, index + batchSize);
        await Promise.all(
          batch.map((control) =>
            this.rest.addListItemResolved(
              COMPLIANCE_CONTROLS_LIST_TITLE,
              controlList.Id,
              {
                Title: control.title,
                ControlCode: control.controlCode,
                FrameworkId: frameworkId,
                Category: control.category,
                SortOrder: String(control.sortOrder)
              },
              controlDef.fields
            )
          )
        );
      }

      seeded += 1;
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }

    if (seeded > 0) {
      await this.audit.write({
        entity: 'ComplianceFrameworks',
        action: 'CREATE',
        details: { seededFrameworkCount: seeded }
      });
    }

    return seeded;
  }

  /** Sample assessments for the compliance dashboard; skipped when seed titles already exist. */
  public async seedSampleAssessments(): Promise<number> {
    await this.ensureListsReady();

    const assessmentDef = RISK_MANAGEMENT_LISTS.find((list) => list.title === COMPLIANCE_ASSESSMENTS_LIST_TITLE);
    const itemDef = RISK_MANAGEMENT_LISTS.find((list) => list.title === COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE);
    if (!assessmentDef || !itemDef) {
      return 0;
    }

    const [frameworkItems, existingAssessments] = await Promise.all([
      this.rest.getAllItems<IFrameworkListItem>(
        COMPLIANCE_FRAMEWORKS_LIST_TITLE,
        'Id,Code,IsActive'
      ),
      this.rest.getAllItems<IAssessmentListItem>(COMPLIANCE_ASSESSMENTS_LIST_TITLE, 'Id,Title')
    ]);

    const frameworkByCode = new Map(
      frameworkItems
        .filter((framework) => framework.IsActive !== false)
        .map((framework) => [framework.Code || '', framework.Id])
    );
    const existingTitles = new Set(existingAssessments.map((assessment) => assessment.Title));

    let seeded = 0;
    for (const seed of COMPLIANCE_ASSESSMENT_SEED_DATA) {
      if (existingTitles.has(seed.name)) {
        continue;
      }

      const frameworkId = frameworkByCode.get(seed.frameworkCode);
      if (!frameworkId) {
        continue;
      }

      await this.createAssessmentInternal(seed.name, frameworkId, seed.dueDate, {
        seedItemProfile: seed.itemProfile,
        assessmentStatus: seed.status,
        completedDate: seed.completedDate
      });

      existingTitles.add(seed.name);
      seeded += 1;
    }

    if (seeded > 0) {
      this.invalidateDashboardCache();
      await this.audit.write({
        entity: 'ComplianceAssessments',
        action: 'CREATE',
        details: { seededAssessmentCount: seeded }
      });
    }

    return seeded;
  }

  /** Ensures compliance lists exist and kicks off background sample seeding (non-blocking). */
  public async ensureComplianceReady(): Promise<void> {
    await this.ensureListsReady();
    this.startComplianceSeed();
  }

  /** Wait for background framework/assessment seeding — use before user-initiated creates. */
  public async waitForComplianceSeed(): Promise<void> {
    this.startComplianceSeed();
    if (this.complianceSeedPromise) {
      await this.complianceSeedPromise;
    }
  }

  private async ensureComplianceReadyForWrite(): Promise<void> {
    await this.ensureListsReady();
    await this.waitForComplianceSeed();
  }

  private startComplianceSeed(): void {
    if (!this.complianceSeedPromise) {
      this.complianceSeedPromise = this.runComplianceSeed().catch((error) => {
        this.complianceSeedPromise = undefined;
        throw error;
      });
    }
  }

  private async runComplianceSeed(): Promise<void> {
    if (await this.hasComplianceSampleData()) {
      await this.seedRiskControlLinksSafe();
      return;
    }
    await this.seedBuiltInFrameworks();
    await this.seedSampleAssessments();
    await this.seedRiskControlLinksSafe();
  }

  /** Best-effort risk ↔ control link seeding; never blocks compliance seeding. */
  private async seedRiskControlLinksSafe(): Promise<void> {
    try {
      await this.getRiskControlLinkService().seedSampleLinks();
    } catch {
      // Links depend on both risks and controls; skip quietly if either is unavailable.
    }
  }

  private async hasComplianceSampleData(): Promise<boolean> {
    const existingAssessments = await this.rest.getAllItems<IAssessmentListItem>(
      COMPLIANCE_ASSESSMENTS_LIST_TITLE,
      'Id,Title'
    );
    const titles = new Set(existingAssessments.map((assessment) => assessment.Title));
    return COMPLIANCE_ASSESSMENT_SEED_DATA.every((seed) => titles.has(seed.name));
  }

  private async ensureListsReady(): Promise<void> {
    if (!this.listsReadyPromise) {
      this.listsReadyPromise = this.resolveComplianceListsReady().catch((error) => {
        this.listsReadyPromise = undefined;
        throw error;
      });
    }
    await this.listsReadyPromise;
  }

  private async resolveComplianceListsReady(): Promise<void> {
    const titles = [
      COMPLIANCE_FRAMEWORKS_LIST_TITLE,
      COMPLIANCE_CONTROLS_LIST_TITLE,
      COMPLIANCE_ASSESSMENTS_LIST_TITLE,
      COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE,
      RISK_CONTROL_LINKS_LIST_TITLE
    ];
    const lists = await Promise.all(titles.map((title) => this.rest.getListByTitle(title)));
    if (lists.every(Boolean)) {
      return;
    }
    await this.provisioning.ensureListFieldsReadyOrdered(titles);
  }

  private mapFramework(item: IFrameworkListItem, controlCount: number): IComplianceFramework {
    return {
      id: item.Id,
      name: item.Title,
      code: item.Code || '',
      version: item.Version || '',
      description: item.FrameworkDescription || '',
      isBuiltIn: item.IsBuiltIn === true,
      isActive: item.IsActive !== false,
      controlCount
    };
  }

  private invalidateDashboardCache(): void {
    this.dashboardCache = undefined;
  }

  private getCachedDashboardData():
    | { frameworks: IComplianceFramework[]; assessments: IComplianceAssessment[] }
    | undefined {
    if (
      this.dashboardCache &&
      Date.now() - this.dashboardCache.loadedAt < ComplianceService.DASHBOARD_CACHE_MS
    ) {
      return {
        frameworks: this.dashboardCache.frameworks,
        assessments: this.dashboardCache.assessments
      };
    }

    return undefined;
  }

  private async fetchFrameworkRecord(frameworkId: number): Promise<IFrameworkListItem | undefined> {
    const frameworks = await this.rest.getAllItems<IFrameworkListItem>(
      COMPLIANCE_FRAMEWORKS_LIST_TITLE,
      'Id,Title,Code,IsActive',
      undefined,
      `Id eq ${frameworkId}`
    );
    return frameworks[0];
  }

  private async fetchFrameworkControls(frameworkId: number): Promise<IComplianceControl[]> {
    const controls = await this.rest.getAllItems<IControlListItem>(
      COMPLIANCE_CONTROLS_LIST_TITLE,
      'Id,Title,ControlCode,Category,SortOrder,ControlDescription,Framework/Id',
      'Framework',
      `Framework/Id eq ${frameworkId}`,
      'SortOrder asc,Title asc'
    );

    return controls
      .map((control) => this.mapControl(control))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.controlCode.localeCompare(b.controlCode));
  }

  private normalizeFrameworkCode(code: string): string {
    return code
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-_]/g, '');
  }

  private validateCustomFrameworkInput(input: ICustomFrameworkInput): void {
    if (!input.name.trim()) {
      throw new Error('Framework name is required.');
    }
    if (!input.code.trim()) {
      throw new Error('Framework code is required.');
    }

    const controls = input.controls.filter(
      (control) => control.controlCode.trim() || control.title.trim()
    );
    if (controls.length === 0) {
      throw new Error('Add at least one control.');
    }

    controls.forEach((control, index) => {
      if (!control.controlCode.trim() || !control.title.trim()) {
        throw new Error(`Control ${index + 1} requires both code and title.`);
      }
    });
  }

  private async assertFrameworkCodeAvailable(code: string, excludeFrameworkId?: number): Promise<void> {
    const frameworks = await this.rest.getAllItems<IFrameworkListItem>(
      COMPLIANCE_FRAMEWORKS_LIST_TITLE,
      'Id,Code'
    );
    const duplicate = frameworks.find(
      (framework) =>
        (framework.Code || '').toUpperCase() === code &&
        framework.Id !== excludeFrameworkId
    );
    if (duplicate) {
      throw new Error(`Framework code "${code}" is already in use.`);
    }
  }

  private async assertCustomFramework(frameworkId: number): Promise<IFrameworkListItem> {
    const framework = await this.rest.getListItemById<IFrameworkListItem>(
      COMPLIANCE_FRAMEWORKS_LIST_TITLE,
      frameworkId,
      'Id,Title,Code,IsBuiltIn'
    );
    if (!framework) {
      throw new Error('Framework not found.');
    }
    if (framework.IsBuiltIn) {
      throw new Error('Built-in frameworks cannot be modified.');
    }
    return framework;
  }

  private async deleteFrameworkControls(frameworkId: number): Promise<void> {
    const controls = await this.rest.getAllItems<IControlListItem>(
      COMPLIANCE_CONTROLS_LIST_TITLE,
      'Id,Framework/Id',
      'Framework',
      `Framework/Id eq ${frameworkId}`
    );
    for (let index = 0; index < controls.length; index++) {
      await this.rest.deleteItem(COMPLIANCE_CONTROLS_LIST_TITLE, controls[index].Id);
    }
  }

  private async replaceFrameworkControls(
    frameworkId: number,
    controls: ICustomFrameworkInput['controls'],
    controlListId: string,
    controlFields: NonNullable<(typeof RISK_MANAGEMENT_LISTS)[number]['fields']>
  ): Promise<void> {
    const activeControls = controls.filter(
      (control) => control.controlCode.trim() && control.title.trim()
    );

    for (let index = 0; index < activeControls.length; index++) {
      const control = activeControls[index];
      await this.rest.addListItemResolved(
        COMPLIANCE_CONTROLS_LIST_TITLE,
        controlListId,
        {
          Title: control.title.trim(),
          ControlCode: control.controlCode.trim(),
          FrameworkId: frameworkId,
          Category: control.category?.trim() || '',
          SortOrder: String(index + 1),
          ControlDescription: control.description?.trim() || ''
        },
        controlFields
      );
    }
  }

  private mapControl(item: IControlListItem): IComplianceControl {
    return {
      id: item.Id,
      frameworkId: item.Framework?.Id || 0,
      controlCode: item.ControlCode || '',
      title: item.Title,
      description: item.ControlDescription,
      category: item.Category || '',
      sortOrder: Number(item.SortOrder || 0)
    };
  }
}
