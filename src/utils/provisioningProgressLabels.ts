export { getListProgressLabel } from './provisioningListLabels';

export const PROVISIONING_PROGRESS = {
  checkingAccess: 'Verifying setup access…',
  seedingLookups: 'Adding default picklists and templates…',
  seedingSamples: 'Adding demo assets and licenses…',
  sampleAssetsProgress: (current: number, total: number): string =>
    `Adding demo assets (${Math.min(current, total)} of ${total})`,
  samplesAlreadyPresent: 'Demo content already in place',
  samplesSkipped: 'Demo content skipped'
} as const;
