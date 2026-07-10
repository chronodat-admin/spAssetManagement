import * as React from 'react';

import {

  Button,

  Spinner,

  Text

} from '@fluentui/react-components';

import { ArrowSyncRegular } from '@fluentui/react-icons';

import type { AadHttpClientFactory } from '@microsoft/sp-http';

import { PageNotifications } from '../Layout/PageNotifications';

import { IntuneGraphService } from '../../services/IntuneGraphService';

import { IntuneSyncService } from '../../services/IntuneSyncService';

import { SettingsPageHeader } from './SettingsPageHeader';

import { useTranslation } from '../../i18n/LocaleContext';



export interface IIntuneSyncTabProps {

  aadHttpClientFactory: AadHttpClientFactory;

  intuneSyncService: IntuneSyncService;

  pageTitle: string;

  pageDescription?: string;

  pageIcon?: React.ElementType;

}



export const IntuneSyncTab: React.FC<IIntuneSyncTabProps> = ({

  aadHttpClientFactory,

  intuneSyncService,

  pageTitle,

  pageDescription,

  pageIcon

}) => {

  const { t } = useTranslation();

  const [syncing, setSyncing] = React.useState(false);

  const [error, setError] = React.useState('');

  const [result, setResult] = React.useState('');



  const handleSync = async (): Promise<void> => {

    setSyncing(true);

    setError('');

    setResult('');

    try {

      const graphService = new IntuneGraphService(aadHttpClientFactory);

      const devices = await graphService.fetchManagedDevices();

      const summary = await intuneSyncService.syncManagedDevices(devices);

      setResult(

        `${devices.length} ${t('settings', 'devicesFound', 'devices found')}; ` +

          `${summary.created} ${t('settings', 'created', 'created')}, ` +

          `${summary.updated} ${t('settings', 'updated', 'updated')}, ` +

          `${summary.skipped} ${t('settings', 'skipped', 'skipped')}`

      );

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Intune sync failed.');

    } finally {

      setSyncing(false);

    }

  };



  return (

    <>

      <SettingsPageHeader title={pageTitle} description={pageDescription} icon={pageIcon} />

      <Text>{t('settings', 'intuneSyncDescription', 'Import managed devices from Microsoft Intune into the asset register.')}</Text>

      <PageNotifications error={error || undefined} success={result || undefined} />

      <Button

        appearance="primary"

        icon={syncing ? undefined : <ArrowSyncRegular />}

        disabled={syncing}

        onClick={() => void handleSync()}

        style={{ marginTop: 12 }}

      >

        {syncing ? <Spinner size="tiny" /> : t('settings', 'syncNow', 'Sync now')}

      </Button>

    </>

  );

};


