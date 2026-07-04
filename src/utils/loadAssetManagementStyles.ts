import { installDashboardPrintSupport } from './dashboardPrint';

const STYLE_ID = 'asset-management-webpart-host-styles';

const HOST_CLASS = 'asset-management-webpart-host';

const HOST_TEAMS_CLASS = 'asset-mgmt-host-teams';

const BODY_IMMERSIVE_CLASS = 'asset-mgmt-immersive-mode';

/** @deprecated Use BODY_IMMERSIVE_CLASS — kept for CSS selector compatibility */
const BODY_HIDE_NAV_CLASS = 'asset-mgmt-hide-sp-left-nav';

const BODY_HIDE_PAGE_BAR_CLASS = 'asset-mgmt-hide-sp-page-bar';

const BODY_HIDE_SUITE_BAR_CLASS = 'asset-mgmt-hide-sp-suite-bar';

const CANVAS_EXPANDED_CLASS = 'asset-mgmt-canvas-expanded';

const CANVAS_EMPTY_COL_HIDDEN_CLASS = 'asset-mgmt-canvas-col-hidden';

const REACT_MOUNT_CLASS = 'asset-mgmt-react-mount';

const BODY_APP_LOADING_CLASS = 'asset-mgmt-app-loading';

const HOST_LOADING_CLASS = 'asset-mgmt-host-loading';

const BOOTSTRAP_LOADER_CLASS = 'asset-mgmt-bootstrap-loader';

/** Full-viewport overlay shown over the whole page (including SharePoint chrome) while the app loads. */
const FULLSCREEN_LOADER_ID = 'asset-mgmt-fullscreen-loader';

const BODY_TEAMS_HOST_CLASS = 'asset-mgmt-teams-host';

const CANVAS_CLASS_NAMES = [
  'ControlZone',
  'ControlZone--control',
  'CanvasSection-col',
  'CanvasSection',
  'CanvasZone',
  'CanvasComponent',
  'SPCanvas-canvasContent',
  'spPageCanvasContent',
  'fui-FluentProvider'
];

const CANVAS_AUTOMATION_PREFIXES = ['CanvasZone', 'CanvasSection', 'CanvasControl'];

/**
 * Measure the space available below the web part's top edge and publish it as a
 * CSS variable. Used as a `min-height` (AdminLTE sticky-footer pattern) so the
 * content column fills the viewport and pushes the footer to the bottom — without
 * creating a second (inner) scrollbar.
 */
export function syncWebPartViewportHeight(hostElement: HTMLElement, teamsHost = false): void {
  if (typeof window === 'undefined') {
    return;
  }

  const top = Math.max(0, hostElement.getBoundingClientRect().top);
  const collapseHiddenTopChrome =
    !teamsHost &&
    typeof document !== 'undefined' &&
    document.body.classList.contains(BODY_HIDE_SUITE_BAR_CLASS) &&
    document.body.classList.contains(BODY_HIDE_PAGE_BAR_CLASS);
  const topChromeOffset = collapseHiddenTopChrome && top > 0 && top < 180 ? Math.ceil(top) : 0;
  const availableHeight = teamsHost
    ? Math.max(480, Math.floor(window.innerHeight))
    : Math.max(360, Math.floor(window.innerHeight - top + topChromeOffset));
  const heightValue = `${availableHeight}px`;
  hostElement.style.setProperty('--asset-mgmt-available-height', heightValue);
  hostElement.style.marginTop = topChromeOffset ? `-${topChromeOffset}px` : '';
  document.documentElement.style.setProperty('--asset-mgmt-available-height', heightValue);
}

export function markTeamsHostEnvironment(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.add(BODY_TEAMS_HOST_CLASS);
}

export function unmarkTeamsHostEnvironment(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.remove(BODY_TEAMS_HOST_CLASS);
}

export function isTeamsHostEnvironment(): boolean {
  return typeof document !== 'undefined' && document.body.classList.contains(BODY_TEAMS_HOST_CLASS);
}

function isCanvasAncestor(element: HTMLElement): boolean {
  if (element.id === 'spPageCanvasContent') {
    return true;
  }

  if (CANVAS_CLASS_NAMES.some((name) => element.classList.contains(name))) {
    return true;
  }

  const automationId = element.getAttribute('data-automation-id') || '';
  return (
    CANVAS_AUTOMATION_PREFIXES.some((prefix) => automationId.indexOf(prefix) === 0) ||
    element.hasAttribute('data-sp-feature-tag')
  );
}

function applyCanvasExpansionStyles(element: HTMLElement): void {
  element.classList.add(CANVAS_EXPANDED_CLASS);
  element.style.width = '100%';
  element.style.maxWidth = '100%';
  element.style.boxSizing = 'border-box';
  element.style.padding = '0';
  element.style.paddingLeft = '0';
  element.style.paddingRight = '0';
  element.style.paddingTop = '0';
  element.style.marginLeft = '0';
  element.style.marginRight = '0';
  element.style.minHeight = 'auto';
  element.style.height = 'auto';

  if (element.classList.contains('CanvasSection-col')) {
    element.style.flex = '1 1 100%';
    element.style.minWidth = '0';
  }
}

function canvasColumnHasWebPartContent(column: Element): boolean {
  if (column.querySelector(`.${HOST_CLASS}`)) {
    return true;
  }

  return Boolean(
    column.querySelector('[data-sp-feature-tag]') ||
      column.querySelector('[data-automation-id^="CanvasControl"]')
  );
}

