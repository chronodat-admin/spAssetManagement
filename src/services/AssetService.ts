import { SPHttpClient } from '@microsoft/sp-http';

import { BUSINESS_LIST_TITLE, CATEGORIES_LIST_TITLE, ASSET_TYPES_LIST_TITLE, ASSET_STATUSES_LIST_TITLE, VENDORS_LIST_TITLE, LOCATIONS_LIST_TITLE, FORM_TEMPLATES_LIST_TITLE, LEGACY_BUSINESS_LIST_TITLE, PROJECTS_LIST_TITLE, SUB_CATEGORIES_LIST_TITLE, ADMINISTRATORS_LIST_TITLE, SETTINGS_LIST_TITLE } from '../models/IListDefinitions';
import {
  BUSINESS_ITEM_EXPAND,
  BUSINESS_ITEM_SELECT,
  BUSINESS_LIST_VIEW_EXPAND,
  BUSINESS_LIST_VIEW_SELECT,
  BUSINESS_SUMMARY_SELECT,
  PROJECT_ITEM_EXPAND,
  PROJECT_ITEM_SELECT,
  PROJECT_LIST_VIEW_EXPAND,
  PROJECT_LIST_VIEW_SELECT,
  PROJECT_SUMMARY_SELECT
} from '../constants/businessProjectFields';
import {
  RISK_LOOKUP_LOAD_FIELDS,
  RISK_SCALAR_LOAD_FIELDS,
  RISK_SYSTEM_USER_LOAD_FIELDS,
  RISK_USER_LOAD_FIELDS
} from '../constants/assetLoadFields';

import { IAppSettings, IAppAdministrator, ILookupItem, IAsset, IUserValue, AssetStatus } from '../models/IAsset';
import type { INotificationDeliveryOptions } from '../models/INotificationDelivery';

import {
  parseTemplateFields,
  parseTemplateTabs,
  AssetFormTemplate,
  AssetFormTemplateInput
} from '../lib/form-templates/types';

import { DEFAULT_FORM_TEMPLATES } from '../lib/form-templates/defaults';

import type { BuiltFormConfig, FormSettings } from '../lib/form-config/types';
import { getAssetDropdownOptionsForField } from '../utils/assetDropdownFields';
import type { IAssetVersionHistoryEntry } from '../models/IAssetVersionHistory';
import { buildRiskVersionFieldOrder, diffRiskVersionAllFields } from '../utils/assetVersionHistory';

import {
  buildRiskItemPayload,
  SharePointFieldValue,
  toDateOnlyFieldValue,
  toUserMultiFieldValue
} from '../utils/sharePointFieldPayload';

import { ListProvisioningService } from './ListProvisioningService';
import { NotificationService } from './NotificationService';
import { SharePointRestService } from './SharePointRestService';
import { AuditService } from './AuditService';
import { computeAuditChanges } from '../utils/auditLogUtils';
import type { IAuditLogFilters, IAuditLogStats, IWriteAuditInput } from '../models/IAuditLog';
import type { ISiteOwnerAccessResult, IAppAdministratorAccessResult } from '../utils/sitePermissions';
import { APP_ADMINISTRATOR_REQUIRED_MESSAGE } from '../utils/sitePermissions';
import { ISharePointFormField, SharePointFormValues } from '../models/ISharePointFormField';
import { IPersonPickerItem, IPersonPickerSuggestion } from '../models/IPersonPickerItem';
import type { IAssetAttachmentSyncInput, ISharePointAttachment } from '../models/ISharePointAttachment';
import {
  buildAssetImageFileName,
  isAssetImageFileName,
  resolveAssetImageUrl
} from '../utils/assetImage';
import { permissionsFromEffectivePermissions, type IListPermissions } from '../utils/listPermissions';
import { getMatrixPriority as getMatrixPriorityUtil } from '../utils/priorityCalculator';
import { parseWorkflowSettings, serializeWorkflowSettings } from '../lib/workflow-settings/storage';
import { allocateEntityCodeWithAutoEnable, allocateEntityNumber } from '../lib/workflow-settings/numberingEngine';
import { applyTitleFromFormValues, buildListFormPayload } from '../lib/list-form/buildFormPayload';
import type { IWorkflowSettings, NumberingEntityType } from '../models/IWorkflowSettings';
import { getRiskStatusOptionNames } from '../lib/workflow-settings/utils';
import {
  SAMPLE_TAG_SEED_DATA,
  SAMPLE_TAG_SEED_IDS,
  SAMPLE_TAG_SEED_NAMES
} from '../constants/sampleTagSeedData';
import {
  buildChoiceFieldFilter,
  buildLookupIdFilter,
  getLookupChoiceReferenceDefinitions,
  getLookupReferenceDefinitions,
  type ILookupDeleteReference
} from '../utils/lookupDeleteReferences';

/** Maps a SharePoint expanded user value (with `EMail`) to the app `IUserValue` (with `Email`). */
function toUserValue(
  raw?: { Id: number; Title: string; EMail?: string }
): IUserValue | undefined {
  if (!raw) {
    return undefined;
  }
  return { Id: raw.Id, Title: raw.Title, Email: raw.EMail };
}

const RISK_PAYLOAD_FIELD_MAP = [
  { payloadKey: 'AM_Notes', internalName: 'AM_Notes', displayName: 'Description' },
  { payloadKey: 'AM_Status', internalName: 'AM_Status', displayName: 'Asset Status' },
  { payloadKey: 'MitigationPlan', internalName: 'MitigationPlan', displayName: 'Describe' },
  { payloadKey: 'Causes', internalName: 'Causes', displayName: 'Causes' },
  { payloadKey: 'AM_Notes', internalName: 'AM_Notes', displayName: 'Consequences' },
  { payloadKey: 'ExistingControls', internalName: 'ExistingControls', displayName: 'ExistingControls' },
  { payloadKey: 'ProjectName', internalName: 'ProjectName', displayName: 'Project Name' },
  { payloadKey: 'potentialcost', internalName: 'potentialcost', displayName: 'Potential Cost' },
  {
    payloadKey: 'Assesstheeffectivenessofcontrols',
    internalName: 'Assesstheeffectivenessofcontrols',
    displayName: 'Assess the effectiveness of controls'
  },
  { payloadKey: 'Likelihood', internalName: 'Likelihood', displayName: 'Potential Likelihood' },
  { payloadKey: 'Consequence', internalName: 'Consequence', displayName: 'Potential Impact' },
  { payloadKey: 'AM_WarrantyExpiry', internalName: 'AM_WarrantyExpiry', displayName: 'Date action to be completed' },
  { payloadKey: 'DateRiskIdentified', internalName: 'DateRiskIdentified', displayName: 'Purchase Date' },
  {
    payloadKey: 'Implementationreviewdate',
    internalName: 'Implementationreviewdate',
    displayName: 'Implementation Review Date'
  }
] as const;

const RISK_LOOKUP_FIELD_MAP = [
  { payloadKey: 'AM_CategoryId', internalName: 'AM_Category', displayName: 'Asset Category' },
  { payloadKey: 'AM_SubCategoryId', internalName: 'AM_SubCategory', displayName: 'Asset Sub-Category' },
  { payloadKey: 'AM_CategoryId', internalName: 'AM_Category', displayName: 'Business' },
  { payloadKey: 'AM_ProjectId', internalName: 'AM_Project', displayName: 'Project' },
  { payloadKey: 'AM_AssetTypeId', internalName: 'AM_AssetType', displayName: 'Asset Type' },
  { payloadKey: 'AM_VendorId', internalName: 'AM_Vendor', displayName: 'Vendor' },
  { payloadKey: 'AM_LocationId', internalName: 'AM_Location', displayName: 'Location' },
  { payloadKey: 'AssignedToId', internalName: 'AssignedTo', displayName: 'Assigned To' }
] as const;



export interface IAssetSaveInput {

  Title: string;

  AM_AssetId?: string;

  AM_Notes?: string;

  AM_Status?: AssetStatus;

  AM_CategoryId?: number;

  AM_SubCategoryId?: number | null;

  AM_ProjectId?: number | null;

  AM_AssetTypeId?: number;

  AM_VendorId?: number | null;

  AM_LocationId?: number | null;

  AM_SerialNumber?: string;

  Likelihood?: string;

  Consequence?: string;

  PotentialLikelihood?: string;

  PotentialConsequence?: string;

  MitigationPlan?: string;

  Causes?: string;

  ExistingControls?: string;

  /** @deprecated Legacy text field */
  ProjectName?: string;

  potentialcost?: string;

  Assesstheeffectivenessofcontrols?: string;

  AM_WarrantyExpiry?: string;

  DateRiskIdentified?: string;

  Implementationreviewdate?: string;

  AssignedToUserIds?: number[];

}



interface ISharePointAssetItem {

  Id: number;

  Title: string;

  AM_Notes?: string;

  AM_Status?: AssetStatus | { Id: number; Title: string };

  AM_StatusId?: number;

  AM_AssetId?: string;

  AM_SerialNumber?: string;

  AM_WarrantyExpiry?: string;

  MitigationPlan?: string;

  Likelihood?: string;

  Consequence?: string;

  PotentialLikelihood?: string;

  PotentialConsequence?: string;

  potentialcost?: string;

  Assesstheeffectivenessofcontrols?: string;

  Implementationreviewdate?: string;

  DateRiskIdentified?: string;

  ProjectName?: string;

  AM_Project?: { Id: number; Title: string };

  Causes?: string;

  ExistingControls?: string;

  TemplateData?: string;

  Created?: string;

  Modified?: string;

  AM_Category?: { Id: number; Title: string };

  AM_SubCategory?: { Id: number; Title: string };

  AM_AssetType?: { Id: number; Title: string };

  AM_Vendor?: { Id: number; Title: string };

  AM_Location?: { Id: number; Title: string };

  AM_CategoryId?: number;

  AM_SubCategoryId?: number;

  AM_ProjectId?: number;

  AM_AssetTypeId?: number;

  AM_VendorId?: number;

  AM_LocationId?: number;

  AssignedTo?: { Id: number; Title: string; EMail?: string }[];

  AssignedToId?: number[] | number;

  AM_AssignedTo?: { Id: number; Title: string; EMail?: string };

  AM_AssignedToId?: number;

  AM_AssignedDate?: string;

  AM_Cost?: number;

  AM_PurchaseDate?: string;

  AM_PONumber?: string;

  AM_DepreciationMethod?: string;

  AM_UsefulLifeMonths?: number;

  AM_SalvageValue?: number;

  AM_ResidualValue?: number;

  AM_Barcode?: string;

  AM_ImageUrl?: string;

  AM_QRCodeData?: string;

