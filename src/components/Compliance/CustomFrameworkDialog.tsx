import * as React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Text,
  Textarea,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { AddRegular, DismissRegular } from '@fluentui/react-icons';
import { IComplianceFramework, ICustomFrameworkControlInput, ICustomFrameworkInput } from '../../models/ICompliance';
import { ComplianceService } from '../../services/ComplianceService';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: tokens.spacingHorizontalM
  },
  controlsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM
  },
  controlRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(100px, 0.8fr) minmax(160px, 1.4fr) minmax(120px, 1fr) auto',
    gap: tokens.spacingHorizontalS,
    alignItems: 'end'
  },
  removeButton: {
    minWidth: '32px'
  }
});

interface IControlRow extends ICustomFrameworkControlInput {
  _key: string;
}

function emptyControl(index: number): IControlRow {
  return {
    _key: `control-${index}`,
    controlCode: `CTRL-${index}`,
    title: '',
    category: ''
  };
}

function sanitizeCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9-_]/g, '');
}

export interface ICustomFrameworkDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  framework?: IComplianceFramework;
  complianceService: ComplianceService;
  onClose: () => void;
  onSaved: () => void;
}

export const CustomFrameworkDialog: React.FC<ICustomFrameworkDialogProps> = ({
  open,
  mode,
  framework,
  complianceService,
  onClose,
  onSaved
}) => {
  const styles = useStyles();
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [version, setVersion] = React.useState('1.0');
  const [description, setDescription] = React.useState('');
  const [controls, setControls] = React.useState<IControlRow[]>([emptyControl(1)]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setError('');

    if (mode === 'edit' && framework) {
      setName(framework.name);
      setCode(framework.code);
      setVersion(framework.version || '1.0');
      setDescription(framework.description || '');
      setLoading(true);
      void complianceService
        .getFrameworkControls(framework.id)
        .then((rows) => {
          if (rows.length === 0) {
            setControls([emptyControl(1)]);
            return;
          }
          setControls(
            rows.map((row, index) => ({
              _key: `control-${row.id}-${index}`,
              controlCode: row.controlCode,
              title: row.title,
              category: row.category || '',
              description: row.description || ''
            }))
          );
        })
        .catch((loadError) => {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load controls.');
        })
        .then(() => {
          setLoading(false);
        });
      return;
    }

    setName('');
    setCode('');
    setVersion('1.0');
    setDescription('');
    setControls([emptyControl(1)]);
  }, [open, mode, framework, complianceService]);

  const updateControl = (key: string, patch: Partial<IControlRow>): void => {
    setControls((current) =>
      current.map((row) => (row._key === key ? { ...row, ...patch } : row))
    );
  };

  const addControl = (): void => {
    setControls((current) => [...current, emptyControl(current.length + 1)]);
  };

  const removeControl = (key: string): void => {
    setControls((current) => {
      if (current.length === 1) {
        return [emptyControl(1)];
      }
      return current.filter((row) => row._key !== key);
    });
  };

  const buildInput = (): ICustomFrameworkInput => ({
    name,
    code,
    version,
    description,
    controls: controls.map((row) => ({
      controlCode: row.controlCode.trim(),
      title: row.title.trim(),
      category: row.category?.trim() || '',
      description: row.description?.trim() || ''
    }))
  });

  const handleSave = async (): Promise<void> => {
    setError('');
    setLoading(true);
    try {
      const input = buildInput();
      if (mode === 'edit' && framework) {
        await complianceService.updateCustomFramework(framework.id, input);
      } else {
        await complianceService.createCustomFramework(input);
      }
      onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save framework.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface style={{ maxWidth: '720px' }}>
        <DialogBody>
          <DialogTitle>{mode === 'edit' ? 'Edit Framework' : 'Create Custom Framework'}</DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              <Text>
                {mode === 'edit'
                  ? 'Update your custom framework and replace its controls.'
                  : 'Define a new compliance framework with custom controls for your organization.'}
              </Text>
              {error ? (
                <Text style={{ color: tokens.colorPaletteRedForeground1 }} role="alert">
                  {error}
                </Text>
              ) : null}
              <Field label="Framework Name" required>
                <Input
                  value={name}
                  onChange={(_, data) => setName(data.value)}
                  placeholder="e.g. Internal Security Policy"
                />
              </Field>
              <div className={styles.grid}>
                <Field label="Code" required>
                  <Input
                    value={code}
                    onChange={(_, data) => setCode(sanitizeCode(data.value))}
                    placeholder="e.g. ISP"
                  />
                </Field>
                <Field label="Version">
                  <Input
                    value={version}
                    onChange={(_, data) => setVersion(data.value)}
                    placeholder="e.g. 1.0"
                  />
                </Field>
              </div>
              <Field label="Description">
                <Textarea
                  value={description}
                  onChange={(_, data) => setDescription(data.value)}
                  placeholder="Brief description of this framework..."
                  resize="vertical"
                />
              </Field>
              <div>
                <div className={styles.controlsHeader}>
                  <Text weight="semibold">Controls *</Text>
                  <Button appearance="secondary" icon={<AddRegular />} onClick={addControl}>
                    Add Control
                  </Button>
                </div>
                <div className={styles.form}>
                  {controls.map((row) => (
                    <div key={row._key} className={styles.controlRow}>
                      <Field label="Code">
                        <Input
                          value={row.controlCode}
                          onChange={(_, data) =>
                            updateControl(row._key, { controlCode: data.value })
                          }
                          placeholder="CTRL-1"
                        />
                      </Field>
                      <Field label="Title">
                        <Input
                          value={row.title}
                          onChange={(_, data) => updateControl(row._key, { title: data.value })}
                          placeholder="Control title"
                        />
                      </Field>
                      <Field label="Category">
                        <Input
                          value={row.category || ''}
                          onChange={(_, data) => updateControl(row._key, { category: data.value })}
                          placeholder="Category"
                        />
                      </Field>
                      <Button
                        appearance="subtle"
                        icon={<DismissRegular />}
                        aria-label="Remove control"
                        className={styles.removeButton}
                        onClick={() => removeControl(row._key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button appearance="primary" disabled={loading} onClick={() => void handleSave()}>
              {loading ? 'Saving...' : mode === 'edit' ? 'Save Framework' : 'Create Framework'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
