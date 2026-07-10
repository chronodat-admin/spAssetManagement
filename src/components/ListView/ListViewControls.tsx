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
import { useTranslation } from '../../i18n/LocaleContext';

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
  const { t } = useTranslation();

  return (
    <>
      <Toolbar aria-label={t('listView', 'listViewOptions', 'List view options')} size="small">
        <Tooltip content={t('listView', 'tableView', 'Table view')} relationship="label">
          <ToolbarButton
            aria-label={t('listView', 'tableView', 'Table view')}
            aria-pressed={viewMode === 'table'}
            icon={<TableSimpleRegular />}
            appearance={viewMode === 'table' ? 'primary' : 'subtle'}
            onClick={() => onViewModeChange('table')}
          />
        </Tooltip>
        <Tooltip content={t('listView', 'listView', 'List view')} relationship="label">
          <ToolbarButton
            aria-label={t('listView', 'listView', 'List view')}
            aria-pressed={viewMode === 'list'}
            icon={<ListRegular />}
            appearance={viewMode === 'list' ? 'primary' : 'subtle'}
            onClick={() => onViewModeChange('list')}
          />
        </Tooltip>
        <Tooltip content={t('listView', 'cardView', 'Card view')} relationship="label">
          <ToolbarButton
            aria-label={t('listView', 'cardView', 'Card view')}
            aria-pressed={viewMode === 'card'}
            icon={<GridRegular />}
            appearance={viewMode === 'card' ? 'primary' : 'subtle'}
            onClick={() => onViewModeChange('card')}
          />
        </Tooltip>
        <Tooltip content={t('listView', 'viewSettings', 'View settings')} relationship="label">
          <ToolbarButton
            aria-label={t('listView', 'viewSettings', 'View settings')}
            icon={<SettingsRegular />}
            onClick={() => onSettingsOpenChange(true)}
          />
        </Tooltip>
      </Toolbar>

      <RightDetailPanel
        open={settingsOpen}
        title={t('listView', 'viewSettings', 'View settings')}
        subtitle={t('listView', 'viewSettingsDesc', 'Choose which columns appear in the current view')}
        onClose={() => onSettingsOpenChange(false)}
        footer={
          <Button appearance="secondary" onClick={() => onSettingsOpenChange(false)}>
            {t('common', 'close', 'Close')}
          </Button>
        }
      >
        <Caption1 className={styles.hint}>
          {t(
            'listView',
            'columnVisibilityHint',
            'Column visibility applies to table, list, and card views. Locked columns always stay visible.'
          )}
        </Caption1>
        {columns.map((column) => {
          const checked = visibleColumns.includes(column.key);
          return (
            <div key={column.key} className={styles.columnRow}>
              <div>
                <strong>{column.label}</strong>
                {column.locked && (
                  <Caption1 block style={{ color: tokens.colorNeutralForeground3 }}>
                    {t('listView', 'alwaysShown', 'Always shown')}
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
