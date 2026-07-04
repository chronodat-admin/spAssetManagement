import * as React from 'react';
import {
  Button,
  Caption1,
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
import { EyeRegular } from '@fluentui/react-icons';
import { RightDetailPanel } from '../Layout/RightDetailPanel';
import { IAuditLogEntry } from '../../models/IAuditLog';
import {
  buildAuditDetailsPresentation,
  formatAuditActionLabel,
  formatAuditEntityLabel,
  IAuditDetailsPresentation
} from '../../utils/auditLogDisplayUtils';

const useStyles = makeStyles({
  summaryText: {
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase300,
    wordBreak: 'break-word'
  },
  changeTable: {
    width: '100%',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden'
  },
  changeHeaderCell: {
    backgroundColor: tokens.colorNeutralBackground2,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200
  },
  oldValue: {
    color: tokens.colorPaletteRedForeground2,
    wordBreak: 'break-word'
  },
  newValue: {
    color: tokens.colorPaletteGreenForeground2,
    wordBreak: 'break-word'
  },
  inlineChanges: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS
  },
  inlineChangeRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
    alignItems: 'baseline',
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200
  },
  fieldLabel: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  },
  panelSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: tokens.spacingHorizontalS
  },
  metaItem: {
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2
  }
});

function formatTimestamp(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export interface IAuditLogDetailsCellProps {
  entry: IAuditLogEntry;
}

export const AuditLogDetailsCell: React.FC<IAuditLogDetailsCellProps> = ({ entry }) => {
  const styles = useStyles();
  const [open, setOpen] = React.useState(false);
  const presentation = React.useMemo(
    () => buildAuditDetailsPresentation(entry.details, String(entry.action), entry.entity),
    [entry.action, entry.details, entry.entity]
  );

  return (
    <>
      <div className={styles.inlineChanges}>
        <Text size={200} className={styles.summaryText}>
          {presentation.summary}
        </Text>
        {presentation.changes.slice(0, 2).map((change) => (
          <div key={change.field} className={styles.inlineChangeRow}>
            <span className={styles.fieldLabel}>{change.fieldLabel}:</span>
            <span className={styles.oldValue}>{change.oldValue}</span>
            <span>→</span>
            <span className={styles.newValue}>{change.newValue}</span>
          </div>
        ))}
        {presentation.hasExpandableContent && (
          <Button
            appearance="subtle"
            size="small"
            icon={<EyeRegular />}
            onClick={() => setOpen(true)}
          >
            View details
          </Button>
        )}
      </div>

      <AuditLogDetailsPanel
        entry={entry}
        presentation={presentation}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export interface IAuditLogDetailsPanelProps {
  entry: IAuditLogEntry;
  presentation: IAuditDetailsPresentation;
  open: boolean;
  onClose: () => void;
}

export const AuditLogDetailsPanel: React.FC<IAuditLogDetailsPanelProps> = ({
  entry,
  presentation,
  open,
  onClose
}) => {
  const styles = useStyles();

  return (
    <RightDetailPanel
      open={open}
      title="Audit entry details"
      subtitle={`${formatAuditActionLabel(String(entry.action))} · ${formatAuditEntityLabel(entry.entity)}`}
      wide
      onClose={onClose}
      footer={
        <Button appearance="primary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className={styles.panelSection}>
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <Caption1>When</Caption1>
            <Text block>{formatTimestamp(entry.timestamp)}</Text>
          </div>
          <div className={styles.metaItem}>
            <Caption1>User</Caption1>
            <Text block weight="semibold">
              {entry.userDisplayName || 'System'}
            </Text>
            {entry.userEmail ? <Caption1 block>{entry.userEmail}</Caption1> : null}
          </div>
          <div className={styles.metaItem}>
            <Caption1>Entity ID</Caption1>
            <Text block>{entry.entityId || '—'}</Text>
          </div>
        </div>

        <Text weight="semibold">{presentation.summary}</Text>

        {presentation.changes.length > 0 ? (
          <Table className={styles.changeTable} aria-label="Audit changes">
            <TableHeader>
              <TableRow>
                <TableHeaderCell className={styles.changeHeaderCell}>Property</TableHeaderCell>
                <TableHeaderCell className={styles.changeHeaderCell}>Previous</TableHeaderCell>
                <TableHeaderCell className={styles.changeHeaderCell}>New</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presentation.changes.map((change) => (
                <TableRow key={change.field}>
                  <TableCell>{change.fieldLabel}</TableCell>
                  <TableCell>
                    <Text className={styles.oldValue}>{change.oldValue}</Text>
                  </TableCell>
                  <TableCell>
                    <Text className={styles.newValue}>{change.newValue}</Text>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}

        {presentation.createValues.length > 0 && presentation.changes.length === 0 ? (
          <Table className={styles.changeTable} aria-label="Audit values">
            <TableHeader>
              <TableRow>
                <TableHeaderCell className={styles.changeHeaderCell}>Property</TableHeaderCell>
                <TableHeaderCell className={styles.changeHeaderCell}>Value</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presentation.createValues.map((item) => (
                <TableRow key={item.field}>
                  <TableCell>{item.fieldLabel}</TableCell>
                  <TableCell>{item.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </div>
    </RightDetailPanel>
  );
};
