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

  TableRow,

  Text,

  Textarea

} from '@fluentui/react-components';

import { AddRegular, DeleteRegular, EditRegular, EyeRegular, SaveRegular } from '@fluentui/react-icons';

import { ContentCard } from '../Layout/ContentCard';

import { RightDetailPanel } from '../Layout/RightDetailPanel';

import { useFormStyles } from '../Forms/formStyles';

import { SoftwareLicenseService, ISoftwareLicenseInput } from '../../services/SoftwareLicenseService';

import type { ISoftwareLicense } from '../../models/IAssetApp';

import { DATA_TABLE_CLASS } from '../../lib/list-view/columnWidths';

import { PageNotifications } from '../Layout/PageNotifications';
import { useTranslation } from '../../i18n/LocaleContext';
import { formatMessage } from '../../i18n/formatMessage';

type PanelMode = 'view' | 'edit';



function formatDate(value?: string): string {

  if (!value) return '—';

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();

}



function toDateInputValue(value?: string): string {

  if (!value) return '';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);

  return parsed.toISOString().slice(0, 10);

}



function ReadonlyField({
  label,
  value,
  yesText,
  noText
}: {
  label: string;
  value?: string | number | boolean;
  yesText: string;
  noText: string;
}): React.ReactElement {

  const styles = useFormStyles();

  const display =

    value === undefined || value === null || value === ''

      ? '—'

      : typeof value === 'boolean'

        ? value
          ? yesText
          : noText

        : String(value);



  return (

    <Field label={label}>

      <Text className={display === '—' ? styles.readonlyEmpty : styles.readonlyValue}>{display}</Text>

    </Field>

  );

}



export interface ISoftwareLicensesPageProps {

  softwareService: SoftwareLicenseService;

}



