import * as React from 'react';
import {
  Badge,
  Button,
  Card,
  MessageBar,
  MessageBarBody,
  Spinner,
  Text,
  Title3,
  makeStyles,
  shorthands,
  tokens
} from '@fluentui/react-components';
import {
  ArrowSyncRegular,
  OpenRegular,
  PaymentRegular
} from '@fluentui/react-icons';
import { DEFAULT_APP_TITLE } from '../../constants/spfxComponents';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { SettingsPageHeader } from './SettingsPageHeader';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL
  },
  card: {
    ...shorthands.padding(tokens.spacingHorizontalL, tokens.spacingVerticalL),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: tokens.spacingHorizontalM
  },
  statBlock: {
    ...shorthands.padding(tokens.spacingHorizontalM, tokens.spacingVerticalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2
  },
  statLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    marginBottom: tokens.spacingVerticalXXS
  },
  statValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM
  },
  featureList: {
    margin: 0,
    paddingLeft: tokens.spacingHorizontalL,
    color: tokens.colorNeutralForeground2
  }
});

function statusBadgeAppearance(
  status?: string
): 'filled' | 'ghost' | 'outline' | 'tint' {
  if (status === 'active') {
    return 'filled';
  }
  if (status === 'trialing') {
    return 'tint';
  }
  if (status === 'past_due' || status === 'expired') {
    return 'outline';
  }
  return 'ghost';
}

function formatDate(value?: string): string {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function statusLabel(status?: string): string {
  switch (status) {
    case 'trialing':
      return 'Free trial';
    case 'active':
      return 'Active subscription';
    case 'past_due':
      return 'Payment past due';
    case 'expired':
      return 'Trial expired';
    case 'canceled':
      return 'Canceled';
    default:
      return 'Unknown';
  }
}

export const SubscriptionSettingsTab: React.FC = () => {
  const styles = useStyles();
  const {
    configured,
    loading,
    error,
    status,
    hasAccess,
    spfxContext,
    refresh,
    startCheckout,
    openBillingPortal,
    getHostedSubscribeUrl
  } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);
  const [portalLoading, setPortalLoading] = React.useState(false);
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

  const handlePortal = async (): Promise<void> => {
    setActionError('');
    setPortalLoading(true);
    try {
      await openBillingPortal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to open billing portal.');
      setPortalLoading(false);
    }
  };

  if (!configured) {
    return (
      <div className={styles.root}>
        <SettingsPageHeader
          title="Subscription"
          description="Manage your 14-day free trial and yearly subscription."
          icon={PaymentRegular}
        />
        <MessageBar intent="info">
          <MessageBarBody>
            Subscription checking is not configured for this web part. Ask your administrator to
            set the <strong>Subscription API URL</strong> in the web part properties.
          </MessageBarBody>
        </MessageBar>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <SettingsPageHeader
        title="Subscription"
        description="Manage your 14-day free trial and yearly subscription for this SharePoint site."
        icon={PaymentRegular}
      />

      {actionError ? (
        <MessageBar intent="error">
          <MessageBarBody>{actionError}</MessageBarBody>
        </MessageBar>
      ) : null}

      {error ? (
        <MessageBar intent="warning">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      ) : null}

      <Card className={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Title3 as="h3">{DEFAULT_APP_TITLE}</Title3>
          {loading ? (
            <Spinner size="tiny" label="Loading…" />
          ) : (
            <Badge appearance={statusBadgeAppearance(status?.status)} color="informative">
              {statusLabel(status?.status)}
            </Badge>
          )}
        </div>

        {!loading && status ? (
          <>
            <div className={styles.statGrid}>
              <div className={styles.statBlock}>
                <div className={styles.statLabel}>Access</div>
                <div className={styles.statValue}>{hasAccess ? 'Granted' : 'Blocked'}</div>
              </div>
              <div className={styles.statBlock}>
                <div className={styles.statLabel}>Trial days remaining</div>
                <div className={styles.statValue}>{status.trialDaysRemaining}</div>
              </div>
              <div className={styles.statBlock}>
                <div className={styles.statLabel}>Trial length</div>
                <div className={styles.statValue}>{status.trialDaysTotal} days</div>
              </div>
              <div className={styles.statBlock}>
                <div className={styles.statLabel}>Trial ends</div>
                <div className={styles.statValue}>{formatDate(status.trialEndsAt)}</div>
              </div>
              {status.currentPeriodEnd ? (
                <div className={styles.statBlock}>
                  <div className={styles.statLabel}>Subscription renews</div>
                  <div className={styles.statValue}>{formatDate(status.currentPeriodEnd)}</div>
                </div>
              ) : null}
            </div>

            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Tenant ID: {spfxContext.tenantId || '—'}
              {status.customerEmail ? ` · Contact: ${status.customerEmail}` : ''}
            </Text>
          </>
        ) : null}

        <div className={styles.actions}>
          <Button appearance="secondary" icon={<ArrowSyncRegular />} onClick={() => void refresh()}>
            Refresh status
          </Button>

          {status?.status === 'trialing' || status?.status === 'expired' ? (
            <Button
              appearance="primary"
              icon={<PaymentRegular />}
              disabled={checkoutLoading}
              onClick={() => void handleCheckout()}
            >
              {checkoutLoading ? 'Redirecting…' : 'Subscribe — yearly plan'}
            </Button>
          ) : null}

          {status?.status === 'active' || status?.status === 'past_due' ? (
            <Button
              appearance="primary"
              icon={<PaymentRegular />}
              disabled={portalLoading}
              onClick={() => void handlePortal()}
            >
              {portalLoading ? 'Opening…' : 'Manage billing'}
            </Button>
          ) : null}

          <Button
            appearance="subtle"
            icon={<OpenRegular />}
            as="a"
            href={getHostedSubscribeUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open subscription portal
          </Button>
        </div>
      </Card>

      <Card className={styles.card}>
        <Title3 as="h3">Yearly subscription</Title3>
        <Text>
          One subscription covers all users on this SharePoint site. After the{' '}
          {status?.trialDaysTotal ?? 14}-day free trial, subscribe to continue using risk and
          compliance features without interruption.
        </Text>
        <ul className={styles.featureList}>
          <li>14-day free trial starts automatically on first use</li>
          <li>Secure checkout powered by Stripe</li>
          <li>Remaining trial days apply when you subscribe during the trial</li>
          <li>Manage payment methods and invoices from the billing portal</li>
        </ul>
        {status?.status === 'trialing' ? (
          <MessageBar intent="info">
            <MessageBarBody>
              {status.trialDaysRemaining} day{status.trialDaysRemaining === 1 ? '' : 's'} left —
              subscribe anytime before the trial ends.
            </MessageBarBody>
          </MessageBar>
        ) : null}
      </Card>
    </div>
  );
};
