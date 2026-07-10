import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  allocateEntityCodeWithAutoEnable,
  allocateEntityNumber,
  enableNumberingForEntity,
  formatNumberFromConfig,
  getNumberingPeriodKey,
  previewNumberingFormat
} from '../lib/lib/workflow-settings/numberingEngine.js';
import { cloneDefaultWorkflowSettings } from '../lib/lib/workflow-settings/defaults.js';

describe('numberingEngine', () => {
  it('formats preview numbers from config', () => {
    const settings = cloneDefaultWorkflowSettings();
    const project = settings.numbering.find((item) => item.entityType === 'project');
    assert.ok(project);
    const preview = previewNumberingFormat(project);
    assert.match(preview, /^PROJ-\d{4}-\d{4}$/);
    assert.equal(formatNumberFromConfig(project, 7), previewNumberingFormat({ ...project, nextValue: 7 }));
  });

  it('uses AST prefix for assets by default', () => {
    const settings = cloneDefaultWorkflowSettings();
    const asset = settings.numbering.find((item) => item.entityType === 'asset');
    assert.ok(asset);
    assert.equal(asset.prefix, 'AST');
    assert.match(previewNumberingFormat(asset), /^AST-\d{4}-\d{4}$/);
  });

  it('allocates sequential project numbers when enabled', () => {
    const settings = cloneDefaultWorkflowSettings();
    const first = allocateEntityNumber(settings, 'project');
    assert.ok(first);
    assert.match(first.number, /^PROJ-\d{4}-\d{4}$/);
    assert.equal(first.sequence, 1);

    const second = allocateEntityNumber(first.updatedSettings, 'project');
    assert.ok(second);
    assert.notEqual(second.number, first.number);
    assert.equal(second.sequence, 2);
  });

  it('returns undefined when vendor numbering is disabled', () => {
    const settings = cloneDefaultWorkflowSettings();
    const vendor = settings.numbering.find((item) => item.entityType === 'vendor');
    assert.ok(vendor);
    assert.equal(vendor.enabled, false);
    assert.equal(allocateEntityNumber(settings, 'vendor'), undefined);
  });

  it('auto-enables disabled vendor numbering on first allocate', () => {
    const settings = cloneDefaultWorkflowSettings();
    const allocated = allocateEntityCodeWithAutoEnable(settings, 'vendor');
    assert.ok(allocated);
    assert.match(allocated.number, /^VND-\d{4}-\d{4}$/);

    const updatedVendor = allocated.updatedSettings.numbering.find((item) => item.entityType === 'vendor');
    assert.equal(updatedVendor?.enabled, true);
    const periodKey = getNumberingPeriodKey('yearly');
    assert.equal(updatedVendor?.sequenceCounters?.[periodKey], 1);

    const second = allocateEntityNumber(allocated.updatedSettings, 'vendor');
    assert.ok(second);
    assert.equal(second.sequence, 2);
  });

  it('enableNumberingForEntity only toggles the requested entity', () => {
    const settings = cloneDefaultWorkflowSettings();
    const enabled = enableNumberingForEntity(settings, 'project');
    const project = enabled.numbering.find((item) => item.entityType === 'project');
    const vendor = enabled.numbering.find((item) => item.entityType === 'vendor');
    assert.equal(project?.enabled, true);
    assert.equal(vendor?.enabled, false);
  });

  it('uses yearly period keys for reset frequency', () => {
    assert.match(getNumberingPeriodKey('yearly', new Date('2026-06-22T12:00:00Z')), /^2026$/);
    assert.equal(getNumberingPeriodKey('never'), 'global');
  });
});
