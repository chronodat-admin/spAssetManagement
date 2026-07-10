import * as React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Text
} from '@fluentui/react-components';
import { PrintRegular } from '@fluentui/react-icons';
import type { IAsset } from '../../models/IAsset';
import {
  buildAssetBarcodeValue,
  buildAssetQrValue,
  generateBarcodeSvg,
  generateQrDataUrl
} from '../../utils/barcodeUtils';
import { useTranslation } from '../../i18n/LocaleContext';

export interface IBarcodeLabelDialogProps {
  open: boolean;
  assets: IAsset[];
  onClose: () => void;
}

export const BarcodeLabelDialog: React.FC<IBarcodeLabelDialogProps> = ({ open, assets, onClose }) => {
  const { t } = useTranslation();
  const [qrUrls, setQrUrls] = React.useState<Record<number, string>>({});

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async (): Promise<void> => {
      const entries = await Promise.all(
        assets.map(async (asset) => [asset.Id, await generateQrDataUrl(buildAssetQrValue(asset))] as const)
      );
      if (!cancelled) {
        const next: Record<number, string> = {};
        for (const [id, url] of entries) {
          next[id] = url;
        }
        setQrUrls(next);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [assets, open]);

  const handlePrint = (): void => {
    const popup = window.open('', '_blank', 'noopener,noreferrer,width=800,height=900');
    if (!popup) return;
    const labels = assets
      .map((asset) => {
        const barcodeValue = buildAssetBarcodeValue(asset);
        const svg = generateBarcodeSvg(barcodeValue);
        const qr = qrUrls[asset.Id] ? `<img src="${qrUrls[asset.Id]}" alt="QR" width="120" height="120" />` : '';
        return `<section style="page-break-inside:avoid;margin-bottom:24px;border:1px solid #ddd;padding:16px;">
          <h3>${asset.Title}</h3>
          <p>${asset.AM_AssetId || ''}</p>
          <div>${svg}</div>
          <div style="margin-top:8px;">${qr}</div>
        </section>`;
      })
      .join('');
    popup.document.write(`<html><head><title>Asset labels</title></head><body>${labels}</body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{t('barcode', 'generate', 'Generate labels')}</DialogTitle>
          <DialogContent>
            <Text>{assets.length} asset label(s) ready.</Text>
            <div style={{ display: 'grid', gap: 16, marginTop: 12, maxHeight: 360, overflowY: 'auto' }}>
              {assets.map((asset) => (
                <div key={asset.Id} style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 12 }}>
                  <Text weight="semibold">{asset.Title}</Text>
                  <div
                    dangerouslySetInnerHTML={{ __html: generateBarcodeSvg(buildAssetBarcodeValue(asset)) }}
                  />
                  {qrUrls[asset.Id] ? (
                    <img src={qrUrls[asset.Id]} alt={t('barcode', 'qrCode', 'QR Code')} width={100} height={100} />
                  ) : null}
                </div>
              ))}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              {t('common', 'close', 'Close')}
            </Button>
            <Button appearance="primary" icon={<PrintRegular />} onClick={handlePrint}>
              {t('barcode', 'printLabels', 'Print labels')}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
