import * as React from 'react';
import { mergeClasses } from '@fluentui/react-components';
import { AppMessageBar } from './AppMessageBar';
import { useAppMessageBarStyles } from './appMessageBarStyles';

export interface IPageNotificationsProps {
  error?: string;
  success?: string;
  info?: string;
  warning?: string;
  className?: string;
}

export const PageNotifications: React.FC<IPageNotificationsProps> = ({
  error,
  success,
  info,
  warning,
  className
}) => {
  const styles = useAppMessageBarStyles();

  if (!error && !success && !info && !warning) {
    return null;
  }

  return (
    <div className={mergeClasses(styles.stack, className)}>
      {error ? <AppMessageBar intent="error">{error}</AppMessageBar> : null}
      {warning ? <AppMessageBar intent="warning">{warning}</AppMessageBar> : null}
      {info ? <AppMessageBar intent="info">{info}</AppMessageBar> : null}
      {success ? <AppMessageBar intent="success">{success}</AppMessageBar> : null}
    </div>
  );
};
