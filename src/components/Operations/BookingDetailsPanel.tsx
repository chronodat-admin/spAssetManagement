import * as React from 'react';
import {
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text
} from '@fluentui/react-components';
import { CalendarRegular, DismissRegular } from '@fluentui/react-icons';
import { ContentCard } from '../Layout/ContentCard';
import { EmptyState } from '../Layout/EmptyState';
import { UserCell } from '../PeoplePicker/UserAvatar';
import { IAssignment } from '../../models/IAssetApp';
import { AssignmentService } from '../../services/AssignmentService';
import { DATA_TABLE_CLASS } from '../../lib/list-view/columnWidths';
import { useTranslation } from '../../i18n/LocaleContext';
import { PageNotifications } from '../Layout/PageNotifications';


export interface IBookingDetailsPanelProps {
  assignmentService: AssignmentService;
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

export const BookingDetailsPanel: React.FC<IBookingDetailsPanelProps> = ({ assignmentService }) => {
  const { t } = useTranslation();
  const [rows, setRows] = React.useState<IAssignment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [cancellingId, setCancellingId] = React.useState<number | undefined>();

  const load = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      setRows(await assignmentService.getAssignments());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [assignmentService]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleCancel = async (row: IAssignment): Promise<void> => {
    if (row.AM_Action !== 'Book') return;
    setCancellingId(row.Id);
    try {
      await assignmentService.cancelBook({ assignmentId: row.Id });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed.');
    } finally {
      setCancellingId(undefined);
    }
  };

  return (
    <ContentCard flushBody>
      <PageNotifications error={error || undefined} />
      {loading ? (
        <Spinner label="Loading assignments..." />
      ) : rows.length === 0 ? (
        <EmptyState
          bordered
          inset
          fullWidth
          icon={<CalendarRegular />}
          title={t('bookings', 'emptyTitle', 'No bookings yet')}
          description={t(
            'bookings',
            'emptyDescription',
            'When assets are assigned or booked, their history will appear here.'
          )}
        />
      ) : (
        <div className={DATA_TABLE_CLASS}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Action</TableHeaderCell>
                <TableHeaderCell>Asset</TableHeaderCell>
                <TableHeaderCell>User</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Expected return</TableHeaderCell>
                <TableHeaderCell>Notes</TableHeaderCell>
                <TableHeaderCell />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.Id}>
                  <TableCell>{row.AM_Action || '—'}</TableCell>
                  <TableCell>{row.AM_Asset?.Title || '—'}</TableCell>
                  <TableCell>
                    <UserCell
                      name={row.AM_AssignedTo?.Title}
                      email={row.AM_AssignedTo?.Email}
                    />
                  </TableCell>
                  <TableCell>{formatDate(row.AM_AssignmentDate)}</TableCell>
                  <TableCell>{formatDate(row.AM_ExpectedReturnDate)}</TableCell>
                  <TableCell>
                    <Text>{row.AM_Notes || '—'}</Text>
                  </TableCell>
                  <TableCell>
                    {row.AM_Action === 'Book' ? (
                      <Button
                        appearance="subtle"
                        icon={<DismissRegular />}
                        disabled={cancellingId === row.Id}
                        onClick={() => void handleCancel(row)}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </ContentCard>
  );
};
