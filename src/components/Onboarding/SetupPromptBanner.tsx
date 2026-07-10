import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { IProvisioningStatus } from '../../models/IAssetApp';
import { SetupContextNotifications } from './SetupContextNotifications';

export { SetupContextNotifications };

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
      <SetupContextNotifications
        isTeamsHost={isTeamsHost}
        isSiteOwner={isSiteOwner}
        isAppAdministrator={isAppAdministrator}
        ownerAccessMessage={ownerAccessMessage}
        onCompleteSetup={onCompleteSetup}
        onOpenSettings={onOpenSettings}
      />
    </div>
  );
};
