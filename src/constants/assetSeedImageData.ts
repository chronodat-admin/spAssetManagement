import { svgMarkupToArrayBuffer } from '../utils/assetImage.js';

export type AssetImageSeedKey =
  | 'laptop'
  | 'monitor'
  | 'desktop'
  | 'phone'
  | 'tablet'
  | 'printer'
  | 'furniture'
  | 'vehicle'
  | 'server'
  | 'software'
  | 'default';

export const ASSET_SEED_IMAGE_FILE_NAME = 'asset-image.svg';

const SEED_PALETTES: Record<AssetImageSeedKey, { bg: string; accent: string; label: string }> = {
  laptop: { bg: '#dbeafe', accent: '#2563eb', label: 'Laptop' },
  monitor: { bg: '#e0e7ff', accent: '#4f46e5', label: 'Monitor' },
  desktop: { bg: '#cffafe', accent: '#0891b2', label: 'Desktop' },
  phone: { bg: '#fce7f3', accent: '#db2777', label: 'Phone' },
  tablet: { bg: '#fae8ff', accent: '#a21caf', label: 'Tablet' },
  printer: { bg: '#f3f4f6', accent: '#374151', label: 'Printer' },
  furniture: { bg: '#ffedd5', accent: '#c2410c', label: 'Furniture' },
  vehicle: { bg: '#dcfce7', accent: '#15803d', label: 'Vehicle' },
  server: { bg: '#ede9fe', accent: '#6d28d9', label: 'Server' },
  software: { bg: '#e0f2fe', accent: '#0369a1', label: 'Software' },
  default: { bg: '#f1f5f9', accent: '#475569', label: 'Asset' }
};

function iconPath(key: AssetImageSeedKey): string {
  switch (key) {
    case 'laptop':
      return '<rect x="24" y="34" width="80" height="52" rx="6" fill="currentColor"/><rect x="18" y="88" width="92" height="8" rx="3" fill="currentColor" opacity="0.55"/>';
    case 'monitor':
      return '<rect x="26" y="28" width="76" height="50" rx="6" fill="currentColor"/><rect x="58" y="82" width="12" height="14" fill="currentColor"/><rect x="44" y="96" width="40" height="6" rx="2" fill="currentColor" opacity="0.55"/>';
    case 'desktop':
      return '<rect x="34" y="24" width="60" height="44" rx="5" fill="currentColor"/><rect x="24" y="72" width="80" height="28" rx="5" fill="currentColor" opacity="0.8"/>';
    case 'phone':
      return '<rect x="44" y="20" width="40" height="88" rx="8" fill="currentColor"/><circle cx="64" cy="96" r="4" fill="#fff" opacity="0.8"/>';
    case 'tablet':
      return '<rect x="30" y="24" width="68" height="80" rx="8" fill="currentColor"/><circle cx="64" cy="92" r="4" fill="#fff" opacity="0.8"/>';
    case 'printer':
      return '<rect x="28" y="48" width="72" height="40" rx="5" fill="currentColor"/><rect x="36" y="30" width="56" height="18" rx="3" fill="currentColor" opacity="0.65"/><rect x="40" y="72" width="48" height="18" rx="2" fill="#fff" opacity="0.35"/>';
    case 'furniture':
      return '<rect x="24" y="58" width="80" height="10" rx="2" fill="currentColor"/><rect x="30" y="68" width="8" height="24" fill="currentColor"/><rect x="90" y="68" width="8" height="24" fill="currentColor"/><rect x="34" y="34" width="60" height="24" rx="4" fill="currentColor" opacity="0.75"/>';
    case 'vehicle':
      return '<rect x="24" y="58" width="80" height="22" rx="8" fill="currentColor"/><circle cx="40" cy="84" r="8" fill="currentColor"/><circle cx="88" cy="84" r="8" fill="currentColor"/><rect x="34" y="48" width="52" height="16" rx="6" fill="currentColor" opacity="0.7"/>';
    case 'server':
      return '<rect x="30" y="24" width="68" height="18" rx="4" fill="currentColor"/><rect x="30" y="48" width="68" height="18" rx="4" fill="currentColor" opacity="0.85"/><rect x="30" y="72" width="68" height="18" rx="4" fill="currentColor" opacity="0.7"/><circle cx="86" cy="33" r="3" fill="#fff"/><circle cx="86" cy="57" r="3" fill="#fff"/><circle cx="86" cy="81" r="3" fill="#fff"/>';
    case 'software':
      return '<rect x="28" y="28" width="72" height="72" rx="14" fill="currentColor"/><path d="M52 64 L60 72 L78 50" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    default:
      return '<rect x="30" y="30" width="68" height="68" rx="12" fill="currentColor"/><rect x="44" y="44" width="40" height="40" rx="6" fill="#fff" opacity="0.35"/>';
  }
}

export function buildSeedAssetImageSvg(key: AssetImageSeedKey | string | undefined): string {
  const resolved = (key && key in SEED_PALETTES ? key : 'default') as AssetImageSeedKey;
  const palette = SEED_PALETTES[resolved];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="${palette.label}">
  <rect width="128" height="128" rx="16" fill="${palette.bg}"/>
  <g color="${palette.accent}">${iconPath(resolved)}</g>
  <text x="64" y="118" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="${palette.accent}">${palette.label}</text>
</svg>`;
}

export function buildSeedAssetImageBuffer(key: AssetImageSeedKey | string | undefined): ArrayBuffer {
  return svgMarkupToArrayBuffer(buildSeedAssetImageSvg(key));
}

export function resolveAssetImageSeedKey(row: Record<string, string | number | boolean>): AssetImageSeedKey {
  const explicit = String(row.ImageSeedKey || '').trim();
  if (explicit && explicit in SEED_PALETTES) {
    return explicit as AssetImageSeedKey;
  }

  const subCategory = String(row.SubCategoryTitle || '').toLowerCase();
  const assetType = String(row.AssetTypeTitle || '').toLowerCase();
  const category = String(row.CategoryTitle || '').toLowerCase();

  if (subCategory.includes('laptop') || assetType === 'laptop') return 'laptop';
  if (subCategory.includes('monitor') || assetType === 'monitor') return 'monitor';
  if (subCategory.includes('desktop') || assetType === 'desktop') return 'desktop';
  if (subCategory.includes('mobile') || assetType === 'phone') return 'phone';
  if (assetType === 'tablet') return 'tablet';
  if (category.includes('furniture')) return 'furniture';
  if (category.includes('vehicle')) return 'vehicle';
  if (assetType === 'server') return 'server';
  if (category.includes('software') || assetType === 'license') return 'software';
  if (subCategory.includes('printer')) return 'printer';
  return 'default';
}
