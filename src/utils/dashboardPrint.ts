import {
  DASHBOARD_PRINT_FONT_FAMILY,
  dashboardPrintTheme,
  ensureDashboardPrintFont
} from './dashboardPrintTheme';

const PRINT_STYLE_ID = 'asset-mgmt-dashboard-print-styles';
const PRINT_BODY_CLASS = 'asset-mgmt-printing';
const PRINT_ROOT_ID = 'dashboard-print-root';
const FULLSCREEN_LOADER_ID = 'asset-mgmt-fullscreen-loader';
const BODY_APP_LOADING_CLASS = 'asset-mgmt-app-loading';
const HOST_CLASS = 'asset-management-webpart-host';

const printTheme = dashboardPrintTheme;

function removeFullScreenLoader(): void {
  const overlay = document.getElementById(FULLSCREEN_LOADER_ID);
  if (!overlay) {
    return;
  }
  overlay.classList.add('is-hiding');
  window.setTimeout(() => overlay.remove(), 300);
}

interface IPrintRestoreState {
  parent: Node;
  nextSibling: ChildNode | null;
}

let printSupportBound = false;
let printPrepared = false;
let printRestore: IPrintRestoreState | undefined;

function ensureDashboardPrintStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(PRINT_STYLE_ID)) {
    return;
  }

  ensureDashboardPrintFont();

  const style = document.createElement('style');
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    @media screen {
      .dashboard-print {
        display: none !important;
      }
    }

    body.${PRINT_BODY_CLASS} > *:not(#${PRINT_ROOT_ID}) {
      display: none !important;
    }

    body.${PRINT_BODY_CLASS} #${PRINT_ROOT_ID},
    body.${PRINT_BODY_CLASS} .dashboard-print {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      position: static !important;
      width: 100% !important;
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      font-family: ${DASHBOARD_PRINT_FONT_FAMILY} !important;
      color: ${printTheme.text} !important;
      background: ${printTheme.bg} !important;
      box-sizing: border-box !important;
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
    }

    body.${PRINT_BODY_CLASS} #${PRINT_ROOT_ID} *,
    body.${PRINT_BODY_CLASS} .dashboard-print * {
      visibility: visible !important;
      font-family: inherit !important;
      color-adjust: exact !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    @media print {
      @page {
        size: A4 landscape;
        margin: 6mm;
      }

      #${FULLSCREEN_LOADER_ID} {
        display: none !important;
      }

      html,
      body {
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
        font-family: ${DASHBOARD_PRINT_FONT_FAMILY} !important;
        background: ${printTheme.bg} !important;
        color: ${printTheme.text} !important;
        -webkit-font-smoothing: antialiased !important;
      }

      #SuiteNavWrapper,
      #sp-appBar,
      #spSiteHeader,
      #spCommandBar,
      #CommentsWrapper,
      [data-automation-id="CommentsWrapper"],
      [data-automation-id="appBar"],
      [data-automation-id="SiteHeader"],
      [data-automation-id="pageCommandBar"] {
        display: none !important;
      }

      .dashboard-screen,
      .asset-mgmt-no-print {
        display: none !important;
      }

      #${PRINT_ROOT_ID},
      .dashboard-print {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: static !important;
        width: 100% !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        font-family: ${DASHBOARD_PRINT_FONT_FAMILY} !important;
        color: ${printTheme.text} !important;
        background: ${printTheme.bg} !important;
      }

      #${PRINT_ROOT_ID} *,
      .dashboard-print * {
        visibility: visible !important;
        font-family: inherit !important;
        color-adjust: exact !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .dashboard-print-keep {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .dashboard-print-section {
        break-inside: auto;
        page-break-inside: auto;
      }

      .dashboard-print-charts-row {
        display: block !important;
      }

      .dashboard-print-charts-row > .dashboard-print-section {
        margin-bottom: 12px;
      }

      .dashboard-print table {
        break-inside: auto;
        page-break-inside: auto;
        width: 100%;
      }

      .dashboard-print thead {
        display: table-header-group;
      }

      .dashboard-print tbody {
        display: table-row-group;
      }

      .dashboard-print tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .dashboard-print tr:last-child td {
        border-bottom: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function clearPrintBlockingInlineStyles(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const host = document.querySelector(`.${HOST_CLASS}`);
  if (!host) {
    return;
  }

  let el: HTMLElement | null = host as HTMLElement;
  while (el && el !== document.body) {
    el.style.removeProperty('overflow');
    el.style.removeProperty('overflow-y');
    el.style.removeProperty('height');
    el.style.removeProperty('max-height');
    el.style.removeProperty('min-height');
    el = el.parentElement;
  }

  host
    .querySelectorAll(
      '[data-asset-mgmt-scroll-root], .asset-mgmt-themed, .asset-mgmt-root, .asset-mgmt-react-mount, .fui-FluentProvider'
    )
    .forEach((node) => {
      if (node instanceof HTMLElement) {
        node.style.removeProperty('overflow');
        node.style.removeProperty('overflow-y');
        node.style.removeProperty('height');
        node.style.removeProperty('max-height');
        node.style.removeProperty('min-height');
      }
    });
}

export function prepareDashboardPrint(): void {
  if (typeof document === 'undefined' || printPrepared) {
    return;
  }

  ensureDashboardPrintStyles();
  removeFullScreenLoader();
  clearPrintBlockingInlineStyles();
  document.body.classList.remove(BODY_APP_LOADING_CLASS);

  const root = document.getElementById(PRINT_ROOT_ID);
  if (!root?.parentNode) {
    document.body.classList.add(PRINT_BODY_CLASS);
    printPrepared = true;
    return;
  }

  printRestore = {
    parent: root.parentNode,
    nextSibling: root.nextSibling
  };
  document.body.appendChild(root);
  document.body.classList.add(PRINT_BODY_CLASS);
  printPrepared = true;
}

export function cleanupDashboardPrint(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.getElementById(PRINT_ROOT_ID);
  if (root && printRestore) {
    if (printRestore.nextSibling) {
      printRestore.parent.insertBefore(root, printRestore.nextSibling);
    } else {
      printRestore.parent.appendChild(root);
    }
  }

  printRestore = undefined;
  printPrepared = false;
  document.body.classList.remove(PRINT_BODY_CLASS);
}

export function installDashboardPrintSupport(): void {
  if (printSupportBound || typeof window === 'undefined') {
    return;
  }

  ensureDashboardPrintFont();
  ensureDashboardPrintStyles();
  printSupportBound = true;
  window.addEventListener('beforeprint', prepareDashboardPrint);
  window.addEventListener('afterprint', cleanupDashboardPrint);
}

/** Open the browser print dialog for the hidden dashboard print layout. */
export function printDashboard(): void {
  prepareDashboardPrint();
  window.print();
}
