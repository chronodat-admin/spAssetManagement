import { ILookupItem } from '../models/IAssetApp';

export function filterSubCategoriesByCategory(
  subCategories: ILookupItem[],
  categoryId: string
): ILookupItem[] {
  if (!categoryId) {
    return [];
  }

  return subCategories.filter(
    (item) => String(item.ParentCategoryId ?? item.ParentCategory?.Id ?? '') === categoryId
  );
}

export function isSubCategoryValidForCategory(
  subCategories: ILookupItem[],
  subCategoryId: string,
  categoryId: string
): boolean {
  if (!subCategoryId) {
    return true;
  }
  if (!categoryId) {
    return false;
  }

  return subCategories.some(
    (item) =>
      String(item.Id) === subCategoryId &&
      String(item.ParentCategoryId ?? item.ParentCategory?.Id ?? '') === categoryId
  );
}
