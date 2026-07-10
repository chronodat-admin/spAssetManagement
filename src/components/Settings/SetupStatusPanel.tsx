import * as React from 'react';
import {
  Button,
  Card,
  CardHeader,
  makeStyles,
  mergeClasses,
  shorthands,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Title3,
  tokens
} from '@fluentui/react-components';
import {
  ArrowClockwiseRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  PlayRegular,
  WarningRegular
} from '@fluentui/react-icons';
import { DEFAULT_APP_TITLE } from '../../constants/spfxComponents';
import { IProvisioningStatus } from '../../models/IAssetApp';
import { getProvisioningListDisplayLabel } from '../../utils/provisioningListLabels';
import { DedicatedSubsiteWarning } from '../Onboarding/DedicatedSubsiteWarning';
import { MailSendApprovalPanel } from '../Onboarding/MailSendApprovalPanel';
import type { MailSendApprovalUiStatus } from '../../models/IMailSendApproval';
import { useContentCardStyles } from '../Layout/ContentCard';
import {
  DATA_TABLE_CLASS,
  getDataTableLayoutStyle,
  getListColumnStyle
} from '../../lib/list-view/columnWidths';

const useStyles = makeStyles({
  card: {
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4
  },
  cardComplete: {
    borderTop: `3px solid ${tokens.colorPaletteGreenBorder2}`
  },
  cardIncomplete: {
    borderTop: `3px solid ${tokens.colorPaletteYellowBorder2}`
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  body: {
    padding: tokens.spacingHorizontalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  bodyEmbedded: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  statusReady: { color: tokens.colorPaletteGreenForeground2 },
  statusIncomplete: { color: tokens.colorPaletteYellowForeground2 },
  statusMissing: { color: tokens.colorPaletteRedForeground2 }
});

export interface ISetupStatusPanelProps {
  status: IProvisioningStatus;
  mailSendStatus?: MailSendApprovalUiStatus;
  mailSendAdminUrl?: string;
  onRefreshMailSendStatus?: () => void;
  refreshingMailSendStatus?: boolean;
  onRunSetup?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  compact?: boolean;
  embedded?: boolean;
  hideActions?: boolean;
}

export const SetupStatusPanel: React.FC<ISetupStatusPanelProps> = ({
  status,
  mailSendStatus,
  mailSendAdminUrl,
  onRefreshMailSendStatus,
  refreshingMailSendStatus,
  onRunSetup,
  onRefresh,
  refreshing,
  compact,
  embedded,
  hideActions
}) => {
  const styles = useStyles();
  const cardStyles = useContentCardStyles();

  const content = (
    <div className={embedded ? styles.bodyEmbedded : styles.body}>
      <DedicatedSubsiteWarning />
      {status.isComplete ? (
        <Text>
          All required SharePoint lists are present. {DEFAULT_APP_TITLE} is ready to use.
        </Text>
      ) : (
        <Text>
          Some required SharePoint lists still need setup. Run setup to create or repair lists and
          seed default data.
        </Text>
      )}

      {!compact && (
        <div className={cardStyles.tableWrap}>
          <Table
            aria-label="Setup status"
            className={DATA_TABLE_CLASS}
            style={getDataTableLayoutStyle(420)}
          >
            <TableHeader>
              <TableRow>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('list')}>
                  List
                </TableHeaderCell>
                <TableHeaderCell className={cardStyles.tableHeaderCell} style={getListColumnStyle('status')}>
                  Status
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {status.lists.map((list) => (
                <TableRow key={list.title}>
                  <TableCell className={cardStyles.dataTableCell} style={getListColumnStyle('list')}>
                    {getProvisioningListDisplayLabel(list.title)}
                  </TableCell>
                  <TableCell style={getListColumnStyle('status')}>
                  {list.ready ? (
                    <span className={styles.statusReady}>
                      <CheckmarkCircleRegular /> Ready
                    </span>
                  ) : list.exists ? (
                    <span className={styles.statusIncomplete}>
                      <WarningRegular /> Incomplete
                    </span>
                  ) : (
                    <span className={styles.statusMissing}>
                      <DismissCircleRegular /> Missing
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}

      {!hideActions && !status.isComplete && onRunSetup && (
        <Button appearance="primary" icon={<PlayRegular />} onClick={onRunSetup}>
          Complete Setup
        </Button>
      )}

      {mailSendStatus && mailSendAdminUrl && (
        <MailSendApprovalPanel
          status={mailSendStatus}
          adminUrl={mailSendAdminUrl}
          onRefresh={onRefreshMailSendStatus}
          refreshing={refreshingMailSendStatus}
        />
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Card
      className={mergeClasses(
        styles.card,
        status.isComplete ? styles.cardComplete : styles.cardIncomplete
      )}
    >
      <CardHeader
        header={
          <div className={styles.headerRow}>
            <Title3 as="h2">Setup Status</Title3>
            {onRefresh && (
              <Button
                appearance="subtle"
                icon={refreshing ? <Spinner size="tiny" /> : <ArrowClockwiseRegular />}
                aria-label="Refresh list status"
                disabled={refreshing}
                onClick={onRefresh}
              />
            )}
          </div>
        }
      />
      {content}
    </Card>
  );
};
