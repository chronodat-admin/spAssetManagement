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
import { useTranslation } from '../../i18n/LocaleContext';


export interface IInventoryPageProps {
  inventoryService: InventoryService;
}

export const InventoryPage: React.FC<IInventoryPageProps> = ({ inventoryService }) => {
  const styles = useFormStyles();
  const { t } = useTranslation();
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
      setError(err instanceof Error ? err.message : t('inventory', 'loadFailed', 'Failed to load scans.'));
    } finally {
      setLoading(false);
    }
  }, [inventoryService, t]);

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
      setError(err instanceof Error ? err.message : t('inventory', 'createFailed', 'Create failed.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      await inventoryService.deleteScan(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('inventory', 'deleteFailed', 'Delete failed.'));
    }
  };

  return (
    <ContentCard>
      <PageNotifications error={error || undefined} />
      <div className={styles.inlineRow}>
        <Field label={t('inventory', 'scanLabel', 'Scan label')} className={styles.inlineField}>
          <Input value={title} onChange={(_, d) => setTitle(d.value)} placeholder={t('inventory', 'scanPlaceholder', 'e.g. Barcode or asset tag')} />
        </Field>
        <Checkbox label={t('inventory', 'assetFound', 'Asset found')} checked={found} onChange={(_, d) => setFound(Boolean(d.checked))} />
        <Button appearance="primary" icon={<AddRegular />} disabled={saving || !title.trim()} onClick={() => void handleAdd()}>
          {t('inventory', 'recordScan', 'Record scan')}
        </Button>
      </div>
      {loading ? (
        <Spinner label={t('inventory', 'loadingScans', 'Loading inventory scans...')} />
      ) : (
        <div className={DATA_TABLE_CLASS}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t('inventory', 'scan', 'Scan')}</TableHeaderCell>
                <TableHeaderCell>{t('inventory', 'location', 'Location')}</TableHeaderCell>
                <TableHeaderCell>{t('inventory', 'asset', 'Asset')}</TableHeaderCell>
                <TableHeaderCell>{t('inventory', 'date', 'Date')}</TableHeaderCell>
                <TableHeaderCell>{t('inventory', 'found', 'Found')}</TableHeaderCell>
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
                  <TableCell>{row.AM_Found ? t('inventory', 'yes', 'Yes') : t('inventory', 'no', 'No')}</TableCell>
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
