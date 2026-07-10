import * as React from 'react';
import { makeStyles, Spinner, Text, tokens } from '@fluentui/react-components';
import { removeBootstrapLoader } from '../../utils/loadAssetManagementStyles';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalM,
    width: '100%',
    flex: '1 1 auto',
    minHeight: '320px',
    padding: tokens.spacingVerticalXXL,
    boxSizing: 'border-box'
  },
  fullPage: {
    minHeight: 'var(--asset-mgmt-available-height, 100vh)',
    backgroundColor: tokens.colorNeutralBackground2
  }
});

export interface AppLoadingSkeletonProps {
  /** Fill the web part viewport before the app shell mounts. */
  fullPage?: boolean;
}

export const AppLoadingSkeleton: React.FC<AppLoadingSkeletonProps> = ({ fullPage = false }) => {
  const styles = useStyles();

  React.useEffect(() => {
    const host = document.querySelector('.asset-management-webpart-host') as HTMLElement | null;
    if (host) {
      removeBootstrapLoader(host);
    }
  }, []);

  return (
    <div
      className={fullPage ? `${styles.root} ${styles.fullPage}` : styles.root}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <Spinner size="large" aria-label="Loading" />
      <Text size={300}>Loading</Text>
    </div>
  );
};
