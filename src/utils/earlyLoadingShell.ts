/**
 * Runs synchronously when the web part bundle first evaluates — before onInit/render.
 * Hides SharePoint left chrome and shows a full-viewport overlay so users do not see
 * native navigation or page skeleton flash while the app bootstraps.
 */
const EARLY_STYLE_ID = 'asset-mgmt-early-loading-shell';
const FULLSCREEN_LOADER_ID = 'asset-mgmt-fullscreen-loader';
const BODY_APP_LOADING_CLASS = 'asset-mgmt-app-loading';
const BODY_HIDE_NAV_CLASS = 'asset-mgmt-hide-sp-left-nav';

const SHAREPOINT_LEFT_CHROME_SELECTORS = [
  '#sp-appBar',
  '[data-automation-id="appBar"]',
  '[data-automation-id="O365_AppBar"]',
  '.sp-appBar',
  'div[class*="appBarThin"]',
  'div[class*="spAppBar"]',
  '#spSiteHeader',
  '[data-automation-id="SiteHeader"]',
  '[data-automation-id="SiteHeaderRoot"]',
  'div[class*="spSiteHeader"]',
  'div[class*="siteHeader"]',
  '#spLeftNav',
  '#sideNavBox',
  'nav[aria-label="Site navigation"]',
  '[data-automation-id="sp-sidenav"]',
  '[data-automation-id="LeftNavigation"]',
  '[data-automation-id="SiteNav"]',
  '[data-automation-id="QuickLaunch"]',
  'nav[role="navigation"][aria-label*="Site"]',
  'nav[role="navigation"][aria-label*="site"]',
  'div[class*="leftNav"]',
  'div[class*="LeftNav"]'
];

function isLikelyTeamsEmbed(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const href = window.location.href;
  const search = window.location.search;
  return (
    /teams\.microsoft\.com/i.test(href) ||
    /[?&]host=Teams/i.test(search) ||
    /[?&]teams(?:=|&|$)/i.test(search)
  );
}

function isLikelySharePointEditMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const locationText = `${window.location.search} ${window.location.hash}`.toLowerCase();
  return (
    /[?&#]mode=edit(?:&|#|$)/.test(locationText) ||
    /[?&#]pagemode=edit(?:&|#|$)/.test(locationText)
  );
}

function buildEarlyHideRules(): string {
  const hideBlock = SHAREPOINT_LEFT_CHROME_SELECTORS.map(
    (selector) => `body.${BODY_APP_LOADING_CLASS} ${selector}, body.${BODY_HIDE_NAV_CLASS} ${selector}`
  ).join(',\n    ');

  return `
    ${hideBlock} {
      display: none !important;
      visibility: hidden !important;
      width: 0 !important;
      min-width: 0 !important;
      max-width: 0 !important;
      max-height: 0 !important;
      overflow: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    body.${BODY_APP_LOADING_CLASS} {
      background-color: #f5f5f5 !important;
    }

    body.${BODY_APP_LOADING_CLASS} div[class^="pageContainer_"],
    body.${BODY_APP_LOADING_CLASS} div[class*=" pageContainer_"],
    body.${BODY_APP_LOADING_CLASS} .od-Frame-main,
    body.${BODY_APP_LOADING_CLASS} #spoAppComponent,
    body.${BODY_APP_LOADING_CLASS} #spPageCanvasContent,
    body.${BODY_APP_LOADING_CLASS} .SPCanvas-canvasContent,
    body.${BODY_APP_LOADING_CLASS} [data-automation-id="contentScrollRegion"] {
      margin-left: 0 !important;
      padding-left: 0 !important;
      left: 0 !important;
      max-width: 100% !important;
    }

    #${FULLSCREEN_LOADER_ID} {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f5f5;
    }
  `;
}

function ensureEarlyStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(EARLY_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = EARLY_STYLE_ID;
  style.textContent = buildEarlyHideRules();
  document.head.appendChild(style);
}

function ensureFullScreenOverlay(): void {
  if (typeof document === 'undefined' || !document.body || document.getElementById(FULLSCREEN_LOADER_ID)) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = FULLSCREEN_LOADER_ID;
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-busy', 'true');
  overlay.setAttribute('aria-label', 'Loading');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '2147483646';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.backgroundColor = '#f5f5f5';
  overlay.innerHTML =
    '<div style="display:flex;flex-direction:column;align-items:center;gap:16px;color:#616161;font-family:Segoe UI,sans-serif;font-size:14px">' +
    '<div style="width:32px;height:32px;border:3px solid #e0e0e0;border-top-color:#0078d4;border-radius:50%;animation:asset-mgmt-early-spin 0.9s linear infinite" aria-hidden="true"></div>' +
    '<span>Loading</span>' +
    '</div>';

  if (!document.getElementById('asset-mgmt-early-spin-keyframes')) {
    const spinStyle = document.createElement('style');
    spinStyle.id = 'asset-mgmt-early-spin-keyframes';
    spinStyle.textContent =
      '@keyframes asset-mgmt-early-spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(spinStyle);
  }

  document.body.appendChild(overlay);
}

/** Apply loading shell as early as possible (module evaluation time). */
export function bootstrapEarlyLoadingShell(): void {
  if (
    typeof document === 'undefined' ||
    !document.body ||
    isLikelyTeamsEmbed() ||
    isLikelySharePointEditMode()
  ) {
    return;
  }

  document.body.classList.add(BODY_APP_LOADING_CLASS);
  document.body.classList.add(BODY_HIDE_NAV_CLASS);
  ensureEarlyStyles();
  ensureFullScreenOverlay();
}

bootstrapEarlyLoadingShell();
