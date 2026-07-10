import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { DEFAULT_APP_TITLE } from '../../constants/spfxComponents';
import { AppMessageBar } from '../Layout/AppMessageBar';

const useStyles = makeStyles({
  root: {
    marginBottom: tokens.spacingVerticalM
  }
});

export interface IDedicatedSubsiteWarningProps {
  className?: string;
  isTeamsHost?: boolean;
}

export const DedicatedSubsiteWarning: React.FC<IDedicatedSubsiteWarningProps> = ({
  className,
  isTeamsHost = false
}) => {
  const styles = useStyles();

  if (isTeamsHost) {
    return (
      <AppMessageBar intent="info" title="Microsoft Teams tab" className={className || styles.root}>
        This tab reads and writes data in the backing SharePoint site for this team. Complete setup on
        that site (lists are created in the current web) before using {DEFAULT_APP_TITLE} in Teams. Native
        SharePoint list forms are not available inside Teams.
      </AppMessageBar>
    );
  }

  return (
    <AppMessageBar intent="warning" title="Use a dedicated workspace" className={className || styles.root}>
      Run setup on its own SharePoint subsite (for example, <strong>/sites/YourSite/AssetManagement</strong>)
      so the app&apos;s data stays separate from other team or communication site content.
    </AppMessageBar>
  );
};
