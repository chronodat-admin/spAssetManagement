import * as React from 'react';
import {
  Badge,
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Option,
  ProgressBar,
  Spinner,
  Text,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens
} from '@fluentui/react-components';
import { AppDropdown } from '../Dropdown/AppDropdown';
import {
  AddRegular,
  ArrowRightRegular,
  BookOpenRegular,
  ChevronDownRegular,
  ChevronUpRegular,
  ClockRegular,
  DeleteRegular,
  DocumentRegular,
  ShieldCheckmarkRegular
} from '@fluentui/react-icons';
import { IComplianceAssessment, IComplianceFramework } from '../../models/ICompliance';
import { ComplianceService } from '../../services/ComplianceService';
import {
  formatComplianceDate,
  getAssessmentProgressRate,
  getAssessmentStatusAppearance,
  getComplianceRate
} from '../../utils/complianceAnalytics';
import { ContentCard } from '../Layout/ContentCard';
import {
  COLLAPSIBLE_SECTION_HEADER_CLASS,
  useCollapsibleSectionHeaderStyles
} from '../Layout/collapsibleSectionHeaderStyles';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap'
  },
  frameworkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: tokens.spacingHorizontalM
  },
  frameworkCard: {
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    minHeight: '140px',
    ':hover': {
      boxShadow: tokens.shadow8
    }
  },
  frameworkFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto'
  },
  assessmentCard: {
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1
  },
  assessmentRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap'
  },
  assessmentMain: {
    flex: '1 1 320px',
    minWidth: 0,
    cursor: 'pointer'
  },
  assessmentMetrics: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM
  },
  complianceRate: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: '#0d9488'
  },
  progressWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3
  },
  dialogForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    marginTop: tokens.spacingVerticalS
  }
});

export interface IComplianceHubProps {
  complianceService: ComplianceService;
  onOpenFramework: (frameworkId: number) => void;
  onOpenAssessment: (assessmentId: number) => void;
  openCreateAssessmentSignal?: number;
  onDataChanged?: () => void;
}

