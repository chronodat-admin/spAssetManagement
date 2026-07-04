import { IAppSettings, IAsset } from '../models/IAsset';
import type {
  INotificationWorkflowTemplate,
  IWorkflowSettings,
  NotificationWorkflowKey
} from '../models/IWorkflowSettings';
import {
  buildRiskItemUrl,
  formatRiskDueDate,
  INotificationPlaceholderValues,
  resolveEmailTemplateContent,
  substituteNotificationPlaceholders
} from '../lib/workflow-settings/notifications';
import {
  IAssetNotificationUpdateInput,
  planNotificationDispatch,
  resolveNotificationRecipientEmails,
  selectRiskUpdateNotificationEvents
} from '../lib/workflow-settings/notificationLogic';
import {
  DEFAULT_NOTIFICATION_WORKFLOWS
} from '../lib/workflow-settings/defaults';
import { resolveEmailDeliveryMode, shouldAppDeliverEmail } from '../lib/workflow-settings/emailIntegration';
import { hydrateNotificationWorkflowsFromAppSettings } from '../lib/workflow-settings/storage';
import { filterValidEmailRecipients } from '../lib/workflow-settings/notificationLogic';
import { SharePointRestService } from './SharePointRestService';
import { SubscriptionService } from './SubscriptionService';
import { sendMailViaMicrosoftGraph } from './GraphEmailService';
import { DEFAULT_APP_TITLE, resolveAppDisplayName } from '../constants/spfxComponents';
import { stripHtml } from '../utils/assetValidation';
import type {
  INotificationApiContext,
  INotificationDeliveryFailure,
  INotificationDeliveryOptions
} from '../models/INotificationDelivery';
import type { AadHttpClientFactory } from '@microsoft/sp-http';

export type { IAssetNotificationUpdateInput };

interface IAdministratorUser {
  UserName1?: { Id: number; Title: string; EMail?: string };
}

export interface INotificationMatrixPriority {
  level: string;
}

export class NotificationService {
  private adminEmailsCache: string[] | undefined;
  private readonly notificationApi: SubscriptionService | undefined;
  private readonly getNotificationContext: (() => INotificationApiContext) | undefined;
  private readonly getAppPageUrl: (() => string) | undefined;
  private readonly aadHttpClientFactory: AadHttpClientFactory | undefined;
  private readonly onDeliveryError:
    | ((failure: INotificationDeliveryFailure) => void)
    | undefined;

  constructor(
    private readonly rest: SharePointRestService,
    private readonly webUrl: string,
    private readonly getAppSettings: () => Promise<IAppSettings | undefined>,
    private readonly getMatrixPriority: (
      likelihood?: string,
      consequence?: string
    ) => INotificationMatrixPriority | undefined,
    deliveryOptions?: INotificationDeliveryOptions
  ) {
    const apiBaseUrl = deliveryOptions?.subscriptionApiUrl?.trim() ?? '';
    this.notificationApi = apiBaseUrl ? new SubscriptionService(apiBaseUrl) : undefined;
    this.getNotificationContext = deliveryOptions?.getNotificationContext;
    this.getAppPageUrl = deliveryOptions?.getAppPageUrl;
    this.aadHttpClientFactory = deliveryOptions?.aadHttpClientFactory;
    this.onDeliveryError = deliveryOptions?.onDeliveryError;
  }

  public async notifyRiskCreated(risk: IAsset): Promise<void> {
    await this.dispatch('open', risk);
    if ((risk.AssignedTo || []).length > 0) {
      await this.dispatch('assignedTo', risk);
    }
  }

  public async notifyRiskUpdated(
    previous: IAsset | undefined,
    input: IAssetNotificationUpdateInput,
    updatedRisk: IAsset
  ): Promise<void> {
    const settings = await this.loadWorkflowSettings();
    const events = selectRiskUpdateNotificationEvents(
      previous,
      input,
      Boolean(settings.notificationWorkflows?.riskUpdated?.enabled)
    );

    for (const eventKey of events) {
      await this.dispatch(eventKey, updatedRisk);
    }
  }

  public async notifyRiskCommentAdded(risk: IAsset): Promise<void> {
    await this.dispatch('riskCommentAdded', risk);
  }

  private async dispatch(eventKey: NotificationWorkflowKey, risk: IAsset): Promise<void> {
    try {
      const settings = await this.loadWorkflowSettings();
      if (!shouldAppDeliverEmail(settings)) {
        return;
      }

      const appSettings = await this.getAppSettings();
      const template = this.getWorkflowTemplate(settings, eventKey);
      if (!template?.enabled) {
        return;
      }

      const placeholders = await this.buildPlaceholderValues(risk, appSettings);
      const content = resolveEmailTemplateContent(
        eventKey,
        template.subject,
        template.body,
        settings.emailTemplates
      );

      const subject = substituteNotificationPlaceholders(content.subject, placeholders);
      const body = substituteNotificationPlaceholders(content.body, placeholders);
      const recipientContext = await this.buildRecipientContext(risk, appSettings);
      const recipients = resolveNotificationRecipientEmails(
        template.recipients,
        risk,
        recipientContext
      );
      const plan = planNotificationDispatch(eventKey, template, subject, body, recipients);

      if (plan.skipped) {
        return;
      }

      try {
        await this.deliverEmail(plan.recipients, plan.subject, plan.body, content.isHtml, settings);
      } catch (deliveryError) {
        // Notification delivery must never block risk save operations, but the
        // failure is surfaced to the host app so users are not left in the dark.
        const message =
          deliveryError instanceof Error ? deliveryError.message : 'Email delivery failed.';
        console.warn(`[${DEFAULT_APP_TITLE}] Email notification failed:`, deliveryError);
        this.onDeliveryError?.({
          mode: resolveEmailDeliveryMode(settings),
          message,
          recipientCount: plan.recipients.length
        });
      }
    } catch (error) {
      // Unexpected failures while building the notification must not block saves.
      console.warn(`[${DEFAULT_APP_TITLE}] Email notification failed:`, error);
    }
  }

