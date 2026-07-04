import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getAssetDashboardStats } from '../lib/utils/assetDashboardStats.js';

describe('dashboardAnalytics asset stats', () => {
  it('aggregates asset dashboard KPIs', () => {
    const stats = getAssetDashboardStats([
      { Id: 1, Title: 'A', AM_Status: 'Available', AM_Cost: 1000 },
      { Id: 2, Title: 'B', AM_Status: 'Assigned', AM_AssignedTo: { Id: 1, Title: 'User' }, AM_Cost: 500 },
      { Id: 3, Title: 'C', AM_Status: 'In Repair' },
      { Id: 4, Title: 'D', AM_IsDeleted: true, AM_Status: 'Available' },
      {
        Id: 5,
        Title: 'E',
        AM_Status: 'Available',
        AM_WarrantyExpiry: new Date(Date.now() + 86400000 * 30).toISOString()
      }
    ]);

    assert.equal(stats.total, 4);
    assert.equal(stats.available, 2);
    assert.equal(stats.assigned, 1);
    assert.equal(stats.inRepair, 1);
    assert.equal(stats.warrantyExpiring, 1);
    assert.equal(stats.totalValue, 1500);
  });
});
