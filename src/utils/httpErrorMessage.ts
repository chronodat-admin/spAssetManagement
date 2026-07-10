export interface IHttpErrorDetails {
  code?: string;
  message?: string;
  status: number;
}

export function parseHttpErrorBody(body: string): Pick<IHttpErrorDetails, 'code' | 'message'> {
  const trimmed = body.trim();
  if (!trimmed) {
    return {};
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      error?: { code?: string; message?: string };
      message?: string;
      code?: string;
    };
    return {
      code: parsed.error?.code || parsed.code,
      message: parsed.error?.message || parsed.message
    };
  } catch {
    return { message: trimmed };
  }
}

function intuneFriendlyMessage(code: string | undefined, message: string | undefined): string | undefined {
  const normalized = `${code || ''} ${message || ''}`.toLowerCase();
  if (normalized.includes('not applicable to target tenant')) {
    return (
      'Intune device management is not available for this Microsoft 365 tenant. ' +
      'This usually means Intune is not licensed or enabled, or the app has not been granted Microsoft Graph ' +
      'DeviceManagementManagedDevices.Read.All permission with admin consent. ' +
      'Use Bulk Import to add assets manually, or ask your tenant admin to enable Intune and approve Graph permissions.'
    );
  }
  if (normalized.includes('authorization_requestdenied') || normalized.includes('insufficient privileges')) {
    return (
      'Microsoft Graph denied access to Intune managed devices. Ask a tenant admin to grant ' +
      'DeviceManagementManagedDevices.Read.All (application or delegated) and admin consent for this app.'
    );
  }
  return undefined;
}

export function formatHttpErrorMessage(status: number, body: string, context?: string): string {
  const { code, message } = parseHttpErrorBody(body);
  const intuneHint = intuneFriendlyMessage(code, message);
  if (intuneHint) {
    return intuneHint;
  }

  const prefix = context ? `${context}: ` : '';
  if (message) {
    return code
      ? `${prefix}${message} (${code}, HTTP ${status})`
      : `${prefix}${message} (HTTP ${status})`;
  }

  const trimmed = body.trim();
  if (!trimmed) {
    return `${prefix}Request failed (HTTP ${status}).`;
  }

  const compact = trimmed.replace(/\s+/g, ' ');
  if (compact.length <= 320) {
    return `${prefix}${compact} (HTTP ${status})`;
  }

  return `${prefix}${compact.slice(0, 320)}… (HTTP ${status})`;
}
