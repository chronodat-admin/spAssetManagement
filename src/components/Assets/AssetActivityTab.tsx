import * as React from 'react';
import {
  Badge,
  Caption1,
  makeStyles,
  mergeClasses,
  shorthands,
  Spinner,
  Text,
  tokens
} from '@fluentui/react-components';
import { HistoryRegular } from '@fluentui/react-icons';
import type { BuiltFormConfig } from '../../lib/form-config/types';
import type { IAssetVersionHistoryEntry } from '../../models/IAssetVersionHistory';
import { AssetService } from '../../services/AssetService';
import { formatVersionTimestamp } from '../../utils/assetVersionHistory';
import { EmptyState } from '../Layout/EmptyState';
import { UserAvatar } from '../PeoplePicker/UserAvatar';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0
  },
  entry: {
    display: 'grid',
    gridTemplateColumns: '28px minmax(0, 1fr)',
    gap: tokens.spacingHorizontalM,
    position: 'relative'
  },
  rail: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: tokens.spacingVerticalXS
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('2px', 'solid', tokens.colorBrandStroke1),
    flexShrink: 0,
    zIndex: 1
  },
  dotCurrent: {
    backgroundColor: tokens.colorBrandBackground,
    ...shorthands.border('2px', 'solid', tokens.colorBrandBackground)
  },
  dotCreated: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    ...shorthands.border('2px', 'solid', tokens.colorPaletteGreenBorder2)
  },
  connector: {
    width: '2px',
    flexGrow: 1,
    minHeight: '16px',
    backgroundColor: tokens.colorNeutralStroke2,
    marginTop: tokens.spacingVerticalXS
  },
  card: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM
  },
  cardHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS
  },
  cardTitleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  editorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalXS
  },
  changes: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    marginTop: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalS,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`
  },
  changeRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(120px, 180px) minmax(0, 1fr)',
    gap: tokens.spacingHorizontalS,
    alignItems: 'start',
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr'
    }
  },
  changeLabel: {
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightSemibold
  },
  changeValues: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS
  },
  previousValue: {
    color: tokens.colorNeutralForeground3,
    textDecoration: 'line-through'
  },
  newValue: {
    color: tokens.colorNeutralForeground1
  },
  noChanges: {
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic'
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1
  }
});

export interface IAssetActivityTabProps {
  riskId: number;
  riskService: AssetService;
  formConfig?: BuiltFormConfig;
}

export const AssetActivityTab: React.FC<IAssetActivityTabProps> = ({
  riskId,
  riskService,
  formConfig
}) => {
  const styles = useStyles();
  const [entries, setEntries] = React.useState<IAssetVersionHistoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;

    const loadHistory = async (): Promise<void> => {
      setLoading(true);
      setError('');
      try {
        const history = await riskService.getRiskVersionHistory(riskId, formConfig);
        if (!cancelled) {
          setEntries(history);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load version history.');
          setEntries([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [riskId, riskService, formConfig]);

  if (loading) {
    return <Spinner label="Loading activity..." />;
  }

  if (error) {
    return <Text className={styles.errorText}>{error}</Text>;
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        bordered
        icon={<HistoryRegular />}
        title="No version history"
        description="Changes to this asset will appear here after the first save."
      />
    );
  }

  return (
    <div className={styles.root} role="tabpanel" aria-label="Asset activity">
      <Caption1>
        SharePoint version history for tracked asset fields.
      </Caption1>

      <div className={styles.timeline}>
        {entries.map((entry, index) => (
          <div key={entry.versionId} className={styles.entry}>
            <div className={styles.rail}>
              <div
                className={mergeClasses(
                  styles.dot,
                  entry.isCurrent && styles.dotCurrent,
                  entry.isCreated && styles.dotCreated
                )}
              />
              {index < entries.length - 1 ? <div className={styles.connector} /> : null}
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitleRow}>
                    <Text weight="semibold">
                      {entry.isCreated ? 'Asset created' : `Version ${entry.versionLabel}`}
                    </Text>
                    {entry.isCurrent ? (
                      <Badge appearance="filled" color="brand">
                        Current
                      </Badge>
                    ) : null}
                    {entry.isCreated ? (
                      <Badge appearance="outline" color="success">
                        Created
                      </Badge>
                    ) : null}
                  </div>
                  <Caption1>{formatVersionTimestamp(entry.createdAt)}</Caption1>
                  <div className={styles.editorRow}>
                    <UserAvatar name={entry.editorName} email={entry.editorEmail} size={28} />
                    <Text size={300}>{entry.editorName}</Text>
                  </div>
                </div>
              </div>

              {entry.changes.length > 0 ? (
                <div className={styles.changes}>
                  {entry.changes.map((change) => (
                    <div key={`${entry.versionId}-${change.fieldLabel}`} className={styles.changeRow}>
                      <Text size={300} className={styles.changeLabel}>
                        {change.fieldLabel}
                      </Text>
                      <div className={styles.changeValues}>
                        {change.previousValue ? (
                          <Text size={300} className={styles.previousValue}>
                            {change.previousValue}
                          </Text>
                        ) : null}
                        {change.newValue ? (
                          <Text size={300} className={styles.newValue}>
                            {entry.isCreated || !change.previousValue
                              ? change.newValue
                              : `→ ${change.newValue}`}
                          </Text>
                        ) : (
                          <Text size={300} className={styles.noChanges}>
                            Cleared
                          </Text>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Text size={300} className={styles.noChanges}>
                  {entry.isCreated
                    ? 'Initial version with no tracked field values.'
                    : 'No changes to tracked fields in this version. SharePoint may have saved Asset ID, attachments, custom form data, or other fields not shown here.'}
                </Text>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
