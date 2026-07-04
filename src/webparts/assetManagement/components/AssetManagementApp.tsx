import * as React from 'react';
import { WebPartErrorBoundary } from '../../../components/WebPartErrorBoundary';
import { SubscriptionProvider } from '../../../contexts/SubscriptionContext';
import { AssetManagement } from './AssetManagement';
import { IAssetManagementProps } from './IAssetManagementProps';

export const AssetManagementApp: React.FC<IAssetManagementProps> = (props) => (
  <WebPartErrorBoundary>
    <SubscriptionProvider
      context={props.context}
      subscriptionApiUrl={props.subscriptionApiUrl}
      skipSubscriptionCheck={props.skipSubscriptionCheck}
    >
      <AssetManagement {...props} />
    </SubscriptionProvider>
  </WebPartErrorBoundary>
);
