import * as React from 'react';
import {
  Button,
  Field,
  Option,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Textarea
} from '@fluentui/react-components';
import { ClipboardTaskListLtrRegular } from '@fluentui/react-icons';
import { ContentCard } from '../Layout/ContentCard';
import { EmptyState } from '../Layout/EmptyState';
import { UserCell } from '../PeoplePicker/UserAvatar';
import { useFormStyles } from '../Forms/formStyles';
import { AppDropdown } from '../Dropdown/AppDropdown';
import type { AssetRequestStatus, IAsset, IAssetRequest } from '../../models/IAsset';
import { AssetRequestService } from '../../services/AssetRequestService';
import { AssignmentService } from '../../services/AssignmentService';
import { DATA_TABLE_CLASS } from '../../lib/list-view/columnWidths';
import { useTranslation } from '../../i18n/LocaleContext';
import { buildAssetSelectOption } from '../../utils/assetSelectOptions';
import { PageNotifications } from '../Layout/PageNotifications';


export interface IManageRequestsPageProps {
  requestService: AssetRequestService;
  assignmentService: AssignmentService;
  assets: IAsset[];
  reviewerUserId: number;
  onChanged: () => void;
}

export const ManageRequestsPage: React.FC<IManageRequestsPageProps> = ({
  requestService,
  assignmentService,
  assets,
  reviewerUserId,
  onChanged
}) => {
  const styles = useFormStyles();
  const { t } = useTranslation();
  const [rows, setRows] = React.useState<IAssetRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [activeId, setActiveId] = React.useState<number | undefined>();
  const [reviewNotes, setReviewNotes] = React.useState('');
  const [fulfillAssetId, setFulfillAssetId] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      setRows(await requestService.getRequests());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, [requestService]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (id: number, status: AssetRequestStatus): Promise<void> => {
    setSaving(true);
    setError('');
    try {
      await requestService.updateRequest(id, {
        AM_Status: status,
        AM_ReviewedById: reviewerUserId,
        AM_ReviewNotes: reviewNotes.trim() || undefined,
        AM_FulfilledAssetId:
          status === 'Fulfilled' && fulfillAssetId ? Number(fulfillAssetId) : undefined
      });
      if (status === 'Fulfilled' && fulfillAssetId) {
        const request = rows.find((row) => row.Id === id);
        const requesterId = request?.AM_RequestedBy?.Id;
        if (requesterId) {
          await assignmentService.assignAsset({
            assetId: Number(fulfillAssetId),
            assigneeUserId: requesterId,
            notes: `Fulfilled request #${id}`
          });
        }
      }
      setActiveId(undefined);
      setReviewNotes('');
      setFulfillAssetId('');
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const availableAssets = assets.filter((asset) => {
    const status = typeof asset.AM_Status === 'string' ? asset.AM_Status : asset.AM_Status?.Title;
    return status === 'Available' && !asset.AM_IsDeleted;
  });

  return (
    <ContentCard>
      <PageNotifications error={error || undefined} />
      {loading ? (
        <Spinner label={t('common', 'loading', 'Loading…')} />
      ) : rows.length === 0 ? (
        <EmptyState
          bordered
          icon={<ClipboardTaskListLtrRegular />}
          title={t('requests', 'manageEmptyTitle', 'No pending requests')}
          description={t(
            'requests',
            'manageEmptyDescription',
            'When users submit asset requests, they will show up here for approval.'
          )}
        />
      ) : (
        <div className={DATA_TABLE_CLASS}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Title</TableHeaderCell>
                <TableHeaderCell>{t('requests', 'requestedBy', 'Requested by')}</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>{t('common', 'status', 'Status')}</TableHeaderCell>
                <TableHeaderCell>{t('common', 'actions', 'Actions')}</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.Id}>
                  <TableCell>{row.Title}</TableCell>
                  <TableCell>
                    <UserCell
                      name={row.AM_RequestedBy?.Title}
                      email={row.AM_RequestedBy?.Email}
                    />
                  </TableCell>
                  <TableCell>{row.AM_Category?.Title || '—'}</TableCell>
                  <TableCell>{row.AM_Status || '—'}</TableCell>
                  <TableCell>
                    {row.AM_Status === 'Pending' ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Button size="small" disabled={saving} onClick={() => setActiveId(row.Id)}>
                          {t('requests', 'reviewRequest', 'Review')}
                        </Button>
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {activeId ? (
        <div className={styles.grid} style={{ marginTop: 16 }}>
          <Field label={t('common', 'notes', 'Notes')} className={styles.fullWidth}>
            <Textarea value={reviewNotes} onChange={(_, d) => setReviewNotes(d.value)} rows={3} />
          </Field>
          <Field label="Fulfill with asset">
            <AppDropdown
              searchable
              searchPlaceholder={t('operations', 'searchAssets', 'Search assets…')}
              selectedOptions={fulfillAssetId ? [fulfillAssetId] : []}
              onOptionSelect={(_, data) => setFulfillAssetId(data.optionValue || '')}
              placeholder="Optional asset"
            >
              {availableAssets.map((asset) => {
                const option = buildAssetSelectOption(asset);
                return (
                  <Option key={asset.Id} value={option.value} text={option.searchText}>
                    {option.label}
                  </Option>
                );
              })}
            </AppDropdown>
          </Field>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button appearance="primary" disabled={saving} onClick={() => void updateStatus(activeId, 'Approved')}>
              {t('common', 'approve', 'Approve')}
            </Button>
            <Button appearance="secondary" disabled={saving} onClick={() => void updateStatus(activeId, 'Rejected')}>
              {t('common', 'reject', 'Reject')}
            </Button>
            <Button appearance="primary" disabled={saving || !fulfillAssetId} onClick={() => void updateStatus(activeId, 'Fulfilled')}>
              {t('common', 'fulfill', 'Fulfill')}
            </Button>
            <Button appearance="subtle" onClick={() => setActiveId(undefined)}>
              {t('common', 'cancel', 'Cancel')}
            </Button>
          </div>
        </div>
      ) : null}
    </ContentCard>
  );
};
