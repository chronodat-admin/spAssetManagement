import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { migrateLegacyWorkflowSlugs, usesLegacyWorkflowSlugs } from '../lib/lib/workflow-settings/migrateLegacySlugs.js';
import { cloneDefaultWorkflowSettings } from '../lib/lib/workflow-settings/defaults.js';
import { parseWorkflowSettings } from '../lib/lib/workflow-settings/storage.js';

describe('migrateLegacyWorkflowSlugs', () => {
  it('renames legacy email template slugs and entity types', () => {
    const migrated = migrateLegacyWorkflowSlugs({
      emailTemplates: [
        {
          id: '1',
          name: 'Asset created',
          slug: 'risk_created',
          subject: 'Subject',
          bodyHtml: '<p>{LinkTitle}</p>',
          entityType: 'risk',
          variables: [],
          isActive: true
        }
      ]
    });

    assert.equal(migrated.emailTemplates?.[0]?.slug, 'asset_created');
    assert.equal(migrated.emailTemplates?.[0]?.entityType, 'asset');
    assert.equal(usesLegacyWorkflowSlugs({ emailTemplates: migrated.emailTemplates }), false);
  });

  it('renames workflow rule triggers and numbering entity types', () => {
    const migrated = migrateLegacyWorkflowSlugs({
      workflowRules: [
        {
          id: 'rule-1',
          name: 'Notify assignee',
          triggerEvent: 'risk_assigned',
          conditions: [],
          actions: [],
          isActive: false
        }
      ],
      numbering: [
        {
          entityType: 'risk',
          prefix: 'RISK',
          separator: '-',
          dateFormat: 'YYYY',
          padLength: 4,
          enabled: true,
          nextValue: 12,
          resetFrequency: 'yearly',
          sequenceCounters: {}
        }
      ],
      scheduledReports: [
        {
          id: 'report-1',
          reportType: 'risks',
          frequency: 'weekly',
          recipients: ['admin@example.com'],
          isActive: true
        }
      ]
    });

    assert.equal(migrated.workflowRules?.[0]?.triggerEvent, 'asset_assigned');
    assert.equal(migrated.numbering?.[0]?.entityType, 'asset');
    assert.equal(migrated.numbering?.[0]?.prefix, 'AST');
    assert.equal(migrated.scheduledReports?.[0]?.reportType, 'assets');
  });

  it('maps risk_resolved to asset_closed', () => {
    const migrated = migrateLegacyWorkflowSlugs({
      emailTemplates: [
        {
          id: 'closed',
          name: 'Asset closed',
          slug: 'risk_resolved',
          subject: 'Closed',
          bodyHtml: '<p>{LinkTitle}</p>',
          entityType: 'risk',
          variables: [],
          isActive: true
        }
      ]
    });

    assert.equal(migrated.emailTemplates?.[0]?.slug, 'asset_closed');
  });

  it('parseWorkflowSettings applies migration before merge', () => {
    const settings = parseWorkflowSettings({
      WorkflowSettings: JSON.stringify({
        emailTemplates: cloneDefaultWorkflowSettings().emailTemplates.map((item) =>
          item.slug === 'asset_created'
            ? { ...item, slug: 'risk_created', entityType: 'risk' }
            : item
        )
      })
    });

    const created = settings.emailTemplates?.find((item) => item.slug === 'asset_created');
    assert.ok(created);
    assert.equal(created.entityType, 'asset');
  });
});