/** Hide empty sibling columns so a single-column section layout uses the full page width. */
export function collapseEmptyCanvasColumns(hostElement: HTMLElement): void {
  const section =
    hostElement.closest('.CanvasSection') ||
    hostElement.closest('[data-automation-id^="CanvasSection"]');

  if (!section) {
    return;
  }

  const columns = Array.from(
    section.querySelectorAll('.CanvasSection-col, [data-automation-id^="CanvasSection-col"]')
  ) as HTMLElement[];

  if (columns.length < 2) {
    return;
  }

  columns.forEach((column) => {
    if (canvasColumnHasWebPartContent(column)) {
      applyCanvasExpansionStyles(column);
      return;
    }

    column.classList.add(CANVAS_EMPTY_COL_HIDDEN_CLASS);
    column.style.display = 'none';
    column.style.flex = '0 0 0';
    column.style.maxWidth = '0';
    column.style.width = '0';
    column.style.minWidth = '0';
    column.style.padding = '0';
    column.style.margin = '0';
    column.style.overflow = 'hidden';
  });

  const sectionElement = section as HTMLElement;
  sectionElement.style.width = '100%';
  sectionElement.style.maxWidth = '100%';
  sectionElement.style.display = 'flex';
  sectionElement.style.flexWrap = 'nowrap';
}

const PAGE_SCROLL_LOCK_SELECTORS = [
  '[data-automation-id="contentScrollRegion"]',
  '#spPageCanvasContent',
  '.SPCanvas-canvasContent',
  '[data-automation-id="CanvasLayout"]',
  'div[class^="pageContainer_"]',
  'div[class*=" pageContainer_"]',
  '.od-Frame-main',
  '#spoAppComponent'
];

/** SharePoint canvas often reserves viewport height — collapse to actual web part height. */
export function collapseWebPartCanvasHeight(hostElement: HTMLElement): void {
  let el: HTMLElement | null = hostElement;

  while (el && el !== document.body) {
    if (isCanvasAncestor(el)) {
      el.style.minHeight = 'auto';
      el.style.height = 'auto';
      el.style.overflow = 'hidden';
      el.style.overflowY = 'hidden';
    }
    el = el.parentElement;
  }
}

function collapseSharePointEmptySections(hostElement: HTMLElement): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.querySelectorAll<HTMLElement>('#emptySection, [data-automation-id="CanvasControl"]#emptySection').forEach((control) => {
    if (control.contains(hostElement)) {
      return;
    }

    const hasContent = Boolean(control.textContent?.trim()) || Boolean(
      control.querySelector('iframe, img, video, canvas, button, input, textarea, select, [data-sp-feature-tag]')
    );
    if (hasContent) {
      return;
    }

    control.style.display = 'none';
    control.style.height = '0';
    control.style.minHeight = '0';
    control.style.margin = '0';
    control.style.padding = '0';
    control.style.overflow = 'hidden';

    let parent = control.parentElement;
    while (parent && parent !== document.body) {
      if (parent.contains(hostElement)) {
        break;
      }

      const automationId = parent.getAttribute('data-automation-id') || '';
      const isCanvasContainer =
        parent.classList.contains('CanvasZone') ||
        parent.classList.contains('CanvasSection') ||
        parent.classList.contains('CanvasZoneSectionContainer') ||
        automationId.startsWith('CanvasZone') ||
        automationId.startsWith('CanvasSection');

      if (!isCanvasContainer) {
        parent = parent.parentElement;
        continue;
      }

      const hasVisibleContent = Array.from(parent.children).some((child) => {
        if (!(child instanceof HTMLElement) || child === control) {
          return false;
        }
        if (child.contains(hostElement)) {
          return true;
        }
        return Boolean(child.textContent?.trim()) || Boolean(
          child.querySelector('[data-sp-feature-tag], iframe, img, video, canvas')
        );
      });

      if (hasVisibleContent) {
        break;
      }

      parent.style.display = 'none';
      parent.style.height = '0';
      parent.style.minHeight = '0';
      parent.style.margin = '0';
      parent.style.padding = '0';
      parent.style.overflow = 'hidden';
      parent = parent.parentElement;
    }
  });
}

function resyncAllHostViewports(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const teamsHost = isTeamsHostEnvironment();
  document.querySelectorAll(`.${HOST_CLASS}`).forEach((node) => {
    if (node instanceof HTMLElement) {
      syncWebPartViewportHeight(node, teamsHost);
    }
  });
}

/** Walk up the SharePoint page DOM and expand canvas containers to full section width. */
export function expandWebPartCanvas(hostElement: HTMLElement): void {
  collapseEmptyCanvasColumns(hostElement);

  let el: HTMLElement | null = hostElement;

  while (el && el !== document.body) {
    if (isCanvasAncestor(el)) {
      applyCanvasExpansionStyles(el);
    }
    el = el.parentElement;
  }
}

let expandRetryTimer: number | undefined;
let viewportListenerBound = false;
let immersiveObserver: MutationObserver | undefined;
let immersiveObserverScheduled = false;

/** SharePoint app bar, site header, and left nav hidden when BODY_HIDE_NAV_CLASS is set. Top suite bar stays visible. */
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

function buildChromeHideBlock(bodyClass: string): string {
  return SHAREPOINT_LEFT_CHROME_SELECTORS.map((selector) => `body.${bodyClass} ${selector}`).join(',\n    ');
}

function buildLeftNavHideRules(): string {
  const hideBlock = buildChromeHideBlock(BODY_HIDE_NAV_CLASS);

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

    body.${BODY_HIDE_NAV_CLASS} .SPCanvas-canvas,
    body.${BODY_HIDE_NAV_CLASS} .CanvasComponent.LCS {
      padding-top: 0 !important;
    }

    body.${BODY_HIDE_NAV_CLASS} div[class^="pageContainer_"],
    body.${BODY_HIDE_NAV_CLASS} div[class*=" pageContainer_"],
    body.${BODY_HIDE_NAV_CLASS} .od-Frame-main,
    body.${BODY_HIDE_NAV_CLASS} #spoAppComponent,
    body.${BODY_HIDE_NAV_CLASS} #spPageCanvasContent,
    body.${BODY_HIDE_NAV_CLASS} .SPCanvas-canvasContent,
    body.${BODY_HIDE_NAV_CLASS} [data-automation-id="contentScrollRegion"] {
      margin-left: 0 !important;
      padding-left: 0 !important;
      left: 0 !important;
      max-width: 100% !important;
    }`;
}

/** Hide SharePoint left chrome while the app bootstraps (before settings sync). */
function buildAppLoadingChromeHideRules(): string {
  const hideBlock = buildChromeHideBlock(BODY_APP_LOADING_CLASS);

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
    }`;
}

