import { expect, type Locator, type Page } from '@playwright/test';

/** Unique title safe for parallel runs and re-runs (timestamp suffix). */
export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

/** Slide-out detail panel (portaled to document.body, outside the web part host). */
export function detailPanel(page: Page, title: string | RegExp): Locator {
  return page.getByRole('dialog', { name: title });
}

function labelPattern(label: string): RegExp {
  return new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
}

/** Text input/textarea located by accessible name (Fluent `Field` + `Input`). */
export async function fillLabeledInput(scope: Locator, label: string, value: string): Promise<void> {
  const input = scope.getByRole('textbox', { name: labelPattern(label) });
  await expect(input).toBeVisible({ timeout: 60_000 });
  await input.fill(value);
}

/** Native `AppDropdown` / Fluent combobox located by label or by option text within the panel. */
export async function selectLabeledDropdown(
  scope: Locator,
  label: string,
  optionLabel: string
): Promise<void> {
  const byLabel = scope.getByLabel(labelPattern(label));
  if ((await byLabel.count()) > 0) {
    await byLabel.selectOption({ label: optionLabel });
    return;
  }

  const searchScope = (await scope.getByRole('tabpanel').count()) > 0 ? scope.getByRole('tabpanel') : scope;
  const comboboxes = searchScope.getByRole('combobox');
  const count = await comboboxes.count();

  for (let index = 0; index < count; index += 1) {
    const combobox = comboboxes.nth(index);
    const optionTexts = await combobox.evaluate((element) =>
      Array.from(element.querySelectorAll('option')).map((option) => option.textContent?.trim() ?? '')
    );
    if (optionTexts.includes(optionLabel)) {
      await combobox.selectOption({ label: optionLabel });
      return;
    }
  }

  throw new Error(`Could not find combobox for "${label}" with option "${optionLabel}".`);
}

/** Close a slide-out panel (prefer the header dismiss control). */
export async function closeDetailPanel(panel: Locator): Promise<void> {
  await panel.getByLabel('Close', { exact: true }).click();
  await expect(panel).toBeHidden();
}

/** Confirm a Fluent delete dialog rendered at document body level. */
export async function confirmDialog(
  page: Page,
  dialogTitle: string | RegExp,
  confirmLabel: string | RegExp = 'Delete'
): Promise<void> {
  const dialog = page.getByRole('dialog', { name: dialogTitle });
  await expect(dialog).toBeVisible({ timeout: 60_000 });
  await dialog.getByRole('button', { name: confirmLabel, exact: true }).click();
  await expect(dialog).toBeHidden({ timeout: 60_000 });
}

export async function waitForSuccessBanner(root: Locator, text: string | RegExp): Promise<void> {
  await expect(root.getByText(text)).toBeVisible({ timeout: 60_000 });
}
