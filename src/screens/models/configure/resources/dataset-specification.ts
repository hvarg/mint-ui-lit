import { ModelCatalogResource } from './resource';
import { html, customElement, css } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { store, RootState } from 'app/store';
import { getLabel } from 'model-catalog/util';
import { IdMap } from "app/reducers";

import { datasetSpecificationGet, datasetSpecificationsGet, datasetSpecificationPost, datasetSpecificationPut, datasetSpecificationDelete } from 'model-catalog/actions';
import { DatasetSpecification, VariablePresentation, DataTransformation, DatasetSpecificationFromJSON } from '@mintproject/modelcatalog_client';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../../model-explore/explorer-styles'

import { ModelCatalogVariablePresentation } from './variable-presentation';
import { ModelCatalogDataTransformation } from './data-transformation';
import { ModelCatalogSampleResource } from './sample-resource';
import './variable-presentation';
import './data-transformation';

import { Textfield } from 'weightless/textfield';
import { Textarea } from 'weightless/textarea';
import { Select } from 'weightless/select';

@customElement('model-catalog-dataset-specification')
export class ModelCatalogDatasetSpecification extends connect(store)(ModelCatalogResource)<DatasetSpecification> {
    static get styles() {
        return [ExplorerStyles, SharedStyles, this.getBasicStyles(), css`
        #input-variable-presentation {
            --list-height: 180px;
            --dialog-height: 100%;
        }
        #input-data-transformation {
            --list-height: 180px;
            --dialog-height: 100%;
        }
        .two-inputs > wl-textfield, 
        .two-inputs > wl-select {
            display: inline-block;
            width: 50%;
        }`];
    }

    private _inputVariablePresentation : ModelCatalogVariablePresentation;
    private _inputDataTransformation : ModelCatalogDataTransformation;

    protected classes : string = "resource dataset-specification";
    protected name : string = "dataset specification";
    protected pname : string = "dataset specifications";
    protected resourcesGet = datasetSpecificationsGet;
    protected resourceGet = datasetSpecificationGet;
    protected resourcePost = datasetSpecificationPost;
    protected resourcePut = datasetSpecificationPut;
    protected resourceDelete = datasetSpecificationDelete;
    protected positionAttr : string = "position";
    public colspan = 3;

    public isSetup : boolean = false;
    private sampleResources : IdMap<ModelCatalogSampleResource> = {};
    private loadingSR : IdMap<boolean> = {};

    public setAsSetup () {
        this.isSetup = true;
        this.colspan = 4;
    }

    constructor () {
        super();
        this._inputVariablePresentation = new ModelCatalogVariablePresentation();
        this._inputVariablePresentation.setActionMultiselect();
        this._inputVariablePresentation.setAttribute('id', 'input-variable-presentation');

        this._inputDataTransformation = new ModelCatalogDataTransformation();
        this._inputDataTransformation.setActionMultiselect();
        this._inputDataTransformation.setAttribute('id', 'input-data-transformation');
    }

    protected _editResource (r:DatasetSpecification) {
        super._editResource(r);
        let edResource = this._getEditingResource();
        this._inputVariablePresentation.setResources( edResource.hasPresentation );
        this._inputDataTransformation.setResources( edResource.hasDataTransformation );
    }

    protected _createResource () {
        this._inputVariablePresentation.setResources(null);
        this._inputDataTransformation.setResources(null);
        super._createResource();
    }

    protected _renderTableHeader () {
        return html`
            <th><b>Input name</b></th>
            <th><b>Description</b></th>
            <th><b>Data Transformations</b></th>
            ${this.isSetup ? html` <th><b>Selected File</b></th> ` : ''}
        `;
    }

    private _loadResources (r:DatasetSpecification) {
        if (r.hasFixedResource && r.hasFixedResource.length > 0 && r.hasFixedResource[0].type.indexOf("SampleResource") >= 0) {
            if (!this.loadingSR[r.id] && !this.sampleResources[r.id]) {
                this.sampleResources[r.id] = new ModelCatalogSampleResource();
                this.sampleResources[r.id].setResources(r.hasFixedResource);
            }
        }
    }

