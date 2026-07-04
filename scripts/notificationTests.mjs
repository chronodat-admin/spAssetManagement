import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  arraysEqual,
  buildRiskItemUrl,
  formatRiskDueDate,
  resolveEmailTemplateContent,
  substituteNotificationPlaceholders
} from '../lib/lib/workflow-settings/notifications.js';
import {
  filterValidEmailRecipients,
  hasRiskGeneralFieldChanges,
  planNotificationDispatch,
  resolveLegacyWorkflowEnabled,
  resolveNotificationRecipientEmails,
  resolveStatusNotificationKey,
  selectRiskUpdateNotificationEvents
} from '../lib/lib/workflow-settings/notificationLogic.js';
import {
  DEFAULT_NOTIFICATION_WORKFLOWS,
  DEFAULT_EMAIL_TEMPLATES
} from '../lib/lib/workflow-settings/defaults.js';
import {
  isLegacyEmailTemplateBody,
  isLegacyNotificationBody,
  mergeEmailTemplatesWithRefresh,
  mergeNotificationWorkflowsWithRefresh
} from '../lib/lib/workflow-settings/templateRefresh.js';

const sampleRisk = {
  Id: 42,
  Title: 'Server outage risk',
  RiskID: 'R-0042',
  Riskstatus: 'Open',
  Likelihood: 'Medium',
  Consequence: 'High',
  RiskDueDate: '2026-06-15T00:00:00Z',
  AssignedTo: [{ Id: 7, Title: 'Alex Owner', Email: 'alex.owner@example.com' }],
  Author: { Id: 3, Title: 'Casey Creator', Email: 'casey.creator@example.com' },
  RiskCategory: { Id: 1, Title: 'Operational' },
  riskBusiness: { Id: 2, Title: 'Marketing' },
  RiskProfileType: { Id: 3, Title: 'Standard' }
};

describe('notification placeholders', () => {
  it('substitutes known tokens and leaves unknown tokens intact', () => {
    const values = {
      RiskID: 'R-001',
      Title: 'Test risk',
      Status: 'Open',
      RiskUrl: 'https://tenant.sharepoint.com/sites/rm/Lists/Risks/DispForm.aspx?ID=1'
    };

    const subject = substituteNotificationPlaceholders(
      'Risk {RiskID} - {Title} ({Status})',
      values
    );
    assert.equal(subject, 'Risk R-001 - Test risk (Open)');

    const body = substituteNotificationPlaceholders('View {RiskUrl} or {UnknownToken}', values);
    assert.match(body, /View https:\/\/tenant\.sharepoint\.com/);
    assert.match(body, /\{UnknownToken\}/);
  });

  it('substitutes field-name aliases used in confirmation templates', () => {
    const values = {
      RiskID: 'R-001',
      Title: 'Test risk',
      Status: 'Open',
      Category: 'Operational',
      CreatedByName: 'Casey Creator',
      RiskDescription: 'Summary text',
      LinkTitle: 'Test risk',
      RiskUrl: 'https://tenant.sharepoint.com/sites/rm/SitePages/Risk.aspx?riskItemId=1&riskSource=email'
    };

    const body = substituteNotificationPlaceholders(
      'Created By: {CreatedBy}\nStatus: {Riskstatus}\nCategory: {RiskCategory}\nSummary: {RiskDescription}\n{LinkTitle}',
      values
    );
    assert.match(body, /Created By: Casey Creator/);
    assert.match(body, /Status: Open/);
    assert.match(body, /Category: Operational/);
    assert.match(body, /Summary: Summary text/);
    assert.match(body, /Test risk$/);
  });

  it('builds a risk display form URL from web URL and item id', () => {
    assert.equal(
      buildRiskItemUrl('https://tenant.sharepoint.com/sites/rm/', 99),
      'https://tenant.sharepoint.com/sites/rm/Lists/Risks/DispForm.aspx?ID=99'
    );
  });

  it('prefers the app page URL with email deep-link query params', () => {
    assert.equal(
      buildRiskItemUrl(
        'https://tenant.sharepoint.com/sites/rm/',
        42,
        'https://tenant.sharepoint.com/sites/rm/SitePages/Risk-Hub.aspx'
      ),
      'https://tenant.sharepoint.com/sites/rm/SitePages/Risk-Hub.aspx?riskItemId=42&riskSource=email'
    );
  });

  it('ignores the Teams host wrapper page and falls back to the DispForm link', () => {
    assert.equal(
      buildRiskItemUrl(
        'https://tenant.sharepoint.com/sites/rm/',
        19,
        'https://tenant.sharepoint.com/sites/rm/_layouts/15/teamshostedapp.aspx?webPartInstanceId=abc'
      ),
      'https://tenant.sharepoint.com/sites/rm/Lists/Risks/DispForm.aspx?ID=19'
    );
  });

  it('formats due dates for email placeholders', () => {
    const formatted = formatRiskDueDate('2026-06-15T00:00:00Z');
    assert.match(formatted, /2026/);
    assert.equal(formatRiskDueDate(''), '');
    assert.equal(formatRiskDueDate('not-a-date'), 'not-a-date');
  });
});

