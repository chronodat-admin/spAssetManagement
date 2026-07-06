import type {
  INumberingConfig,
  IWorkflowSettings,
  NumberingEntityType,
  NumberingResetFrequency
} from '../../models/IWorkflowSettings';

export function buildNumberPreview(
  prefix: string,
  padLength: number,
  nextValue: number,
  separator: string,
  dateFormat: string | null
): string {
  let num = String(nextValue);
  while (num.length < padLength) {
    num = `0${num}`;
  }
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const yy = yyyy.slice(2);
  const month = now.getMonth() + 1;
  const mm = month < 10 ? `0${month}` : String(month);
  const day = now.getDate();
  const dd = day < 10 ? `0${day}` : String(day);

  let datePart = '';
  if (dateFormat === 'YYYY') datePart = yyyy;
  else if (dateFormat === 'YYYYMMDD') datePart = `${yyyy}${mm}${dd}`;
  else if (dateFormat === 'YYYYMM') datePart = `${yyyy}${mm}`;
  else if (dateFormat === 'YYMMDD') datePart = `${yy}${mm}${dd}`;
  else if (dateFormat === 'YYMM') datePart = `${yy}${mm}`;

  const sep = separator || '';
  if (datePart) {
    return `${prefix}${sep}${datePart}${sep}${num}`;
  }
  return `${prefix}${sep}${num}`;
}

export function getNumberingPeriodKey(
  resetFrequency: NumberingResetFrequency | undefined,
  date: Date = new Date()
): string {
  const frequency = resetFrequency || 'never';
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const mm = month < 10 ? `0${month}` : String(month);
  const dd = day < 10 ? `0${day}` : String(day);

  switch (frequency) {
    case 'yearly':
      return String(year);
    case 'monthly':
      return `${year}-${mm}`;
    case 'daily':
      return `${year}-${mm}-${dd}`;
    default:
      return 'global';
  }
}

export function formatNumberFromConfig(config: INumberingConfig, sequence: number, _date = new Date()): string {
  return buildNumberPreview(
    config.prefix,
    config.padLength,
    sequence,
    config.separator,
    config.dateFormat
  );
}

export function getNumberingConfig(
  workflowSettings: IWorkflowSettings,
  entityType: NumberingEntityType
): INumberingConfig | undefined {
  return workflowSettings.numbering.find((item) => item.entityType === entityType);
}

export interface IAllocatedNumber {
  number: string;
  sequence: number;
  updatedSettings: IWorkflowSettings;
}

export function enableNumberingForEntity(
  workflowSettings: IWorkflowSettings,
  entityType: NumberingEntityType
): IWorkflowSettings {
  return {
    ...workflowSettings,
    numbering: workflowSettings.numbering.map((item) =>
      item.entityType === entityType ? { ...item, enabled: true } : item
    )
  };
}

/** Allocate a code; if numbering is disabled for the entity, enable it and allocate once. */
export function allocateEntityCodeWithAutoEnable(
  workflowSettings: IWorkflowSettings,
  entityType: Extract<NumberingEntityType, 'business' | 'project'>
): IAllocatedNumber | undefined {
  const direct = allocateEntityNumber(workflowSettings, entityType);
  if (direct) {
    return direct;
  }

  if (!getNumberingConfig(workflowSettings, entityType)) {
    return undefined;
  }

  return allocateEntityNumber(enableNumberingForEntity(workflowSettings, entityType), entityType);
}

export function allocateEntityNumber(
  workflowSettings: IWorkflowSettings,
  entityType: NumberingEntityType
): IAllocatedNumber | undefined {
  const config = getNumberingConfig(workflowSettings, entityType);
  if (!config || !config.enabled) {
    return undefined;
  }

  const periodKey = getNumberingPeriodKey(config.resetFrequency);
  const counters = { ...(config.sequenceCounters || {}) };
  const current =
    periodKey === 'global'
      ? Math.max(0, (config.nextValue || 1) - 1)
      : counters[periodKey] ?? Math.max(0, (config.nextValue || 1) - 1);
  const nextSequence = current + 1;

  if (periodKey === 'global') {
    counters.global = nextSequence;
  } else {
    counters[periodKey] = nextSequence;
  }

  const updatedConfig: INumberingConfig = {
    ...config,
    nextValue: nextSequence,
    sequenceCounters: counters
  };

  const updatedSettings: IWorkflowSettings = {
    ...workflowSettings,
    numbering: workflowSettings.numbering.map((item) =>
      item.entityType === entityType ? updatedConfig : item
    )
  };

  return {
    number: formatNumberFromConfig(updatedConfig, nextSequence),
    sequence: nextSequence,
    updatedSettings
  };
}

export function resetNumberingSequence(
  workflowSettings: IWorkflowSettings,
  entityType: NumberingEntityType
): IWorkflowSettings {
  return {
    ...workflowSettings,
    numbering: workflowSettings.numbering.map((item) => {
      if (item.entityType !== entityType) {
        return item;
      }
      return {
        ...item,
        nextValue: 1,
        sequenceCounters: {}
      };
    })
  };
}

export function buildLegacyTicketPrefix(config: INumberingConfig): string {
  const sep = config.separator || '';
  if (config.dateFormat) {
    return `${config.prefix}${sep}`;
  }
  return `${config.prefix}${sep}`;
}

export function previewNumberingFormat(config: INumberingConfig): string {
  return formatNumberFromConfig(config, config.nextValue || 1);
}
