import * as React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { WarningRegular } from '@fluentui/react-icons';
import type { ILookupDeleteReference } from '../../utils/lookupDeleteReferences';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  header: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'flex-start'
  },
  icon: {
    color: tokens.colorPaletteDarkOrangeForeground1,
    flexShrink: 0,
    fontSize: '24px',
    marginTop: tokens.spacingVerticalXXS
  },
  message: {
    lineHeight: tokens.lineHeightBase300,
    color: tokens.colorNeutralForeground1,
    margin: 0
  },
  referencesTitle: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    margin: 0
  },
  referencesTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: tokens.fontSizeBase200
  },
  referencesHeaderCell: {
    textAlign: 'left',
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightSemibold
  },
  referencesCell: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground1
  },
  referencesCountCell: {
    textAlign: 'right',
    width: '72px',
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold
  }
});

export interface IConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  references?: ILookupDeleteReference[];
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenChange?: (open: boolean) => void;
}

export const ConfirmDialog: React.FC<IConfirmDialogProps> = ({
  open,
  title,
  message,
  references = [],
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  confirming = false,
  onConfirm,
  onCancel,
  onOpenChange
}) => {
  const styles = useStyles();
  const hasReferences = references.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(_, data) => {
        onOpenChange?.(data.open);
        if (!data.open) {
          onCancel();
        }
      }}
    >
      <DialogSurface style={{ maxWidth: hasReferences ? 520 : 480 }}>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <div className={styles.content}>
              <div className={styles.header}>
                <WarningRegular className={styles.icon} aria-hidden />
                <p className={styles.message}>{message}</p>
              </div>
              {hasReferences && (
                <div>
                  <p className={styles.referencesTitle}>Referenced in</p>
                  <table className={styles.referencesTable}>
                    <thead>
                      <tr>
                        <th className={styles.referencesHeaderCell} scope="col">
                          List
                        </th>
                        <th className={styles.referencesHeaderCell} scope="col" style={{ textAlign: 'right' }}>
                          Items
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {references.map((entry) => (
                        <tr key={`${entry.listTitle}-${entry.displayLabel}`}>
                          <td className={styles.referencesCell}>{entry.displayLabel}</td>
                          <td className={styles.referencesCountCell}>{entry.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" disabled={confirming} onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button appearance="primary" disabled={confirming} onClick={onConfirm}>
              {confirming ? 'Deleting...' : confirmLabel}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
