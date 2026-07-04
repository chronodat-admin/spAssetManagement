import { ILookupItem } from '../models/IAssetApp';
import { CONSEQUENCE_CHOICES, LIKELIHOOD_CHOICES } from '../constants/assetChoices';

/** Build choice-title → decimal rating map from Likelihood/Consequences lookup lists. */
export function buildRatingMap(
  items: ILookupItem[],
  choices: readonly string[]
): Record<string, number> {
  const map: Record<string, number> = {};

  choices.forEach((choice) => {
    const label = choice.replace(/^\(\d+\)\s*/, '').trim();
    const item = items.find((row) => {
      const title = row.Title?.trim() || '';
      return title === choice || title === label || title.endsWith(label);
    });
    const parsed = item?.Rating ? parseFloat(item.Rating) : NaN;
    if (!Number.isNaN(parsed)) {
      map[choice] = parsed;
    }
  });

  return map;
}

export function buildLikelihoodRatingMap(items: ILookupItem[]): Record<string, number> {
  return buildRatingMap(items, LIKELIHOOD_CHOICES);
}

export function buildConsequenceRatingMap(items: ILookupItem[]): Record<string, number> {
  return buildRatingMap(items, CONSEQUENCE_CHOICES);
}