/** SharePoint page header/title and command bar hidden when BODY_HIDE_PAGE_BAR_CLASS is set. */
function buildPageBarHideRules(): string {
  const selectors = [
    '#spCommandBar',
    '#spPageChrome',
    '[data-automation-id="pageCommandBar"]',
    '[data-automation-id="PageCommandBar"]',
    '[data-automation-id="ModernCommandBar"]',
    '[data-automation-id="pageHeader"]',
    '[data-automation-id="PageHeader"]',
    '[data-automation-id="pageTitle"]',
    '[data-automation-id="PageTitle"]',
    '[data-automation-id="pageTitleContainer"]',
    '[data-automation-id="PageTitleContainer"]',
    '[data-automation-id="CanvasPageTitle"]',
    '[data-automation-id="TitleTextId"]',
    '[data-automation-id="pageAuthorByLine"]',
    '[data-automation-id="PageAuthorByLine"]',
    '[data-sp-feature-tag*="PageTitle"]',
    '[data-sp-feature-tag*="Page Title"]',
    '.CanvasPageTitle',
    '.CanvasPageHeader',
    'div[class*="pageCommandBar"]',
    'div[class*="PageCommandBar"]',
    'div[class*="pageHeader"]',
    'div[class*="PageHeader"]',
    'div[class*="pageTitle"]',
    'div[class*="PageTitle"]',
    'div[class*="CanvasPageTitle"]'
  ];

  const hideBlock = (bodyClass: string): string =>
    selectors.map((selector) => `body.${bodyClass} ${selector}`).join(',\n    ');

  return `
    ${hideBlock(BODY_HIDE_PAGE_BAR_CLASS)} {
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

    body.${BODY_HIDE_PAGE_BAR_CLASS} .SPCanvas-canvas,
    body.${BODY_HIDE_PAGE_BAR_CLASS} .CanvasComponent.LCS,
    body.${BODY_HIDE_PAGE_BAR_CLASS} #spPageCanvasContent,
    body.${BODY_HIDE_PAGE_BAR_CLASS} .SPCanvas-canvasContent,
    body.${BODY_HIDE_PAGE_BAR_CLASS} [data-automation-id="contentScrollRegion"],
    body.${BODY_HIDE_PAGE_BAR_CLASS} [data-automation-id="CanvasLayout"],
    body.${BODY_HIDE_PAGE_BAR_CLASS} div[class^="pageContainer_"],
    body.${BODY_HIDE_PAGE_BAR_CLASS} div[class*=" pageContainer_"],
    body.${BODY_HIDE_PAGE_BAR_CLASS} .od-Frame-main,
    body.${BODY_HIDE_PAGE_BAR_CLASS} #spoAppComponent {
      padding-top: 0 !important;
      margin-top: 0 !important;
      top: 0 !important;
    }

    body.${BODY_HIDE_PAGE_BAR_CLASS} .CanvasZone:has(.${HOST_CLASS}),
    body.${BODY_HIDE_PAGE_BAR_CLASS} .CanvasSection:has(.${HOST_CLASS}),
    body.${BODY_HIDE_PAGE_BAR_CLASS} .CanvasSection-col:has(.${HOST_CLASS}),
    body.${BODY_HIDE_PAGE_BAR_CLASS} .ControlZone:has(.${HOST_CLASS}),
    body.${BODY_HIDE_PAGE_BAR_CLASS} [data-automation-id^="CanvasZone"]:has(.${HOST_CLASS}),
    body.${BODY_HIDE_PAGE_BAR_CLASS} [data-automation-id^="CanvasSection"]:has(.${HOST_CLASS}),
    body.${BODY_HIDE_PAGE_BAR_CLASS} [data-automation-id^="CanvasControl"]:has(.${HOST_CLASS}) {
      padding-top: 0 !important;
      margin-top: 0 !important;
      top: 0 !important;
    }

    body.${BODY_HIDE_PAGE_BAR_CLASS} #spPageCanvasContent:has(.${HOST_CLASS}),
    body.${BODY_HIDE_PAGE_BAR_CLASS} .SPCanvas-canvasContent:has(.${HOST_CLASS}) {
      padding-top: 0 !important;
      margin-top: 0 !important;
      top: 0 !important;
    }`;
}

/** Microsoft 365 / SharePoint suite bar (app launcher, search, profile) hidden when BODY_HIDE_SUITE_BAR_CLASS is set. */
function buildSuiteBarHideRules(): string {
  const selectors = [
    '#SuiteNavWrapper',
    '#SuiteNavPlaceHolder',
    '#SuiteNavPlaceholder',
    '#O365_NavHeader',
    '#O365_HeaderLeftRegion',
    '#O365_HeaderRightRegion',
    '[data-automation-id="SuiteNavHeader"]',
    '[data-automation-id="O365_MainLink"]',
    'div[id="O365_MainLink_NavMenu"]',
    'div[class*="suiteNav"]',
    'div[class*="SuiteNav"]',
    'div[class*="ms-suiteux-header"]'
  ];

  const hideBlock = (bodyClass: string): string =>
    selectors.map((selector) => `body.${bodyClass} ${selector}`).join(',\n    ');

  return `
    ${hideBlock(BODY_HIDE_SUITE_BAR_CLASS)} {
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

    body.${BODY_HIDE_SUITE_BAR_CLASS} .SPCanvas-canvas,
    body.${BODY_HIDE_SUITE_BAR_CLASS} .CanvasComponent.LCS,
    body.${BODY_HIDE_SUITE_BAR_CLASS} div[class^="pageContainer_"],
    body.${BODY_HIDE_SUITE_BAR_CLASS} div[class*=" pageContainer_"],
    body.${BODY_HIDE_SUITE_BAR_CLASS} .od-Frame-main,
    body.${BODY_HIDE_SUITE_BAR_CLASS} #spoAppComponent {
      padding-top: 0 !important;
      margin-top: 0 !important;
    }`;
}

