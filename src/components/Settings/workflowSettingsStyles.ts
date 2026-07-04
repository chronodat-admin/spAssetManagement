import { makeStyles, tokens } from '@fluentui/react-components';

export const useWorkflowSettingsStyles = makeStyles({
  tabToolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM
  },
  sectionHeader: {
    marginTop: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalXS
  },
  sectionDescription: {
    display: 'block',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    marginBottom: tokens.spacingVerticalM
  },
  settingRowCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    minWidth: 0,
    flex: '1 1 auto'
  },
  settingRowDescription: {
    display: 'block',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  listRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1
  },
  listRowMain: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
    flex: '1 1 auto'
  },
  colorDot: {
    width: '16px',
    height: '16px',
    borderRadius: '999px',
    flexShrink: 0
  },
  rowMeta: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200
  },
  rowActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexShrink: 0
  },
  colorPicker: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS
  },
  colorSwatch: {
    width: '32px',
    height: '32px',
    borderRadius: '999px',
    border: `2px solid transparent`,
    cursor: 'pointer'
  },
  colorSwatchActive: {
    border: `2px solid ${tokens.colorNeutralForeground1}`
  },
  panelBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  panelFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalS
  },
  optionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  optionInput: {
    flex: '1 1 180px',
    minWidth: '120px',
    maxWidth: '100%'
  },
  panelSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  panelSectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  },
  panelFullWidth: {
    width: '100%'
  },
  builderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },
  builderItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    minWidth: 0
  },
  builderItemText: {
    minWidth: 0,
    flex: '1 1 auto',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2
  },
  builderAddRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr) auto',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    width: '100%'
  },
  builderAddRowStacked: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto',
    gap: tokens.spacingHorizontalS,
    alignItems: 'start',
    width: '100%'
  },
  builderPickerRow: {
    gridColumn: '1 / -1',
    width: '100%',
    minWidth: 0
  },
  builderControl: {
    width: '100%',
    minWidth: 0
  },
  cardGrid: {
    display: 'grid',
    gap: tokens.spacingVerticalM
  },
  numberingCard: {
    display: 'grid',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1
  },
  preview: {
    fontFamily: tokens.fontFamilyMonospace,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM
  }
});

export const STATUS_COLOR_PRESETS = ['#6B7280', '#3B82F6', '#F59E0B', '#22C55E', '#EF4444', '#8B5CF6', '#6366F1', '#14B8A6'];
export const PRIORITY_COLOR_PRESETS = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#6B7280'];
export const TAG_COLOR_PRESETS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#14B8A6', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#6B7280'
];
