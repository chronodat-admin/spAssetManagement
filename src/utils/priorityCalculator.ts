import { CONSEQUENCE_CHOICES, LIKELIHOOD_CHOICES } from '../constants/assetChoices.js';

export type MatrixPriority = 'Critical' | 'Major' | 'Moderate' | 'Low' | 'Not Assessed';

export interface MatrixPriorityResult {
  level: MatrixPriority;
  numericValue: number;
}

/** Parse leading (n) from Risks list choice values, e.g. "(4) Likely" -> 4 */
export function parseChoiceScore(value?: string): number {
  if (!value) {
    return 0;
  }
  const match = value.match(/\((\d+)\)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Map Risks choice scores to matrix indices (0-4).
 * Likelihood: (5) Almost Certain -> row 0 (top), (1) Rare -> row 4.
 * Consequence: (1) Insignificant -> col 0, (5) Critical -> col 4.
 */
export function getMatrixIndices(
  likelihood?: string,
  consequence?: string
): { likelihoodIdx: number; consequenceIdx: number } | undefined {
  const lScore = parseChoiceScore(likelihood);
  const cScore = parseChoiceScore(consequence);
  if (!lScore || !cScore) {
    return undefined;
  }
  return {
    likelihoodIdx: 5 - lScore,
    consequenceIdx: cScore - 1
  };
}

/**
 * Cell-based priority from risk-v2/lib/priority-calculator.ts
 * (aligned to SortOrder-style matrix indices).
 */
export function calculateMatrixPriority(
  likelihoodIdx: number,
  consequenceIdx: number
): MatrixPriorityResult {
  let level: MatrixPriority = 'Low';
  let numericValue = 1;

  if (likelihoodIdx === 0) {
    if (consequenceIdx >= 3) {
      level = 'Critical';
      numericValue = 5;
    } else if (consequenceIdx >= 1) {
      level = 'Major';
      numericValue = 4;
    } else {
      level = 'Moderate';
      numericValue = 3;
    }
  } else if (likelihoodIdx === 1) {
    if (consequenceIdx >= 3) {
      level = 'Critical';
      numericValue = 5;
    } else if (consequenceIdx >= 2) {
      level = 'Major';
      numericValue = 4;
    } else {
      level = 'Moderate';
      numericValue = 3;
    }
  } else if (likelihoodIdx === 2) {
    if (consequenceIdx >= 4) {
      level = 'Critical';
      numericValue = 5;
    } else if (consequenceIdx >= 2) {
      level = 'Major';
      numericValue = 4;
    } else if (consequenceIdx >= 1) {
      level = 'Moderate';
      numericValue = 3;
    } else {
      level = 'Low';
      numericValue = 2;
    }
  } else if (likelihoodIdx === 3) {
    if (consequenceIdx >= 3) {
      level = 'Major';
      numericValue = 4;
    } else if (consequenceIdx >= 1) {
      level = 'Moderate';
      numericValue = 3;
    } else {
      level = 'Low';
      numericValue = 2;
    }
  } else {
    if (consequenceIdx >= 4) {
      level = 'Major';
      numericValue = 4;
    } else if (consequenceIdx >= 2) {
      level = 'Moderate';
      numericValue = 3;
    } else {
      level = 'Low';
      numericValue = 2;
    }
  }

  return { level, numericValue };
}

export function getMatrixPriority(
  likelihood?: string,
  consequence?: string
): MatrixPriorityResult {
  const indices = getMatrixIndices(likelihood, consequence);
  if (!indices) {
    return { level: 'Not Assessed', numericValue: 0 };
  }
  return calculateMatrixPriority(indices.likelihoodIdx, indices.consequenceIdx);
}

/** Matrix row labels top-to-bottom (Almost Certain first). */
export const MATRIX_LIKELIHOOD_LABELS = [...LIKELIHOOD_CHOICES].reverse().map((label) =>
  label.replace(/^\(\d+\)\s*/, '')
);

export const MATRIX_CONSEQUENCE_LABELS = CONSEQUENCE_CHOICES.map((label) =>
  label.replace(/^\(\d+\)\s*/, '')
);
