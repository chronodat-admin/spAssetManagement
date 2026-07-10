import * as React from 'react';
import {
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow
} from '@fluentui/react-components';
import { DocumentBulletListRegular } from '@fluentui/react-icons';
import { ContentCard } from '../Layout/ContentCard';
import { EmptyState } from '../Layout/EmptyState';
import type { IAssetRequest } from '../../models/IAsset';
import { AssetRequestService } from '../../services/AssetRequestService';
import { DATA_TABLE_CLASS } from '../../lib/list-view/columnWidths';
import { useTranslation } from '../../i18n/LocaleContext';
import { PageNotifications } from '../Layout/PageNotifications';


export interface IMyRequestsPageProps {
  requestService: AssetRequestService;
  currentUserId: number;
}

export const MyRequestsPage: React.FC<IMyRequestsPageProps> = ({
  requestService,
  currentUserId
}) => {
  const { t } = useTranslation();
  const [rows, setRows] = React.useState<IAssetRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      setRows(await requestService.getMyRequests(currentUserId));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, requestService]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <ContentCard>
      <PageNotifications error={error || undefined} />
      {loading ? (
        <Spinner label={t('common', 'loading', 'Loading…')} />
      ) : rows.length === 0 ? (
        <EmptyState
          bordered
          icon={<DocumentBulletListRegular />}
          title={t('requests', 'noRequests', 'No requests yet')}
          description={t(
            'requests',
            'noRequestsDescription',
            'Submitted asset requests will appear here for review and fulfillment.'
          )}
        />
      ) : (
        <div className={DATA_TABLE_CLASS}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Title</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>{t('common', 'status', 'Status')}</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Review notes</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.Id}>
                  <TableCell>{row.Title}</TableCell>
                  <TableCell>{row.AM_Category?.Title || '—'}</TableCell>
                  <TableCell>{row.AM_Status || '—'}</TableCell>
                  <TableCell>{row.AM_RequestDate || '—'}</TableCell>
                  <TableCell>{row.AM_ReviewNotes || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </ContentCard>
  );
};
