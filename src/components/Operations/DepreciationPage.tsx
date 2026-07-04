import * as React from 'react';
import {
  MessageBar,
  MessageBarBody,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text
} from '@fluentui/react-components';
import { ContentCard } from '../Layout/ContentCard';
import { DepreciationService } from '../../services/DepreciationService';
import { DATA_TABLE_CLASS } from '../../lib/list-view/columnWidths';

export interface IDepreciationPageProps {
  depreciationService: DepreciationService;
}

export const DepreciationPage: React.FC<IDepreciationPageProps> = ({ depreciationService }) => {
  const [rows, setRows] = React.useState<Awaited<ReturnType<DepreciationService['getAssetDepreciationRows']>>>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    void depreciationService
      .getAssetDepreciationRows()
      .then((data) => {
        if (active) setRows(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load depreciation.');
      })
      .then(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [depreciationService]);

  return (
    <ContentCard flushBody>
      {error ? (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      ) : null}
      {loading ? (
        <Spinner label="Calculating depreciation..." />
      ) : rows.length === 0 ? (
        <MessageBar intent="info">
          <MessageBarBody>No depreciable assets found. Add cost and useful life to assets.</MessageBarBody>
        </MessageBar>
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
              {rows.map((row) => (
                <TableRow key={row.asset.Id}>
                  <TableCell>
                    <Text weight="semibold">{row.asset.Title}</Text>
                    <Text size={200}>{row.asset.AM_AssetId || row.asset.Id}</Text>
                  </TableCell>
                  <TableCell>${(row.asset.AM_Cost || 0).toLocaleString()}</TableCell>
                  <TableCell>{row.asset.AM_DepreciationMethod || 'StraightLine'}</TableCell>
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
