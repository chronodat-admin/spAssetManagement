export type RiskRatingLevel = 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low' | 'Not Assessed';

export interface RiskRatingResult {
  numericValue: number;
  level: RiskRatingLevel;
  description: string;
}

/** Numeric risk rating = Likelihood Rating × Consequence Rating (risk-v2 style). */
export function calculateRiskRating(
  likelihoodRating: number,
  consequenceRating: number
): RiskRatingResult {
  if (!likelihoodRating || !consequenceRating) {
    return {
      numericValue: 0,
      level: 'Not Assessed',
      description: 'Assessment pending'
    };
  }

  const numericValue = Math.round(likelihoodRating * consequenceRating * 100) / 100;
  let level: RiskRatingLevel;
  let description: string;

  if (numericValue >= 20) {
    level = 'Very High';
    description = 'Extreme risk requiring immediate attention';
  } else if (numericValue >= 15) {
    level = 'High';
    description = 'High risk requiring urgent attention';
  } else if (numericValue >= 10) {
    level = 'Medium';
    description = 'Medium risk requiring monitoring';
  } else if (numericValue >= 5) {
    level = 'Low';
    description = 'Low risk with minimal impact';
  } else {
    level = 'Very Low';
    description = 'Very low risk with negligible impact';
  }

  return { numericValue, level, description };
}

export function formatRiskRating(numericValue: number): string {
  if (!numericValue) {
    return '—';
  }
  return numericValue.toFixed(2);
}

export function formatAssetValueSummary(numericValue: number): string {
  return formatRiskRating(numericValue);
}
