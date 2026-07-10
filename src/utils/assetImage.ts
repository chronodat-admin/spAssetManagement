export const ASSET_IMAGE_FILE_PREFIX = 'asset-image';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp']);

export function isAssetImageFileName(fileName: string): boolean {
  return fileName.toLowerCase().startsWith(`${ASSET_IMAGE_FILE_PREFIX}.`);
}

export function buildAssetImageFileName(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExtension = IMAGE_EXTENSIONS.has(extension) ? extension : 'jpg';
  return `${ASSET_IMAGE_FILE_PREFIX}.${safeExtension}`;
}

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/** Normalizes stored image URLs for use in img src attributes. */
export function resolveAssetImageUrl(imageUrl?: string, webOrigin?: string): string | undefined {
  if (!imageUrl) {
    return undefined;
  }
  const trimmed = imageUrl.trim();
  if (!trimmed) {
    return undefined;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  if (trimmed.startsWith('/') && webOrigin) {
    return `${webOrigin}${trimmed}`;
  }
  return trimmed;
}

export function svgMarkupToArrayBuffer(svg: string): ArrayBuffer {
  const encoded = new TextEncoder().encode(svg);
  return encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength);
}
