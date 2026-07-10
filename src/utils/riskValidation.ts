import {
  CONSEQUENCE_CHOICES,
  CONTROLS_EFFECTIVENESS_CHOICES,
  LIKELIHOOD_CHOICES,
  ASSET_STATUS_CHOICES
} from '../constants/assetChoices';

export interface IRiskFormValues {
  title: string;
  categoryId: string;
  businessId: string;
  profileId: string;
  likelihood: string;
  consequence: string;
  status: string;
}

export interface ILookupFormValues {
  title: string;
  rating?: string;
}

export function validateRiskForm(
  values: IRiskFormValues,
  allowedStatuses?: string[]
): string | undefined {
  if (!values.title.trim()) {
    return 'Asset title is required.';
  }
  if (!values.categoryId) {
    return 'Asset category is required.';
  }
  if (!values.businessId) {
    return 'Business is required.';
  }
  if (!values.profileId) {
    return 'Asset type is required.';
  }
  if (!values.likelihood || !LIKELIHOOD_CHOICES.includes(values.likelihood as (typeof LIKELIHOOD_CHOICES)[number])) {
    return 'Potential likelihood is required.';
  }
  if (!values.consequence || !CONSEQUENCE_CHOICES.includes(values.consequence as (typeof CONSEQUENCE_CHOICES)[number])) {
    return 'Potential impact is required.';
  }
  const statusOptions = allowedStatuses && allowedStatuses.length > 0 ? allowedStatuses : [...ASSET_STATUS_CHOICES];
  if (!statusOptions.includes(values.status)) {
    return 'Asset status is invalid.';
  }
  return undefined;
}

export function validateLookupItem(
  values: ILookupFormValues,
  existing: Array<{ id: number; title: string }>,
  editingId?: number,
  requireRating?: boolean
): string | undefined {
  const title = values.title.trim();
  if (!title) {
    return 'Title is required.';
  }
  if (title.length > 255) {
    return 'Title must be 255 characters or fewer.';
  }
  const duplicate = existing.some(
    (item) =>
      item.id !== editingId &&
      item.title.localeCompare(title, undefined, { sensitivity: 'accent' }) === 0
  );
  if (duplicate) {
    return `An item named "${title}" already exists.`;
  }
  if (requireRating && !values.rating?.trim()) {
    return 'Rating is required for this list.';
  }
  return undefined;
}

export function validateAppSettings(values: {
  title: string;
  prefix: string;
  colorScheme: string;
}): string | undefined {
  if (!values.title.trim()) {
    return 'App display name is required.';
  }
  if (!values.prefix.trim()) {
    return 'Asset ID prefix is required.';
  }
  if (values.prefix.trim().length > 20) {
    return 'Asset ID prefix must be 20 characters or fewer.';
  }
  if (!values.colorScheme.trim()) {
    return 'Color scheme is required.';
  }
  return undefined;
}

export function validateControlsEffectiveness(value: string): boolean {
  return CONTROLS_EFFECTIVENESS_CHOICES.includes(value as (typeof CONTROLS_EFFECTIVENESS_CHOICES)[number]);
}

export function stripHtml(value?: string): string {
  if (!value) {
    return '';
  }
  return value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}
