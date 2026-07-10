import type {
  IEmailTemplate,
  INotificationWorkflowTemplate,
  NotificationWorkflowKey
} from '../../models/IWorkflowSettings';
import { DEFAULT_EMAIL_TEMPLATES, DEFAULT_NOTIFICATION_WORKFLOWS } from './defaults.js';
import { LEGACY_EMAIL_TEMPLATE_SLUG_MAP, normalizeEmailTemplateSlug } from './slugs.js';

/** True when a saved template still uses the pre-confirmation notification format. */
export function isLegacyNotificationBody(body?: string): boolean {
  if (!body?.trim()) {
    return true;
  }
  return !body.includes('{LinkTitle}');
}

export function isLegacyEmailTemplateBody(bodyHtml?: string): boolean {
  if (!bodyHtml?.trim()) {
    return true;
  }
  return !bodyHtml.includes('{LinkTitle}') && !bodyHtml.includes('{CreatedBy}');
}

export function refreshLegacyNotificationWorkflow(
  key: NotificationWorkflowKey,
  template: INotificationWorkflowTemplate
): INotificationWorkflowTemplate {
  if (!isLegacyNotificationBody(template.body)) {
    return template;
  }
  const seed = DEFAULT_NOTIFICATION_WORKFLOWS[key];
  return {
    ...template,
    subject: seed.subject,
    body: seed.body
  };
}

export function refreshLegacyEmailTemplate(
  existing: IEmailTemplate,
  seed: IEmailTemplate
): IEmailTemplate {
  if (!isLegacyEmailTemplateBody(existing.bodyHtml)) {
    return { ...seed, ...existing };
  }
  return {
    ...seed,
    ...existing,
    subject: seed.subject,
    bodyHtml: seed.bodyHtml,
    variables: [...seed.variables],
    description: seed.description
  };
}

export function mergeNotificationWorkflowsWithRefresh(
  parsed?: Partial<Record<NotificationWorkflowKey, INotificationWorkflowTemplate>>
): Record<NotificationWorkflowKey, INotificationWorkflowTemplate> {
  const merged = {
    ...DEFAULT_NOTIFICATION_WORKFLOWS,
    ...(parsed || {})
  } as Record<NotificationWorkflowKey, INotificationWorkflowTemplate>;

  (Object.keys(DEFAULT_NOTIFICATION_WORKFLOWS) as NotificationWorkflowKey[]).forEach((key) => {
    merged[key] = refreshLegacyNotificationWorkflow(key, merged[key]);
  });

  return merged;
}

export function mergeEmailTemplatesWithRefresh(
  parsed?: IEmailTemplate[]
): IEmailTemplate[] {
  if (!parsed || parsed.length === 0) {
    return DEFAULT_EMAIL_TEMPLATES.map((item) => ({ ...item }));
  }

  const bySlug = new Map(parsed.map((item) => [item.slug, item]));
  const merged = DEFAULT_EMAIL_TEMPLATES.map((seed) => {
    const existing =
      bySlug.get(seed.slug) ||
      (Object.keys(LEGACY_EMAIL_TEMPLATE_SLUG_MAP) as Array<
        keyof typeof LEGACY_EMAIL_TEMPLATE_SLUG_MAP
      >)
        .map((legacySlug) =>
          LEGACY_EMAIL_TEMPLATE_SLUG_MAP[legacySlug] === seed.slug
            ? bySlug.get(legacySlug)
            : undefined
        )
        .find(Boolean);
    if (existing) {
      const normalized = {
        ...existing,
        slug: normalizeEmailTemplateSlug(existing.slug)
      };
      return refreshLegacyEmailTemplate(normalized, seed);
    }
    return { ...seed };
  });

  parsed.forEach((item) => {
    const normalizedSlug = normalizeEmailTemplateSlug(item.slug);
    if (!DEFAULT_EMAIL_TEMPLATES.some((seed) => seed.slug === normalizedSlug)) {
      merged.push({ ...item, slug: normalizedSlug });
    }
  });

  return merged;
}

export function getDefaultEmailTemplateBySlug(slug: string): IEmailTemplate | undefined {
  const normalized = normalizeEmailTemplateSlug(slug);
  return DEFAULT_EMAIL_TEMPLATES.find((item) => item.slug === normalized);
}
