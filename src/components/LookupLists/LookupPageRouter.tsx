import * as React from 'react';
import { TagRegular, TagMultipleRegular, BuildingRegular, LocationRegular } from '@fluentui/react-icons';
import { AppPage } from '../../models/IAssetApp';
import {
  CATEGORIES_LIST_TITLE,
  VENDORS_LIST_TITLE,
  LOCATIONS_LIST_TITLE
} from '../../models/IListDefinitions';
import { IAppSettings } from '../../models/IAssetApp';
import { AssetService } from '../../services/AssetService';
import { LookupListManager } from '../LookupLists/LookupListManager';
import { ProjectListManager } from '../LookupLists/ProjectListManager';
import { SubCategoryListManager } from '../LookupLists/SubCategoryListManager';

export interface ILookupPageRouterProps {
  page: AppPage;
  assetService: AssetService;
  settings?: IAppSettings;
  categories: import('../../models/IAssetApp').ILookupItem[];
  onChanged?: () => void;
}

export const LookupPageRouter: React.FC<ILookupPageRouterProps> = ({
  page,
  assetService,
  settings,
  categories,
  onChanged
}) => {
  switch (page) {
    case 'categories':
      return (
        <LookupListManager
          listTitle={CATEGORIES_LIST_TITLE}
          displayTitle="Categories"
          pageTitle="Categories"
          pageDescription="Manage asset categories."
          pageIcon={TagRegular}
          riskService={assetService}
          settings={settings}
          onChanged={onChanged}
        />
      );
    case 'subCategories':
      return (
        <SubCategoryListManager
          riskService={assetService}
          settings={settings}
          categories={categories}
          onChanged={onChanged}
          pageTitle="Sub-Categories"
          pageDescription="Manage sub-categories linked to parent asset categories."
          pageIcon={TagMultipleRegular}
        />
      );
    case 'vendors':
      return (
        <LookupListManager
          listTitle={VENDORS_LIST_TITLE}
          displayTitle="Vendors"
          pageTitle="Vendors"
          pageDescription="Manage vendors and suppliers."
          pageIcon={BuildingRegular}
          riskService={assetService}
          settings={settings}
          onChanged={onChanged}
        />
      );
    case 'locations':
      return (
        <LookupListManager
          listTitle={LOCATIONS_LIST_TITLE}
          displayTitle="Locations"
          pageTitle="Locations"
          pageDescription="Manage physical locations."
          pageIcon={LocationRegular}
          riskService={assetService}
          settings={settings}
          onChanged={onChanged}
        />
      );
    case 'projects':
      return (
        <ProjectListManager
          businesses={categories}
          riskService={assetService}
          settings={settings}
          onChanged={onChanged}
        />
      );
    default:
      return null;
  }
};
