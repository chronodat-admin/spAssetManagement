export function generateBarcodeSvg(value: string, options?: { width?: number; height?: number }): string {
  const safeValue = escapeXml(value || '000000');
  const barWidth = options?.width ?? 2;
  const height = options?.height ?? 60;
  const bars = buildPseudoBars(value || '0');
  const totalWidth = bars.length * barWidth + 24;
  const rects = bars
    .map((on, index) =>
      on
        ? `<rect x="${12 + index * barWidth}" y="8" width="${barWidth}" height="${height}" fill="#111"/>`
        : ''
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height + 28}">
    ${rects}
    <text x="${totalWidth / 2}" y="${height + 22}" text-anchor="middle" font-size="12" font-family="Segoe UI, sans-serif">${safeValue}</text>
  </svg>`;
}

export async function generateQrDataUrl(value: string, size = 180): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return '';
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#111111';
  const cells = buildQrMatrix(value || 'asset');
  const cellSize = Math.floor(size / cells.length);
  const offset = Math.floor((size - cellSize * cells.length) / 2);
  for (let y = 0; y < cells.length; y += 1) {
    for (let x = 0; x < cells[y].length; x += 1) {
      if (cells[y][x]) {
        ctx.fillRect(offset + x * cellSize, offset + y * cellSize, cellSize, cellSize);
      }
    }
  }
  return canvas.toDataURL('image/png');
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

function buildPseudoBars(value: string): boolean[] {
  const bars: boolean[] = [];
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    bars.push(true, false, code % 2 === 0, code % 3 === 0, false, true);
  }
  return bars;
}

function buildQrMatrix(value: string): boolean[][] {
  const size = 21;
  const matrix = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      const seed = (hash + x * 17 + y * 31) % 97;
      matrix[y][x] = seed % 3 === 0;
    }
  }
  drawFinder(matrix, 0, 0);
  drawFinder(matrix, size - 7, 0);
  drawFinder(matrix, 0, size - 7);
  return matrix;
}

function drawFinder(matrix: boolean[][], row: number, col: number): void {
  for (let y = 0; y < 7; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      const border = x === 0 || y === 0 || x === 6 || y === 6;
      const center = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      matrix[row + y][col + x] = border || center;
    }
  }
}
