import * as React from 'react';

import {

  Spinner,

  Table,

  TableBody,

  TableCell,

  TableHeader,

  TableHeaderCell,

  TableRow,

  Text

} from '@fluentui/react-components';

import { ChartMultipleRegular } from '@fluentui/react-icons';

import { ContentCard } from '../Layout/ContentCard';

import { ContentToolbar } from '../Layout/ContentToolbar';

import { EmptyState } from '../Layout/EmptyState';

import { ListFiltersBar } from '../ListView/ListFiltersBar';

import { DepreciationService } from '../../services/DepreciationService';

import { DATA_TABLE_CLASS } from '../../lib/list-view/columnWidths';

import { useTranslation } from '../../i18n/LocaleContext';

import { PageNotifications } from '../Layout/PageNotifications';

import {

  applyDepreciationFilters,

  EMPTY_DEPRECIATION_FILTERS,

  formatDepreciationMethod,

  getDepreciationMethodOptions,

  hasActiveDepreciationFilters,

  type IDepreciationFilters

} from '../../utils/depreciationFilters';





export interface IDepreciationPageProps {

  depreciationService: DepreciationService;

}



export const DepreciationPage: React.FC<IDepreciationPageProps> = ({ depreciationService }) => {

  const { t } = useTranslation();

  const [rows, setRows] = React.useState<Awaited<ReturnType<DepreciationService['getAssetDepreciationRows']>>>([]);

  const [loading, setLoading] = React.useState(true);

  const [error, setError] = React.useState('');

  const [filters, setFilters] = React.useState<IDepreciationFilters>(EMPTY_DEPRECIATION_FILTERS);



  const load = React.useCallback(async (): Promise<void> => {

    setLoading(true);

    setError('');

    try {

      setRows(await depreciationService.getAssetDepreciationRows());

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to load depreciation.');

    } finally {

      setLoading(false);

    }

  }, [depreciationService]);



  React.useEffect(() => {

    void load();

  }, [load]);



  const methodOptions = React.useMemo(() => getDepreciationMethodOptions(rows), [rows]);

  const filteredRows = React.useMemo(() => applyDepreciationFilters(rows, filters), [rows, filters]);

  const filtersActive = hasActiveDepreciationFilters(filters);



  return (

    <ContentCard

      flushBody

      toolbar={

        !loading && rows.length > 0 ? (

          <ContentToolbar count={filteredRows.length} countLabel="assets">

            {filtersActive && filteredRows.length !== rows.length ? (

              <Text size={200}>{rows.length} total</Text>

            ) : undefined}

          </ContentToolbar>

        ) : undefined

      }

      filtersBar={

        !loading && rows.length > 0 ? (

          <ListFiltersBar

            searchValue={filters.search}

            onSearchChange={(search) => setFilters((current) => ({ ...current, search }))}

            searchPlaceholder={t(

              'depreciation',

              'searchPlaceholder',

              'Search by asset name or ID...'

            )}

            showClear={filtersActive}

            onClear={() => setFilters(EMPTY_DEPRECIATION_FILTERS)}

            dropdowns={[

              {

                key: 'method',

                placeholder: t('depreciation', 'allMethods', 'All methods'),

                value: filters.method,

                onChange: (value) => setFilters((current) => ({ ...current, method: value || 'all' })),

                options: [

                  { value: 'all', label: t('depreciation', 'allMethods', 'All methods') },

                  ...methodOptions.map((method) => ({

                    value: method,

                    label: formatDepreciationMethod(method)

                  }))

                ]

              },

              {

                key: 'status',

                placeholder: t('depreciation', 'allStatuses', 'All statuses'),

                value: filters.status,

                onChange: (value) => setFilters((current) => ({ ...current, status: value || 'all' })),

                options: [

                  { value: 'all', label: t('depreciation', 'allStatuses', 'All statuses') },

                  {

                    value: 'depreciating',

                    label: t('depreciation', 'statusDepreciating', 'Still depreciating')

                  },

                  {

                    value: 'fullyDepreciated',

                    label: t('depreciation', 'statusFullyDepreciated', 'Fully depreciated')

                  }

                ]

              }

            ]}

          />

        ) : undefined

      }

    >

      <PageNotifications error={error || undefined} />

      {loading ? (

        <Spinner label="Calculating depreciation..." />

      ) : rows.length === 0 ? (

        <EmptyState

          bordered

          inset

          fullWidth

          icon={<ChartMultipleRegular />}

          title={t('depreciation', 'emptyTitle', 'No depreciable assets')}

          description={t(

            'depreciation',

            'emptyDescription',

            'Add purchase cost and useful life on asset records to calculate book values.'

          )}

        />

      ) : filteredRows.length === 0 ? (

        <EmptyState

          bordered

          inset

          fullWidth

          icon={<ChartMultipleRegular />}

          title={t('depreciation', 'noMatchesTitle', 'No assets match your filters')}

          description={t(

            'depreciation',

            'noMatchesDescription',

            'Try adjusting your search or filter selections.'

          )}

        />

      ) : (

        <div className={DATA_TABLE_CLASS}>

          <Table>

            <TableHeader>

              <TableRow>

                <TableHeaderCell>Asset</TableHeaderCell>

                <TableHeaderCell>Cost</TableHeaderCell>

                <TableHeaderCell>Method</TableHeaderCell>

                <TableHeaderCell>Months</TableHeaderCell>

                <TableHeaderCell>Book value</TableHeaderCell>

              </TableRow>

            </TableHeader>

            <TableBody>

              {filteredRows.map((row) => (

                <TableRow key={row.asset.Id}>

                  <TableCell>

                    <Text weight="semibold">{row.asset.Title}</Text>

                    <Text size={200}>{row.asset.AM_AssetId || row.asset.Id}</Text>

                  </TableCell>

                  <TableCell>${(row.asset.AM_Cost || 0).toLocaleString()}</TableCell>

                  <TableCell>{formatDepreciationMethod(row.asset.AM_DepreciationMethod)}</TableCell>

                  <TableCell>{row.monthsElapsed}</TableCell>

                  <TableCell>${row.bookValue.toLocaleString()}</TableCell>

                </TableRow>

              ))}

            </TableBody>

          </Table>

        </div>

      )}

    </ContentCard>

  );

};


