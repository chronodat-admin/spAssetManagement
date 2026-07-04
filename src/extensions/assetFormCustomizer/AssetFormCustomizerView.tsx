import * as React from 'react';
import { FluentProvider, webLightTheme, Text, Title3, Button, tokens } from '@fluentui/react-components';

export interface IAssetFormCustomizerViewProps {
  listTitle: string;
  itemId?: number;
  displayMode: 'New' | 'Edit' | 'Display';
}

export const AssetFormCustomizerView: React.FC<IAssetFormCustomizerViewProps> = ({
  listTitle,
  itemId,
  displayMode
}) => (
  <FluentProvider theme={webLightTheme}>
    <div style={{ padding: tokens.spacingHorizontalL, fontFamily: tokens.fontFamilyBase }}>
      <Title3>Asset Management</Title3>
      <Text block style={{ marginTop: tokens.spacingVerticalS }}>
        {listTitle}
        {itemId ? ` — item ${itemId}` : ''} ({displayMode})
      </Text>
      <Text block style={{ marginTop: tokens.spacingVerticalM, color: tokens.colorNeutralForeground3 }}>
        This native SharePoint form is replaced by the Asset Management experience. Open the Asset Management
        web part to create or edit assets with the full guided form, assignments, and audit trail.
      </Text>
      {typeof window !== 'undefined' ? (
        <Button
          appearance="primary"
          style={{ marginTop: tokens.spacingVerticalM }}
          onClick={() => {
            const siteUrl = window.location.href.split('/Lists/')[0];
            window.location.href = `${siteUrl}/SitePages/Asset-Management.aspx`;
          }}
        >
          Open Asset Management
        </Button>
      ) : null}
    </div>
  </FluentProvider>
);
