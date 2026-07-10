import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { SharePointFieldValue } from '../utils/sharePointFieldPayload';
import {
  buildFieldLookupTerms,
  isCustomDeletableField,
  isSharePointSystemFieldName,
  isVerifiedFieldMatch,
  ISharePointFieldMeta,
  toSharePointEncodedFieldName
} from '../utils/sharePointFieldNames';
import { ISharePointFormField } from '../models/ISharePointFormField';
import { IPersonPickerItem, IPersonPickerSuggestion } from '../models/IPersonPickerItem';
import {
  ASSET_FORM_CUSTOMIZER_ACTION_NAME,
  ASSET_FORM_CUSTOMIZER_ID,
  DEFAULT_APP_TITLE
} from '../constants/spfxComponents';
import type { IEffectivePermissions } from '../utils/listPermissions';
import {
  hasFullControlPermissions,
  SETUP_FULL_CONTROL_REQUIRED_MESSAGE
} from '../utils/sitePermissions';
import { normalizeVersionFieldValue } from '../utils/assetVersionHistory';

export interface ISharePointListInfo {
  Id: string;
  Title: string;
  ItemCount: number;
}

/**
 * Legacy farm-solution field IDs from the on-prem solution.
 * Do not use when creating fields on SharePoint Online — fixed GUIDs often conflict and
 * cause CreateFieldAsXml to return HTML error pages instead of JSON.
 */
const LEGACY_FIELD_IDS: Record<string, string> = {};

interface ISharePointSiteListCache {
  missingListTitles: Set<string>;
  resolvedListTitleAliases: Map<string, string>;
  listByTitleInflight: Map<string, Promise<ISharePointListInfo | undefined>>;
}

export class SharePointRestService {
  private static readonly siteListCaches = new Map<string, ISharePointSiteListCache>();

  private static getSiteListCache(webUrl: string): ISharePointSiteListCache {
    let cache = SharePointRestService.siteListCaches.get(webUrl);
    if (!cache) {
      cache = {
        missingListTitles: new Set<string>(),
        resolvedListTitleAliases: new Map<string, string>(),
        listByTitleInflight: new Map<string, Promise<ISharePointListInfo | undefined>>()
      };
      SharePointRestService.siteListCaches.set(webUrl, cache);
    }
    return cache;
  }

  private listTitleByIdCache: Map<string, string> | undefined;
  /** Cached custom fields per list — avoids hundreds of getbyinternalnameortitle 400s during setup. */
  private readonly listCustomFieldsCache = new Map<string, Map<string, ISharePointFieldMeta>>();
  private readonly missingListTitles: Set<string>;
  private readonly listByTitleInflight: Map<string, Promise<ISharePointListInfo | undefined>>;
  /** Maps canonical list title (e.g. lstBusiness) to the title that exists on the site. */
  private readonly resolvedListTitleAliases: Map<string, string>;
  private readonly siteUserCache = new Map<number, { Id: number; Title: string; Email?: string }>();

  constructor(
    private readonly spHttpClient: SPHttpClient,
    private readonly webUrl: string
  ) {
    const cache = SharePointRestService.getSiteListCache(webUrl);
    this.missingListTitles = cache.missingListTitles;
    this.resolvedListTitleAliases = cache.resolvedListTitleAliases;
    this.listByTitleInflight = cache.listByTitleInflight;
  }

  /** GET wrapper that transparently retries on SharePoint throttling (429/503). */
  private async spGet(
    url: string,
    configuration: Parameters<SPHttpClient['get']>[1],
    options?: Parameters<SPHttpClient['get']>[2]
  ): Promise<SPHttpClientResponse> {
    return this.requestWithRetry(() => this.spHttpClient.get(url, configuration, options));
  }

  /** POST wrapper that transparently retries on SharePoint throttling (429/503). */
  private async spPost(
    url: string,
    configuration: Parameters<SPHttpClient['post']>[1],
    options: Parameters<SPHttpClient['post']>[2]
  ): Promise<SPHttpClientResponse> {
    return this.requestWithRetry(() => this.spHttpClient.post(url, configuration, options));
  }

  /**
   * Sends a request and retries on throttling responses (HTTP 429/503),
   * honoring the `Retry-After` header when present and otherwise backing off
   * exponentially. Other statuses (including 4xx/5xx) are returned unchanged so
   * existing callers keep their error handling.
   */
  private async requestWithRetry(
    send: () => Promise<SPHttpClientResponse>,
    maxRetries = 3
  ): Promise<SPHttpClientResponse> {
    let attempt = 0;
    let response = await send();
    while ((response.status === 429 || response.status === 503) && attempt < maxRetries) {
      const retryAfterHeader = response.headers.get('Retry-After');
      const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : NaN;
      const delayMs =
        Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
          ? Math.min(retryAfterSeconds * 1000, 30000)
          : Math.min(500 * Math.pow(2, attempt), 8000);
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      attempt += 1;
      response = await send();
    }
    return response;
  }

  private static async readJsonBody<T>(
    response: SPHttpClientResponse,
    context: string
  ): Promise<T> {
    const text = await response.text();
    if (!text.trim()) {
      throw new Error(`${context}: SharePoint returned an empty response (HTTP ${response.status}).`);
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      const htmlTitle = /<title[^>]*>([^<]+)<\/title>/i.exec(text)?.[1]?.trim();
      const hint = htmlTitle
        ? ` (${htmlTitle})`
        : text.startsWith('<!DOCTYPE') || text.startsWith('<html')
          ? ' (HTML error page — session may have expired or the request was throttled)'
          : '';
      throw new Error(
        `${context}: SharePoint returned a non-JSON response (HTTP ${response.status})${hint}. Refresh the page and run setup again.`
      );
    }
  }

  /** Allow re-fetch after provisioning creates a list that previously 404'd. */
  public clearMissingListTitle(title: string): void {
    this.missingListTitles.delete(title);
  }

  /** Clear cached primary→actual list title resolution (e.g. after creating lstBusiness). */
  public clearListTitleAlias(primaryTitle: string): void {
    this.resolvedListTitleAliases.delete(primaryTitle);
  }

  public resetListTitleProbe(primaryTitle: string): void {
    this.missingListTitles.delete(primaryTitle);
    this.resolvedListTitleAliases.delete(primaryTitle);
  }

  /**
   * Resolve a list that may exist under a primary or legacy title (e.g. lstBusiness vs Business).
   * Caches the result for the session to avoid repeated 404 probes.
   */
  public async resolveListTitleAlias(
    primaryTitle: string,
    legacyTitle: string
  ): Promise<string | undefined> {
    const cachedPrimary = this.resolvedListTitleAliases.get(primaryTitle);
    if (cachedPrimary) {
      return cachedPrimary;
    }

    // Resolve both candidate titles with a single filtered query. Probing each
    // title via getbytitle() would surface a 404 in the browser console when the
    // canonical list does not exist yet, so we query the lists collection (200 OK)
    // and inspect the returned titles instead.
    try {
      const filter =
        `Title eq '${this.escapeListTitle(primaryTitle)}' or ` +
        `Title eq '${this.escapeListTitle(legacyTitle)}'`;
      const response = await this.spGet(
        `${this.webUrl}/_api/web/lists?$select=Title&$filter=${encodeURIComponent(filter)}`,
        SPHttpClient.configurations.v1
      );
      if (response.ok) {
        const data = await SharePointRestService.readJsonBody<{
          value?: { Title: string }[];
          d?: { results?: { Title: string }[] };
        }>(response, `Failed to resolve list "${primaryTitle}"`);
        const titles = new Set((data.value || data.d?.results || []).map((l) => l.Title));
        if (titles.has(primaryTitle)) {
          this.resolvedListTitleAliases.set(primaryTitle, primaryTitle);
          return primaryTitle;
        }
        if (titles.has(legacyTitle)) {
          this.resolvedListTitleAliases.set(primaryTitle, legacyTitle);
          return legacyTitle;
        }
        return undefined;
      }
    } catch {
      // Fall back to per-title probing below.
    }

    const primary = await this.getListByTitle(primaryTitle);
    if (primary) {
      this.resolvedListTitleAliases.set(primaryTitle, primaryTitle);
      return primaryTitle;
    }

    const legacy = await this.getListByTitle(legacyTitle);
    if (legacy) {
      this.resolvedListTitleAliases.set(primaryTitle, legacyTitle);
      return legacyTitle;
    }

    return undefined;
  }

  public async getListByTitle(title: string): Promise<ISharePointListInfo | undefined> {
    if (this.missingListTitles.has(title)) {
      return undefined;
    }

    const inflight = this.listByTitleInflight.get(title);
    if (inflight) {
      return inflight;
    }

    const request = this.fetchListByTitle(title);
    this.listByTitleInflight.set(title, request);

    try {
      return await request;
    } finally {
      this.listByTitleInflight.delete(title);
    }
  }

