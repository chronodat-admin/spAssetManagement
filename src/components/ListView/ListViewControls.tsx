import * as React from 'react';
import {
  Button,
  Caption1,
  makeStyles,
  Switch,
  tokens,
  Toolbar,
  ToolbarButton,
  Tooltip
} from '@fluentui/react-components';
import {
  GridRegular,
  ListRegular,
  SettingsRegular,
  TableSimpleRegular
} from '@fluentui/react-icons';
import type { ListColumnMeta, ListViewMode } from '../../lib/list-view/types';
import { RightDetailPanel } from '../Layout/RightDetailPanel';

const useStyles = makeStyles({
  columnRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
    padding: `${tokens.spacingVerticalS} 0`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },
  hint: {
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalM
  }
});

export interface IListViewControlsProps {
  viewMode: ListViewMode;
  onViewModeChange: (mode: ListViewMode) => void;
  columns: ListColumnMeta[];
  visibleColumns: string[];
  onToggleColumn: (key: string, enabled: boolean) => void;
  settingsOpen: boolean;
  onSettingsOpenChange: (open: boolean) => void;
}

export const ListViewControls: React.FC<IListViewControlsProps> = ({
  viewMode,
  onViewModeChange,
  columns,
  visibleColumns,
  onToggleColumn,
  settingsOpen,
  onSettingsOpenChange
}) => {
  const styles = useStyles();

  return (
    <>
      <Toolbar aria-label="List view options" size="small">
        <Tooltip content="Table view" relationship="label">
          <ToolbarButton
            aria-label="Table view"
            aria-pressed={viewMode === 'table'}
            icon={<TableSimpleRegular />}
            appearance={viewMode === 'table' ? 'primary' : 'subtle'}
            onClick={() => onViewModeChange('table')}
          />
        </Tooltip>
        <Tooltip content="List view" relationship="label">
          <ToolbarButton
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
            icon={<ListRegular />}
            appearance={viewMode === 'list' ? 'primary' : 'subtle'}
            onClick={() => onViewModeChange('list')}
          />
        </Tooltip>
        <Tooltip content="Card view" relationship="label">
          <ToolbarButton
            aria-label="Card view"
            aria-pressed={viewMode === 'card'}
            icon={<GridRegular />}
            appearance={viewMode === 'card' ? 'primary' : 'subtle'}
            onClick={() => onViewModeChange('card')}
          />
        </Tooltip>
        <Tooltip content="View settings" relationship="label">
          <ToolbarButton
            aria-label="View settings"
            icon={<SettingsRegular />}
            onClick={() => onSettingsOpenChange(true)}
          />
        </Tooltip>
      </Toolbar>

      <RightDetailPanel
        open={settingsOpen}
        title="View settings"
        subtitle="Choose which columns appear in the current view"
        onClose={() => onSettingsOpenChange(false)}
        footer={
          <Button appearance="secondary" onClick={() => onSettingsOpenChange(false)}>
            Close
          </Button>
        }
      >
        <Caption1 className={styles.hint}>
          Column visibility applies to table, list, and card views. Locked columns always stay visible.
        </Caption1>
        {columns.map((column) => {
          const checked = visibleColumns.includes(column.key);
          return (
            <div key={column.key} className={styles.columnRow}>
              <div>
                <strong>{column.label}</strong>
                {column.locked && (
                  <Caption1 block style={{ color: tokens.colorNeutralForeground3 }}>
                    Always shown
                  </Caption1>
                )}
              </div>
              <Switch
                checked={checked}
                disabled={column.locked}
                onChange={(_, data) => onToggleColumn(column.key, data.checked)}
              />
            </div>
          );
        })}
      </RightDetailPanel>
    </>
  );
};
