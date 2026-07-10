import { SPHttpClient } from '@microsoft/sp-http';

import {

  BUSINESS_LIST_TITLE,

  FORM_TEMPLATES_LIST_TITLE,

  COMPLIANCE_FRAMEWORKS_LIST_TITLE,

  COMPLIANCE_CONTROLS_LIST_TITLE,

  COMPLIANCE_ASSESSMENTS_LIST_TITLE,

  COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE,

  ASSET_CONTROL_LINKS_LIST_TITLE,

  IListDefinition,

  LEGACY_BUSINESS_LIST_TITLE,

  CATEGORIES_LIST_TITLE,

  PROJECTS_LIST_TITLE,

  REQUIRED_LIST_TITLES,

  SUB_CATEGORIES_LIST_TITLE,

  ASSET_TYPES_LIST_TITLE,

  ASSET_STATUSES_LIST_TITLE,

  VENDORS_LIST_TITLE,

  LOCATIONS_LIST_TITLE,

  ASSET_MANAGEMENT_LISTS,

  APP_MANAGED_LIST_TITLES,

  ASSETS_LIST_TITLE,

  ASSIGNMENTS_LIST_TITLE,

  SOFTWARE_LICENSES_LIST_TITLE,

  MAINTENANCE_LIST_TITLE,

  INVENTORY_LIST_TITLE,

  ASSET_REQUESTS_LIST_TITLE,

  ADMINISTRATORS_LIST_TITLE,

  LICENSES_LIST_TITLE,

  SETTINGS_LIST_TITLE

} from '../models/IListDefinitions';

import { SharePointFieldValue } from '../utils/sharePointFieldPayload';

import { IProvisioningListStatus, IProvisioningStatus, IProvisioningStep } from '../models/IAsset';

import { SharePointRestService } from './SharePointRestService';
import { SETUP_FULL_CONTROL_REQUIRED_MESSAGE } from '../utils/sitePermissions';
import { getListProgressLabel, PROVISIONING_PROGRESS } from '../utils/provisioningProgressLabels';
import { AssetService } from './AssetService';
import {
  buildSeedExistenceFilters,
  dedupeSeedRows,
  getSeedRowKey,
  indexExistingSeedKeys,
  isSeedRowIndexed,
  itemMatchesSeedCatalog,
  markSeedRowIndexed,
  type SeedRow
} from '../utils/seedDedup';
import {
  canRunAutomaticSampleSeed,
  isSampleDataSeeded,
  SAMPLE_DATA_SEEDED_VALUE
} from '../utils/sampleDataSeed';
import { DEFAULT_FORM_TEMPLATES } from '../lib/form-templates/defaults';
import {
  ASSET_SEED_IMAGE_FILE_NAME,
  buildSeedAssetImageBuffer,
  resolveAssetImageSeedKey
} from '../constants/assetSeedImageData';
import { resolveAssetImageUrl } from '../utils/assetImage';
import {
  COMPLIANCE_ASSESSMENT_SEED_DATA,
  COMPLIANCE_BUILT_IN_FRAMEWORKS
} from '../constants/complianceSeedData';
import { ASSET_CONTROL_LINK_SEED_DATA } from '../constants/assetControlLinkSeedData';
import type { IClearSeedDataFailure, IClearSeedDataResult } from '../models/IAsset';



export interface IProvisioningResult {

  success: boolean;

  listIds: Record<string, string>;

  error?: string;

}

export interface IProvisionAllOptions {
  /** When false, only lookup/reference rows are seeded — no sample assets or licenses. Defaults to true. */
  includeSampleData?: boolean;
}

const SAMPLE_CONTENT_LIST_TITLES = new Set<string>([
  ASSETS_LIST_TITLE,
  SOFTWARE_LICENSES_LIST_TITLE
]);

/** Maps seed/API lookup Id keys to SharePoint column internal names on AM_Assets. */
const ASSET_SEED_LOOKUP_FIELD_MAP: Array<{
  payloadKey: string;
  internalName: string;
  displayName: string;
}> = [
  { payloadKey: 'AM_CategoryId', internalName: 'AM_Category', displayName: 'Category' },
  { payloadKey: 'AM_SubCategoryId', internalName: 'AM_SubCategory', displayName: 'Sub-Category' },
  { payloadKey: 'AM_AssetTypeId', internalName: 'AM_AssetType', displayName: 'Asset Type' },
  { payloadKey: 'AM_StatusId', internalName: 'AM_Status', displayName: 'Status' },
  { payloadKey: 'AM_VendorId', internalName: 'AM_Vendor', displayName: 'Vendor' },
  { payloadKey: 'AM_LocationId', internalName: 'AM_Location', displayName: 'Location' },
  { payloadKey: 'AM_ProjectId', internalName: 'AM_Project', displayName: 'Project' },
  { payloadKey: 'AM_AssignedToId', internalName: 'AM_AssignedTo', displayName: 'Assigned To' }
];



const SETTINGS_LISTS = [ADMINISTRATORS_LIST_TITLE, LICENSES_LIST_TITLE, SETTINGS_LIST_TITLE];

// Operations lists carry required lookups to AM_Assets, so they must be created AFTER the
// asset register exists (otherwise field provisioning throws "Lookup list AM_Assets not found").
const OPERATIONS_LISTS = [
  ASSIGNMENTS_LIST_TITLE,
  SOFTWARE_LICENSES_LIST_TITLE,
  MAINTENANCE_LIST_TITLE,
  INVENTORY_LIST_TITLE,
  ASSET_REQUESTS_LIST_TITLE
];

/** Lists where optional columns must still be provisioned (seed/CRUD depend on the full schema). */
const FULL_SCHEMA_LIST_TITLES = new Set<string>([ASSETS_LIST_TITLE, ...OPERATIONS_LISTS]);

const SEED_HELPER_FIELD_KEYS = new Set([
  'ParentCategoryTitle',
  'BusinessTitle',
  'CategoryTitle',
  'SubCategoryTitle',
  'AssetTypeTitle',
  'StatusTitle',
  'VendorTitle',
  'LocationTitle',
  'ProjectTitle',
  'RiskCategoryTitle',
  'RiskProfileTypeTitle',
  'RiskResponseTitle',
  'RiskStrategyTitle',
  'AssignToCurrentUser'
]);

function isTruthySeedFlag(value: string | number | boolean | undefined): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  const text = String(value ?? '').trim().toLowerCase();
  return text === 'true' || text === '1' || text === 'yes';
}



export class ListProvisioningService {

  private readonly rest: SharePointRestService;

  private readonly spHttpClient: SPHttpClient;

  private readonly webUrl: string;

  private riskService?: AssetService;

  private readonly listIds: Record<string, string> = {};

  private refreshListsPromise?: Promise<void>;

  private appListsHiddenThisSession = false;

  private extensionsRegisteredThisSession = false;

  /** Serializes all seed passes so Refresh / Setup cannot insert duplicates concurrently. */
  private exclusiveSeedLock: Promise<unknown> = Promise.resolve();



  constructor(spHttpClient: SPHttpClient, webUrl: string) {

    this.spHttpClient = spHttpClient;
    this.webUrl = webUrl;
    this.rest = new SharePointRestService(spHttpClient, webUrl);

  }

  private getAssetService(): AssetService {
    if (!this.riskService) {
      this.riskService = new AssetService(this.spHttpClient, this.webUrl);
    }
    return this.riskService;
  }



  public async checkProvisioningNeeded(): Promise<boolean> {
    const status = await this.getProvisioningStatus();
    return !status.isComplete;
  }

  public async getProvisioningStatus(options?: { fast?: boolean }): Promise<IProvisioningStatus> {
    await this.refreshExistingLists();
    await this.hideAppListsFromSiteContentsIfNeeded();
    await this.ensureSiteExtensionsRegistered();

    const lists: IProvisioningListStatus[] = [];
    const fast = options?.fast === true;

    for (const title of REQUIRED_LIST_TITLES) {
      const listId = this.listIds[title];
      const exists = Boolean(listId);
      let ready = false;

      if (exists && listId) {
        const def = ASSET_MANAGEMENT_LISTS.find((list) => list.title === title);
        if (fast || !def || def.fields.length === 0) {
          ready = true;
        } else {
          const fieldNames = this.getSchemaCheckFieldNames(def);
          const missing = await this.rest.listMissingFields(listId, fieldNames);
          ready = missing.length === 0;
        }
      } else if (title === BUSINESS_LIST_TITLE) {
        const legacy = await this.rest.getListByTitle(LEGACY_BUSINESS_LIST_TITLE);
        if (legacy) {
          this.listIds[BUSINESS_LIST_TITLE] = legacy.Id;
          const def = ASSET_MANAGEMENT_LISTS.find((list) => list.title === title);
          if (fast || !def || def.fields.length === 0) {
            ready = true;
          } else {
            const fieldNames = this.getSchemaCheckFieldNames(def);
            const missing = await this.rest.listMissingFields(legacy.Id, fieldNames);
            ready = missing.length === 0;
          }
          lists.push({ title, exists: true, ready });
          continue;
        }
      }

      lists.push({ title, exists, ready });
    }

    const notReady = lists.filter((list) => !list.ready);
    const missingLists = notReady.map((list) =>
      list.exists ? `${list.title} (incomplete)` : list.title
    );

    return {
      isComplete: notReady.length === 0,
      missingCount: notReady.length,
      existingCount: lists.filter((list) => list.ready).length,
      totalCount: lists.length,
      lists,
      missingLists
    };
  }



