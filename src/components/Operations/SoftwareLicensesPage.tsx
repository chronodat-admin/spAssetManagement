import * as React from 'react';
import {
  Button,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow
} from '@fluentui/react-components';
import { AddRegular, DeleteRegular } from '@fluentui/react-icons';
import { ContentCard } from '../Layout/ContentCard';
import { SoftwareLicenseService } from '../../services/SoftwareLicenseService';
import type { ISoftwareLicense } from '../../models/IAssetApp';
import { DATA_TABLE_CLASS } from '../../lib/list-view/columnWidths';

export interface ISoftwareLicensesPageProps {
  softwareService: SoftwareLicenseService;
}

export const SoftwareLicensesPage: React.FC<ISoftwareLicensesPageProps> = ({ softwareService }) => {
  const [rows, setRows] = React.useState<ISoftwareLicense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [seats, setSeats] = React.useState('10');
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      setRows(await softwareService.getLicenses());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load licenses.');
    } finally {
      setLoading(false);
    }
  }, [softwareService]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (): Promise<void> => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await softwareService.createLicense({
        Title: title.trim(),
        AM_ProductName: title.trim(),
        AM_TotalSeats: Number(seats) || 0,
        AM_UsedSeats: 0,
        AM_IsActive: true
      });
      setTitle('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      await softwareService.deleteLicense(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  return (
    <ContentCard>
      {error ? (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      ) : null}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Field label="Product name">
          <Input value={title} onChange={(_, d) => setTitle(d.value)} />
        </Field>
        <Field label="Total seats">
          <Input value={seats} onChange={(_, d) => setSeats(d.value)} />
        </Field>
        <Button appearance="primary" icon={<AddRegular />} disabled={saving || !title.trim()} onClick={() => void handleAdd()}>
          Add license
        </Button>
      </div>
      {loading ? (
        <Spinner label="Loading licenses..." />
      ) : (
        <div className={DATA_TABLE_CLASS}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Product</TableHeaderCell>
                <TableHeaderCell>Vendor</TableHeaderCell>
                <TableHeaderCell>Seats</TableHeaderCell>
                <TableHeaderCell>Expiry</TableHeaderCell>
                <TableHeaderCell />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.Id}>
                  <TableCell>{row.AM_ProductName || row.Title}</TableCell>
                  <TableCell>{row.AM_Vendor?.Title || '—'}</TableCell>
                  <TableCell>
                    {row.AM_UsedSeats ?? 0}/{row.AM_TotalSeats ?? 0}
                  </TableCell>
                  <TableCell>{row.AM_ExpiryDate || '—'}</TableCell>
                  <TableCell>
                    <Button appearance="subtle" icon={<DeleteRegular />} onClick={() => void handleDelete(row.Id)} />
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
