import { makeStyles, tokens } from '@fluentui/react-components';

/** Shared MessageBar layout so long errors wrap instead of clipping in cards/grids. */
export const useAppMessageBarStyles = makeStyles({
  root: {
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    boxSizing: 'border-box',
    '& .fui-MessageBarBody': {
      wordBreak: 'break-word',
      overflowWrap: 'anywhere',
      whiteSpace: 'pre-wrap',
      minWidth: 0,
      maxWidth: '100%'
    }
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    width: '100%',
    minWidth: 0
  }
});