/** SharePoint canvas mounts asynchronously — re-apply expansion after layout settles. */
export function scheduleWebPartCanvasExpand(hostElement: HTMLElement, teamsHost = false): void {
  syncWebPartViewportHeight(hostElement, teamsHost);

  if (teamsHost) {
    if (!viewportListenerBound) {
      viewportListenerBound = true;
      window.addEventListener('resize', () => syncWebPartViewportHeight(hostElement, true));
    }
    return;
  }

  expandWebPartCanvas(hostElement);
  collapseWebPartCanvasHeight(hostElement);
  collapseSharePointEmptySections(hostElement);

  if (expandRetryTimer !== undefined) {
    window.clearTimeout(expandRetryTimer);
  }

  const delays = [0, 120, 400, 1200];
  delays.forEach((delay) => {
    window.setTimeout(() => {
      expandWebPartCanvas(hostElement);
      collapseWebPartCanvasHeight(hostElement);
      collapseSharePointEmptySections(hostElement);
      syncWebPartViewportHeight(hostElement, false);
    }, delay);
  });

  if (!viewportListenerBound) {
    viewportListenerBound = true;
    window.addEventListener('resize', () => syncWebPartViewportHeight(hostElement, false));
  }

  expandRetryTimer = window.setTimeout(() => {
    expandRetryTimer = undefined;
  }, 1300);
}

