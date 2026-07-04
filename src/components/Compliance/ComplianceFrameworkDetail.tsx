import * as React from 'react';
import {
  Badge,
  Button,
  Caption1,
  MessageBar,
  MessageBarBody,
  Spinner,
  Text,
  makeStyles,
  shorthands,
  tokens
} from '@fluentui/react-components';
import { ArrowLeftRegular, BookOpenRegular } from '@fluentui/react-icons';
import { IComplianceControl, IComplianceFramework } from '../../models/ICompliance';
import { ComplianceService } from '../../services/ComplianceService';
import { groupControlsByCategory } from '../../utils/complianceAnalytics';
import { ContentCard } from '../Layout/ContentCard';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  categoryBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  controlRow: {
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground1
  },
  controlCode: {
    color: '#0d9488',
    fontWeight: tokens.fontWeightSemibold,
    marginRight: tokens.spacingHorizontalS
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL
  }
});

export interface IComplianceFrameworkDetailProps {
  complianceService: ComplianceService;
  frameworkId: number;
  onBack: () => void;
}

export const ComplianceFrameworkDetail: React.FC<IComplianceFrameworkDetailProps> = ({
  complianceService,
  frameworkId,
  onBack
}) => {
  const styles = useStyles();
  const [framework, setFramework] = React.useState<IComplianceFramework | undefined>();
  const [controls, setControls] = React.useState<IComplianceControl[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let active = true;
    const load = async (): Promise<void> => {
      setLoading(true);
      setError('');
      try {
        const [frameworkRow, controlRows] = await Promise.all([
          complianceService.getFrameworkById(frameworkId, false),
          complianceService.getFrameworkControls(frameworkId)
        ]);
        if (!active) {
          return;
        }
        setFramework(frameworkRow);
        setControls(controlRows);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load framework.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [complianceService, frameworkId]);

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <Spinner size="large" label="Loading framework..." />
      </div>
    );
  }

  if (!framework) {
    return (
      <div className={styles.root}>
        <MessageBar intent="error">
          <MessageBarBody>{error || 'Framework not found.'}</MessageBarBody>
        </MessageBar>
        <Button appearance="subtle" icon={<ArrowLeftRegular />} onClick={onBack}>
          Back to Compliance
        </Button>
      </div>
    );
  }

  const grouped = groupControlsByCategory(controls);

  return (
    <div className={styles.root}>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <Button appearance="subtle" icon={<ArrowLeftRegular />} onClick={onBack}>
        Back to Compliance
      </Button>

      <div className={styles.header}>
        <div className={styles.badgeRow}>
          <BookOpenRegular fontSize={24} color="#0d9488" />
          <Text size={600} weight="semibold">
            {framework.name}
          </Text>
          {framework.isBuiltIn && (
            <Badge appearance="filled" color="success">
              Built-in
            </Badge>
          )}
          <Badge appearance="outline">
            {framework.code}
            {framework.version ? ` ${framework.version}` : ''}
          </Badge>
        </div>
        <Caption1>{framework.description}</Caption1>
        <Caption1>{controls.length} controls</Caption1>
      </div>

      {grouped.map((group) => (
        <ContentCard key={group.category || 'all'}>
          {group.category && <Text weight="semibold">{group.category}</Text>}
          <div className={styles.categoryBlock}>
            {group.items.map((control) => (
              <div key={control.id} className={styles.controlRow}>
                <Text>
                  <span className={styles.controlCode}>{control.controlCode}</span>
                  {control.title}
                </Text>
              </div>
            ))}
          </div>
        </ContentCard>
      ))}
    </div>
  );
};
