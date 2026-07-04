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
import { ArrowSyncRegular, PaymentRegular, SettingsRegular } from '@fluentui/react-icons';
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

export interface ISubscriptionPaywallProps {
  onOpenSubscriptionSettings?: () => void;
}

export const SubscriptionPaywall: React.FC<ISubscriptionPaywallProps> = ({
  onOpenSubscriptionSettings
}) => {
  const styles = useStyles();
  const { loading, error, status, refresh, startCheckout } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState('');

  const handleCheckout = async (): Promise<void> => {
    setActionError('');
    setCheckoutLoading(true);
    try {
      await startCheckout();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to start checkout.');
      setCheckoutLoading(false);
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
        <Title3 as="h2">Your free trial has ended</Title3>
        <Text className={styles.muted}>
          Your {status?.trialDaysTotal ?? 14}-day trial for {DEFAULT_APP_TITLE} has expired.
          Subscribe to the yearly plan to restore access for everyone in your Microsoft 365 tenant.
        </Text>
        {status?.trialEndsAt ? (
          <Text size={200} className={styles.muted}>
            Trial ended {new Date(status.trialEndsAt).toLocaleDateString()}.
          </Text>
        ) : null}
        {error ? <Text style={{ color: tokens.colorPaletteRedForeground1 }}>{error}</Text> : null}
        {actionError ? (
          <Text style={{ color: tokens.colorPaletteRedForeground1 }}>{actionError}</Text>
        ) : null}
        <div className={styles.actions}>
          <Button
            appearance="primary"
            size="large"
            icon={<PaymentRegular />}
            disabled={checkoutLoading}
            onClick={() => void handleCheckout()}
          >
            {checkoutLoading ? 'Redirecting to checkout…' : 'Subscribe — yearly plan'}
          </Button>
          <Button appearance="secondary" icon={<ArrowSyncRegular />} onClick={() => void refresh()}>
            Refresh status
          </Button>
          {onOpenSubscriptionSettings ? (
            <Button appearance="subtle" icon={<SettingsRegular />} onClick={onOpenSubscriptionSettings}>
              Subscription details
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
};
