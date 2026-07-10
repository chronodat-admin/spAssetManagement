import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { exportAssetsToCsv } from '../lib/utils/assetExport.js';

describe('assetExport', () => {
  it('exports CSV with lookup values and escaped cells', async () => {
    let capturedBlob;
    let clicked = false;
    let download = '';
    const previousDocument = globalThis.document;
    const previousUrl = globalThis.URL;

    globalThis.URL = {
      createObjectURL(blob) {
        capturedBlob = blob;
        return 'blob:test';
      },
      revokeObjectURL(url) {
        assert.equal(url, 'blob:test');
      }
    };
    globalThis.document = {
      createElement(tagName) {
        assert.equal(tagName, 'a');
        return {
          href: '',
          set download(value) {
            download = value;
          },
          get download() {
            return download;
          },
          click() {
            clicked = true;
          }
        };
      }
    };

    try {
      exportAssetsToCsv(
        [
          {
            Id: 1,
            Title: 'Laptop, "Primary"',
            AM_AssetId: 'AM-001',
            AM_Status: { Id: 1, Title: 'Available' },
            AM_Category: { Id: 2, Title: 'IT Hardware' },
            AM_Vendor: { Id: 3, Title: 'Dell' },
            AM_Location: { Id: 4, Title: 'HQ' },
            AM_AssignedTo: { Id: 5, Title: 'Alex Owner', Email: 'alex@example.com' },
            AM_Cost: 1200
          }
        ],
        'assets.csv'
      );

      assert.equal(clicked, true);
      assert.equal(download, 'assets.csv');
      const csv = await capturedBlob.text();
      assert.match(csv, /^Asset ID,Title,Status,Category,/);
      assert.match(csv, /AM-001,"Laptop, ""Primary""",Available,IT Hardware/);
      assert.match(csv, /Alex Owner,,1200/);
    } finally {
      globalThis.document = previousDocument;
      globalThis.URL = previousUrl;
    }
  });
});