  AM_IntuneDeviceId?: string;

  AM_Manufacturer?: string;

  AM_OS?: string;

  AM_OSVersion?: string;

  AM_CPU?: string;

  AM_TotalMemory?: string;

  AM_Storage?: string;

  AM_IMEI?: string;

  AM_MACAddress?: string;

  AM_IsDeleted?: boolean;

  AM_CustomJson?: string;

  AM_DeletedBy?: { Id: number; Title: string; EMail?: string };

  AM_DeletedById?: number;

  Author?: { Id: number; Title: string; EMail?: string };

  AuthorId?: number;

}



interface IAssetLookupMaps {
  AM_Category: Map<number, string>;
  AM_SubCategory: Map<number, string>;
  riskBusiness: Map<number, string>;
  AM_Project: Map<number, string>;
  AM_AssetType: Map<number, string>;
  AM_Vendor: Map<number, string>;
  AM_Location: Map<number, string>;
  AM_Status: Map<number, string>;
}

export interface IDataFetchOptions {
  /** Skip list field repair when provisioning is already complete. */
  skipFieldRepair?: boolean;
  /** Id + Title only — for lookup maps and dropdowns. */
  summary?: boolean;
  /** Columns shown in list managers — avoids loading large Note fields. */
  view?: boolean;
}

export interface IAssetLookupMapInput {
  categories: ILookupItem[];
  subCategories: ILookupItem[];
  businesses: ILookupItem[];
  projects: ILookupItem[];
  profiles: ILookupItem[];
  responses: ILookupItem[];
  strategies: ILookupItem[];
  statuses: ILookupItem[];
}



export class AssetService {

  private readonly rest: SharePointRestService;

  private readonly spHttpClient: SPHttpClient;

  private readonly webUrl: string;

  private readonly notifications: NotificationService;

  private readonly audit: AuditService;

  private readonly listPermissionsCache = new Map<string, IListPermissions>();

  private readonly dataCache = new Map<string, Promise<unknown>>();

  private appAdministratorCache: boolean | null = null;

