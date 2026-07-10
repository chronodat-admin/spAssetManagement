import type { INumberingConfig, NumberingEntityType } from '../../models/IWorkflowSettings';
import { DEFAULT_NUMBERING } from './defaults.js';
import { normalizeNumberingEntityType } from './slugs.js';

function cloneNumberingConfig(config: INumberingConfig): INumberingConfig {
  return {
    ...config,
    sequenceCounters: { ...(config.sequenceCounters || {}) }
  };
}

function normalizeNumberingEntity(entityType: string): NumberingEntityType {
  const normalized = normalizeNumberingEntityType(entityType);
  if (normalized === 'business') {
    return 'vendor';
  }
  if (normalized === 'asset' || normalized === 'vendor' || normalized === 'project') {
    return normalized;
  }
  return 'asset';
}

function normalizeLegacyPrefix(entityType: NumberingEntityType, prefix: string): string {
  const trimmed = prefix.trim().toUpperCase();
  if (entityType === 'asset' && trimmed === 'RISK') {
    return 'AST';
  }
  if (entityType === 'vendor' && trimmed === 'BIZ') {
    return 'VND';
  }
  return prefix.trim().toUpperCase() || prefix;
}

/** Normalize persisted numbering configs from legacy risk/business naming. */
export function migrateLegacyNumbering(numbering: INumberingConfig[] | undefined): INumberingConfig[] {
  const defaults = DEFAULT_NUMBERING.map(cloneNumberingConfig);
  if (!numbering?.length) {
    return defaults;
  }

  const byType = new Map<NumberingEntityType, INumberingConfig>();

  for (const item of numbering) {
    const entityType = normalizeNumberingEntity(item.entityType);
    byType.set(entityType, {
      ...cloneNumberingConfig(item),
      entityType,
      prefix: normalizeLegacyPrefix(entityType, item.prefix)
    });
  }

  return defaults.map((defaultItem) => byType.get(defaultItem.entityType) || defaultItem);
}

export function usesLegacyNumbering(numbering: INumberingConfig[] | undefined): boolean {
  return (numbering || []).some((item) => {
    const entityType = String(item.entityType);
    const prefix = item.prefix.trim().toUpperCase();
    return (
      entityType === 'risk' ||
      entityType === 'business' ||
      (entityType === 'asset' && prefix === 'RISK')
    );
  });
}
