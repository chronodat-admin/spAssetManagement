const SCROLL_ROOT_SELECTOR = '[data-asset-mgmt-scroll-root]';

export function getAppContentScrollRoot(): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const root = document.querySelector(SCROLL_ROOT_SELECTOR);
  return root instanceof HTMLElement ? root : null;
}

export function scrollAppContentToTop(behavior: ScrollBehavior = 'smooth'): void {
  const root = getAppContentScrollRoot();
  if (!root) {
    window.scrollTo({ top: 0, behavior });
    return;
  }

  root.scrollTo({ top: 0, behavior });
}
