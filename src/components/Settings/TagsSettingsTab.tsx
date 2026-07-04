import * as React from 'react';
import { Button, Field, Input, Text, Textarea } from '@fluentui/react-components';
import { AddRegular, DeleteRegular, EditRegular } from '@fluentui/react-icons';
import type { IAssetTag, IWorkflowSettings } from '../../models/IWorkflowSettings';
import { createTagId } from '../../lib/workflow-settings/utils';
import { RightDetailPanel } from '../Layout/RightDetailPanel';
import { TAG_COLOR_PRESETS, useWorkflowSettingsStyles } from './workflowSettingsStyles';

export interface ITagsSettingsTabProps {
  workflowSettings: IWorkflowSettings;
  onChange: (next: IWorkflowSettings) => void;
}

export const TagsSettingsTab: React.FC<ITagsSettingsTabProps> = ({ workflowSettings, onChange }) => {
  const styles = useWorkflowSettingsStyles();
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState(TAG_COLOR_PRESETS[8]);
  const [description, setDescription] = React.useState('');

  const tags = [...workflowSettings.tags].sort((a, b) => a.name.localeCompare(b.name));

  const resetForm = (): void => {
    setEditingId(null);
    setName('');
    setColor(TAG_COLOR_PRESETS[8]);
    setDescription('');
  };

  const openCreate = (): void => {
    resetForm();
    setPanelOpen(true);
  };

  const openEdit = (tag: IAssetTag): void => {
    setEditingId(tag.id);
    setName(tag.name);
    setColor(tag.color);
    setDescription(tag.description || '');
    setPanelOpen(true);
  };

  const saveTag = (): void => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const nextTag: IAssetTag = {
      id: editingId || createTagId(),
      name: trimmed,
      color,
      description: description.trim() || undefined
    };

    const nextTags = editingId
      ? tags.map((item) => (item.id === editingId ? nextTag : item))
      : [...tags, nextTag];

    onChange({ ...workflowSettings, tags: nextTags });
    setPanelOpen(false);
    resetForm();
  };

  const removeTag = (id: string): void => {
    onChange({
      ...workflowSettings,
      tags: tags.filter((item) => item.id !== id)
    });
  };

  return (
    <div>
      <div className={styles.tabToolbar}>
        <Button appearance="primary" icon={<AddRegular />} onClick={openCreate}>
          Add Tag
        </Button>
      </div>

      <div className={styles.list}>
        {tags.map((tag) => (
          <div key={tag.id} className={styles.listRow}>
            <div className={styles.listRowMain}>
              <span className={styles.colorDot} style={{ backgroundColor: tag.color }} />
              <div>
                <Text weight="semibold">{tag.name}</Text>
                {tag.description && <Text className={styles.rowMeta}>{tag.description}</Text>}
              </div>
            </div>
            <div className={styles.rowActions}>
              <Button appearance="subtle" icon={<EditRegular />} onClick={() => openEdit(tag)} />
              <Button appearance="subtle" icon={<DeleteRegular />} onClick={() => removeTag(tag.id)} />
            </div>
          </div>
        ))}
        {tags.length === 0 && (
          <Text className={styles.sectionDescription}>No tags yet. Add one to get started.</Text>
        )}
      </div>

      <RightDetailPanel
        open={panelOpen}
        title={editingId ? 'Edit Tag' : 'Add Tag'}
        onClose={() => {
          setPanelOpen(false);
          resetForm();
        }}
        footer={
          <div className={styles.panelFooter}>
            <Button appearance="secondary" onClick={() => setPanelOpen(false)}>
              Cancel
            </Button>
            <Button appearance="primary" disabled={!name.trim()} onClick={saveTag}>
              Save
            </Button>
          </div>
        }
      >
        <div className={styles.panelBody}>
          <Field label="Tag name" required>
            <Input value={name} onChange={(_, data) => setName(data.value)} />
          </Field>
          <Field label="Color">
            <div className={styles.colorPicker}>
              {TAG_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`${styles.colorSwatch} ${color === preset ? styles.colorSwatchActive : ''}`}
                  style={{ backgroundColor: preset }}
                  onClick={() => setColor(preset)}
                  aria-label={`Color ${preset}`}
                />
              ))}
            </div>
          </Field>
          <Field label="Description">
            <Textarea
              rows={3}
              resize="vertical"
              value={description}
              onChange={(_, data) => setDescription(data.value)}
            />
          </Field>
        </div>
      </RightDetailPanel>
    </div>
  );
};
