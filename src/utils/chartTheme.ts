export interface IRechartsTheme {
  tickFill: string;
  barBackground: string;
  labelFill: string;
  tooltipCursor: string;
  donutStroke: string;
}

export function getRechartsTheme(isDark: boolean): IRechartsTheme {
  if (isDark) {
    return {
      tickFill: '#cbd5e1',
      barBackground: '#334155',
      labelFill: '#e2e8f0',
      tooltipCursor: 'rgba(148, 163, 184, 0.18)',
      donutStroke: '#1f1f1f'
    };
  }

  return {
    tickFill: '#374151',
    barBackground: '#f1f5f9',
    labelFill: '#4b5563',
    tooltipCursor: 'rgba(148, 163, 184, 0.12)',
    donutStroke: '#ffffff'
  };
}
