declare const process: {
  env: {
    ASSET_APP_VERSION?: string;
  };
};

const FALLBACK_VERSION = '1.0.0.28';

/** Display label for the shell footer, e.g. v1.0.0.28-abc1234 */
export function getAppVersionLabel(): string {
  const version = process.env.ASSET_APP_VERSION || FALLBACK_VERSION;
  return version.startsWith('v') ? version : `v${version}`;
}
