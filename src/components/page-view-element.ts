/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { LitElement, property } from 'lit-element';
import { RootState } from '../app/store';

export class PageViewElement extends LitElement {
  @property({type: String})
  protected _regionid: string | undefined;
  
  @property({type: String})
  protected _subpage: string = '';

  @property({type: Boolean})
  active = false;

  // Only render this page if it's actually visible.
  protected shouldUpdate() {
    return this.active;
  }

  setSubPage(state: RootState) {
    if(state.app && state.app.subpage)
      this._subpage = state.app!.subpage;
  }

  setRegionId(state: RootState) {
    if(state.ui && state.ui)
      this._regionid = state.ui.selected_top_regionid;
  }
}
