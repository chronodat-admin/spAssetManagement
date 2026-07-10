import type { IAssetTag } from '../models/IWorkflowSettings';

/** Sample tags written to WorkflowSettings during onboarding when sample data is enabled. */
export const SAMPLE_TAG_SEED_DATA: IAssetTag[] = [
  {
    id: 'tag-warranty-expiring',
    name: 'Warranty Expiring',
    color: '#F59E0B',
    description: 'Warranty expires within the next 90 days'
  },
  {
    id: 'tag-high-value',
    name: 'High Value',
    color: '#EF4444',
    description: 'Asset cost exceeds $2,000'
  },
  {
    id: 'tag-remote-worker',
    name: 'Remote Worker',
    color: '#3B82F6',
    description: 'Issued for remote or hybrid employees'
  },
  {
    id: 'tag-lease',
    name: 'Lease',
    color: '#8B5CF6',
    description: 'Leased equipment with a return date'
  },
  {
    id: 'tag-depreciated',
    name: 'Depreciated',
    color: '#6B7280',
    description: 'Fully depreciated or end-of-life asset'
  },
  {
    id: 'tag-review-required',
    name: 'Review Required',
    color: '#F97316',
    description: 'Needs verification during the next inventory cycle'
  },
  {
    id: 'tag-intune-managed',
    name: 'Intune Managed',
    color: '#14B8A6',
    description: 'Enrolled and managed in Microsoft Intune'
  },
  {
    id: 'tag-critical',
    name: 'Critical',
    color: '#DC2626',
    description: 'Business-critical asset with limited downtime tolerance'
  }
];

export const SAMPLE_TAG_SEED_IDS = new Set(SAMPLE_TAG_SEED_DATA.map((tag) => tag.id));

export const SAMPLE_TAG_SEED_NAMES = new Set(
  SAMPLE_TAG_SEED_DATA.map((tag) => tag.name.trim().toLowerCase())
);
