/** Typography and palette aligned with people-hub-subscription-api `public/shared.css`. */
export const DASHBOARD_PRINT_FONT_FAMILY =
  "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

export const DASHBOARD_PRINT_FONT_URL =
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap';

export const DASHBOARD_PRINT_FONT_LINK_ID = 'asset-mgmt-dashboard-print-font';

export const dashboardPrintTheme = {
  bg: '#ffffff',
  text: '#0b1220',
  textSecondary: '#334155',
  muted: '#64748b',
  border: '#e2e8f4',
  borderStrong: '#c8d2e3',
  brand: '#3b5bdb',
  brandDark: '#2f4ac0',
  tableHeaderBg: '#f8fafc',
  radiusSm: '10px',
  radius: '16px'
} as const;

export function ensureDashboardPrintFont(): void {
  if (typeof document === 'undefined' || document.getElementById(DASHBOARD_PRINT_FONT_LINK_ID)) {
    return;
  }

  const link = document.createElement('link');
  link.id = DASHBOARD_PRINT_FONT_LINK_ID;
  link.rel = 'stylesheet';
  link.href = DASHBOARD_PRINT_FONT_URL;
  document.head.appendChild(link);
}