export const ComplianceHub: React.FC<IComplianceHubProps> = ({
  complianceService,
  onOpenFramework,
  onOpenAssessment,
  openCreateAssessmentSignal,
  onDataChanged
}) => {
  const styles = useStyles();
  const sectionHeaderStyles = useCollapsibleSectionHeaderStyles();
  const [frameworks, setFrameworks] = React.useState<IComplianceFramework[]>([]);
  const [assessments, setAssessments] = React.useState<IComplianceAssessment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [frameworksOpen, setFrameworksOpen] = React.useState(true);
  const [assessmentsOpen, setAssessmentsOpen] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<IComplianceAssessment | undefined>();
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newFrameworkId, setNewFrameworkId] = React.useState('');
  const [newDueDate, setNewDueDate] = React.useState('');

  const loadData = React.useCallback(async (forceRefresh = false, showSpinner = true): Promise<void> => {
    if (showSpinner) {
      setLoading(true);
    }
    setError('');
    try {
      const data = await complianceService.getComplianceDashboardData(forceRefresh);
      setFrameworks(data.frameworks);
      setAssessments(data.assessments);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load compliance data.');
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, [complianceService]);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      await loadData(false, true);
      try {
        await complianceService.waitForComplianceSeed();
        if (active) {
          await loadData(true, false);
        }
      } catch {
        /* Background seed is best-effort. */
      }
    })();
    return () => {
      active = false;
    };
  }, [complianceService, loadData]);

  const prevCreateSignalRef = React.useRef(0);

  React.useEffect(() => {
    const current = openCreateAssessmentSignal ?? 0;
    if (current > prevCreateSignalRef.current) {
      setCreateOpen(true);
    }
    prevCreateSignalRef.current = current;
  }, [openCreateAssessmentSignal]);

  const handleCreate = async (): Promise<void> => {
    if (!newName || !newFrameworkId) {
      return;
    }
    setCreating(true);
    setError('');
    try {
      const assessmentId = await complianceService.createAssessment(
        newName,
        Number(newFrameworkId),
        newDueDate || undefined
      );
      setSuccess('Assessment created.');
      setCreateOpen(false);
      setNewName('');
      setNewFrameworkId('');
      setNewDueDate('');
      await loadData(true);
      onDataChanged?.();
      onOpenAssessment(assessmentId);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create assessment.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    setError('');
    try {
      await complianceService.deleteAssessment(deleteTarget.id);
      setSuccess('Assessment deleted.');
      setDeleteTarget(undefined);
      await loadData(true);
      onDataChanged?.();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete assessment.');
    } finally {
      setDeleting(false);
    }
  };

  const createAssessmentDialog = createOpen ? (
        <Dialog
          open={true}
          modalType="non-modal"
          inertTrapFocus={true}
          onOpenChange={(_, data) => setCreateOpen(!!data.open)}
        >
          <DialogSurface style={{ maxWidth: 520 }}>
            <DialogBody>
              <DialogTitle>New Compliance Assessment</DialogTitle>
              <DialogContent>
                <Text>Create a new assessment against a compliance framework.</Text>
                <div className={styles.dialogForm}>
                  <Field label="Assessment Name" required>
                    <Input
                      value={newName}
                      onChange={(_, data) => setNewName(data.value)}
                      placeholder="e.g. Q1 2026 ISO 27001 Assessment"
                    />
                  </Field>
                  <Field label="Framework" required>
                    <AppDropdown
                      placeholder="Select framework"
                      value={frameworks.find((framework) => String(framework.id) === newFrameworkId)?.name || ''}
                      selectedOptions={newFrameworkId ? [newFrameworkId] : []}
                      onOptionSelect={(_, data) => setNewFrameworkId(data.optionValue || '')}
                    >
                      {frameworks.map((framework) => (
                        <Option key={framework.id} value={String(framework.id)} text={`${framework.name} (${framework.code})`}>
                          {framework.name} ({framework.code})
                        </Option>
                      ))}
                    </AppDropdown>
                  </Field>
                  <Field label="Due Date (optional)">
                    <Input type="date" value={newDueDate} onChange={(_, data) => setNewDueDate(data.value)} />
                  </Field>
                </div>
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button appearance="primary" disabled={!newName || !newFrameworkId || creating} onClick={() => void handleCreate()}>
                  {creating ? 'Creating...' : 'Create Assessment'}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      ) : null;

  const deleteAssessmentDialog = deleteTarget ? (
        <Dialog open={true} onOpenChange={(_, data) => !data.open && setDeleteTarget(undefined)}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Delete Assessment</DialogTitle>
              <DialogContent>
                Delete &quot;{deleteTarget.name}&quot;? This cannot be undone.
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setDeleteTarget(undefined)}>
                  Cancel
                </Button>
                <Button appearance="primary" disabled={deleting} onClick={() => void handleDelete()}>
                  {deleting ? 'Deleting...' : 'Delete Assessment'}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      ) : null;

  if (loading) {
    return (
      <>
        <div className={styles.emptyState}>
          <Spinner size="large" label="Loading compliance..." />
        </div>
        {createAssessmentDialog}
        {deleteAssessmentDialog}
      </>
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

      <div className={styles.headerRow}>
        <div>
          <Text size={500} weight="semibold">
            Manage regulatory compliance and GRC assessments
          </Text>
        </div>
        <Button appearance="primary" icon={<AddRegular />} onClick={() => setCreateOpen(true)}>
          New Assessment
        </Button>
      </div>

      <ContentCard>
        <button
          type="button"
          className={mergeClasses(sectionHeaderStyles.header, COLLAPSIBLE_SECTION_HEADER_CLASS)}
          onClick={() => setFrameworksOpen((value) => !value)}
        >
          <Text weight="semibold">Available Frameworks ({frameworks.length})</Text>
          {frameworksOpen ? <ChevronUpRegular /> : <ChevronDownRegular />}
        </button>
        {frameworksOpen && (
          <div className={styles.frameworkGrid}>
            {frameworks.map((framework) => (
              <div
                key={framework.id}
                className={styles.frameworkCard}
                onClick={() => onOpenFramework(framework.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    onOpenFramework(framework.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className={styles.headerRow}>
                  <Text weight="semibold">{framework.name}</Text>
                  {framework.isBuiltIn && (
                    <Badge appearance="filled" color="success">
                      Built-in
                    </Badge>
                  )}
                </div>
                <Caption1>{framework.description}</Caption1>
                <div className={styles.frameworkFooter}>
                  <Caption1>
                    <BookOpenRegular /> {framework.controlCount} controls
                  </Caption1>
                  <Badge appearance="outline">
                    {framework.code}
                    {framework.version ? ` ${framework.version}` : ''}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentCard>

      <ContentCard>
        <button
          type="button"
          className={mergeClasses(sectionHeaderStyles.header, COLLAPSIBLE_SECTION_HEADER_CLASS)}
          onClick={() => setAssessmentsOpen((value) => !value)}
        >
          <Text weight="semibold">Assessments ({assessments.length})</Text>
          {assessmentsOpen ? <ChevronUpRegular /> : <ChevronDownRegular />}
        </button>
        {assessmentsOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
            {assessments.length === 0 ? (
              <div className={styles.emptyState}>
                <DocumentRegular fontSize={40} />
                <Text>No assessments yet. Create one to get started.</Text>
              </div>
            ) : (
              assessments.map((assessment) => {
                const complianceRate = getComplianceRate(assessment);
                const progressRate = getAssessmentProgressRate(assessment);
                const statusAppearance = getAssessmentStatusAppearance(assessment.status);
                return (
                  <div key={assessment.id} className={styles.assessmentCard}>
                    <div className={styles.assessmentRow}>
                      <div className={styles.assessmentMain} onClick={() => onOpenAssessment(assessment.id)}>
                        <Text weight="semibold">
                          {assessment.name} <ArrowRightRegular />
                        </Text>
                        <Caption1>
                          {assessment.frameworkName} ({assessment.frameworkCode})
                          {assessment.dueDate ? (
                            <>
                              {' '}
                              <ClockRegular /> Due {formatComplianceDate(assessment.dueDate)}
                            </>
                          ) : null}
                        </Caption1>
                        <div className={styles.progressWrap}>
                          <ProgressBar value={progressRate / 100} style={{ flex: 1, maxWidth: 240 }} />
                          <Caption1>
                            {assessment.assessedItems}/{assessment.totalItems} assessed
                          </Caption1>
                        </div>
                      </div>
                      <div className={styles.assessmentMetrics}>
                        <div>
                          <div className={styles.complianceRate}>{complianceRate}%</div>
                          <Caption1>
                            {assessment.compliantItems}/{assessment.totalItems} compliant
                          </Caption1>
                        </div>
                        <Badge appearance="filled" color={statusAppearance.color}>
                          {assessment.status}
                        </Badge>
                        <Button
                          appearance="subtle"
                          icon={<DeleteRegular />}
                          onClick={() => setDeleteTarget(assessment)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </ContentCard>

      {createAssessmentDialog}
      {deleteAssessmentDialog}
    </div>
  );
};

export const ComplianceHubIcon = ShieldCheckmarkRegular;
