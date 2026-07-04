import * as React from 'react';
import {
  Badge,
  Button,
  Dropdown,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Option,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Title3,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens
} from '@fluentui/react-components';
import {
  ArrowDownloadRegular,
  BuildingRegular,
  CheckmarkCircleRegular,
  ChevronDownRegular,
  ChevronUpRegular,
  CircleRegular,
  ColumnTripleRegular,
  DismissRegular,
  FilterRegular,
  FolderOpenRegular,
  ShieldRegular,
  TableRegular,
  DocumentTableRegular,
  AddRegular
} from '@fluentui/react-icons';
import type { IReportColumnDef, IReportFilter, ReportDataSource, ReportRow } from '../../models/IReportBuilder';
import {
  DATA_TABLE_CLASS,
  getDataListTableMinWidth,
  getDataTableLayoutStyle,
  getListColumnStyle,
  getListTitleColumnStyle,
  isListTitleColumn
} from '../../lib/list-view/columnWidths';
import {
  applyReportFilters,
  downloadReportCsv,
  formatReportCellValue
} from '../../lib/report-builder/csvExport';
import { getDefaultSelectedColumnKeys } from '../../lib/report-builder/columns';
import { ReportBuilderService } from '../../services/ReportBuilderService';
import { ContentCard } from '../Layout/ContentCard';

const PREVIEW_MAX_ROWS = 200;

const DATA_SOURCES: Array<{
  key: ReportDataSource;
  label: string;
  description: string;
  icon: React.ReactElement;
}> = [
  {
    key: 'risks',
    label: 'AM_Assets',
    description: 'All asset register entries',
    icon: <ShieldRegular />
  },
  {
    key: 'business',
    label: 'Business',
    description: 'Business details',
    icon: <BuildingRegular />
  },
  {
    key: 'projects',
    label: 'Projects',
    description: 'Project portfolio data',
    icon: <FolderOpenRegular />
  }
];

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    width: '100%'
  },
  sourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr'
    }
  },
  sourceCard: {
    cursor: 'pointer',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.padding(tokens.spacingHorizontalL),
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    transitionProperty: 'border-color, box-shadow, background-color, color',
    transitionDuration: tokens.durationNormal,
    ':hover': {
      boxShadow: tokens.shadow8,
      backgroundColor: tokens.colorNeutralBackground1Hover
    }
  },
  sourceCardActive: {
    ...shorthands.borderColor(tokens.colorPaletteGreenBorder2),
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
    boxShadow: tokens.shadow8
  },
  sourceIcon: {
    width: '48px',
    height: '48px',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForegroundOnBrand,
    flexShrink: 0
  },
  sourceIconActive: {
    backgroundImage: 'linear-gradient(135deg, #34d399, #059669)'
  },
  sourceIconIdle: {
    backgroundImage: 'linear-gradient(135deg, #94a3b8, #64748b)'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    userSelect: 'none',
    gap: tokens.spacingHorizontalM,
    color: tokens.colorNeutralForeground1,
    '& svg': {
      color: tokens.colorNeutralForeground2,
      flexShrink: 0
    },
    ':hover svg': {
      color: tokens.colorNeutralForeground1
    }
  },
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  sectionIcon: {
    width: '32px',
    height: '32px',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForegroundOnBrand
  },
  columnsIcon: {
    backgroundImage: 'linear-gradient(135deg, #60a5fa, #4f46e5)'
  },
  filterIcon: {
    backgroundImage: 'linear-gradient(135deg, #fbbf24, #ea580c)'
  },
  columnActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS
  },
  columnGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: tokens.spacingHorizontalS,
    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))'
    },
    '@media (max-width: 768px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'
    },
    '@media (max-width: 480px)': {
      gridTemplateColumns: '1fr'
    }
  },
  columnPill: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    ...shorthands.padding(tokens.spacingHorizontalS, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    cursor: 'pointer',
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    minHeight: '40px',
    fontFamily: tokens.fontFamilyBase,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2
    }
  },
  columnPillSelected: {
    ...shorthands.borderColor(tokens.colorPaletteGreenBorder2),
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
    ':hover': {
      backgroundColor: tokens.colorPaletteGreenBackground2
    }
  },
  columnPillCustomSelected: {
    ...shorthands.borderColor(tokens.colorPalettePurpleBorderActive),
    backgroundColor: tokens.colorPalettePurpleBackground2,
    color: tokens.colorPalettePurpleForeground2,
    ':hover': {
      backgroundColor: tokens.colorPalettePurpleBackground2
    }
  },
  columnLabel: {
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    color: 'inherit'
  },
  footerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalM,
    ...shorthands.padding(tokens.spacingVerticalM, 0, 0, 0),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2)
  },
  filterForm: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 2fr auto auto',
    gap: tokens.spacingHorizontalM,
    alignItems: 'end',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr'
    }
  },
  activeFilters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap'
  },
  tableWrap: {
    overflowX: 'auto',
    width: '100%'
  },
  tableCell: {
    whiteSpace: 'nowrap',
    maxWidth: '280px',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  customSectionDivider: {
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.padding(tokens.spacingVerticalS, 0, 0, 0),
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  toolbarRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: tokens.spacingVerticalS
  }
});

