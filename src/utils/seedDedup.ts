const BUSINESS_LIST_TITLE = 'lstBusiness';
const PROJECTS_LIST_TITLE = 'Projects';
const SUB_CATEGORIES_LIST_TITLE = 'SubCategories';

export type SeedRow = Record<string, string | number | boolean>;

export function getSeedRowKey(listTitle: string, row: SeedRow): string {
  const title = String(row.Title || '').trim();
  if (!title) {
    return '';
  }

  const normalizedTitle = title.toLowerCase();

  if (listTitle === PROJECTS_LIST_TITLE) {
    const code = String(row.Code || '').trim();
    if (code) {
      return `code:${code.toLowerCase()}`;
    }
    return `${String(row.BusinessTitle || '').trim().toLowerCase()}::${normalizedTitle}`;
  }

  if (listTitle === BUSINESS_LIST_TITLE) {
    const businessCode = String(row.BusinessCode || '').trim();
    if (businessCode) {
      return `code:${businessCode.toLowerCase()}`;
    }
    return normalizedTitle;
  }

  if (listTitle === SUB_CATEGORIES_LIST_TITLE) {
    return `${String(row.ParentCategoryTitle || '').trim().toLowerCase()}::${normalizedTitle}`;
  }

  const rating = String(row.Rating || '').trim();
  if (rating) {
    return `${normalizedTitle}::${rating.toLowerCase()}`;
  }

  return normalizedTitle;
}

export function collectSeedKeyVariants(listTitle: string, row: SeedRow): string[] {
  const keys = new Set<string>();
  const primary = getSeedRowKey(listTitle, row);
  if (primary) {
    keys.add(primary);
  }

  const title = String(row.Title || '').trim().toLowerCase();
  if (title) {
    keys.add(`title:${title}`);
  }

  if (listTitle === PROJECTS_LIST_TITLE) {
    const code = String(row.Code || '').trim();
    if (code) {
      keys.add(`code:${code.toLowerCase()}`);
    }
    const businessTitle = String(row.BusinessTitle || '').trim().toLowerCase();
    if (businessTitle && title) {
      keys.add(`${businessTitle}::${title}`);
    }
  }

  if (listTitle === BUSINESS_LIST_TITLE) {
    const businessCode = String(row.BusinessCode || '').trim();
    if (businessCode) {
      keys.add(`code:${businessCode.toLowerCase()}`);
    }
  }

  if (listTitle === SUB_CATEGORIES_LIST_TITLE) {
    const parentTitle = String(row.ParentCategoryTitle || '').trim().toLowerCase();
    if (parentTitle && title) {
      keys.add(`${parentTitle}::${title}`);
    }
  }

  const rating = String(row.Rating || '').trim();
  if (rating && title) {
    keys.add(`${title}::${rating.toLowerCase()}`);
  }

  return Array.from(keys);
}

export function indexExistingSeedKeys(
  listTitle: string,
  items: Array<Record<string, unknown>>
): Set<string> {
  const keys = new Set<string>();

  for (const item of items) {
    const row: SeedRow = {
      Title: String(item.Title || '')
    };

    if (listTitle === PROJECTS_LIST_TITLE) {
      if (item.Code) {
        row.Code = String(item.Code);
      }
      const business = item.Business as { Title?: string } | undefined;
      if (business?.Title) {
        row.BusinessTitle = business.Title;
      }
    }

    if (listTitle === BUSINESS_LIST_TITLE && item.BusinessCode) {
      row.BusinessCode = String(item.BusinessCode);
    }

    if (listTitle === SUB_CATEGORIES_LIST_TITLE) {
      const parent = (item.AM_ParentCategory ?? item.ParentCategory) as
        | { Title?: string }
        | undefined;
      if (parent?.Title) {
        row.ParentCategoryTitle = parent.Title;
      }
    }

    if (item.Rating !== undefined && item.Rating !== null && item.Rating !== '') {
      row.Rating = String(item.Rating);
    }

    collectSeedKeyVariants(listTitle, row).forEach((key) => keys.add(key));
  }

  return keys;
}

