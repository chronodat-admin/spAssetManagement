import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  Button,
  Caption1,
  makeStyles,
  mergeClasses,
  Subtitle1,
  tokens,
  webLightTheme
} from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';
import { SpfxFluentProvider } from '../SpfxFluentProvider/SpfxFluentProvider';
import { patchTabsterInstance } from '../../utils/patchTabster';

const useStyles = makeStyles({
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    border: 'none',
    padding: 0,
    margin: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    zIndex: 1000000,
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.2s ease'
  },
  backdropDefault: {
    right: 'min(440px, 100vw)'
  },
  backdropWide: {
    right: 'min(640px, 100vw)'
  },
  backdropExtraWide: {
    right: 'min(900px, 100vw)'
  },
  backdropFullPage: {
    right: 0
  },
  backdropOpen: {
    opacity: 1,
    pointerEvents: 'auto'
  },
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow28,
    zIndex: 1000001,
    width: 'min(440px, 100vw)',
    transform: 'translateX(105%)',
    transition: 'transform 0.24s ease',
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    isolation: 'isolate',
    pointerEvents: 'auto'
  },
  panelWide: {
    width: 'min(640px, 100vw)'
  },
  panelExtraWide: {
    width: 'min(900px, 100vw)'
  },
  panelFullPage: {
    width: '100vw',
    maxWidth: '100vw'
  },
  panelOpen: {
    transform: 'translateX(0)'
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    flexShrink: 0,
    '@media (max-width: 768px)': {
      padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`
    }
  },
  headerText: {
    minWidth: 0,
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS
  },
  headerTitle: {
    display: 'block'
  },
  headerSubtitle: {
    display: 'block',
    color: tokens.colorNeutralForeground3
  },
  body: {
    position: 'relative',
    flex: '1 1 auto',
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: tokens.spacingHorizontalL,
    WebkitOverflowScrolling: 'touch',
    pointerEvents: 'auto',
    '@media (max-width: 768px)': {
      padding: tokens.spacingHorizontalM
    }
  },
  footer: {
    display: 'flex',
    flexShrink: 0,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    position: 'relative',
    zIndex: 1000004,
    pointerEvents: 'auto',
    '@media (max-width: 768px)': {
      padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`
    }
  }
});

export interface IRightDetailPanelProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  extraWide?: boolean;
  fullPage?: boolean;
}

export const RightDetailPanel: React.FC<IRightDetailPanelProps> = ({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
  extraWide,
  fullPage
}) => {
  const styles = useStyles();
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      setPortalTarget(document.body);
    }
  }, []);

  React.useLayoutEffect(() => {
    if (open) {
      patchTabsterInstance();
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('asset-mgmt-detail-panel-open');

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('asset-mgmt-detail-panel-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !portalTarget) {
    return null;
  }

  return ReactDOM.createPortal(
    <SpfxFluentProvider theme={webLightTheme} providerId="asset-mgmt-detail-panel" portal>
      <button
        type="button"
        className={mergeClasses(
          styles.backdrop,
          fullPage
            ? styles.backdropFullPage
            : extraWide
              ? styles.backdropExtraWide
              : wide
                ? styles.backdropWide
                : styles.backdropDefault,
          styles.backdropOpen
        )}
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        className={mergeClasses(
          styles.panel,
          fullPage && styles.panelFullPage,
          !fullPage && extraWide && styles.panelExtraWide,
          !fullPage && wide && !extraWide && styles.panelWide,
          styles.panelOpen
        )}
        role="dialog"
        aria-label={title}
      >
        <div className={styles.header}>
          <div className={styles.headerText}>
            <Subtitle1 as="h2" className={styles.headerTitle}>
              {title}
            </Subtitle1>
            {subtitle && <Caption1 className={styles.headerSubtitle}>{subtitle}</Caption1>}
          </div>
          <Button
            appearance="subtle"
            icon={<DismissRegular />}
            aria-label="Close"
            onClick={onClose}
          />
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </aside>
    </SpfxFluentProvider>,
    portalTarget
  );
};
