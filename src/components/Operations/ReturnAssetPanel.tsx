import * as React from 'react';
import {
  Button,
  Field,
  Text,
  Textarea
} from '@fluentui/react-components';
import { ArrowUndoRegular } from '@fluentui/react-icons';
import { ContentCard } from '../Layout/ContentCard';
import { EmptyState } from '../Layout/EmptyState';
import { useFormStyles } from '../Forms/formStyles';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { Option } from '@fluentui/react-components';
import { IAsset } from '../../models/IAssetApp';
import { AssignmentService } from '../../services/AssignmentService';
import { isReturnableAsset } from '../../utils/assignmentUtils';
import { buildAssetSelectOption } from '../../utils/assetSelectOptions';
import { useTranslation } from '../../i18n/LocaleContext';
import { PageNotifications } from '../Layout/PageNotifications';


export interface IReturnAssetPanelProps {
  assets: IAsset[];
  assignmentService: AssignmentService;
  onComplete: () => void;
}

export const ReturnAssetPanel: React.FC<IReturnAssetPanelProps> = ({
  assets,
  assignmentService,
  onComplete
}) => {
  const styles = useFormStyles();
  const { t } = useTranslation();
  const returnable = React.useMemo(() => assets.filter(isReturnableAsset), [assets]);
  const [assetId, setAssetId] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!assetId && returnable.length > 0) {
      setAssetId(String(returnable[0].Id));
    }
  }, [returnable, assetId]);

  const handleSubmit = async (): Promise<void> => {
    const parsedId = Number(assetId);
    if (!parsedId) {
      setError('Select an asset to return.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await assignmentService.returnAsset({ assetId: parsedId, notes: notes.trim() || undefined });
      setNotes('');
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Return failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ContentCard>
      <PageNotifications error={error || undefined} />
      {returnable.length === 0 ? (
        <EmptyState
          bordered
          icon={<ArrowUndoRegular />}
          title={t('operationsEmpty', 'noAssignedAssetsTitle', 'No assigned assets')}
          description={t(
            'operationsEmpty',
            'noAssignedAssetsDescription',
            'Assigned assets will appear here when you are ready to process a return.'
          )}
        />
      ) : (
        <div className={styles.form}>
          <div className={styles.intro}>
            <Text>Return an assigned asset to inventory. The status changes back to Available.</Text>
          </div>

          <Field label="Assigned asset" required>
            <AppDropdown
              searchable
              searchPlaceholder="Search assigned assets…"
              selectedOptions={assetId ? [assetId] : []}
              onOptionSelect={(_, data) => setAssetId(data.optionValue || '')}
            >
              {returnable.map((asset) => {
                const option = buildAssetSelectOption(asset, { includeAssignee: true });
                return (
                  <Option key={asset.Id} value={option.value} text={option.searchText}>
                    {option.label}
                  </Option>
                );
              })}
            </AppDropdown>
          </Field>
          <Field label="Notes">
            <Textarea value={notes} onChange={(_, data) => setNotes(data.value)} rows={3} resize="vertical" />
          </Field>
          <div className={styles.actions}>
            <Button
              appearance="primary"
              icon={<ArrowUndoRegular />}
              disabled={saving || !assetId}
              onClick={() => void handleSubmit()}
            >
              {saving ? 'Returning…' : 'Return asset'}
            </Button>
          </div>
        </div>
      )}
    </ContentCard>
  );
};
