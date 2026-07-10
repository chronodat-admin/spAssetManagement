import { SPHttpClient } from '@microsoft/sp-http';

import {
  COMPLIANCE_CONTROLS_LIST_TITLE,
  COMPLIANCE_FRAMEWORKS_LIST_TITLE,
  RISK_CONTROL_LINKS_LIST_TITLE,
  RISK_MANAGEMENT_LISTS
} from '../models/IListDefinitions';
import {
  DEFAULT_RISK_CONTROL_LINK_TYPE,
  IRiskControlLink,
  IRiskControlLinkInput,
  IRiskLinkOption,
  RiskControlLinkType
} from '../models/IRiskControlLink';
import { RISK_CONTROL_LINK_SEED_DATA } from '../constants/riskControlLinkSeedData';
import { SharePointFieldValue } from '../utils/sharePointFieldPayload';
import { AuditService } from './AuditService';
import { ListProvisioningService } from './ListProvisioningService';
import { SharePointRestService } from './SharePointRestService';

interface IRiskControlLinkListItem {
  Id: number;
  LinkType?: string;
  Rationale?: string;
  RiskRef?: string;
  ControlCode?: string;
  FrameworkCode?: string;
  RiskLink?: { Id: number; Title?: string };
  Control?: { Id: number; Title?: string };
}

interface IRiskListItem {
  Id: number;
  Title: string;
  RiskID?: string;
  Riskstatus?: string;
}

interface IControlLookupItem {
  Id: number;
  Title: string;
  ControlCode?: string;
  Framework?: { Id: number; Title?: string };
}

const LINK_SELECT =
  'Id,LinkType,Rationale,RiskRef,ControlCode,FrameworkCode,RiskLink/Id,RiskLink/Title,Control/Id,Control/Title';
const LINK_EXPAND = 'RiskLink,Control';

export class RiskControlLinkService {
  private readonly rest: SharePointRestService;
  private readonly provisioning: ListProvisioningService;
  private readonly audit: AuditService;
  private listReadyPromise?: Promise<void>;
  private seedPromise?: Promise<number>;

  constructor(spHttpClient: SPHttpClient, webUrl: string) {
    this.rest = new SharePointRestService(spHttpClient, webUrl);
    this.provisioning = new ListProvisioningService(spHttpClient, webUrl);
    this.audit = new AuditService(this.rest, () => this.rest.getCurrentUser(), spHttpClient, webUrl);
  }

  /** Ensure the junction list (and its lookup targets) exist before reads/writes. */
  public async ensureListReady(): Promise<void> {
    if (!this.listReadyPromise) {
      this.listReadyPromise = this.resolveListReady().catch((error) => {
        this.listReadyPromise = undefined;
        throw error;
      });
    }
    await this.listReadyPromise;
  }

  private async resolveListReady(): Promise<void> {
    const existing = await this.rest.getListByTitle(RISK_CONTROL_LINKS_LIST_TITLE);
    if (existing) {
      return;
    }
    // The risk lookup target (Risks) and control lookup target must exist first.
    await this.provisioning.ensureListFieldsReadyOrdered([
      COMPLIANCE_FRAMEWORKS_LIST_TITLE,
      COMPLIANCE_CONTROLS_LIST_TITLE,
      RISK_CONTROL_LINKS_LIST_TITLE
    ]);
  }

  public async getAllLinks(): Promise<IRiskControlLink[]> {
    await this.ensureListReady();
    const items = await this.rest.getAllItems<IRiskControlLinkListItem>(
      RISK_CONTROL_LINKS_LIST_TITLE,
      LINK_SELECT,
      LINK_EXPAND
    );
    return items.map((item) => this.mapLink(item));
  }

  public async getLinksForRisk(riskId: number): Promise<IRiskControlLink[]> {
    await this.ensureListReady();
    const items = await this.rest.getAllItems<IRiskControlLinkListItem>(
      RISK_CONTROL_LINKS_LIST_TITLE,
      LINK_SELECT,
      LINK_EXPAND,
      `RiskLink/Id eq ${riskId}`
    );
    return items.map((item) => this.mapLink(item));
  }

  public async getLinksForControl(controlId: number): Promise<IRiskControlLink[]> {
    await this.ensureListReady();
    const items = await this.rest.getAllItems<IRiskControlLinkListItem>(
      RISK_CONTROL_LINKS_LIST_TITLE,
      LINK_SELECT,
      LINK_EXPAND,
      `Control/Id eq ${controlId}`
    );
    return items.map((item) => this.mapLink(item));
  }

