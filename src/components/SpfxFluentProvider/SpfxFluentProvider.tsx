import { FluentProvider, IdPrefixProvider, type Theme } from '@fluentui/react-components';
import * as React from 'react';
import { patchTabsterInstance, TabsterGuard } from '../../utils/patchTabster';

export interface SpfxFluentProviderProps {
  theme: Theme;
  className?: string;
  style?: React.CSSProperties;
  providerId?: string;
  portal?: boolean;
  children: React.ReactNode;
}

/** SPFx-safe Fluent root — matches People Hub pattern. */
export const SpfxFluentProvider: React.FC<SpfxFluentProviderProps> = ({
  theme,
  className,
  style,
  providerId = 'asset-mgmt-default',
  portal = false,
  children
}) => {
  patchTabsterInstance();

  const idPrefix = `${providerId}-`;

  const rootStyle: React.CSSProperties = portal
    ? { boxSizing: 'border-box', ...style }
    : {
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: '0 0 auto',
        height: 'auto',
        minHeight: 0,
        boxSizing: 'border-box',
        ...style
      };

  return (
    <TabsterGuard>
      <IdPrefixProvider value={idPrefix}>
        <FluentProvider
          id={providerId}
          theme={theme}
          className={className}
          style={rootStyle}
          targetDocument={typeof document !== 'undefined' ? document : undefined}
          applyStylesToPortals={true}
        >
          {children}
        </FluentProvider>
      </IdPrefixProvider>
    </TabsterGuard>
  );
};