    protected _renderRow (r:DatasetSpecification) {
        this._loadResources(r);
        return html`
            <td>
                <code>${getLabel(r)}</code> 
                ${r.hasFormat && r.hasFormat.length === 1 ?  
                        html`<span class="monospaced" style="color: gray;">(.${r.hasFormat})<span>` : ''}
            </td>
            <td>
                <b>${r.description ? r.description[0] : ''}</b>
            </td>
            <td>
                ${r.hasDataTransformation ? r.hasDataTransformation.map((dt:DataTransformation) =>
                html `<span class="resource data-transformation">${getLabel(dt)}</span>`) : ''}
            </td>
            ${this.isSetup ? html`
            <td>
                ${r.hasFixedResource ?
                    (this.sampleResources[r.id] ?
                        html`${this.sampleResources[r.id]}`
                        : html`<b>${getLabel(r.hasFixedResource[0])}</b>`)
                    : ''}
            </td>
            ` : ''}
        `;
    }

    protected _renderForm () {
        let edResource = this._getEditingResource();
        console.log('>>', edResource);
        return html`
        <form>
            <wl-textfield id="ds-label" label="Name" required
                value=${edResource ? getLabel(edResource) : ''}>
            </wl-textfield>
            <wl-textarea id="ds-desc" label="Description" required rows="3"
                value=${edResource && edResource.description ? edResource.description[0] : ''}>
            </wl-textarea>
            <wl-textfield id="ds-format" label="Format" required
                value="${edResource && edResource.hasFormat ? edResource.hasFormat[0] : ''}" >
            </wl-textfield>
            <div style="min-height:50px; padding: 10px 0px;">
                <div style="padding: 5px 0px; font-weight: bold;">Variables:</div>
                ${this._inputVariablePresentation}
            </div>
            <div style="padding: 10px 0px;">
                <div style="padding: 5px 0px; font-weight: bold;">Data transformations:</div>
                ${this._inputDataTransformation}
            </div>
        </form>`;
    }

    /*export interface DatasetSpecification {
        id?: string;
        type?: Array<string> | null;
        position?: Array<number> | null;
        label?: Array<string> | null;
        description?: Array<string> | null;
        hasDimensionality?: Array<number> | null;
        hasFormat?: Array<string> | null;

        hasFileStructure?: Array<object> | null;
        hasPresentation?: Array<VariablePresentation> | null;

        hasFixedResource?: Array<SampleResource> | null; //ONLY FOR SETUPS
    }*/

    protected _getResourceFromForm () {
        // GET ELEMENTS
        let inputLabel : Textfield = this.shadowRoot.getElementById('ds-label') as Textfield;
        let inputDesc : Textfield = this.shadowRoot.getElementById('ds-desc') as Textfield;
        let inputFormat : Textfield = this.shadowRoot.getElementById('ds-format') as Textfield;
        let inputDim : Textfield = this.shadowRoot.getElementById('ds-dim') as Textfield;
        // VALIDATE
        let label : string = inputLabel ? inputLabel.value : '';
        let desc : string = inputDesc ? inputDesc.value : '';
        let format : string = inputFormat ? inputFormat.value : '';
        let dim : string = inputDim ? inputDim.value : '';
        let presentation : VariablePresentation[] = this._inputVariablePresentation.getResources();
        let dataTransformation : DataTransformation[] = this._inputDataTransformation.getResources();
        if (label && desc && format) {
            let jsonRes = {
                type: ["DatasetSpecification"],
                label: [label],
                description: [desc],
                hasFormat: [format],
                position: [this._resources.length + 1],
                hasPresentation: presentation,
                hasDataTransformation: dataTransformation,
                hasDimensionality: [0],
            };
            if (presentation.length > 0 || confirm("If no variables are associated with an input, we will not be able to search dataset candidates in the MINT data catalog when using this model")) {
                return DatasetSpecificationFromJSON(jsonRes); 
            } 
            return null;
            //return DatasetSpecificationFromJSON(jsonRes);
        } else {
            // Show errors
            if (!label) (<any>inputLabel).onBlur();
            if (!desc) (<any>inputDesc).onBlur();
            if (!format) (<any>inputFormat).onBlur();
            if (presentation.length == 0) console.log('You must select at least a presentation!');
        }
    }

    protected _getDBResources () {
        let db = (store.getState() as RootState).modelCatalog;
        return db.datasetSpecifications;
    }
}
