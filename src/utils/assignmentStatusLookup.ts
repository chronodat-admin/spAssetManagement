export function buildAssetStatusIdCache(
  statuses: ReadonlyArray<{ Id: number; Title: string }>
): Map<string, number> {
  return new Map(statuses.map((status) => [status.Title, status.Id]));
}

export function resolveAssetStatusIdFromCache(cache: Map<string, number>, statusTitle: string): number {
  const statusId = cache.get(statusTitle);
  if (!statusId) {
    throw new Error(
      `Asset status "${statusTitle}" was not found. Open Settings and run setup to seed lookup lists.`
    );
  }

  return statusId;
}
