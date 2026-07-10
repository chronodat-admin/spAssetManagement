import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterDashboardAssets,
  getAssetCategoryChartData,
  getAssetTypeChartData,
  getFinancialExposure,
  getLocationValueChartData,
  getPurchaseTrendChartData,
  getStatusChartData,
  getVendorChartData,
  getWarrantyExpiringChartData
} from '../lib/utils/dashboardAnalytics.js';

const assets = [
  {
    Id: 1,
    Title: 'Laptop A',
    AM_Status: 'Available',
    AM_Category: { Id: 10, Title: 'Hardware' },
    AM_Project: { Id: 20, Title: 'Refresh' },
    AM_Location: { Id: 1, Title: 'HQ' },
    AM_Cost: 1000,
    potentialcost: '$5,000',
    Riskstatus: 'Open'
  },
  {
    Id: 2,
    Title: 'Laptop B',
    AM_Status: 'Assigned',
    AM_Category: { Id: 10, Title: 'Hardware' },
    AM_Project: { Id: 21, Title: 'Support' },
    AM_Location: { Id: 2, Title: 'Remote' },
    AM_Cost: 500,
    potentialcost: '$2,500',
    Riskstatus: 'In Progress'
  },
  {
    Id: 3,
    Title: 'License',
    AM_Status: 'Retired',
    AM_Category: { Id: 11, Title: 'Software' },
    AM_Project: { Id: 20, Title: 'Refresh' },
    AM_IsDeleted: true,
    AM_Cost: 2000,
    potentialcost: '$10,000',
    Riskstatus: 'Closed'
  }
];

describe('dashboardAnalytics', () => {
  it('filters dashboard assets by category/project and excludes deleted assets', () => {
    assert.deepEqual(
      filterDashboardAssets(assets, { businessId: '10', projectId: '20' }).map((asset) => asset.Id),
      [1]
    );
    assert.deepEqual(
      filterDashboardAssets(assets, { businessId: 'all', projectId: 'all' }).map((asset) => asset.Id),
      [1, 2]
    );
  });

  it('builds status and asset category chart data', () => {
    const chartAssets = [
      { Id: 1, Title: 'Laptop A', AM_Status: 'Available', AM_Category: { Id: 10, Title: 'Hardware' } },
      { Id: 2, Title: 'Laptop B', AM_Status: 'Assigned', AM_Category: { Id: 10, Title: 'Hardware' } },
      { Id: 3, Title: 'Deleted', AM_Status: 'Retired', AM_Category: { Id: 11, Title: 'Software' }, AM_IsDeleted: true }
    ];
    const statusData = getStatusChartData(chartAssets);
    assert.equal(statusData.find((item) => item.name === 'Available')?.value, 1);
    assert.equal(statusData.find((item) => item.name === 'Assigned')?.value, 1);

    const categoryData = getAssetCategoryChartData(chartAssets);
    assert.deepEqual(categoryData, [
      { category: 'Hardware', open: 1, inProgress: 1, closed: 0 }
    ]);
  });

  it('calculates exposure and value charts without deleted assets', () => {
    const exposure = getFinancialExposure(assets);
    assert.equal(exposure.totalExposure, 7500);
    assert.equal(exposure.riskCount, 2);
    assert.deepEqual(exposure.topRisks.map((item) => item.riskId), ['1', '2']);

    assert.deepEqual(getLocationValueChartData(assets), [
      { location: 'HQ', value: 1000 },
      { location: 'Remote', value: 500 }
    ]);
  });

  it('builds asset type and vendor chart data', () => {
    const chartAssets = [
      {
        Id: 1,
        Title: 'Laptop',
        AM_AssetType: { Id: 1, Title: 'Laptop' },
        AM_Vendor: { Id: 1, Title: 'Dell' }
      },
      {
        Id: 2,
        Title: 'Monitor',
        AM_AssetType: { Id: 1, Title: 'Laptop' },
        AM_Vendor: { Id: 2, Title: 'HP' }
      },
      {
        Id: 3,
        Title: 'Deleted',
        AM_AssetType: { Id: 2, Title: 'Desktop' },
        AM_Vendor: { Id: 3, Title: 'Lenovo' },
        AM_IsDeleted: true
      }
    ];

    assert.deepEqual(getAssetTypeChartData(chartAssets), [{ type: 'Laptop', count: 2 }]);
    assert.deepEqual(getVendorChartData(chartAssets), [
      { vendor: 'Dell', count: 1 },
      { vendor: 'HP', count: 1 }
    ]);
  });

  it('buckets warranties expiring within 90 days', () => {
    const now = Date.now();
    const day = 86400000;
    const rows = getWarrantyExpiringChartData([
      { Id: 1, Title: 'A', AM_WarrantyExpiry: new Date(now + 15 * day).toISOString() },
      { Id: 2, Title: 'B', AM_WarrantyExpiry: new Date(now + 45 * day).toISOString() },
      { Id: 3, Title: 'C', AM_WarrantyExpiry: new Date(now + 80 * day).toISOString() },
      { Id: 4, Title: 'D', AM_WarrantyExpiry: new Date(now + 120 * day).toISOString() }
    ]);

    assert.deepEqual(rows, [
      { bucket: '0–30 days', count: 1 },
      { bucket: '31–60 days', count: 1 },
      { bucket: '61–90 days', count: 1 }
    ]);
  });

  it('builds purchase trend data for the trailing 12 months', () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 15);
    const rows = getPurchaseTrendChartData([
      { Id: 1, Title: 'A', AM_PurchaseDate: monthStart.toISOString() },
      { Id: 2, Title: 'B', AM_PurchaseDate: monthStart.toISOString() },
      { Id: 3, Title: 'Deleted', AM_PurchaseDate: monthStart.toISOString(), AM_IsDeleted: true }
    ]);

    assert.equal(rows.length, 12);
    const current = rows[rows.length - 1];
    assert.equal(current.count, 2);
  });
});
