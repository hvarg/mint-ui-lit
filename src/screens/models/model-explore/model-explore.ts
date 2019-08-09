import { html, customElement, property, css } from 'lit-element';
import { PageViewElement } from '../../../components/page-view-element.js';
import { connect } from 'pwa-helpers/connect-mixin';

import { ExplorerStyles } from './explorer-styles'
import { SharedStyles } from '../../../styles/shared-styles';
import { store, RootState } from '../../../app/store';

import { goToPage } from '../../../app/actions';

import { explorerFetch, explorerSearchByVarName } from './actions';
import explorer from "./reducers";
import explorerUI from "./ui-reducers";
import { UriModels } from './reducers';

import './model-facet'
import './model-facet-big'

import "weightless/textfield";
import "weightless/icon";
import "weightless/select";

store.addReducers({
    explorer,
    explorerUI
});

@customElement('model-explorer')
export class ModelExplorer extends connect(store)(PageViewElement) {
    @property({type: Object})
    private _models! : UriModels;// = {} as UriModels;

    @property({type: String})
    private _selectedUri : string = '';

    @property({type: String})
    private _filter : string = '';

    @property({type: String})
    private _searchType : string = 'full-text';

    private _fullText : {[s: string]: string} = {};
    private _variables : {[s: string]: string} = {};

    @property({type: Object})
    private _activeModels : {[s: string]: boolean} = {};

    @property({type: Number})
    private _activeCount : number = 0;

    @property({type: Boolean})
    private _loading : boolean = true;

    static get styles() {
        return [SharedStyles, ExplorerStyles,
            css `
            wl-button {
                padding: 6px 10px;
            }

            .search-results {
                margin: 0 auto;
                overflow: scroll;
                height: 100%;
                width: 75%;
            }

            #model-search-form {
                margin: 0 auto;
                overflow: scroll;
                width: 75%;
                padding-bottom: 1em;
            }

            #model-search-form > * {
                display: inline-block;
                vertical-align: middle;
            }

            #model-search-form > wl-textfield {
                width:70%;
            }

            #model-search-form > wl-select {
                width: calc(30% - 10px);
                padding-left: 10px;
            }

            #model-search-form > wl-textfield > div[slot="after"] > wl-icon {
                cursor: pointer;
            }
            `
        ];
    }

    protected render() {
        return html`
            <div class="cltrow scenariorow">
                ${this._selectedUri?
                html`
                <wl-button flat inverted @click="${()=> goToPage('models/explore')}">
                    <wl-icon>arrow_back_ios</wl-icon>
                </wl-button>
                <div class="cltmain" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;padding-left:5px;">
                    <wl-title level="3" style="margin: 0px; cursor: pointer;" 
                            @click="${()=> goToPage('models/explore')}">Model Catalog</wl-title>
                </div>
                `
                : html`
                <wl-button flat inverted @click="${()=> goToPage('models')}">
                    <wl-icon>arrow_back_ios</wl-icon>
                </wl-button>
                <div class="cltmain" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;padding-left:5px;">
                    <wl-title level="3" style="margin: 0px;">Model Catalog</wl-title>
                </div>
                `}
            </div>

            ${this._selectedUri? 
                //Display only selected model or the search
                html`<model-facet-big style="width:75%;" uri="${this._selectedUri}"></model-facet-big>`
                : this._renderSearch()
            }
        `;
    }

