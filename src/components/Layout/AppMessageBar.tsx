import * as React from 'react';
import {
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  mergeClasses,
  type MessageBarProps
} from '@fluentui/react-components';
import { useAppMessageBarStyles } from './appMessageBarStyles';

export interface IAppMessageBarProps {
  intent?: MessageBarProps['intent'];
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  icon?: MessageBarProps['icon'];
  className?: string;
  style?: React.CSSProperties;
}

export const AppMessageBar: React.FC<IAppMessageBarProps> = ({
  intent = 'info',
  title,
  children,
  actions,
  icon,
  className,
  style
}) => {
  const styles = useAppMessageBarStyles();

  return (
    <MessageBar
      intent={intent}
      layout="multiline"
      icon={icon}
      className={mergeClasses('asset-mgmt-message-bar', styles.root, className)}
      style={style}
    >
      <MessageBarBody>
        {title ? <MessageBarTitle>{title}</MessageBarTitle> : null}
        {children}
      </MessageBarBody>
      {actions ? <MessageBarActions>{actions}</MessageBarActions> : null}
    </MessageBar>
  );
};