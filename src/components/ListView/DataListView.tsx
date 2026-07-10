import * as React from 'react';
import {
  Card,
  Checkbox,
  makeStyles,
  mergeClasses,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  tokens
} from '@fluentui/react-components';
import { DocumentSearchRegular } from '@fluentui/react-icons';
import {
  getDataListTableMinWidth,
  getDataTableLayoutStyle,
  getListColumnStyle,
  getListTitleColumnStyle,
  isListBadgeColumn,
  isListTitleColumn,
  LIST_ACTIONS_COLUMN_WIDTH,
  LIST_SELECT_COLUMN_WIDTH,
  shouldTruncateListColumn,
  shouldWrapListColumn,
  DATA_TABLE_CLASS
} from '../../lib/list-view/columnWidths';
import type { ListViewMode } from '../../lib/list-view/types';
import { useContentCardStyles } from '../Layout/ContentCard';
import { EmptyState } from '../Layout/EmptyState';
import { useTranslation } from '../../i18n/LocaleContext';
import { formatMessage } from '../../i18n/formatMessage';

const useStyles = makeStyles({
  listWrap: {
    display: 'flex',
    flexDirection: 'column'
  },
  listRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover
    },
    '@media (max-width: 768px)': {
      flexWrap: 'wrap',
      padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`
    }
  },
  listMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    minWidth: 0,
    flex: '1 1 auto'
  },
  listTitle: {
    fontSize: tokens.fontSizeBase400,
    lineHeight: tokens.lineHeightBase400
  },
  listMeta: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
    gap: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    '@media (max-width: 768px)': {
      gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))'
    }
  },
  listField: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    minWidth: 0
  },
  listFieldLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: 1.2,
    letterSpacing: '0.02em',
    textTransform: 'uppercase'
  },
  listFieldValue: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  listFieldValueBadge: {
    overflow: 'visible'
  },
  listActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexShrink: 0,
    alignSelf: 'flex-start',
    paddingTop: tokens.spacingVerticalXXS
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingHorizontalL,
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      padding: tokens.spacingHorizontalM
    }
  },
  dataCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    minWidth: 0
  },
  cardTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    padding: 0,
    margin: 0,
    textAlign: 'left',
    font: 'inherit',
    ':hover': {
      textDecoration: 'underline'
    }
  },
  cardField: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase200
  },
  cardLabel: {
    color: tokens.colorNeutralForeground3,
    flexShrink: 0
  },
  cardValue: {
    textAlign: 'right',
    minWidth: 0
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXS,
    paddingTop: tokens.spacingVerticalS,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`
  },
  selectCell: {
    width: `${LIST_SELECT_COLUMN_WIDTH}px`,
    minWidth: `${LIST_SELECT_COLUMN_WIDTH}px`,
    verticalAlign: 'middle'
  },
  actionsCell: {
    width: `${LIST_ACTIONS_COLUMN_WIDTH}px`,
    minWidth: `${LIST_ACTIONS_COLUMN_WIDTH}px`,
    verticalAlign: 'middle'
  },
  badgeCell: {
    overflow: 'visible',
    verticalAlign: 'middle'
  },
  cellContent: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0
  },
  cellContentWrap: {
    display: 'block',
    overflow: 'hidden',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    lineHeight: tokens.lineHeightBase300,
    minWidth: 0
  },
  listSelect: {
    flexShrink: 0,
    alignSelf: 'flex-start',
    paddingTop: tokens.spacingVerticalXXS
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS
  },
  cardHeaderMain: {
    minWidth: 0,
    flex: '1 1 auto'
  },
  titleCell: {
    minWidth: '220px',
    width: '220px',
    verticalAlign: 'middle'
  },
  titleCellButton: {
    display: 'block',
    width: '100%',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    lineHeight: tokens.lineHeightBase300
  }
});

export interface IDataListColumn<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  isPrimary?: boolean;
}

export interface IDataListSelection {
  selectedKeys: ReadonlySet<string | number>;
  allSelected: boolean;
  someSelected: boolean;
  onToggleItem: (key: string | number, selected: boolean) => void;
  onToggleAll: (selected: boolean) => void;
}

