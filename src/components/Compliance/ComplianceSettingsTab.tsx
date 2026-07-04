import * as React from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  MessageBar,
  MessageBarBody,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { AddRegular, DeleteRegular, EditRegular } from '@fluentui/react-icons';
import { IComplianceFramework } from '../../models/ICompliance';
import { ComplianceService } from '../../services/ComplianceService';
import { ContentCard, useContentCardStyles } from '../Layout/ContentCard';
import {
  DATA_TABLE_CLASS,
  getDataTableLayoutStyle,
  getListColumnStyle
} from '../../lib/list-view/columnWidths';
import { CustomFrameworkDialog } from './CustomFrameworkDialog';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL
  },
  banner: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalS
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3
  },
  rowActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS
  }
});

export interface IComplianceSettingsTabProps {
  complianceService: ComplianceService;
}

export const ComplianceSettingsTab: React.FC<IComplianceSettingsTabProps> = ({ complianceService }) => {
  const styles = useStyles();
  const cardStyles = useContentCardStyles();
  const [frameworks, setFrameworks] = React.useState<IComplianceFramework[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [updatingId, setUpdatingId] = React.useState<number | undefined>();
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit' | undefined>();
  const [editingFramework, setEditingFramework] = React.useState<IComplianceFramework | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<IComplianceFramework | undefined>();
  const [deleting, setDeleting] = React.useState(false);

  const loadFrameworks = React.useCallback(async (silent = false): Promise<void> => {
    if (!silent) {
      setLoading(true);
    }
    setError('');
    try {
      const rows = await complianceService.getFrameworks(false);
      setFrameworks(rows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load frameworks.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [complianceService]);

  React.useEffect(() => {
    void loadFrameworks();
  }, [loadFrameworks]);

  const builtInFrameworks = frameworks.filter((framework) => framework.isBuiltIn);
  const customFrameworks = frameworks.filter((framework) => !framework.isBuiltIn);

  const handleToggle = async (framework: IComplianceFramework, isActive: boolean): Promise<void> => {
    setUpdatingId(framework.id);
    setError('');
    setSuccess('');
    const previousActive = framework.isActive;
    setFrameworks((current) =>
      current.map((item) => (item.id === framework.id ? { ...item, isActive } : item))
    );
    try {
      await complianceService.setFrameworkActive(framework.id, isActive);
      setSuccess(`${framework.name} ${isActive ? 'enabled' : 'disabled'}.`);
    } catch (toggleError) {
      setFrameworks((current) =>
        current.map((item) =>
          item.id === framework.id ? { ...item, isActive: previousActive } : item
        )
      );
      setError(toggleError instanceof Error ? toggleError.message : 'Failed to update framework.');
    } finally {
      setUpdatingId(undefined);
    }
  };

  const handleSeed = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const seeded = await complianceService.seedBuiltInFrameworks();
      setSuccess(seeded > 0 ? `Seeded ${seeded} built-in framework(s).` : 'Built-in frameworks are already present.');
      await loadFrameworks(true);
      setLoading(false);
    } catch (seedError) {
      setError(seedError instanceof Error ? seedError.message : 'Failed to seed frameworks.');
      setLoading(false);
    }
  };

  const openCreateDialog = (): void => {
    setEditingFramework(undefined);
    setDialogMode('create');
  };

  const openEditDialog = (framework: IComplianceFramework): void => {
    setEditingFramework(framework);
    setDialogMode('edit');
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError('');
    try {
      await complianceService.deleteCustomFramework(deleteTarget.id);
      setSuccess(`Deleted "${deleteTarget.name}".`);
      setDeleteTarget(undefined);
      await loadFrameworks(true);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete framework.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <Spinner size="large" label="Loading compliance settings..." />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {success && (
        <MessageBar intent="success">
          <MessageBarBody>{success}</MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.banner}>
        <Text weight="semibold">How compliance frameworks work</Text>
        <Text>
          Built-in frameworks ship with pre-defined controls. Create custom frameworks for
          organization-specific requirements. Disable a framework to hide it from new assessments.
          Existing assessments are not affected.
        </Text>
        <div>
          <Button appearance="primary" onClick={() => void handleSeed()}>
            Seed built-in frameworks
          </Button>
        </div>
      </div>

      <ContentCard flushBody>
        <div style={{ padding: tokens.spacingHorizontalM, paddingTop: tokens.spacingVerticalM }}>
          <Text weight="semibold">Built-in Frameworks</Text>
        </div>
        <div className={cardStyles.tableWrap}>
          <Table
            className={DATA_TABLE_CLASS}
            style={getDataTableLayoutStyle(700)}
          >
            <TableHeader>
              <TableRow>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('framework')}>
                  Framework
                </TableHeaderCell>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('code')}>
                  Code
                </TableHeaderCell>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('version')}>
                  Version
                </TableHeaderCell>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('controls')}>
                  Controls
                </TableHeaderCell>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('active')}>
                  Active
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {builtInFrameworks.map((framework) => (
                <TableRow key={framework.id}>
                  <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('framework')}>
                    {framework.name}
                  </TableCell>
                  <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('code')}>
                    {framework.code}
                  </TableCell>
                  <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('version')}>
                    {framework.version || '—'}
                  </TableCell>
                  <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('controls')}>
                    {framework.controlCount}
                  </TableCell>
                  <TableCell style={getListColumnStyle('active')}>
                  <Switch
                    checked={framework.isActive}
                    disabled={updatingId === framework.id}
                    onChange={(_, data) => void handleToggle(framework, !!data.checked)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </ContentCard>

      <ContentCard flushBody>
        <div
          className={styles.sectionHeader}
          style={{ padding: tokens.spacingHorizontalM, paddingTop: tokens.spacingVerticalM }}
        >
          <div>
            <Text weight="semibold" style={{ color: tokens.colorNeutralForeground1 }}>
              Custom Frameworks
            </Text>
            <Text block style={{ color: tokens.colorNeutralForeground3 }}>
              Create your own compliance frameworks with custom controls tailored to your organization.
            </Text>
          </div>
          <Button appearance="primary" icon={<AddRegular />} onClick={openCreateDialog}>
            Add Framework
          </Button>
        </div>
        {customFrameworks.length === 0 ? (
          <div className={styles.emptyState}>
            <Text>No custom frameworks yet.</Text>
            <Text block>Create one to define your own controls and assessments.</Text>
            <Button appearance="primary" icon={<AddRegular />} onClick={openCreateDialog}>
              Add your first framework
            </Button>
          </div>
        ) : (
          <div className={cardStyles.tableWrap}>
            <Table
              className={DATA_TABLE_CLASS}
              style={getDataTableLayoutStyle(980)}
            >
              <TableHeader>
                <TableRow>
                  <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('framework')}>
                    Framework
                  </TableHeaderCell>
                  <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('code')}>
                    Code
                  </TableHeaderCell>
                  <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('version')}>
                    Version
                  </TableHeaderCell>
                  <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('controls')}>
                    Controls
                  </TableHeaderCell>
                  <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('type')}>
                    Type
                  </TableHeaderCell>
                  <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('active')}>
                    Active
                  </TableHeaderCell>
                  <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('actions')}>
                    Actions
                  </TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customFrameworks.map((framework) => (
                  <TableRow key={framework.id}>
                    <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('framework')}>
                      {framework.name}
                    </TableCell>
                    <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('code')}>
                      {framework.code}
                    </TableCell>
                    <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('version')}>
                      {framework.version || '—'}
                    </TableCell>
                    <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('controls')}>
                      {framework.controlCount}
                    </TableCell>
                    <TableCell style={getListColumnStyle('type')}>
                      <Badge appearance="outline">Custom</Badge>
                    </TableCell>
                    <TableCell style={getListColumnStyle('active')}>
                    <Switch
                      checked={framework.isActive}
                      disabled={updatingId === framework.id}
                      onChange={(_, data) => void handleToggle(framework, !!data.checked)}
                    />
                    </TableCell>
                    <TableCell style={getListColumnStyle('actions')}>
                      <div className={styles.rowActions}>
                      <Button
                        appearance="subtle"
                        icon={<EditRegular />}
                        aria-label={`Edit ${framework.name}`}
                        onClick={() => openEditDialog(framework)}
                      />
                      <Button
                        appearance="subtle"
                        icon={<DeleteRegular />}
                        aria-label={`Delete ${framework.name}`}
                        onClick={() => setDeleteTarget(framework)}
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

      {dialogMode ? (
        <CustomFrameworkDialog
          open
          mode={dialogMode}
          framework={editingFramework}
          complianceService={complianceService}
          onClose={() => {
            setDialogMode(undefined);
            setEditingFramework(undefined);
          }}
          onSaved={() => {
            setSuccess(dialogMode === 'edit' ? 'Framework updated.' : 'Custom framework created.');
            void loadFrameworks(true);
          }}
        />
      ) : null}

      {deleteTarget ? (
        <Dialog open onOpenChange={(_, data) => !data.open && setDeleteTarget(undefined)}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Delete Framework</DialogTitle>
              <DialogContent>
                Delete &quot;{deleteTarget.name}&quot; and all of its controls? This cannot be undone.
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setDeleteTarget(undefined)}>
                  Cancel
                </Button>
                <Button appearance="primary" disabled={deleting} onClick={() => void handleDelete()}>
                  {deleting ? 'Deleting...' : 'Delete Framework'}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      ) : null}
    </div>
  );
};