export const SoftwareLicensesPage: React.FC<ISoftwareLicensesPageProps> = ({ softwareService }) => {

  const styles = useFormStyles();
  const { t } = useTranslation();

  const [rows, setRows] = React.useState<ISoftwareLicense[]>([]);

  const [loading, setLoading] = React.useState(true);

  const [error, setError] = React.useState('');

  const [title, setTitle] = React.useState('');

  const [seats, setSeats] = React.useState('10');

  const [saving, setSaving] = React.useState(false);

  const [panelOpen, setPanelOpen] = React.useState(false);

  const [panelMode, setPanelMode] = React.useState<PanelMode>('view');

  const [selected, setSelected] = React.useState<ISoftwareLicense | undefined>();

  const [editForm, setEditForm] = React.useState<ISoftwareLicenseInput>({ Title: '' });



  const load = React.useCallback(async (): Promise<void> => {

    setLoading(true);

    setError('');

    try {

      setRows(await softwareService.getLicenses());

    } catch (err) {

      setError(err instanceof Error ? err.message : t('softwareLicenses', 'loadFailed', 'Failed to load licenses.'));

    } finally {

      setLoading(false);

    }

  }, [softwareService, t]);



  React.useEffect(() => {

    void load();

  }, [load]);



  const closePanel = (): void => {

    setPanelOpen(false);

    setSelected(undefined);

  };



  const openView = (row: ISoftwareLicense): void => {

    setSelected(row);

    setPanelMode('view');

    setPanelOpen(true);

  };



  const openEdit = (row: ISoftwareLicense): void => {

    setSelected(row);

    setEditForm({

      Title: row.Title,

      AM_ProductName: row.AM_ProductName || row.Title,

      AM_LicenseKey: row.AM_LicenseKey,

      AM_TotalSeats: row.AM_TotalSeats,

      AM_UsedSeats: row.AM_UsedSeats,

      AM_ExpiryDate: toDateInputValue(row.AM_ExpiryDate),

      AM_Cost: row.AM_Cost,

      AM_Notes: row.AM_Notes,

      AM_IsActive: row.AM_IsActive ?? true

    });

    setPanelMode('edit');

    setPanelOpen(true);

  };



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

      setError(err instanceof Error ? err.message : t('softwareLicenses', 'createFailed', 'Create failed.'));

    } finally {

      setSaving(false);

    }

  };



  const handleSave = async (): Promise<void> => {

    if (!selected) return;

    const productName = (editForm.AM_ProductName || editForm.Title || '').trim();

    if (!productName) {

      setError(t('softwareLicenses', 'productRequired', 'Product name is required.'));

      return;

    }

    setSaving(true);

    setError('');

    try {

      await softwareService.updateLicense(selected.Id, {

        ...editForm,

        Title: productName,

        AM_ProductName: productName

      });

      closePanel();

      await load();

    } catch (err) {

      setError(err instanceof Error ? err.message : t('softwareLicenses', 'saveFailed', 'Save failed.'));

    } finally {

      setSaving(false);

    }

  };



  const handleDelete = async (id: number): Promise<void> => {

    try {

      await softwareService.deleteLicense(id);

      if (selected?.Id === id) {

        closePanel();

      }

      await load();

    } catch (err) {

      setError(err instanceof Error ? err.message : t('softwareLicenses', 'deleteFailed', 'Delete failed.'));

    }

  };



  const productName = selected?.AM_ProductName || selected?.Title || t('softwareLicenses', 'licenseDefault', 'License');



  return (

    <>

      <ContentCard>

        <PageNotifications error={error || undefined} />

        <div className={styles.inlineRow}>

          <Field label={t('softwareLicenses', 'productName', 'Product name')} className={styles.inlineField}>

            <Input value={title} onChange={(_, d) => setTitle(d.value)} placeholder={t('softwareLicenses', 'productPlaceholder', 'e.g. Microsoft 365 E3')} />

          </Field>

          <Field label={t('softwareLicenses', 'totalSeats', 'Total seats')} className={styles.inlineFieldNarrow}>

            <Input type="number" value={seats} onChange={(_, d) => setSeats(d.value)} />

          </Field>

          <Field label=" " className={styles.inlineAction} aria-hidden="true">

            <Button

              appearance="primary"

              icon={<AddRegular />}

              disabled={saving || !title.trim()}

              onClick={() => void handleAdd()}

            >

              {t('softwareLicenses', 'addLicense', 'Add license')}

            </Button>

          </Field>

        </div>

        {loading ? (

          <Spinner label={t('softwareLicenses', 'loadingLicenses', 'Loading licenses...')} />

        ) : (

          <div className={DATA_TABLE_CLASS}>

            <Table>

              <TableHeader>

                <TableRow>

                  <TableHeaderCell>{t('softwareLicenses', 'product', 'Product')}</TableHeaderCell>

                  <TableHeaderCell>{t('softwareLicenses', 'vendor', 'Vendor')}</TableHeaderCell>

                  <TableHeaderCell>{t('softwareLicenses', 'seats', 'Seats')}</TableHeaderCell>

                  <TableHeaderCell>{t('softwareLicenses', 'expiry', 'Expiry')}</TableHeaderCell>

                  <TableHeaderCell>{t('listView', 'actions', 'Actions')}</TableHeaderCell>

                </TableRow>

              </TableHeader>

              <TableBody>

                {rows.map((row) => (

                  <TableRow key={row.Id}>

                    <TableCell>{row.AM_ProductName || row.Title}</TableCell>

                    <TableCell>{row.AM_Vendor?.Title || '—'}</TableCell>

                    <TableCell>

                      {formatMessage(t('softwareLicenses', 'usedTotal', '{used} / {total}'), {
                        used: row.AM_UsedSeats ?? 0,
                        total: row.AM_TotalSeats ?? 0
                      })}

                    </TableCell>

                    <TableCell>{formatDate(row.AM_ExpiryDate)}</TableCell>

                    <TableCell>

                      <div className={styles.tableRowActions}>

                        <Button

                          appearance="subtle"

                          icon={<EyeRegular />}

                          aria-label={t('softwareLicenses', 'viewAria', 'View')}

                          onClick={() => openView(row)}

                        />

                        <Button

                          appearance="subtle"

                          icon={<EditRegular />}

                          aria-label={t('softwareLicenses', 'editAria', 'Edit')}

                          onClick={() => openEdit(row)}

                        />

                        <Button

                          appearance="subtle"

                          icon={<DeleteRegular />}

                          aria-label={t('softwareLicenses', 'deleteAria', 'Delete')}

                          onClick={() => void handleDelete(row.Id)}

                        />

                      </div>

                    </TableCell>

                  </TableRow>

                ))}

              </TableBody>

            </Table>

          </div>

        )}

      </ContentCard>



      <RightDetailPanel

        open={panelOpen}

        title={panelMode === 'edit' ? formatMessage(t('softwareLicenses', 'editTitle', 'Edit {name}'), { name: productName }) : productName}

        subtitle={panelMode === 'view' ? t('softwareLicenses', 'detailsTitle', 'Software license details') : t('softwareLicenses', 'updateDesc', 'Update license pool and seat counts')}

        onClose={closePanel}

        footer={

          panelMode === 'view' ? (

            <>

              <Button appearance="secondary" onClick={closePanel}>

                {t('common', 'close', 'Close')}

              </Button>

              {selected && (

                <Button appearance="primary" icon={<EditRegular />} onClick={() => selected && openEdit(selected)}>

                  {t('common', 'edit', 'Edit')}

                </Button>

              )}

            </>

          ) : (

            <>

              <Button appearance="secondary" onClick={closePanel} disabled={saving}>

                {t('common', 'cancel', 'Cancel')}

              </Button>

              <Button

                appearance="primary"

                icon={saving ? <Spinner size="tiny" /> : <SaveRegular />}

                disabled={saving}

                onClick={() => void handleSave()}

              >

                {saving ? t('common', 'saving', 'Saving...') : t('common', 'save', 'Save')}

              </Button>

            </>

          )

        }

      >

        {selected &&

          (panelMode === 'view' ? (

            <div className={styles.form}>

              <ReadonlyField
                label={t('softwareLicenses', 'productName', 'Product name')}
                value={selected.AM_ProductName || selected.Title}
                yesText={t('softwareLicenses', 'yes', 'Yes')}
                noText={t('softwareLicenses', 'no', 'No')}
              />

              <ReadonlyField
                label={t('softwareLicenses', 'vendor', 'Vendor')}
                value={selected.AM_Vendor?.Title}
                yesText={t('softwareLicenses', 'yes', 'Yes')}
                noText={t('softwareLicenses', 'no', 'No')}
              />

              <ReadonlyField
                label={t('softwareLicenses', 'seats', 'Seats')}
                value={formatMessage(t('softwareLicenses', 'seatsDetail', '{used} used / {total} total'), {
                  used: selected.AM_UsedSeats ?? 0,
                  total: selected.AM_TotalSeats ?? 0
                })}
                yesText={t('softwareLicenses', 'yes', 'Yes')}
                noText={t('softwareLicenses', 'no', 'No')}
              />

              <ReadonlyField
                label={t('softwareLicenses', 'availableSeats', 'Available seats')}
                value={
                  selected.AM_AvailableSeats ??
                  Math.max(0, (selected.AM_TotalSeats ?? 0) - (selected.AM_UsedSeats ?? 0))
                }
                yesText={t('softwareLicenses', 'yes', 'Yes')}
                noText={t('softwareLicenses', 'no', 'No')}
              />

              <ReadonlyField
                label={t('softwareLicenses', 'expiryDate', 'Expiry date')}
                value={formatDate(selected.AM_ExpiryDate)}
                yesText={t('softwareLicenses', 'yes', 'Yes')}
                noText={t('softwareLicenses', 'no', 'No')}
              />

              <ReadonlyField
                label={t('softwareLicenses', 'cost', 'Cost')}
                value={selected.AM_Cost !== undefined ? selected.AM_Cost.toLocaleString() : undefined}
                yesText={t('softwareLicenses', 'yes', 'Yes')}
                noText={t('softwareLicenses', 'no', 'No')}
              />

              <ReadonlyField
                label={t('softwareLicenses', 'licenseKey', 'License key')}
                value={selected.AM_LicenseKey}
                yesText={t('softwareLicenses', 'yes', 'Yes')}
                noText={t('softwareLicenses', 'no', 'No')}
              />

              <ReadonlyField
                label={t('softwareLicenses', 'active', 'Active')}
                value={selected.AM_IsActive ?? true}
                yesText={t('softwareLicenses', 'yes', 'Yes')}
                noText={t('softwareLicenses', 'no', 'No')}
              />

              <ReadonlyField
                label={t('softwareLicenses', 'notes', 'Notes')}
                value={selected.AM_Notes}
                yesText={t('softwareLicenses', 'yes', 'Yes')}
                noText={t('softwareLicenses', 'no', 'No')}
              />

            </div>

          ) : (

            <div className={styles.form}>

              <Field label={t('softwareLicenses', 'productName', 'Product name')} required>

                <Input

                  value={editForm.AM_ProductName || ''}

                  onChange={(_, d) => setEditForm((prev) => ({ ...prev, AM_ProductName: d.value, Title: d.value }))}

                />

              </Field>

              <Field label={t('softwareLicenses', 'vendor', 'Vendor')}>

                <Text className={styles.readonlyValue}>{selected.AM_Vendor?.Title || '—'}</Text>

              </Field>

              <div className={styles.grid}>

                <Field label={t('softwareLicenses', 'totalSeats', 'Total seats')} required>

                  <Input

                    type="number"

                    value={String(editForm.AM_TotalSeats ?? '')}

                    onChange={(_, d) =>

                      setEditForm((prev) => ({ ...prev, AM_TotalSeats: Number(d.value) || 0 }))

                    }

                  />

                </Field>

                <Field label={t('softwareLicenses', 'usedSeats', 'Used seats')}>

                  <Input

                    type="number"

                    value={String(editForm.AM_UsedSeats ?? '')}

                    onChange={(_, d) =>

                      setEditForm((prev) => ({ ...prev, AM_UsedSeats: Number(d.value) || 0 }))

                    }

                  />

                </Field>

              </div>

              <div className={styles.grid}>

                <Field label={t('softwareLicenses', 'expiryDate', 'Expiry date')}>

                  <Input

                    type="date"

                    value={editForm.AM_ExpiryDate || ''}

                    onChange={(_, d) => setEditForm((prev) => ({ ...prev, AM_ExpiryDate: d.value }))}

                  />

                </Field>

                <Field label={t('softwareLicenses', 'cost', 'Cost')}>

                  <Input

                    type="number"

                    value={String(editForm.AM_Cost ?? '')}

                    onChange={(_, d) => setEditForm((prev) => ({ ...prev, AM_Cost: Number(d.value) || 0 }))}

                  />

                </Field>

              </div>

              <Field label={t('softwareLicenses', 'licenseKey', 'License key')}>

                <Input

                  value={editForm.AM_LicenseKey || ''}

                  onChange={(_, d) => setEditForm((prev) => ({ ...prev, AM_LicenseKey: d.value }))}

                />

              </Field>

              <Checkbox

                label={t('softwareLicenses', 'active', 'Active')}

                checked={editForm.AM_IsActive ?? true}

                onChange={(_, d) => setEditForm((prev) => ({ ...prev, AM_IsActive: Boolean(d.checked) }))}

              />

              <Field label={t('softwareLicenses', 'notes', 'Notes')}>

                <Textarea

                  value={editForm.AM_Notes || ''}

                  onChange={(_, d) => setEditForm((prev) => ({ ...prev, AM_Notes: d.value }))}

                  rows={3}

                />

              </Field>

            </div>

          ))}

      </RightDetailPanel>

    </>

  );

};


