import * as React from 'react';
import {
  Button,
  Field,
  Input,
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
import { AddRegular, DeleteRegular, WrenchRegular } from '@fluentui/react-icons';
import { ContentCard } from '../Layout/ContentCard';
import { EmptyState } from '../Layout/EmptyState';
import { useFormStyles } from '../Forms/formStyles';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { PeoplePickerField } from '../PeoplePicker/PeoplePickerField';
import { UserCell } from '../PeoplePicker/UserAvatar';
import { IPersonPickerItem } from '../../models/IPersonPickerItem';
import { IAsset } from '../../models/IAssetApp';
import { MaintenanceService, IMaintenanceRecordInput } from '../../services/MaintenanceService';
import { AssetService } from '../../services/AssetService';
import { DATA_TABLE_CLASS } from '../../lib/list-view/columnWidths';
import { useTranslation } from '../../i18n/LocaleContext';
import { buildAssetSelectOption } from '../../utils/assetSelectOptions';
import { PageNotifications } from '../Layout/PageNotifications';


export interface IMaintenancePageProps {
  maintenanceService: MaintenanceService;
  assetService: AssetService;
  assets: IAsset[];
}

export const MaintenancePage: React.FC<IMaintenancePageProps> = ({
  maintenanceService,
  assetService,
  assets
}) => {
  const styles = useFormStyles();
  const { t } = useTranslation();
  const [rows, setRows] = React.useState<Awaited<ReturnType<MaintenanceService['getRecords']>>>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [assetId, setAssetId] = React.useState('');
  const [type, setType] = React.useState<'Preventive' | 'Corrective' | 'Inspection' | ''>('');
  const [scheduledDate, setScheduledDate] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [technicians, setTechnicians] = React.useState<IPersonPickerItem[]>([]);

  const load = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      setRows(await maintenanceService.getRecords());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load maintenance records.');
    } finally {
      setLoading(false);
    }
  }, [maintenanceService]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (): Promise<void> => {
    if (!title.trim() || !assetId) {
      setError('Title and asset are required.');
      return;
    }
    const input: IMaintenanceRecordInput = {
      Title: title.trim(),
      AM_AssetId: Number(assetId),
      AM_Type: type || undefined,
      AM_ScheduledDate: scheduledDate || undefined,
      AM_Notes: notes.trim() || undefined,
      AM_TechnicianId: technicians[0]?.id ?? null
    };
    setSaving(true);
    try {
      await maintenanceService.createRecord(input);
      setTitle('');
      setNotes('');
      setScheduledDate('');
      setTechnicians([]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      await maintenanceService.deleteRecord(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const searchPeople = React.useCallback(
    async (query: string) => assetService.searchPeople(query),
    [assetService]
  );

  return (
    <ContentCard>
      <PageNotifications error={error || undefined} />
      <div className={styles.grid}>
        <Field label={t('common', 'add', 'Title')} required>
          <Input value={title} onChange={(_, d) => setTitle(d.value)} placeholder="Maintenance title" />
        </Field>
        <Field label={t('operations', 'selectAsset', 'Asset')} required>
          <AppDropdown
            searchable
            searchPlaceholder={t('operations', 'searchAssets', 'Search assets…')}
            selectedOptions={assetId ? [assetId] : []}
            onOptionSelect={(_, data) => setAssetId(data.optionValue || '')}
            placeholder="Select asset"
          >
            {assets.map((asset) => {
              const option = buildAssetSelectOption(asset);
              return (
                <Option key={asset.Id} value={option.value} text={option.searchText}>
                  {option.label}
                </Option>
              );
            })}
          </AppDropdown>
        </Field>
        <Field label={t('maintenance', 'type', 'Type')}>
          <AppDropdown
            selectedOptions={type ? [type] : []}
            onOptionSelect={(_, data) => setType((data.optionValue || '') as typeof type)}
            placeholder="Type"
          >
            <Option value="Preventive">{t('maintenance', 'preventive', 'Preventive')}</Option>
            <Option value="Corrective">{t('maintenance', 'corrective', 'Corrective')}</Option>
            <Option value="Inspection">{t('maintenance', 'inspection', 'Inspection')}</Option>
          </AppDropdown>
        </Field>
        <Field label={t('maintenance', 'scheduledDate', 'Scheduled date')}>
          <Input type="date" value={scheduledDate} onChange={(_, d) => setScheduledDate(d.value)} />
        </Field>
        <Field label={t('maintenance', 'technician', 'Technician')}>
          <PeoplePickerField
            multi={false}
            value={technicians}
            onChange={setTechnicians}
            onSearch={searchPeople}
            onResolve={(key) => assetService.resolvePerson(key)}
            placeholder="Select technician"
          />
        </Field>
        <Field label={t('common', 'notes', 'Notes')} className={styles.fullWidth}>
          <Textarea value={notes} onChange={(_, d) => setNotes(d.value)} rows={3} />
        </Field>
        <Button appearance="primary" icon={<AddRegular />} disabled={saving} onClick={() => void handleAdd()}>
          {t('maintenance', 'newRecord', 'New maintenance record')}
        </Button>
      </div>
      {loading ? (
        <Spinner label={t('common', 'loading', 'Loading…')} />
      ) : rows.length === 0 ? (
        <EmptyState
          bordered
          icon={<WrenchRegular />}
          title={t('maintenance', 'noRecords', 'No maintenance records')}
          description={t(
            'maintenance',
            'noRecordsDescription',
            'Schedule preventive or corrective maintenance using the form above.'
          )}
        />
      ) : (
        <div className={DATA_TABLE_CLASS}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Title</TableHeaderCell>
                <TableHeaderCell>Asset</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Scheduled</TableHeaderCell>
                <TableHeaderCell>Technician</TableHeaderCell>
                <TableHeaderCell />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.Id}>
                  <TableCell>{row.Title}</TableCell>
                  <TableCell>{row.AM_Asset?.Title || '—'}</TableCell>
                  <TableCell>{row.AM_Type || '—'}</TableCell>
                  <TableCell>{row.AM_ScheduledDate || '—'}</TableCell>
                  <TableCell>
                    <UserCell
                      name={row.AM_Technician?.Title}
                      email={row.AM_Technician?.Email}
                    />
                  </TableCell>
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