  public async provisionAll(

    onStepUpdate: (steps: IProvisioningStep[]) => void,

    steps: IProvisioningStep[],

    options?: IProvisionAllOptions

  ): Promise<IProvisioningResult> {

    try {

      this.updateStep(steps, 'check', 'running', onStepUpdate, PROVISIONING_PROGRESS.checkingAccess);

      await this.refreshExistingLists();

      const setupAccess = await this.rest.isCurrentUserSiteOwner();
      if (!setupAccess.isSiteOwner) {
        const message = setupAccess.message || SETUP_FULL_CONTROL_REQUIRED_MESSAGE;
        this.updateStep(steps, 'check', 'error', onStepUpdate, message);
        return { success: false, listIds: { ...this.listIds }, error: message };
      }

      this.updateStep(steps, 'check', 'done', onStepUpdate);

      await this.yieldToUi();



      const lookupLists = ASSET_MANAGEMENT_LISTS.filter(
        (list) =>
          ![
            ASSETS_LIST_TITLE,
            ...SETTINGS_LISTS,
            ...OPERATIONS_LISTS,
            FORM_TEMPLATES_LIST_TITLE,
            COMPLIANCE_FRAMEWORKS_LIST_TITLE,
            COMPLIANCE_CONTROLS_LIST_TITLE,
            COMPLIANCE_ASSESSMENTS_LIST_TITLE,
            COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE,
            ASSET_CONTROL_LINKS_LIST_TITLE
          ].includes(list.title)
      );



      this.updateStep(steps, 'lookup', 'running', onStepUpdate);

      for (const def of lookupLists) {

        this.updateStep(steps, 'lookup', 'running', onStepUpdate, getListProgressLabel(def.title));

        if (def.title === SUB_CATEGORIES_LIST_TITLE) {
          await this.resolveLookupListId(CATEGORIES_LIST_TITLE);
          const categoriesList = await this.rest.getListByTitle(CATEGORIES_LIST_TITLE);
          if (categoriesList) {
            await this.rest.waitForListReady(categoriesList.Id, 16, 500);
          }
          await this.yieldToUi();
        }

        if (def.title === PROJECTS_LIST_TITLE) {
          await this.ensureBusinessListReady();
          const businessList = await this.rest.getListByTitle(
            await this.resolveBusinessListTitle()
          );
          if (businessList) {
            await this.rest.waitForListReady(businessList.Id, 16, 500);
          }
          await this.yieldToUi();
        }

        await this.ensureList(def);

        await this.yieldToUi();

      }

      this.updateStep(steps, 'lookup', 'done', onStepUpdate);

      await this.yieldToUi();

      await this.restDelay(1000);

      const formTemplatesDef = ASSET_MANAGEMENT_LISTS.find(
        (list) => list.title === FORM_TEMPLATES_LIST_TITLE
      );
      if (formTemplatesDef) {
        this.updateStep(steps, 'settings', 'running', onStepUpdate, getListProgressLabel(formTemplatesDef.title));
        await this.ensureList(formTemplatesDef);
        await this.yieldToUi();
      }

      this.updateStep(steps, 'settings', 'running', onStepUpdate);

      for (const title of SETTINGS_LISTS) {

        const def = ASSET_MANAGEMENT_LISTS.find((list) => list.title === title);

        if (def) {

          this.updateStep(steps, 'settings', 'running', onStepUpdate, getListProgressLabel(def.title));

          try {
            await this.ensureList(def);
          } catch (error) {
            const detail = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Settings list "${title}": ${detail}`);
          }

          await this.yieldToUi();

        }

      }

      this.updateStep(steps, 'settings', 'done', onStepUpdate);

      await this.yieldToUi();



      // The asset register must exist before the operations lists, which carry required
      // Lookup columns pointing at AM_Assets. Creating it here (not in the lookup phase)
      // guarantees the dependency order and lets field provisioning resolve the lookup target.
      this.updateStep(steps, 'assets', 'running', onStepUpdate, getListProgressLabel(ASSETS_LIST_TITLE));

      const assetsDef = ASSET_MANAGEMENT_LISTS.find((list) => list.title === ASSETS_LIST_TITLE);

      if (assetsDef) {

        await this.ensureList(assetsDef);

      }

      const assetsListId = this.listIds[ASSETS_LIST_TITLE];

      if (assetsListId) {

        await this.rest.waitForListReady(assetsListId, 16, 500);

      }

      await this.ensureSiteExtensionsRegistered(true);

      this.updateStep(steps, 'assets', 'done', onStepUpdate);

      await this.yieldToUi();

      this.updateStep(steps, 'operations', 'running', onStepUpdate);

      for (const title of OPERATIONS_LISTS) {

        const def = ASSET_MANAGEMENT_LISTS.find((list) => list.title === title);

        if (def) {

          this.updateStep(steps, 'operations', 'running', onStepUpdate, getListProgressLabel(def.title));

          try {
            await this.ensureList(def);
          } catch (error) {
            const detail = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Operations list "${title}": ${detail}`);
          }

          await this.yieldToUi();

        }

      }

      this.updateStep(steps, 'operations', 'done', onStepUpdate);

      await this.yieldToUi();

      this.updateStep(steps, 'seed', 'running', onStepUpdate, PROVISIONING_PROGRESS.seedingLookups);

      await this.ensureBusinessListReady();

      const includeSampleData = options?.includeSampleData !== false;
      const sampleAlreadySeeded = await this.isAutomaticSampleSeedLocked();

      await this.seedLookupDefaults(onStepUpdate, steps);

      if (includeSampleData && !sampleAlreadySeeded) {
        this.updateStep(steps, 'seed', 'running', onStepUpdate, PROVISIONING_PROGRESS.seedingSamples);
        await this.seedSampleContent(onStepUpdate, steps);
        await this.markSampleDataSeeded();
        this.updateStep(steps, 'seed', 'done', onStepUpdate);
      } else if (sampleAlreadySeeded) {
        this.updateStep(steps, 'seed', 'done', onStepUpdate, PROVISIONING_PROGRESS.samplesAlreadyPresent);
      } else {
        await this.markSampleDataSkipped();
        this.updateStep(steps, 'seed', 'done', onStepUpdate, PROVISIONING_PROGRESS.samplesSkipped);
      }

      await this.yieldToUi();

      await this.seedCurrentAdministrator();

      await this.hideAppListsFromSiteContentsIfNeeded(true);

      this.updateStep(steps, 'ready', 'done', onStepUpdate);



      return { success: true, listIds: { ...this.listIds } };

    } catch (error) {

      const message = error instanceof Error ? error.message : 'Provisioning failed';

      const runningStep = steps.find((step) => step.status === 'running');

      if (runningStep) {

        this.updateStep(steps, runningStep.id, 'error', onStepUpdate, message);

      }

      return { success: false, listIds: { ...this.listIds }, error: message };

    }

  }



  private async refreshExistingLists(): Promise<void> {
    const existingLists = await this.rest.getListsByTitles([
      ...ASSET_MANAGEMENT_LISTS.map((def) => def.title),
      LEGACY_BUSINESS_LIST_TITLE
    ]);
    const businessList =
      existingLists.get(BUSINESS_LIST_TITLE) || existingLists.get(LEGACY_BUSINESS_LIST_TITLE);

    for (const def of ASSET_MANAGEMENT_LISTS) {
      const list = def.title === BUSINESS_LIST_TITLE ? businessList : existingLists.get(def.title);
      if (list) {
        this.listIds[def.title] = list.Id;
      } else {
        delete this.listIds[def.title];
      }
    }

    if (businessList) {
      this.listIds[BUSINESS_LIST_TITLE] = businessList.Id;
      this.listIds[businessList.Title] = businessList.Id;
    }
  }



  private async buildFieldDefinitions(def: IListDefinition): Promise<
    Array<{
      internalName: string;
      displayName: string;
      type: string;
      required?: boolean;
      choices?: string[];
      lookupListId?: string;
      lookupField?: string;
      format?: string;
      hidden?: boolean;
      defaultValue?: string;
      richText?: boolean;
      appendOnly?: boolean;
      optional?: boolean;
      userSelectionMode?: 'PeopleOnly' | 'PeopleAndGroups';
    }>
  > {
    const fieldDefinitions = [];

    for (const field of def.fields) {
      const lookupListId = field.lookupListTitle
        ? await this.resolveLookupListId(field.lookupListTitle)
        : undefined;

      fieldDefinitions.push({
        internalName: field.internalName,
        displayName: field.displayName,
        type: field.type,
        required: field.required,
        choices: field.choices,
        lookupListId,
        lookupField: field.lookupField,
        format: field.format,
        hidden: field.hidden,
        defaultValue: field.defaultValue,
        richText: field.richText,
        appendOnly: field.appendOnly,
        optional: field.optional,
        userSelectionMode: field.userSelectionMode
      });
    }

    return fieldDefinitions;
  }

  /** Ensure list schema on an existing list (supports legacy title aliases such as "Business"). */
  private async ensureListFieldsOnList(
    def: IListDefinition,
    listTitle: string,
    listId: string,
    repairDepth = 0,
    listPreExisted = false
  ): Promise<void> {
    const MAX_REPAIR_DEPTH = 2;

    if (def.titleFieldDisplayName) {
      try {
        await this.rest.setTitleFieldDisplayName(listId, def.titleFieldDisplayName);
      } catch {
        /* Title rename is optional when the list already exists */
      }
    }

    const fieldDefinitions = await this.buildFieldDefinitions(def);

    if (fieldDefinitions.length > 0) {
      const requiredFieldNames = fieldDefinitions
        .filter((field) => !field.optional)
        .map((field) => field.internalName);
      const schemaRepairFieldNames = FULL_SCHEMA_LIST_TITLES.has(def.title)
        ? fieldDefinitions.map((field) => field.internalName)
        : requiredFieldNames;
      const missingBeforeRepair = await this.rest.listMissingFields(listId, schemaRepairFieldNames);

      // Only recycle when the list has a partial/broken schema (some fields exist, others do not),
      // or when a pre-existing empty list has no custom columns yet (common after failed upgrades).
      // A brand-new empty list legitimately has every custom field "missing" until ensureAllFields runs.
      const hasPartialSchema =
        missingBeforeRepair.length > 0 &&
        missingBeforeRepair.length < schemaRepairFieldNames.length;
      const hasEmptyLegacySchema =
        listPreExisted &&
        missingBeforeRepair.length === schemaRepairFieldNames.length &&
        schemaRepairFieldNames.length > 0;

      if ((hasPartialSchema || hasEmptyLegacySchema) && repairDepth < MAX_REPAIR_DEPTH) {
        const listInfo = await this.rest.getListByTitle(listTitle);
        if (listInfo && listInfo.ItemCount === 0) {
          await this.rest.recycleList(listId);
          delete this.listIds[def.title];
          delete this.listIds[listTitle];
          this.rest.clearMissingListTitle(listTitle);
          const newListId = await this.resolveListId(def.title, def.description);
          await this.yieldToUi();
          await this.ensureListFieldsOnList(def, def.title, newListId, repairDepth + 1, false);
          return;
        }
      }

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          await this.rest.ensureAllFields(listId, fieldDefinitions, listTitle);
          if (FULL_SCHEMA_LIST_TITLES.has(def.title)) {
            await this.ensureListSchemaVerified(listId, fieldDefinitions, listTitle);
          }
          break;
        } catch (error) {
          const message = error instanceof Error ? error.message : '';
          const isRepairableFieldError =
            message.includes('missing required fields') ||
            message.includes('instead of') ||
            message.includes('Failed to create field');
          const canRetry =
            attempt === 0 &&
            isRepairableFieldError &&
            repairDepth < MAX_REPAIR_DEPTH &&
            (await this.rest.getListByTitle(listTitle))?.ItemCount === 0;

          if (!canRetry) {
            throw error;
          }

          await this.rest.recycleList(listId);
          delete this.listIds[def.title];
          delete this.listIds[listTitle];
          this.rest.clearMissingListTitle(listTitle);
          const newListId = await this.resolveListId(def.title, def.description);
          await this.yieldToUi();
          await this.ensureListFieldsOnList(def, def.title, newListId, repairDepth + 1, false);
          return;
        }
      }

      await this.yieldToUi();
    }

    await this.hideListFromSiteContents(listId);

    if (def.title === 'AM_Assets') {
      await this.rest.ensureListAttachmentsEnabled(listId);
    }
  }

  private getSchemaCheckFieldNames(def: IListDefinition): string[] {
    if (FULL_SCHEMA_LIST_TITLES.has(def.title)) {
      return def.fields.map((field) => field.internalName);
    }

    return def.fields.filter((field) => !field.optional).map((field) => field.internalName);
  }

  /** Re-provision and verify all columns on lists where optional fields are still required in practice. */
  private async ensureListSchemaVerified(
    listId: string,
    fieldDefinitions: Array<{
      internalName: string;
      displayName: string;
      type: string;
      required?: boolean;
      choices?: string[];
      lookupListId?: string;
      lookupField?: string;
      format?: string;
      hidden?: boolean;
      defaultValue?: string;
      richText?: boolean;
      appendOnly?: boolean;
      optional?: boolean;
      userSelectionMode?: 'PeopleOnly' | 'PeopleAndGroups';
    }>,
    listTitle: string
  ): Promise<void> {
    const assetFieldNames = fieldDefinitions.map((field) => field.internalName);
    let missingFields = await this.rest.listMissingFields(listId, assetFieldNames);

    if (missingFields.length > 0) {
      for (const internalName of missingFields) {
        const field = fieldDefinitions.find((item) => item.internalName === internalName);
        if (field) {
          await this.rest.ensureField(listId, field);
        }
      }
    }

    missingFields = await this.rest.listMissingFields(listId, assetFieldNames);
    if (missingFields.length > 0) {
      await this.rest.waitForFields(listId, missingFields, {
        attempts: 40,
        delayMs: 500,
        listTitle
      });
    }
  }

  private async ensureList(def: IListDefinition): Promise<void> {
    const existing = await this.rest.getListByTitle(def.title);
    const listPreExisted = Boolean(existing);
    const listId = await this.resolveListId(def.title, def.description);
    this.rest.clearMissingListTitle(def.title);
    await this.yieldToUi();
    await this.ensureListFieldsOnList(def, def.title, listId, 0, listPreExisted);
  }

  /** Re-provision AM_Assets columns before sample seeding (repairs empty legacy/broken lists). */
  private async ensureAssetsListReadyForSeed(def: IListDefinition): Promise<string> {
    const fieldDefinitions = await this.buildFieldDefinitions(def);
    const schemaFieldNames = fieldDefinitions.map((field) => field.internalName);

    const repairEmptyAssetsList = async (): Promise<string> => {
      const existing = await this.rest.getListByTitle(def.title);
      if (!existing || (existing.ItemCount ?? 0) > 0) {
        return this.listIds[def.title];
      }

      await this.rest.recycleList(existing.Id);
      delete this.listIds[def.title];
      this.rest.clearMissingListTitle(def.title);
      const newListId = await this.resolveListId(def.title, def.description);
      await this.ensureListFieldsOnList(def, def.title, newListId, 0, false);
      return newListId;
    };

    await this.ensureList(def);
    let listId = this.listIds[def.title];
    let missing = await this.rest.listMissingFields(listId, schemaFieldNames);

    if (missing.length > 0) {
      await this.ensureListSchemaVerified(listId, fieldDefinitions, def.title);
      missing = await this.rest.listMissingFields(listId, schemaFieldNames);
    }

    if (missing.length > 0) {
      listId = await repairEmptyAssetsList();
      missing = await this.rest.listMissingFields(listId, schemaFieldNames);
    }

    if (missing.length > 0) {
      await this.rest.waitForFields(listId, missing, {
        attempts: 40,
        delayMs: 500,
        listTitle: def.title
      });
    }

    return listId;
  }



  private async hideListFromSiteContents(listId: string): Promise<void> {
    await this.rest.setListHidden(listId, true);
  }

  private async hideAppListsFromSiteContentsIfNeeded(force = false): Promise<void> {
    if (this.appListsHiddenThisSession && !force) {
      return;
    }

    const listIds = new Set<string>();
    for (const title of APP_MANAGED_LIST_TITLES) {
      const listId = this.listIds[title];
      if (listId) {
        listIds.add(listId);
      }
    }

    for (const listId of listIds) {
      await this.hideListFromSiteContents(listId);
      await this.yieldToUi();
    }

    this.appListsHiddenThisSession = true;
  }

  /** Register SPFx extensions (form customizer) for SharePoint Online tenant-wide deploy. */
  public async ensureSiteExtensionsRegistered(force = false): Promise<void> {
    if (this.extensionsRegisteredThisSession && !force) {
      return;
    }

    const risksListId = this.listIds.Risks;
    let listId: string | undefined = risksListId;

    if (!listId) {
      const risksList = await this.rest.getListByTitle('AM_Assets');
      listId = risksList?.Id;
    }

    if (!listId) {
      return;
    }

    await this.rest.ensureAssetFormCustomizerRegistered(listId);
    this.extensionsRegisteredThisSession = true;
  }



  private isLookupSeedList(def: IListDefinition): boolean {
    return Boolean(def.seedData?.length) && !SAMPLE_CONTENT_LIST_TITLES.has(def.title);
  }

  private async seedLookupDefaults(

    onStepUpdate: (steps: IProvisioningStep[]) => void,

    steps: IProvisioningStep[]

  ): Promise<void> {

    await this.enqueueExclusiveSeed(async () => {
      for (const def of ASSET_MANAGEMENT_LISTS) {
        if (!this.isLookupSeedList(def)) {
          continue;
        }

        this.updateStep(steps, 'seed', 'running', onStepUpdate, getListProgressLabel(def.title));
        await this.seedListData(def, onStepUpdate, steps);
      }

      const categories = await this.rest.getAllItems<{ Id: number; Title: string }>(
        CATEGORIES_LIST_TITLE,
        'Id,Title'
      );
      if (categories.length > 0) {
        await this.getAssetService().seedDefaultFormTemplates(categories);
      }
    });

  }

  private async seedSampleContent(

    onStepUpdate: (steps: IProvisioningStep[]) => void,

    steps: IProvisioningStep[]

  ): Promise<void> {

    await this.enqueueExclusiveSeed(async () => {
      for (const def of ASSET_MANAGEMENT_LISTS) {
        if (!SAMPLE_CONTENT_LIST_TITLES.has(def.title) || !def.seedData?.length) {
          continue;
        }

        this.updateStep(steps, 'seed', 'running', onStepUpdate, getListProgressLabel(def.title));
        await this.seedListData(def, onStepUpdate, steps);
      }
    });

  }

  /** Insert any sample rows that are defined in code but not yet in SharePoint lists. */
  public async seedMissingSampleData(options?: { force?: boolean }): Promise<number> {
    return this.enqueueExclusiveSeed(() => this.runSeedMissingSampleData(options));
  }

  /** Re-seed sample rows even when automatic seeding is locked (site owner recovery). */
  public async restoreSampleData(): Promise<number> {
    return this.seedMissingSampleData({ force: true });
  }

  private async runSeedMissingSampleData(options?: { force?: boolean }): Promise<number> {
    if (await this.isAutomaticSampleSeedLocked(options)) {
      return 0;
    }

    await this.refreshExistingListsCached();
    let added = 0;
    for (const def of ASSET_MANAGEMENT_LISTS) {
      if (!SAMPLE_CONTENT_LIST_TITLES.has(def.title) || !def.seedData?.length) {
        continue;
      }
      added += await this.seedListData(def);
    }
    await this.markSampleDataSeeded();
    return added;
  }

  private async isAutomaticSampleSeedLocked(options?: { force?: boolean }): Promise<boolean> {
    if (options?.force) {
      return false;
    }

    const settings = await this.getAssetService().getAppSettings();
    if (!canRunAutomaticSampleSeed(settings)) {
      return true;
    }

    if (await this.siteHasLegacySampleContent()) {
      await this.markSampleDataSeeded();
      return true;
    }

    return false;
  }

  /** Sites provisioned before SampleDataSeeded existed already have sample assets — lock without re-seeding. */
  private async siteHasLegacySampleContent(): Promise<boolean> {
    const assets = await this.rest.getListByTitle(ASSETS_LIST_TITLE);
    return (assets?.ItemCount ?? 0) > 0;
  }

  private async markSampleDataSeeded(): Promise<void> {
    const settings = await this.getAssetService().getAppSettings();
    if (!settings?.Id || isSampleDataSeeded(settings)) {
      return;
    }

    await this.ensureListFieldsReady('AppSettings');
    await this.getAssetService().updateAppSettings(settings.Id, {
      SampleDataSeeded: SAMPLE_DATA_SEEDED_VALUE
    });
  }

  private async markSampleDataSkipped(): Promise<void> {
    const settings = await this.getAssetService().getAppSettings();
    if (!settings?.Id || isSampleDataSeeded(settings)) {
      return;
    }

    await this.ensureListFieldsReady('AppSettings');
    await this.getAssetService().updateAppSettings(settings.Id, {
      SampleDataSeeded: 'No'
    });
  }

  private async seedListData(
    def: IListDefinition,
    onStepUpdate?: (steps: IProvisioningStep[]) => void,
    steps?: IProvisioningStep[]
  ): Promise<number> {
    const dedupedDef = this.withDedupedSeedData(def);
    if (!dedupedDef.seedData?.length) {
      return 0;
    }

    if (dedupedDef.title === SUB_CATEGORIES_LIST_TITLE) {
      await this.seedSubCategories(dedupedDef);
      return 0;
    }

    if (dedupedDef.title === PROJECTS_LIST_TITLE) {
      await this.seedProjects(dedupedDef);
      return 0;
    }

    if (dedupedDef.title === SOFTWARE_LICENSES_LIST_TITLE) {
      return this.seedSoftwareLicenses(dedupedDef);
    }

    if (dedupedDef.title === ASSETS_LIST_TITLE) {
      return this.seedAssets(dedupedDef, onStepUpdate, steps);
    }

    return this.seedSimpleList(dedupedDef);
  }

  private async resolveOperationalListTitle(def: IListDefinition): Promise<string | undefined> {
    if (def.title === BUSINESS_LIST_TITLE) {
      return (
        (await this.rest.resolveListTitleAlias(BUSINESS_LIST_TITLE, LEGACY_BUSINESS_LIST_TITLE)) ??
        undefined
      );
    }

    const list = await this.rest.getListByTitle(def.title);
    return list ? def.title : undefined;
  }

  private async loadExistingSeedKeyIndex(
    operationalListTitle: string,
    def: IListDefinition
  ): Promise<Set<string>> {
    try {
      if (def.title === PROJECTS_LIST_TITLE) {
        const items = await this.rest.getAllItems<Record<string, unknown>>(
          operationalListTitle,
          'Title,AM_Code'
        );
        return indexExistingSeedKeys(PROJECTS_LIST_TITLE, items);
      }

      if (def.title === BUSINESS_LIST_TITLE) {
        const items = await this.rest.getAllItems<Record<string, unknown>>(
          operationalListTitle,
          'Title,BusinessCode'
        );
        return indexExistingSeedKeys(BUSINESS_LIST_TITLE, items);
      }

      if (def.title === SUB_CATEGORIES_LIST_TITLE) {
        const items = await this.rest.getAllItems<Record<string, unknown>>(
          operationalListTitle,
          'Title,AM_ParentCategory/Id,AM_ParentCategory/Title',
          'AM_ParentCategory'
        );
        return indexExistingSeedKeys(SUB_CATEGORIES_LIST_TITLE, items);
      }

      if (def.title === ASSETS_LIST_TITLE) {
        const items = await this.rest.getAllItems<Record<string, unknown>>(
          operationalListTitle,
          'Title,AM_AssetId,AM_SerialNumber'
        );
        return indexExistingSeedKeys(ASSETS_LIST_TITLE, items);
      }

      const hasRating = def.fields.some((field) => field.internalName === 'Rating');
      const select = hasRating ? 'Title,Rating' : 'Title';
      const items = await this.rest.getAllItems<Record<string, unknown>>(
        operationalListTitle,
        select
      );
      return indexExistingSeedKeys(def.title, items);
    } catch {
      return new Set<string>();
    }
  }

  private async seedSimpleList(def: IListDefinition): Promise<number> {
    const operationalTitle = await this.resolveOperationalListTitle(def);
    if (!operationalTitle) {
      return 0;
    }

    const list = await this.rest.getListByTitle(operationalTitle);
    if (!list) {
      return 0;
    }

    await this.ensureList(def);
    const listId = list.Id;
    this.listIds[def.title] = listId;
    this.listIds[operationalTitle] = listId;
    const seedFieldNames: string[] = [];
    const customFieldNames = def.fields.map((field) => field.internalName);

    def.seedData!.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (SEED_HELPER_FIELD_KEYS.has(key)) {
          return;
        }

        if (key !== 'Title' && customFieldNames.indexOf(key) < 0) {
          return;
        }

        if (seedFieldNames.indexOf(key) < 0) {
          seedFieldNames.push(key);
        }
      });
    });

    await this.rest.waitForFields(listId, [...seedFieldNames, ...customFieldNames], {
      attempts: 24,
      delayMs: 500,
      listTitle: def.title
    });

    let added = 0;
    const keyIndex = await this.loadExistingSeedKeyIndex(operationalTitle, def);
    for (const row of def.seedData!) {
      const title = String(row.Title || '');
      const rowKey = getSeedRowKey(def.title, row);
      if (!title || !rowKey) {
        continue;
      }

      if (isSeedRowIndexed(keyIndex, def.title, row)) {
        continue;
      }

      if (await this.isSeedRowAlreadyInList(def.title, operationalTitle, row)) {
        markSeedRowIndexed(keyIndex, def.title, row);
        continue;
      }

      await this.rest.addListItemResolved(operationalTitle, listId, row, def.fields);
      markSeedRowIndexed(keyIndex, def.title, row);
      added += 1;
      await this.yieldToUi();
    }

    return added;
  }



  private enqueueExclusiveSeed<T>(work: () => Promise<T>): Promise<T> {
    const run = this.exclusiveSeedLock.then(work, work);
    this.exclusiveSeedLock = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  private withDedupedSeedData(def: IListDefinition): IListDefinition {
    return {
      ...def,
      seedData: dedupeSeedRows(def.title, def.seedData || [])
    };
  }

  private async isSeedRowAlreadyInList(
    defTitle: string,
    operationalListTitle: string,
    row: SeedRow,
    context?: { parentCategoryId?: number; businessId?: number }
  ): Promise<boolean> {
    const filters = buildSeedExistenceFilters(defTitle, row, context);
    for (const filter of filters) {
      if (await this.rest.itemExistsByFilter(operationalListTitle, filter)) {
        return true;
      }
    }
    return false;
  }

  private async seedSubCategories(def: IListDefinition): Promise<void> {
    const list = await this.rest.getListByTitle(def.title);
    if (!list) {
      return;
    }

    await this.ensureList(def);
    const listId = this.listIds[def.title];
    await this.rest.waitForFields(
      listId,
      ['AM_ParentCategory'],
      { attempts: 24, delayMs: 500, listTitle: def.title }
    );

    const categories = await this.rest.getAllItems<{ Id: number; Title: string }>(
      CATEGORIES_LIST_TITLE,
      'Id,Title'
    );
    const categoryIds: Record<string, number> = {};
    categories.forEach((category) => {
      categoryIds[category.Title] = category.Id;
    });

    const keyIndex = await this.loadExistingSeedKeyIndex(def.title, def);

    for (const row of def.seedData || []) {
      const parentTitle = String(row.ParentCategoryTitle || '');
      const parentId = categoryIds[parentTitle];
      if (!parentId) {
        continue;
      }

      const title = String(row.Title);
      if (!title || isSeedRowIndexed(keyIndex, def.title, row)) {
        continue;
      }

      if (await this.isSeedRowAlreadyInList(def.title, def.title, row, { parentCategoryId: parentId })) {
        markSeedRowIndexed(keyIndex, def.title, row);
        continue;
      }

      await this.rest.addListItemResolved(
        def.title,
        listId,
        {
          Title: title,
          AM_ParentCategoryId: parentId
        },
        def.fields
      );
      markSeedRowIndexed(keyIndex, def.title, row);
      await this.yieldToUi();
    }
  }



  private async seedSoftwareLicenses(def: IListDefinition): Promise<number> {
    const list = await this.rest.getListByTitle(def.title);
    if (!list) {
      return 0;
    }

    await this.ensureList(def);
    const listId = this.listIds[def.title];
    await this.rest.waitForFields(
      listId,
      ['AM_ProductName', 'AM_Vendor', 'AM_TotalSeats', 'AM_UsedSeats', 'AM_AvailableSeats'],
      { attempts: 24, delayMs: 400, listTitle: def.title }
    );

    const vendors = await this.rest.getAllItems<{ Id: number; Title: string }>(
      VENDORS_LIST_TITLE,
      'Id,Title'
    );
    const vendorIds: Record<string, number> = {};
    vendors.forEach((vendor) => {
      vendorIds[vendor.Title] = vendor.Id;
    });

    let added = 0;
    const keyIndex = await this.loadExistingSeedKeyIndex(def.title, def);

    for (const row of def.seedData || []) {
      const title = String(row.Title || '');
      if (!title || isSeedRowIndexed(keyIndex, def.title, row)) {
        continue;
      }

      if (await this.isSeedRowAlreadyInList(def.title, def.title, row)) {
        markSeedRowIndexed(keyIndex, def.title, row);
        continue;
      }

      const payload: Record<string, SharePointFieldValue> = {
        Title: title,
        AM_ProductName: String(row.AM_ProductName || title)
      };

      const vendorTitle = String(row.VendorTitle || '');
      if (vendorTitle && vendorIds[vendorTitle]) {
        payload.AM_VendorId = vendorIds[vendorTitle];
      }
      if (row.AM_TotalSeats !== undefined) {
        payload.AM_TotalSeats = Number(row.AM_TotalSeats);
      }
      if (row.AM_UsedSeats !== undefined) {
        payload.AM_UsedSeats = Number(row.AM_UsedSeats);
      }
      if (row.AM_AvailableSeats !== undefined) {
        payload.AM_AvailableSeats = Number(row.AM_AvailableSeats);
      }
      if (row.AM_ExpiryDate) {
        payload.AM_ExpiryDate = String(row.AM_ExpiryDate);
      }
      if (row.AM_Cost !== undefined) {
        payload.AM_Cost = Number(row.AM_Cost);
      }
      if (row.AM_IsActive !== undefined) {
        payload.AM_IsActive = Boolean(row.AM_IsActive);
      }

      await this.rest.addListItemResolved(def.title, listId, payload, def.fields);
      markSeedRowIndexed(keyIndex, def.title, row);
      added += 1;
      await this.yieldToUi();
    }

    return added;
  }

  private async seedAssets(
    def: IListDefinition,
    onStepUpdate?: (steps: IProvisioningStep[]) => void,
    steps?: IProvisioningStep[]
  ): Promise<number> {
    const list = await this.rest.getListByTitle(def.title);
    if (!list) {
      return 0;
    }

    const listId = await this.ensureAssetsListReadyForSeed(def);
    const assetSeedFieldMap = [
      ...def.fields.map((field) => ({
        payloadKey: field.internalName,
        internalName: field.internalName,
        displayName: field.displayName
      })),
      ...ASSET_SEED_LOOKUP_FIELD_MAP
    ];

    await this.rest.waitForFields(
      listId,
      [
        'AM_Category',
        'AM_SubCategory',
        'AM_AssetType',
        'AM_Status',
        'AM_Vendor',
        'AM_Location',
        'AM_Project',
        'AM_AssignedTo',
        'AM_AssignedDate',
        'AM_SerialNumber',
        'AM_Barcode',
        'AM_Cost',
        'AM_PurchaseDate',
        'AM_WarrantyExpiry',
        'AM_Manufacturer',
        'AM_OS',
        'AM_CPU',
        'AM_TotalMemory',
        'AM_Storage',
        'AM_IMEI',
        'AM_Notes',
        'AM_AssetId',
        'AM_ImageUrl'
      ],
      { attempts: 40, delayMs: 500, listTitle: def.title }
    );

    const [
      categories,
      subCategories,
      assetTypes,
      statuses,
      vendors,
      locations,
      projects
    ] = await Promise.all([
      this.rest.getAllItems<{ Id: number; Title: string }>(CATEGORIES_LIST_TITLE, 'Id,Title'),
      this.rest.getAllItems<{ Id: number; Title: string }>(SUB_CATEGORIES_LIST_TITLE, 'Id,Title'),
      this.rest.getAllItems<{ Id: number; Title: string }>(ASSET_TYPES_LIST_TITLE, 'Id,Title'),
      this.rest.getAllItems<{ Id: number; Title: string }>(ASSET_STATUSES_LIST_TITLE, 'Id,Title'),
      this.rest.getAllItems<{ Id: number; Title: string }>(VENDORS_LIST_TITLE, 'Id,Title'),
      this.rest.getAllItems<{ Id: number; Title: string }>(LOCATIONS_LIST_TITLE, 'Id,Title'),
      this.rest.getAllItems<{ Id: number; Title: string }>(PROJECTS_LIST_TITLE, 'Id,Title')
    ]);

    const toMap = (items: Array<{ Id: number; Title: string }>): Record<string, number> => {
      const map: Record<string, number> = {};
      items.forEach((item) => {
        map[item.Title] = item.Id;
      });
      return map;
    };

    const categoryIds = toMap(categories);
    const subCategoryIds = toMap(subCategories);
    const assetTypeIds = toMap(assetTypes);
    const statusIds = toMap(statuses);
    const vendorIds = toMap(vendors);
    const locationIds = toMap(locations);
    const projectIds = toMap(projects);

    let seededCount = 0;
    let currentUserId: number | undefined;
    try {
      const currentUser = await this.rest.getCurrentUser();
      currentUserId = currentUser.Id;
    } catch {
      currentUserId = undefined;
    }

    const keyIndex = await this.loadExistingSeedKeyIndex(def.title, def);
    const skipExistenceProbe = (list.ItemCount ?? 0) === 0 && keyIndex.size === 0;
    const seedRows = def.seedData || [];
    const totalRows = seedRows.length;
    const createdItemIds: number[] = [];
    let processedRows = 0;

    const reportAssetSeedProgress = (): void => {
      if (!onStepUpdate || !steps || totalRows === 0) {
        return;
      }

      this.updateStep(
        steps,
        'seed',
        'running',
        onStepUpdate,
        PROVISIONING_PROGRESS.sampleAssetsProgress(processedRows, totalRows)
      );
    };

    reportAssetSeedProgress();

    for (const row of seedRows) {
      processedRows += 1;
      const title = String(row.Title || '');
      if (!title || isSeedRowIndexed(keyIndex, def.title, row)) {
        if (processedRows === 1 || processedRows === totalRows || processedRows % 2 === 0) {
          reportAssetSeedProgress();
        }
        continue;
      }

      if (
        !skipExistenceProbe &&
        (await this.isSeedRowAlreadyInList(def.title, def.title, row))
      ) {
        markSeedRowIndexed(keyIndex, def.title, row);
        if (processedRows === 1 || processedRows === totalRows || processedRows % 2 === 0) {
          reportAssetSeedProgress();
        }
        continue;
      }

      const categoryTitle = String(row.CategoryTitle || '');
      const categoryId = categoryIds[categoryTitle];
      if (!categoryId) {
        if (processedRows === 1 || processedRows === totalRows || processedRows % 2 === 0) {
          reportAssetSeedProgress();
        }
        continue;
      }

      const payload: Record<string, SharePointFieldValue> = {
        Title: title,
        AM_AssetId: `SEED-${processedRows}`,
        AM_CategoryId: categoryId
      };

      const subCategoryTitle = String(row.SubCategoryTitle || '');
      if (subCategoryTitle && subCategoryIds[subCategoryTitle]) {
        payload.AM_SubCategoryId = subCategoryIds[subCategoryTitle];
      }

      const assetTypeTitle = String(row.AssetTypeTitle || '');
      if (assetTypeTitle && assetTypeIds[assetTypeTitle]) {
        payload.AM_AssetTypeId = assetTypeIds[assetTypeTitle];
      }

      const statusTitle = String(row.StatusTitle || 'Available');
      if (statusIds[statusTitle]) {
        payload.AM_StatusId = statusIds[statusTitle];
      }

      const vendorTitle = String(row.VendorTitle || '');
      if (vendorTitle && vendorIds[vendorTitle]) {
        payload.AM_VendorId = vendorIds[vendorTitle];
      }

      const locationTitle = String(row.LocationTitle || '');
      if (locationTitle && locationIds[locationTitle]) {
        payload.AM_LocationId = locationIds[locationTitle];
      }

      const projectTitle = String(row.ProjectTitle || '');
      if (projectTitle && projectIds[projectTitle]) {
        payload.AM_ProjectId = projectIds[projectTitle];
      }

      const scalarFields = [
        'AM_SerialNumber',
        'AM_Barcode',
        'AM_Cost',
        'AM_PurchaseDate',
        'AM_WarrantyExpiry',
        'AM_Manufacturer',
        'AM_OS',
        'AM_CPU',
        'AM_TotalMemory',
        'AM_Storage',
        'AM_IMEI',
        'AM_Notes'
      ] as const;

      scalarFields.forEach((fieldName) => {
        const value = row[fieldName];
        if (value !== undefined && value !== null && value !== '') {
          payload[fieldName] =
            fieldName === 'AM_Cost' ? Number(value) : String(value);
        }
      });

      if (isTruthySeedFlag(row.AssignToCurrentUser) && currentUserId) {
        payload.AM_AssignedToId = currentUserId;
        payload.AM_AssignedDate = new Date().toISOString().split('T')[0];
        if (statusIds.Assigned) {
          payload.AM_StatusId = statusIds.Assigned;
        }
      }

      const itemId = await this.rest.addListItemResolved(
        def.title,
        listId,
        payload,
        def.fields,
        5,
        assetSeedFieldMap
      );
      await this.seedAssetImage(def.title, itemId, row);
      createdItemIds.push(itemId);
      markSeedRowIndexed(keyIndex, def.title, row);
      seededCount += 1;
      reportAssetSeedProgress();
      await this.yieldToUi();
    }

    if (createdItemIds.length > 0) {
      await this.getAssetService().assignRiskIdsOnCreateBatch(createdItemIds);
    }

    if ((def.seedData?.length || 0) > 0 && seededCount === 0) {
      const allAlreadyPresent = await this.areAssetSeedRowsPresent(def.title, def.seedData || []);
      if (!allAlreadyPresent) {
        throw new Error(
          'Failed to seed sample assets: lookup values for categories, types, or statuses were not found.'
        );
      }
    }

    return seededCount;
  }

  private async seedAssetImage(
    listTitle: string,
    itemId: number,
    row: Record<string, string | number | boolean>
  ): Promise<void> {
    try {
      const list = await this.rest.getListByTitle(listTitle);
      if (!list) {
        return;
      }

      await this.rest.ensureListAttachmentsEnabled(list.Id);
      const imageKey = resolveAssetImageSeedKey(row);
      const content = buildSeedAssetImageBuffer(imageKey);
      await this.rest.addItemAttachment(listTitle, itemId, ASSET_SEED_IMAGE_FILE_NAME, content);

      const attachments = await this.rest.getItemAttachments(listTitle, itemId);
      const uploaded = attachments.find(
        (attachment) => attachment.FileName === ASSET_SEED_IMAGE_FILE_NAME
      );
      if (!uploaded) {
        return;
      }

      const imageUrl = resolveAssetImageUrl(
        `${new URL(this.webUrl).origin}${uploaded.ServerRelativeUrl}`,
        new URL(this.webUrl).origin
      );
      if (imageUrl) {
        await this.rest.updateItem(listTitle, itemId, { AM_ImageUrl: imageUrl });
      }
    } catch {
      /* Image seeding is best-effort and must not block asset provisioning. */
    }
  }

  private async areAssetSeedRowsPresent(
    listTitle: string,
    seedData: Array<Record<string, string | number | boolean>>
  ): Promise<boolean> {
    for (const row of seedData) {
      const title = String(row.Title || '');
      if (!title) {
        return false;
      }

      if (!(await this.isSeedRowAlreadyInList(ASSETS_LIST_TITLE, listTitle, row))) {
        return false;
      }
    }

    return seedData.length > 0;
  }

  private async seedProjects(def: IListDefinition): Promise<void> {
    const list = await this.rest.getListByTitle(def.title);
    if (!list) {
      return;
    }

    await this.ensureList(def);
    const listId = this.listIds[def.title];
    // AM_Projects is a simple lookup list (Title + AM_Code, AM_Status, AM_Owner).
    await this.rest.waitForFields(listId, ['AM_Code', 'AM_Status'], {
      attempts: 24,
      delayMs: 500,
      listTitle: def.title
    });

    const keyIndex = await this.loadExistingSeedKeyIndex(def.title, def);

    for (const row of def.seedData || []) {
      const title = String(row.Title || '');
      if (!title || isSeedRowIndexed(keyIndex, def.title, row)) {
        continue;
      }

      if (await this.isSeedRowAlreadyInList(def.title, def.title, row)) {
        markSeedRowIndexed(keyIndex, def.title, row);
        continue;
      }

      await this.rest.addListItemResolved(
        def.title,
        listId,
        {
          Title: title,
          ...(row.AM_Code ? { AM_Code: String(row.AM_Code) } : {}),
          AM_Status: String(row.AM_Status || 'Active')
        },
        def.fields
      );
      markSeedRowIndexed(keyIndex, def.title, row);
      await this.yieldToUi();
    }
  }



  private async resolveLookupListId(title: string): Promise<string> {
    if (title === BUSINESS_LIST_TITLE) {
      await this.ensureBusinessListReady();
      const businessTitle = await this.resolveBusinessListTitle();
      const list = await this.rest.getListByTitle(businessTitle);
      if (!list) {
        throw new Error(
          `Lookup list "${BUSINESS_LIST_TITLE}" was not found. Create "${BUSINESS_LIST_TITLE}" or "${LEGACY_BUSINESS_LIST_TITLE}" before dependent lists.`
        );
      }

      this.listIds[BUSINESS_LIST_TITLE] = list.Id;
      this.listIds[businessTitle] = list.Id;
      return list.Id;
    }

    const cachedId = this.listIds[title];
    if (cachedId && (await this.rest.listExistsById(cachedId))) {
      return cachedId;
    }

    const list = await this.rest.getListByTitle(title);
    if (!list) {
      throw new Error(
        `Lookup list "${title}" was not found. Create "${title}" before dependent lists.`
      );
    }

    this.listIds[title] = list.Id;
    return list.Id;
  }



  private async resolveBusinessListTitle(): Promise<string> {
    const resolved = await this.rest.resolveListTitleAlias(
      BUSINESS_LIST_TITLE,
      LEGACY_BUSINESS_LIST_TITLE
    );
    return resolved ?? BUSINESS_LIST_TITLE;
  }



  /** Ensure lstBusiness (or legacy Business) exists with required fields before Projects/Risks lookups. */
  private async ensureBusinessListReady(): Promise<string> {
    this.rest.resetListTitleProbe(BUSINESS_LIST_TITLE);
    let title = await this.resolveBusinessListTitle();
    let list = await this.rest.getListByTitle(title);

    if (!list) {
      const def = ASSET_MANAGEMENT_LISTS.find((item) => item.title === BUSINESS_LIST_TITLE);
      if (!def) {
        throw new Error('Business list definition is missing from provisioning metadata.');
      }

      await this.ensureList(def);
      this.rest.resetListTitleProbe(BUSINESS_LIST_TITLE);
      title = BUSINESS_LIST_TITLE;
      list = await this.rest.getListByTitle(title);
    }

    if (!list) {
      throw new Error(
        `Business list could not be created. Expected "${BUSINESS_LIST_TITLE}" or legacy "${LEGACY_BUSINESS_LIST_TITLE}".`
      );
    }

    this.listIds[BUSINESS_LIST_TITLE] = list.Id;
    this.listIds[title] = list.Id;

    const def = ASSET_MANAGEMENT_LISTS.find((item) => item.title === BUSINESS_LIST_TITLE);
    if (def) {
      await this.ensureListFieldsOnList(def, title, list.Id);
    }

    return title;
  }



  private async resolveListId(title: string, description: string): Promise<string> {
    const existing = await this.rest.getListByTitle(title);

    if (existing) {
      this.listIds[title] = existing.Id;
      this.rest.clearMissingListTitle(title);
      return existing.Id;
    }

    const cachedId = this.listIds[title];
    if (cachedId && (await this.rest.listExistsById(cachedId))) {
      return cachedId;
    }

    delete this.listIds[title];

    const listId = await this.rest.createList(title, description, { hidden: true });
    this.listIds[title] = listId;
    return listId;
  }



  private async seedCurrentAdministrator(): Promise<void> {
    const list = await this.rest.getListByTitle(ADMINISTRATORS_LIST_TITLE);
    if (!list) {
      return;
    }

    const listId = this.listIds[ADMINISTRATORS_LIST_TITLE] || list.Id;
    const missing = await this.rest.listMissingFields(listId, ['AM_User']);
    if (missing.length > 0) {
      return;
    }

    try {
      const user = await this.rest.getCurrentUser();
      const alreadyAdministrator = await this.rest.itemExistsByFilter(
        ADMINISTRATORS_LIST_TITLE,
        `AM_UserId eq ${user.Id}`
      );
      if (alreadyAdministrator) {
        return;
      }

      await this.rest.addListItem(ADMINISTRATORS_LIST_TITLE, {
        Title: user.Title,
        AM_UserId: user.Id
      });
    } catch {
      /* Admin seed is best-effort; setup can still complete */
    }
  }



  private async yieldToUi(): Promise<void> {

    await new Promise<void>((resolve) => {

      window.setTimeout(resolve, 0);

    });

  }

  private async restDelay(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }



  private updateStep(

    steps: IProvisioningStep[],

    id: string,

    status: IProvisioningStep['status'],

    onStepUpdate: (steps: IProvisioningStep[]) => void,

    message?: string

  ): void {

    const step = steps.find((item) => item.id === id);

    if (step) {

      step.status = status;

      if (message !== undefined) {

        step.message = message;

      }

    }

    onStepUpdate([...steps]);

  }

  /** Ensure Business list exists and has all custom fields (supports legacy "Business" title). */
  public async ensureBusinessListFieldsReady(): Promise<string> {
    return this.ensureBusinessListReady();
  }

  /** Repair or create missing fields on an existing list (e.g. before CRUD). */
  public async ensureListFieldsReady(title: string): Promise<void> {
    await this.refreshExistingListsCached();
    const def = ASSET_MANAGEMENT_LISTS.find((list) => list.title === title);
    if (!def) {
      throw new Error(`Unknown list "${title}"`);
    }
    await this.ensureList(def);
  }

  /** Single list refresh, then repair several lists in parallel (faster when lists are independent). */
  public async ensureListFieldsReadyBatch(titles: string[]): Promise<void> {
    await this.refreshExistingListsCached();
    const uniqueTitles = Array.from(new Set(titles));
    await Promise.all(
      uniqueTitles.map(async (title) => {
        const def = ASSET_MANAGEMENT_LISTS.find((list) => list.title === title);
        if (!def) {
          throw new Error(`Unknown list "${title}"`);
        }
        await this.ensureList(def);
      })
    );
  }

  /**
   * Create or repair lists one at a time in dependency order (required for lookup fields).
   * Use for compliance lists: Frameworks → Controls → Assessments → AssessmentItems.
   */
  public async ensureListFieldsReadyOrdered(titles: string[]): Promise<void> {
    await this.refreshExistingListsCached();
    const uniqueTitles = Array.from(new Set(titles));
    for (const title of uniqueTitles) {
      const def = ASSET_MANAGEMENT_LISTS.find((list) => list.title === title);
      if (!def) {
        throw new Error(`Unknown list "${title}"`);
      }
      await this.ensureList(def);
      await this.yieldToUi();
    }
  }

  private async refreshExistingListsCached(): Promise<void> {
    if (!this.refreshListsPromise) {
      this.refreshListsPromise = this.refreshExistingLists().catch((error) => {
        this.refreshListsPromise = undefined;
        throw error;
      });
    }
    await this.refreshListsPromise;
  }

  /** Remove onboarding sample rows only — user-created records are kept. */
  public async clearSeedData(): Promise<IClearSeedDataResult> {
    return this.enqueueExclusiveSeed(() => this.runClearSeedData());
  }

  private createClearSeedResult(): IClearSeedDataResult {
    return { deleted: {}, failed: [], totalDeleted: 0 };
  }

  private recordSeedDeletion(result: IClearSeedDataResult, listTitle: string): void {
    result.deleted[listTitle] = (result.deleted[listTitle] || 0) + 1;
    result.totalDeleted += 1;
  }

  private recordSeedFailure(
    result: IClearSeedDataResult,
    failure: IClearSeedDataFailure
  ): void {
    result.failed.push(failure);
  }

  private async runClearSeedData(): Promise<IClearSeedDataResult> {
    await this.refreshExistingListsCached();
    const result = this.createClearSeedResult();

    await this.clearAssetControlLinkSeedData(result);
    await this.clearComplianceSeedData(result);
    await this.clearSeedItemsForListDef(
      ASSET_MANAGEMENT_LISTS.find((list) => list.title === 'AM_Assets'),
      result,
      { multiPass: true }
    );
    await this.clearDefaultFormTemplates(result);
    await this.clearSeedItemsForListDef(
      ASSET_MANAGEMENT_LISTS.find((list) => list.title === PROJECTS_LIST_TITLE),
      result
    );
    await this.clearSeedItemsForListDef(
      ASSET_MANAGEMENT_LISTS.find((list) => list.title === SUB_CATEGORIES_LIST_TITLE),
      result
    );

    const simpleLists = ASSET_MANAGEMENT_LISTS.filter(
      (list) =>
        list.seedData?.length &&
        list.title !== 'AM_Assets' &&
        list.title !== PROJECTS_LIST_TITLE &&
        list.title !== SUB_CATEGORIES_LIST_TITLE &&
        list.title !== 'AppSettings'
    );
    for (const def of simpleLists) {
      await this.clearSeedItemsForListDef(def, result);
    }

    await this.resetSampleDataSeededFlag();
    return result;
  }

  private async clearAssetControlLinkSeedData(result: IClearSeedDataResult): Promise<void> {
    if (ASSET_CONTROL_LINK_SEED_DATA.length === 0) {
      return;
    }

    const seedKeys = new Set(
      ASSET_CONTROL_LINK_SEED_DATA.map((seed) =>
        [
          seed.riskTitle.trim().toLowerCase(),
          seed.frameworkCode.trim().toLowerCase(),
          seed.controlCode.trim().toLowerCase()
        ].join('::')
      )
    );

    try {
      const links = await this.rest.getAllItems<{
        Id: number;
        Title?: string;
        ControlCode?: string;
        FrameworkCode?: string;
        RiskLink?: { Title?: string };
      }>(
        ASSET_CONTROL_LINKS_LIST_TITLE,
        'Id,Title,ControlCode,FrameworkCode,RiskLink/Title',
        'RiskLink'
      );

      for (const link of links) {
        const key = [
          String(link.RiskLink?.Title || '').trim().toLowerCase(),
          String(link.FrameworkCode || '').trim().toLowerCase(),
          String(link.ControlCode || '').trim().toLowerCase()
        ].join('::');
        if (!seedKeys.has(key)) {
          continue;
        }
        await this.tryDeleteSeedItem(
          result,
          ASSET_CONTROL_LINKS_LIST_TITLE,
          link.Id,
          String(link.Title || '')
        );
      }
    } catch {
      // AssetControlLinks list may not exist yet.
    }
  }

  private async clearComplianceSeedData(result: IClearSeedDataResult): Promise<void> {
    const seedAssessmentNames = new Set(
      COMPLIANCE_ASSESSMENT_SEED_DATA.map((entry) => entry.name)
    );
    const builtInCodes = new Set(COMPLIANCE_BUILT_IN_FRAMEWORKS.map((entry) => entry.code));

    try {
      const assessments = await this.rest.getAllItems<{ Id: number; Title?: string }>(
        COMPLIANCE_ASSESSMENTS_LIST_TITLE,
        'Id,Title'
      );
      const seededAssessments = assessments.filter((assessment) =>
        seedAssessmentNames.has(String(assessment.Title || '').trim())
      );

      for (const assessment of seededAssessments) {
        const items = await this.rest.getAllItems<{ Id: number; Title?: string }>(
          COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE,
          'Id,Title',
          undefined,
          `Assessment/Id eq ${assessment.Id}`
        );

        for (const item of items) {
          await this.tryDeleteSeedItem(
            result,
            COMPLIANCE_ASSESSMENT_ITEMS_LIST_TITLE,
            item.Id,
            String(item.Title || '')
          );
        }

        await this.tryDeleteSeedItem(
          result,
          COMPLIANCE_ASSESSMENTS_LIST_TITLE,
          assessment.Id,
          String(assessment.Title || '')
        );
      }
    } catch {
      // Compliance lists may not exist yet.
    }

    try {
      const frameworks = await this.rest.getAllItems<{
        Id: number;
        Title?: string;
        Code?: string;
        IsBuiltIn?: boolean;
      }>(COMPLIANCE_FRAMEWORKS_LIST_TITLE, 'Id,Title,Code,IsBuiltIn');

      const builtInFrameworks = frameworks.filter(
        (framework) =>
          framework.IsBuiltIn === true || builtInCodes.has(String(framework.Code || '').trim())
      );

      for (const framework of builtInFrameworks) {
        const controls = await this.rest.getAllItems<{ Id: number; Title?: string }>(
          COMPLIANCE_CONTROLS_LIST_TITLE,
          'Id,Title',
          undefined,
          `Framework/Id eq ${framework.Id}`
        );

        for (const control of controls) {
          await this.tryDeleteSeedItem(
            result,
            COMPLIANCE_CONTROLS_LIST_TITLE,
            control.Id,
            String(control.Title || '')
          );
        }

        await this.tryDeleteSeedItem(
          result,
          COMPLIANCE_FRAMEWORKS_LIST_TITLE,
          framework.Id,
          String(framework.Title || '')
        );
      }
    } catch {
      // Compliance lists may not exist yet.
    }
  }

  private async clearDefaultFormTemplates(result: IClearSeedDataResult): Promise<void> {
    const templateNames = new Set(DEFAULT_FORM_TEMPLATES.map((entry) => entry.templateName));
    if (templateNames.size === 0) {
      return;
    }

    try {
      const items = await this.rest.getAllItems<{ Id: number; Title?: string }>(
        FORM_TEMPLATES_LIST_TITLE,
        'Id,Title'
      );
      for (const item of items) {
        const title = String(item.Title || '').trim();
        if (!templateNames.has(title)) {
          continue;
        }
        await this.tryDeleteSeedItem(result, FORM_TEMPLATES_LIST_TITLE, item.Id, title);
      }
    } catch {
      // FormTemplates list may not exist yet.
    }
  }

  private async clearSeedItemsForListDef(
    def: IListDefinition | undefined,
    result: IClearSeedDataResult,
    options?: { multiPass?: boolean }
  ): Promise<void> {
    if (!def?.seedData?.length) {
      return;
    }

    const operationalTitle = await this.resolveOperationalListTitle(def);
    if (!operationalTitle) {
      return;
    }

    const catalog = dedupeSeedRows(def.title, def.seedData);
    const maxPasses = options?.multiPass ? 3 : 1;

    for (let pass = 0; pass < maxPasses; pass += 1) {
      const items = await this.loadListItemsForSeedMatch(def, operationalTitle);
      const toDelete = items.filter((item) =>
        itemMatchesSeedCatalog(def.title, item, catalog)
      );
      if (toDelete.length === 0) {
        break;
      }

      for (const item of toDelete) {
        await this.tryDeleteSeedItem(
          result,
          def.title,
          Number(item.Id),
          String(item.Title || ''),
          operationalTitle
        );
      }
    }
  }

  private async loadListItemsForSeedMatch(
    def: IListDefinition,
    operationalListTitle: string
  ): Promise<Array<Record<string, unknown>>> {
    try {
      if (def.title === PROJECTS_LIST_TITLE) {
        return this.rest.getAllItems<Record<string, unknown>>(
          operationalListTitle,
          'Id,Title,AM_Code'
        );
      }

      if (def.title === BUSINESS_LIST_TITLE) {
        return this.rest.getAllItems<Record<string, unknown>>(
          operationalListTitle,
          'Id,Title,BusinessCode'
        );
      }

      if (def.title === SUB_CATEGORIES_LIST_TITLE) {
        return this.rest.getAllItems<Record<string, unknown>>(
          operationalListTitle,
          'Id,Title,AM_ParentCategory/Id,AM_ParentCategory/Title',
          'AM_ParentCategory'
        );
      }

      if (def.title === 'AM_Assets') {
        return this.rest.getAllItems<Record<string, unknown>>(
          operationalListTitle,
          'Id,Title,AM_AssetId'
        );
      }

      const hasRating = def.fields.some((field) => field.internalName === 'Rating');
      const select = hasRating ? 'Id,Title,Rating' : 'Id,Title';
      return this.rest.getAllItems<Record<string, unknown>>(operationalListTitle, select);
    } catch {
      return [];
    }
  }

  private async tryDeleteSeedItem(
    result: IClearSeedDataResult,
    listTitle: string,
    itemId: number,
    title: string,
    operationalListTitle?: string
  ): Promise<void> {
    if (!itemId) {
      return;
    }

    const targetList = operationalListTitle || listTitle;
    try {
      await this.rest.deleteItem(targetList, itemId);
      this.recordSeedDeletion(result, listTitle);
    } catch (error) {
      this.recordSeedFailure(result, {
        listTitle,
        itemId,
        title,
        error: error instanceof Error ? error.message : 'Delete failed'
      });
    }
  }

  private async resetSampleDataSeededFlag(): Promise<void> {
    try {
      const settings = await this.getAssetService().getAppSettings();
      if (!settings?.Id || !isSampleDataSeeded(settings)) {
        return;
      }

      await this.ensureListFieldsReady('AppSettings');
      await this.getAssetService().updateAppSettings(settings.Id, {
        SampleDataSeeded: 'No'
      });
    } catch {
      // Non-blocking — sample rows were still removed.
    }
  }

}


