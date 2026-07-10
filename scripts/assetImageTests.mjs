import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAssetImageFileName,
  isAssetImageFileName,
  isImageMimeType,
  resolveAssetImageUrl
} from '../lib/utils/assetImage.js';
import {
  ASSET_SEED_IMAGE_FILE_NAME,
  buildSeedAssetImageSvg,
  resolveAssetImageSeedKey
} from '../lib/constants/assetSeedImageData.js';

describe('assetImage utils', () => {
  it('detects asset image attachment names', () => {
    assert.equal(isAssetImageFileName('asset-image.jpg'), true);
    assert.equal(isAssetImageFileName('invoice.pdf'), false);
  });

  it('builds stable asset image file names', () => {
    const file = { name: 'photo.PNG' };
    assert.equal(buildAssetImageFileName(file), 'asset-image.png');
  });

  it('accepts image mime types only', () => {
    assert.equal(isImageMimeType('image/jpeg'), true);
    assert.equal(isImageMimeType('application/pdf'), false);
  });

  it('resolves absolute and site-relative image urls', () => {
    assert.equal(
      resolveAssetImageUrl('https://contoso.sharepoint.com/x/y.png'),
      'https://contoso.sharepoint.com/x/y.png'
    );
    assert.equal(
      resolveAssetImageUrl('/sites/demo/Lists/AM_Assets/Attachments/1/asset-image.svg', 'https://contoso.sharepoint.com'),
      'https://contoso.sharepoint.com/sites/demo/Lists/AM_Assets/Attachments/1/asset-image.svg'
    );
  });
});

describe('asset seed images', () => {
  it('builds compact svg placeholders', () => {
    const svg = buildSeedAssetImageSvg('laptop');
    assert.match(svg, /<svg[\s\S]*Laptop/);
    assert.equal(ASSET_SEED_IMAGE_FILE_NAME, 'asset-image.svg');
  });

  it('infers seed keys from asset metadata', () => {
    assert.equal(
      resolveAssetImageSeedKey({ CategoryTitle: 'Software', AssetTypeTitle: 'License' }),
      'software'
    );
    assert.equal(
      resolveAssetImageSeedKey({ ImageSeedKey: 'vehicle', CategoryTitle: 'Vehicles' }),
      'vehicle'
    );
  });
});
