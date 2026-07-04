import { SPHttpClient } from '@microsoft/sp-http';

import { ASSETS_LIST_TITLE } from '../models/IListDefinitions';
import type { IAsset } from '../models/IAsset';
import {
  buildDepreciationSchedule,
  calculateBookValue,
  monthsBetween,
  type DepreciationMethod,
  type IDepreciationScheduleRow
} from '../utils/depreciationCalculator';
import { SharePointRestService } from './SharePointRestService';

export interface IAssetDepreciationRow {
  asset: IAsset;
  bookValue: number;
  monthsElapsed: number;
  schedule: IDepreciationScheduleRow[];
}

export class DepreciationService {
  private readonly rest: SharePointRestService;

  public constructor(spHttpClient: SPHttpClient, webUrl: string) {
    this.rest = new SharePointRestService(spHttpClient, webUrl);
  }

  public async getAssetDepreciationRows(): Promise<IAssetDepreciationRow[]> {
    const assets = await this.rest.getAllItems<IAsset>(
      ASSETS_LIST_TITLE,
      'Id,Title,AM_AssetId,AM_Cost,AM_PurchaseDate,AM_SalvageValue,AM_DepreciationMethod,AM_UsefulLifeMonths,AM_IsDeleted',
      undefined,
      'AM_IsDeleted eq false',
      'Title asc'
    );

    return assets
      .filter((asset) => !asset.AM_IsDeleted && (asset.AM_Cost || 0) > 0)
      .map((asset) => this.toDepreciationRow(asset));
  }

  public toDepreciationRow(asset: IAsset): IAssetDepreciationRow {
    const cost = asset.AM_Cost || 0;
    const salvage = asset.AM_SalvageValue || 0;
    const usefulLifeMonths = asset.AM_UsefulLifeMonths || 60;
    const method = (asset.AM_DepreciationMethod || 'StraightLine') as DepreciationMethod;
    const monthsElapsed = asset.AM_PurchaseDate ? monthsBetween(asset.AM_PurchaseDate) : 0;
    const input = { cost, salvageValue: salvage, usefulLifeMonths, method, monthsElapsed };

    return {
      asset,
      bookValue: calculateBookValue(input),
      monthsElapsed,
      schedule: buildDepreciationSchedule({
        cost,
        salvageValue: salvage,
        usefulLifeMonths,
        method
      })
    };
  }
}