  public async getLinksForFramework(frameworkCode: string): Promise<IRiskControlLink[]> {
    await this.ensureListReady();
    const safeCode = frameworkCode.replace(/'/g, "''");
    const items = await this.rest.getAllItems<IRiskControlLinkListItem>(
      RISK_CONTROL_LINKS_LIST_TITLE,
      LINK_SELECT,
      LINK_EXPAND,
      `FrameworkCode eq '${safeCode}'`
    );
    return items.map((item) => this.mapLink(item));
  }

  /** Risk register options (Id + Risk ID + Title) used by link pickers. */
  public async getRiskLinkOptions(): Promise<IRiskLinkOption[]> {
    const risks = await this.rest.getAllItems<IRiskListItem>(
      'Risks',
      'Id,Title,RiskID,Riskstatus',
      undefined,
      undefined,
      'Title asc'
    );
    return risks.map((risk) => ({
      id: risk.Id,
      riskRef: risk.RiskID || '',
      title: risk.Title,
      status: risk.Riskstatus
    }));
  }

  public async linkExists(riskId: number, controlId: number): Promise<boolean> {
    await this.ensureListReady();
    return this.rest.itemExistsByFilter(
      RISK_CONTROL_LINKS_LIST_TITLE,
      `RiskLink/Id eq ${riskId} and Control/Id eq ${controlId}`
    );
  }

  public async createLink(input: IRiskControlLinkInput): Promise<number> {
    await this.ensureListReady();

    if (await this.linkExists(input.riskId, input.controlId)) {
      throw new Error('This asset is already linked to that control.');
    }

    const [risk, control] = await Promise.all([
      this.fetchRisk(input.riskId),
      this.fetchControl(input.controlId)
    ]);

    if (!risk) {
      throw new Error('Asset not found.');
    }
    if (!control) {
      throw new Error('Control not found.');
    }

    const linkId = await this.addLink(risk, control, input.linkType, input.rationale);

    await this.audit.write({
      entity: 'RiskControlLinks',
      action: 'CREATE',
      entityId: String(linkId),
      details: {
        risk: risk.RiskID || risk.Title,
        control: control.ControlCode || control.Title,
        framework: control.Framework?.Title || '',
        linkType: input.linkType
      }
    });

    return linkId;
  }

  public async deleteLink(id: number): Promise<void> {
    await this.ensureListReady();
    await this.rest.deleteItem(RISK_CONTROL_LINKS_LIST_TITLE, id);
    await this.audit.write({
      entity: 'RiskControlLinks',
      action: 'DELETE',
      entityId: String(id)
    });
  }

  /** Seed sample links once (idempotent). Requires risks + built-in controls to exist. */
  public async seedSampleLinks(): Promise<number> {
    if (!this.seedPromise) {
      this.seedPromise = this.runSeedSampleLinks().catch((error) => {
        this.seedPromise = undefined;
        throw error;
      });
    }
    return this.seedPromise;
  }

  private async runSeedSampleLinks(): Promise<number> {
    await this.ensureListReady();

    const [risks, controls, existing] = await Promise.all([
      this.rest.getAllItems<IRiskListItem>('Risks', 'Id,Title,RiskID'),
      this.rest.getAllItems<IControlLookupItem>(
        COMPLIANCE_CONTROLS_LIST_TITLE,
        'Id,Title,ControlCode,Framework/Id,Framework/Title',
        'Framework'
      ),
      this.rest.getAllItems<IRiskControlLinkListItem>(
        RISK_CONTROL_LINKS_LIST_TITLE,
        'Id,RiskLink/Id,Control/Id',
        'RiskLink,Control'
      )
    ]);

    if (risks.length === 0 || controls.length === 0) {
      return 0;
    }

    const riskByTitle = new Map<string, IRiskListItem>();
    risks.forEach((risk) => riskByTitle.set(risk.Title.trim().toLowerCase(), risk));

    const frameworkCodeByControl = await this.buildFrameworkCodeMap(controls);
    const controlByKey = new Map<string, IControlLookupItem>();
    controls.forEach((control) => {
      const frameworkCode = frameworkCodeByControl.get(control.Framework?.Id || 0);
      if (!frameworkCode || !control.ControlCode) {
        return;
      }
      controlByKey.set(this.controlKey(frameworkCode, control.ControlCode), control);
    });

    const existingPairs = new Set(
      existing
        .filter((link) => link.RiskLink?.Id && link.Control?.Id)
        .map((link) => `${link.RiskLink!.Id}:${link.Control!.Id}`)
    );

    let seeded = 0;
    for (const seed of RISK_CONTROL_LINK_SEED_DATA) {
      const risk = riskByTitle.get(seed.riskTitle.trim().toLowerCase());
      const control = controlByKey.get(this.controlKey(seed.frameworkCode, seed.controlCode));
      if (!risk || !control) {
        continue;
      }
      if (existingPairs.has(`${risk.Id}:${control.Id}`)) {
        continue;
      }

      await this.addLink(risk, control, seed.linkType, seed.rationale);
      existingPairs.add(`${risk.Id}:${control.Id}`);
      seeded += 1;
    }

    if (seeded > 0) {
      await this.audit.write({
        entity: 'RiskControlLinks',
        action: 'CREATE',
        details: { seededLinkCount: seeded }
      });
    }

    return seeded;
  }

  private async buildFrameworkCodeMap(
    controls: IControlLookupItem[]
  ): Promise<Map<number, string>> {
    const frameworkIds = Array.from(
      new Set(controls.map((control) => control.Framework?.Id).filter((id): id is number => !!id))
    );
    const result = new Map<number, string>();
    if (frameworkIds.length === 0) {
      return result;
    }

    const frameworks = await this.rest.getAllItems<{ Id: number; Code?: string }>(
      COMPLIANCE_FRAMEWORKS_LIST_TITLE,
      'Id,Code'
    );
    frameworks.forEach((framework) => {
      if (framework.Code) {
        result.set(framework.Id, framework.Code);
      }
    });
    return result;
  }

  private controlKey(frameworkCode: string, controlCode: string): string {
    return `${frameworkCode.trim().toLowerCase()}::${controlCode.trim().toLowerCase()}`;
  }

  private async fetchRisk(riskId: number): Promise<IRiskListItem | undefined> {
    return this.rest.getListItemById<IRiskListItem>('Risks', riskId, 'Id,Title,RiskID,Riskstatus');
  }

  private async fetchControl(controlId: number): Promise<IControlLookupItem | undefined> {
    return this.rest.getListItemById<IControlLookupItem>(
      COMPLIANCE_CONTROLS_LIST_TITLE,
      controlId,
      'Id,Title,ControlCode,Framework/Id,Framework/Title',
      'Framework'
    );
  }

  private async addLink(
    risk: IRiskListItem,
    control: IControlLookupItem,
    linkType: RiskControlLinkType,
    rationale?: string
  ): Promise<number> {
    const def = RISK_MANAGEMENT_LISTS.find((list) => list.title === RISK_CONTROL_LINKS_LIST_TITLE);
    const list = await this.rest.getListByTitle(RISK_CONTROL_LINKS_LIST_TITLE);
    if (!def || !list) {
      throw new Error('Asset-control link list is not ready.');
    }

    const frameworkCode = await this.resolveFrameworkCode(control);
    const riskRef = risk.RiskID || '';
    const controlCode = control.ControlCode || '';
    const title = `${riskRef || risk.Title} - ${controlCode || control.Title}`.slice(0, 255);

    const payload: Record<string, SharePointFieldValue> = {
      Title: title,
      RiskLinkId: risk.Id,
      ControlId: control.Id,
      LinkType: linkType || DEFAULT_RISK_CONTROL_LINK_TYPE,
      Rationale: rationale || '',
      RiskRef: riskRef,
      ControlCode: controlCode,
      FrameworkCode: frameworkCode
    };

    return this.rest.addListItemResolved(RISK_CONTROL_LINKS_LIST_TITLE, list.Id, payload, def.fields);
  }

  private async resolveFrameworkCode(control: IControlLookupItem): Promise<string> {
    const frameworkId = control.Framework?.Id;
    if (!frameworkId) {
      return '';
    }
    const frameworks = await this.rest.getAllItems<{ Id: number; Code?: string }>(
      COMPLIANCE_FRAMEWORKS_LIST_TITLE,
      'Id,Code',
      undefined,
      `Id eq ${frameworkId}`
    );
    return frameworks[0]?.Code || '';
  }

  private mapLink(item: IRiskControlLinkListItem): IRiskControlLink {
    return {
      id: item.Id,
      riskId: item.RiskLink?.Id || 0,
      riskRef: item.RiskRef || '',
      riskTitle: item.RiskLink?.Title || '',
      controlId: item.Control?.Id || 0,
      controlCode: item.ControlCode || '',
      controlTitle: item.Control?.Title || '',
      frameworkCode: item.FrameworkCode || '',
      linkType: (item.LinkType as RiskControlLinkType) || DEFAULT_RISK_CONTROL_LINK_TYPE,
      rationale: item.Rationale || undefined
    };
  }
}
