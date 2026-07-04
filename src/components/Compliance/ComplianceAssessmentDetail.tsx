import * as React from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Badge,
  Button,
  Caption1,
  Field,
  MessageBar,
  MessageBarBody,
  Option,
  ProgressBar,
  Spinner,
  Text,
  Textarea,
  makeStyles,
  shorthands,
  tokens
} from '@fluentui/react-components';
import { AppDropdown } from '../Dropdown/AppDropdown';
import {
  AddRegular,
  ArrowLeftRegular,
  ClockRegular,
  DeleteRegular,
  DismissRegular,
  LinkRegular,
  SaveRegular
} from '@fluentui/react-icons';
import {
  ASSESSMENT_STATUSES,
  COMPLIANCE_ITEM_STATUSES,
  IComplianceAssessmentDetail
} from '../../models/ICompliance';
import {
  IRiskControlLink,
  IRiskLinkOption,
  RISK_CONTROL_LINK_TYPES,
  RiskControlLinkType
} from '../../models/IRiskControlLink';
import { ComplianceService } from '../../services/ComplianceService';
import {
  formatComplianceDate,
  getAssessmentStatusAppearance,
  getItemStatusAppearance,
  summarizeAssessmentItems
} from '../../utils/complianceAnalytics';
import { ContentCard } from '../Layout/ContentCard';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL
  },
  headerCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1
  },
  headerTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalL,
    flexWrap: 'wrap'
  },
  headerMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    minWidth: 0,
    flex: '1 1 320px'
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    color: tokens.colorNeutralForeground3
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    flexShrink: 0
  },
  statusDropdown: {
    minWidth: '180px'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
  },
  kpiCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
    minWidth: 0
  },
  kpiLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  kpiValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: 1.1
  },
  kpiStatList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    marginTop: tokens.spacingVerticalXXS
  },
  kpiStatRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2
  },
  kpiStatValue: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  },
  filtersBar: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    padding: tokens.spacingHorizontalM,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1
  },
  filterDropdown: {
    minWidth: '180px',
    maxWidth: '240px',
    flex: '1 1 180px'
  },
  filterActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    marginLeft: 'auto'
  },
  accordionWrap: {
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden'
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    width: '100%',
    minWidth: 0
  },
  itemHeaderMain: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: tokens.spacingVerticalXXS,
    minWidth: 0,
    flex: '1 1 auto'
  },
  itemTitleRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    minWidth: 0
  },
  controlCode: {
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
    flexShrink: 0
  },
  itemTitle: {
    minWidth: 0,
    wordBreak: 'break-word'
  },
  itemStatusBadge: {
    flexShrink: 0
  },
  itemForm: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr'
    }
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3
  },
  emptyFilters: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXL,
    color: tokens.colorNeutralForeground3
  },
  linkSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    marginTop: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`
  },
  linkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },
  linkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  linkRisk: {
    fontWeight: tokens.fontWeightSemibold
  },
  linkAddRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  linkPicker: {
    minWidth: '220px',
    flex: '1 1 220px'
  },
  linkTypePicker: {
    minWidth: '150px'
  }
});

export interface IComplianceAssessmentDetailProps {
  complianceService: ComplianceService;
  assessmentId: number;
  onBack: () => void;
  onDeleted: () => void;
  onDataChanged?: () => void;
}

export const ComplianceAssessmentDetail: React.FC<IComplianceAssessmentDetailProps> = ({
  complianceService,
  assessmentId,
  onBack,
  onDeleted,
  onDataChanged
}) => {
  const styles = useStyles();
  const [assessment, setAssessment] = React.useState<IComplianceAssessmentDetail | undefined>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [openItems, setOpenItems] = React.useState<Set<number>>(new Set());
  const [localEdits, setLocalEdits] = React.useState<
    Record<number, { status?: string; evidence?: string; notes?: string }>
  >({});
  const [savingItemId, setSavingItemId] = React.useState<number | undefined>();
  const [statusUpdating, setStatusUpdating] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [links, setLinks] = React.useState<IRiskControlLink[]>([]);
  const [riskOptions, setRiskOptions] = React.useState<IRiskLinkOption[]>([]);
  const [linkDrafts, setLinkDrafts] = React.useState<
    Record<number, { riskId?: number; linkType: RiskControlLinkType }>
  >({});
  const [linkBusyControlId, setLinkBusyControlId] = React.useState<number | undefined>();
  const [removingLinkId, setRemovingLinkId] = React.useState<number | undefined>();

  const loadAssessment = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const detail = await complianceService.getAssessmentDetail(assessmentId);
      setAssessment(detail);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load assessment.');
    } finally {
      setLoading(false);
    }
  }, [assessmentId, complianceService]);

  const loadLinks = React.useCallback(
    async (frameworkCode?: string) => {
      if (!frameworkCode) {
        setLinks([]);
        return;
      }
      try {
        const result = await complianceService.getControlRiskLinks(frameworkCode);
        setLinks(result);
      } catch {
        setLinks([]);
      }
    },
    [complianceService]
  );

  React.useEffect(() => {
    void loadAssessment();
  }, [loadAssessment]);

  React.useEffect(() => {
    void loadLinks(assessment?.frameworkCode);
  }, [assessment?.frameworkCode, loadLinks]);

  React.useEffect(() => {
    let active = true;
    complianceService
      .getRiskLinkOptions()
      .then((options) => {
        if (active) {
          setRiskOptions(options);
        }
      })
      .catch(() => {
        if (active) {
          setRiskOptions([]);
        }
      });
    return () => {
      active = false;
    };
  }, [complianceService]);

  const linksByControl = React.useMemo(() => {
    const map = new Map<number, IRiskControlLink[]>();
    links.forEach((link) => {
      const existing = map.get(link.controlId);
      if (existing) {
        existing.push(link);
      } else {
        map.set(link.controlId, [link]);
      }
    });
    return map;
  }, [links]);

  const handleAddLink = async (controlId: number): Promise<void> => {
    const draft = linkDrafts[controlId];
    if (!draft?.riskId) {
      setError('Select a risk to link.');
      return;
    }
    setLinkBusyControlId(controlId);
    setError('');
    try {
      await complianceService.addRiskControlLink(
        draft.riskId,
        controlId,
        draft.linkType || RISK_CONTROL_LINK_TYPES[0]
      );
      setLinkDrafts((previous) => {
        const next = { ...previous };
        delete next[controlId];
        return next;
      });
      setSuccess('Risk linked to control.');
      await loadLinks(assessment?.frameworkCode);
      onDataChanged?.();
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : 'Failed to link risk.');
    } finally {
      setLinkBusyControlId(undefined);
    }
  };

  const handleRemoveLink = async (linkId: number): Promise<void> => {
    setRemovingLinkId(linkId);
    setError('');
    try {
      await complianceService.removeRiskControlLink(linkId);
      setSuccess('Risk link removed.');
      await loadLinks(assessment?.frameworkCode);
      onDataChanged?.();
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : 'Failed to remove link.');
    } finally {
      setRemovingLinkId(undefined);
    }
  };

  const renderControlLinks = (controlId: number): React.ReactNode => {
    const controlLinks = linksByControl.get(controlId) || [];
    const linkedRiskIds = new Set(controlLinks.map((link) => link.riskId));
    const availableRisks = riskOptions.filter((risk) => !linkedRiskIds.has(risk.id));
    const draft = linkDrafts[controlId] || { linkType: RISK_CONTROL_LINK_TYPES[0] };
    const selectedRisk = availableRisks.find((risk) => risk.id === draft.riskId);
    const riskLabel = (risk: IRiskLinkOption): string =>
      risk.riskRef ? `${risk.riskRef} · ${risk.title}` : risk.title;

    return (
      <div className={styles.linkSection}>
        <Text size={200} weight="semibold">
          <LinkRegular /> Linked risks ({controlLinks.length})
        </Text>
        {controlLinks.length > 0 ? (
          <div className={styles.linkList}>
            {controlLinks.map((link) => (
              <div key={link.id} className={styles.linkRow}>
                <Badge appearance="tint" color="brand">
                  {link.linkType}
                </Badge>
                <Text size={200} className={styles.linkRisk}>
                  {link.riskRef ? `${link.riskRef} · ` : ''}
                  {link.riskTitle}
                </Text>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<DismissRegular />}
                  disabled={removingLinkId === link.id}
                  onClick={() => void handleRemoveLink(link.id)}
                  aria-label="Remove risk link"
                >
                  {removingLinkId === link.id ? 'Removing...' : 'Remove'}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <Caption1>No risks linked to this control yet.</Caption1>
        )}
        <div className={styles.linkAddRow}>
          <Field label="Risk" className={styles.linkPicker}>
            <AppDropdown
              placeholder={availableRisks.length === 0 ? 'No risks available' : 'Select a risk'}
              disabled={availableRisks.length === 0}
              value={selectedRisk ? riskLabel(selectedRisk) : ''}
              selectedOptions={draft.riskId ? [String(draft.riskId)] : []}
              onOptionSelect={(_, data) =>
                setLinkDrafts((previous) => ({
                  ...previous,
                  [controlId]: {
                    linkType: previous[controlId]?.linkType || RISK_CONTROL_LINK_TYPES[0],
                    riskId: data.optionValue ? Number(data.optionValue) : undefined
                  }
                }))
              }
            >
              {availableRisks.map((risk) => (
                <Option key={risk.id} value={String(risk.id)} text={riskLabel(risk)}>
                  {riskLabel(risk)}
                </Option>
              ))}
            </AppDropdown>
          </Field>
          <Field label="Relationship" className={styles.linkTypePicker}>
            <AppDropdown
              value={draft.linkType}
              selectedOptions={[draft.linkType]}
              onOptionSelect={(_, data) =>
                setLinkDrafts((previous) => ({
                  ...previous,
                  [controlId]: {
                    riskId: previous[controlId]?.riskId,
                    linkType: (data.optionValue as RiskControlLinkType) || RISK_CONTROL_LINK_TYPES[0]
                  }
                }))
              }
            >
              {RISK_CONTROL_LINK_TYPES.map((type) => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </AppDropdown>
          </Field>
          <Button
            appearance="secondary"
            icon={<AddRegular />}
            disabled={!draft.riskId || linkBusyControlId === controlId}
            onClick={() => void handleAddLink(controlId)}
          >
            {linkBusyControlId === controlId ? 'Linking...' : 'Link risk'}
          </Button>
        </div>
      </div>
    );
  };

  const setLocalEdit = (itemId: number, field: 'status' | 'evidence' | 'notes', value: string): void => {
    setLocalEdits((previous) => ({
      ...previous,
      [itemId]: { ...previous[itemId], [field]: value }
    }));
  };

  const handleSaveItem = async (itemId: number): Promise<void> => {
    const item = assessment?.items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }
    const edits = localEdits[itemId];
    setSavingItemId(itemId);
    setError('');
    try {
      await complianceService.updateAssessmentItem(
        itemId,
        (edits?.status || item.status) as (typeof COMPLIANCE_ITEM_STATUSES)[number],
        edits?.evidence ?? item.evidence ?? '',
        edits?.notes ?? item.notes ?? ''
      );
      setLocalEdits((previous) => {
        const next = { ...previous };
        delete next[itemId];
        return next;
      });
      setSuccess('Changes saved.');
      await loadAssessment();
      onDataChanged?.();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save item.');
    } finally {
      setSavingItemId(undefined);
    }
  };

  const handleStatusChange = async (status: string): Promise<void> => {
    setStatusUpdating(true);
    setError('');
    try {
      await complianceService.updateAssessmentStatus(
        assessmentId,
        status as (typeof ASSESSMENT_STATUSES)[number]
      );
      setSuccess(`Assessment status updated to ${status}.`);
      await loadAssessment();
      onDataChanged?.();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Failed to update status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    setDeleting(true);
    setError('');
    try {
      await complianceService.deleteAssessment(assessmentId);
      onDeleted();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete assessment.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <Spinner size="large" label="Loading assessment..." />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className={styles.root}>
        <MessageBar intent="error">
          <MessageBarBody>{error || 'Assessment not found.'}</MessageBarBody>
        </MessageBar>
        <Button appearance="subtle" icon={<ArrowLeftRegular />} onClick={onBack}>
          Back
        </Button>
      </div>
    );
  }

  const summary = summarizeAssessmentItems(assessment.items);
  const coveredControlCount = assessment.items.filter(
    (item) => (linksByControl.get(item.controlId)?.length || 0) > 0
  ).length;
  const coveragePercent =
    assessment.items.length > 0
      ? Math.round((coveredControlCount / assessment.items.length) * 100)
      : 0;
  const categories = Array.from(new Set(assessment.items.map((item) => item.category).filter(Boolean))).sort();
  const filteredItems = assessment.items.filter((item) => {
    if (filterStatus !== 'all' && item.status !== filterStatus) {
      return false;
    }
    if (filterCategory !== 'all' && item.category !== filterCategory) {
      return false;
    }
    return true;
  });
  const statusAppearance = getAssessmentStatusAppearance(assessment.status);

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

      <div className={styles.headerCard}>
        <Button appearance="subtle" icon={<ArrowLeftRegular />} onClick={onBack}>
          Back to assessments
        </Button>
        <div className={styles.headerTop}>
          <div className={styles.headerMain}>
            <div className={styles.titleRow}>
              <Text size={600} weight="semibold">
                {assessment.name}
              </Text>
              <Badge appearance="filled" color={statusAppearance.color}>
                {assessment.status}
              </Badge>
            </div>
            <div className={styles.metaRow}>
              <Text size={200}>
                {assessment.frameworkName}
                {assessment.frameworkVersion ? ` (${assessment.frameworkVersion})` : ''}
              </Text>
              {assessment.dueDate ? (
                <Text size={200}>
                  <ClockRegular /> Due {formatComplianceDate(assessment.dueDate)}
                </Text>
              ) : null}
            </div>
          </div>
          <div className={styles.headerActions}>
            <AppDropdown
              className={styles.statusDropdown}
              placeholder="Assessment status"
              value={assessment.status}
              selectedOptions={[assessment.status]}
              disabled={statusUpdating}
              onOptionSelect={(_, data) => data.optionValue && void handleStatusChange(data.optionValue)}
            >
              {ASSESSMENT_STATUSES.map((status) => (
                <Option key={status} value={status}>
                  {status}
                </Option>
              ))}
            </AppDropdown>
            <Button
              appearance="subtle"
              icon={<DeleteRegular />}
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          </div>
        </div>

        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Compliance rate</span>
            <span className={styles.kpiValue}>{summary.complianceRate}%</span>
            <ProgressBar value={summary.complianceRate / 100} />
            <Caption1>
              {summary.compliant} of {summary.compliant + summary.nonCompliant + summary.partial} rated controls
              compliant
            </Caption1>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Assessment progress</span>
            <span className={styles.kpiValue}>{summary.assessmentProgress}%</span>
            <ProgressBar value={summary.assessmentProgress / 100} />
            <Caption1>
              {assessment.items.length - summary.notAssessed} of {assessment.items.length} controls assessed
            </Caption1>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Status breakdown</span>
            <div className={styles.kpiStatList}>
              <div className={styles.kpiStatRow}>
                <span>Compliant</span>
                <span className={styles.kpiStatValue}>{summary.compliant}</span>
              </div>
              <div className={styles.kpiStatRow}>
                <span>Non-compliant</span>
                <span className={styles.kpiStatValue}>{summary.nonCompliant}</span>
              </div>
              <div className={styles.kpiStatRow}>
                <span>Partial</span>
                <span className={styles.kpiStatValue}>{summary.partial}</span>
              </div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Assessment totals</span>
            <div className={styles.kpiStatList}>
              <div className={styles.kpiStatRow}>
                <span>Not assessed</span>
                <span className={styles.kpiStatValue}>{summary.notAssessed}</span>
              </div>
              <div className={styles.kpiStatRow}>
                <span>N/A</span>
                <span className={styles.kpiStatValue}>{summary.notApplicable}</span>
              </div>
              <div className={styles.kpiStatRow}>
                <span>Total controls</span>
                <span className={styles.kpiStatValue}>{assessment.items.length}</span>
              </div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Risk coverage</span>
            <span className={styles.kpiValue}>{coveragePercent}%</span>
            <ProgressBar value={coveragePercent / 100} />
            <Caption1>
              {coveredControlCount} of {assessment.items.length} controls linked to a risk
              {links.length > 0 ? ` (${links.length} link${links.length === 1 ? '' : 's'})` : ''}
            </Caption1>
          </div>
        </div>
      </div>

      <div className={styles.filtersBar}>
        <AppDropdown
          className={styles.filterDropdown}
          value={filterStatus === 'all' ? 'All Statuses' : filterStatus}
          selectedOptions={[filterStatus]}
          onOptionSelect={(_, data) => setFilterStatus(data.optionValue || 'all')}
        >
          <Option value="all">All Statuses</Option>
          {COMPLIANCE_ITEM_STATUSES.map((status) => (
            <Option key={status} value={status}>
              {status}
            </Option>
          ))}
        </AppDropdown>
        <AppDropdown
          className={styles.filterDropdown}
          value={filterCategory === 'all' ? 'All Categories' : filterCategory}
          selectedOptions={[filterCategory]}
          onOptionSelect={(_, data) => setFilterCategory(data.optionValue || 'all')}
        >
          <Option value="all">All Categories</Option>
          {categories.map((category) => (
            <Option key={category} value={category}>
              {category}
            </Option>
          ))}
        </AppDropdown>
        <div className={styles.filterActions}>
          <Button
            appearance="secondary"
            onClick={() => setOpenItems(new Set(filteredItems.map((item) => item.id)))}
            disabled={filteredItems.length === 0}
          >
            Expand all
          </Button>
          <Button appearance="secondary" onClick={() => setOpenItems(new Set())} disabled={filteredItems.length === 0}>
            Collapse all
          </Button>
          <Button
            appearance="subtle"
            icon={<DismissRegular />}
            disabled={filterStatus === 'all' && filterCategory === 'all'}
            onClick={() => {
              setFilterStatus('all');
              setFilterCategory('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className={styles.emptyFilters}>
          <Text>No controls match the current filters.</Text>
        </div>
      ) : (
      <div className={styles.accordionWrap}>
      <Accordion
        multiple
        openItems={Array.from(openItems).map(String)}
        onToggle={(_, data) => {
          const next = new Set(openItems);
          const value = Number(data.value);
          if (data.openItems?.includes(data.value)) {
            next.add(value);
          } else {
            next.delete(value);
          }
          setOpenItems(next);
        }}
      >
        {filteredItems.map((item) => {
          const edits = localEdits[item.id];
          const itemAppearance = getItemStatusAppearance(item.status);
          return (
            <AccordionItem key={item.id} value={String(item.id)}>
              <AccordionHeader expandIconPosition="start">
                <div className={styles.itemHeader}>
                  <div className={styles.itemHeaderMain}>
                    <div className={styles.itemTitleRow}>
                      <span className={styles.controlCode}>{item.controlCode}</span>
                      <Text weight="semibold" className={styles.itemTitle}>
                        {item.title}
                      </Text>
                    </div>
                    {item.category ? (
                      <Badge appearance="outline" size="small">
                        {item.category}
                      </Badge>
                    ) : null}
                  </div>
                  <Badge appearance="filled" color={itemAppearance.color} className={styles.itemStatusBadge}>
                    {edits?.status || item.status}
                  </Badge>
                </div>
              </AccordionHeader>
              <AccordionPanel>
                <ContentCard>
                  <div className={styles.itemForm}>
                    <Field label="Status">
                      <AppDropdown
                        value={edits?.status || item.status}
                        selectedOptions={[edits?.status || item.status]}
                        onOptionSelect={(_, data) =>
                          data.optionValue && setLocalEdit(item.id, 'status', data.optionValue)
                        }
                      >
                        {COMPLIANCE_ITEM_STATUSES.map((status) => (
                          <Option key={status} value={status}>
                            {status}
                          </Option>
                        ))}
                      </AppDropdown>
                    </Field>
                    <Field label="Evidence">
                      <Textarea
                        value={edits?.evidence ?? item.evidence ?? ''}
                        onChange={(_, data) => setLocalEdit(item.id, 'evidence', data.value)}
                        placeholder="Describe evidence of compliance, link to documents..."
                        rows={4}
                        resize="vertical"
                      />
                    </Field>
                  </div>
                  <Field label="Notes">
                    <Textarea
                      value={edits?.notes ?? item.notes ?? ''}
                      onChange={(_, data) => setLocalEdit(item.id, 'notes', data.value)}
                      placeholder="Additional observations, remediation plans..."
                      rows={3}
                      resize="vertical"
                    />
                  </Field>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      appearance="primary"
                      icon={<SaveRegular />}
                      disabled={savingItemId === item.id}
                      onClick={() => void handleSaveItem(item.id)}
                    >
                      {savingItemId === item.id ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                  {renderControlLinks(item.controlId)}
                </ContentCard>
              </AccordionPanel>
            </AccordionItem>
          );
        })}
      </Accordion>
      </div>
      )}
    </div>
  );
};
