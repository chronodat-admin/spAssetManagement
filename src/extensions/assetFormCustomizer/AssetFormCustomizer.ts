import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseFormCustomizer } from '@microsoft/sp-listview-extensibility';

/** Placeholder native form UI — full AM_Assets form panel wired in later tasks. */
export default class AssetFormCustomizer extends BaseFormCustomizer<Record<string, unknown>> {
  public onInit(): Promise<void> {
    return Promise.resolve();
  }

  public render(): void {
    const listTitle = this.context.list.title;
    const itemId = this.context.itemId;

    const element = React.createElement(
      'div',
      { style: { padding: '16px', fontFamily: 'Segoe UI, sans-serif' } },
      React.createElement('strong', null, 'Asset Management Form'),
      React.createElement('p', null, `${listTitle}${itemId ? ` — item ${itemId}` : ''}`),
      React.createElement('p', null, 'Custom form UI will be registered during setup.')
    );

    ReactDom.render(element, this.domElement);
  }

  public onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
