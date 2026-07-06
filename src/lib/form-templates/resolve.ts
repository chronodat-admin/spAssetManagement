import type { AssetFormTemplate } from './types';

/** Active template linked to the selected asset category, if any. */
export function resolveFormTemplateForCategory(
  templates: AssetFormTemplate[],
  categoryId: number | null | undefined
): AssetFormTemplate | undefined {
  if (categoryId == null || !Number.isFinite(categoryId)) {
    return undefined;
  }
  return templates.find(
    (template) =>
      template.isActive &&
      template.categoryId === categoryId &&
      template.fields.length > 0
  );
}

export function templateTabKey(template: AssetFormTemplate): string {
  return `template-${template.id ?? template.name.replace(/\s+/g, '-').toLowerCase()}`;
}

export function isTemplateTabKey(tabKey: string): boolean {
  return tabKey.startsWith('template-');
}
