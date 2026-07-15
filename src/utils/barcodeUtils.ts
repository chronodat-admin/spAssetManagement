import { toDataURL } from 'qrcode';

/**
 * Code 128 symbol patterns (indices 0-106). Each entry is a run-length string of
 * bar/space module widths, alternating bar-first. Index 103/104/105 are the
 * Start A/B/C symbols and index 106 is the Stop symbol. These are the canonical
 * ISO/IEC 15417 patterns, so the generated barcodes decode on real scanners and
 * the browser BarcodeDetector used by the Scan Asset page.
 */
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];

const CODE128_START_B = 104;
const CODE128_STOP = 106;

/** Keep only characters Code 128 set B can encode (printable ASCII 32-127). */
function sanitizeCode128Value(value: string): string {
  const cleaned = (value || '')
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code <= 127;
    })
    .join('');
  return cleaned || '0';
}

function patternToModules(widths: string): string {
  let modules = '';
  for (let i = 0; i < widths.length; i += 1) {
    const width = Number(widths[i]);
    modules += (i % 2 === 0 ? '1' : '0').repeat(width);
  }
  return modules;
}

/**
 * Encodes a value as a Code 128 (set B) module string where '1' is a bar module
 * and '0' is a space module. Includes the Start B symbol, the mod-103 check
 * symbol, and the Stop symbol. Exported so the encoding can be unit tested.
 */
export function encodeCode128(value: string): string {
  const clean = sanitizeCode128Value(value);
  const codes: number[] = [CODE128_START_B];
  for (let i = 0; i < clean.length; i += 1) {
    codes.push(clean.charCodeAt(i) - 32);
  }
  let checksum = CODE128_START_B;
  for (let i = 1; i < codes.length; i += 1) {
    checksum += codes[i] * i;
  }
  codes.push(checksum % 103);
  codes.push(CODE128_STOP);
  return codes.map((code) => patternToModules(CODE128_PATTERNS[code])).join('');
}

/**
 * Renders a scannable Code 128 barcode as an inline SVG string. A light quiet
 * zone is included on both sides so scanners can lock onto the symbol.
 */
export function generateBarcodeSvg(value: string, options?: { width?: number; height?: number }): string {
  const moduleWidth = options?.width ?? 2;
  const height = options?.height ?? 60;
  const quietModules = 10;
  const displayValue = escapeXml(sanitizeCode128Value(value));
  const modules = encodeCode128(value);
  const totalModules = modules.length + quietModules * 2;
  const totalWidth = totalModules * moduleWidth;
  const svgHeight = height + 24;

  let rects = '';
  let x = quietModules * moduleWidth;
  let index = 0;
  while (index < modules.length) {
    if (modules[index] === '1') {
      let run = 1;
      while (modules[index + run] === '1') {
        run += 1;
      }
      rects += `<rect x="${x}" y="8" width="${run * moduleWidth}" height="${height}" fill="#111"/>`;
      x += run * moduleWidth;
      index += run;
    } else {
      x += moduleWidth;
      index += 1;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${svgHeight}" viewBox="0 0 ${totalWidth} ${svgHeight}">
    <rect x="0" y="0" width="${totalWidth}" height="${svgHeight}" fill="#ffffff"/>
    ${rects}
    <text x="${totalWidth / 2}" y="${height + 20}" text-anchor="middle" font-size="12" font-family="Segoe UI, sans-serif">${displayValue}</text>
  </svg>`;
}

/**
 * Renders a real (ISO/IEC 18004) QR code as a PNG data URL using the qrcode
 * library. Returns an empty string if encoding fails so the caller can degrade
 * gracefully.
 */
export async function generateQrDataUrl(value: string, size = 180): Promise<string> {
  try {
    return await toDataURL(value || 'asset', {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M'
    });
  } catch {
    return '';
  }
}

export function buildAssetBarcodeValue(asset: { AM_Barcode?: string; AM_AssetId?: string; Id?: number }): string {
  return (asset.AM_Barcode || asset.AM_AssetId || (asset.Id ? `AM-${asset.Id}` : '')).trim();
}

export function buildAssetQrValue(asset: {
  Id?: number;
  Title?: string;
  AM_AssetId?: string;
  AM_Barcode?: string;
  AM_SerialNumber?: string;
}): string {
  return JSON.stringify({
    id: asset.Id,
    assetId: asset.AM_AssetId,
    barcode: asset.AM_Barcode,
    serial: asset.AM_SerialNumber,
    title: asset.Title
  });
}

export function parseScannedBarcode(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const parsed = JSON.parse(trimmed) as { barcode?: string; assetId?: string; id?: number };
    return parsed.barcode || parsed.assetId || (parsed.id ? `AM-${parsed.id}` : trimmed);
  } catch {
    return trimmed;
  }
}

export function resolveScannedAsset<
  T extends { AM_Barcode?: string; AM_AssetId?: string; AM_SerialNumber?: string; Id?: number }
>(assets: T[], raw: string): T | undefined {
  return findAssetByScanValue(assets, parseScannedBarcode(raw));
}

export function findAssetByScanValue<T extends { AM_Barcode?: string; AM_AssetId?: string; AM_SerialNumber?: string; Id?: number }>(
  assets: T[],
  scanned: string
): T | undefined {
  const normalized = scanned.trim().toLowerCase();
  if (!normalized) return undefined;
  return assets.find((asset) => {
    const candidates = [
      asset.AM_Barcode,
      asset.AM_AssetId,
      asset.AM_SerialNumber,
      asset.Id ? String(asset.Id) : undefined,
      asset.Id ? `am-${asset.Id}` : undefined
    ]
      .filter(Boolean)
      .map((candidate) => String(candidate).toLowerCase());
    return candidates.includes(normalized);
  });
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
