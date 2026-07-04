import * as React from 'react';
import { AssetService } from '../services/AssetService';
import { NO_LIST_PERMISSIONS, IListPermissions } from '../utils/listPermissions';

export function useListPermissions(
  riskService: AssetService,
  listTitle: string,
  itemId?: number,
  /**
   * Optional value that, when changed, forces a permissions refetch. Used to re-read
   * permissions after first-time setup creates the list (otherwise canAdd stays stale
   * until a full page reload).
   */
  refreshKey?: string | number | boolean,
  options?: { enabled?: boolean }
): { permissions: IListPermissions; loading: boolean; error: string } {
  const [permissions, setPermissions] = React.useState<IListPermissions>(NO_LIST_PERMISSIONS);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const enabled = options?.enabled ?? true;

  React.useEffect(() => {
    if (!enabled) {
      setPermissions(NO_LIST_PERMISSIONS);
      setLoading(false);
      setError('');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    void riskService
      .getListPermissions(listTitle, itemId)
      .then((result) => {
        if (!cancelled) {
          setPermissions(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPermissions({ canView: false, canAdd: false, canEdit: false, canDelete: false });
          setError(err instanceof Error ? err.message : 'Unable to read SharePoint permissions.');
        }
      })
      .then(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [riskService, listTitle, itemId, refreshKey, enabled]);

  return { permissions, loading, error };
}
