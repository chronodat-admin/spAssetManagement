import * as React from 'react';
import {
  Button,
  Field,
  Text,
  Textarea
} from '@fluentui/react-components';
import { ArrowDownloadRegular, ArrowUploadRegular } from '@fluentui/react-icons';
import { parseCsvRows } from '../../utils/csvParse';
import { ImportExportService } from '../../services/ImportExportService';
import { SettingsPageHeader } from './SettingsPageHeader';
import { useTranslation } from '../../i18n/LocaleContext';
import { PageNotifications } from '../Layout/PageNotifications';


export interface IBulkImportTabProps {
  importExportService: ImportExportService;
  pageTitle: string;
  pageDescription?: string;
  pageIcon?: React.ElementType;
  onImported?: () => void;
}

const TEMPLATE_CSV = 'Title,AM_AssetId,AM_SerialNumber,AM_Barcode,AM_Cost,AM_PurchaseDate,AM_Notes\n';

export const BulkImportTab: React.FC<IBulkImportTabProps> = ({
  importExportService,
  pageTitle,
  pageDescription,
  pageIcon,
  onImported
}) => {
  const { t } = useTranslation();
  const [csvText, setCsvText] = React.useState('');
  const [importing, setImporting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState('');

  const handleDownloadTemplate = (): void => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'asset-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (): Promise<void> => {
    setImporting(true);
    setError('');
    setResult('');
    try {
      const parsed = parseCsvRows(csvText);
      const rows = parsed.map((row: Record<string, string>) => ({
        Title: row.Title || row.title || '',
        AM_AssetId: row.AM_AssetId || row.AssetId,
        AM_SerialNumber: row.AM_SerialNumber || row.SerialNumber,
        AM_Barcode: row.AM_Barcode || row.Barcode,
        AM_Cost: row.AM_Cost ? Number(row.AM_Cost) : undefined,
        AM_PurchaseDate: row.AM_PurchaseDate || row.PurchaseDate,
        AM_Notes: row.AM_Notes || row.Notes
      }));
      const created = await importExportService.importAssetRows(rows);
      setResult(`${created.length} ${t('operations', 'rowsImported', 'rows imported')}`);
      setCsvText('');
      onImported?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('operations', 'importFailed', 'Import failed'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <SettingsPageHeader title={pageTitle} description={pageDescription} icon={pageIcon} />
      <Text>{t('settings', 'bulkImportDescription', 'Import assets from a CSV file into the register.')}</Text>
      <Button appearance="secondary" icon={<ArrowDownloadRegular />} onClick={handleDownloadTemplate} style={{ marginTop: 12 }}>
        {t('operations', 'downloadTemplate', 'Download template')}
      </Button>
      <Field label="CSV data" style={{ marginTop: 16 }}>
        <Textarea
          value={csvText}
          onChange={(_, d) => setCsvText(d.value)}
          rows={12}
          placeholder={TEMPLATE_CSV}
        />
      </Field>
      <PageNotifications error={error || undefined} success={result || undefined} />
      <Button
        appearance="primary"
        icon={<ArrowUploadRegular />}
        disabled={importing || !csvText.trim()}
        onClick={() => void handleImport()}
        style={{ marginTop: 12 }}
      >
        {t('operations', 'importCsv', 'Import CSV')}
      </Button>
    </>
  );
};
