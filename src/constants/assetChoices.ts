/** Choice values on the Risks list (not the Likelihood/Consequences lookup lists). */
export const LIKELIHOOD_CHOICES = [
  '(1) Rare',
  '(2) Unlikely',
  '(3) Possible',
  '(4) Likely',
  '(5) Almost Certain'
] as const;

export const CONSEQUENCE_CHOICES = [
  '(1) Insignificant',
  '(2) Minor',
  '(3) Moderate',
  '(4) Major',
  '(5) Critical'
] as const;

export const ASSET_STATUS_CHOICES = [
  'Available',
  'Assigned',
  'In Repair',
  'Retired',
  'Disposed'
] as const;

/** Fallback when workflow settings are unavailable. */
export const LEGACY_ASSET_STATUS_CHOICES = ASSET_STATUS_CHOICES;

export const CONTROLS_EFFECTIVENESS_CHOICES = ['Good', 'Fair', 'Poor'] as const;

export const DEFAULT_NEW_RISK = {
  status: 'Available' as const,
  likelihood: '(1) Rare',
  consequence: '(1) Insignificant',
  controlsEffectiveness: 'Good' as const
};
