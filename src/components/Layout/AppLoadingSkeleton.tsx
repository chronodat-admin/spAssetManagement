import * as React from 'react';
import { makeStyles, Spinner, Text, tokens } from '@fluentui/react-components';
import { removeBootstrapLoader } from '../../utils/loadAssetManagementStyles';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    minHeight: 'var(--asset-mgmt-available-height, 100vh)',
    backgroundColor: tokens.colorNeutralBackground2,
    boxSizing: 'border-box'
  },
  body: {
    display: 'flex',
    flexDirection: 'row',
    flex: '1 1 auto',
    minHeight: 0,
    width: '100%'
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    width: '240px',
    flexShrink: 0,
    padding: tokens.spacingVerticalM,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    '@media (max-width: 768px)': {
      display: 'none'
    }
  },
  sidebarBlock: {
    height: '14px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3
  },
  sidebarBlockWide: {
    height: '14px',
    width: '72%',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
    minWidth: 0,
    minHeight: 'var(--asset-mgmt-available-height, 100vh)'
  },
  accentBar: {
    width: '100%',
    flexShrink: 0,
    minHeight: '40px',
    backgroundColor: tokens.colorBrandBackground,
    borderBottom: `1px solid ${tokens.colorBrandBackgroundHover}`
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1
  },
  titleBar: {
    height: '28px',
    width: '220px',
    maxWidth: '60%',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3
  },
  subtitleBar: {
    height: '14px',
    width: '320px',
    maxWidth: '80%',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3
  },
  content: {
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL
  },
  card: {
    height: '120px',
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  cardRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalM
  },
  cardSmall: {
    height: '96px',
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  spinnerWrap: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalM,
    pointerEvents: 'none',
    zIndex: 1
  },
  pulse: {
    animationName: {
      '0%': { opacity: 0.55 },
      '50%': { opacity: 1 },
      '100%': { opacity: 0.55 }
    },
    animationDuration: '1.4s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out'
  }
});

export const AppLoadingSkeleton: React.FC = () => {
  const styles = useStyles();
  const pulse = styles.pulse;

  React.useEffect(() => {
    const host = document.querySelector('.asset-management-webpart-host') as HTMLElement | null;
    if (host) {
      removeBootstrapLoader(host);
    }
  }, []);

  return (
    <div className={styles.root} role="status" aria-busy="true" aria-label="Loading">
      <div className={styles.accentBar} aria-hidden />
      <div className={styles.body}>
        <div className={styles.sidebar} aria-hidden>
          <div className={`${styles.sidebarBlockWide} ${pulse}`} />
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className={`${styles.sidebarBlock} ${pulse}`} />
          ))}
        </div>
        <div className={styles.main}>
          <div className={styles.header} aria-hidden>
            <div className={`${styles.titleBar} ${pulse}`} />
            <div className={`${styles.subtitleBar} ${pulse}`} />
          </div>
          <div className={styles.content} aria-hidden>
            <div className={`${styles.card} ${pulse}`} />
            <div className={styles.cardRow}>
              <div className={`${styles.cardSmall} ${pulse}`} />
              <div className={`${styles.cardSmall} ${pulse}`} />
              <div className={`${styles.cardSmall} ${pulse}`} />
            </div>
            <div className={`${styles.card} ${pulse}`} style={{ flex: 1, minHeight: 180 }} />
          </div>
        </div>
      </div>
      <div className={styles.spinnerWrap}>
        <Spinner size="large" aria-label="Loading" />
        <Text size={300}>Loading</Text>
      </div>
    </div>
  );
};
