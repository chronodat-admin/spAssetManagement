import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDepreciationSchedule,
  calculateBookValue,
  calculateMonthlyDepreciation,
  monthsBetween
} from '../lib/utils/depreciationCalculator.js';

describe('depreciationCalculator', () => {
  it('calculates straight-line monthly depreciation', () => {
    const monthly = calculateMonthlyDepreciation({
      cost: 12000,
      salvageValue: 0,
      usefulLifeMonths: 60,
      monthsElapsed: 1,
      method: 'StraightLine'
    });
    assert.equal(monthly, 200);
  });

  it('calculates straight-line book value after elapsed months', () => {
    const bookValue = calculateBookValue({
      cost: 12000,
      salvageValue: 2000,
      usefulLifeMonths: 50,
      monthsElapsed: 10,
      method: 'StraightLine'
    });
    assert.equal(bookValue, 10000);
  });

  it('never goes below salvage value', () => {
    const bookValue = calculateBookValue({
      cost: 5000,
      salvageValue: 1000,
      usefulLifeMonths: 12,
      monthsElapsed: 24,
      method: 'StraightLine'
    });
    assert.equal(bookValue, 1000);
  });

  it('builds a full depreciation schedule', () => {
    const schedule = buildDepreciationSchedule({
      cost: 6000,
      salvageValue: 0,
      usefulLifeMonths: 6,
      method: 'StraightLine'
    });
    assert.equal(schedule.length, 6);
    assert.equal(schedule[5].bookValue, 0);
  });

  it('counts months between purchase and reference date', () => {
    const months = monthsBetween('2024-01-15T00:00:00Z', new Date('2024-07-15T00:00:00Z'));
    assert.equal(months, 6);
  });

  it('calculates declining balance book value', () => {
    const bookValue = calculateBookValue({
      cost: 10000,
      salvageValue: 1000,
      usefulLifeMonths: 60,
      monthsElapsed: 12,
      method: 'DecliningBalance'
    });
    assert.ok(bookValue < 10000);
    assert.ok(bookValue >= 1000);
  });
});