export interface IReportBuilderProps {
  reportBuilderService: ReportBuilderService;
}

export const ReportBuilder: React.FC<IReportBuilderProps> = ({ reportBuilderService }) => {
  const styles = useStyles();
  const [activeSource, setActiveSource] = React.useState<ReportDataSource>('risks');
  const [columns, setColumns] = React.useState<IReportColumnDef[]>([]);
  const [selectedColumns, setSelectedColumns] = React.useState<string[]>([]);
  const [data, setData] = React.useState<ReportRow[]>([]);
  const [loadingColumns, setLoadingColumns] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState('');
  const [hasGenerated, setHasGenerated] = React.useState(false);
  const [columnPickerOpen, setColumnPickerOpen] = React.useState(true);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<IReportFilter[]>([]);
  const [filterField, setFilterField] = React.useState('');
  const [filterOperator, setFilterOperator] = React.useState<IReportFilter['operator']>('equals');
  const [filterValue, setFilterValue] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;

    async function loadColumns(): Promise<void> {
      setLoadingColumns(true);
      setError('');
      try {
        const available = await reportBuilderService.getAvailableColumns(activeSource);
        if (cancelled) {
          return;
        }
        setColumns(available);
        setSelectedColumns(getDefaultSelectedColumnKeys(available));
        setData([]);
        setHasGenerated(false);
        setFilters([]);
        setFilterField('');
        setFilterValue('');
      } catch {
        if (!cancelled) {
          setError('Failed to load available columns.');
        }
      } finally {
        if (!cancelled) {
          setLoadingColumns(false);
        }
      }
    }

    void loadColumns();
    return () => {
      cancelled = true;
    };
  }, [activeSource, reportBuilderService]);

  const selectedColumnDefs = React.useMemo(
    () => columns.filter((column) => selectedColumns.includes(column.key)),
    [columns, selectedColumns]
  );

  const filteredData = React.useMemo(
    () => applyReportFilters(data, filters),
    [data, filters]
  );

  const previewRows = React.useMemo(
    () => filteredData.slice(0, PREVIEW_MAX_ROWS),
    [filteredData]
  );

  const toggleColumn = (key: string): void => {
    setSelectedColumns((previous) =>
      previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key]
    );
  };

  const handleGenerate = async (): Promise<void> => {
    if (selectedColumns.length === 0) {
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const rows = await reportBuilderService.fetchReportData(activeSource, selectedColumns);
      setData(rows);
      setHasGenerated(true);
      setColumnPickerOpen(false);
      setFilters([]);
    } catch {
      setError('Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadCsv = (): void => {
    downloadReportCsv(data, selectedColumnDefs, activeSource);
  };

  const addFilter = (): void => {
    if (!filterField || !filterValue.trim()) {
      return;
    }
    setFilters((previous) => [
      ...previous,
      { field: filterField, operator: filterOperator, value: filterValue.trim() }
    ]);
    setFilterValue('');
  };

  const removeFilter = (index: number): void => {
    setFilters((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  const standardColumns = columns.filter((column) => !column.isCustom);
  const customColumns = columns.filter((column) => column.isCustom);

  const renderColumnPill = (column: IReportColumnDef): React.ReactElement => {
    const checked = selectedColumns.includes(column.key);
    return (
      <button
        key={column.key}
        type="button"
        className={mergeClasses(
          styles.columnPill,
          checked && (column.isCustom ? styles.columnPillCustomSelected : styles.columnPillSelected)
        )}
        onClick={() => toggleColumn(column.key)}
      >
        {checked ? (
          <CheckmarkCircleRegular primaryFill={tokens.colorPaletteGreenForeground2} />
        ) : (
          <CircleRegular primaryFill={tokens.colorNeutralForeground3} />
        )}
        <Text className={styles.columnLabel}>{column.label}</Text>
      </button>
    );
  };

  return (
    <div className={styles.root}>
      {error ? (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      ) : null}

      {hasGenerated && data.length > 0 ? (
        <div className={styles.toolbarRow}>
          <Button
            appearance="primary"
            icon={<ArrowDownloadRegular />}
            onClick={handleDownloadCsv}
          >
            Download CSV ({data.length} rows)
          </Button>
        </div>
      ) : null}

      <div className={styles.sourceGrid}>
        {DATA_SOURCES.map((source) => {
          const isActive = activeSource === source.key;
          return (
            <div
              key={source.key}
              className={mergeClasses(styles.sourceCard, isActive && styles.sourceCardActive)}
              onClick={() => setActiveSource(source.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setActiveSource(source.key);
                }
              }}
            >
              <div
                className={mergeClasses(
                  styles.sourceIcon,
                  isActive ? styles.sourceIconActive : styles.sourceIconIdle
                )}
              >
                {source.icon}
              </div>
              <div>
                <Text weight="semibold" style={{ color: 'inherit' }}>
                  {source.label}
                </Text>
                <Text
                  size={200}
                  style={{
                    display: 'block',
                    color: isActive ? 'inherit' : tokens.colorNeutralForeground3,
                    opacity: isActive ? 0.88 : 1
                  }}
                >
                  {source.description}
                </Text>
              </div>
            </div>
          );
        })}
      </div>

      <ContentCard>
        <div
          className={styles.sectionHeader}
          onClick={() => setColumnPickerOpen((open) => !open)}
        >
          <div className={styles.sectionTitleRow}>
            <div className={mergeClasses(styles.sectionIcon, styles.columnsIcon)}>
              <ColumnTripleRegular />
            </div>
            <Title3 as="h2">Select Columns</Title3>
            <Badge appearance="filled" color="informative">
              {selectedColumns.length} / {columns.length}
            </Badge>
          </div>
          {columnPickerOpen ? <ChevronUpRegular /> : <ChevronDownRegular />}
        </div>

        {columnPickerOpen ? (
          <>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Choose which columns to include in your report
            </Text>

            {loadingColumns ? (
              <Spinner size="medium" label="Loading columns..." />
            ) : (
              <>
                <div className={styles.columnActions}>
                  <Button
                    appearance="secondary"
                    icon={<CheckmarkCircleRegular />}
                    onClick={() => setSelectedColumns(columns.map((column) => column.key))}
                  >
                    Select All
                  </Button>
                  <Button
                    appearance="secondary"
                    icon={<DismissRegular />}
                    onClick={() => setSelectedColumns([])}
                  >
                    Deselect All
                  </Button>
                </div>

                <div className={styles.columnGrid}>{standardColumns.map(renderColumnPill)}</div>

                {customColumns.length > 0 ? (
                  <>
                    <div className={styles.customSectionDivider}>
                      <Badge appearance="outline" color="important">
                        Custom Fields
                      </Badge>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        From form templates
                      </Text>
                    </div>
                    <div className={styles.columnGrid}>{customColumns.map(renderColumnPill)}</div>
                  </>
                ) : null}

                <div className={styles.footerActions}>
                  <Button
                    appearance="primary"
                    icon={generating ? undefined : <TableRegular />}
                    disabled={generating || selectedColumns.length === 0}
                    onClick={() => void handleGenerate()}
                  >
                    {generating ? (
                      <>
                        <Spinner size="tiny" /> Generating...
                      </>
                    ) : (
                      'Generate Report'
                    )}
                  </Button>
                </div>
              </>
            )}
          </>
        ) : null}
      </ContentCard>

      {hasGenerated ? (
        <>
          <ContentCard>
            <div className={styles.sectionHeader} onClick={() => setFilterOpen((open) => !open)}>
              <div className={styles.sectionTitleRow}>
                <div className={mergeClasses(styles.sectionIcon, styles.filterIcon)}>
                  <FilterRegular />
                </div>
                <Title3 as="h2">Filters</Title3>
                {filters.length > 0 ? (
                  <Badge appearance="filled" color="informative">
                    {filters.length} active
                  </Badge>
                ) : null}
              </div>
              {filterOpen ? <ChevronUpRegular /> : <ChevronDownRegular />}
            </div>

            {filterOpen ? (
              <>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  Filter the preview table. CSV export includes all generated rows.
                </Text>
                <div className={styles.filterForm}>
                  <Field label="Field">
                    <Dropdown
                      placeholder="Select a column"
                      value={
                        filterField
                          ? selectedColumnDefs.find((column) => column.key === filterField)?.label
                          : undefined
                      }
                      selectedOptions={filterField ? [filterField] : []}
                      onOptionSelect={(_, optionData) =>
                        setFilterField(optionData.optionValue ?? '')
                      }
                    >
                      {selectedColumnDefs.map((column) => (
                        <Option key={column.key} value={column.key} text={column.label}>
                          {column.label}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                  <Field label="Operator">
                    <Dropdown
                      value={
                        filterOperator === 'equals'
                          ? 'Equals'
                          : filterOperator === 'not_equals'
                            ? 'Not equals'
                            : 'Contains'
                      }
                      selectedOptions={[filterOperator]}
                      onOptionSelect={(_, optionData) =>
                        setFilterOperator(
                          (optionData.optionValue as IReportFilter['operator']) ?? 'equals'
                        )
                      }
                    >
                      <Option value="equals">Equals</Option>
                      <Option value="not_equals">Not equals</Option>
                      <Option value="contains">Contains</Option>
                    </Dropdown>
                  </Field>
                  <Field label="Value">
                    <Input
                      value={filterValue}
                      onChange={(_, inputData) => setFilterValue(inputData.value)}
                      placeholder="Filter value"
                    />
                  </Field>
                  <Button appearance="secondary" icon={<AddRegular />} onClick={addFilter}>
                    Add
                  </Button>
                  <Button
                    appearance="subtle"
                    icon={<DismissRegular />}
                    disabled={filters.length === 0}
                    onClick={() => setFilters([])}
                  >
                    Clear filters
                  </Button>
                </div>

                {filters.length > 0 ? (
                  <div className={styles.activeFilters}>
                    {filters.map((filter, index) => {
                      const label =
                        selectedColumnDefs.find((column) => column.key === filter.field)?.label ??
                        filter.field;
                      return (
                        <Badge
                          key={`${filter.field}-${index}`}
                          appearance="outline"
                          color="informative"
                        >
                          {label} {filter.operator.replace('_', ' ')} &quot;{filter.value}&quot;
                          <Button
                            appearance="transparent"
                            size="small"
                            icon={<DismissRegular />}
                            aria-label="Remove filter"
                            onClick={() => removeFilter(index)}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                ) : null}
              </>
            ) : null}
          </ContentCard>

          <ContentCard flushBody>
            <div style={{ padding: tokens.spacingHorizontalL }}>
              <div className={styles.previewHeader}>
                <div className={styles.sectionTitleRow}>
                  <div className={mergeClasses(styles.sectionIcon, styles.columnsIcon)}>
                    <DocumentTableRegular />
                  </div>
                  <Title3 as="h2">Report Preview</Title3>
                  <Badge appearance="filled">
                    {filteredData.length} row{filteredData.length === 1 ? '' : 's'}
                  </Badge>
                </div>
                {filteredData.length > PREVIEW_MAX_ROWS ? (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Showing first {PREVIEW_MAX_ROWS} of {filteredData.length} rows
                  </Text>
                ) : null}
              </div>
            </div>

            {filteredData.length === 0 ? (
              <Text
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: tokens.spacingVerticalXL,
                  color: tokens.colorNeutralForeground3
                }}
              >
                No rows match the current filters.
              </Text>
            ) : (
              <div className={styles.tableWrap}>
                <Table
                  className={DATA_TABLE_CLASS}
                  style={getDataTableLayoutStyle(
                    getDataListTableMinWidth(selectedColumnDefs.map((column) => column.key))
                  )}
                >
                  <TableHeader>
                    <TableRow>
                      {selectedColumnDefs.map((column) => (
                        <TableHeaderCell
                          key={column.key}
                          style={
                            isListTitleColumn(column)
                              ? getListTitleColumnStyle()
                              : getListColumnStyle(column.key)
                          }
                        >
                          {column.label}
                        </TableHeaderCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {selectedColumnDefs.map((column) => (
                          <TableCell
                            key={column.key}
                            className={styles.tableCell}
                            style={
                              isListTitleColumn(column)
                                ? getListTitleColumnStyle()
                                : getListColumnStyle(column.key)
                            }
                          >
                            {formatReportCellValue(row[column.key])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </ContentCard>
        </>
      ) : null}
    </div>
  );
};
