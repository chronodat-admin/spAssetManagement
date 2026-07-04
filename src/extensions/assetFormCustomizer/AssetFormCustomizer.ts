import * as React from 'react';
import * as ReactDom from 'react-dom';
import { FormDisplayMode } from '@microsoft/sp-core-library';
import { BaseFormCustomizer } from '@microsoft/sp-listview-extensibility';
import { ASSETS_LIST_TITLE } from '../../models/IListDefinitions';
import { AssetFormCustomizerView } from './AssetFormCustomizerView';

function resolveDisplayModeLabel(displayMode: FormDisplayMode): 'New' | 'Edit' | 'Display' {
  if (displayMode === FormDisplayMode.New) {
    return 'New';
  }
  if (displayMode === FormDisplayMode.Display) {
    return 'Display';
  }
  return 'Edit';
}

export default class AssetFormCustomizer extends BaseFormCustomizer<Record<string, unknown>> {
  public onInit(): Promise<void> {
    return Promise.resolve();
  }

  public render(): void {
    const listTitle = this.context.list.title;
    const isAssetList = listTitle === ASSETS_LIST_TITLE || listTitle === 'AM_Assets';
    const element = React.createElement(AssetFormCustomizerView, {
      listTitle: isAssetList ? ASSETS_LIST_TITLE : listTitle,
      itemId: this.context.itemId,
      displayMode: resolveDisplayModeLabel(this.displayMode)
    });
    ReactDom.render(element, this.domElement);
  }

  public onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