  private async fetchListByTitle(title: string): Promise<ISharePointListInfo | undefined> {
    try {
      const safeTitle = title.replace(/'/g, "''");
      const response = await this.spGet(
        `${this.webUrl}/_api/web/lists/getbytitle('${safeTitle}')?$select=Id,Title,ItemCount`,
        SPHttpClient.configurations.v1
      );
      if (!response.ok) {
        if (response.status === 404) {
          this.missingListTitles.add(title);
        }
        return undefined;
      }
      const data = await SharePointRestService.readJsonBody<{
        Id: string;
        Title: string;
        ItemCount: number;
      }>(response, `Failed to read list "${title}"`);
      this.missingListTitles.delete(title);
      return { Id: data.Id, Title: data.Title, ItemCount: data.ItemCount };
    } catch {
      return undefined;
    }
  }

  public async getListsByTitles(titles: string[]): Promise<Map<string, ISharePointListInfo>> {
    const uniqueTitles = Array.from(new Set(titles.filter((title) => title.trim().length > 0)));
    const result = new Map<string, ISharePointListInfo>();
    if (uniqueTitles.length === 0) {
      return result;
    }

    const chunkSize = 20;
    for (let i = 0; i < uniqueTitles.length; i += chunkSize) {
      const chunk = uniqueTitles.slice(i, i + chunkSize);
      const filter = chunk.map((title) => `Title eq '${this.escapeODataString(title)}'`).join(' or ');
      try {
        const response = await this.spGet(
          `${this.webUrl}/_api/web/lists?$select=Id,Title,ItemCount&$filter=${encodeURIComponent(filter)}&$top=${chunk.length}`,
          SPHttpClient.configurations.v1
        );

        if (!response.ok) {
          continue;
        }

        const data = await SharePointRestService.readJsonBody<{
          value?: ISharePointListInfo[];
          d?: { results?: ISharePointListInfo[] };
        }>(response, 'Failed to read SharePoint lists');

        for (const list of data.value || data.d?.results || []) {
          result.set(list.Title, list);
          this.missingListTitles.delete(list.Title);
        }
      } catch {
        // Fall back to cached "missing" behavior below. Individual setup calls can still repair.
      }
    }

    for (const title of uniqueTitles) {
      if (!result.has(title)) {
        this.missingListTitles.add(title);
      }
    }

    return result;
  }

  public async listExistsById(listId: string): Promise<boolean> {
    try {
      const response = await this.spGet(
        `${this.listGuidUrl(listId)}?$select=Id`,
        SPHttpClient.configurations.v1
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  public async createList(
    title: string,
    description: string,
    options?: { hidden?: boolean }
  ): Promise<string> {
    const body: Record<string, unknown> = {
      Title: title,
      Description: description,
      BaseTemplate: 100,
      AllowContentTypes: true
    };

    if (options?.hidden) {
      body.Hidden = true;
    }

    const response = await this.spPost(
      `${this.webUrl}/_api/web/lists`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=nometadata',
          'odata-version': ''
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create list "${title}": ${errorText}`);
    }

    const data = await SharePointRestService.readJsonBody<{ Id: string }>(
      response,
      `Failed to read create-list response for "${title}"`
    );
    const listId = data.Id as string;
    this.clearMissingListTitle(title);
    await this.waitForListReady(listId);
    return listId;
  }

  /** Hide or show a list in Site Contents and quick launch. Direct list URLs still work. */
  public async setListHidden(listId: string, hidden: boolean): Promise<boolean> {
    try {
      const response = await this.spPost(
        `${this.listGuidUrl(listId)}`,
        SPHttpClient.configurations.v1,
        {
          headers: {
            Accept: 'application/json;odata=nometadata',
            'Content-Type': 'application/json;odata=nometadata',
            'odata-version': '',
            'IF-MATCH': '*',
            'X-HTTP-Method': 'MERGE'
          },
          body: JSON.stringify({ Hidden: hidden })
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  public async waitForListReady(listId: string, attempts = 12, delayMs = 500): Promise<void> {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (await this.listExistsById(listId)) {
        const fields = await this.getFieldsByInternalNames(listId, ['Title']);
        if (fields.has('Title')) {
          return;
        }
      }
      await this.delay(delayMs);
    }
  }

  public async ensureField(
    listId: string,
    field: {
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
    }
  ): Promise<void> {
    if (field.internalName.length > 32) {
      throw new Error(
        `Field internal name "${field.internalName}" is ${field.internalName.length} characters; SharePoint allows at most 32.`
      );
    }

    if (await this.fieldExists(listId, field.internalName)) {
      const removedMismatch = await this.removeFieldIfTypeMismatch(listId, field);
      if (!removedMismatch) {
        return;
      }
    }

    const isLookupField = field.type === 'Lookup' || field.type === 'LookupMulti';
    const isUserField = field.type === 'User' || field.type === 'UserMulti';

    if (isLookupField && !field.lookupListId) {
      throw new Error(
        `Lookup list id is required for field "${field.displayName}" (${field.internalName}).`
      );
    }

    await this.removeMismatchedFieldIfNeeded(listId, field.internalName, field.displayName);

    if (isUserField) {
      const createdViaKind = await this.createUserFieldViaFieldTypeKind(
        listId,
        field.internalName,
        field.displayName,
        field.required ?? false,
        field.type === 'UserMulti',
        field.userSelectionMode
      );
      if (createdViaKind) {
        this.invalidateListCustomFieldsCache(listId);
        const exists = await this.waitForFieldReady(listId, field.internalName, 48, 500);
        if (exists) {
          return;
        }

        const resolvedName = await this.getFieldInternalName(
          listId,
          field.internalName,
          field.displayName
        );
        if (resolvedName === field.internalName) {
          return;
        }
      }
    }

    const schemaVariants = isUserField
      ? this.buildUserFieldSchemaVariants(field)
      : isLookupField
        ? this.buildLookupFieldSchemaVariants(field)
        : this.buildStandardFieldSchemaVariants(field);

    let lastError = '';
    const nameMismatch = field.displayName.trim() !== field.internalName;
    const waitAttempts = isUserField || isLookupField ? 48 : nameMismatch ? 24 : 12;
    const waitDelayMs = isUserField || isLookupField ? 500 : nameMismatch ? 500 : 400;

    for (const schemaXml of schemaVariants) {
      const created = await this.createFieldFromXmlWithHints(listId, schemaXml);
      if (!created.ok) {
        lastError = created.error;
        continue;
      }

      this.invalidateListCustomFieldsCache(listId);

      const exists = await this.waitForFieldReady(
        listId,
        field.internalName,
        waitAttempts,
        waitDelayMs
      );
      if (exists) {
        return;
      }

      const resolvedName = await this.getFieldInternalName(
        listId,
        field.internalName,
        field.displayName
      );
      if (resolvedName === field.internalName) {
        return;
      }

      if (resolvedName) {
        await this.safeDeleteField(listId, resolvedName);
        await this.waitForFieldGone(listId, resolvedName);
        lastError = `Field "${field.displayName}" was created as "${resolvedName}" instead of "${field.internalName}"`;
        continue;
      }

      lastError = `Field "${field.displayName}" (${field.internalName}) was not created on the list`;
    }

    if (isUserField) {
      const fallbackCreated = await this.createUserFieldViaFieldTypeKind(
        listId,
        field.internalName,
        field.displayName,
        field.required ?? false,
        field.type === 'UserMulti',
        field.userSelectionMode
      );
      if (fallbackCreated) {
        const exists = await this.waitForFieldReady(listId, field.internalName, 48, 500);
        if (exists) {
          return;
        }

        const resolvedName = await this.getFieldInternalName(
          listId,
          field.internalName,
          field.displayName
        );
        if (resolvedName === field.internalName) {
          return;
        }

        if (resolvedName) {
          await this.safeDeleteField(listId, resolvedName);
          await this.waitForFieldGone(listId, resolvedName);
          lastError = `Field "${field.displayName}" was created as "${resolvedName}" instead of "${field.internalName}"`;
        }
      }
    }

    if (isLookupField && field.lookupListId) {
      const fallbackCreated = await this.createLookupFieldViaFieldTypeKind(
        listId,
        field.internalName,
        field.displayName,
        field.lookupListId,
        field.lookupField || 'Title',
        field.required ?? false,
        field.type === 'LookupMulti'
      );
      if (fallbackCreated) {
        const exists = await this.waitForFieldReady(listId, field.internalName, 48, 500);
        if (exists) {
          return;
        }

        const resolvedName = await this.getFieldInternalName(
          listId,
          field.internalName,
          field.displayName
        );
        if (resolvedName === field.internalName) {
          return;
        }

        if (resolvedName) {
          await this.safeDeleteField(listId, resolvedName);
          await this.waitForFieldGone(listId, resolvedName);
          lastError = `Field "${field.displayName}" was created as "${resolvedName}" instead of "${field.internalName}"`;
        }
      }
    }

    if (field.optional) {
      return;
    }

    throw new Error(
      lastError ||
        `Failed to create field "${field.displayName}" (${field.internalName}) on the list`
    );
  }

  public async ensureAllFields(
    listId: string,
    fields: Array<{
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
    listTitle?: string
  ): Promise<void> {
    const sortedFields = this.sortFieldsForProvisioning(fields);

    for (const field of sortedFields) {
      try {
        await this.ensureField(listId, field);
      } catch (error) {
        if (!field.optional) {
          const message = error instanceof Error ? error.message : 'Field provisioning failed';
          throw new Error(
            listTitle ? `"${listTitle}" list: ${message}` : message
          );
        }
      }
    }

    const requiredFieldNames = sortedFields
      .filter((field) => !field.optional)
      .map((field) => field.internalName);
    let missing = await this.getMissingFields(listId, requiredFieldNames);

    if (missing.length > 0) {
      for (const internalName of missing) {
        const field = sortedFields.find((item) => item.internalName === internalName);
        if (field) {
          try {
            await this.ensureField(listId, field);
          } catch (error) {
            if (!field.optional) {
              const message = error instanceof Error ? error.message : 'Field provisioning failed';
              throw new Error(
                listTitle ? `"${listTitle}" list: ${message}` : message
              );
            }
          }
        }
      }
      missing = await this.getMissingFields(listId, requiredFieldNames);
    }

    const hasLookupFields = sortedFields.some(
      (field) => field.type === 'Lookup' || field.type === 'LookupMulti'
    );
    await this.waitForFields(listId, requiredFieldNames, {
      attempts: hasLookupFields ? 40 : 24,
      delayMs: hasLookupFields ? 500 : 400,
      listTitle
    });
  }

  private sortFieldsForProvisioning<
    T extends {
      internalName: string;
      type: string;
    }
  >(fields: T[]): T[] {
    const typeOrder: Record<string, number> = {
      Text: 10,
      Note: 10,
      Boolean: 10,
      Number: 10,
      Choice: 20,
      DateTime: 20,
      User: 30,
      UserMulti: 30,
      Lookup: 40,
      LookupMulti: 50
    };

    return [...fields].sort((left, right) => {
      const leftWeight =
        left.internalName === 'RelatedRisks' ? 1000 : typeOrder[left.type] ?? 60;
      const rightWeight =
        right.internalName === 'RelatedRisks' ? 1000 : typeOrder[right.type] ?? 60;
      return leftWeight - rightWeight;
    });
  }

  private async waitForFieldGone(
    listId: string,
    internalName: string,
    attempts = 12,
    delayMs = 400
  ): Promise<void> {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (!(await this.fieldExists(listId, internalName))) {
        return;
      }
      await this.delay(delayMs);
    }
  }

  private async removeMismatchedFieldIfNeeded(
    listId: string,
    internalName: string,
    displayName: string
  ): Promise<void> {
    if (await this.fieldExists(listId, internalName)) {
      return;
    }

    const mismatchedNames = await this.findVerifiedMismatchedFieldNames(
      listId,
      internalName,
      displayName
    );

    for (const mismatchedName of mismatchedNames) {
      await this.safeDeleteField(listId, mismatchedName);
      await this.waitForFieldGone(listId, mismatchedName);
    }
  }

  private async findVerifiedMismatchedFieldNames(
    listId: string,
    internalName: string,
    displayName: string
  ): Promise<string[]> {
    const mismatches = new Set<string>();

    for (const searchTerm of buildFieldLookupTerms(internalName, displayName)) {
      const field = await this.getFieldMetadata(listId, searchTerm);
      if (!field || !isCustomDeletableField(field)) {
        continue;
      }

      if (
        field.InternalName !== internalName &&
        isVerifiedFieldMatch(field, internalName, searchTerm, displayName)
      ) {
        mismatches.add(field.InternalName);
      }
    }

    const encodedDisplayName = displayName ? toSharePointEncodedFieldName(displayName) : '';
    if (
      encodedDisplayName &&
      encodedDisplayName !== internalName &&
      (await this.fieldExists(listId, encodedDisplayName))
    ) {
      const field = await this.getFieldMetadata(listId, encodedDisplayName);
      if (field && isCustomDeletableField(field) && field.InternalName !== internalName) {
        mismatches.add(field.InternalName);
      }
    }

    return Array.from(mismatches);
  }

  private invalidateListCustomFieldsCache(listId: string): void {
    this.listCustomFieldsCache.delete(this.normalizeGuid(listId));
  }

  private async getCustomListFieldsMap(listId: string): Promise<Map<string, ISharePointFieldMeta>> {
    const normalizedId = this.normalizeGuid(listId);
    const cached = this.listCustomFieldsCache.get(normalizedId);
    if (cached) {
      return cached;
    }

    const fields = new Map<string, ISharePointFieldMeta>();
    let nextUrl: string | undefined =
      `${this.listGuidUrl(listId, 'fields')}?$select=InternalName,Title,TypeAsString,FromBaseType,Sealed,ReadOnlyField&$filter=FromBaseType eq false&$top=5000`;

    while (nextUrl) {
      const response = await this.spGet(nextUrl, SPHttpClient.configurations.v1);
      if (!response.ok) {
        break;
      }

      const data = await SharePointRestService.readJsonBody<{
        value?: ISharePointFieldMeta[];
        ['odata.nextLink']?: string;
      }>(response, 'Failed to read list fields');

      for (const field of data.value || []) {
        fields.set(field.InternalName, field);
        if (field.Title) {
          fields.set(field.Title, field);
        }
      }

      nextUrl = data['odata.nextLink'];
    }

    this.listCustomFieldsCache.set(normalizedId, fields);
    return fields;
  }

  private async getFieldMetadata(
    listId: string,
    nameOrTitle: string
  ): Promise<ISharePointFieldMeta | undefined> {
    const term = nameOrTitle.trim();
    if (!term) {
      return undefined;
    }

    const fields = await this.getCustomListFieldsMap(listId);
    const direct = fields.get(term);
    if (direct) {
      return direct;
    }

    const encoded = toSharePointEncodedFieldName(term);
    if (encoded !== term) {
      const encodedMatch = fields.get(encoded);
      if (encodedMatch) {
        return encodedMatch;
      }
    }

    for (const field of fields.values()) {
      if (field.Title === term || field.InternalName === term) {
        return field;
      }
    }

    return undefined;
  }

  private async createFieldFromXmlWithHints(
    listId: string,
    schemaXml: string
  ): Promise<{ ok: boolean; error: string }> {
    const optionSets = [8, 14, 6, 10];
    let lastError = '';

    for (const options of optionSets) {
      const created = await this.createFieldFromXml(listId, schemaXml, options);
      if (created.ok) {
        return created;
      }
      lastError = created.error;
    }

    return { ok: false, error: lastError };
  }

  private async waitForFieldReady(
    listId: string,
    internalName: string,
    attempts = 6,
    delayMs = 250
  ): Promise<boolean> {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (await this.fieldExists(listId, internalName)) {
        return true;
      }
      await this.delay(delayMs);
    }
    return false;
  }

  public async setTitleFieldDisplayName(listId: string, displayName: string): Promise<void> {
    const response = await this.spPost(
      `${this.listGuidUrl(listId, "fields/getbyinternalnameortitle('Title')")}`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=nometadata',
          'odata-version': '',
          'IF-MATCH': '*',
          'X-HTTP-Method': 'MERGE'
        },
        body: JSON.stringify({
          Title: displayName
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to rename Title field: ${errorText}`);
    }
  }

  public async waitForFields(
    listId: string,
    internalNames: string[],
    options?: { attempts?: number; delayMs?: number; listTitle?: string }
  ): Promise<void> {
    const uniqueNames = Array.from(new Set(internalNames.filter((name) => name !== 'Id' && name !== 'Title')));
    const attempts = options?.attempts ?? 20;
    const delayMs = options?.delayMs ?? 500;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const missing = await this.getMissingFields(listId, uniqueNames);
      if (missing.length === 0) {
        return;
      }
      await this.delay(delayMs);
    }

    const missing = await this.getMissingFields(listId, uniqueNames);
    if (missing.length > 0) {
      const listLabel = options?.listTitle ? `"${options.listTitle}" list` : 'List';
      throw new Error(
        `${listLabel} is missing required fields: ${missing.join(', ')}. Setup will recreate empty affected lists automatically; if this persists, delete the list from Site contents, empty the recycle bin, and run setup again.`
      );
    }
  }

  public async remapListItemFields(
    listId: string,
    payload: Record<string, SharePointFieldValue>,
    fields: Array<{ payloadKey: string; internalName: string; displayName?: string }>
  ): Promise<Record<string, SharePointFieldValue>> {
    return this.remapRiskPayloadFields(listId, payload, fields);
  }

  public async addListItemResolved(
    listTitle: string,
    listId: string,
    fields: Record<string, SharePointFieldValue>,
    fieldDefinitions: Array<{ internalName: string; displayName?: string }>,
    maxAttempts = 5,
    fieldMaps?: Array<{ payloadKey: string; internalName: string; displayName?: string }>
  ): Promise<number> {
    const fieldMap =
      fieldMaps ??
      fieldDefinitions.map((field) => ({
        payloadKey: field.internalName,
        internalName: field.internalName,
        displayName: field.displayName
      }));

    let lastError = 'Failed to add list item';

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const remapped = await this.remapListItemFields(listId, fields, fieldMap);

      try {
        return await this.addListItem(listTitle, remapped);
      } catch (error) {
        lastError = error instanceof Error ? error.message : lastError;
        const isMissingField =
          lastError.includes('does not exist on type') ||
          lastError.includes('does not exist');

        if (!isMissingField || attempt === maxAttempts - 1) {
          throw error instanceof Error ? error : new Error(lastError);
        }

        const waitNames = this.normalizeFieldWaitNames(Object.keys(remapped).filter((name) => name !== 'Title'));
        if (waitNames.length > 0) {
          await this.waitForFields(listId, waitNames, {
            attempts: 24,
            delayMs: 750,
            listTitle
          });
        } else {
          await this.delay(1000 * (attempt + 1));
        }
      }
    }

    throw new Error(lastError);
  }

  /** Resolve REST *Id keys and text columns to SharePoint internal names for field readiness checks. */
  private normalizeFieldWaitNames(fieldNames: string[]): string[] {
    return Array.from(
      new Set(
        fieldNames.map((name) => {
          if (name.endsWith('Id') && name.length > 2) {
            return name.slice(0, -2);
          }
          return name;
        })
      )
    );
  }

  public async listMissingFields(listId: string, internalNames: string[]): Promise<string[]> {
    return this.getMissingFields(listId, internalNames);
  }

  public async getFieldInternalName(
    listId: string,
    internalName: string,
    displayName?: string
  ): Promise<string | undefined> {
    if (await this.fieldExists(listId, internalName)) {
      return internalName;
    }

    for (const searchTerm of buildFieldLookupTerms(internalName, displayName)) {
      const field = await this.getFieldMetadata(listId, searchTerm);
      if (!field) {
        continue;
      }

      if (!isVerifiedFieldMatch(field, internalName, searchTerm, displayName)) {
        continue;
      }

      return field.InternalName;
    }

    return undefined;
  }

  public async remapRiskPayloadFields(
    listId: string,
    payload: Record<string, SharePointFieldValue>,
    fields: Array<{ payloadKey: string; internalName: string; displayName?: string }>
  ): Promise<Record<string, SharePointFieldValue>> {
    const remapped: Record<string, SharePointFieldValue> = { ...payload };

    for (const field of fields) {
      if (!(field.payloadKey in remapped)) {
        continue;
      }

      const resolved = await this.getFieldInternalName(
        listId,
        field.internalName,
        field.displayName
      );

      if (!resolved) {
        delete remapped[field.payloadKey];
        continue;
      }

      const isLookupIdField =
        field.payloadKey.endsWith('Id') &&
        field.internalName &&
        field.payloadKey === `${field.internalName}Id`;

      if (isLookupIdField) {
        const targetKey = `${resolved}Id`;
        if (targetKey !== field.payloadKey) {
          remapped[targetKey] = remapped[field.payloadKey];
          delete remapped[field.payloadKey];
        }
        continue;
      }

      if (resolved !== field.payloadKey) {
        remapped[resolved] = remapped[field.payloadKey];
        delete remapped[field.payloadKey];
      }
    }

    return remapped;
  }

  /** Build $select that only references columns present on the list (lookup values via *Id, no $expand). */
  public async buildRiskItemSelect(
    listId: string,
    scalarFields: string[],
    lookupFields: string[],
    userFields: string[] = []
  ): Promise<string> {
    const existing = await this.getFieldsByInternalNames(listId, [
      ...scalarFields,
      ...lookupFields,
      ...userFields,
      'Created',
      'Modified'
    ]);
    const selectSet = new Set<string>(['Id', 'Title']);

    scalarFields.forEach((name) => {
      if (existing.has(name)) {
        selectSet.add(name);
      }
    });
    if (existing.has('Created')) {
      selectSet.add('Created');
    }
    if (existing.has('Modified')) {
      selectSet.add('Modified');
    }

    lookupFields.forEach((lookup) => {
      if (existing.has(lookup)) {
        selectSet.add(`${lookup}Id`);
      }
    });

    // UserMulti/User fields are loaded via their *Id columns. $expand on UserMulti
    // is unreliable on legacy lists and often returns HTTP 400.
    userFields.forEach((userField) => {
      if (existing.has(userField)) {
        selectSet.add(`${userField}Id`);
      }
    });

    return [...selectSet].join(',');
  }

  public async getSiteUserById(
    userId: number
  ): Promise<{ Id: number; Title: string; Email?: string } | undefined> {
    if (!userId || userId <= 0) {
      return undefined;
    }

    const cached = this.siteUserCache.get(userId);
    if (cached) {
      return cached;
    }

    const response = await this.spGet(
      `${this.webUrl}/_api/web/siteusers/getbyid(${userId})?$select=Id,Title,Email`,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      return undefined;
    }

    try {
      const data = await SharePointRestService.readJsonBody<{
        Id: number;
        Title: string;
        Email?: string;
      }>(response, `Failed to read site user ${userId}`);
      const user = { Id: data.Id, Title: data.Title, Email: data.Email };
      this.siteUserCache.set(userId, user);
      return user;
    } catch {
      return undefined;
    }
  }

  public async getSiteUsersByIds(
    userIds: number[]
  ): Promise<Array<{ Id: number; Title: string; Email?: string }>> {
    const uniqueIds = [...new Set(userIds.filter((id) => id > 0))];
    if (uniqueIds.length === 0) {
      return [];
    }

    const users = await Promise.all(uniqueIds.map((id) => this.getSiteUserById(id)));
    return users.filter((user): user is { Id: number; Title: string; Email?: string } => !!user);
  }

  public async addListItem(
    listTitle: string,
    fields: Record<string, SharePointFieldValue>
  ): Promise<number> {
    const response = await this.spPost(
      `${this.webUrl}/_api/web/lists/getbytitle('${this.escapeListTitle(listTitle)}')/items`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=nometadata',
          'odata-version': ''
        },
        body: JSON.stringify(fields)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add item to "${listTitle}": ${errorText}`);
    }

    const data = await SharePointRestService.readJsonBody<{ Id: number }>(
      response,
      `Failed to read add-item response for "${listTitle}"`
    );
    this.missingListTitles.delete(listTitle);
    return data.Id as number;
  }

  /**
   * Hard ceiling on how many items a single getAllItems call will pull into memory.
   * Protects the UI from runaway fetches on very large lists. Override per-call when needed.
   */
  public static readonly DEFAULT_MAX_ITEMS = 50000;

  private buildItemsUrl(
    listTitle: string,
    select: string,
    expand?: string,
    filter?: string,
    orderBy?: string,
    top?: number
  ): string {
    const safeTitle = this.escapeListTitle(listTitle);
    let url = `${this.webUrl}/_api/web/lists/getbytitle('${safeTitle}')/items?$select=${encodeURIComponent(select)}`;
    if (expand) {
      url += `&$expand=${encodeURIComponent(expand)}`;
    }
    if (filter) {
      url += `&$filter=${encodeURIComponent(filter)}`;
    }
    if (orderBy) {
      url += `&$orderby=${encodeURIComponent(orderBy)}`;
    }
    if (top) {
      url += `&$top=${top}`;
    }
    return url;
  }

  private isThresholdError(status: number, errorText: string): boolean {
    // -2147024860 / "exceeds the list view threshold" surfaces as a 500 from SharePoint.
    return (
      status === 500 &&
      /(list view threshold|exceeds the .* threshold|-2147024860|SPQueryThrottledException)/i.test(
        errorText
      )
    );
  }

  /**
   * Fetch a single page and return both the rows and the server-provided next-page link.
   * SharePoint paginates list items via a skiptoken in `odata.nextLink` — `$skip` is ignored.
   */
  private async fetchItemPage<T>(
    url: string,
    listTitle: string
  ): Promise<{ items: T[]; nextLink?: string }> {
    const response = await this.spGet(url, SPHttpClient.configurations.v1);
    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 404) {
        this.missingListTitles.add(listTitle);
      }
      if (this.isThresholdError(response.status, errorText)) {
        throw new Error(
          `The "${listTitle}" list exceeds SharePoint's 5,000-item list view threshold for this ` +
            `query. Add an index to the columns used for filtering/sorting (or narrow the filter) ` +
            `so the results can be paged.`
        );
      }
      throw new Error(`Failed to load items from "${listTitle}": ${errorText}`);
    }
    this.missingListTitles.delete(listTitle);
    const data = await SharePointRestService.readJsonBody<{
      value?: T[];
      'odata.nextLink'?: string;
      '@odata.nextLink'?: string;
      d?: { results?: T[]; __next?: string };
    }>(response, `Failed to read items from "${listTitle}"`);
    const nextLink: string | undefined =
      data['odata.nextLink'] || data['@odata.nextLink'] || data.d?.__next || undefined;
    const items = (data.value || data.d?.results || []) as T[];
    return { items, nextLink };
  }

  /**
   * Retrieve every matching item, paging through SharePoint's skiptoken links so lists with
   * more than 5,000 items are fully (and safely) traversed. Capped by `maxItems`.
   *
   * Tip: to page past the threshold on very large lists, sort/filter on indexed columns
   * (ID is always indexed). Non-indexed filters/sorts over >5,000 rows will throw a clear error.
   */
  public async getAllItems<T>(
    listTitle: string,
    select: string,
    expand?: string,
    filter?: string,
    orderBy?: string,
    pageSize = 2000,
    maxItems = SharePointRestService.DEFAULT_MAX_ITEMS
  ): Promise<T[]> {
    const safePageSize = Math.min(Math.max(pageSize, 1), 5000);
    const results: T[] = [];
    let nextUrl: string | undefined = this.buildItemsUrl(
      listTitle,
      select,
      expand,
      filter,
      orderBy,
      safePageSize
    );

    // Guard against pathological loops: enough pages to cover maxItems plus a small buffer.
    const maxPages = Math.ceil(maxItems / safePageSize) + 2;
    let pageCount = 0;

    while (nextUrl && pageCount < maxPages) {
      const page: { items: T[]; nextLink?: string } = await this.fetchItemPage<T>(
        nextUrl,
        listTitle
      );
      results.push(...page.items);
      pageCount += 1;

      if (results.length >= maxItems) {
        results.length = maxItems;
        break;
      }

      nextUrl = page.nextLink;
    }

    return results;
  }

  public async getItems<T>(
    listTitle: string,
    select: string,
    expand?: string,
    filter?: string,
    orderBy?: string,
    top?: number
  ): Promise<T[]> {
    const url = this.buildItemsUrl(listTitle, select, expand, filter, orderBy, top || 500);
    const page = await this.fetchItemPage<T>(url, listTitle);
    return page.items;
  }

  public async itemExistsByFilter(listTitle: string, filter: string): Promise<boolean> {
    const items = await this.getItems<{ Id: number }>(listTitle, 'Id', undefined, filter, undefined, 1);
    return items.length > 0;
  }

  /** Count items matching a filter (Id-only fetch, capped for performance). */
  public async countItemsByFilter(
    listTitle: string,
    filter: string,
    maxCount = 10000
  ): Promise<number> {
    if (this.missingListTitles.has(listTitle)) {
      return 0;
    }
    const items = await this.getAllItems<{ Id: number }>(
      listTitle,
      'Id',
      undefined,
      filter,
      undefined,
      5000,
      maxCount
    );
    return items.length;
  }

  public async listHasItems(listTitle: string): Promise<boolean> {
    return this.itemExistsByFilter(listTitle, 'Id gt 0');
  }

  public async updateItem(
    listTitle: string,
    itemId: number,
    fields: Record<string, SharePointFieldValue | undefined>
  ): Promise<void> {
    const cleanFields: Record<string, SharePointFieldValue> = {};
    Object.keys(fields).forEach((key) => {
      const value = fields[key];
      if (value !== undefined) {
        cleanFields[key] = value;
      }
    });

    const response = await this.spPost(
      `${this.webUrl}/_api/web/lists/getbytitle('${this.escapeListTitle(listTitle)}')/items(${itemId})`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=nometadata',
          'odata-version': '',
          'IF-MATCH': '*',
          'X-HTTP-Method': 'MERGE'
        },
        body: JSON.stringify(cleanFields)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update item ${itemId}: ${errorText}`);
    }
    this.missingListTitles.delete(listTitle);
  }

  public async updateChoiceFieldChoices(
    listTitle: string,
    fieldInternalName: string,
    choices: string[]
  ): Promise<void> {
    const list = await this.getListByTitle(listTitle);
    if (!list) {
      throw new Error(`List "${listTitle}" was not found.`);
    }

    const fieldResponse = await this.spGet(
      `${this.listGuidUrl(list.Id, `fields/getbyinternalnameortitle('${fieldInternalName}')`)}?$select=Id,InternalName,TypeAsString`,
      SPHttpClient.configurations.v1
    );

    if (!fieldResponse.ok) {
      const errorText = await fieldResponse.text();
      throw new Error(`Failed to load field "${fieldInternalName}": ${errorText}`);
    }

    const fieldData = (await fieldResponse.json()) as { Id: string; TypeAsString?: string };
    const uniqueChoices = Array.from(new Set(choices.map((choice) => choice.trim()).filter(Boolean)));
    if (uniqueChoices.length === 0) {
      return;
    }

    const response = await this.spPost(
      `${this.listGuidUrl(list.Id, `fields('${fieldData.Id}')`)}`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=nometadata',
          'odata-version': '',
          'IF-MATCH': '*',
          'X-HTTP-Method': 'MERGE'
        },
        body: JSON.stringify({
          Choices: uniqueChoices
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update choices for "${fieldInternalName}": ${errorText}`);
    }
  }

  public async deleteItem(listTitle: string, itemId: number): Promise<void> {
    const response = await this.spPost(
      `${this.webUrl}/_api/web/lists/getbytitle('${this.escapeListTitle(listTitle)}')/items(${itemId})`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'IF-MATCH': '*',
          'X-HTTP-Method': 'DELETE'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete item ${itemId} from "${listTitle}": ${errorText}`);
    }
  }

  public async ensureUser(loginName: string): Promise<{ Id: number; Title: string; Email: string }> {
    const response = await this.spPost(
      `${this.webUrl}/_api/web/ensureuser`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=nometadata',
          'odata-version': ''
        },
        body: JSON.stringify({ logonName: loginName })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Could not resolve user "${loginName}": ${errorText}`);
    }

    const data = await response.json();
    return {
      Id: data.Id as number,
      Title: data.Title as string,
      Email: (data.Email as string) || loginName
    };
  }

  public async resolvePerson(key: string): Promise<IPersonPickerItem> {
    const user = await this.ensureUser(key);
    return {
      id: user.Id,
      title: user.Title,
      email: user.Email,
      loginName: key
    };
  }

  public async searchPeople(query: string, principalType = 15): Promise<IPersonPickerSuggestion[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const response = await this.spPost(
      `${this.webUrl}/_api/SP.UI.ApplicationPages.ClientPeoplePickerWebServiceInterface.ClientPeoplePickerSearchUser`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=minimalmetadata',
          'Content-Type': 'application/json;odata=minimalmetadata',
          'odata-version': ''
        },
        body: JSON.stringify({
          queryParams: {
            AllowEmailAddresses: true,
            AllowMultipleEntities: false,
            AllowOnlyEmailAddresses: false,
            AllUrlZones: false,
            MaximumEntitySuggestions: 20,
            PrincipalSource: 15,
            PrincipalType: principalType,
            QueryString: trimmed
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`People search failed: ${errorText}`);
    }

    // ClientPeoplePickerSearchUser returns a JSON-encoded string. The wrapper
    // shape depends on the OData metadata level SPHttpClient negotiates:
    //   verbose          -> { d: { ClientPeoplePickerSearchUser: "..." } }
    //   minimal/nometada -> { value: "..." }
    // Handle every shape, and tolerate the value already being parsed.
    const data = (await response.json()) as {
      d?: { ClientPeoplePickerSearchUser?: string };
      ClientPeoplePickerSearchUser?: string;
      value?: string | unknown[];
    };
    const rawCandidate =
      data.d?.ClientPeoplePickerSearchUser ??
      data.ClientPeoplePickerSearchUser ??
      data.value ??
      '[]';

    let parsed: Array<{
      Key?: string;
      DisplayText?: string;
      Description?: string;
      EntityType?: string;
    }> = [];

    try {
      parsed =
        typeof rawCandidate === 'string'
          ? (JSON.parse(rawCandidate) as typeof parsed)
          : (rawCandidate as typeof parsed);
    } catch {
      return [];
    }

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry) => Boolean(entry.Key && entry.DisplayText))
      .map((entry) => {
        const entityType = entry.EntityType || '';
        const lowerType = entityType.toLowerCase();
        return {
          key: entry.Key as string,
          title: entry.DisplayText as string,
          description: entry.Description,
          entityType,
          isGroup:
            lowerType.includes('group') || lowerType === 'secgrp' || lowerType === 'spgroup'
        };
      });
  }

  public async getCurrentUser(): Promise<{
    Id: number;
    Title: string;
    Email: string;
    LoginName: string;
    IsSiteAdmin: boolean;
  }> {
    const response = await this.spGet(
      `${this.webUrl}/_api/web/currentuser?$select=Id,Title,Email,LoginName,IsSiteAdmin`,
      SPHttpClient.configurations.v1
    );
    if (!response.ok) {
      throw new Error('Failed to load current user');
    }
    return SharePointRestService.readJsonBody<{
      Id: number;
      Title: string;
      Email: string;
      LoginName: string;
      IsSiteAdmin: boolean;
    }>(response, 'Failed to read current user');
  }

  public async getAssociatedOwnerGroup(): Promise<{ Id: number; Title: string } | undefined> {
    try {
      const response = await this.spGet(
        `${this.webUrl}/_api/web/AssociatedOwnerGroup?$select=Id,Title`,
        SPHttpClient.configurations.v1
      );
      if (!response.ok) {
        return undefined;
      }
      const data = await SharePointRestService.readJsonBody<{ Id: number; Title: string }>(
        response,
        'Failed to read associated owner group'
      );
      return data?.Id ? { Id: data.Id, Title: data.Title } : undefined;
    } catch {
      return undefined;
    }
  }

  public async isUserInSiteGroup(groupId: number, userId: number): Promise<boolean> {
    try {
      const response = await this.spGet(
        `${this.webUrl}/_api/web/sitegroups(${groupId})/users?$select=Id&$filter=Id eq ${userId}&$top=1`,
        SPHttpClient.configurations.v1
      );
      if (!response.ok) {
        return false;
      }
      const data = await SharePointRestService.readJsonBody<{ value?: Array<{ Id: number }> }>(
        response,
        'Failed to read site group members'
      );
      return Boolean(data.value?.length);
    } catch {
      return false;
    }
  }

  public async isCurrentUserSiteOwner(): Promise<{
    isSiteOwner: boolean;
    isSiteAdmin: boolean;
    isOwnerGroupMember: boolean;
    hasFullControl: boolean;
    ownerGroupTitle?: string;
    message?: string;
  }> {
    const user = await this.getCurrentUser();
    if (user.IsSiteAdmin) {
      return {
        isSiteOwner: true,
        isSiteAdmin: true,
        isOwnerGroupMember: false,
        hasFullControl: true
      };
    }

    let hasFullControl = false;
    try {
      const permissions = await this.getWebEffectiveBasePermissions();
      hasFullControl = hasFullControlPermissions(permissions.high, permissions.low);
    } catch {
      hasFullControl = false;
    }

    const ownerGroup = await this.getAssociatedOwnerGroup();
    let isOwnerGroupMember = false;
    if (ownerGroup) {
      isOwnerGroupMember = await this.isUserInSiteGroup(ownerGroup.Id, user.Id);
    }

    const isSiteOwner = hasFullControl;
    return {
      isSiteOwner,
      isSiteAdmin: false,
      isOwnerGroupMember,
      hasFullControl,
      ownerGroupTitle: ownerGroup?.Title,
      message: isSiteOwner ? undefined : SETUP_FULL_CONTROL_REQUIRED_MESSAGE
    };
  }

  public async ensureCurrentUserInOwnersGroup(): Promise<{
    success: boolean;
    added: boolean;
    alreadyOwner: boolean;
    ownerGroupTitle?: string;
    message?: string;
  }> {
    const access = await this.isCurrentUserSiteOwner();
    if (access.isSiteOwner) {
      return {
        success: true,
        added: false,
        alreadyOwner: true,
        ownerGroupTitle: access.ownerGroupTitle
      };
    }

    const ownerGroup = await this.getAssociatedOwnerGroup();
    if (!ownerGroup) {
      return {
        success: false,
        added: false,
        alreadyOwner: false,
        message: 'This site does not expose an Owners group. A site collection administrator must grant you access.'
      };
    }

    const user = await this.getCurrentUser();
    if (!user.LoginName) {
      return {
        success: false,
        added: false,
        alreadyOwner: false,
        ownerGroupTitle: ownerGroup.Title,
        message: 'Could not resolve your SharePoint login name to add you to the Owners group.'
      };
    }

    try {
      const response = await this.spPost(
        `${this.webUrl}/_api/web/sitegroups(${ownerGroup.Id})/users`,
        SPHttpClient.configurations.v1,
        {
          headers: {
            Accept: 'application/json;odata=nometadata',
            'Content-Type': 'application/json;odata=nometadata',
            'odata-version': ''
          },
          body: JSON.stringify({
            LoginName: user.LoginName
          })
        }
      );

      if (response.ok || response.status === 409) {
        const verified = await this.isUserInSiteGroup(ownerGroup.Id, user.Id);
        return {
          success: verified,
          added: verified,
          alreadyOwner: false,
          ownerGroupTitle: ownerGroup.Title,
          message: verified
            ? undefined
            : 'The Owners group could not be updated for your account.'
        };
      }

      const errorText = await response.text();
      return {
        success: false,
        added: false,
        alreadyOwner: false,
        ownerGroupTitle: ownerGroup.Title,
        message: errorText || 'You do not have permission to add members to the Owners group.'
      };
    } catch (error) {
      return {
        success: false,
        added: false,
        alreadyOwner: false,
        ownerGroupTitle: ownerGroup.Title,
        message: error instanceof Error ? error.message : 'Failed to update the Owners group.'
      };
    }
  }

  private static normalizeGuid(value: string | undefined): string {
    return (value || '').replace(/[{}]/g, '').trim().toLowerCase();
  }

  /**
   * Registers the SPFx form customizer on the Risks list for SharePoint Online.
   * Required when skipFeatureDeployment is true — elements.xml CustomActions are not
   * activated tenant-wide, so setup registers the extension at the site level.
   */
  public async ensureAssetFormCustomizerRegistered(listId: string): Promise<{
    registered: boolean;
    alreadyRegistered: boolean;
    message?: string;
  }> {
    const normalizedListId = SharePointRestService.normalizeGuid(listId);
    const componentId = ASSET_FORM_CUSTOMIZER_ID.toLowerCase();

    try {
      const response = await this.spGet(
        `${this.webUrl}/_api/web/UserCustomActions?$select=Id,Name,ClientSideComponentId,RegistrationId,Location`,
        SPHttpClient.configurations.v1
      );

      if (response.ok) {
        const data = await SharePointRestService.readJsonBody<{
          value?: Array<{
            Id?: string;
            Name?: string;
            ClientSideComponentId?: string;
            RegistrationId?: string;
            Location?: string;
          }>;
        }>(response, 'Failed to read user custom actions');

        const existing = (data.value || []).find((action) => {
          if (action.Location !== 'ClientSideExtension.FormCustomizer') {
            return false;
          }
          const matchesComponent =
            SharePointRestService.normalizeGuid(action.ClientSideComponentId) === componentId;
          const matchesList =
            SharePointRestService.normalizeGuid(action.RegistrationId) === normalizedListId;
          const matchesName = action.Name === ASSET_FORM_CUSTOMIZER_ACTION_NAME;
          return matchesComponent && (matchesList || matchesName);
        });

        if (existing) {
          return { registered: true, alreadyRegistered: true };
        }
      }

      const registrationId = normalizedListId.indexOf('-') >= 0 ? `{${normalizedListId}}` : listId;
      const createResponse = await this.spPost(
        `${this.webUrl}/_api/web/UserCustomActions`,
        SPHttpClient.configurations.v1,
        {
          headers: {
            Accept: 'application/json;odata=nometadata',
            'Content-Type': 'application/json;odata=nometadata',
            'odata-version': ''
          },
          body: JSON.stringify({
            Title: DEFAULT_APP_TITLE + ' form',
            Name: ASSET_FORM_CUSTOMIZER_ACTION_NAME,
            Location: 'ClientSideExtension.FormCustomizer',
            RegistrationType: 1,
            RegistrationId: registrationId,
            ClientSideComponentId: ASSET_FORM_CUSTOMIZER_ID,
            ClientSideComponentProperties: '{}'
          })
        }
      );

      if (createResponse.ok || createResponse.status === 409) {
        return { registered: true, alreadyRegistered: false };
      }

      const errorText = await createResponse.text();
      return {
        registered: false,
        alreadyRegistered: false,
        message: `Could not register the asset form customizer: ${errorText}`
      };
    } catch (error) {
      return {
        registered: false,
        alreadyRegistered: false,
        message:
          error instanceof Error
            ? error.message
            : 'Could not register the asset form customizer on this site.'
      };
    }
  }

  public async getRequestDigest(): Promise<string> {
    const response = await this.spPost(
      `${this.webUrl}/_api/contextinfo`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=nometadata',
          'odata-version': ''
        }
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to load request digest: ${errorText}`);
    }
    const data = await SharePointRestService.readJsonBody<{ FormDigestValue: string }>(
      response,
      'Failed to read request digest'
    );
    return data.FormDigestValue as string;
  }

  private escapeListTitle(title: string): string {
    return title.replace(/'/g, "''");
  }

  public async deleteField(listId: string, internalName: string): Promise<void> {
    await this.safeDeleteField(listId, internalName);
  }

  private async safeDeleteField(listId: string, internalName: string): Promise<void> {
    if (isSharePointSystemFieldName(internalName)) {
      return;
    }

    const field = await this.getFieldMetadata(listId, internalName);
    if (field && !isCustomDeletableField(field)) {
      return;
    }

    try {
      const safeName = this.escapeODataString(internalName);
      const response = await this.spPost(
        `${this.listGuidUrl(listId, `fields/getbyinternalnameortitle('${safeName}')`)}`,
        SPHttpClient.configurations.v1,
        {
          headers: {
            Accept: 'application/json;odata=nometadata',
            'IF-MATCH': '*',
            'X-HTTP-Method': 'DELETE'
          }
        }
      );

      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        const isProtectedField =
          errorText.includes('InvalidOperationException') ||
          errorText.includes('current state of the object');

        if (isProtectedField) {
          return;
        }

        throw new Error(`Failed to delete field "${internalName}": ${errorText}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to delete field')) {
        throw error;
      }
      /* Field may already be gone */
    }

    this.invalidateListCustomFieldsCache(listId);
  }

  public async recycleList(listId: string): Promise<void> {
    const response = await this.spPost(
      `${this.listGuidUrl(listId)}`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'IF-MATCH': '*',
          'X-HTTP-Method': 'DELETE'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to recycle list: ${errorText}`);
    }
  }

  private async fieldExists(listId: string, internalName: string): Promise<boolean> {
    const existing = await this.getFieldsByInternalNames(listId, [internalName, `${internalName}Id`]);
    return existing.has(internalName) || existing.has(`${internalName}Id`);
  }

  private async createFieldFromXml(
    listId: string,
    schemaXml: string,
    options: number
  ): Promise<{ ok: boolean; error: string }> {
    const response = await this.spPost(
      `${this.listGuidUrl(listId, 'fields/CreateFieldAsXml')}`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=nometadata',
          'odata-version': ''
        },
        body: JSON.stringify({
          parameters: {
            SchemaXml: schemaXml,
            Options: options
          }
        })
      }
    );

    if (!response.ok) {
      return { ok: false, error: await response.text() };
    }

    return { ok: true, error: '' };
  }

  private resolveExpectedSharePointFieldType(fieldType: string): string {
    switch (fieldType) {
      case 'User':
        return 'User';
      case 'UserMulti':
        return 'UserMulti';
      case 'Lookup':
        return 'Lookup';
      case 'LookupMulti':
        return 'LookupMulti';
      case 'Number':
        return 'Number';
      case 'Currency':
        return 'Currency';
      case 'DateTime':
        return 'DateTime';
      case 'Choice':
        return 'Choice';
      case 'Boolean':
        return 'Boolean';
      case 'Note':
        return 'Note';
      default:
        return 'Text';
    }
  }

  private isSharePointFieldTypeCompatible(expectedType: string, actualType: string): boolean {
    if (expectedType === actualType) {
      return true;
    }

    if (expectedType === 'UserMulti' && actualType === 'User') {
      return true;
    }

    if (expectedType === 'LookupMulti' && actualType === 'Lookup') {
      return true;
    }

    return false;
  }

  private async removeFieldIfTypeMismatch(
    listId: string,
    field: {
      internalName: string;
      displayName: string;
      type: string;
      optional?: boolean;
    }
  ): Promise<boolean> {
    const metadata = await this.getFieldMetadata(listId, field.internalName);
    if (!metadata?.TypeAsString || !isCustomDeletableField(metadata)) {
      return false;
    }

    const expectedType = this.resolveExpectedSharePointFieldType(field.type);
    if (this.isSharePointFieldTypeCompatible(expectedType, metadata.TypeAsString)) {
      return false;
    }

    await this.safeDeleteField(listId, metadata.InternalName);
    await this.waitForFieldGone(listId, metadata.InternalName);
    return true;
  }

  private async createUserFieldViaFieldTypeKind(
    listId: string,
    internalName: string,
    displayName: string,
    required: boolean,
    multi: boolean,
    userSelectionMode: 'PeopleOnly' | 'PeopleAndGroups' = 'PeopleOnly'
  ): Promise<boolean> {
    const fieldType = multi ? 'UserMulti' : 'User';
    const multiAttr = multi ? ' Mult="TRUE"' : '';
    const legacyId = LEGACY_FIELD_IDS[internalName];
    const idAttr = legacyId ? ` ID="{${legacyId}}" ` : ' ';
    const schemaVariants = [
      `<Field Type="${fieldType}"${idAttr}Name="${internalName}" StaticName="${internalName}" DisplayName="${this.escapeXml(displayName)}" Required="${required ? 'TRUE' : 'FALSE'}" List="UserInfo"${multiAttr} UserSelectionMode="${userSelectionMode}" />`,
      `<Field Type="${fieldType}"${idAttr}Name="${internalName}" StaticName="${internalName}" DisplayName="${this.escapeXml(internalName)}" Required="${required ? 'TRUE' : 'FALSE'}" List="UserInfo"${multiAttr} UserSelectionMode="${userSelectionMode}" />`
    ];

    for (const schemaXml of schemaVariants) {
      const xmlResult = await this.createFieldFromXmlWithHints(listId, schemaXml);
      if (xmlResult.ok) {
        return true;
      }
    }

    return false;
  }

  private fieldPresenceVariants(internalName: string): string[] {
    if (internalName.endsWith('Id') && internalName.length > 2) {
      const baseName = internalName.slice(0, -2);
      return [internalName, baseName, `${baseName}Id`];
    }

    return [internalName, `${internalName}Id`];
  }

  private async getMissingFields(listId: string, internalNames: string[]): Promise<string[]> {
    if (internalNames.length === 0) {
      return [];
    }

    const queryNames = Array.from(
      new Set(
        internalNames.reduce<string[]>((names, name) => {
          this.fieldPresenceVariants(name).forEach((variant) => names.push(variant));
          return names;
        }, [])
      )
    );
    const existing = await this.getFieldsByInternalNamesInChunks(listId, queryNames);
    return internalNames.filter(
      (name) => !this.fieldPresenceVariants(name).some((variant) => existing.has(variant))
    );
  }

  private async getFieldsByInternalNamesInChunks(
    listId: string,
    internalNames: string[]
  ): Promise<Set<string>> {
    const existing = new Set<string>();
    // Keep OData $filter short — AppSettings has 30+ columns; large OR filters return 400 and look "missing".
    const chunkSize = 8;

    for (let index = 0; index < internalNames.length; index += chunkSize) {
      const chunk = internalNames.slice(index, index + chunkSize);
      const lookupNames: string[] = [];
      chunk.forEach((name) => {
        lookupNames.push(name, `${name}Id`);
      });
      const found = await this.getFieldsByInternalNames(listId, lookupNames);
      found.forEach((name) => existing.add(name));
    }

    return existing;
  }

  private async getFieldsByInternalNames(
    listId: string,
    internalNames: string[]
  ): Promise<Set<string>> {
    if (internalNames.length === 0) {
      return new Set<string>();
    }

    const filter = internalNames
      .map((name) => `InternalName eq '${this.escapeODataString(name)}'`)
      .join(' or ');

    const response = await this.spGet(
      `${this.listGuidUrl(listId, 'fields')}?$select=InternalName&$filter=${encodeURIComponent(filter)}`,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      return new Set<string>();
    }

    try {
      const data = await SharePointRestService.readJsonBody<{ value?: Array<{ InternalName: string }> }>(
        response,
        'Failed to read list fields'
      );
      const values = data.value || [];
      return new Set(values.map((field) => field.InternalName));
    } catch {
      return new Set<string>();
    }
  }

  /**
   * Returns the subset of `internalNames` that exist on the list AND can be used with
   * `$expand` (User/UserMulti/Lookup/LookupMulti). Prevents HTTP 400s from expanding a
   * column that is missing or not a lookup-type field on a given (e.g. legacy) list.
   */
  public async getExpandableFieldNames(
    listId: string,
    internalNames: string[]
  ): Promise<Set<string>> {
    if (internalNames.length === 0) {
      return new Set<string>();
    }

    const filter = internalNames
      .map((name) => `InternalName eq '${this.escapeODataString(name)}'`)
      .join(' or ');

    const response = await this.spGet(
      `${this.listGuidUrl(listId, 'fields')}?$select=InternalName,TypeAsString&$filter=${encodeURIComponent(filter)}`,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      return new Set<string>();
    }

    const expandableTypes = new Set(['User', 'UserMulti', 'Lookup', 'LookupMulti']);
    try {
      const data = await SharePointRestService.readJsonBody<{
        value?: Array<{ InternalName: string; TypeAsString: string }>;
      }>(response, 'Failed to read list field types');
      const result = new Set<string>();
      for (const field of data.value || []) {
        if (expandableTypes.has(field.TypeAsString)) {
          result.add(field.InternalName);
        }
      }
      return result;
    } catch {
      return new Set<string>();
    }
  }

  private escapeODataString(value: string): string {
    return value.replace(/'/g, "''");
  }

  private normalizeGuid(value: string): string {
    return value.replace(/[{}]/g, '').trim();
  }

  private async ensureListTitleCache(): Promise<Map<string, string>> {
    if (this.listTitleByIdCache) {
      return this.listTitleByIdCache;
    }

    const cache = new Map<string, string>();
    try {
      const response = await this.spGet(
        `${this.webUrl}/_api/web/lists?$select=Id,Title&$filter=Hidden eq false&$top=5000`,
        SPHttpClient.configurations.v1
      );
      if (response.ok) {
        const data = (await response.json()) as { value?: Array<{ Id: string; Title: string }> };
        for (const list of data.value || []) {
          cache.set(this.normalizeGuid(list.Id), list.Title);
        }
      }
    } catch {
      // Fall back to per-list REST lookups below.
    }

    this.listTitleByIdCache = cache;
    return cache;
  }

  /** SharePoint REST expects guid'xxxxxxxx-xxxx-...' without braces. */
  private listGuidUrl(listId: string, relativePath = ''): string {
    const guid = this.normalizeGuid(listId);
    const path = relativePath ? `/${relativePath.replace(/^\//, '')}` : '';
    return `${this.webUrl}/_api/web/lists(guid'${guid}')${path}`;
  }

  private formatLookupListAttribute(listId: string): string {
    return `{${this.normalizeGuid(listId)}}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildLookupFieldSchemaVariants(field: {
    internalName: string;
    displayName: string;
    type: string;
    required?: boolean;
    lookupListId?: string;
    lookupField?: string;
  }): string[] {
    const variants = [this.buildFieldSchemaXml(field)];

    if (field.required) {
      variants.push(this.buildFieldSchemaXml({ ...field, required: false }));
    }

    if (field.lookupListId) {
      const listAttr = this.formatLookupListAttribute(field.lookupListId);
      const plainGuid = this.normalizeGuid(field.lookupListId);
      const showField = field.lookupField || 'Title';
      const multiAttr = field.type === 'LookupMulti' ? ' Mult="TRUE"' : '';
      const required = field.required ? 'TRUE' : 'FALSE';

      variants.push(
        `<Field Type="${field.type}" Name="${field.internalName}" StaticName="${field.internalName}" DisplayName="${this.escapeXml(field.displayName)}" Required="${required}" List="${listAttr}" ShowField="${showField}"${multiAttr} />`,
        `<Field Type="${field.type}" Name="${field.internalName}" StaticName="${field.internalName}" DisplayName="${this.escapeXml(field.displayName)}" List="${listAttr}" ShowField="${showField}"${multiAttr} />`,
        `<Field Type="${field.type}" Name="${field.internalName}" StaticName="${field.internalName}" DisplayName="${this.escapeXml(field.displayName)}" Required="${required}" List="${plainGuid}" ShowField="${showField}"${multiAttr} />`
      );
    }

    if (field.displayName.trim() !== field.internalName) {
      variants.push(
        this.buildFieldSchemaXml({
          ...field,
          displayName: field.internalName
        })
      );
    }

    return Array.from(new Set(variants));
  }

  private async createLookupFieldViaFieldTypeKind(
    listId: string,
    internalName: string,
    displayName: string,
    lookupListId: string,
    lookupField: string,
    required: boolean,
    multi: boolean
  ): Promise<boolean> {
    const listAttr = this.formatLookupListAttribute(lookupListId);
    const fieldType = multi ? 'LookupMulti' : 'Lookup';
    const multiAttr = multi ? ' Mult="TRUE"' : '';
    const schemaVariants = [
      `<Field Type="${fieldType}" Name="${internalName}" StaticName="${internalName}" DisplayName="${this.escapeXml(displayName)}" Required="${required ? 'TRUE' : 'FALSE'}" List="${listAttr}" ShowField="${lookupField}"${multiAttr} />`,
      `<Field Type="${fieldType}" Name="${internalName}" StaticName="${internalName}" DisplayName="${this.escapeXml(displayName)}" List="${listAttr}" ShowField="${lookupField}"${multiAttr} />`
    ];

    for (const schemaXml of schemaVariants) {
      const xmlResult = await this.createFieldFromXmlWithHints(listId, schemaXml);
      if (xmlResult.ok) {
        return true;
      }
    }

    return false;
  }

  private buildStandardFieldSchemaVariants(field: {
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
  }): string[] {
    const variants = [this.buildFieldSchemaXml(field)];

    if (field.displayName.trim() !== field.internalName) {
      variants.push(
        this.buildFieldSchemaXml({
          ...field,
          displayName: field.internalName
        })
      );
    }

    if (field.required) {
      variants.push(this.buildFieldSchemaXml({ ...field, required: false }));
    }

    if (field.type === 'Note' && field.richText) {
      variants.push(this.buildFieldSchemaXml({ ...field, richText: false }));
    }

    return Array.from(new Set(variants));
  }

  private buildFieldSchemaXml(field: {
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
    userSelectionMode?: 'PeopleOnly' | 'PeopleAndGroups';
  }): string {
    const required = field.required ? 'TRUE' : 'FALSE';
    const hidden = field.hidden ? 'TRUE' : 'FALSE';
    const userSelectionMode = field.userSelectionMode || 'PeopleOnly';

    const legacyId = LEGACY_FIELD_IDS[field.internalName];
    const idAttr = legacyId ? ` ID="{${legacyId}}" ` : ' ';
    const nameAttrs = `Name="${field.internalName}" StaticName="${field.internalName}"`;
    const displayName = `DisplayName="${this.escapeXml(field.displayName)}"`;

    switch (field.type) {
      case 'Text':
        return `<Field Type="Text"${idAttr}${nameAttrs} ${displayName} Required="${required}" Hidden="${hidden}" />`;
      case 'Note': {
        const richText = field.richText ? 'TRUE' : 'FALSE';
        const richTextMode = field.richText ? ' RichTextMode="FullHtml"' : '';
        const appendOnly = field.appendOnly ? ' AppendOnly="TRUE"' : '';
        return `<Field Type="Note"${idAttr}${nameAttrs} ${displayName} Required="${required}" Hidden="${hidden}" NumLines="6" RichText="${richText}"${richTextMode}${appendOnly} />`;
      }
      case 'Boolean':
        return `<Field Type="Boolean" ${nameAttrs} ${displayName} Hidden="${hidden}" />`;
      case 'DateTime': {
        const format = field.format === 'DateOnly' ? 'DateOnly' : 'DateTime';
        return `<Field Type="DateTime" ${nameAttrs} ${displayName} Required="${required}" Format="${format}" />`;
      }
      case 'Choice': {
        const choices = (field.choices || [])
          .map((c) => `<CHOICE>${this.escapeXml(c)}</CHOICE>`)
          .join('');
        const defaultXml = field.defaultValue
          ? `<Default>${this.escapeXml(field.defaultValue)}</Default>`
          : '';
        return `<Field Type="Choice" ${nameAttrs} ${displayName} Required="${required}">${defaultXml}<CHOICES>${choices}</CHOICES></Field>`;
      }
      case 'MultiChoice': {
        const choices = (field.choices || [])
          .map((c) => `<CHOICE>${this.escapeXml(c)}</CHOICE>`)
          .join('');
        return `<Field Type="MultiChoice" ${nameAttrs} ${displayName} Required="${required}"><CHOICES>${choices}</CHOICES></Field>`;
      }
      case 'Lookup':
        return `<Field Type="Lookup" ${nameAttrs} ${displayName} Required="${required}" List="${this.formatLookupListAttribute(field.lookupListId || '')}" ShowField="${field.lookupField || 'Title'}" />`;
      case 'LookupMulti':
        return `<Field Type="LookupMulti" ${nameAttrs} ${displayName} List="${this.formatLookupListAttribute(field.lookupListId || '')}" ShowField="${field.lookupField || 'Title'}" Mult="TRUE" />`;
      case 'User':
        return `<Field Type="User"${idAttr}${nameAttrs} ${displayName} Required="${required}" List="UserInfo" UserSelectionMode="${userSelectionMode}" />`;
      case 'UserMulti':
        return `<Field Type="UserMulti"${idAttr}${nameAttrs} ${displayName} Required="${required}" List="UserInfo" Mult="TRUE" UserSelectionMode="${userSelectionMode}" />`;
      case 'Number':
        return `<Field Type="Number" ${nameAttrs} ${displayName} Required="${required}" Hidden="${hidden}" />`;
      case 'Currency':
        return `<Field Type="Currency" ${nameAttrs} ${displayName} Required="${required}" Hidden="${hidden}" />`;
      default:
        return `<Field Type="Text" ${nameAttrs} ${displayName} />`;
    }
  }

  private buildUserFieldSchemaVariants(field: {
    internalName: string;
    displayName: string;
    type: string;
    required?: boolean;
    userSelectionMode?: 'PeopleOnly' | 'PeopleAndGroups';
  }): string[] {
    const primary = this.buildFieldSchemaXml(field);
    const required = field.required ? 'TRUE' : 'FALSE';
    const nameAttrs = `Name="${field.internalName}" StaticName="${field.internalName}"`;
    const displayName = `DisplayName="${this.escapeXml(field.displayName)}"`;
    const userSelectionMode = field.userSelectionMode || 'PeopleOnly';

    if (field.type === 'UserMulti') {
      const legacyId = LEGACY_FIELD_IDS[field.internalName];
      const idAttr = legacyId ? ` ID="{${legacyId}}" ` : ' ';
      return [
        primary,
        `<Field Type="User"${idAttr}${nameAttrs} ${displayName} Required="${required}" List="UserInfo" Mult="TRUE" UserSelectionMode="${userSelectionMode}" />`,
        `<Field Type="User"${idAttr}${nameAttrs} ${displayName} Required="${required}" List="UserInfo" ShowField="ImnName" UserSelectionMode="${userSelectionMode}" UserSelectionScope="0" Mult="TRUE" />`,
        ...(field.displayName.trim() !== field.internalName
          ? [
              this.buildFieldSchemaXml({
                ...field,
                displayName: field.internalName
              })
            ]
          : [])
      ];
    }

    const legacyId = LEGACY_FIELD_IDS[field.internalName];
    const idAttr = legacyId ? ` ID="{${legacyId}}" ` : ' ';

    return [
      primary,
      `<Field Type="User"${idAttr}${nameAttrs} ${displayName} Required="${required}" List="UserInfo" ShowField="ImnName" UserSelectionMode="${userSelectionMode}" UserSelectionScope="0" />`,
      ...(field.displayName.trim() !== field.internalName
        ? [
            this.buildFieldSchemaXml({
              ...field,
              displayName: field.internalName
            })
          ]
        : [])
    ];
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  public static async ensureOk(response: SPHttpClientResponse, message: string): Promise<void> {
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${message}: ${text}`);
    }
  }

  private static readonly EDITABLE_FIELD_TYPES = new Set([
    'Text',
    'Note',
    'Choice',
    'MultiChoice',
    'Number',
    'Currency',
    'Boolean',
    'DateTime',
    'Lookup',
    'User',
    'UserMulti'
  ]);

  public async getFormFields(listTitle: string): Promise<ISharePointFormField[]> {
    const list = await this.getListByTitle(listTitle);
    if (!list) {
      throw new Error(`List "${listTitle}" was not found.`);
    }

    const response = await this.spGet(
      `${this.listGuidUrl(list.Id, 'fields')}?$select=InternalName,Title,TypeAsString,Required,ReadOnlyField,Hidden,Choices,LookupList,LookupField,Format&$filter=Hidden eq false and ReadOnlyField eq false`,
      SPHttpClient.configurations.v1
    );

    await SharePointRestService.ensureOk(response, `Failed to load fields for "${listTitle}"`);
    const data = (await response.json()) as {
      value: Array<{
        InternalName: string;
        Title: string;
        TypeAsString: string;
        Required: boolean;
        ReadOnlyField: boolean;
        Hidden: boolean;
        Choices?: string[];
        LookupList?: string;
        LookupField?: string;
        Format?: string;
      }>;
    };

    const fields: ISharePointFormField[] = [];
    for (const field of data.value) {
      if (
        isSharePointSystemFieldName(field.InternalName) &&
        field.InternalName !== 'Title'
      ) {
        continue;
      }

      if (!SharePointRestService.EDITABLE_FIELD_TYPES.has(field.TypeAsString)) {
        continue;
      }

      let lookupListTitle: string | undefined;
      if (field.TypeAsString === 'Lookup' && field.LookupList) {
        lookupListTitle = await this.getListTitleById(field.LookupList);
      }

      fields.push({
        InternalName: field.InternalName,
        Title: field.Title,
        TypeAsString: field.TypeAsString,
        Required: field.Required,
        ReadOnlyField: field.ReadOnlyField,
        Hidden: field.Hidden,
        Choices: field.Choices,
        LookupListId: field.LookupList,
        LookupField: field.LookupField,
        LookupListTitle: lookupListTitle,
        Format: field.Format
      });
    }

    return fields.sort((a, b) => a.Title.localeCompare(b.Title));
  }

  public async getWebEffectiveBasePermissions(): Promise<IEffectivePermissions> {
    const response = await this.spGet(
      `${this.webUrl}/_api/web/effectivebasepermissions`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'odata-version': ''
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Unable to read site permissions: ${errorText}`);
    }

    const data = (await response.json()) as {
      EffectiveBasePermissions?: { High?: string | number; Low?: string | number };
      High?: string | number;
      Low?: string | number;
    };
    const payload = data.EffectiveBasePermissions || data;
    const high = Number(payload.High ?? 0);
    const low = Number(payload.Low ?? 0);
    return { high, low };
  }

  public async getEffectiveBasePermissions(listTitle: string, itemId?: number): Promise<IEffectivePermissions> {
    const safeTitle = this.escapeListTitle(listTitle);
    const url = itemId
      ? `${this.webUrl}/_api/web/lists/getbytitle('${safeTitle}')/items(${itemId})/EffectiveBasePermissions`
      : `${this.webUrl}/_api/web/lists/getbytitle('${safeTitle}')/EffectiveBasePermissions`;

    const response = await this.spGet(url, SPHttpClient.configurations.v1, {
      headers: {
        Accept: 'application/json;odata=nometadata',
        'odata-version': ''
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Unable to read permissions for "${listTitle}"${itemId ? ` item ${itemId}` : ''}: ${errorText}`
      );
    }

    const data = (await response.json()) as {
      EffectiveBasePermissions?: { High?: string | number; Low?: string | number };
      High?: string | number;
      Low?: string | number;
    };
    const payload = data.EffectiveBasePermissions || data;
    const high = Number(payload.High ?? 0);
    const low = Number(payload.Low ?? 0);
    return { high, low };
  }

  public async getListTitleById(listId: string): Promise<string | undefined> {
    const normalizedId = this.normalizeGuid(listId);
    if (!normalizedId) {
      return undefined;
    }

    const cache = await this.ensureListTitleCache();
    const cachedTitle = cache.get(normalizedId);
    if (cachedTitle) {
      return cachedTitle;
    }

    try {
      const response = await this.spGet(
        `${this.listGuidUrl(normalizedId)}?$select=Title`,
        SPHttpClient.configurations.v1
      );
      if (!response.ok) {
        return undefined;
      }
      const data = await response.json();
      const title = data.Title as string | undefined;
      if (title) {
        cache.set(normalizedId, title);
      }
      return title;
    } catch {
      return undefined;
    }
  }

  public async getListItemById<T>(
    listTitle: string,
    itemId: number,
    select: string,
    expand?: string
  ): Promise<T | undefined> {
    const safeTitle = this.escapeListTitle(listTitle);
    const expandQuery = expand ? `&$expand=${expand}` : '';
    const response = await this.spGet(
      `${this.webUrl}/_api/web/lists/getbytitle('${safeTitle}')/items(${itemId})?$select=${select}${expandQuery}`,
      SPHttpClient.configurations.v1
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      // eslint-disable-next-line no-console
      console.warn(
        `[SharePointRest] getListItemById("${listTitle}", ${itemId}) failed ${response.status}: ` +
          `select=${select} expand=${expand ?? '(none)'} :: ${errorText}`
      );
      return undefined;
    }

    return (await response.json()) as T;
  }

  public async getListItemVersions(
    listTitle: string,
    itemId: number,
    fieldInternalNames: string[] = []
  ): Promise<
    Array<{
      VersionId: number;
      VersionLabel: string;
      Created: string;
      IsCurrentVersion?: boolean;
      Editor?: { Title?: string; EMail?: string; Email?: string };
      CreatedBy?: { Title?: string; EMail?: string; Email?: string };
      fieldValues: Record<string, string>;
    }>
  > {
    const safeTitle = this.escapeListTitle(listTitle);
    const uniqueFields = Array.from(new Set(fieldInternalNames));
    // When no explicit field list is provided, request every column ($select=*)
    // so the caller can diff all changed fields dynamically.
    const allFields = uniqueFields.length === 0;
    const metaSelect = [
      'VersionId',
      'VersionLabel',
      'Created',
      'IsCurrentVersion',
      'Editor/Title',
      'Editor/EMail',
      'CreatedBy/Title',
      'CreatedBy/EMail'
    ];
    const selectFields = (allFields ? ['*', ...metaSelect] : [...metaSelect, ...uniqueFields]).join(',');

    const response = await this.spGet(
      `${this.webUrl}/_api/web/lists/getbytitle('${safeTitle}')/items(${itemId})/versions?$select=${selectFields}&$expand=Editor,CreatedBy&$orderby=VersionId desc`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Failed to load version history for item ${itemId}: ${errorText}`);
    }

    const data = await SharePointRestService.readJsonBody<{
      value?: Array<Record<string, unknown>>;
    }>(response, `Failed to read version history for item ${itemId}`);

    const META_KEYS = new Set([
      'VersionId',
      'VersionLabel',
      'Created',
      'IsCurrentVersion',
      'Editor',
      'CreatedBy'
    ]);

    return (data.value || []).map((version) => {
      const fieldValues: Record<string, string> = {};
      if (allFields) {
        Object.keys(version).forEach((fieldName) => {
          if (!META_KEYS.has(fieldName)) {
            fieldValues[fieldName] = normalizeVersionFieldValue(version[fieldName]);
          }
        });
      } else {
        uniqueFields.forEach((fieldName) => {
          fieldValues[fieldName] = normalizeVersionFieldValue(version[fieldName]);
        });
      }

      const editor = (version.CreatedBy || version.Editor) as
        | { Title?: string; EMail?: string; Email?: string }
        | undefined;

      return {
        VersionId: Number(version.VersionId),
        VersionLabel: String(version.VersionLabel || ''),
        Created: String(version.Created || ''),
        IsCurrentVersion: version.IsCurrentVersion as boolean | undefined,
        Editor: editor
          ? {
              Title: editor.Title,
              EMail: editor.EMail || editor.Email
            }
          : undefined,
        fieldValues
      };
    });
  }

  /**
   * Map of custom (non base-type) field internal names to their display titles
   * for a list. Used to resolve human-readable labels when diffing version history.
   */
  public async getListFieldLabels(listTitle: string): Promise<Record<string, string>> {
    const list = await this.getListByTitle(listTitle);
    if (!list) {
      return {};
    }

    const fields = await this.getCustomListFieldsMap(list.Id);
    const labels: Record<string, string> = {};
    for (const field of fields.values()) {
      if (!field.InternalName || isSharePointSystemFieldName(field.InternalName)) {
        continue;
      }
      labels[field.InternalName] = field.Title || field.InternalName;
    }
    return labels;
  }

  /** Ensure OOTB list item attachments are enabled (Risks list). */
  public async ensureListAttachmentsEnabled(listId: string): Promise<void> {
    const response = await this.spPost(
      `${this.listGuidUrl(listId)}`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=nometadata',
          'odata-version': '',
          'IF-MATCH': '*',
          'X-HTTP-Method': 'MERGE'
        },
        body: JSON.stringify({ EnableAttachments: true })
      }
    );

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new Error(`Failed to enable list attachments: ${errorText}`);
    }
  }

  public async getItemAttachments(
    listTitle: string,
    itemId: number
  ): Promise<Array<{ FileName: string; ServerRelativeUrl: string }>> {
    const safeTitle = this.escapeListTitle(listTitle);
    const response = await this.spGet(
      `${this.webUrl}/_api/web/lists/getbytitle('${safeTitle}')/items(${itemId})/AttachmentFiles`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'odata-version': ''
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      const errorText = await response.text();
      throw new Error(`Failed to load attachments: ${errorText}`);
    }

    const data = await SharePointRestService.readJsonBody<{
      value?: Array<{ FileName: string; ServerRelativeUrl: string }>;
    }>(response, `Failed to read attachments for item ${itemId}`);
    return data.value || [];
  }

  public async addItemAttachment(
    listTitle: string,
    itemId: number,
    fileName: string,
    content: ArrayBuffer
  ): Promise<void> {
    const safeTitle = this.escapeListTitle(listTitle);
    const safeFileName = this.escapeODataString(fileName);
    const response = await this.spPost(
      `${this.webUrl}/_api/web/lists/getbytitle('${safeTitle}')/items(${itemId})/AttachmentFiles/add(FileName='${safeFileName}')`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(content.byteLength)
        },
        body: content
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload "${fileName}": ${errorText}`);
    }
  }

  public async deleteItemAttachment(
    listTitle: string,
    itemId: number,
    fileName: string
  ): Promise<void> {
    const safeTitle = this.escapeListTitle(listTitle);
    const safeFileName = this.escapeODataString(fileName);
    const response = await this.spPost(
      `${this.webUrl}/_api/web/lists/getbytitle('${safeTitle}')/items(${itemId})/AttachmentFiles('${safeFileName}')`,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'IF-MATCH': '*',
          'X-HTTP-Method': 'DELETE'
        }
      }
    );

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new Error(`Failed to delete "${fileName}": ${errorText}`);
    }
  }
}
