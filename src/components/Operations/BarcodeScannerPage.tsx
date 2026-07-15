import * as React from 'react';

import {
  Button,
  Field,
  Input,
  Text,
  Title3,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { BarcodeScannerRegular, SearchRegular } from '@fluentui/react-icons';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser/esm/common/IScannerControls';

import { ContentCard } from '../Layout/ContentCard';
import { EmptyState } from '../Layout/EmptyState';
import { useFormStyles } from '../Forms/formStyles';
import { IAsset } from '../../models/IAssetApp';
import { resolveScannedAsset } from '../../utils/barcodeUtils';
import { useTranslation } from '../../i18n/LocaleContext';
import { AppMessageBar } from '../Layout/AppMessageBar';

export interface IBarcodeScannerPageProps {
  assets: IAsset[];
  onViewAsset: (asset: IAsset) => void;
}

const useStyles = makeStyles({
  video: {
    width: '100%',
    maxWidth: '480px',
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2
  },
  resultCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2
  }
});

function applyScanResult(
  rawValue: string,
  assets: IAsset[],
  setScanValue: React.Dispatch<React.SetStateAction<string>>,
  setMatched: React.Dispatch<React.SetStateAction<IAsset | undefined>>,
  setSearched: React.Dispatch<React.SetStateAction<boolean>>
): void {
  setScanValue(rawValue);
  setMatched(resolveScannedAsset(assets, rawValue));
  setSearched(true);
}

export const BarcodeScannerPage: React.FC<IBarcodeScannerPageProps> = ({ assets, onViewAsset }) => {
  const { t } = useTranslation();
  const formStyles = useFormStyles();
  const styles = useStyles();
  const [scanValue, setScanValue] = React.useState('');
  const [matched, setMatched] = React.useState<IAsset | undefined>();
  const [searched, setSearched] = React.useState(false);
  const [cameraError, setCameraError] = React.useState('');
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const detectorRef = React.useRef<BarcodeDetector | null>(null);
  const zxingReaderRef = React.useRef<BrowserMultiFormatReader | null>(null);
  const zxingControlsRef = React.useRef<IScannerControls | null>(null);

  const handleSearch = (): void => {
    setMatched(resolveScannedAsset(assets, scanValue));
    setSearched(true);
  };

  React.useEffect(() => {
    let cancelled = false;

    const startBarcodeDetector = async (): Promise<void> => {
      detectorRef.current = new BarcodeDetector({
        formats: ['code_128', 'ean_13', 'qr_code', 'code_39']
      });

      const tick = async (): Promise<void> => {
        if (cancelled || !videoRef.current || !detectorRef.current) return;

        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          if (codes[0]?.rawValue) {
            applyScanResult(codes[0].rawValue, assets, setScanValue, setMatched, setSearched);
          }
        } catch {
          // ignore frame errors
        }

        if (!cancelled) window.requestAnimationFrame(() => void tick());
      };

      void tick();
    };

    const startZxingScanner = async (): Promise<void> => {
      const reader = new BrowserMultiFormatReader();
      zxingReaderRef.current = reader;

      if (!videoRef.current) {
        return;
      }

      zxingControlsRef.current = await reader.decodeFromVideoElement(
        videoRef.current,
        (result) => {
          if (cancelled) {
            return;
          }

          if (result?.getText()) {
            applyScanResult(result.getText(), assets, setScanValue, setMatched, setSearched);
          }
        }
      );
    };

    const startCamera = async (): Promise<void> => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          t('barcode', 'noCamera', 'Camera scanning is not available in this browser. Enter the code manually.')
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if ('BarcodeDetector' in window) {
          await startBarcodeDetector();
        } else {
          await startZxingScanner();
        }
      } catch {
        setCameraError(
          t('barcode', 'noCamera', 'Camera scanning is not available in this browser. Enter the code manually.')
        );
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      zxingControlsRef.current?.stop();
      zxingControlsRef.current = null;
      zxingReaderRef.current = null;
      BrowserMultiFormatReader.releaseAllStreams();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [assets, t]);

  return (
    <ContentCard>
      <div className={formStyles.form}>
        <div className={formStyles.intro}>
          <Text>{t('barcode', 'scanHint', 'Use your device camera or type a barcode to find an asset.')}</Text>
        </div>

        {cameraError ? (
          <AppMessageBar intent="warning">{cameraError}</AppMessageBar>
        ) : (
          <video ref={videoRef} className={styles.video} muted playsInline />
        )}

        <Field label={t('barcode', 'scan', 'Scan barcode')}>
          <Input
            value={scanValue}
            onChange={(_, d) => {
              setScanValue(d.value);
              setSearched(false);
              setMatched(undefined);
            }}
            placeholder={t('barcode', 'scanPlaceholder', 'Enter or scan barcode…')}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSearch();
            }}
          />
        </Field>

        <div className={formStyles.actions}>
          <Button appearance="primary" icon={<SearchRegular />} onClick={handleSearch}>
            {t('common', 'search', 'Search')}
          </Button>
        </div>

        {matched ? (
          <div className={styles.resultCard}>
            <AppMessageBar intent="success">{t('barcode', 'assetFound', 'Asset found')}</AppMessageBar>
            <Title3>{matched.Title}</Title3>
            <Text>
              {matched.AM_AssetId || '—'} · {matched.AM_Barcode || '—'} · {matched.AM_SerialNumber || '—'}
            </Text>
            <div>
              <Button appearance="secondary" onClick={() => onViewAsset(matched)}>
                View asset
              </Button>
            </div>
          </div>
        ) : searched && scanValue ? (
          <EmptyState
            bordered
            icon={<BarcodeScannerRegular />}
            title={t('barcode', 'assetNotFound', 'No asset matches that barcode.')}
            description={t(
              'barcode',
              'idleDescription',
              'Point your camera at a barcode or enter a code above to find an asset.'
            )}
          />
        ) : (
          <EmptyState
            bordered
            icon={<BarcodeScannerRegular />}
            title={t('barcode', 'idleTitle', 'Ready to scan')}
            description={t(
              'barcode',
              'idleDescription',
              'Point your camera at a barcode or enter a code above to find an asset.'
            )}
          />
        )}
      </div>
    </ContentCard>
  );
};