    _renderSearch () {
        return html`
            <div id="model-search-form">
                <!-- https://github.com/andreasbm/weightless/issues/58 -->
                <wl-textfield id="search-input" label="Search models" @input=${this._onSearchInput} value="${this._filter}">
                    <div slot="after"> 
                        <wl-icon style="${this._filter == '' ? 'display:none;' : ''}" @click="${this._clearSearchInput}">clear</wl-icon> 
                    </div>
                    <div slot="before"> <wl-icon>search</wl-icon> </div>
                </wl-textfield><!--
                --><wl-select id="search-type-selector" label="Search on" @input="${this._onSearchTypeChange}" value="${this._searchType}">
                   <option value="full-text"}">Full text</option>
                   <option value="variables">Variable names</option>
                </wl-select>
            </div>

            <div class="search-results">
                <div style="padding-bottom: 1em; text-align:center;">
                ${this._loading? html`
                    <wl-progress-spinner></wl-progress-spinner>`
                : html`
                ${this._activeCount == 0? html`<wl-text style="font-size: 1.4em;">No model fits the search parameters</wl-text>`: html``}
                `}
                </div>

                ${Object.keys(this._models).map( (key:string) => html`
                    <model-facet 
                        uri="${key}"
                        altDesc="${this._variables[key] ? this._variables[key] : ''}"
                        altTitle="${this._variables[key] ? 'With Variables ('+this._variables[key].split(';').length+'):' : ''}"
                        style="${!this._activeModels[key]? 'display: none;' : ''}">
                    </model-facet>
                    `
                )}
            </div>
        `
    }

    _onSearchInput () {
        let inputElement : HTMLElement | null = this.shadowRoot!.getElementById('search-input');
        if (!inputElement) return;

        let input : string = inputElement['value'].toLowerCase();
        switch (this._searchType) {
            case 'full-text':
                let count = 0;
                Object.keys(this._models).forEach((key:string) => {
                    this._activeModels[key] = this._fullText[key].includes(input);
                    if (this._activeModels[key]) count += 1;
                });
                this._activeCount = count;
                break;
            case 'variables':
                this._searchByVariableName(input);
                break;
            default:
                console.log('Invalid search type')
        }

        this._filter = input;
    }

    _clearSearchInput () {
        this._filter = '';
        let count = 0;
        Object.keys(this._models).forEach((key:string) => {
            this._activeModels[key] = true;
            count += 1;
        });
        this._activeCount = count;
    }

    _onSearchTypeChange () {
        let selectElement : HTMLElement | null = this.shadowRoot!.getElementById('search-type-selector');
        if (!selectElement) return;

        this._searchType = selectElement['value'].toLowerCase();
        this._clearSearchInput();
    }

    _lastTimeout:any;
    _searchByVariableName (input:string) {
        this._loading=true;
        if (this._lastTimeout) {
            clearTimeout(this._lastTimeout);
        }
        if (input) {
            Object.keys(this._models).forEach((key:string) => {
                this._activeModels[key] = false;
            })
            this._activeCount = 0;
            this._lastTimeout = setTimeout(
                ()=>{ store.dispatch(explorerSearchByVarName(input)); },
                750);
        } else {
            this._loading=false;
            this._clearSearchInput();
        }
    }

    firstUpdated() {
        store.dispatch(explorerFetch());
    }

    stateChanged(state: RootState) {
        if (state.explorer) {
            if (state.explorer.models && this._models != state.explorer.models) {
                this._models = state.explorer.models;
                this._fullText = {};
                this._activeModels = {};
                let count = 0;
                Object.keys(this._models).forEach((key:string) => {
                    let model = this._models[key];
                    this._fullText[key] = (model.label
                                           + (model.desc? model.desc : '')
                                           + (model.keywords? model.keywords : '') 
                                           + (model.type? model.type : '')).toLowerCase();
                    this._filter = '';
                    this._activeModels[key] = true;
                    count += 1;
                });
                this._activeCount = count;
                if (count > 0)
                    this._loading = false;
            }

            if (state.explorer.search && state.explorer.search[this._filter]) {
                Object.keys(this._models).forEach((key:string) => {
                    this._activeModels[key] = false;
                });
                let count = 0;
                this._variables = {};
                Object.keys(state.explorer.search[this._filter]).forEach((key:string) =>{
                    this._activeModels[key] = true;
                    this._variables[key] = state.explorer!.search[this._filter][key].join(';');
                    count += 1;
                });
                this._activeCount = count;
                this._loading = false;
            }
        }
        if (state.explorerUI && state.explorerUI.selectedModel != this._selectedUri) {
            if (state.explorer && state.explorer.models[state.explorerUI.selectedModel]) {
                this._selectedUri = state.explorerUI.selectedModel;
            } else {
                this._selectedUri = '';
            }
        }
    }
}