describe('email template resolution', () => {
  it('uses active reusable templates when mapped by workflow key', () => {
    const content = resolveEmailTemplateContent(
      'open',
      DEFAULT_NOTIFICATION_WORKFLOWS.open.subject,
      DEFAULT_NOTIFICATION_WORKFLOWS.open.body,
      DEFAULT_EMAIL_TEMPLATES
    );

    assert.match(content.subject, /Risk \{RiskID\}/);
    assert.match(content.body, /<p>/);
    assert.equal(content.isHtml, true);
  });

  it('falls back to workflow subject/body when template slug is inactive', () => {
    const templates = DEFAULT_EMAIL_TEMPLATES.map((item) =>
      item.slug === 'risk_created' ? { ...item, isActive: false } : item
    );

    const content = resolveEmailTemplateContent(
      'open',
      DEFAULT_NOTIFICATION_WORKFLOWS.open.subject,
      DEFAULT_NOTIFICATION_WORKFLOWS.open.body,
      templates
    );

    assert.equal(content.subject, DEFAULT_NOTIFICATION_WORKFLOWS.open.subject);
    assert.equal(content.body, DEFAULT_NOTIFICATION_WORKFLOWS.open.body);
    assert.equal(content.isHtml, false);
  });
});

describe('recipient resolution', () => {
  it('resolves creator, assignee, org email, and administrators', () => {
    const recipients = resolveNotificationRecipientEmails(
      ['creator', 'assignee', 'org_email', 'org_admins'],
      sampleRisk,
      {
        supportGroup: 'riskdesk@example.com',
        adminEmails: ['admin1@example.com', 'admin2@example.com']
      }
    );

    assert.deepEqual(recipients.sort(), [
      'admin1@example.com',
      'admin2@example.com',
      'alex.owner@example.com',
      'casey.creator@example.com',
      'riskdesk@example.com'
    ]);
  });

  it('falls back to current user email when creator email is missing', () => {
    const recipients = resolveNotificationRecipientEmails(['creator'], {
      ...sampleRisk,
      Author: { Id: 3, Title: 'Casey Creator' }
    }, {
      currentUserEmail: 'editor@example.com'
    });

    assert.deepEqual(recipients, ['editor@example.com']);
  });

  it('does not treat Support Group text without @ as org_email recipient', () => {
    const recipients = resolveNotificationRecipientEmails(['org_email'], sampleRisk, {
      supportGroup: 'Asset Management Desk'
    });

    assert.deepEqual(recipients, []);
  });

  it('skips assignee notifications when AssignedTo users have no email', () => {
    const recipients = resolveNotificationRecipientEmails(['assignee'], {
      ...sampleRisk,
      AssignedTo: [{ Id: 7, Title: 'Alex Owner' }]
    });

    assert.deepEqual(recipients, []);
  });

  it('filters invalid email addresses before send', () => {
    assert.deepEqual(
      filterValidEmailRecipients([' valid@example.com ', '', 'not-an-email', 'other@example.com']),
      ['valid@example.com', 'other@example.com']
    );
  });
});

