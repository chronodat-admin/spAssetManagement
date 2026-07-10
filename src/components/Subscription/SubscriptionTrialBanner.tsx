import * as React from 'react';
import { Button, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowSyncRegular, DismissRegular, PaymentRegular, SettingsRegular } from '@fluentui/react-icons';
import { DEFAULT_APP_TITLE } from '../../constants/spfxComponents';
import { useSubscription } from '../../contexts/SubscriptionContext';
import {
  dismissTrialBanner,
  isTrialBannerDismissed
} from '../../utils/subscriptionTrialBannerStorage';
import { AppMessageBar } from '../Layout/AppMessageBar';
import { PageNotifications } from '../Layout/PageNotifications';
import { useTranslation } from '../../i18n/LocaleContext';
import { formatMessage } from '../../i18n/formatMessage';

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
  const { t } = useTranslation();
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
      setActionError(err instanceof Error ? err.message : t('subscription', 'checkoutFailed'));
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async (): Promise<void> => {
    setActionError('');
    setPortalLoading(true);
    try {
      await openBillingPortal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('subscription', 'billingPortalFailed'));
      setPortalLoading(false);
    }
  };

  if (status.status === 'active') {
    return (
      <div className={`${styles.root} asset-mgmt-no-print`}>
        <PageNotifications warning={error || undefined} />
        <AppMessageBar
          intent="success"
          title={t('subscription', 'yearlyActive')}
          actions={
            <>
              <Button
                appearance="secondary"
                size="small"
                icon={<PaymentRegular />}
                disabled={portalLoading}
                onClick={() => void handlePortal()}
              >
                {portalLoading ? t('subscription', 'opening') : t('subscription', 'manageBilling')}
              </Button>
              {onOpenSubscriptionSettings ? (
                <Button
                  appearance="secondary"
                  size="small"
                  icon={<SettingsRegular />}
                  onClick={onOpenSubscriptionSettings}
                >
                  {t('subscription', 'subscription')}
                </Button>
              ) : null}
            </>
          }
        >
          {status.currentPeriodEnd
            ? formatMessage(t('subscription', 'subscriptionRenewsOn'), {
                date: formatPeriodEnd(status.currentPeriodEnd)
              })
            : formatMessage(t('subscription', 'subscriptionThanksApp'), { appName: DEFAULT_APP_TITLE })}
        </AppMessageBar>
      </div>
    );
  }

  if (status.status === 'past_due') {
    return (
      <div className={`${styles.root} asset-mgmt-no-print`}>
        <PageNotifications error={actionError || undefined} />
        <AppMessageBar
          intent="warning"
          title={t('subscription', 'paymentIssue')}
          actions={
            <>
              <Button
                appearance="primary"
                size="small"
                icon={<PaymentRegular />}
                disabled={portalLoading}
                onClick={() => void handlePortal()}
              >
                {portalLoading ? t('subscription', 'opening') : t('subscription', 'updatePayment')}
              </Button>
              <Button appearance="subtle" size="small" icon={<ArrowSyncRegular />} onClick={() => void refresh()}>
                {t('subscription', 'refresh')}
              </Button>
            </>
          }
        >
          {t('subscription', 'paymentPastDueBody')}
        </AppMessageBar>
      </div>
    );
  }

  if (status.status === 'trialing') {
    if (trialBannerDismissed) {
      return null;
    }

    const days = status.trialDaysRemaining;
    const dayLabel = days === 1 ? t('subscription', 'day') : t('subscription', 'days');

    return (
      <div className={`${styles.root} asset-mgmt-no-print`}>
        <PageNotifications error={actionError || undefined} warning={error || undefined} />
        <AppMessageBar
          intent="info"
          title={formatMessage(t('subscription', 'freeTrialDays'), { days })}
          actions={
            isAppAdministrator ? (
              <>
                <Button
                  appearance="primary"
                  size="small"
                  icon={<PaymentRegular />}
                  disabled={checkoutLoading}
                  onClick={() => void handleCheckout()}
                >
                  {checkoutLoading ? t('subscription', 'redirecting') : t('subscription', 'subscribeYearly')}
                </Button>
                {onOpenSubscriptionSettings ? (
                  <Button
                    appearance="secondary"
                    size="small"
                    icon={<SettingsRegular />}
                    onClick={onOpenSubscriptionSettings}
                  >
                    {t('subscription', 'viewPlan')}
                  </Button>
                ) : null}
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<DismissRegular />}
                  aria-label={t('subscription', 'dismissTrial')}
                  onClick={handleDismissTrialBanner}
                />
              </>
            ) : (
              <Button
                appearance="subtle"
                size="small"
                icon={<DismissRegular />}
                aria-label={t('subscription', 'dismissTrial')}
                onClick={handleDismissTrialBanner}
              />
            )
          }
        >
          {formatMessage(t('subscription', 'trialRemaining'), {
            days,
            dayLabel,
            totalDays: status.trialDaysTotal
          })}
          {status.trialEndsAt
            ? formatMessage(t('subscription', 'trialEndsOn'), { date: formatPeriodEnd(status.trialEndsAt) })
            : ''}
          {formatMessage(t('subscription', 'trialSubscribeAfter'), { appName: DEFAULT_APP_TITLE })}
          {!isAppAdministrator ? t('subscription', 'trialNonAdminSuffix') : ''}
        </AppMessageBar>
      </div>
    );
  }

  return null;
};
