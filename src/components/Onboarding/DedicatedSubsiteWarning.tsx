import * as React from 'react';
import {
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { DEFAULT_APP_TITLE } from '../../constants/spfxComponents';

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
      <MessageBar intent="info" layout="multiline" className={className || styles.root}>
        <MessageBarBody>
          <MessageBarTitle>Microsoft Teams tab</MessageBarTitle>
          This tab reads and writes data in the backing SharePoint site for this team. Complete
          setup on that site (lists are created in the current web) before using {DEFAULT_APP_TITLE} in
          Teams. Native SharePoint list forms are not available inside Teams.
        </MessageBarBody>
      </MessageBar>
    );
  }

  return (
    <MessageBar intent="warning" layout="multiline" className={className || styles.root}>
      <MessageBarBody>
        <MessageBarTitle>Use a dedicated subsite for list isolation</MessageBarTitle>
        Add this web part to its own SharePoint subsite (for example,{' '}
        <strong>/sites/YourSite/AssetManagement</strong>) before running setup. Setup creates SharePoint
        application lists in the current site; a dedicated subsite keeps those lists separate from
        team sites, communication sites, and other content.
      </MessageBarBody>
    </MessageBar>
  );
};
