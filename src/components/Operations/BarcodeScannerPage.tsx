import * as React from 'react';
import {
  Button,
  Field,
  Input,
  Spinner,
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
import { parseScannedBarcode, resolveScannedAsset } from '../../utils/barcodeUtils';
import { useTranslation } from '../../i18n/LocaleContext';
import { AppMessageBar } from '../Layout/AppMessageBar';

export interface IBarcodeScannerPageProps {
  assets: IAsset[];
  onViewAsset: (asset: IAsset) => void;
}

/**
 * Formats we ask the browser BarcodeDetector to look for. The actual set is
 * intersected with what the device supports at runtime so we never request a
 * format that would make the constructor throw.
 */
const DESIRED_FORMATS = [
  'qr_code',
  'code_128',
  'ean_13',
  'ean_8',
  'code_39',
  'code_93',
  'upc_a',
  'upc_e',
  'codabar',
  'itf',
  'data_matrix',
  'pdf417',
  'aztec'
];

/** Frames with a decode error before we surface the "having trouble" hint. */
const DETECT_ERROR_THRESHOLD = 15;

const useStyles = makeStyles({
  video: {
    width: '100%',
    maxWidth: '480px',
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
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

export const BarcodeScannerPage: React.FC<IBarcodeScannerPageProps> = ({ assets, onViewAsset }) => {
  const { t } = useTranslation();
  const formStyles = useFormStyles();
  const styles = useStyles();
  const [scanValue, setScanValue] = React.useState('');
  const [matched, setMatched] = React.useState<IAsset | undefined>();
  const [searched, setSearched] = React.useState(false);
  const [cameraError, setCameraError] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [scanning, setScanning] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const detectorRef = React.useRef<BarcodeDetector | null>(null);
  const zxingReaderRef = React.useRef<BrowserMultiFormatReader | null>(null);
  const zxingControlsRef = React.useRef<IScannerControls | null>(null);
  const activeRef = React.useRef(false);
  const rafRef = React.useRef<number | null>(null);
  const errorCountRef = React.useRef(0);
  const scanLoopRef = React.useRef<() => void>();

  const assetsRef = React.useRef(assets);
  React.useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  const applyResult = React.useCallback((rawValue: string): void => {
    const parsed = parseScannedBarcode(rawValue);
    setScanValue(parsed);
    setMatched(resolveScannedAsset(assetsRef.current, rawValue));
    setSearched(true);
  }, []);

  const handleSearch = (): void => {
    activeRef.current = false;
    setScanning(false);
    applyResult(scanValue);
  };

  const handleScanAgain = (): void => {
    setMatched(undefined);
    setSearched(false);
    setScanValue('');
    errorCountRef.current = 0;
    if (scanLoopRef.current) {
      activeRef.current = true;
      setScanning(true);
      setStatus(t('barcode', 'scanning', 'Camera active — point at a barcode or QR code.'));
      scanLoopRef.current();
    }
  };

  React.useEffect(() => {
    let cancelled = false;

    const startBarcodeDetector = async (): Promise<void> => {
      let formats = DESIRED_FORMATS;
      try {
        const supported = await BarcodeDetector.getSupportedFormats();
        const filtered = DESIRED_FORMATS.filter((format) => supported.includes(format));
        if (filtered.length > 0) {
          formats = filtered;
        }
      } catch {
        // Fall back to the desired list if the device cannot report formats.
      }

      detectorRef.current = new BarcodeDetector({ formats });

      const scanLoop = async (): Promise<void> => {
        if (cancelled || !activeRef.current) return;

        const video = videoRef.current;
        const detector = detectorRef.current;
        if (video && detector) {
          try {
            const codes = await detector.detect(video);
            errorCountRef.current = 0;
            const raw = codes[0]?.rawValue;
            if (raw) {
              activeRef.current = false;
              setScanning(false);
              setStatus('');
              applyResult(raw);
              return;
            }
          } catch {
            errorCountRef.current += 1;
            if (errorCountRef.current === DETECT_ERROR_THRESHOLD) {
              setStatus(
                t(
                  'barcode',
                  'detectError',
                  'Having trouble reading the code. Improve lighting, hold steady, or enter it manually.'
                )
              );
            }
          }
        }

        rafRef.current = window.requestAnimationFrame(() => void scanLoop());
      };

      scanLoopRef.current = () => {
        rafRef.current = window.requestAnimationFrame(() => void scanLoop());
      };

      activeRef.current = true;
      errorCountRef.current = 0;
      setScanning(true);
      setStatus(t('barcode', 'scanning', 'Camera active — point at a barcode or QR code.'));
      scanLoopRef.current();
    };

    const startZxingScanner = async (): Promise<void> => {
      const reader = new BrowserMultiFormatReader();
      zxingReaderRef.current = reader;

      if (!videoRef.current) {
        return;
      }

      setScanning(true);
      setStatus(t('barcode', 'scanning', 'Camera active — point at a barcode or QR code.'));

      zxingControlsRef.current = await reader.decodeFromVideoElement(
        videoRef.current,
        (result: { getText(): string } | undefined) => {
          if (cancelled) {
            return;
          }

          if (result?.getText()) {
            activeRef.current = false;
            setScanning(false);
            setStatus('');
            applyResult(result.getText());
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

      setStatus(t('barcode', 'cameraStarting', 'Starting camera…'));

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
      activeRef.current = false;
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      zxingControlsRef.current?.stop();
      zxingControlsRef.current = null;
      zxingReaderRef.current = null;
      BrowserMultiFormatReader.releaseAllStreams();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [applyResult, t]);

  return (
    <ContentCard>
      <div className={formStyles.form}>
        <div className={formStyles.intro}>
          <Text>{t('barcode', 'scanHint', 'Use your device camera or type a barcode to find an asset.')}</Text>
        </div>

        {cameraError ? (
          <AppMessageBar intent="warning">{cameraError}</AppMessageBar>
        ) : (
          <>
            <video ref={videoRef} className={styles.video} muted playsInline />
            {status ? (
              <div className={styles.status}>
                {scanning ? <Spinner size="tiny" /> : null}
                <Text size={200}>{status}</Text>
              </div>
            ) : null}
          </>
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
          {!cameraError && searched && !scanning ? (
            <Button appearance="secondary" icon={<BarcodeScannerRegular />} onClick={handleScanAgain}>
              {t('barcode', 'scanAgain', 'Scan again')}
            </Button>
          ) : null}
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
                {t('common', 'view', 'View asset')}
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
