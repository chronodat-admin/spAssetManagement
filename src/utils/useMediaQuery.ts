import * as React from 'react';

/** Shared breakpoints — align with existing @media rules in components. */
export const BREAKPOINTS = {
  /** Extra-small phones and narrow panels */
  compact: 640,
  /** Phone / narrow tablet — mobile nav drawer threshold */
  mobile: 768,
  /** Tablet — stacked dashboard grids */
  tablet: 1024
} as const;

export const MEDIA_COMPACT = `(max-width: ${BREAKPOINTS.compact}px)`;
export const MEDIA_MOBILE = `(max-width: ${BREAKPOINTS.mobile}px)`;
export const MEDIA_TABLET = `(max-width: ${BREAKPOINTS.tablet}px)`;

export const VIEWPORT_HEIGHT_FALLBACK = '100vh';
export const VIEWPORT_HEIGHT_DYNAMIC = '100dvh';

export function useMediaQuery(query: string): boolean {
  const getMatches = React.useCallback((): boolean => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);

  const [matches, setMatches] = React.useState(getMatches);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent | MediaQueryList): void => {
      setMatches('matches' in event ? event.matches : mediaQuery.matches);
    };

    handleChange(mediaQuery);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [query, getMatches]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery(MEDIA_MOBILE);
}

export function useIsCompact(): boolean {
  return useMediaQuery(MEDIA_COMPACT);
}

export function useIsTablet(): boolean {
  return useMediaQuery(MEDIA_TABLET);
}

/** True when the viewport matches the mobile breakpoint (safe outside React). */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(MEDIA_MOBILE).matches;
}

/** Observe an element's content width for container-aware responsive layouts. */
export function useElementWidth<T extends HTMLElement>(): [React.RefObject<T>, number | null] {
  const ref = React.useRef<T>(null);
  const [width, setWidth] = React.useState<number | null>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }

    const update = (): void => {
      setWidth(element.getBoundingClientRect().width);
    };

    update();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
