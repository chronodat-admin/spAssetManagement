import type { ILookupDeleteReference } from '../utils/lookupDeleteReferences';

/** Asset domain service — full implementation in later tasks. */
export class AssetService {
  public async getLookupDeleteImpact(
    _listTitle: string,
    _ids: number[],
    _titles: string[]
  ): Promise<{ references: ILookupDeleteReference[] }> {
    return { references: [] };
  }
}
