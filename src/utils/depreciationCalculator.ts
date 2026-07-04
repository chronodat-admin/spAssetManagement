export type DepreciationMethod = 'StraightLine' | 'DecliningBalance';

export interface IDepreciationInput {
  cost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  monthsElapsed: number;
  method: DepreciationMethod;
}

export interface IDepreciationScheduleRow {
  month: number;
  depreciation: number;
  accumulated: number;
  bookValue: number;
}

function clampMonths(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.floor(value);
}

/** Monthly depreciation for a single period. */
export function calculateMonthlyDepreciation(input: IDepreciationInput): number {
  const cost = Math.max(0, input.cost);
  const salvage = Math.max(0, input.salvageValue);
  const life = Math.max(1, input.usefulLifeMonths);
  const elapsed = clampMonths(input.monthsElapsed);
  if (elapsed <= 0 || cost <= salvage) {
    return 0;
  }

  const depreciableBase = Math.max(0, cost - salvage);
  if (input.method === 'DecliningBalance') {
    const bookValue = calculateBookValue({ ...input, monthsElapsed: elapsed - 1 });
    const rate = 2 / life;
    const amount = bookValue * rate;
    return Math.min(amount, Math.max(0, bookValue - salvage));
  }

  return depreciableBase / life;
}

/** Book value after elapsed months. */
export function calculateBookValue(input: IDepreciationInput): number {
  const cost = Math.max(0, input.cost);
  const salvage = Math.max(0, input.salvageValue);
  const life = Math.max(1, input.usefulLifeMonths);
  const elapsed = Math.min(clampMonths(input.monthsElapsed), life);

  if (cost <= salvage || elapsed <= 0) {
    return cost;
  }

  if (input.method === 'DecliningBalance') {
    let bookValue = cost;
    for (let month = 1; month <= elapsed; month += 1) {
      const monthly = calculateMonthlyDepreciation({ ...input, monthsElapsed: month });
      bookValue = Math.max(salvage, bookValue - monthly);
    }
    return Math.round(bookValue * 100) / 100;
  }

  const depreciableBase = cost - salvage;
  const accumulated = (depreciableBase / life) * elapsed;
  return Math.round(Math.max(salvage, cost - accumulated) * 100) / 100;
}

/** Full depreciation schedule from purchase through useful life. */
export function buildDepreciationSchedule(input: Omit<IDepreciationInput, 'monthsElapsed'>): IDepreciationScheduleRow[] {
  const life = Math.max(1, input.usefulLifeMonths);
  const rows: IDepreciationScheduleRow[] = [];
  let accumulated = 0;

  for (let month = 1; month <= life; month += 1) {
    const depreciation = calculateMonthlyDepreciation({ ...input, monthsElapsed: month });
    accumulated += depreciation;
    rows.push({
      month,
      depreciation: Math.round(depreciation * 100) / 100,
      accumulated: Math.round(accumulated * 100) / 100,
      bookValue: calculateBookValue({ ...input, monthsElapsed: month })
    });
  }

  return rows;
}

export function monthsBetween(startIso: string, end: Date = new Date()): number {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) {
    return 0;
  }
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(0, months);
}
