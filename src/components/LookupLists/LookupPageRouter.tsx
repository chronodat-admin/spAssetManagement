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
import { useTranslation } from '../../i18n/LocaleContext';
import { getPageSubtitle, getPageTitle } from '../../utils/pageTitles';

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
  const { t } = useTranslation();

  switch (page) {
    case 'categories':
      return (
        <LookupListManager
          listTitle={CATEGORIES_LIST_TITLE}
          displayTitle={getPageTitle('categories', t)}
          pageTitle={getPageTitle('categories', t)}
          pageDescription={getPageSubtitle('categories', undefined, t)}
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
          pageTitle={getPageTitle('subCategories', t)}
          pageDescription={getPageSubtitle('subCategories', undefined, t)}
          pageIcon={TagMultipleRegular}
        />
      );
    case 'vendors':
      return (
        <LookupListManager
          listTitle={VENDORS_LIST_TITLE}
          displayTitle={getPageTitle('vendors', t)}
          pageTitle={getPageTitle('vendors', t)}
          pageDescription={t('lookups', 'vendorsSubtitle', 'Manage vendors and suppliers.')}
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
          displayTitle={getPageTitle('locations', t)}
          pageTitle={getPageTitle('locations', t)}
          pageDescription={getPageSubtitle('locations', undefined, t)}
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
