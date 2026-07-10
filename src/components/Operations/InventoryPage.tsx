import * as React from 'react';
import {
  Button,
  Checkbox,
  Field,
  Input,
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
import { useFormStyles } from '../Forms/formStyles';
import { InventoryService } from '../../services/InventoryService';
import type { IInventoryItem } from '../../models/IAssetApp';
import { DATA_TABLE_CLASS } from '../../lib/list-view/columnWidths';
import { PageNotifications } from '../Layout/PageNotifications';


export interface IInventoryPageProps {
  inventoryService: InventoryService;
}

export const InventoryPage: React.FC<IInventoryPageProps> = ({ inventoryService }) => {
  const styles = useFormStyles();
  const [rows, setRows] = React.useState<IInventoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [found, setFound] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      setRows(await inventoryService.getScans());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scans.');
    } finally {
      setLoading(false);
    }
  }, [inventoryService]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (): Promise<void> => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await inventoryService.createScan({
        Title: title.trim(),
        AM_ScanDate: new Date().toISOString(),
        AM_Found: found
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
      await inventoryService.deleteScan(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  return (
    <ContentCard>
      <PageNotifications error={error || undefined} />
      <div className={styles.inlineRow}>
        <Field label="Scan label" className={styles.inlineField}>
          <Input value={title} onChange={(_, d) => setTitle(d.value)} placeholder="e.g. Barcode or asset tag" />
        </Field>
        <Checkbox label="Asset found" checked={found} onChange={(_, d) => setFound(Boolean(d.checked))} />
        <Button appearance="primary" icon={<AddRegular />} disabled={saving || !title.trim()} onClick={() => void handleAdd()}>
          Record scan
        </Button>
      </div>
      {loading ? (
        <Spinner label="Loading inventory scans..." />
      ) : (
        <div className={DATA_TABLE_CLASS}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Scan</TableHeaderCell>
                <TableHeaderCell>Location</TableHeaderCell>
                <TableHeaderCell>Asset</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Found</TableHeaderCell>
                <TableHeaderCell />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.Id}>
                  <TableCell>{row.Title}</TableCell>
                  <TableCell>{row.AM_Location?.Title || '—'}</TableCell>
                  <TableCell>{row.AM_Asset?.Title || '—'}</TableCell>
                  <TableCell>{row.AM_ScanDate || '—'}</TableCell>
                  <TableCell>{row.AM_Found ? 'Yes' : 'No'}</TableCell>
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
