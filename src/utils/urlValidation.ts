export function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeHttpUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return isValidHttpUrl(trimmed) ? trimmed : undefined;
}

export function validateOptionalHttpUrl(value: string, fieldLabel: string): string | undefined {
  if (!value.trim()) {
    return undefined;
  }
  if (!isValidHttpUrl(value)) {
    return `${fieldLabel} must be a valid http or https URL.`;
  }
  return undefined;
}
