export {
  BUSINESS_CRITICALITY_CHOICES,
  BUSINESS_LIST_FIELDS,
  PROJECT_LIST_FIELDS,
  PROJECT_PRIORITY_CHOICES,
  PROJECT_RISK_LEVEL_CHOICES,
  PROJECT_STATUS_CHOICES,
  PROJECT_TYPE_CHOICES,
  RISK_APPETITE_CHOICES
} from './businessProjectFieldDefs';
import { BUSINESS_LIST_FIELDS } from './businessProjectFieldDefs';
import { buildListItemQuery } from '../utils/listItemQuery';

const businessItemQuery = buildListItemQuery(BUSINESS_LIST_FIELDS);

/** OData $select fragment for business list rows. */
export const BUSINESS_ITEM_SELECT = businessItemQuery.select;

/** OData $expand fragment for business list rows. */
export const BUSINESS_ITEM_EXPAND = businessItemQuery.expand;

// The AM_Projects list is provisioned as a simple lookup (Title + AM_Code, AM_Status, AM_Owner).
// The select/expand below must match those provisioned columns, not the legacy risk-project schema.
const PROJECT_OWNER_FIELDS = 'AM_Owner/Id,AM_Owner/Title,AM_Owner/EMail';

/** OData $select fragment for project list rows. */
export const PROJECT_ITEM_SELECT = `Id,Title,AM_Code,AM_Status,${PROJECT_OWNER_FIELDS}`;

/** OData $expand fragment for project list rows. */
export const PROJECT_ITEM_EXPAND = 'AM_Owner';

/** Lightweight select for lookup maps and dropdowns (Id + Title only). */
export const BUSINESS_SUMMARY_SELECT = 'Id,Title';
export const PROJECT_SUMMARY_SELECT = 'Id,Title';
export const PROJECT_SUMMARY_EXPAND = undefined;

/** List-view select — columns shown in Business/Project managers without Note fields. */
export const BUSINESS_LIST_VIEW_SELECT =
  'Id,Title,BusinessCode,Industry,GeographicRegion,BusinessCriticality,Owner/Id,Owner/Title,Owner/EMail';
export const BUSINESS_LIST_VIEW_EXPAND = 'Owner';

export const PROJECT_LIST_VIEW_SELECT = `Id,Title,AM_Code,AM_Status,${PROJECT_OWNER_FIELDS}`;
export const PROJECT_LIST_VIEW_EXPAND = 'AM_Owner';