export function isSeedRowIndexed(
  keys: Set<string>,
  listTitle: string,
  row: SeedRow
): boolean {
  return collectSeedKeyVariants(listTitle, row).some((key) => keys.has(key));
}

export function markSeedRowIndexed(
  keys: Set<string>,
  listTitle: string,
  row: SeedRow
): void {
  collectSeedKeyVariants(listTitle, row).forEach((key) => keys.add(key));
}

export function dedupeSeedRows(
  listTitle: string,
  seedData: SeedRow[]
): SeedRow[] {
  const seen = new Set<string>();
  const unique: SeedRow[] = [];

  for (const row of seedData) {
    const variants = collectSeedKeyVariants(listTitle, row);
    if (variants.length === 0 || variants.some((key) => seen.has(key))) {
      continue;
    }
    variants.forEach((key) => seen.add(key));
    unique.push(row);
  }

  return unique;
}

export function buildSeedRowFromListItem(
  listTitle: string,
  item: Record<string, unknown>
): SeedRow {
  const row: SeedRow = {
    Title: String(item.Title || '')
  };

  if (listTitle === PROJECTS_LIST_TITLE) {
    if (item.Code) {
      row.Code = String(item.Code);
    }
    const business = item.Business as { Title?: string } | undefined;
    if (business?.Title) {
      row.BusinessTitle = business.Title;
    }
  }

  if (listTitle === BUSINESS_LIST_TITLE && item.BusinessCode) {
    row.BusinessCode = String(item.BusinessCode);
  }

  if (listTitle === SUB_CATEGORIES_LIST_TITLE) {
    const parent = (item.AM_ParentCategory ?? item.ParentCategory) as
      | { Title?: string }
      | undefined;
    if (parent?.Title) {
      row.ParentCategoryTitle = parent.Title;
    }
  }

  if (item.Rating !== undefined && item.Rating !== null && item.Rating !== '') {
    row.Rating = String(item.Rating);
  }

  return row;
}

export function itemMatchesSeedCatalog(
  listTitle: string,
  item: Record<string, unknown>,
  seedCatalog: SeedRow[]
): boolean {
  const itemVariants = new Set(
    collectSeedKeyVariants(listTitle, buildSeedRowFromListItem(listTitle, item))
  );
  if (itemVariants.size === 0) {
    return false;
  }

  return seedCatalog.some((seedRow) =>
    collectSeedKeyVariants(listTitle, seedRow).some((variant) => itemVariants.has(variant))
  );
}

export function buildSeedExistenceFilters(
  listTitle: string,
  row: SeedRow,
  context?: { parentCategoryId?: number; businessId?: number }
): string[] {
  const filters: string[] = [];
  const title = String(row.Title || '').trim();
  if (!title) {
    return filters;
  }

  const safeTitle = title.replace(/'/g, "''");

  if (listTitle === PROJECTS_LIST_TITLE) {
    const code = String(row.Code || '').trim();
    if (code) {
      filters.push(`Code eq '${code.replace(/'/g, "''")}'`);
    }
    if (context?.businessId) {
      filters.push(`Title eq '${safeTitle}' and BusinessId eq ${context.businessId}`);
    }
    filters.push(`Title eq '${safeTitle}'`);
    return filters;
  }

  if (listTitle === SUB_CATEGORIES_LIST_TITLE && context?.parentCategoryId) {
    filters.push(`Title eq '${safeTitle}' and AM_ParentCategoryId eq ${context.parentCategoryId}`);
    filters.push(`Title eq '${safeTitle}'`);
    return filters;
  }

  if (listTitle === BUSINESS_LIST_TITLE) {
    const businessCode = String(row.BusinessCode || '').trim();
    if (businessCode) {
      filters.push(`BusinessCode eq '${businessCode.replace(/'/g, "''")}'`);
    }
  }

  filters.push(`Title eq '${safeTitle}'`);
  return filters;
}