describe('risk update notification event selection', () => {
  const baseInput = {
    Title: sampleRisk.Title,
    Riskstatus: sampleRisk.Riskstatus,
    AssignedToUserIds: [7],
    Likelihood: sampleRisk.Likelihood,
    Consequence: sampleRisk.Consequence,
    RiskDueDate: sampleRisk.RiskDueDate,
    RiskCategoryId: sampleRisk.RiskCategory.Id,
    riskBusinessId: sampleRisk.riskBusiness.Id,
    RiskProfileTypeId: sampleRisk.RiskProfileType.Id,
    RiskSubCategoryId: null,
    RiskProjectId: null,
    RiskResponseId: null,
    RiskStrategyId: null
  };

  it('queues assignedTo when assignee ids change', () => {
    const events = selectRiskUpdateNotificationEvents(
      sampleRisk,
      { ...baseInput, AssignedToUserIds: [7, 8] },
      false
    );

    assert.deepEqual(events, ['assignedTo']);
  });

  it('queues closed workflow when status moves to closed bucket', () => {
    const events = selectRiskUpdateNotificationEvents(
      sampleRisk,
      { ...baseInput, Riskstatus: 'Closed' },
      false
    );

    assert.deepEqual(events, ['closed']);
  });

  it('queues riskPriorityChanged when likelihood or consequence changes', () => {
    const events = selectRiskUpdateNotificationEvents(
      sampleRisk,
      { ...baseInput, Likelihood: 'High' },
      false
    );

    assert.deepEqual(events, ['riskPriorityChanged']);
  });

  it('queues riskUpdated only when enabled and no higher-priority event fired', () => {
    const previous = { ...sampleRisk, Title: 'Old title' };
    const disabledEvents = selectRiskUpdateNotificationEvents(
      previous,
      { ...baseInput, Title: 'Server outage risk' },
      false
    );
    assert.deepEqual(disabledEvents, ['riskUpdated']);

    const enabledEvents = selectRiskUpdateNotificationEvents(
      previous,
      { ...baseInput, Title: 'Server outage risk' },
      true
    );
    assert.deepEqual(enabledEvents, ['riskUpdated']);
  });

  it('can send both assignedTo and riskUpdated when assignee and fields change', () => {
    const events = selectRiskUpdateNotificationEvents(
      { ...sampleRisk, Title: 'Old title' },
      {
        ...baseInput,
        Title: 'Server outage risk',
        AssignedToUserIds: [8]
      },
      true
    );

    assert.deepEqual(events, ['assignedTo', 'riskUpdated']);
  });

  it('does not send riskUpdated when that workflow is disabled', () => {
    const events = selectRiskUpdateNotificationEvents(
      { ...sampleRisk, Title: 'Old title' },
      {
        ...baseInput,
        Title: 'Server outage risk',
        AssignedToUserIds: [8]
      },
      false
    );

    assert.deepEqual(events, ['assignedTo']);
  });

  it('detects general field changes via hasRiskGeneralFieldChanges', () => {
    assert.equal(
      hasRiskGeneralFieldChanges(sampleRisk, { ...baseInput, MitigationPlan: 'New plan' }),
      true
    );
    assert.equal(hasRiskGeneralFieldChanges(sampleRisk, baseInput), false);
  });

  it('uses arraysEqual for assignee comparisons', () => {
    assert.equal(arraysEqual([3, 1, 2], [1, 2, 3]), true);
    assert.equal(arraysEqual([1], [1, 2]), false);
  });
});

describe('status notification mapping', () => {
  it('maps status names to workflow keys', () => {
    assert.equal(resolveStatusNotificationKey('Closed'), 'closed');
    assert.equal(resolveStatusNotificationKey('In Progress'), 'inProgress');
    assert.equal(resolveStatusNotificationKey('On Hold'), 'onHold');
    assert.equal(resolveStatusNotificationKey('Incomplete'), 'incomplete');
    assert.equal(resolveStatusNotificationKey('Open'), undefined);
  });
});

