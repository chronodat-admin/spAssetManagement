import * as React from 'react';
import {
  Button,
  Field,
  Input,
  Option,
  Textarea
} from '@fluentui/react-components';
import { SaveRegular } from '@fluentui/react-icons';
import { ContentCard } from '../Layout/ContentCard';
import { useFormStyles } from '../Forms/formStyles';
import { AppDropdown } from '../Dropdown/AppDropdown';
import { ILookupItem } from '../../models/IAssetApp';
import { AssetRequestService } from '../../services/AssetRequestService';
import { useTranslation } from '../../i18n/LocaleContext';
import { PageNotifications } from '../Layout/PageNotifications';


export interface IRequestAssetPageProps {
  requestService: AssetRequestService;
  categories: ILookupItem[];
  currentUserId: number;
  onComplete: () => void;
}

export const RequestAssetPage: React.FC<IRequestAssetPageProps> = ({
  requestService,
  categories,
  currentUserId,
  onComplete
}) => {
  const styles = useFormStyles();
  const { t } = useTranslation();
  const [title, setTitle] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [justification, setJustification] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const handleSubmit = async (): Promise<void> => {
    if (!title.trim()) {
      setError('Enter a request title.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await requestService.createRequest({
        Title: title.trim(),
        AM_RequestedById: currentUserId,
        AM_CategoryId: categoryId ? Number(categoryId) : null,
        AM_Justification: justification.trim(),
        AM_Status: 'Pending',
        AM_RequestDate: new Date().toISOString().split('T')[0]
      });
      setTitle('');
      setCategoryId('');
      setJustification('');
      setSuccess(t('requests', 'requestSubmitted', 'Request submitted'));
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ContentCard>
      <PageNotifications error={error || undefined} success={success || undefined} />
      <div className={styles.form}>
        <Field label="Request title" required>
          <Input value={title} onChange={(_, d) => setTitle(d.value)} placeholder="e.g. Laptop for new hire" />
        </Field>
        <Field label={t('requests', 'category', 'Category')}>
          <AppDropdown
            searchable
            searchPlaceholder={t('operations', 'searchOptions', 'Search…')}
            selectedOptions={categoryId ? [categoryId] : []}
            onOptionSelect={(_, data) => setCategoryId(data.optionValue || '')}
            placeholder="Select category"
          >
            {categories.map((cat) => (
              <Option key={cat.Id} value={String(cat.Id)} text={cat.Title}>
                {cat.Title}
              </Option>
            ))}
          </AppDropdown>
        </Field>
        <Field label={t('requests', 'justification', 'Justification')} className={styles.fullWidth}>
          <Textarea
            value={justification}
            onChange={(_, d) => setJustification(d.value)}
            rows={4}
            placeholder="Why is this asset needed?"
          />
        </Field>
        <Button appearance="primary" icon={<SaveRegular />} disabled={saving} onClick={() => void handleSubmit()}>
          {t('requests', 'submitRequest', 'Submit request')}
        </Button>
      </div>
    </ContentCard>
  );
};
