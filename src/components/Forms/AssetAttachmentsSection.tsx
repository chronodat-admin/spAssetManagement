import * as React from 'react';
import {
  Button,
  Field,
  Link,
  Spinner,
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  AttachRegular,
  DeleteRegular,
  DocumentRegular
} from '@fluentui/react-icons';
import type { ISharePointAttachment } from '../../models/ISharePointAttachment';
import { AssetService } from '../../services/AssetService';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    gridColumn: '1 / -1',
    paddingTop: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`
  },
  fileList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },
  fileRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    minWidth: 0
  },
  fileMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
    flex: '1 1 auto'
  },
  fileIcon: {
    color: tokens.colorNeutralForeground3,
    flexShrink: 0
  },
  fileName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  empty: {
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic'
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  hiddenInput: {
    display: 'none'
  }
});

export interface IAssetAttachmentDraft {
  uploads: File[];
  deletes: string[];
}

export interface IAssetAttachmentsSectionProps {
  itemId?: number;
  riskService: AssetService;
  readOnly?: boolean;
  disabled?: boolean;
  draft: IAssetAttachmentDraft;
  onDraftChange: (next: IAssetAttachmentDraft) => void;
}

export const AssetAttachmentsSection: React.FC<IAssetAttachmentsSectionProps> = ({
  itemId,
  riskService,
  readOnly = false,
  disabled = false,
  draft,
  onDraftChange
}) => {
  const styles = useStyles();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(Boolean(itemId));
  const [existing, setExisting] = React.useState<ISharePointAttachment[]>([]);

  React.useEffect(() => {
    if (!itemId) {
      setExisting([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void riskService
      .getRiskAttachments(itemId)
      .then((attachments) => {
        if (!cancelled) {
          setExisting(attachments);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setExisting([]);
        }
      })
      .then(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [itemId, riskService]);

  const visibleExisting = existing.filter(
    (attachment) => !draft.deletes.includes(attachment.FileName)
  );

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }
    onDraftChange({
      ...draft,
      uploads: [...draft.uploads, ...files]
    });
    event.target.value = '';
  };

  const removePendingUpload = (index: number): void => {
    onDraftChange({
      ...draft,
      uploads: draft.uploads.filter((_, fileIndex) => fileIndex !== index)
    });
  };

  const markExistingForDelete = (fileName: string): void => {
    onDraftChange({
      ...draft,
      deletes: draft.deletes.includes(fileName) ? draft.deletes : [...draft.deletes, fileName]
    });
  };

  const hasAnyFiles = visibleExisting.length > 0 || draft.uploads.length > 0;

  return (
    <div className={styles.root}>
      <Field label="Attachments" hint={readOnly ? undefined : 'Upload license files, invoices, photos, or other supporting documents.'}>
        {loading ? (
          <Spinner size="tiny" label="Loading attachments..." />
        ) : (
          <>
            {hasAnyFiles ? (
              <div className={styles.fileList}>
                {visibleExisting.map((attachment) => (
                  <div key={attachment.FileName} className={styles.fileRow}>
                    <div className={styles.fileMeta}>
                      <DocumentRegular className={styles.fileIcon} />
                      <Link
                        href={riskService.buildAttachmentUrl(attachment.ServerRelativeUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.fileName}
                      >
                        {attachment.FileName}
                      </Link>
                    </div>
                    {!readOnly && (
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<DeleteRegular />}
                        disabled={disabled}
                        aria-label={`Remove ${attachment.FileName}`}
                        onClick={() => markExistingForDelete(attachment.FileName)}
                      />
                    )}
                  </div>
                ))}
                {draft.uploads.map((file, index) => (
                  <div key={`pending-${file.name}-${index}`} className={styles.fileRow}>
                    <div className={styles.fileMeta}>
                      <DocumentRegular className={styles.fileIcon} />
                      <Text className={styles.fileName}>{file.name}</Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3, flexShrink: 0 }}>
                        (pending upload)
                      </Text>
                    </div>
                    {!readOnly && (
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<DeleteRegular />}
                        disabled={disabled}
                        aria-label={`Remove ${file.name}`}
                        onClick={() => removePendingUpload(index)}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Text className={styles.empty}>No attachments yet.</Text>
            )}

            {!readOnly && (
              <div className={styles.actions}>
                <input
                  ref={fileInputRef}
                  className={styles.hiddenInput}
                  type="file"
                  multiple
                  disabled={disabled}
                  onChange={handleFilesSelected}
                />
                <Button
                  appearance="secondary"
                  size="small"
                  icon={<AttachRegular />}
                  disabled={disabled}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Add attachment
                </Button>
              </div>
            )}
          </>
        )}
      </Field>
    </div>
  );
};
