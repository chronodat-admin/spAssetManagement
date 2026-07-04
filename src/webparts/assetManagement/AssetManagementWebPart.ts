import '../../utils/earlyLoadingShell';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version, DisplayMode } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'AssetManagementWebPartStrings';
import { AssetManagementApp } from './components/AssetManagementApp';
import {
  applyAppLoadingState,
  applySharePointLeftNavHidden,
  applyWebPartHostStyles,
  loadAssetManagementStyles,
  markTeamsHostEnvironment,
  removeAppLoadingState,
  removeBootstrapLoader,
  removeFullScreenLoader,
  removeSharePointLeftNavHidden,
  scheduleSharePointLeftNavHidden,
  scheduleWebPartCanvasExpand,
  showBootstrapLoader,
  showFullScreenLoader,
  unmarkTeamsHostEnvironment
} from '../../utils/loadAssetManagementStyles';
import { DEFAULT_APP_TITLE, DEFAULT_SUBSCRIPTION_API_URL } from '../../constants/spfxComponents';
import { isTeamsHosted } from '../../utils/hostContext';
import { patchTabsterInstance } from '../../utils/patchTabster';

export interface IAssetManagementWebPartProps {
  siteTitle: string;
  /** @deprecated Use Appearance settings. Kept for manifest compatibility. */
  hideSharePointChrome?: boolean;
  /** @deprecated Use DEFAULT_SUBSCRIPTION_API_URL constant. */
  subscriptionApiUrl?: string;
  /** DEV ONLY — set via serve.json; not exposed in property pane. */
  skipSubscriptionCheck?: boolean;
}

const REACT_MOUNT_CLASS = 'asset-mgmt-react-mount';

export default class AssetManagementWebPart extends BaseClientSideWebPart<IAssetManagementWebPartProps> {
  private _reactMountPoint: HTMLDivElement | undefined;

  private get _isTeamsHost(): boolean {
    return isTeamsHosted(this.context);
  }

  private _ensureReactMount(): HTMLDivElement {
    const existingMounts = Array.from(
      this.domElement.querySelectorAll(`:scope > .${REACT_MOUNT_CLASS}`)
    ) as HTMLDivElement[];

    if (existingMounts.length > 0) {
      this._reactMountPoint = existingMounts[existingMounts.length - 1];
      for (let i = 0; i < existingMounts.length - 1; i++) {
        ReactDom.unmountComponentAtNode(existingMounts[i]);
        existingMounts[i].remove();
      }
    } else {
      this._reactMountPoint = document.createElement('div');
      this._reactMountPoint.className = REACT_MOUNT_CLASS;
      this.domElement.appendChild(this._reactMountPoint);
    }

    return this._reactMountPoint;
  }

  protected onInit(): Promise<void> {
    patchTabsterInstance();
    if (this._isTeamsHost) {
      markTeamsHostEnvironment();
      removeSharePointLeftNavHidden();
    } else {
      applySharePointLeftNavHidden();
    }
    applyWebPartHostStyles(this.domElement, this._isTeamsHost);
    if (this.displayMode !== DisplayMode.Edit) {
      applyAppLoadingState(this.domElement);
      showBootstrapLoader(this.domElement);
      showFullScreenLoader();
    } else {
      removeBootstrapLoader(this.domElement);
      removeFullScreenLoader();
    }
    this.applyDefaultLeftNavVisibility();
    loadAssetManagementStyles();

    if (!this.properties.siteTitle) {
      this.properties.siteTitle = DEFAULT_APP_TITLE;
    }

    return super.onInit();
  }

  private applyDefaultLeftNavVisibility(): void {
    if (this._isTeamsHost) {
      removeSharePointLeftNavHidden();
      return;
    }

    scheduleSharePointLeftNavHidden();
  }

  public render(): void {
    patchTabsterInstance();
    const mount = this._ensureReactMount();
    applyWebPartHostStyles(this.domElement, this._isTeamsHost);
    scheduleWebPartCanvasExpand(this.domElement, this._isTeamsHost);
    const webUrl = this.context.pageContext.web.absoluteUrl;

    const element = React.createElement(AssetManagementApp, {
      context: this.context,
      webUrl,
      siteTitle: this.properties.siteTitle,
      displayMode: this.displayMode,
      isTeamsHost: this._isTeamsHost,
      subscriptionApiUrl: DEFAULT_SUBSCRIPTION_API_URL,
      skipSubscriptionCheck: this.properties.skipSubscriptionCheck === true
    });

    ReactDom.render(element, mount);
  }

  protected onDisplayModeChanged(_oldDisplayMode: DisplayMode): void {
    this.render();
  }

  protected onDispose(): void {
    removeAppLoadingState(this.domElement);
    removeBootstrapLoader(this.domElement);
    removeSharePointLeftNavHidden();
    unmarkTeamsHostEnvironment();
    if (this._reactMountPoint) {
      ReactDom.unmountComponentAtNode(this._reactMountPoint);
    }
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('siteTitle', {
                  label: strings.SiteTitleFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
