import { makeStyles, tokens } from '@fluentui/react-components';

/** Shared pill-tab styles for dashboard latest-risks views. */
export const useAppTabStyles = makeStyles({
  tabBar: {
    display: 'flex',
    flexWrap: 'nowrap',
    gap: tokens.spacingHorizontalXS,
    padding: `0 ${tokens.spacingHorizontalL} ${tokens.spacingVerticalS}`,
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'thin',
    '@media (max-width: 768px)': {
      padding: `0 ${tokens.spacingHorizontalM} ${tokens.spacingVerticalS}`
    }
  },
  tabButton: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground2,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    cursor: 'pointer',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    transitionProperty: 'background-color, color, border-color',
    transitionDuration: '150ms',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover
    }
  },
  tabButtonActive: {
    backgroundColor: tokens.colorBrandBackground2,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover
    }
  }
});
