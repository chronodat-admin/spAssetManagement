import * as React from 'react';
import {
  Button,
  Card,
  Spinner,
  Text,
  Title3,
  makeStyles,
  shorthands,
  tokens
} from '@fluentui/react-components';
import { ArrowSyncRegular, PlugDisconnectedRegular, SettingsRegular } from '@fluentui/react-icons';
import { DEFAULT_APP_TITLE } from '../../constants/spfxComponents';
import { useSubscription } from '../../contexts/SubscriptionContext';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '420px',
    padding: tokens.spacingHorizontalXXL
  },
  card: {
    maxWidth: '560px',
    width: '100%',
    ...shorthands.padding(tokens.spacingHorizontalXXL, tokens.spacingVerticalXXL),
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    boxShadow: tokens.shadow16,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    textAlign: 'center'
  },
  icon: {
    fontSize: '40px',
    color: tokens.colorNeutralForeground3
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    justifyContent: 'center'
  },
  muted: {
    color: tokens.colorNeutralForeground3
  }
});

export interface ISubscriptionConnectivityErrorProps {
  onOpenSubscriptionSettings?: () => void;
}

export const SubscriptionConnectivityError: React.FC<ISubscriptionConnectivityErrorProps> = ({
  onOpenSubscriptionSettings
}) => {
  const styles = useStyles();
  const { loading, error, refresh } = useSubscription();
  const [retrying, setRetrying] = React.useState(false);

  const handleRetry = async (): Promise<void> => {
    setRetrying(true);
    try {
      await refresh();
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.root}>
        <Spinner size="large" label="Checking subscription…" />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <PlugDisconnectedRegular className={styles.icon} aria-hidden />
        <Title3 as="h2">Can&rsquo;t reach the subscription service</Title3>
        <Text className={styles.muted}>
          {DEFAULT_APP_TITLE} could not verify your subscription because the licensing service is
          currently unreachable. This is usually a temporary network, firewall, or proxy issue —
          not a problem with your subscription.
        </Text>
        <Text size={200} className={styles.muted}>
          Your SharePoint data is unaffected. Please try again in a few moments, or ask your IT
          administrator to allow access to the subscription service.
        </Text>
        {error ? (
          <Text size={200} style={{ color: tokens.colorPaletteRedForeground1 }}>
            {error}
          </Text>
        ) : null}
        <div className={styles.actions}>
          <Button
            appearance="primary"
            size="large"
            icon={<ArrowSyncRegular />}
            disabled={retrying}
            onClick={() => void handleRetry()}
          >
            {retrying ? 'Retrying…' : 'Try again'}
          </Button>
          {onOpenSubscriptionSettings ? (
            <Button
              appearance="subtle"
              icon={<SettingsRegular />}
              onClick={onOpenSubscriptionSettings}
            >
              Subscription details
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
};
