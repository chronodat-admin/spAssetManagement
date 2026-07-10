import * as React from 'react';
import { Button, makeStyles, tokens } from '@fluentui/react-components';
import { PlayRegular, SettingsRegular } from '@fluentui/react-icons';
import { SITE_OWNER_REQUIRED_MESSAGE } from '../../utils/sitePermissions';
import { AppMessageBar } from '../Layout/AppMessageBar';
import { DedicatedSubsiteWarning } from './DedicatedSubsiteWarning';

const useStyles = makeStyles({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    width: '100%'
  }
});

export interface ISetupContextNotificationsProps {
  isTeamsHost?: boolean;
  isSiteOwner?: boolean;
  isAppAdministrator?: boolean;
  ownerAccessMessage?: string;
  showSetupRequired?: boolean;
  showSetupActions?: boolean;
  onCompleteSetup?: () => void;
  onOpenSettings?: () => void;
}

export const SetupContextNotifications: React.FC<ISetupContextNotificationsProps> = ({
  isTeamsHost = false,
  isSiteOwner = false,
  isAppAdministrator = false,
  ownerAccessMessage,
  showSetupRequired = true,
  showSetupActions = true,
  onCompleteSetup,
  onOpenSettings
}) => {
  const styles = useStyles();

  return (
    <div className={styles.stack}>
      <DedicatedSubsiteWarning isTeamsHost={isTeamsHost} />
      {showSetupRequired ? (
        <AppMessageBar
          intent="warning"
          title="Setup required"
          actions={
            showSetupActions && (isSiteOwner || isAppAdministrator) ? (
              <>
                {isSiteOwner && onCompleteSetup ? (
                  <Button appearance="primary" size="small" icon={<PlayRegular />} onClick={onCompleteSetup}>
                    Complete Setup
                  </Button>
                ) : null}
                {isAppAdministrator && onOpenSettings ? (
                  <Button appearance="secondary" size="small" icon={<SettingsRegular />} onClick={onOpenSettings}>
                    View in Settings
                  </Button>
                ) : null}
              </>
            ) : undefined
          }
        >
          Setup is not complete yet. Run setup to prepare your workspace and load default data.
          {!isSiteOwner && !isAppAdministrator ? (
            <> {ownerAccessMessage || SITE_OWNER_REQUIRED_MESSAGE}</>
          ) : null}
        </AppMessageBar>
      ) : null}
    </div>
  );
};
