import { makeStyles, tokens } from '@fluentui/react-components';

/**
 * Shared, professional form layout styles used across asset, operations, and
 * lookup forms so spacing, grids, section headers, and action rows stay
 * visually consistent instead of relying on ad-hoc inline styles.
 */
export const useFormStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    width: '100%',
    maxWidth: '640px'
  },
  formWide: {
    maxWidth: '100%'
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    color: tokens.colorNeutralForeground3
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  sectionHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    paddingBottom: tokens.spacingVerticalXS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },
  sectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  },
  sectionDescription: {
    color: tokens.colorNeutralForeground3
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: tokens.spacingHorizontalM,
    alignItems: 'start',
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr'
    }
  },
  fullWidth: {
    gridColumn: '1 / -1'
  },
  /** Inline "quick add" row: fields grow, action button hugs the end. */
  inlineRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium
  },
  inlineField: {
    flex: '1 1 200px',
    minWidth: '160px'
  },
  inlineFieldNarrow: {
    flex: '0 1 160px',
    minWidth: '120px'
  },
  /** Wraps an action button so it lines up with labeled inputs in inlineRow. */
  inlineAction: {
    flex: '0 0 auto'
  },
  tableRowActions: {
    display: 'flex',
    flexWrap: 'nowrap',
    gap: tokens.spacingHorizontalXXS
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`
  },
  readonlyValue: {
    color: tokens.colorNeutralForeground1,
    wordBreak: 'break-word'
  },
  readonlyEmpty: {
    color: tokens.colorNeutralForeground3
  }
});
