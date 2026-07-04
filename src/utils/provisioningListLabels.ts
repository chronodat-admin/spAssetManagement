import {
  BUSINESS_LIST_TITLE,
  LEGACY_BUSINESS_LIST_TITLE
} from '../models/IListDefinitions';

/** Friendly labels for provisioning UI — internal SharePoint list titles are unchanged. */
const PROVISIONING_LIST_DISPLAY_LABELS: Record<string, string> = {
  [BUSINESS_LIST_TITLE]: 'Business',
  [LEGACY_BUSINESS_LIST_TITLE]: 'Business'
};

/** Maps a SharePoint list title to a user-facing label in setup/status views. */
export function getProvisioningListDisplayLabel(listTitle: string): string {
  const incompleteMatch = /^(.*)\s+\(incomplete\)$/.exec(listTitle.trim());
  if (incompleteMatch) {
    return `${getProvisioningListDisplayLabel(incompleteMatch[1])} (incomplete)`;
  }

  return PROVISIONING_LIST_DISPLAY_LABELS[listTitle] ?? listTitle;
}
