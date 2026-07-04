export const SAMPLE_DATA_SEEDED_VALUE = 'Yes';

export function isSampleDataSeeded(settings?: { SampleDataSeeded?: string | null }): boolean {
  return String(settings?.SampleDataSeeded || '')
    .trim()
    .toLowerCase() === 'yes';
}

export function canRunAutomaticSampleSeed(settings?: { SampleDataSeeded?: string | null }): boolean {
  return !isSampleDataSeeded(settings);
}