export interface IDataListViewProps<T> {
  items: T[];
  columns: IDataListColumn<T>[];
  visibleColumns: string[];
  viewMode: ListViewMode;
  ariaLabel: string;
  emptyMessage: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  getItemKey: (item: T) => string | number;
  renderActions?: (item: T) => React.ReactNode;
  onPrimaryClick?: (item: T) => void;
  selection?: IDataListSelection;
  getSelectionLabel?: (item: T) => string;
}

export function DataListView<T>({
  items,
  columns,
  visibleColumns,
  viewMode,
  ariaLabel,
  emptyMessage,
  emptyDescription,
  emptyIcon,
  getItemKey,
  renderActions,
  onPrimaryClick,
  selection,
  getSelectionLabel
}: IDataListViewProps<T>): React.ReactElement {
  const styles = useStyles();
  const cardStyles = useContentCardStyles();
  const { t } = useTranslation();

  const getSelectLabel = (item: T, card = false): string => {
    if (getSelectionLabel) {
      return formatMessage(t('listView', 'selectNamed', 'Select {name}'), {
        name: getSelectionLabel(item)
      });
    }
    if (card) {
      return t('listView', 'selectCard', 'Select card');
    }
    return t('listView', 'selectRow', 'Select row');
  };

  const renderSelectCheckbox = (item: T, label?: string): React.ReactNode => {
    if (!selection) {
      return null;
    }

    const key = getItemKey(item);
    return (
      <Checkbox
        checked={selection.selectedKeys.has(key)}
        onChange={(_, data) => selection.onToggleItem(key, Boolean(data.checked))}
        aria-label={label || t('listView', 'selectRow', 'Select row')}
        onClick={(event) => event.stopPropagation()}
      />
    );
  };

  const visibleDataColumns = React.useMemo(
    () => columns.filter((column) => visibleColumns.includes(column.key)),
    [columns, visibleColumns]
  );

  const primaryColumn =
    visibleDataColumns.find((column) => column.isPrimary) || visibleDataColumns[0];
  const detailColumns = visibleDataColumns.filter((column) => column.key !== primaryColumn?.key);

  const tableMinWidth = React.useMemo(
    () =>
      getDataListTableMinWidth(visibleColumns, {
        hasSelection: Boolean(selection),
        hasActions: Boolean(renderActions)
      }),
    [visibleColumns, selection, renderActions]
  );

  const renderCellContent = (column: IDataListColumn<T>, item: T): React.ReactNode => {
    const content = column.render(item);
    if (isListBadgeColumn(column.key)) {
      return content;
    }
    if (shouldWrapListColumn(column.key) || isListTitleColumn(column)) {
      return <span className={styles.cellContentWrap}>{content}</span>;
    }
    if (shouldTruncateListColumn(column.key)) {
      return <span className={styles.cellContent}>{content}</span>;
    }
    return content;
  };

  const renderListFieldValue = (column: IDataListColumn<T>, item: T): React.ReactNode => {
    const content = column.render(item);
    if (isListBadgeColumn(column.key)) {
      return content;
    }
    if (shouldWrapListColumn(column.key)) {
      return <span className={styles.cellContentWrap}>{content}</span>;
    }
    return content;
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon || <DocumentSearchRegular />}
        title={emptyMessage}
        description={emptyDescription}
      />
    );
  }

  if (viewMode === 'table') {
    return (
      <div className={cardStyles.tableWrap}>
        <Table
          aria-label={ariaLabel}
          className={DATA_TABLE_CLASS}
          style={getDataTableLayoutStyle(tableMinWidth)}
        >
          <TableHeader>
            <TableRow>
              {selection && (
                <TableHeaderCell
                  className={cardStyles.tableHeaderCell}
                  style={{ width: LIST_SELECT_COLUMN_WIDTH, minWidth: LIST_SELECT_COLUMN_WIDTH }}
                >
                  <Checkbox
                    checked={
                      selection.allSelected ? true : selection.someSelected ? 'mixed' : false
                    }
                    onChange={(_, data) => selection.onToggleAll(Boolean(data.checked))}
                    aria-label={t('listView', 'selectAllRows', 'Select all rows')}
                  />
                </TableHeaderCell>
              )}
              {visibleDataColumns.map((column) => (
                <TableHeaderCell
                  key={column.key}
                  className={cardStyles.tableHeaderCell}
                  style={
                    isListTitleColumn(column)
                      ? getListTitleColumnStyle()
                      : getListColumnStyle(column.key)
                  }
                >
                  {column.label}
                </TableHeaderCell>
              ))}
              {renderActions && (
                <TableHeaderCell
                  className={cardStyles.tableHeaderCell}
                  style={{ width: LIST_ACTIONS_COLUMN_WIDTH, minWidth: LIST_ACTIONS_COLUMN_WIDTH }}
                >
                  {t('listView', 'actions', 'Actions')}
                </TableHeaderCell>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={getItemKey(item)}>
                {selection && (
                  <TableCell className={styles.selectCell}>
                    {renderSelectCheckbox(item, getSelectLabel(item))}
                  </TableCell>
                )}
                {visibleDataColumns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={
                      isListBadgeColumn(column.key)
                        ? styles.badgeCell
                        : isListTitleColumn(column)
                          ? styles.titleCell
                          : undefined
                    }
                    style={
                      isListTitleColumn(column)
                        ? getListTitleColumnStyle()
                        : getListColumnStyle(column.key)
                    }
                  >
                    {column.isPrimary && onPrimaryClick ? (
                      <button
                        type="button"
                        className={mergeClasses(
                          cardStyles.rowButton,
                          isListTitleColumn(column) && styles.titleCellButton
                        )}
                        onClick={() => onPrimaryClick(item)}
                      >
                        {renderCellContent(column, item)}
                      </button>
                    ) : (
                      renderCellContent(column, item)
                    )}
                  </TableCell>
                ))}
                {renderActions && (
                  <TableCell className={styles.actionsCell}>
                    <div className={cardStyles.actions}>{renderActions(item)}</div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className={styles.listWrap} aria-label={ariaLabel}>
        {items.map((item) => (
          <div key={getItemKey(item)} className={styles.listRow}>
            {selection && (
              <div className={styles.listSelect}>
                {renderSelectCheckbox(item, getSelectLabel(item))}
              </div>
            )}
            <div className={styles.listMain}>
              {primaryColumn && (
                <div className={styles.listTitle}>
                  {onPrimaryClick ? (
                    <button
                      type="button"
                      className={cardStyles.rowButton}
                      onClick={() => onPrimaryClick(item)}
                    >
                      {primaryColumn.render(item)}
                    </button>
                  ) : (
                    <Text weight="semibold">{primaryColumn.render(item)}</Text>
                  )}
                </div>
              )}
              {detailColumns.length > 0 && (
                <div className={styles.listMeta}>
                  {detailColumns.map((column) => (
                    <div key={column.key} className={styles.listField}>
                      <span className={styles.listFieldLabel}>{column.label}</span>
                      <div
                        className={mergeClasses(
                          styles.listFieldValue,
                          isListBadgeColumn(column.key) && styles.listFieldValueBadge
                        )}
                      >
                        {renderListFieldValue(column, item)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {renderActions && (
              <div className={mergeClasses(cardStyles.actions, styles.listActions)}>
                {renderActions(item)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.cardGrid} aria-label={ariaLabel}>
      {items.map((item) => (
        <Card key={getItemKey(item)} className={styles.dataCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderMain}>
              {primaryColumn && (
                <div>
                  {onPrimaryClick ? (
                    <button
                      type="button"
                      className={styles.cardTitle}
                      onClick={() => onPrimaryClick(item)}
                    >
                      {primaryColumn.render(item)}
                    </button>
                  ) : (
                    <Text weight="semibold">{primaryColumn.render(item)}</Text>
                  )}
                </div>
              )}
            </div>
            {selection &&
              renderSelectCheckbox(
                item,
                getSelectLabel(item, true)
              )}
          </div>
          {detailColumns.map((column) => (
            <div key={column.key} className={styles.cardField}>
              <span className={styles.cardLabel}>{column.label}</span>
              <span className={styles.cardValue}>{column.render(item)}</span>
            </div>
          ))}
          {renderActions && <div className={styles.cardActions}>{renderActions(item)}</div>}
        </Card>
      ))}
    </div>
  );
}
