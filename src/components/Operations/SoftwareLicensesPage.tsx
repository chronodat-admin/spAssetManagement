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



function ReadonlyField({ label, value }: { label: string; value?: string | number | boolean }): React.ReactElement {

  const styles = useFormStyles();

  const display =

    value === undefined || value === null || value === ''

      ? '—'

      : typeof value === 'boolean'

        ? value

          ? 'Yes'

          : 'No'

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

      setError(err instanceof Error ? err.message : 'Failed to load licenses.');

    } finally {

      setLoading(false);

    }

  }, [softwareService]);



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

      setError(err instanceof Error ? err.message : 'Create failed.');

    } finally {

      setSaving(false);

    }

  };



  const handleSave = async (): Promise<void> => {

    if (!selected) return;

    const productName = (editForm.AM_ProductName || editForm.Title || '').trim();

    if (!productName) {

      setError('Product name is required.');

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

      setError(err instanceof Error ? err.message : 'Save failed.');

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

      setError(err instanceof Error ? err.message : 'Delete failed.');

    }

  };



  const productName = selected?.AM_ProductName || selected?.Title || 'License';



  return (

    <>

      <ContentCard>

        <PageNotifications error={error || undefined} />

        <div className={styles.inlineRow}>

          <Field label="Product name" className={styles.inlineField}>

            <Input value={title} onChange={(_, d) => setTitle(d.value)} placeholder="e.g. Microsoft 365 E3" />

          </Field>

          <Field label="Total seats" className={styles.inlineFieldNarrow}>

            <Input type="number" value={seats} onChange={(_, d) => setSeats(d.value)} />

          </Field>

          <Field label=" " className={styles.inlineAction} aria-hidden="true">

            <Button

              appearance="primary"

              icon={<AddRegular />}

              disabled={saving || !title.trim()}

              onClick={() => void handleAdd()}

            >

              Add license

            </Button>

          </Field>

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

                  <TableHeaderCell>Actions</TableHeaderCell>

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

                    <TableCell>{formatDate(row.AM_ExpiryDate)}</TableCell>

                    <TableCell>

                      <div className={styles.tableRowActions}>

                        <Button

                          appearance="subtle"

                          icon={<EyeRegular />}

                          aria-label="View"

                          onClick={() => openView(row)}

                        />

                        <Button

                          appearance="subtle"

                          icon={<EditRegular />}

                          aria-label="Edit"

                          onClick={() => openEdit(row)}

                        />

                        <Button

                          appearance="subtle"

                          icon={<DeleteRegular />}

                          aria-label="Delete"

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

        title={panelMode === 'edit' ? `Edit ${productName}` : productName}

        subtitle={panelMode === 'view' ? 'Software license details' : 'Update license pool and seat counts'}

        onClose={closePanel}

        footer={

          panelMode === 'view' ? (

            <>

              <Button appearance="secondary" onClick={closePanel}>

                Close

              </Button>

              {selected && (

                <Button appearance="primary" icon={<EditRegular />} onClick={() => selected && openEdit(selected)}>

                  Edit

                </Button>

              )}

            </>

          ) : (

            <>

              <Button appearance="secondary" onClick={closePanel} disabled={saving}>

                Cancel

              </Button>

              <Button

                appearance="primary"

                icon={saving ? <Spinner size="tiny" /> : <SaveRegular />}

                disabled={saving}

                onClick={() => void handleSave()}

              >

                {saving ? 'Saving...' : 'Save'}

              </Button>

            </>

          )

        }

      >

        {selected &&

          (panelMode === 'view' ? (

            <div className={styles.form}>

              <ReadonlyField label="Product name" value={selected.AM_ProductName || selected.Title} />

              <ReadonlyField label="Vendor" value={selected.AM_Vendor?.Title} />

              <ReadonlyField

                label="Seats"

                value={`${selected.AM_UsedSeats ?? 0} used / ${selected.AM_TotalSeats ?? 0} total`}

              />

              <ReadonlyField

                label="Available seats"

                value={

                  selected.AM_AvailableSeats ??

                  Math.max(0, (selected.AM_TotalSeats ?? 0) - (selected.AM_UsedSeats ?? 0))

                }

              />

              <ReadonlyField label="Expiry date" value={formatDate(selected.AM_ExpiryDate)} />

              <ReadonlyField

                label="Cost"

                value={selected.AM_Cost !== undefined ? selected.AM_Cost.toLocaleString() : undefined}

              />

              <ReadonlyField label="License key" value={selected.AM_LicenseKey} />

              <ReadonlyField label="Active" value={selected.AM_IsActive ?? true} />

              <ReadonlyField label="Notes" value={selected.AM_Notes} />

            </div>

          ) : (

            <div className={styles.form}>

              <Field label="Product name" required>

                <Input

                  value={editForm.AM_ProductName || ''}

                  onChange={(_, d) => setEditForm((prev) => ({ ...prev, AM_ProductName: d.value, Title: d.value }))}

                />

              </Field>

              <Field label="Vendor">

                <Text className={styles.readonlyValue}>{selected.AM_Vendor?.Title || '—'}</Text>

              </Field>

              <div className={styles.grid}>

                <Field label="Total seats" required>

                  <Input

                    type="number"

                    value={String(editForm.AM_TotalSeats ?? '')}

                    onChange={(_, d) =>

                      setEditForm((prev) => ({ ...prev, AM_TotalSeats: Number(d.value) || 0 }))

                    }

                  />

                </Field>

                <Field label="Used seats">

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

                <Field label="Expiry date">

                  <Input

                    type="date"

                    value={editForm.AM_ExpiryDate || ''}

                    onChange={(_, d) => setEditForm((prev) => ({ ...prev, AM_ExpiryDate: d.value }))}

                  />

                </Field>

                <Field label="Cost">

                  <Input

                    type="number"

                    value={String(editForm.AM_Cost ?? '')}

                    onChange={(_, d) => setEditForm((prev) => ({ ...prev, AM_Cost: Number(d.value) || 0 }))}

                  />

                </Field>

              </div>

              <Field label="License key">

                <Input

                  value={editForm.AM_LicenseKey || ''}

                  onChange={(_, d) => setEditForm((prev) => ({ ...prev, AM_LicenseKey: d.value }))}

                />

              </Field>

              <Checkbox

                label="Active"

                checked={editForm.AM_IsActive ?? true}

                onChange={(_, d) => setEditForm((prev) => ({ ...prev, AM_IsActive: Boolean(d.checked) }))}

              />

              <Field label="Notes">

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