describe('workflow hydration and dispatch planning', () => {
  it('disables open notifications when legacy OpenNote is No', () => {
    assert.equal(
      resolveLegacyWorkflowEnabled('No', DEFAULT_NOTIFICATION_WORKFLOWS.open.enabled),
      false
    );
    assert.equal(
      resolveLegacyWorkflowEnabled('Yes', DEFAULT_NOTIFICATION_WORKFLOWS.open.enabled),
      true
    );
    assert.equal(
      resolveLegacyWorkflowEnabled(undefined, DEFAULT_NOTIFICATION_WORKFLOWS.open.enabled),
      true
    );
  });

  it('documents why an email would not be sent', () => {
    const disabledPlan = planNotificationDispatch(
      'riskUpdated',
      { ...DEFAULT_NOTIFICATION_WORKFLOWS.riskUpdated, enabled: false },
      'Subject',
      'Body',
      ['user@example.com']
    );
    assert.equal(disabledPlan.skipped, 'workflow_disabled');

    const noRecipientsPlan = planNotificationDispatch(
      'open',
      DEFAULT_NOTIFICATION_WORKFLOWS.open,
      'Subject',
      'Body',
      ['not-an-email']
    );
    assert.equal(noRecipientsPlan.skipped, 'no_recipients');

    const sendPlan = planNotificationDispatch(
      'open',
      DEFAULT_NOTIFICATION_WORKFLOWS.open,
      'Subject',
      'Body',
      ['user@example.com']
    );
    assert.equal(sendPlan.skipped, undefined);
    assert.deepEqual(sendPlan.recipients, ['user@example.com']);
  });

  it('default open workflow targets creator and org email', () => {
    assert.equal(DEFAULT_NOTIFICATION_WORKFLOWS.open.enabled, true);
    assert.deepEqual(DEFAULT_NOTIFICATION_WORKFLOWS.open.recipients, ['creator', 'org_email']);
    assert.equal(DEFAULT_NOTIFICATION_WORKFLOWS.riskUpdated.enabled, false);
  });
});

describe('email template refresh', () => {
  it('detects legacy notification and HTML template bodies', () => {
    assert.equal(isLegacyNotificationBody('Risk {RiskID} - {Title}\n\nView: {RiskUrl}'), true);
    assert.equal(isLegacyNotificationBody(DEFAULT_NOTIFICATION_WORKFLOWS.open.body), false);
    assert.equal(
      isLegacyEmailTemplateBody('<p><a href="{RiskUrl}">View risk</a></p>'),
      true
    );
    assert.equal(isLegacyEmailTemplateBody(DEFAULT_EMAIL_TEMPLATES[0].bodyHtml), false);
  });

  it('refreshes legacy saved templates on merge while preserving custom templates', () => {
    const legacyWorkflows = {
      open: {
        ...DEFAULT_NOTIFICATION_WORKFLOWS.open,
        body: 'Old body\n\nView: {RiskUrl}'
      }
    };
    const refreshedWorkflows = mergeNotificationWorkflowsWithRefresh(legacyWorkflows);
    assert.equal(refreshedWorkflows.open.body, DEFAULT_NOTIFICATION_WORKFLOWS.open.body);

    const legacyTemplates = DEFAULT_EMAIL_TEMPLATES.map((item) =>
      item.slug === 'risk_created'
        ? {
            ...item,
            bodyHtml: '<p>A new risk <strong>{RiskID}</strong> - {Title} has been created.</p>'
          }
        : item
    );
    const refreshedTemplates = mergeEmailTemplatesWithRefresh(legacyTemplates);
    const created = refreshedTemplates.find((item) => item.slug === 'risk_created');
    assert.match(created.bodyHtml, /{CreatedBy}/);
    assert.match(created.bodyHtml, /{LinkTitle}/);

    const customTemplates = DEFAULT_EMAIL_TEMPLATES.map((item) =>
      item.slug === 'risk_created'
        ? {
            ...item,
            bodyHtml:
              '<p>Custom notice for {RiskID}</p><p>To view the risk details:<br/><a href="{RiskUrl}">{LinkTitle}</a></p>'
          }
        : item
    );
    const preservedTemplates = mergeEmailTemplatesWithRefresh(customTemplates);
    const custom = preservedTemplates.find((item) => item.slug === 'risk_created');
    assert.match(custom.bodyHtml, /Custom notice for \{RiskID\}/);
  });

  it('includes dedicated templates for in progress, incomplete, and on hold', () => {
    const slugs = DEFAULT_EMAIL_TEMPLATES.map((item) => item.slug);
    assert.ok(slugs.includes('risk_in_progress'));
    assert.ok(slugs.includes('risk_incomplete'));
    assert.ok(slugs.includes('risk_on_hold'));
  });
});
