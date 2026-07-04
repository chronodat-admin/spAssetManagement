import { makeStyles, shorthands } from '@fluentui/react-components';
import {
  DASHBOARD_PRINT_FONT_FAMILY,
  dashboardPrintTheme
} from '../../utils/dashboardPrintTheme';

const theme = dashboardPrintTheme;

export const useDashboardPrintStyles = makeStyles({
  root: {
    fontFamily: DASHBOARD_PRINT_FONT_FAMILY,
    fontSize: '10px',
    lineHeight: 1.5,
    color: theme.text,
    backgroundColor: theme.bg,
    padding: '8px',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale'
  },
  header: {
    ...shorthands.borderBottom('1px', 'solid', theme.border),
    paddingBottom: '12px',
    marginBottom: '16px'
  },
  title: {
    fontSize: '18px',
    fontWeight: 800,
    letterSpacing: '-0.04em',
    lineHeight: 1.15,
    color: theme.text,
    margin: 0,
    marginBottom: '4px'
  },
  subtitle: {
    fontSize: '10px',
    color: theme.muted,
    lineHeight: 1.65,
    margin: 0,
    marginBottom: '6px'
  },
  printedAt: {
    fontSize: '9px',
    fontWeight: 600,
    color: theme.muted,
    letterSpacing: '0.02em',
    margin: 0
  },
  kpiCard: {
    ...shorthands.border('1px', 'solid', theme.border),
    ...shorthands.borderRadius(theme.radiusSm),
    padding: '10px 12px',
    backgroundColor: theme.bg,
    boxShadow: '0 1px 2px rgba(11, 18, 32, 0.04)'
  },
  kpiLabel: {
    fontSize: '7px',
    fontWeight: 700,
    color: theme.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '4px'
  },
  kpiValue: {
    fontSize: '18px',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.2,
    color: theme.text
  },
  kpiDescription: {
    fontSize: '8px',
    color: theme.muted,
    lineHeight: 1.5,
    marginTop: '4px'
  },
  section: {
    ...shorthands.border('1px', 'solid', theme.border),
    ...shorthands.borderRadius(theme.radiusSm),
    padding: '10px 12px',
    backgroundColor: theme.bg
  },
  sectionTitle: {
    fontSize: '9px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: theme.text,
    marginBottom: '10px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '9px'
  },
  tableHeaderCell: {
    textAlign: 'left',
    padding: '6px 8px',
    ...shorthands.borderBottom('1px', 'solid', theme.border),
    backgroundColor: theme.tableHeaderBg,
    fontSize: '7px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: theme.muted
  },
  tableCell: {
    padding: '6px 8px',
    ...shorthands.borderBottom('1px', 'solid', theme.border),
    verticalAlign: 'top',
    color: theme.textSecondary
  },
  listRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '9px',
    fontWeight: 500,
    color: theme.textSecondary,
    marginBottom: '4px',
    paddingBottom: '4px',
    ...shorthands.borderBottom('1px', 'solid', theme.border)
  },
  muted: {
    color: theme.muted,
    fontSize: '8px',
    lineHeight: 1.5
  },
  exposureTotal: {
    fontSize: '16px',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: theme.text,
    marginBottom: '8px'
  },
  exposureRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '9px',
    fontWeight: 500,
    color: theme.textSecondary,
    padding: '5px 0',
    ...shorthands.borderBottom('1px', 'solid', theme.border)
  }
});
