import * as React from 'react';
import {
  Button,
  Field,
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { ArrowUploadRegular, DeleteRegular, ImageRegular } from '@fluentui/react-icons';
import { AssetImageThumbnail } from '../Assets/AssetImageThumbnail';
import { AssetService } from '../../services/AssetService';
import { isImageMimeType } from '../../utils/assetImage';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    gridColumn: '1 / -1',
    marginBottom: tokens.spacingVerticalM
  },
  panel: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM
  },
  previewWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    minWidth: 0
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  hiddenInput: {
    display: 'none'
  },
  hint: {
    color: tokens.colorNeutralForeground3
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic'
  }
});

export interface IAssetImageDraft {
  upload?: File;
  remove?: boolean;
}

export interface IAssetImageSectionProps {
  imageUrl?: string;
  title?: string;
  riskService: AssetService;
  readOnly?: boolean;
  disabled?: boolean;
  draft: IAssetImageDraft;
  onDraftChange: (next: IAssetImageDraft) => void;
}

export const AssetImageSection: React.FC<IAssetImageSectionProps> = ({
  imageUrl,
  title,
  riskService,
  readOnly = false,
  disabled = false,
  draft,
  onDraftChange
}) => {
  const styles = useStyles();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const webOrigin = React.useMemo(() => {
    try {
      return new URL(riskService.getSiteWebUrl()).origin;
    } catch {
      return undefined;
    }
  }, [riskService]);

  const [pendingPreviewUrl, setPendingPreviewUrl] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (!draft.upload || draft.remove) {
      setPendingPreviewUrl(undefined);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(draft.upload);
    setPendingPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [draft.upload, draft.remove]);

  const previewUrl = draft.remove ? undefined : pendingPreviewUrl || imageUrl;

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    if (!isImageMimeType(file.type)) {
      return;
    }
    onDraftChange({ upload: file, remove: false });
  };

  const handleRemove = (): void => {
    onDraftChange({ remove: true });
  };

  const hasImage = Boolean(previewUrl);

  return (
    <div className={styles.root}>
      <Field
        label="Asset image"
        hint={
          readOnly
            ? undefined
            : 'Upload a photo or illustration for quick identification in lists and forms.'
        }
      >
        <div className={styles.panel}>
          <div className={styles.previewWrap}>
            {hasImage ? (
              <AssetImageThumbnail
                imageUrl={previewUrl}
                alt={title ? `${title} image` : 'Asset image'}
                size="large"
                webOrigin={webOrigin}
              />
            ) : (
              <div className={styles.empty}>
                <ImageRegular />
                <Text>No image uploaded</Text>
              </div>
            )}
          </div>

          {!readOnly && (
            <div className={styles.actions}>
              <input
                ref={fileInputRef}
                className={styles.hiddenInput}
                type="file"
                accept="image/*"
                disabled={disabled}
                onChange={handleFilesSelected}
              />
              <Button
                appearance="secondary"
                size="small"
                icon={<ArrowUploadRegular />}
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
              >
                {hasImage ? 'Replace image' : 'Upload image'}
              </Button>
              {hasImage && (
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<DeleteRegular />}
                  disabled={disabled}
                  onClick={handleRemove}
                >
                  Remove
                </Button>
              )}
            </div>
          )}
        </div>
      </Field>
    </div>
  );
};