  private getCached<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const existing = this.dataCache.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = loader().catch((error) => {
      this.dataCache.delete(key);
      throw error;
    });
    this.dataCache.set(key, promise);
    return promise;
  }

  public invalidateDataCache(keys?: string | string[]): void {
    if (!keys) {
      this.dataCache.clear();
      return;
    }

    const keyList = Array.isArray(keys) ? keys : [keys];
    keyList.forEach((key) => {
      if (key.endsWith('*')) {
        const prefix = key.slice(0, -1);
        [...this.dataCache.keys()].forEach((cacheKey) => {
          if (cacheKey.startsWith(prefix)) {
            this.dataCache.delete(cacheKey);
          }
        });
        return;
      }
      this.dataCache.delete(key);
    });
  }

  private invalidateAfterListMutation(listTitle: string): void {
    const title = listTitle.trim();
    if (
      title === BUSINESS_LIST_TITLE ||
      title === LEGACY_BUSINESS_LIST_TITLE ||
      title.toLowerCase() === 'business'
    ) {
      this.invalidateDataCache(['business:*', 'risks:*']);
      return;
    }
    if (title === PROJECTS_LIST_TITLE) {
      this.invalidateDataCache(['projects:*', 'risks:*']);
      return;
    }
    if (title === 'AM_Assets') {
      this.invalidateDataCache('risks:*');
      return;
    }
    if (title === SUB_CATEGORIES_LIST_TITLE) {
      this.invalidateDataCache(['subcategories:*', 'lookup:Categories:*', 'risks:*']);
      return;
    }
    this.invalidateDataCache([`lookup:${title}:*`, 'risks:*']);
  }

  public buildLookupMaps(input: IAssetLookupMapInput): IAssetLookupMaps {
    const toMap = (items: ILookupItem[]): Map<number, string> => {
      const map = new Map<number, string>();
      items.forEach((item) => map.set(item.Id, item.Title));
      return map;
    };

    return {
      AM_Category: toMap(input.categories),
      AM_SubCategory: toMap(input.subCategories),
      riskBusiness: toMap(input.businesses),
      AM_Project: toMap(input.projects),
      AM_AssetType: toMap(input.profiles),
      AM_Vendor: toMap(input.responses),
      AM_Location: toMap(input.strategies),
      AM_Status: toMap(input.statuses)
    };
  }

  constructor(
    spHttpClient: SPHttpClient,
    webUrl: string,
    deliveryOptions?: INotificationDeliveryOptions
  ) {

    this.spHttpClient = spHttpClient;

    this.webUrl = webUrl;

    this.rest = new SharePointRestService(spHttpClient, webUrl);

    this.notifications = new NotificationService(
      this.rest,
      webUrl,
      () => this.getAppSettings(),
      (likelihood, consequence) => this.getMatrixPriority(likelihood, consequence),
      deliveryOptions
    );

    this.audit = new AuditService(this.rest, () => this.getCurrentUser(), spHttpClient, webUrl);

  }

  public getAuditLogs(filters?: IAuditLogFilters) {
    return this.audit.getLogs(filters);
  }

  public getAuditLogStats(): Promise<IAuditLogStats> {
    return this.audit.getStats();
  }

  public ensureAuditLogReady(): Promise<void> {
    return this.audit.ensureAuditLogReady();
  }

  private async logAudit(input: IWriteAuditInput): Promise<void> {
    await this.audit.write(input);
  }

  private auditEntityForList(listTitle: string): string {
    return this.audit.resolveEntityFromListTitle(listTitle);
  }



  public async getCurrentUser(): Promise<{
    Id: number;
    Title: string;
    Email: string;
    LoginName: string;
    IsSiteAdmin: boolean;
  }> {
    return this.rest.getCurrentUser();
  }

  public async getSiteOwnerAccess(): Promise<ISiteOwnerAccessResult> {
    const access = await this.rest.isCurrentUserSiteOwner();
    return {
      isSiteOwner: access.isSiteOwner,
      isSiteAdmin: access.isSiteAdmin,
      isOwnerGroupMember: access.isOwnerGroupMember,
      hasFullControl: access.hasFullControl,
      ownerGroupTitle: access.ownerGroupTitle,
      elevatedToOwner: false,
      message: access.message
    };
  }

  public async requireSiteSetupAccess(): Promise<ISiteOwnerAccessResult> {
    return this.getSiteOwnerAccess();
  }

  public async getAppAdministrators(): Promise<IAppAdministrator[]> {
    return this.getCached('appAdministrators', () => this.loadAppAdministratorsFromList());
  }

  private async loadAppAdministratorsFromList(): Promise<IAppAdministrator[]> {
    try {
      const list = await this.rest.getListByTitle(ADMINISTRATORS_LIST_TITLE);
      if (!list) {
        return [];
      }

      const items = await this.rest.getAllItems<{
        Id: number;
        Title: string;
        AM_User?: { Id: number; Title: string; EMail?: string };
      }>(
        ADMINISTRATORS_LIST_TITLE,
        'Id,Title,AM_User/Id,AM_User/Title,AM_User/EMail',
        'AM_User',
        undefined,
        'Id asc'
      );

      const administrators = items.map((item) => ({
        Id: item.Id,
        Title: item.Title,
        AM_User: toUserValue(item.AM_User)
      }));

      return this.deduplicateAppAdministrators(administrators);
    } catch {
      return [];
    }
  }

  private deduplicateAppAdministrators(administrators: IAppAdministrator[]): IAppAdministrator[] {
    const seen = new Set<string>();

    return administrators.filter((administrator) => {
      const userId = administrator.AM_User?.Id ?? administrator.UserName1?.Id;
      const email = (administrator.AM_User?.Email ?? administrator.UserName1?.Email)
        ?.trim()
        .toLowerCase();
      const key = userId ? `id:${userId}` : email ? `email:${email}` : `title:${administrator.Title.trim().toLowerCase()}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  private async isAppAdministratorPerson(person: IPersonPickerItem): Promise<boolean> {
    const existsByUserId = await this.rest.itemExistsByFilter(
      ADMINISTRATORS_LIST_TITLE,
      `AM_UserId eq ${person.id}`
    );
    if (existsByUserId) {
      return true;
    }

    const normalizedEmail = person.email?.trim().toLowerCase();
    if (!normalizedEmail) {
      return false;
    }

    this.invalidateDataCache('appAdministrators');
    const administrators = await this.loadAppAdministratorsFromList();
    return administrators.some(
      (administrator) =>
        (administrator.AM_User?.Email ?? administrator.UserName1?.Email)
          ?.trim()
          .toLowerCase() === normalizedEmail
    );
  }

  public async isCurrentUserAppAdministrator(): Promise<boolean> {
    if (this.appAdministratorCache !== null) {
      return this.appAdministratorCache;
    }

    try {
      const [user, administrators] = await Promise.all([
        this.getCurrentUser(),
        this.getAppAdministrators()
      ]);
      const isAppAdministrator = administrators.some(
        (administrator) =>
          administrator.AM_User?.Id === user.Id || administrator.UserName1?.Id === user.Id
      );
      this.appAdministratorCache = isAppAdministrator;
      return isAppAdministrator;
    } catch {
      return false;
    }
  }

  public async getAppAdministratorAccess(): Promise<IAppAdministratorAccessResult> {
    const isAppAdministrator = await this.isCurrentUserAppAdministrator();
    return {
      isAppAdministrator,
      message: isAppAdministrator ? undefined : APP_ADMINISTRATOR_REQUIRED_MESSAGE
    };
  }

  /**
   * Ensures the current user is listed in Administrators. Used when running setup or adding the web part.
   * Idempotent — no-op when the user is already an app administrator.
   */
  public async ensureCurrentUserIsAppAdministrator(): Promise<boolean> {
    try {
      const list = await this.rest.getListByTitle(ADMINISTRATORS_LIST_TITLE);
      if (!list) {
        return false;
      }

      const missing = await this.rest.listMissingFields(list.Id, ['AM_User']);
      if (missing.length > 0) {
        return false;
      }

      const user = await this.getCurrentUser();
      const alreadyAdministrator = await this.rest.itemExistsByFilter(
        ADMINISTRATORS_LIST_TITLE,
        `AM_UserId eq ${user.Id}`
      );
      if (alreadyAdministrator) {
        this.appAdministratorCache = true;
        return true;
      }

      await this.rest.addListItem(ADMINISTRATORS_LIST_TITLE, {
        Title: user.Title,
        AM_UserId: user.Id
      });

      await this.logAudit({
        entity: 'Administrators',
        action: 'CREATE',
        details: { Title: user.Title, AM_UserId: user.Id, autoProvisioned: true }
      });
      this.invalidateAppAdministratorCache();
      this.appAdministratorCache = true;
      return true;
    } catch {
      return false;
    }
  }

  public async addAppAdministrator(person: IPersonPickerItem): Promise<boolean> {
    if (!person.id) {
      throw new Error('User is required.');
    }

    if (await this.isAppAdministratorPerson(person)) {
      return false;
    }

    await this.rest.addListItem(ADMINISTRATORS_LIST_TITLE, {
      Title: person.title,
      AM_UserId: person.id
    });

    await this.logAudit({
      entity: 'Administrators',
      action: 'CREATE',
      details: { Title: person.title, AM_UserId: person.id }
    });
    this.invalidateAppAdministratorCache();
    return true;
  }

  public async deleteAppAdministrator(id: number): Promise<void> {
    const administrators = await this.getAppAdministrators();
    if (administrators.length <= 1) {
      throw new Error('At least one app administrator is required.');
    }

    const target = administrators.find((administrator) => administrator.Id === id);
    if (!target) {
      throw new Error('Administrator not found.');
    }

    await this.rest.deleteItem(ADMINISTRATORS_LIST_TITLE, id);
    await this.logAudit({
      entity: 'Administrators',
      action: 'DELETE',
      entityId: String(id),
      details: { Title: target.Title }
    });
    this.invalidateAppAdministratorCache();
  }

  private invalidateAppAdministratorCache(): void {
    this.appAdministratorCache = null;
    this.invalidateDataCache('appAdministrators');
    this.notifications.invalidateAdministratorEmails();
  }

  /** @deprecated Use requireSiteSetupAccess — setup no longer auto-adds users to Owners. */
  public async ensureInstallerSiteOwnerAccess(): Promise<ISiteOwnerAccessResult> {
    return this.requireSiteSetupAccess();
  }



  public async getRisks(
    filter?: string,
    options?: { lookupMaps?: IAssetLookupMaps }
  ): Promise<IAsset[]> {
    const cacheKey = `risks:${filter || 'all'}`;
    return this.getCached(cacheKey, () => this.fetchRisks(filter, options?.lookupMaps));
  }

  private async fetchRisks(filter?: string, lookupMaps?: IAssetLookupMaps): Promise<IAsset[]> {
    const risksList = await this.rest.getListByTitle('AM_Assets');
    if (!risksList) {
      return [];
    }

    const scalarFields = [...RISK_SCALAR_LOAD_FIELDS];
    const lookupFields = [...RISK_LOOKUP_LOAD_FIELDS];

    let dynamicSelect = 'Id,Title,Created,Modified';
    try {
      dynamicSelect = await this.rest.buildRiskItemSelect(
        risksList.Id,
        scalarFields,
        lookupFields,
        [...RISK_USER_LOAD_FIELDS]
      );
    } catch {
      /* use minimal select below */
    }

    const queryAttempts: Array<{ select: string; expand?: string; orderBy?: string }> = [
      { select: dynamicSelect },
      { select: 'Id,Title,Created,Modified' },
      { select: 'Id,Title' },
      { select: 'Id,Title', orderBy: '' },
      { select: 'Id', orderBy: '' }
    ];

    let items: ISharePointAssetItem[] = [];
    let lastError: Error | undefined;

    for (const attempt of queryAttempts) {
      try {
        items = await this.rest.getAllItems<ISharePointAssetItem>(
          'AM_Assets',
          attempt.select,
          attempt.expand,
          filter,
          attempt.orderBy === '' ? undefined : (attempt.orderBy ?? 'Id desc')
        );
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Failed to load risks');
      }
    }

    if (lastError) {
      return [];
    }

    const resolvedLookupMaps = lookupMaps ?? (await this.loadRiskLookupMaps());
    const userMap = await this.buildUserMapFromItems(items);

    return items
      .map((item) => this.mapRisk(item, resolvedLookupMaps, userMap))
      .sort((a, b) => {
        const aTime = a.Modified ? new Date(a.Modified).getTime() : 0;
        const bTime = b.Modified ? new Date(b.Modified).getTime() : 0;
        return bTime - aTime;
      });
  }



  public async getRisksByStatus(status?: AssetStatus): Promise<IAsset[]> {

    if (!status) {

      return this.getRisks();

    }

    return this.getRisks(`AM_Status/Title eq '${status}'`);

  }

  public async getRiskById(id: number): Promise<IAsset | undefined> {
    const risksList = await this.rest.getListByTitle('AM_Assets');
    if (!risksList) {
      return undefined;
    }

    const scalarFields = [...RISK_SCALAR_LOAD_FIELDS];
    const lookupFields = [...RISK_LOOKUP_LOAD_FIELDS];

    let select = 'Id,Title,Created,Modified';
    try {
      select = await this.rest.buildRiskItemSelect(
        risksList.Id,
        scalarFields,
        lookupFields,
        [...RISK_USER_LOAD_FIELDS, ...RISK_SYSTEM_USER_LOAD_FIELDS]
      );
    } catch {
      /* use minimal select */
    }

    const item = await this.rest.getListItemById<ISharePointAssetItem>('AM_Assets', id, select);

    if (!item) {
      return undefined;
    }

    const lookupMaps = await this.loadRiskLookupMaps();
    const userMap = await this.buildUserMapFromItems([item]);
    return this.mapRisk(item, lookupMaps, userMap, await this.resolveRiskAuthor(item));
  }



  public async getAppSettings(): Promise<IAppSettings | undefined> {

    try {

      const items = await this.rest.getItems<IAppSettings>(

        SETTINGS_LIST_TITLE,

        'Id,Title,SupportGroup,TicketIDPrefix,Reviewed,SiteLogoURL,ColorScheme,AppearanceSettings,Version,AssetMgmtProc,DashboardName,DashboardDynamicNaming,DashboardHoverEnabled,DashboardFinExpEnabled,RequestFormTabs,RequestNewFormFields,WorkflowSettings,SampleDataSeeded',

        undefined,

        undefined,

        'Id asc',

        1

      );

      return items[0];

    } catch (error) {

      // Before setup runs (or while it is still creating lists in the background) the
      // AppSettings list may not exist yet. Treat that as "no settings" so the shell can
      // render its setup banner instead of surfacing a raw SharePoint 404.
      const message = error instanceof Error ? error.message : String(error);

      if (/does not exist|list not found|\b404\b/i.test(message)) {

        return undefined;

      }

      throw error;

    }

  }

  public getSiteWebUrl(): string {
    return this.webUrl;
  }



  public async updateAppSettings(id: number, fields: Partial<IAppSettings>): Promise<void> {

    const previous = await this.getAppSettings();

    if (fields.AppearanceSettings !== undefined) {
      const provisioning = new ListProvisioningService(this.spHttpClient, this.webUrl);
      await provisioning.ensureListFieldsReady(SETTINGS_LIST_TITLE);
    }

    await this.rest.updateItem(SETTINGS_LIST_TITLE, id, fields as Record<string, SharePointFieldValue>);

    const next = previous ? { ...previous, ...fields } : fields;
    const changes = computeAuditChanges(
      previous as unknown as Record<string, unknown>,
      next as unknown as Record<string, unknown>
    );

    await this.logAudit({
      entity: 'AppSettings',
      action: 'SETTINGS_UPDATE',
      entityId: String(id),
      details: Object.keys(changes).length ? changes : { updated: true }
    });

  }

  public getWorkflowSettings(settings?: IAppSettings): IWorkflowSettings {
    return parseWorkflowSettings(settings);
  }

  public getAssetStatusOptions(settings?: IAppSettings): string[] {
    return getRiskStatusOptionNames(this.getWorkflowSettings(settings));
  }

  public async saveWorkflowSettings(
    settings: IAppSettings,
    workflowSettings: IWorkflowSettings
  ): Promise<void> {
    await this.updateAppSettings(settings.Id, {
      WorkflowSettings: serializeWorkflowSettings(workflowSettings)
    });
    await this.syncAssetStatusChoices(workflowSettings);
  }

  /** Seed demo tags into WorkflowSettings when none exist yet (onboarding sample data). */
  public async seedSampleTags(): Promise<number> {
    const settings = await this.getAppSettings();
    if (!settings?.Id) {
      return 0;
    }

    const workflow = parseWorkflowSettings(settings);
    if (workflow.tags.length > 0) {
      return 0;
    }

    await this.saveWorkflowSettings(settings, {
      ...workflow,
      tags: SAMPLE_TAG_SEED_DATA.map((tag) => ({ ...tag }))
    });
    return SAMPLE_TAG_SEED_DATA.length;
  }

  /** Remove onboarding demo tags while keeping administrator-created tags. */
  public async clearSampleTags(): Promise<number> {
    const settings = await this.getAppSettings();
    if (!settings?.Id) {
      return 0;
    }

    const workflow = parseWorkflowSettings(settings);
    const before = workflow.tags.length;
    const nextTags = workflow.tags.filter(
      (tag) =>
        !SAMPLE_TAG_SEED_IDS.has(tag.id) &&
        !SAMPLE_TAG_SEED_NAMES.has(tag.name.trim().toLowerCase())
    );
    if (nextTags.length === before) {
      return 0;
    }

    await this.saveWorkflowSettings(settings, {
      ...workflow,
      tags: nextTags
    });
    return before - nextTags.length;
  }

  public async syncAssetStatusChoices(workflowSettings: IWorkflowSettings): Promise<void> {
    const statusNames = getRiskStatusOptionNames(workflowSettings);
    try {
      await this.rest.updateChoiceFieldChoices('AM_Assets', 'AM_Status', statusNames);
    } catch {
      // Choice sync is best-effort for sites where the field is locked or missing.
    }
  }

  public async syncAssetDropdownChoices(formSettings: FormSettings): Promise<void> {
    const depreciationOptions = getAssetDropdownOptionsForField(
      formSettings,
      'AM_DepreciationMethod',
      ['StraightLine', 'DecliningBalance']
    );
    if (depreciationOptions.length === 0) {
      return;
    }
    try {
      await this.rest.updateChoiceFieldChoices('AM_Assets', 'AM_DepreciationMethod', depreciationOptions);
    } catch {
      // Choice sync is best-effort for sites where the field is locked or missing.
    }
  }

  private async allocateAndPersistNumber(entityType: NumberingEntityType): Promise<string | undefined> {
    const settings = await this.getAppSettings();
    if (!settings) {
      return undefined;
    }

    const workflow = parseWorkflowSettings(settings);
    const allocated = allocateEntityNumber(workflow, entityType);
    if (!allocated) {
      return undefined;
    }

    await this.updateAppSettings(settings.Id, {
      WorkflowSettings: serializeWorkflowSettings(allocated.updatedSettings)
    });
    return allocated.number;
  }

  /**
   * Allocate a business/project code on create. If numbering is disabled in settings,
   * enable it for that entity type and persist the first number (matches risk ID behavior).
   */
  private async allocateEntityCodeOnCreate(
    entityType: Extract<NumberingEntityType, 'vendor' | 'project'>
  ): Promise<string | undefined> {
    const direct = await this.allocateAndPersistNumber(entityType);
    if (direct) {
      return direct;
    }

    const settings = await this.getAppSettings();
    if (!settings?.Id) {
      return undefined;
    }

    const workflow = parseWorkflowSettings(settings);
    const allocated = allocateEntityCodeWithAutoEnable(workflow, entityType);
    if (!allocated) {
      return undefined;
    }

    await this.updateAppSettings(settings.Id, {
      WorkflowSettings: serializeWorkflowSettings(allocated.updatedSettings)
    });
    return allocated.number;
  }

  /** Assign AM_AssetId from Settings → Numbering (WorkflowSettings) after a list item is created. */
  public async assignRiskIdOnCreate(itemId: number): Promise<string> {
    const [riskId] = await this.assignRiskIdsOnCreateBatch([itemId]);
    return riskId;
  }

  /**
   * Assign AM_AssetIds after bulk create (e.g. onboarding seed). Reads and writes workflow
   * numbering settings once instead of once per item.
   */
  public async assignRiskIdsOnCreateBatch(itemIds: number[]): Promise<string[]> {
    if (itemIds.length === 0) {
      return [];
    }

    const settings = await this.getAppSettings();
    const prefix = settings?.TicketIDPrefix?.trim() || 'AST-';
    const originalWorkflow = parseWorkflowSettings(settings);
    let workflow = originalWorkflow;
    const riskIds: string[] = [];

    for (const itemId of itemIds) {
      const allocated = allocateEntityNumber(workflow, 'asset');
      const riskId = allocated?.number || `${prefix}${itemId}`;
      if (allocated) {
        workflow = allocated.updatedSettings;
      }
      await this.rest.updateItem('AM_Assets', itemId, { AM_AssetId: riskId });
      riskIds.push(riskId);
    }

    if (settings?.Id) {
      const originalSerialized = serializeWorkflowSettings(originalWorkflow);
      const nextSerialized = serializeWorkflowSettings(workflow);
      if (originalSerialized !== nextSerialized) {
        await this.updateAppSettings(settings.Id, {
          WorkflowSettings: nextSerialized
        });
      }
    }

    return riskIds;
  }



  public async getLookupItems(listTitle: string, options?: IDataFetchOptions): Promise<ILookupItem[]> {
    const cacheKey = `lookup:${listTitle}:${options?.summary ? 'summary' : 'full'}`;
    return this.getCached(cacheKey, () => this.fetchLookupItems(listTitle));
  }

  private async fetchLookupItems(listTitle: string): Promise<ILookupItem[]> {

    const hasRating = listTitle === 'Likelihood' || listTitle === 'Consequences';

    const select = hasRating ? 'Id,Title,Rating' : 'Id,Title';

    return this.rest.getAllItems<ILookupItem>(listTitle, select, undefined, undefined, 'Title asc');

  }

  public async getSubCategoryItems(options?: IDataFetchOptions): Promise<ILookupItem[]> {
    const cacheKey = `subcategories:${options?.summary ? 'summary' : 'full'}`;
    return this.getCached(cacheKey, () => this.fetchSubCategoryItems(options));
  }

  private async fetchSubCategoryItems(options?: IDataFetchOptions): Promise<ILookupItem[]> {
    if (options?.summary) {
      return this.rest.getAllItems<ILookupItem>(
        SUB_CATEGORIES_LIST_TITLE,
        'Id,Title',
        undefined,
        undefined,
        'Title asc'
      );
    }

    const items = await this.rest.getAllItems<{
      Id: number;
      Title: string;
      AM_ParentCategory?: { Id: number; Title: string };
    }>(
      SUB_CATEGORIES_LIST_TITLE,
      'Id,Title,AM_ParentCategory/Id,AM_ParentCategory/Title',
      'AM_ParentCategory',
      undefined,
      'Title asc'
    );

    return items.map((item) => ({
      Id: item.Id,
      Title: item.Title,
      AM_ParentCategoryId: item.AM_ParentCategory?.Id,
      AM_ParentCategory: item.AM_ParentCategory
    }));
  }

  public async subCategoryTitleExists(
    title: string,
    parentCategoryId: number,
    excludeId?: number
  ): Promise<boolean> {
    const safeTitle = title.replace(/'/g, "''");
    const filter =
      excludeId !== undefined
        ? `Title eq '${safeTitle}' and AM_ParentCategoryId eq ${parentCategoryId} and Id ne ${excludeId}`
        : `Title eq '${safeTitle}' and AM_ParentCategoryId eq ${parentCategoryId}`;
    const items = await this.rest.getItems<{ Id: number }>(
      SUB_CATEGORIES_LIST_TITLE,
      'Id',
      undefined,
      filter,
      undefined,
      1
    );
    return items.length > 0;
  }

  public async addSubCategoryItem(title: string, parentCategoryId: number): Promise<void> {
    if (await this.subCategoryTitleExists(title, parentCategoryId)) {
      throw new Error(`"${title}" already exists for the selected category.`);
    }

    await this.rest.addListItem(SUB_CATEGORIES_LIST_TITLE, {
      Title: title,
      AM_ParentCategoryId: parentCategoryId
    });

    await this.logAudit({
      entity: 'SubCategories',
      action: 'CREATE',
      details: { Title: title, AM_ParentCategoryId: parentCategoryId }
    });
    this.invalidateAfterListMutation(SUB_CATEGORIES_LIST_TITLE);
  }

  public async updateSubCategoryItem(
    id: number,
    title: string,
    parentCategoryId: number
  ): Promise<void> {
    if (await this.subCategoryTitleExists(title, parentCategoryId, id)) {
      throw new Error(`"${title}" already exists for the selected category.`);
    }

    await this.rest.updateItem(SUB_CATEGORIES_LIST_TITLE, id, {
      Title: title,
      AM_ParentCategoryId: parentCategoryId
    });

    await this.logAudit({
      entity: 'SubCategories',
      action: 'UPDATE',
      entityId: String(id),
      details: { Title: title, AM_ParentCategoryId: parentCategoryId }
    });
    this.invalidateAfterListMutation(SUB_CATEGORIES_LIST_TITLE);
  }

  public async deleteSubCategoryItem(id: number): Promise<void> {
    const snapshot = await this.getLookupSnapshot(SUB_CATEGORIES_LIST_TITLE, id);
    await this.rest.deleteItem(SUB_CATEGORIES_LIST_TITLE, id);
    await this.logAudit({
      entity: 'SubCategories',
      action: 'DELETE',
      entityId: String(id),
      details: snapshot || undefined
    });
    this.invalidateAfterListMutation(SUB_CATEGORIES_LIST_TITLE);
  }

  public async getProjectItems(options?: IDataFetchOptions): Promise<ILookupItem[]> {
    const mode = options?.summary ? 'summary' : options?.view ? 'view' : 'full';
    const cacheKey = `projects:${mode}`;
    return this.getCached(cacheKey, () => this.fetchProjectItems(options));
  }

  private async fetchProjectItems(options?: IDataFetchOptions): Promise<ILookupItem[]> {
    if (!options?.skipFieldRepair) {
      const provisioning = new ListProvisioningService(this.spHttpClient, this.webUrl);
      await provisioning.ensureListFieldsReady(PROJECTS_LIST_TITLE);
    }

    const select = options?.summary
      ? PROJECT_SUMMARY_SELECT
      : options?.view
        ? PROJECT_LIST_VIEW_SELECT
        : PROJECT_ITEM_SELECT;
    const expand = options?.summary
      ? undefined
      : options?.view
        ? PROJECT_LIST_VIEW_EXPAND
        : PROJECT_ITEM_EXPAND;

    const items = await this.rest.getAllItems<{
      Id: number;
      Title: string;
      AM_Code?: string;
      AM_Status?: string;
      AM_Owner?: { Id: number; Title: string; EMail?: string };
    }>(
      PROJECTS_LIST_TITLE,
      select,
      expand,
      undefined,
      'Title asc'
    );

    if (options?.summary) {
      return items.map((item) => ({ Id: item.Id, Title: item.Title }));
    }

    return items.map((item) => ({
      Id: item.Id,
      Title: item.Title,
      Code: item.AM_Code,
      ProjectStatus: item.AM_Status,
      Owner: toUserValue(item.AM_Owner)
    }));
  }

  public async projectTitleExists(
    title: string,
    _businessId?: number,
    excludeId?: number
  ): Promise<boolean> {
    const safeTitle = title.replace(/'/g, "''");
    let filter = `Title eq '${safeTitle}'`;
    if (excludeId !== undefined) {
      filter += ` and Id ne ${excludeId}`;
    }
    const items = await this.rest.getItems<{ Id: number }>(
      PROJECTS_LIST_TITLE,
      'Id',
      undefined,
      filter,
      undefined,
      1
    );
    return items.length > 0;
  }

  public async addProjectItem(
    title: string,
    _businessId?: number,
    code?: string,
    projectStatus?: string
  ): Promise<void> {
    if (await this.projectTitleExists(title)) {
      throw new Error(`"${title}" already exists.`);
    }

    const generatedCode = (await this.allocateEntityCodeOnCreate('project')) || code || '';

    await this.rest.addListItem(PROJECTS_LIST_TITLE, {
      Title: title,
      ...(generatedCode ? { AM_Code: generatedCode } : {}),
      AM_Status: projectStatus || 'Active'
    });

    await this.logAudit({
      entity: 'Projects',
      action: 'CREATE',
      details: {
        Title: title,
        AM_Code: generatedCode,
        AM_Status: projectStatus || 'Active'
      }
    });
    this.invalidateAfterListMutation(PROJECTS_LIST_TITLE);
  }

  public async updateProjectItem(
    id: number,
    title: string,
    _businessId?: number,
    code?: string,
    projectStatus?: string
  ): Promise<void> {
    if (await this.projectTitleExists(title, undefined, id)) {
      throw new Error(`"${title}" already exists.`);
    }

    await this.rest.updateItem(PROJECTS_LIST_TITLE, id, {
      Title: title,
      ...(code !== undefined && code !== '' ? { AM_Code: code } : {}),
      AM_Status: projectStatus || 'Active'
    });

    await this.logAudit({
      entity: 'Projects',
      action: 'UPDATE',
      entityId: String(id),
      details: {
        Title: title,
        AM_Code: code || '',
        AM_Status: projectStatus || 'Active'
      }
    });
    this.invalidateAfterListMutation(PROJECTS_LIST_TITLE);
  }

  public async deleteProjectItem(id: number): Promise<void> {
    const snapshot = await this.getLookupSnapshot(PROJECTS_LIST_TITLE, id);
    await this.rest.deleteItem(PROJECTS_LIST_TITLE, id);
    await this.logAudit({
      entity: 'Projects',
      action: 'DELETE',
      entityId: String(id),
      details: snapshot || undefined
    });
    this.invalidateAfterListMutation(PROJECTS_LIST_TITLE);
  }



  public async lookupTitleExists(listTitle: string, title: string, excludeId?: number): Promise<boolean> {

    const safeTitle = title.replace(/'/g, "''");

    const filter =

      excludeId !== undefined

        ? `Title eq '${safeTitle}' and Id ne ${excludeId}`

        : `Title eq '${safeTitle}'`;

    const items = await this.rest.getItems<ILookupItem>(listTitle, 'Id,Title', undefined, filter, undefined, 1);

    return items.length > 0;

  }



  public async getBusinessItems(options?: IDataFetchOptions): Promise<ILookupItem[]> {
    const mode = options?.summary ? 'summary' : options?.view ? 'view' : 'full';
    const cacheKey = `business:${mode}`;
    return this.getCached(cacheKey, () => this.fetchBusinessItems(options));
  }

  private async fetchBusinessItems(options?: IDataFetchOptions): Promise<ILookupItem[]> {
    const listTitle = options?.skipFieldRepair
      ? await this.getBusinessListTitle()
      : await new ListProvisioningService(this.spHttpClient, this.webUrl).ensureBusinessListFieldsReady();

    const select = options?.summary
      ? BUSINESS_SUMMARY_SELECT
      : options?.view
        ? BUSINESS_LIST_VIEW_SELECT
        : BUSINESS_ITEM_SELECT;
    const expand = options?.summary
      ? undefined
      : options?.view
        ? BUSINESS_LIST_VIEW_EXPAND
        : BUSINESS_ITEM_EXPAND;

    const items = await this.rest.getAllItems<{
      Id: number;
      Title: string;
      BusinessCode?: string;
      Description?: string;
      Industry?: string;
      GeographicRegion?: string;
      RegulatoryEnvironment?: string;
      BusinessCriticality?: string;
      RiskAppetite?: string;
      BudgetRange?: string;
      KeyStakeholders?: string;
      StrategicObjectives?: string;
      ComplianceRequirements?: string;
      Owner?: { Id: number; Title: string; EMail?: string };
    }>(
      listTitle,
      select,
      expand,
      undefined,
      'Title asc'
    );

    if (options?.summary) {
      return items;
    }

    return items.map((item) => ({
      Id: item.Id,
      Title: item.Title,
      BusinessCode: item.BusinessCode,
      Description: item.Description,
      Industry: item.Industry,
      GeographicRegion: item.GeographicRegion,
      RegulatoryEnvironment: item.RegulatoryEnvironment,
      BusinessCriticality: item.BusinessCriticality,
      RiskAppetite: item.RiskAppetite,
      BudgetRange: item.BudgetRange,
      KeyStakeholders: item.KeyStakeholders,
      StrategicObjectives: item.StrategicObjectives,
      ComplianceRequirements: item.ComplianceRequirements,
      Owner: toUserValue(item.Owner)
    }));
  }



  public async getBusinessListTitle(): Promise<string> {
    return this.getCached('businessListTitle', async () => {
      const listTitle = await this.rest.resolveListTitleAlias(
        BUSINESS_LIST_TITLE,
        LEGACY_BUSINESS_LIST_TITLE
      );
      return listTitle ?? BUSINESS_LIST_TITLE;
    });
  }



  public async addLookupItem(listTitle: string, title: string, rating?: string): Promise<void> {

    if (await this.lookupTitleExists(listTitle, title)) {

      throw new Error(`"${title}" already exists in ${listTitle}.`);

    }



    const fields: Record<string, SharePointFieldValue> = { Title: title };

    if (rating) {

      fields.Rating = rating;

    }

    await this.rest.addListItem(listTitle, fields);

    await this.logAudit({
      entity: this.auditEntityForList(listTitle),
      action: 'CREATE',
      details: fields
    });
    this.invalidateAfterListMutation(listTitle);

  }



  public async updateLookupItem(

    listTitle: string,

    id: number,

    title: string,

    rating?: string

  ): Promise<void> {

    if (await this.lookupTitleExists(listTitle, title, id)) {

      throw new Error(`"${title}" already exists in ${listTitle}.`);

    }



    const fields: Record<string, SharePointFieldValue> = { Title: title };

    if (rating !== undefined) {

      fields.Rating = rating;

    }

    await this.rest.updateItem(listTitle, id, fields);

    await this.logAudit({
      entity: this.auditEntityForList(listTitle),
      action: 'UPDATE',
      entityId: String(id),
      details: fields
    });
    this.invalidateAfterListMutation(listTitle);

  }



  public async getLookupDeleteImpact(
    listTitle: string,
    ids: number[],
    titles: string[] = []
  ): Promise<{ references: ILookupDeleteReference[] }> {
    const idDefinitions = getLookupReferenceDefinitions(listTitle);
    const choiceDefinitions = getLookupChoiceReferenceDefinitions(listTitle);
    const references: ILookupDeleteReference[] = [];

    await Promise.all(
      idDefinitions.map(async (definition) => {
        const count = await this.rest.countItemsByFilter(
          definition.listTitle,
          buildLookupIdFilter(definition.lookupIdField, ids)
        );
        references.push({
          listTitle: definition.listTitle,
          displayLabel: definition.displayLabel,
          count
        });
      })
    );

    await Promise.all(
      choiceDefinitions.map(async (definition) => {
        const count = await this.rest.countItemsByFilter(
          definition.listTitle,
          buildChoiceFieldFilter(titles, definition.choiceFields)
        );
        references.push({
          listTitle: definition.listTitle,
          displayLabel: definition.displayLabel,
          count
        });
      })
    );

    references.sort((left, right) => left.displayLabel.localeCompare(right.displayLabel));
    return { references };
  }

  public async deleteLookupItem(listTitle: string, id: number): Promise<void> {

    const snapshot = await this.getLookupSnapshot(listTitle, id);
    await this.rest.deleteItem(listTitle, id);

    await this.logAudit({
      entity: this.auditEntityForList(listTitle),
      action: 'DELETE',
      entityId: String(id),
      details: snapshot || undefined
    });
    this.invalidateAfterListMutation(listTitle);

  }

  public async deleteLookupItems(
    listTitle: string,
    ids: number[]
  ): Promise<{ deletedIds: number[]; failed: Array<{ id: number; error: string }> }> {
    const deletedIds: number[] = [];
    const failed: Array<{ id: number; error: string }> = [];

    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      try {
        await this.deleteLookupItem(listTitle, id);
        deletedIds.push(id);
      } catch (err) {
        failed.push({
          id,
          error: err instanceof Error ? err.message : 'Failed to delete item.'
        });
      }
    }

    return { deletedIds, failed };
  }



  public async resolveUserEmail(email: string): Promise<{ Id: number; Title: string; Email: string }> {

    const trimmed = email.trim();

    if (!trimmed) {

      throw new Error('Owner email is required to assign an asset.');

    }

    return this.rest.ensureUser(trimmed);

  }

  public searchPeople(query: string): Promise<IPersonPickerSuggestion[]> {
    return this.rest.searchPeople(query);
  }

  public async getRiskVersionHistory(
    itemId: number,
    formConfig?: BuiltFormConfig
  ): Promise<IAssetVersionHistoryEntry[]> {
    // Request every column (empty field list = all fields) so any changed field
    // is surfaced, and resolve display labels from the list's custom field titles.
    const [versions, fieldLabels] = await Promise.all([
      this.rest.getListItemVersions('AM_Assets', itemId, []),
      this.rest.getListFieldLabels('AM_Assets').catch(() => ({} as Record<string, string>))
    ]);
    if (versions.length === 0) {
      return [];
    }

    const fieldOrder = buildRiskVersionFieldOrder(fieldLabels, formConfig);

    return versions.map((version, index) => {
      const newer = version.fieldValues;
      const older = index < versions.length - 1 ? versions[index + 1].fieldValues : {};
      const isCreated = index === versions.length - 1;
      const changes = diffRiskVersionAllFields(newer, isCreated ? {} : older, fieldOrder);

      return {
        versionId: version.VersionId,
        versionLabel: version.VersionLabel,
        createdAt: version.Created,
        editorName: version.Editor?.Title || 'Unknown',
        editorEmail: version.Editor?.EMail,
        isCurrent: version.IsCurrentVersion === true || index === 0,
        isCreated,
        changes
      };
    });
  }

  public resolvePerson(key: string): Promise<IPersonPickerItem> {
    return this.rest.resolvePerson(key);
  }



  public async createRisk(input: IAssetSaveInput): Promise<number> {

    await this.ensureRisksListReady();

    const payload = await this.buildResolvedSavePayload({
      ...input,
      AM_Status: input.AM_Status || 'Available'
    });

    const itemId = await this.rest.addListItem('AM_Assets', payload);

    if (!input.AM_AssetId?.trim()) {
      await this.assignRiskIdOnCreate(itemId);
    }

    const createdRisk = await this.getRiskById(itemId);
    if (createdRisk) {
      await this.notifications.notifyRiskCreated(createdRisk);
    }

    await this.logAudit({
      entity: 'AM_Assets',
      action: 'CREATE',
      entityId: String(itemId),
      details: {
        AM_AssetId: createdRisk?.AM_AssetId || input.AM_AssetId,
        Title: input.Title,
        AM_Status: input.AM_Status || 'Available',
        AM_CategoryId: input.AM_CategoryId
      }
    });
    this.invalidateAfterListMutation('AM_Assets');

    return itemId;

  }



  public async updateRisk(id: number, input: IAssetSaveInput): Promise<void> {

    await this.ensureRisksListReady();

    const previous = await this.getRiskById(id);

    await this.rest.updateItem('AM_Assets', id, await this.buildResolvedSavePayload(input));

    const updatedRisk = await this.getRiskById(id);
    if (updatedRisk) {
      await this.notifications.notifyRiskUpdated(
        previous,
        input as unknown as import('../lib/workflow-settings/notificationLogic').IAssetNotificationUpdateInput,
        updatedRisk
      );
    }

    const changes = computeAuditChanges(
      previous ? (this.assetToAuditRecord(previous) as Record<string, unknown>) : undefined,
      this.assetInputToAuditRecord(input) as Record<string, unknown>
    );

    await this.logAudit({
      entity: 'AM_Assets',
      action: 'UPDATE',
      entityId: String(id),
      details: Object.keys(changes).length ? changes : { updated: true }
    });
    this.invalidateAfterListMutation('AM_Assets');

  }



  public async deleteRisk(id: number): Promise<void> {

    const previous = await this.getRiskById(id);
    await this.rest.deleteItem('AM_Assets', id);

    await this.logAudit({
      entity: 'AM_Assets',
      action: 'DELETE',
      entityId: String(id),
      details: previous
        ? {
            AM_AssetId: previous.AM_AssetId,
            Title: previous.Title,
            AM_Status: previous.AM_Status
          }
        : undefined
    });
    this.invalidateAfterListMutation('AM_Assets');

  }

  public async deleteRisks(
    ids: number[]
  ): Promise<{ deletedIds: number[]; failed: Array<{ id: number; error: string }> }> {
    const deletedIds: number[] = [];
    const failed: Array<{ id: number; error: string }> = [];

    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      try {
        await this.deleteRisk(id);
        deletedIds.push(id);
      } catch (err) {
        failed.push({
          id,
          error: err instanceof Error ? err.message : 'Failed to delete risk.'
        });
      }
    }

    return { deletedIds, failed };
  }

  /** Persist category template answers keyed by field id. */
  public async updateRiskTemplateData(itemId: number, templateData: string): Promise<void> {
    await this.rest.updateItem('AM_Assets', itemId, { AM_CustomJson: templateData });
    await this.logAudit({
      entity: 'AM_Assets',
      action: 'UPDATE',
      entityId: String(itemId),
      details: { AM_CustomJson: templateData }
    });
    this.invalidateAfterListMutation('AM_Assets');
  }

  public async getFormTemplates(): Promise<AssetFormTemplate[]> {
    try {
      const items = await this.rest.getAllItems<{
        Id: number;
        Title: string;
        TemplateFields?: string;
        TemplateTabs?: string;
        IsActive?: boolean;
        TemplateCategory?: { Id: number; Title: string };
      }>(
        FORM_TEMPLATES_LIST_TITLE,
        'Id,Title,TemplateFields,TemplateTabs,IsActive,TemplateCategory/Id,TemplateCategory/Title',
        'TemplateCategory',
        undefined,
        'Title asc'
      );

      return items.map((item) => ({
        id: item.Id,
        name: item.Title,
        categoryId: item.TemplateCategory?.Id ?? null,
        categoryName: item.TemplateCategory?.Title ?? null,
        fields: parseTemplateFields(item.TemplateFields),
        tabs: parseTemplateTabs(item.TemplateTabs),
        isActive: item.IsActive !== false
      }));
    } catch {
      return [];
    }
  }

  public async createFormTemplate(input: AssetFormTemplateInput): Promise<number> {
    await this.ensureFormTemplatesListReady();
    const itemId = await this.rest.addListItem(FORM_TEMPLATES_LIST_TITLE, this.buildFormTemplatePayload(input));
    await this.logAudit({
      entity: 'FormTemplates',
      action: 'CREATE',
      entityId: String(itemId),
      details: { name: input.name, categoryId: input.categoryId, isActive: input.isActive }
    });
    return itemId;
  }

  public async updateFormTemplate(id: number, input: AssetFormTemplateInput): Promise<void> {
    await this.ensureFormTemplatesListReady();
    await this.rest.updateItem(FORM_TEMPLATES_LIST_TITLE, id, this.buildFormTemplatePayload(input));
    await this.logAudit({
      entity: 'FormTemplates',
      action: 'UPDATE',
      entityId: String(id),
      details: { name: input.name, categoryId: input.categoryId, isActive: input.isActive }
    });
  }

  public async deleteFormTemplate(id: number): Promise<void> {
    await this.rest.deleteItem(FORM_TEMPLATES_LIST_TITLE, id);
    await this.logAudit({
      entity: 'FormTemplates',
      action: 'DELETE',
      entityId: String(id)
    });
  }

  /** Create the built-in templates for categories that don't already have one. */
  public async seedDefaultFormTemplates(categories: ILookupItem[]): Promise<number> {
    await this.ensureFormTemplatesListReady();

    const existing = await this.getFormTemplates();
    const usedCategoryIds = new Set(
      existing.map((template) => template.categoryId).filter((value): value is number => value !== null)
    );

    const categoryByTitle = new Map<string, ILookupItem>();
    categories.forEach((category) => {
      categoryByTitle.set(category.Title.toLowerCase(), category);
    });

    let created = 0;
    for (const seed of DEFAULT_FORM_TEMPLATES) {
      let matchedCategory: ILookupItem | undefined;
      for (const title of seed.categoryTitles) {
        const candidate = categoryByTitle.get(title.toLowerCase());
        if (candidate) {
          matchedCategory = candidate;
          break;
        }
      }

      if (!matchedCategory || usedCategoryIds.has(matchedCategory.Id)) {
        continue;
      }

      await this.createFormTemplate({
        name: seed.templateName,
        categoryId: matchedCategory.Id,
        fields: seed.fields,
        isActive: true
      });
      usedCategoryIds.add(matchedCategory.Id);
      created += 1;
    }

    return created;
  }

  private buildFormTemplatePayload(input: AssetFormTemplateInput): Record<string, SharePointFieldValue> {
    return {
      Title: input.name,
      TemplateCategoryId: input.categoryId ?? null,
      TemplateFields: JSON.stringify(input.fields || []),
      TemplateTabs: input.tabs && input.tabs.length > 0 ? JSON.stringify(input.tabs) : '',
      IsActive: input.isActive
    };
  }

  private async ensureFormTemplatesListReady(): Promise<void> {
    const provisioning = new ListProvisioningService(this.spHttpClient, this.webUrl);
    await provisioning.ensureListFieldsReady(FORM_TEMPLATES_LIST_TITLE);
  }



  public getMatrixPriority(likelihood?: string, consequence?: string) {
    return getMatrixPriorityUtil(likelihood, consequence);
  }

  public getRiskScore(likelihood?: string, consequence?: string): number {

    const lScore = this.parseChoiceScore(likelihood);

    const cScore = this.parseChoiceScore(consequence);

    return lScore * cScore;

  }



  public getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {

    if (score <= 4) return 'low';

    if (score <= 9) return 'medium';

    if (score <= 16) return 'high';

    return 'critical';

  }



  public getRiskLevelLabel(level: ReturnType<AssetService['getRiskLevel']>): string {

    switch (level) {

      case 'low':

        return 'Low';

      case 'medium':

        return 'Medium';

      case 'high':

        return 'High';

      default:

        return 'Critical';

    }

  }



  private async ensureRisksListReady(): Promise<void> {

    const provisioning = new ListProvisioningService(this.spHttpClient, this.webUrl);

    await provisioning.ensureListFieldsReady('AM_Assets');

    const list = await this.rest.getListByTitle('AM_Assets');
    if (list) {
      await this.rest.ensureListAttachmentsEnabled(list.Id);
    }

  }

  public buildAttachmentUrl(serverRelativeUrl: string): string {
    const origin = new URL(this.webUrl).origin;
    return `${origin}${serverRelativeUrl}`;
  }

  public async getListPermissions(listTitle: string, itemId?: number): Promise<IListPermissions> {
    const cacheKey = `${listTitle}:${itemId ?? 'list'}`;
    const cached = this.listPermissionsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const effective = await this.rest.getEffectiveBasePermissions(listTitle, itemId);
    const permissions = permissionsFromEffectivePermissions(effective.high, effective.low);
    this.listPermissionsCache.set(cacheKey, permissions);
    return permissions;
  }

  public clearListPermissionsCache(listTitle?: string): void {
    if (!listTitle) {
      this.listPermissionsCache.clear();
      return;
    }

    for (const key of this.listPermissionsCache.keys()) {
      if (key.startsWith(`${listTitle}:`)) {
        this.listPermissionsCache.delete(key);
      }
    }
  }

  /** Reset list/permission caches after first-time setup so create/edit forms see new lists. */
  public resetListAccessCaches(listTitle?: string): void {
    this.clearListPermissionsCache(listTitle);
    if (listTitle) {
      this.rest.clearMissingListTitle(listTitle);
      this.rest.resetListTitleProbe(listTitle);
      return;
    }
    this.rest.clearAllListExistenceCache();
  }

  public getRiskAttachments(itemId: number): Promise<ISharePointAttachment[]> {
    return this.rest.getItemAttachments('AM_Assets', itemId);
  }

  public async syncRiskAttachments(itemId: number, input: IAssetAttachmentSyncInput): Promise<void> {
    await this.ensureRisksListReady();

    const deletes = input.deletes || [];
    for (const fileName of deletes) {
      await this.rest.deleteItemAttachment('AM_Assets', itemId, fileName);
    }

    const uploads = input.uploads || [];
    for (const file of uploads) {
      const content = await file.arrayBuffer();
      await this.rest.addItemAttachment('AM_Assets', itemId, file.name, content);
    }
  }

  public async syncAssetImage(
    itemId: number,
    input: { upload?: File; remove?: boolean }
  ): Promise<string | undefined> {
    await this.ensureRisksListReady();

    const attachments = await this.rest.getItemAttachments('AM_Assets', itemId);
    const existingImage = attachments.find((attachment) => isAssetImageFileName(attachment.FileName));

    if (input.remove) {
      if (existingImage) {
        await this.rest.deleteItemAttachment('AM_Assets', itemId, existingImage.FileName);
      }
      await this.rest.updateItem('AM_Assets', itemId, { AM_ImageUrl: '' });
      this.invalidateAfterListMutation('AM_Assets');
      return undefined;
    }

    if (!input.upload) {
      return undefined;
    }

    if (existingImage) {
      await this.rest.deleteItemAttachment('AM_Assets', itemId, existingImage.FileName);
    }

    const fileName = buildAssetImageFileName(input.upload);
    const content = await input.upload.arrayBuffer();
    await this.rest.addItemAttachment('AM_Assets', itemId, fileName, content);

    const updatedAttachments = await this.rest.getItemAttachments('AM_Assets', itemId);
    const uploaded = updatedAttachments.find((attachment) => attachment.FileName === fileName);
    const imageUrl = uploaded
      ? resolveAssetImageUrl(this.buildAttachmentUrl(uploaded.ServerRelativeUrl), new URL(this.webUrl).origin)
      : undefined;

    if (imageUrl) {
      await this.rest.updateItem('AM_Assets', itemId, { AM_ImageUrl: imageUrl });
      this.invalidateAfterListMutation('AM_Assets');
    }

    return imageUrl;
  }



  private async buildResolvedSavePayload(

    input: IAssetSaveInput

  ): Promise<Record<string, SharePointFieldValue>> {

    const list = await this.rest.getListByTitle('AM_Assets');

    if (!list) {

      throw new Error('Assets list not found. Run setup first.');

    }



    const base = this.buildSavePayload(input);

    if (typeof base.AM_Status === 'string' && base.AM_Status) {
      const statusId = await this.resolveLookupItemId(ASSET_STATUSES_LIST_TITLE, base.AM_Status);
      delete base.AM_Status;
      if (statusId) {
        base.AM_StatusId = statusId;
      }
    }

    const remapped = await this.rest.remapRiskPayloadFields(

      list.Id,

      base,

      [...RISK_PAYLOAD_FIELD_MAP, ...RISK_LOOKUP_FIELD_MAP]

    );

    return buildRiskItemPayload(remapped);

  }



  private buildSavePayload(input: IAssetSaveInput): Record<string, SharePointFieldValue> {

    const fields: Record<string, SharePointFieldValue | undefined> = {

      Title: input.Title,

      AM_AssetId: input.AM_AssetId || '',

      AM_Notes: input.AM_Notes || '',

      AM_Status: input.AM_Status || 'Available',

      AM_CategoryId: input.AM_CategoryId,

      AM_SubCategoryId: input.AM_SubCategoryId === null ? null : input.AM_SubCategoryId,

      AM_ProjectId: input.AM_ProjectId === null ? null : input.AM_ProjectId,

      AM_AssetTypeId: input.AM_AssetTypeId,

      AM_SerialNumber: input.AM_SerialNumber || '',

      Likelihood: input.Likelihood || '',

      Consequence: input.Consequence || '',

      PotentialLikelihood: input.PotentialLikelihood || '',

      PotentialConsequence: input.PotentialConsequence || '',

      MitigationPlan: input.MitigationPlan || '',

      Causes: input.Causes || '',

      ExistingControls: input.ExistingControls || '',

      ProjectName: input.ProjectName || '',

      potentialcost: input.potentialcost || '',

      Assesstheeffectivenessofcontrols: input.Assesstheeffectivenessofcontrols || 'Good',

      AM_VendorId: input.AM_VendorId === null ? null : input.AM_VendorId,

      AM_LocationId: input.AM_LocationId === null ? null : input.AM_LocationId,

      AM_WarrantyExpiry: toDateOnlyFieldValue(input.AM_WarrantyExpiry || ''),

      DateRiskIdentified: toDateOnlyFieldValue(input.DateRiskIdentified || ''),

      Implementationreviewdate: toDateOnlyFieldValue(input.Implementationreviewdate || '')

    };



    if (input.AssignedToUserIds !== undefined) {

      fields.AssignedToId = toUserMultiFieldValue(input.AssignedToUserIds);

    }



    return buildRiskItemPayload(fields);

  }



  private parseChoiceScore(value?: string): number {

    if (!value) return 1;

    const match = value.match(/\((\d+)\)/);

    return match ? parseInt(match[1], 10) : 1;

  }



  private parseUserIdList(value: unknown): number[] {
    if (value == null) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.filter((id): id is number => typeof id === 'number' && id > 0);
    }
    if (typeof value === 'number' && value > 0) {
      return [value];
    }
    return [];
  }

  private async buildUserMapFromItems(
    items: ISharePointAssetItem[]
  ): Promise<Map<number, { Id: number; Title: string; Email?: string }>> {
    const userIds: number[] = [];
    for (const item of items) {
      userIds.push(...this.parseUserIdList(item.AssignedToId));
      userIds.push(...this.parseUserIdList(item.AM_AssignedToId));
      userIds.push(...this.parseUserIdList(item.AM_DeletedById));
    }
    const users = await this.rest.getSiteUsersByIds(userIds);
    return new Map(users.map((user) => [user.Id, user]));
  }

  private resolveSingleUser(
    item: ISharePointAssetItem,
    field: 'AM_AssignedTo' | 'AM_DeletedBy',
    userMap?: Map<number, { Id: number; Title: string; Email?: string }>
  ): IUserValue | undefined {
    const expanded = item[field];
    if (expanded?.Id) {
      return {
        Id: expanded.Id,
        Title: expanded.Title,
        Email: expanded.EMail
      };
    }

    const id = field === 'AM_AssignedTo' ? item.AM_AssignedToId : item.AM_DeletedById;
    if (!id) {
      return undefined;
    }

    const user = userMap?.get(id);
    if (!user) {
      return undefined;
    }

    return { Id: user.Id, Title: user.Title, Email: user.Email };
  }

  private resolveAssignedTo(
    item: ISharePointAssetItem,
    userMap?: Map<number, { Id: number; Title: string; Email?: string }>
  ): IAsset['AssignedTo'] {
    const expanded = this.normalizeUsers(item.AssignedTo);
    if (expanded && expanded.length > 0) {
      return expanded;
    }

    const ids = this.parseUserIdList(item.AssignedToId);
    if (ids.length === 0) {
      return undefined;
    }

    const users = ids
      .map((id) => userMap?.get(id))
      .filter((user): user is { Id: number; Title: string; Email?: string } => !!user)
      .map((user) => ({
        Id: user.Id,
        Title: user.Title,
        Email: user.Email
      }));

    return users.length > 0 ? users : undefined;
  }

  private async resolveRiskAuthor(item: ISharePointAssetItem): Promise<IAsset['Author']> {
    if (item.Author) {
      return { Id: item.Author.Id, Title: item.Author.Title, Email: item.Author.EMail };
    }

    if (!item.AuthorId) {
      return undefined;
    }

    const author = await this.rest.getSiteUserById(item.AuthorId);
    if (!author) {
      return undefined;
    }

    return { Id: author.Id, Title: author.Title, Email: author.Email };
  }

  private normalizeUsers(

    users?: { Id: number; Title: string; EMail?: string } | { Id: number; Title: string; EMail?: string }[]

  ): IAsset['AssignedTo'] {

    if (!users) {

      return undefined;

    }

    const list = Array.isArray(users) ? users : [users];

    return list.map((u) => ({

      Id: u.Id,

      Title: u.Title,

      Email: u.EMail

    }));

  }



  private mapRisk(
    item: ISharePointAssetItem,
    lookupMaps?: IAssetLookupMaps,
    userMap?: Map<number, { Id: number; Title: string; Email?: string }>,
    author?: IAsset['Author']
  ): IAsset {

    const resolveLookup = (
      field: keyof IAssetLookupMaps,
      expanded?: { Id: number; Title: string },
      id?: number
    ): { Id: number; Title: string } | undefined => {
      if (expanded) {
        return expanded;
      }
      if (!id) {
        return undefined;
      }
      const title = lookupMaps?.[field]?.get(id) ?? '';
      return { Id: id, Title: title };
    };

    return {

      Id: item.Id,

      Title: item.Title,

      AM_Notes: item.AM_Notes,

      AM_Status:
        typeof item.AM_Status === 'object' && item.AM_Status
          ? item.AM_Status.Title
          : item.AM_Status ||
            resolveLookup('AM_Status', undefined, item.AM_StatusId)?.Title,

      AM_AssetId: item.AM_AssetId,

      AM_SerialNumber: item.AM_SerialNumber,

      AM_Barcode: item.AM_Barcode,

      AM_AssignedTo: this.resolveSingleUser(item, 'AM_AssignedTo', userMap),

      AM_AssignedDate: item.AM_AssignedDate,

      AM_Cost: item.AM_Cost,

      AM_PurchaseDate: item.AM_PurchaseDate,

      AM_PONumber: item.AM_PONumber,

      AM_WarrantyExpiry: item.AM_WarrantyExpiry,

      AM_DepreciationMethod: item.AM_DepreciationMethod as IAsset['AM_DepreciationMethod'],

      AM_UsefulLifeMonths: item.AM_UsefulLifeMonths,

      AM_SalvageValue: item.AM_SalvageValue,

      AM_ResidualValue: item.AM_ResidualValue,

      AM_ImageUrl: item.AM_ImageUrl,

      AM_QRCodeData: item.AM_QRCodeData,

      AM_IntuneDeviceId: item.AM_IntuneDeviceId,

      AM_Manufacturer: item.AM_Manufacturer,

      AM_OS: item.AM_OS,

      AM_OSVersion: item.AM_OSVersion,

      AM_CPU: item.AM_CPU,

      AM_TotalMemory: item.AM_TotalMemory,

      AM_Storage: item.AM_Storage,

      AM_IMEI: item.AM_IMEI,

      AM_MACAddress: item.AM_MACAddress,

      AM_IsDeleted: item.AM_IsDeleted,

      AM_DeletedBy: this.resolveSingleUser(item, 'AM_DeletedBy', userMap),

      AM_CustomJson: item.AM_CustomJson,

      MitigationPlan: item.MitigationPlan,

      Likelihood: item.Likelihood,

      Consequence: item.Consequence,

      PotentialLikelihood: item.PotentialLikelihood,

      PotentialConsequence: item.PotentialConsequence,

      potentialcost: item.potentialcost,

      Assesstheeffectivenessofcontrols: item.Assesstheeffectivenessofcontrols,

      Implementationreviewdate: item.Implementationreviewdate,

      DateRiskIdentified: item.DateRiskIdentified,

      ProjectName: item.ProjectName,

      AM_Project: resolveLookup('AM_Project', item.AM_Project, item.AM_ProjectId),

      Causes: item.Causes,

      ExistingControls: item.ExistingControls,

      TemplateData: item.TemplateData,

      Created: item.Created,

      Modified: item.Modified,

      AM_Category: resolveLookup('AM_Category', item.AM_Category, item.AM_CategoryId),

      AM_SubCategory: resolveLookup('AM_SubCategory', item.AM_SubCategory, item.AM_SubCategoryId),

      AM_AssetType: resolveLookup('AM_AssetType', item.AM_AssetType, item.AM_AssetTypeId),

      AM_Vendor: resolveLookup('AM_Vendor', item.AM_Vendor, item.AM_VendorId),

      AM_Location: resolveLookup('AM_Location', item.AM_Location, item.AM_LocationId),

      AssignedTo: this.resolveAssignedTo(item, userMap),

      Author:
        author ??
        (item.Author
          ? { Id: item.Author.Id, Title: item.Author.Title, Email: item.Author.EMail }
          : undefined)

    };

  }

  private async loadRiskLookupMaps(): Promise<IAssetLookupMaps> {
    const safeLoad = async (loader: () => Promise<ILookupItem[]>): Promise<ILookupItem[]> => {
      try {
        return await loader();
      } catch {
        return [];
      }
    };

    const fetchOptions: IDataFetchOptions = { skipFieldRepair: true, summary: true };

    const [
      categories,
      subCategories,
      businesses,
      projects,
      profiles,
      responses,
      strategies,
      statuses
    ] = await Promise.all([
      safeLoad(() => this.getLookupItems(CATEGORIES_LIST_TITLE)),
      safeLoad(() => this.getSubCategoryItems(fetchOptions)),
      safeLoad(() => this.getBusinessItems(fetchOptions)),
      safeLoad(() => this.getProjectItems(fetchOptions)),
      safeLoad(() => this.getLookupItems(ASSET_TYPES_LIST_TITLE)),
      safeLoad(() => this.getLookupItems(VENDORS_LIST_TITLE)),
      safeLoad(() => this.getLookupItems(LOCATIONS_LIST_TITLE)),
      safeLoad(() => this.getLookupItems(ASSET_STATUSES_LIST_TITLE))
    ]);

    return this.buildLookupMaps({
      categories,
      subCategories,
      businesses,
      projects,
      profiles,
      responses,
      strategies,
      statuses
    });
  }

  private async resolveLookupItemId(listTitle: string, title: string): Promise<number | undefined> {
    const items = await this.getLookupItems(listTitle, { skipFieldRepair: true, summary: true });
    return items.find((item) => item.Title === title)?.Id;
  }

  public async getListFormFields(listTitle: string): Promise<ISharePointFormField[]> {
    return this.rest.getFormFields(listTitle);
  }

  public async getListItemFormValues(
    listTitle: string,
    itemId: number,
    fields: ISharePointFormField[]
  ): Promise<SharePointFormValues> {
    if (fields.length === 0) {
      return {};
    }

    const lookupFields = fields.filter((field) => field.TypeAsString === 'Lookup');
    const userFields = fields.filter(
      (field) => field.TypeAsString === 'User' || field.TypeAsString === 'UserMulti'
    );
    const selectFields = fields
      .filter(
        (field) =>
          field.TypeAsString !== 'Lookup' &&
          field.TypeAsString !== 'User' &&
          field.TypeAsString !== 'UserMulti'
      )
      .map((field) => field.InternalName);
    const lookupSelect = lookupFields.map((field) => `${field.InternalName}/Id,${field.InternalName}/Title`);
    const userSelect = userFields.map((field) =>
      field.TypeAsString === 'UserMulti'
        ? `${field.InternalName}/Id,${field.InternalName}/Title`
        : `${field.InternalName}/Id,${field.InternalName}/Title,${field.InternalName}/EMail`
    );
    const select = [...new Set(['Id', ...selectFields, ...lookupSelect, ...userSelect])].join(',');
    const expandFields = [...lookupFields.map((field) => field.InternalName), ...userFields.map((field) => field.InternalName)];
    const expand = expandFields.length > 0 ? expandFields.join(',') : undefined;

    const item = await this.rest.getListItemById<Record<string, unknown>>(listTitle, itemId, select, expand);
    if (!item) {
      throw new Error('Item not found.');
    }

    const values: SharePointFormValues = {};
    fields.forEach((field) => {
      if (field.TypeAsString === 'Lookup') {
        const lookupValue = item[field.InternalName] as { Id?: number } | undefined;
        values[field.InternalName] = lookupValue?.Id ? String(lookupValue.Id) : '';
        return;
      }

      if (field.TypeAsString === 'User' || field.TypeAsString === 'UserMulti') {
        const rawUsers = item[field.InternalName];
        const users = Array.isArray(rawUsers)
          ? rawUsers
          : rawUsers
            ? [rawUsers]
            : [];
        values[field.InternalName] = users
          .filter((user): user is { Id: number; Title?: string; EMail?: string; Email?: string } =>
            Boolean(user && typeof user === 'object' && 'Id' in user)
          )
          .map((user) => ({
            id: user.Id,
            title: user.Title || `User ${user.Id}`,
            email: user.EMail || user.Email
          }));
        return;
      }

      if (field.TypeAsString === 'Boolean') {
        values[field.InternalName] = Boolean(item[field.InternalName]);
        return;
      }

      const raw = item[field.InternalName];
      values[field.InternalName] = raw === undefined || raw === null ? '' : String(raw);
    });

    return values;
  }

  private async resolveListTitleForMutation(listTitle: string): Promise<string> {
    const trimmed = listTitle.trim();
    if (
      trimmed === BUSINESS_LIST_TITLE ||
      trimmed === LEGACY_BUSINESS_LIST_TITLE ||
      trimmed.toLowerCase() === 'business'
    ) {
      return (await this.getBusinessListTitle()) || trimmed;
    }
    return trimmed;
  }

  private isBusinessListTitle(listTitle: string): boolean {
    const trimmed = listTitle.trim();
    return (
      trimmed === BUSINESS_LIST_TITLE ||
      trimmed === LEGACY_BUSINESS_LIST_TITLE ||
      trimmed.toLowerCase() === 'business'
    );
  }

  private isProjectListTitle(listTitle: string): boolean {
    return listTitle.trim() === PROJECTS_LIST_TITLE;
  }

  private isVendorListTitle(listTitle: string): boolean {
    return listTitle.trim() === VENDORS_LIST_TITLE;
  }

  public async createListItemFromForm(
    listTitle: string,
    fields: ISharePointFormField[],
    values: SharePointFormValues,
    formConfig?: import('../lib/form-config/types').BuiltFormConfig
  ): Promise<number> {
    const resolvedListTitle = await this.resolveListTitleForMutation(listTitle);
    const payload = applyTitleFromFormValues(buildListFormPayload(fields, values, formConfig), values);

    if (this.isVendorListTitle(resolvedListTitle)) {
      const title = String(payload.Title || values.Title || '').trim();
      if (!title) {
        throw new Error('Title is required.');
      }
      if (await this.lookupTitleExists(resolvedListTitle, title)) {
        throw new Error(`"${title}" already exists.`);
      }
      if (!payload.AM_Code) {
        const vendorCode = await this.allocateEntityCodeOnCreate('vendor');
        if (vendorCode) {
          payload.AM_Code = vendorCode;
        }
      }
    }

    if (this.isProjectListTitle(resolvedListTitle)) {
      const title = String(payload.Title || values.Title || '').trim();
      if (!title) {
        throw new Error('Title is required.');
      }
      const businessId = payload.BusinessId as number | undefined;
      if (await this.projectTitleExists(title, businessId)) {
        throw new Error(`"${title}" already exists for the selected business.`);
      }
      if (!payload.Code) {
        const projectCode = await this.allocateEntityCodeOnCreate('project');
        if (projectCode) {
          payload.Code = projectCode;
        }
      }
    }

    const itemId = await this.rest.addListItem(resolvedListTitle, payload);

    if (resolvedListTitle === 'AM_Assets' || listTitle === 'AM_Assets') {
      const riskId = await this.assignRiskIdOnCreate(itemId);
      const createdRisk = await this.getRiskById(itemId);
      if (createdRisk) {
        await this.notifications.notifyRiskCreated(createdRisk);
      }
      await this.logAudit({
        entity: 'AM_Assets',
        action: 'CREATE',
        entityId: String(itemId),
        details: { ...payload, AM_AssetId: riskId }
      });
      this.invalidateAfterListMutation('AM_Assets');
      return itemId;
    }

    await this.logAudit({
      entity: this.auditEntityForList(resolvedListTitle),
      action: 'CREATE',
      entityId: String(itemId),
      details: payload
    });
    this.invalidateAfterListMutation(resolvedListTitle);
    return itemId;
  }

  public async updateListItemFromForm(
    listTitle: string,
    itemId: number,
    fields: ISharePointFormField[],
    values: SharePointFormValues,
    formConfig?: import('../lib/form-config/types').BuiltFormConfig
  ): Promise<void> {
    const resolvedListTitle = await this.resolveListTitleForMutation(listTitle);
    const payload = applyTitleFromFormValues(buildListFormPayload(fields, values, formConfig), values);

    if (this.isBusinessListTitle(resolvedListTitle) && payload.Title) {
      const title = String(payload.Title).trim();
      if (await this.lookupTitleExists(resolvedListTitle, title, itemId)) {
        throw new Error(`"${title}" already exists.`);
      }
    }

    if (this.isProjectListTitle(resolvedListTitle) && payload.Title) {
      const title = String(payload.Title).trim();
      const businessId = payload.BusinessId as number | undefined;
      if (await this.projectTitleExists(title, businessId, itemId)) {
        throw new Error(`"${title}" already exists for the selected business.`);
      }
    }

    await this.rest.updateItem(resolvedListTitle, itemId, payload);
    await this.logAudit({
      entity: this.auditEntityForList(resolvedListTitle),
      action: 'UPDATE',
      entityId: String(itemId),
      details: payload
    });
    this.invalidateAfterListMutation(resolvedListTitle);
  }

  private async getLookupSnapshot(
    listTitle: string,
    id: number
  ): Promise<Record<string, unknown> | undefined> {
    // This snapshot is only used to enrich the audit log entry. It must never
    // block the delete itself, and it is shared across lists with different
    // schemas, so query only the universally-present fields and swallow errors.
    try {
      const items = await this.rest.getItems<Record<string, unknown>>(
        listTitle,
        'Id,Title',
        undefined,
        `Id eq ${id}`,
        undefined,
        1
      );
      return items[0];
    } catch {
      return undefined;
    }
  }

  private assetToAuditRecord(risk: IAsset): Record<string, unknown> {
    return {
      Title: risk.Title,
      AM_AssetId: risk.AM_AssetId,
      AM_Status: risk.AM_Status,
      AM_Category: risk.AM_Category?.Title,
      AM_Project: risk.AM_Project?.Title,
      Likelihood: risk.Likelihood,
      Consequence: risk.Consequence,
      AssignedTo: risk.AssignedTo?.map((user) => user.Title).join(', ')
    };
  }

  private assetInputToAuditRecord(input: IAssetSaveInput): Record<string, unknown> {
    return {
      Title: input.Title,
      AM_Status: input.AM_Status,
      AM_CategoryId: input.AM_CategoryId,
      AM_SubCategoryId: input.AM_SubCategoryId,
      AM_ProjectId: input.AM_ProjectId,
      Likelihood: input.Likelihood,
      Consequence: input.Consequence
    };
  }

  public async getAssets(filter?: string, options?: Parameters<AssetService['getRisks']>[1]): Promise<IAsset[]> {
    return this.getRisks(filter, options);
  }

  public async createAsset(input: IAssetSaveInput): Promise<number> {
    return this.createRisk(input);
  }

  public async updateAsset(id: number, input: IAssetSaveInput): Promise<void> {
    return this.updateRisk(id, input);
  }
}
