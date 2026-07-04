import * as React from 'react';
import {
  Button,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { ArrowSyncRegular, DismissRegular, PaymentRegular, SettingsRegular } from '@fluentui/react-icons';
import { DEFAULT_APP_TITLE } from '../../constants/spfxComponents';
import { useSubscription } from '../../contexts/SubscriptionContext';
import {
  dismissTrialBanner,
  isTrialBannerDismissed
} from '../../utils/subscriptionTrialBannerStorage';

const useStyles = makeStyles({
  root: {
    marginBottom: tokens.spacingVerticalL,
    width: '100%'
  }
});

export interface ISubscriptionTrialBannerProps {
  isAppAdministrator?: boolean;
  onOpenSubscriptionSettings?: () => void;
}

function formatPeriodEnd(value?: string): string {
  if (!value) {
    return '';
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

export const SubscriptionTrialBanner: React.FC<ISubscriptionTrialBannerProps> = ({
  isAppAdministrator = false,
  onOpenSubscriptionSettings
}) => {
  const styles = useStyles();
  const { configured, loading, error, status, refresh, startCheckout, openBillingPortal, spfxContext } =
    useSubscription();
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);
  const [portalLoading, setPortalLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState('');
  const [trialBannerDismissed, setTrialBannerDismissed] = React.useState(false);

  React.useEffect(() => {
    if (status?.status !== 'trialing') {
      setTrialBannerDismissed(false);
      return;
    }

    setTrialBannerDismissed(
      isTrialBannerDismissed(spfxContext.siteUrl, status.trialEndsAt)
    );
  }, [spfxContext.siteUrl, status?.status, status?.trialEndsAt]);

  const handleDismissTrialBanner = (): void => {
    if (!status || status.status !== 'trialing') {
      return;
    }

    dismissTrialBanner(spfxContext.siteUrl, status.trialEndsAt);
    setTrialBannerDismissed(true);
  };

  if (!configured || loading || !status) {
    return null;
  }

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

  if (status.status === 'active') {
    return (
      <div className={`${styles.root} asset-mgmt-no-print`}>
        {error ? (
          <MessageBar intent="warning" layout="multiline">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        ) : null}
        <MessageBar intent="success" layout="multiline">
          <MessageBarBody>
            <MessageBarTitle>Yearly subscription active</MessageBarTitle>
            {status.currentPeriodEnd
              ? `Your subscription renews on ${formatPeriodEnd(status.currentPeriodEnd)}.`
              : `Thank you for subscribing to ${DEFAULT_APP_TITLE}.`}
          </MessageBarBody>
          <MessageBarActions>
            <Button
              appearance="secondary"
              size="small"
              icon={<PaymentRegular />}
              disabled={portalLoading}
              onClick={() => void handlePortal()}
            >
              {portalLoading ? 'Opening…' : 'Manage billing'}
            </Button>
            {onOpenSubscriptionSettings ? (
              <Button
                appearance="subtle"
                size="small"
                icon={<SettingsRegular />}
                onClick={onOpenSubscriptionSettings}
              >
                Subscription
              </Button>
            ) : null}
          </MessageBarActions>
        </MessageBar>
      </div>
    );
  }

  if (status.status === 'past_due') {
    return (
      <div className={`${styles.root} asset-mgmt-no-print`}>
        {actionError ? (
          <MessageBar intent="error" layout="multiline" style={{ marginBottom: tokens.spacingVerticalM }}>
            <MessageBarBody>{actionError}</MessageBarBody>
          </MessageBar>
        ) : null}
        <MessageBar intent="warning" layout="multiline">
          <MessageBarBody>
            <MessageBarTitle>Payment issue</MessageBarTitle>
            We could not process your latest subscription payment. Update your billing details to
            avoid losing access.
          </MessageBarBody>
          <MessageBarActions>
            <Button
              appearance="primary"
              size="small"
              icon={<PaymentRegular />}
              disabled={portalLoading}
              onClick={() => void handlePortal()}
            >
              {portalLoading ? 'Opening…' : 'Update payment'}
            </Button>
            <Button appearance="subtle" size="small" icon={<ArrowSyncRegular />} onClick={() => void refresh()}>
              Refresh
            </Button>
          </MessageBarActions>
        </MessageBar>
      </div>
    );
  }

  if (status.status === 'trialing') {
    if (trialBannerDismissed) {
      return null;
    }

    const days = status.trialDaysRemaining;
    const dayLabel = days === 1 ? 'day' : 'days';

    return (
      <div className={`${styles.root} asset-mgmt-no-print`}>
        {actionError ? (
          <MessageBar intent="error" layout="multiline" style={{ marginBottom: tokens.spacingVerticalM }}>
            <MessageBarBody>{actionError}</MessageBarBody>
          </MessageBar>
        ) : null}
        {error ? (
          <MessageBar intent="warning" layout="multiline" style={{ marginBottom: tokens.spacingVerticalM }}>
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        ) : null}
        <MessageBar intent="info" layout="multiline">
          <MessageBarBody>
            <MessageBarTitle>Free trial — {days} {dayLabel} remaining</MessageBarTitle>
            You have {days} {dayLabel} left in your {status.trialDaysTotal}-day trial.
            {status.trialEndsAt
              ? ` Trial ends ${formatPeriodEnd(status.trialEndsAt)}.`
              : ''}{' '}
            Subscribe for a yearly plan to keep using {DEFAULT_APP_TITLE} after the trial.
            {!isAppAdministrator ? ' Ask an app administrator to subscribe or view the plan.' : ''}
          </MessageBarBody>
          {isAppAdministrator ? (
            <MessageBarActions>
              <Button
                appearance="primary"
                size="small"
                icon={<PaymentRegular />}
                disabled={checkoutLoading}
                onClick={() => void handleCheckout()}
              >
                {checkoutLoading ? 'Redirecting…' : 'Subscribe yearly'}
              </Button>
              {onOpenSubscriptionSettings ? (
                <Button
                  appearance="secondary"
                  size="small"
                  icon={<SettingsRegular />}
                  onClick={onOpenSubscriptionSettings}
                >
                  View plan
                </Button>
              ) : null}
              <Button
                appearance="subtle"
                size="small"
                icon={<DismissRegular />}
                aria-label="Dismiss trial notice"
                onClick={handleDismissTrialBanner}
              />
            </MessageBarActions>
          ) : (
            <MessageBarActions>
              <Button
                appearance="subtle"
                size="small"
                icon={<DismissRegular />}
                aria-label="Dismiss trial notice"
                onClick={handleDismissTrialBanner}
              />
            </MessageBarActions>
          )}
        </MessageBar>
      </div>
    );
  }

  return null;
};
