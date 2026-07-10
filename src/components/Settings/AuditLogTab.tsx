import * as React from 'react';
import {
  Badge,
  Caption1,
  Spinner,
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
import { ContentCard } from '../Layout/ContentCard';
import { EmptyState } from '../Layout/EmptyState';
import { ListFiltersBar } from '../ListView/ListFiltersBar';
import { SettingsPageHeader } from './SettingsPageHeader';
import { AuditLogDetailsCell } from './AuditLogDetailsPanel';
import { IAuditLogEntry } from '../../models/IAuditLog';
import { AssetService } from '../../services/AssetService';
import {
  AUDIT_ACTION_LABELS,
  formatAuditActionLabel,
  formatAuditEntityLabel
} from '../../utils/auditLogDisplayUtils';
import { HistoryRegular } from '@fluentui/react-icons';
import { DATA_TABLE_CLASS } from '../../lib/list-view/columnWidths';

const useStyles = makeStyles({
  content: {
    padding: tokens.spacingHorizontalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  summaryPanel: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2
  },
  summaryPrimary: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: tokens.spacingVerticalXXS,
    minWidth: '140px',
    paddingRight: tokens.spacingHorizontalM,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`
  },
  summaryCount: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: 1.1,
    color: tokens.colorBrandForeground1
  },
  summaryBreakdown: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    flex: '1 1 auto'
  },
  summaryChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusCircular,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1
  },
  tableWrap: {
    overflowX: 'auto',
    width: '100%',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge
  },
  table: {
    minWidth: '920px'
  },
  whenCell: {
    whiteSpace: 'nowrap',
    width: '170px',
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200
  },
  userCell: {
    minWidth: '160px',
    maxWidth: '220px'
  },
  actionCell: {
    width: '130px'
  },
  entityCell: {
    minWidth: '120px',
    maxWidth: '160px'
  },
  idCell: {
    width: '80px',
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200
  },
  detailsCell: {
    minWidth: '280px',
    maxWidth: '420px'
  },
  headerCell: {
    backgroundColor: tokens.colorNeutralBackground2,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1
  }
});

const ACTION_OPTIONS = Object.keys(AUDIT_ACTION_LABELS);

const ENTITY_OPTIONS = [
  'AM_Assets',
  'Categories',
  'SubCategories',
  'Business',
  'Projects',
  'Likelihood',
  'Consequences',
  'RiskProfile',
  'RiskResponse',
  'RiskStrategy',
  'AppSettings',
  'FormTemplates',
  'ComplianceAssessments',
  'ComplianceAssessmentItems',
  'ComplianceFrameworks'
];

function formatTimestamp(value: string): string {
  try {
    return new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return value;
  }
}

function actionColor(action: string): 'success' | 'warning' | 'danger' | 'informative' | 'subtle' {
  switch (action) {
    case 'CREATE':
      return 'success';
    case 'UPDATE':
    case 'SETTINGS_UPDATE':
      return 'informative';
    case 'DELETE':
      return 'danger';
    default:
      return 'subtle';
  }
}

export interface IAuditLogTabProps {
  riskService: AssetService;
}

export const AuditLogTab: React.FC<IAuditLogTabProps> = ({ riskService }) => {
  const styles = useStyles();
  const [logs, setLogs] = React.useState<IAuditLogEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [actionFilter, setActionFilter] = React.useState('all');
  const [entityFilter, setEntityFilter] = React.useState('all');
  const [stats, setStats] = React.useState({ total: 0, byAction: {} as Record<string, number> });

  const loadLogs = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await riskService.ensureAuditLogReady();
      const [entries, summary] = await Promise.all([
        riskService.getAuditLogs({
          action: actionFilter === 'all' ? undefined : actionFilter,
          entity: entityFilter === 'all' ? undefined : entityFilter,
          search: search.trim() || undefined,
          limit: 300
        }),
        riskService.getAuditLogStats()
      ]);
      setLogs(entries);
      setStats(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [riskService, actionFilter, entityFilter, search]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLogs();
    }, search.trim() ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [loadLogs, search]);

  const activeActionStats = ACTION_OPTIONS.filter((action) => stats.byAction[action] > 0);

  return (
    <ContentCard
      flushBody
      pageHeader={
        <SettingsPageHeader
          embedded
          title="Audit Log"
          description="Track create, update, and delete operations across assets, lookups, settings, and compliance."
          icon={HistoryRegular}
        />
      }
      filtersBar={
        <ListFiltersBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by user, entity, action, or details..."
          showClear={Boolean(search.trim()) || actionFilter !== 'all' || entityFilter !== 'all'}
          onClear={() => {
            setSearch('');
            setActionFilter('all');
            setEntityFilter('all');
          }}
          dropdowns={[
            {
              key: 'action',
              placeholder: 'All actions',
              value: actionFilter,
              onChange: (value) => setActionFilter(value || 'all'),
              options: [
                { value: 'all', label: 'All actions' },
                ...ACTION_OPTIONS.map((action) => ({
                  value: action,
                  label: formatAuditActionLabel(action)
                }))
              ]
            },
            {
              key: 'entity',
              placeholder: 'All entities',
              value: entityFilter,
              onChange: (value) => setEntityFilter(value || 'all'),
              options: [
                { value: 'all', label: 'All entities' },
                ...ENTITY_OPTIONS.map((entity) => ({
                  value: entity,
                  label: formatAuditEntityLabel(entity)
                }))
              ]
            }
          ]}
        />
      }
    >
      <div className={styles.content}>
        <div className={styles.summaryPanel}>
          <div className={styles.summaryPrimary}>
            <span className={styles.summaryCount}>{stats.total}</span>
            <Caption1>Entries in the last 30 days</Caption1>
          </div>
          {activeActionStats.length > 0 ? (
            <div className={styles.summaryBreakdown}>
              {activeActionStats.map((action) => (
                <div key={action} className={styles.summaryChip}>
                  <Badge appearance="outline" color={actionColor(action)}>
                    {formatAuditActionLabel(action)}
                  </Badge>
                  <Text weight="semibold">{stats.byAction[action]}</Text>
                </div>
              ))}
            </div>
          ) : (
            <Caption1>No activity recorded yet in this period.</Caption1>
          )}
        </div>

        {error ? <Text className={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <Spinner label="Loading audit log..." />
        ) : logs.length === 0 ? (
          <EmptyState
            bordered
            icon={<HistoryRegular />}
            title="No audit entries yet"
            description="Create, update, or delete records to populate the audit log."
          />
        ) : (
          <div className={styles.tableWrap}>
            <Table aria-label="Audit log" className={`${styles.table} ${DATA_TABLE_CLASS}`}>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell className={styles.headerCell}>When</TableHeaderCell>
                  <TableHeaderCell className={styles.headerCell}>User</TableHeaderCell>
                  <TableHeaderCell className={styles.headerCell}>Action</TableHeaderCell>
                  <TableHeaderCell className={styles.headerCell}>Entity</TableHeaderCell>
                  <TableHeaderCell className={styles.headerCell}>ID</TableHeaderCell>
                  <TableHeaderCell className={styles.headerCell}>Details</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className={styles.whenCell}>{formatTimestamp(entry.timestamp)}</TableCell>
                    <TableCell className={styles.userCell}>
                      <Text weight="semibold">{entry.userDisplayName || 'System'}</Text>
                      {entry.userEmail ? <Caption1 block>{entry.userEmail}</Caption1> : null}
                    </TableCell>
                    <TableCell className={styles.actionCell}>
                      <Badge appearance="filled" color={actionColor(String(entry.action))}>
                        {formatAuditActionLabel(String(entry.action))}
                      </Badge>
                    </TableCell>
                    <TableCell className={styles.entityCell}>
                      {formatAuditEntityLabel(entry.entity)}
                    </TableCell>
                    <TableCell className={styles.idCell}>{entry.entityId || '—'}</TableCell>
                    <TableCell className={styles.detailsCell}>
                      <AuditLogDetailsCell entry={entry} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </ContentCard>
  );
};
