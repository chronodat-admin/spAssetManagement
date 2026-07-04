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
import { PlayRegular, SettingsRegular } from '@fluentui/react-icons';
import { IProvisioningStatus } from '../../models/IAssetApp';
import { getProvisioningListDisplayLabel } from '../../utils/provisioningListLabels';
import { SITE_OWNER_REQUIRED_MESSAGE } from '../../utils/sitePermissions';
import { DedicatedSubsiteWarning } from './DedicatedSubsiteWarning';

const useStyles = makeStyles({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalL,
    width: '100%'
  }
});

export interface ISetupPromptBannerProps {
  status: IProvisioningStatus;
  isSiteOwner: boolean;
  isAppAdministrator?: boolean;
  isTeamsHost?: boolean;
  ownerAccessMessage?: string;
  onCompleteSetup: () => void;
  onOpenSettings: () => void;
}

export const SetupPromptBanner: React.FC<ISetupPromptBannerProps> = ({
  status,
  isSiteOwner,
  isAppAdministrator = false,
  isTeamsHost = false,
  ownerAccessMessage,
  onCompleteSetup,
  onOpenSettings
}) => {
  const styles = useStyles();

  if (status.isComplete) {
    return null;
  }

  return (
    <div className={styles.stack}>
      <DedicatedSubsiteWarning isTeamsHost={isTeamsHost} />
      <MessageBar intent="warning" layout="multiline">
        <MessageBarBody>
          <MessageBarTitle>Setup required</MessageBarTitle>
          {status.missingCount} list{status.missingCount === 1 ? '' : 's'} still need setup (
          {status.missingLists.map(getProvisioningListDisplayLabel).join(', ')}). Complete onboarding to create or repair lists and seed
          default data.
          {!isSiteOwner && !isAppAdministrator ? (
            <>
              {' '}
              {ownerAccessMessage || SITE_OWNER_REQUIRED_MESSAGE}
            </>
          ) : null}
        </MessageBarBody>
        {isSiteOwner || isAppAdministrator ? (
          <MessageBarActions>
            {isSiteOwner ? (
              <Button appearance="primary" size="small" icon={<PlayRegular />} onClick={onCompleteSetup}>
                Complete Setup
              </Button>
            ) : null}
            {isAppAdministrator ? (
              <Button appearance="secondary" size="small" icon={<SettingsRegular />} onClick={onOpenSettings}>
                View in Settings
              </Button>
            ) : null}
          </MessageBarActions>
        ) : null}
      </MessageBar>
    </div>
  );
};