  private async deliverEmail(
    to: string[],
    subject: string,
    body: string,
    isHtml = false,
    workflowSettings?: IWorkflowSettings
  ): Promise<void> {
    const recipients = filterValidEmailRecipients(to);
    if (recipients.length === 0) {
      return;
    }

    const mode = resolveEmailDeliveryMode(workflowSettings);

    if (mode === 'chronodatApi') {
      if (!this.notificationApi?.isConfigured) {
        throw new Error(
          'Chronodat API delivery is selected but the Chronodat notification API is unavailable.'
        );
      }

      const context = this.getNotificationContext?.();
      if (!context?.tenantId || !context.siteUrl) {
        throw new Error('Chronodat notification context (tenant and site URL) is unavailable.');
      }

      await this.notificationApi.sendNotification({
        tenantId: context.tenantId,
        siteUrl: context.siteUrl ?? '',
        productSlug: context.productSlug,
        tenantName: context.tenantName,
        to: recipients,
        subject,
        html: body
      });
      return;
    }

    if (!this.aadHttpClientFactory) {
      throw new Error(
        'Microsoft Graph Mail.Send is required for email delivery. Deploy the app package and approve the Mail.Send API permission in SharePoint Admin Center.'
      );
    }

    await sendMailViaMicrosoftGraph(
      this.aadHttpClientFactory,
      recipients,
      subject,
      body,
      { isHtml }
    );
  }

  private async loadWorkflowSettings(): Promise<IWorkflowSettings> {
    const appSettings = await this.getAppSettings();
    return hydrateNotificationWorkflowsFromAppSettings(appSettings);
  }

  private getWorkflowTemplate(
    settings: IWorkflowSettings,
    key: NotificationWorkflowKey
  ): INotificationWorkflowTemplate | undefined {
    return settings.notificationWorkflows?.[key] || DEFAULT_NOTIFICATION_WORKFLOWS[key];
  }

  private async buildPlaceholderValues(
    risk: IAsset,
    appSettings?: IAppSettings
  ): Promise<INotificationPlaceholderValues> {
    let modifiedByName = '';
    try {
      const currentUser = await this.rest.getCurrentUser();
      modifiedByName = currentUser.Title;
    } catch {
      modifiedByName = '';
    }

    const priority = this.getMatrixPriority(risk.Likelihood, risk.Consequence);
    const assignedNames = (risk.AssignedTo || []).map((user) => user.Title).join(', ');
    const dueDate = formatRiskDueDate(risk.RiskDueDate);
    const identified = formatRiskDueDate(risk.DateRiskIdentified);
    const reviewDate = formatRiskDueDate(risk.Implementationreviewdate);

    const createdByName = risk.Author?.Title || modifiedByName;
    const linkTitle = risk.Title?.trim() || 'View asset details';

    return {
      AM_AssetId: risk.AM_AssetId || String(risk.Id),
      Title: risk.Title,
      Status: typeof risk.AM_Status === 'string' ? risk.AM_Status : risk.AM_Status?.Title || risk.Riskstatus || 'Open',
      Priority: priority?.level || '',
      Category: risk.RiskCategory?.Title || '',
      AssignedTo: assignedNames,
      AssetUrl: buildRiskItemUrl(this.webUrl, risk.Id, this.getAppPageUrl?.()),
      CreatedByName: createdByName,
      ModifiedByName: modifiedByName,
      DueDate: dueDate,
      OrgName: resolveAppDisplayName(appSettings?.Title),
      Dates: [dueDate, identified, reviewDate].filter(Boolean).join(' | '),
      AM_Notes: stripHtml(risk.AM_Notes),
      LinkTitle: linkTitle
    };
  }

  private async buildRecipientContext(
    risk: IAsset,
    appSettings?: IAppSettings
  ): Promise<{
    adminEmails: string[];
    currentUserEmail?: string;
    supportGroup?: string;
  }> {
    let currentUserEmail: string | undefined;
    if (!risk.Author?.Email) {
      try {
        const currentUser = await this.rest.getCurrentUser();
        currentUserEmail = currentUser.Email;
      } catch {
        currentUserEmail = undefined;
      }
    }

    return {
      adminEmails: await this.getAdministratorEmails(),
      currentUserEmail,
      supportGroup: appSettings?.SupportGroup
    };
  }

  private async getAdministratorEmails(): Promise<string[]> {
    if (this.adminEmailsCache) {
      return this.adminEmailsCache;
    }

    try {
      const items = await this.rest.getItems<IAdministratorUser>(
        'Administrators',
        'Id,UserName1/Id,UserName1/Title,UserName1/EMail',
        'UserName1'
      );
      const emails = items
        .map((item) => item.UserName1?.EMail)
        .filter((email): email is string => Boolean(email && email.includes('@')));
      this.adminEmailsCache = emails;
      return emails;
    } catch {
      return [];
    }
  }

  public invalidateAdministratorEmails(): void {
    this.adminEmailsCache = undefined;
  }
}
