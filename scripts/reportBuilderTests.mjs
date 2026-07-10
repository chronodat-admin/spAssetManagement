import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyReportFilters,
  csvEscapeReportValue,
  downloadReportCsv,
  formatReportCellValue
} from '../lib/lib/report-builder/csvExport.js';
import {
  getAvailableReportColumns,
  getCustomColumnsFromTemplates,
  getDefaultSelectedColumnKeys,
  getStaticReportColumns
} from '../lib/lib/report-builder/columns.js';

describe('report builder columns', () => {
  it('builds static and custom risk columns with safe defaults', () => {
    const staticColumns = getStaticReportColumns('risks');
    assert.equal(staticColumns[0].key, 'RiskCode');
    assert.equal(staticColumns.some((column) => column.key === 'Title'), true);

    const customColumns = getCustomColumnsFromTemplates([
      {
        id: 'template-1',
        name: 'Hardware',
        entityType: 'assets',
        isActive: true,
        fields: [
          { id: 'serial-check', label: 'Serial Check', type: 'checkbox' },
          { id: 'cost-center', label: 'Cost Center', type: 'text' },
          { id: 'serial-check', label: 'Duplicate', type: 'text' }
        ]
      },
      {
        id: 'inactive',
        name: 'Inactive',
        entityType: 'assets',
        isActive: false,
        fields: [{ id: 'ignored', label: 'Ignored', type: 'text' }]
      }
    ]);

    assert.deepEqual(
      customColumns.map((column) => [column.key, column.label, column.type, column.isCustom]),
      [
        ['_custom_serial-check', 'Serial Check (Custom)', 'boolean', true],
        ['_custom_cost-center', 'Cost Center (Custom)', 'string', true]
      ]
    );
    assert.equal(getAvailableReportColumns('business', [{ isActive: true, fields: [{ id: 'ignored', label: 'Ignored', type: 'text' }] }]).some((column) => column.isCustom), false);
    assert.deepEqual(getDefaultSelectedColumnKeys(staticColumns), staticColumns.slice(0, 6).map((column) => column.key));
  });
});

describe('report builder filters and CSV export', () => {
  it('formats report cell values and applies preview filters', () => {
    assert.equal(formatReportCellValue(null), '');
    assert.equal(formatReportCellValue(true), 'Yes');
    assert.equal(formatReportCellValue(1200), '1,200');
    assert.equal(csvEscapeReportValue('Laptop, "Primary"'), '"Laptop, ""Primary"""');

    const rows = [
      { Title: 'Laptop A', Status: 'Available', Cost: 1000 },
      { Title: 'Laptop B', Status: 'Assigned', Cost: 900 },
      { Title: 'Monitor', Status: 'Available', Cost: 250 }
    ];

    assert.deepEqual(
      applyReportFilters(rows, [
        { field: 'Status', operator: 'equals', value: 'Available' },
        { field: 'Title', operator: 'contains', value: 'lap' }
      ]),
      [{ Title: 'Laptop A', Status: 'Available', Cost: 1000 }]
    );
    assert.deepEqual(
      applyReportFilters(rows, [{ field: 'Status', operator: 'not_equals', value: 'Assigned' }]).map((row) => row.Title),
      ['Laptop A', 'Monitor']
    );
  });

  it('downloads CSV with BOM, escaped values, and dated filename', async () => {
    const previousDocument = globalThis.document;
    const previousUrl = globalThis.URL;
    const previousDate = globalThis.Date;
    let capturedBlob;
    let appended = false;
    let removed = false;
    let clicked = false;
    let download = '';

    class FixedDate extends Date {
      constructor(...args) {
        super(...(args.length ? args : ['2026-07-04T12:00:00Z']));
      }

      static now() {
        return new previousDate('2026-07-04T12:00:00Z').getTime();
      }
    }

    globalThis.Date = FixedDate;
    globalThis.URL = {
      createObjectURL(blob) {
        capturedBlob = blob;
        return 'blob:report';
      },
      revokeObjectURL(url) {
        assert.equal(url, 'blob:report');
      }
    };
    globalThis.document = {
      body: {
        appendChild(anchor) {
          appended = anchor.href === 'blob:report';
        }
      },
      createElement(tagName) {
        assert.equal(tagName, 'a');
        return {
          href: '',
          style: {},
          set download(value) {
            download = value;
          },
          click() {
            clicked = true;
          },
          remove() {
            removed = true;
          }
        };
      }
    };

    try {
      downloadReportCsv(
        [{ Title: 'Laptop, "Primary"', Status: 'Available' }],
        [
          { key: 'Title', label: 'Title' },
          { key: 'Status', label: 'Status' }
        ],
        'assets'
      );

      const csv = await capturedBlob.text();
      assert.equal(appended, true);
      assert.equal(clicked, true);
      assert.equal(removed, true);
      assert.equal(download, 'assets-report-2026-07-04.csv');
      assert.match(csv, /^Title,Status\r\n"Laptop, ""Primary""",Available$/);
    } finally {
      globalThis.document = previousDocument;
      globalThis.URL = previousUrl;
      globalThis.Date = previousDate;
    }
  });
});