export function applyWebPartHostStyles(hostElement: HTMLElement, teamsHost = false): void {
  hostElement.classList.add(HOST_CLASS);
  if (teamsHost) {
    hostElement.classList.add(HOST_TEAMS_CLASS);
  }
  syncWebPartViewportHeight(hostElement, teamsHost);
  hostElement.style.width = '100%';
  hostElement.style.maxWidth = '100%';
  hostElement.style.boxSizing = 'border-box';
  hostElement.style.display = 'flex';
  hostElement.style.flexDirection = 'column';
  hostElement.style.flex = teamsHost ? '1 1 auto' : '0 0 auto';
  hostElement.style.minWidth = '0';
  hostElement.style.minHeight = 'var(--asset-mgmt-available-height, 100vh)';
  hostElement.style.height = teamsHost ? '100%' : 'var(--asset-mgmt-available-height, 100vh)';
  hostElement.style.maxHeight = teamsHost ? '100%' : 'var(--asset-mgmt-available-height, 100vh)';
  hostElement.style.overflow = 'hidden';

  if (!teamsHost) {
    collapseWebPartCanvasHeight(hostElement);
    scheduleWebPartCanvasExpand(hostElement, false);
  } else {
    scheduleWebPartCanvasExpand(hostElement, true);
  }

  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @media screen {
      .${HOST_CLASS} {
        overflow: hidden !important;
        overflow-x: clip;
        flex: 0 0 auto !important;
        height: var(--asset-mgmt-available-height, 100vh) !important;
        max-height: var(--asset-mgmt-available-height, 100vh) !important;
        min-height: var(--asset-mgmt-available-height, 100vh) !important;
      }

      .${REACT_MOUNT_CLASS},
      .${HOST_CLASS} .asset-mgmt-react-mount,
      .${HOST_CLASS} .asset-mgmt-root,
      .${HOST_CLASS} .asset-mgmt-themed,
      .${HOST_CLASS} .fui-FluentProvider {
        flex: 1 1 auto !important;
        height: 100% !important;
        max-height: 100% !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }

      html:has(.${HOST_CLASS}),
      body:has(.${HOST_CLASS}):not(.${BODY_TEAMS_HOST_CLASS}) {
        overflow: hidden !important;
        height: 100%;
      }

      ${PAGE_SCROLL_LOCK_SELECTORS.map(
        (selector) => `${selector}:has(.${HOST_CLASS})`
      ).join(',\n      ')} {
        overflow: hidden !important;
        overflow-y: hidden !important;
      }
    }

    .${HOST_CLASS} {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box;
      position: relative;
      display: flex;
      flex-direction: column;
      isolation: isolate;
    }

    .CanvasZone--fullWidth .${HOST_CLASS},
    .CanvasSection--fullWidth .${HOST_CLASS} {
      width: 100% !important;
      max-width: 100% !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    .${CANVAS_EXPANDED_CLASS} {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box;
    }

    .${CANVAS_EXPANDED_CLASS}.CanvasSection-col {
      flex: 1 1 100% !important;
      min-width: 0 !important;
    }

    .${CANVAS_EMPTY_COL_HIDDEN_CLASS} {
      display: none !important;
      flex: 0 0 0 !important;
      width: 0 !important;
      max-width: 0 !important;
      min-width: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: hidden !important;
    }

    .CanvasSection:has(.${HOST_CLASS}) {
      width: 100% !important;
      max-width: 100% !important;
    }

    .CanvasSection:has(.${HOST_CLASS}),
    .CanvasZone:has(.${HOST_CLASS}),
    [data-automation-id^="CanvasZone"]:has(.${HOST_CLASS}),
    [data-automation-id^="CanvasSection"]:has(.${HOST_CLASS}),
    #spPageCanvasContent:has(.${HOST_CLASS}),
    .SPCanvas-canvasContent:has(.${HOST_CLASS}) {
      max-width: 100% !important;
      width: 100% !important;
      box-sizing: border-box;
    }

    .CanvasSection-col:has(.${HOST_CLASS}) {
      flex: 1 1 100% !important;
      max-width: 100% !important;
      width: 100% !important;
      min-width: 0 !important;
      padding: 0 !important;
    }

    .ControlZone:has(.${HOST_CLASS}),
    .ControlZone--control:has(.${HOST_CLASS}),
    [data-automation-id^="CanvasControl"]:has(.${HOST_CLASS}) {
      padding: 0 !important;
      margin: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
      box-sizing: border-box;
    }

    .CanvasZone:has(.${HOST_CLASS}),
    .CanvasSection:has(.${HOST_CLASS}),
    [data-automation-id^="CanvasZone"]:has(.${HOST_CLASS}),
    [data-automation-id^="CanvasSection"]:has(.${HOST_CLASS}) {
      padding: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
      box-sizing: border-box;
    }

    .${HOST_CLASS} .ControlZone,
    .${HOST_CLASS} .ControlZone--control,
    .${HOST_CLASS} [data-sp-feature-tag] {
      max-width: 100% !important;
      width: 100% !important;
      box-sizing: border-box;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    .${REACT_MOUNT_CLASS},
    .${HOST_CLASS} .asset-mgmt-react-mount,
    .${HOST_CLASS} .asset-mgmt-root,
    .${HOST_CLASS} .asset-mgmt-themed,
    .${HOST_CLASS} .fui-FluentProvider {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      position: relative;
      display: flex;
      flex-direction: column;
      isolation: isolate;
    }

    ${PAGE_SCROLL_LOCK_SELECTORS.map(
      (selector) => `${selector}:has(.${HOST_CLASS})`
    ).join(',\n    ')} {
      min-height: auto !important;
      height: auto !important;
    }

    #spPageCanvasContent:has(.${HOST_CLASS}),
    .SPCanvas-canvasContent:has(.${HOST_CLASS}),
    [data-automation-id="contentScrollRegion"]:has(.${HOST_CLASS}),
    [data-automation-id="CanvasLayout"]:has(.${HOST_CLASS}),
    .CanvasZone:has(.${HOST_CLASS}),
    .CanvasSection:has(.${HOST_CLASS}),
    .ControlZone--control:has(.${HOST_CLASS}),
    [data-automation-id^="CanvasZone"]:has(.${HOST_CLASS}),
    [data-automation-id^="CanvasSection"]:has(.${HOST_CLASS}),
    div[class^="pageContainer_"]:has(.${HOST_CLASS}),
    .od-Frame-main:has(.${HOST_CLASS}) {
      min-height: auto !important;
      height: auto !important;
    }

    .${HOST_CLASS} .fui-FluentProvider {
      font-family: "Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;
      line-height: 1.5;
    }

    .${HOST_CLASS} .asset-mgmt-themed[data-theme="dark"] .fui-TableRow,
    .${HOST_CLASS} .asset-mgmt-themed[data-theme="dark"] .fui-TableHeader {
      border-bottom-color: rgba(255, 255, 255, 0.08);
    }

    .${HOST_CLASS} .asset-mgmt-themed[data-theme="dark"] .fui-Card {
      border-color: rgba(255, 255, 255, 0.08);
    }

    .${HOST_CLASS} .asset-mgmt-themed[data-theme="dark"] .fui-MessageBar {
      border-color: rgba(255, 255, 255, 0.1);
    }

    .${HOST_CLASS} .asset-mgmt-themed[data-theme="dark"] .fui-TableHeaderCell {
      border-bottom-color: rgba(255, 255, 255, 0.08);
    }

    .${HOST_CLASS} .asset-mgmt-themed button.asset-mgmt-collapsible-section-header {
      color: var(--colorNeutralForeground1, #ffffff);
    }

    .${HOST_CLASS} .asset-mgmt-themed button.asset-mgmt-collapsible-section-header .fui-Text {
      color: inherit;
    }

    .${HOST_CLASS} .asset-mgmt-themed[data-theme="dark"] button.asset-mgmt-collapsible-section-header svg {
      color: rgba(255, 255, 255, 0.78);
    }

    .${HOST_CLASS} .asset-mgmt-themed[data-theme="dark"] button.asset-mgmt-collapsible-section-header:hover svg {
      color: #ffffff;
    }

    .${HOST_CLASS} .asset-mgmt-tab--active {
      color: #115e59;
      font-weight: 600;
      border-color: #14b8a6;
    }

    .${HOST_CLASS} .asset-mgmt-themed[data-theme="dark"] .asset-mgmt-tab {
      color: rgba(255, 255, 255, 0.78);
      background-color: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .${HOST_CLASS} .asset-mgmt-themed[data-theme="dark"] .asset-mgmt-tab--active {
      color: #ffffff;
      background-color: rgba(20, 184, 166, 0.35);
      border-color: rgba(45, 212, 191, 0.55);
    }

    .${HOST_CLASS} .asset-mgmt-themed[data-theme="dark"] .fui-Divider {
      border-top-color: rgba(255, 255, 255, 0.08);
    }

    .${HOST_CLASS} .asset-mgmt-themed[data-theme="dark"] .asset-mgmt-form-tab-bar {
      border-bottom-color: rgba(255, 255, 255, 0.08);
    }

    .${HOST_CLASS} .asset-mgmt-themed[data-theme="dark"] .asset-mgmt-form-tab {
      color: rgba(255, 255, 255, 0.72);
    }

    .${HOST_CLASS} .asset-mgmt-themed[data-theme="dark"] .asset-mgmt-form-tab--active {
      color: #7dd3fc;
      border-bottom-color: #14b8a6;
    }

    .${HOST_CLASS} .fui-MessageBar,
    .${HOST_CLASS} .fui-Card,
    .${HOST_CLASS} .fui-Text {
      box-sizing: border-box;
    }

    .${HOST_CLASS} table {
      width: 100%;
    }

    .${HOST_CLASS} .asset-mgmt-data-table {
      table-layout: fixed;
    }

    .${HOST_CLASS} .asset-mgmt-data-table .fui-TableCell,
    .${HOST_CLASS} .asset-mgmt-data-table .fui-TableHeaderCell,
    .${HOST_CLASS} .asset-mgmt-data-table td,
    .${HOST_CLASS} .asset-mgmt-data-table th {
      overflow: hidden;
      box-sizing: border-box;
    }

    .${HOST_CLASS} .fui-Table:not(.asset-mgmt-data-table) {
      min-width: 0;
    }

    @media (max-width: 768px) {
      .${HOST_CLASS} button,
      .${HOST_CLASS} .fui-Button,
      .${HOST_CLASS} .fui-ToolbarButton {
        min-height: 36px;
      }
    }

    body.${BODY_TEAMS_HOST_CLASS} {
      height: 100%;
      overflow: hidden;
    }

    body.${BODY_TEAMS_HOST_CLASS} .${HOST_CLASS}.${HOST_TEAMS_CLASS} {
      flex: 1 1 auto !important;
      height: 100% !important;
      min-height: var(--asset-mgmt-available-height, 100vh) !important;
    }

    body > .asset-mgmt-setup-portal {
      z-index: 1000000 !important;
      font-family: "Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;
      line-height: 1.5;
      box-sizing: border-box;
    }

    /*
     * Fluent v9 portals default to z-index 1000000, which equals the detail-panel
     * backdrop and sits below the panel (1000001). That makes Dropdown/Combobox/Menu
     * listboxes render behind the panel or app chrome ("dropdown opens but options are
     * hidden/unclickable"). Elevate all Fluent portals unconditionally so popover
     * surfaces always stack above the app, regardless of whether the panel is open.
     */
    body > .fui-Portal {
      z-index: 1000002 !important;
    }

    body > .fui-Portal [role="dialog"] input,
    body > .fui-Portal [role="dialog"] textarea,
    body > .fui-Portal [role="dialog"] button,
    body > .fui-Portal [role="dialog"] select,
    body > .fui-Portal [role="dialog"] .fui-Input,
    body > .fui-Portal [role="dialog"] .fui-Dropdown,
    body > .fui-Portal [role="dialog"] .fui-Select,
    body > .fui-Portal [role="dialog"] .fui-Select__select,
    body > .fui-Portal [role="dialog"] .fui-Combobox,
    body > .fui-Portal [role="dialog"] .fui-Switch,
    body > .fui-Portal [role="dialog"] .asset-mgmt-native-select {
      pointer-events: auto !important;
    }

    body > .fui-Portal select option,
    body > .fui-Portal .fui-Select__select option {
      background-color: var(--colorNeutralBackground1, #292929);
      color: var(--colorNeutralForeground1, #ffffff);
    }

    .${HOST_CLASS} .fui-Dropdown__listbox,
    .${HOST_CLASS} .fui-Combobox__listbox,
    body.asset-mgmt-detail-panel-open > .fui-Portal .fui-Dropdown__listbox,
    body.asset-mgmt-detail-panel-open > .fui-Portal .fui-Combobox__listbox {
      z-index: 1000003 !important;
      pointer-events: auto !important;
    }

    body.asset-mgmt-detail-panel-open [role="dialog"] input,
    body.asset-mgmt-detail-panel-open [role="dialog"] textarea,
    body.asset-mgmt-detail-panel-open [role="dialog"] button,
    body.asset-mgmt-detail-panel-open [role="dialog"] .fui-Input,
    body.asset-mgmt-detail-panel-open [role="dialog"] .fui-Dropdown,
    body.asset-mgmt-detail-panel-open [role="dialog"] .fui-Select,
    body.asset-mgmt-detail-panel-open [role="dialog"] select,
    body.asset-mgmt-detail-panel-open [role="dialog"] .fui-Switch {
      pointer-events: auto !important;
    }

    ${buildLeftNavHideRules()}
    ${buildPageBarHideRules()}
    ${buildSuiteBarHideRules()}

    .${HOST_CLASS}.${HOST_LOADING_CLASS} {
      min-height: var(--asset-mgmt-available-height, 100vh);
      background-color: #f5f5f5;
    }

    body.${BODY_HIDE_NAV_CLASS} div[class^="pageContainer_"],
    body.${BODY_HIDE_NAV_CLASS} #spPageCanvasContent,
    body.${BODY_HIDE_NAV_CLASS} .SPCanvas-canvasContent,
    body.${BODY_HIDE_NAV_CLASS} [data-automation-id="contentScrollRegion"],
    body.${BODY_HIDE_NAV_CLASS} [data-automation-id="CanvasLayout"],
    body.${BODY_HIDE_NAV_CLASS} div[class*="mainContent_"] {
      max-width: 100% !important;
      width: 100% !important;
      min-height: auto !important;
      height: auto !important;
      overflow: hidden !important;
      overflow-y: hidden !important;
    }

    body.${BODY_HIDE_NAV_CLASS} .CanvasZone,
    body.${BODY_HIDE_NAV_CLASS} .CanvasSection,
    body.${BODY_HIDE_NAV_CLASS} .ControlZone--control,
    body.${BODY_HIDE_NAV_CLASS} [data-automation-id^="CanvasZone"],
    body.${BODY_HIDE_NAV_CLASS} [data-automation-id^="CanvasSection"] {
      padding: 0 !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
    }

    #workbenchPageContent:has(.${HOST_CLASS}),
    #workbenchPageContent:has(.${HOST_CLASS}) .CanvasZone,
    #workbenchPageContent:has(.${HOST_CLASS}) .CanvasSection,
    #workbenchPageContent:has(.${HOST_CLASS}) .ControlZone--control {
      padding: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
      min-height: auto !important;
      height: auto !important;
    }

    body.${BODY_APP_LOADING_CLASS} {
      background-color: #f5f5f5 !important;
    }

    ${buildAppLoadingChromeHideRules()}

    body.${BODY_APP_LOADING_CLASS} #CommentsWrapper,
    body.${BODY_APP_LOADING_CLASS} [data-automation-id="CommentsWrapper"] {
      display: none !important;
      visibility: hidden !important;
    }

    .${BOOTSTRAP_LOADER_CLASS} {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: var(--asset-mgmt-available-height, 100vh);
      background-color: #f5f5f5;
      box-sizing: border-box;
    }

    .${BOOTSTRAP_LOADER_CLASS}__inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #616161;
      font-family: "Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;
      font-size: 14px;
    }

    .${BOOTSTRAP_LOADER_CLASS}__spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e0e0e0;
      border-top-color: #0078d4;
      border-radius: 50%;
      animation: asset-mgmt-bootstrap-spin 0.9s linear infinite;
    }

    @keyframes asset-mgmt-bootstrap-spin {
      to {
        transform: rotate(360deg);
      }
    }

    #${FULLSCREEN_LOADER_ID} {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f5f5;
      opacity: 1;
      transition: opacity 0.25s ease;
    }

    #${FULLSCREEN_LOADER_ID}.is-hiding {
      opacity: 0;
    }

    .${HOST_CLASS} .asset-mgmt-themed[data-compact="true"] .fui-Button,
    .${HOST_CLASS} .asset-mgmt-themed[data-compact="true"] .fui-Input,
    .${HOST_CLASS} .asset-mgmt-themed[data-compact="true"] .fui-Dropdown,
    .${HOST_CLASS} .asset-mgmt-themed[data-compact="true"] .fui-Combobox {
      min-height: var(--asset-compact-control-height, 32px);
    }

    .${HOST_CLASS} .asset-mgmt-themed[data-compact="true"] .fui-Tab,
    .${HOST_CLASS} .asset-mgmt-themed[data-compact="true"] .fui-TabList {
      gap: calc(4px * var(--asset-spacing-scale, 1));
    }

    .${HOST_CLASS} .asset-mgmt-themed[data-compact="true"] .fui-Card {
      --fui-Card--size: var(--asset-compact-control-height, 32px);
    }
  `;
  document.head.appendChild(style);
  installDashboardPrintSupport();
}

/** Show a neutral background on the web part host while the app bootstraps. */
export function applyAppLoadingState(hostElement?: HTMLElement): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.add(BODY_APP_LOADING_CLASS);
  if (hostElement) {
    hostElement.classList.add(HOST_LOADING_CLASS);
  }
}

/** Restore normal page chrome after the app has finished its initial load. */
export function removeAppLoadingState(hostElement?: HTMLElement): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.remove(BODY_APP_LOADING_CLASS);
  if (hostElement) {
    hostElement.classList.remove(HOST_LOADING_CLASS);
  }
  removeFullScreenLoader();
}

/**
 * Show an opaque, full-viewport spinner over the entire page (including the
 * SharePoint app bar, header, and navigation) while the web part bundle and
 * initial data load. Removed via removeFullScreenLoader / removeAppLoadingState
 * once the app is ready, so users never see partial SharePoint chrome during load.
 */
export function showFullScreenLoader(): void {
  if (typeof document === 'undefined' || !document.body) {
    return;
  }
  if (document.getElementById(FULLSCREEN_LOADER_ID)) {
    return;
  }
  const overlay = document.createElement('div');
  overlay.id = FULLSCREEN_LOADER_ID;
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-busy', 'true');
  overlay.setAttribute('aria-label', 'Loading');
  overlay.innerHTML =
    `<div class="${BOOTSTRAP_LOADER_CLASS}__inner">` +
    `<div class="${BOOTSTRAP_LOADER_CLASS}__spinner" aria-hidden="true"></div>` +
    '<span>Loading</span>' +
    '</div>';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '2147483646';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.backgroundColor = '#f5f5f5';
  document.body.appendChild(overlay);

  // Failsafe: never leave the overlay covering the page if the app fails to
  // signal completion (e.g. an unhandled load error outside React).
  window.setTimeout(removeFullScreenLoader, 30000);
}

/** Fade out and remove the full-viewport loading overlay. */
export function removeFullScreenLoader(): void {
  if (typeof document === 'undefined') {
    return;
  }
  const overlay = document.getElementById(FULLSCREEN_LOADER_ID);
  if (!overlay) {
    return;
  }
  overlay.classList.add('is-hiding');
  window.setTimeout(() => overlay.remove(), 300);
}

/** Lightweight placeholder shown before React mounts (bundle parse / first render). */
export function showBootstrapLoader(hostElement: HTMLElement): void {
  if (hostElement.querySelector(`.${BOOTSTRAP_LOADER_CLASS}`)) {
    return;
  }

  const loader = document.createElement('div');
  loader.className = BOOTSTRAP_LOADER_CLASS;
  loader.setAttribute('role', 'status');
  loader.setAttribute('aria-busy', 'true');
  loader.setAttribute('aria-label', 'Loading');
  loader.innerHTML =
    '<div class="asset-mgmt-bootstrap-loader__inner">' +
    '<div class="asset-mgmt-bootstrap-loader__spinner" aria-hidden="true"></div>' +
    '<span>Loading</span>' +
    '</div>';
  hostElement.insertBefore(loader, hostElement.firstChild);
}

export function removeBootstrapLoader(hostElement: HTMLElement): void {
  hostElement.querySelectorAll(`.${BOOTSTRAP_LOADER_CLASS}`).forEach((node) => node.remove());
}

/** Hide SharePoint app bar, site header, and left navigation. Top suite bar stays visible. */
export function applySharePointLeftNavHidden(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.add(BODY_HIDE_NAV_CLASS);
}

/** @deprecated Use applySharePointLeftNavHidden */
export function applySharePointImmersiveMode(): void {
  applySharePointLeftNavHidden();
}

function ensureChromeHideObserver(): void {
  if (immersiveObserver || typeof MutationObserver === 'undefined' || typeof document === 'undefined') {
    return;
  }

  immersiveObserver = new MutationObserver(() => {
    if (
      !document.body.classList.contains(BODY_HIDE_NAV_CLASS) &&
      !document.body.classList.contains(BODY_HIDE_PAGE_BAR_CLASS) &&
      !document.body.classList.contains(BODY_HIDE_SUITE_BAR_CLASS)
    ) {
      return;
    }
    if (immersiveObserverScheduled) {
      return;
    }
    immersiveObserverScheduled = true;
    window.requestAnimationFrame(() => {
      immersiveObserverScheduled = false;
      if (document.body.classList.contains(BODY_HIDE_NAV_CLASS)) {
        applySharePointLeftNavHidden();
      }
      if (document.body.classList.contains(BODY_HIDE_PAGE_BAR_CLASS)) {
        applySharePointPageBarHidden();
      }
      if (document.body.classList.contains(BODY_HIDE_SUITE_BAR_CLASS)) {
        applySharePointTopBarHidden();
      }
      resyncAllHostViewports();
    });
  });

  immersiveObserver.observe(document.body, { childList: true, subtree: true });
}

/** Re-apply after SharePoint async layout — chrome can mount after web part init. */
export function scheduleSharePointLeftNavHidden(): void {
  applySharePointLeftNavHidden();
  resyncAllHostViewports();
  [0, 200, 600, 1500, 3000].forEach((delay) => {
    window.setTimeout(() => {
      applySharePointLeftNavHidden();
      resyncAllHostViewports();
    }, delay);
  });

  ensureChromeHideObserver();
}

/** @deprecated Use scheduleSharePointLeftNavHidden */
export function scheduleSharePointImmersiveMode(): void {
  scheduleSharePointLeftNavHidden();
}

export function removeSharePointLeftNavHidden(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.remove(BODY_HIDE_NAV_CLASS);
  document.body.classList.remove(BODY_IMMERSIVE_CLASS);
}

/** @deprecated Use removeSharePointLeftNavHidden */
export function removeSharePointImmersiveMode(): void {
  removeSharePointLeftNavHidden();
}

/** Apply or remove left navigation hiding (ignored in Teams). */
export function syncSharePointLeftNavVisibility(hidden: boolean): void {
  if (typeof document === 'undefined' || isTeamsHostEnvironment()) {
    return;
  }

  if (hidden) {
    scheduleSharePointLeftNavHidden();
  } else {
    removeSharePointLeftNavHidden();
    resyncAllHostViewports();
  }
}

/** Hide the SharePoint page command bar (New, Edit, Share, etc.). */
export function applySharePointPageBarHidden(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.add(BODY_HIDE_PAGE_BAR_CLASS);
}

export function removeSharePointPageBarHidden(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.remove(BODY_HIDE_PAGE_BAR_CLASS);
}

/** Apply or remove page command bar hiding (ignored in Teams). */
export function syncSharePointPageBarVisibility(hidden: boolean): void {
  if (typeof document === 'undefined' || isTeamsHostEnvironment()) {
    return;
  }

  if (hidden) {
    scheduleSharePointPageBarHidden();
  } else {
    removeSharePointPageBarHidden();
    resyncAllHostViewports();
  }
}

/** Re-apply after SharePoint async layout — command bar can mount after web part init. */
export function scheduleSharePointPageBarHidden(): void {
  applySharePointPageBarHidden();
  resyncAllHostViewports();
  [0, 200, 600, 1500, 3000].forEach((delay) => {
    window.setTimeout(() => {
      applySharePointPageBarHidden();
      resyncAllHostViewports();
    }, delay);
  });

  ensureChromeHideObserver();
}

/** Hide the Microsoft 365 / SharePoint suite bar (app launcher, search, profile). */
export function applySharePointTopBarHidden(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.add(BODY_HIDE_SUITE_BAR_CLASS);
}

export function removeSharePointTopBarHidden(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.remove(BODY_HIDE_SUITE_BAR_CLASS);
}

/** Apply or remove suite bar hiding (ignored in Teams). */
export function syncSharePointTopBarVisibility(hidden: boolean): void {
  if (typeof document === 'undefined' || isTeamsHostEnvironment()) {
    return;
  }

  if (hidden) {
    scheduleSharePointTopBarHidden();
  } else {
    removeSharePointTopBarHidden();
    resyncAllHostViewports();
  }
}

/** Re-apply after SharePoint async layout — suite bar can mount after web part init. */
export function scheduleSharePointTopBarHidden(): void {
  applySharePointTopBarHidden();
  resyncAllHostViewports();
  [0, 200, 600, 1500, 3000].forEach((delay) => {
    window.setTimeout(() => {
      applySharePointTopBarHidden();
      resyncAllHostViewports();
    }, delay);
  });

  ensureChromeHideObserver();
}

/** Legacy hook — Fluent UI is bundled; no external CSS needed. */
export function loadAssetManagementStyles(): void {
  // Intentionally empty. Host scoping styles are applied via applyWebPartHostStyles.
}
