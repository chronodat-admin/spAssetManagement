import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

/** Applied to native collapsible section header buttons for global dark-mode fixes. */
export const COLLAPSIBLE_SECTION_HEADER_CLASS = 'asset-mgmt-collapsible-section-header';

export const useCollapsibleSectionHeaderStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    width: '100%',
    ...shorthands.border('none'),
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
    cursor: 'pointer',
    textAlign: 'left',
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    '& .fui-Text': {
      color: 'inherit',
      fontWeight: 'inherit'
    },
    '& svg': {
      color: tokens.colorNeutralForeground2,
      flexShrink: 0
    },
    ':hover': {
      '& svg': {
        color: tokens.colorNeutralForeground1
      }
    },
    ':focus-visible': {
      outline: `${tokens.strokeWidthThick} solid ${tokens.colorStrokeFocus2}`,
      outlineOffset: tokens.spacingHorizontalXXS,
      ...shorthands.borderRadius(tokens.borderRadiusMedium)
    }
  },
  headerInteractive: {
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover
    }
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    minWidth: 0,
    flex: '1 1 auto'
  }
});
