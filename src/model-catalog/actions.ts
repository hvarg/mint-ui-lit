import { Action, ActionCreator } from "redux";
import { ThunkAction } from "redux-thunk";
import { RootState, store } from 'app/store';

import { Configuration, DefaultApi, ModelApi, SoftwareVersionApi, ModelConfigurationApi, ParameterApi, GridApi,
         DatasetSpecificationApi, PersonApi, ProcessApi, TimeIntervalApi, SoftwareImageApi } from '@mintproject/modelcatalog_client';

function debug () {
    console.log('OBA:', ...arguments);
}

const idReducer = (dic, elem) => {
    dic[elem.id] = elem;
    return dic;
}

const fixPosition = (resource:any) => {
    if (resource.position) {
        resource.position = resource.position[0];
    }
    return resource;
}

const DEFAULT_GRAPH = 'mint@isi.edu'

export const MODELS_GET = "MODELS_GET";
interface MCAModelsGet extends Action<'MODELS_GET'> { payload: any };
export const modelsGet: ActionCreator<ModelCatalogThunkResult> = () => (dispatch) => {
    debug('Fetching models');
    let MApi : ModelApi = new ModelApi();
    MApi.modelsGet({username: DEFAULT_GRAPH})
    .then((data) => {
        dispatch({
            type: MODELS_GET,
            payload: data.reduce(idReducer, {})
        });
    })
    .catch((err) => {console.log('Error on getModels', err)})
}

export const VERSIONS_GET = "VERSIONS_GET";
interface MCAVersionsGet extends Action<'VERSIONS_GET'> { payload: any };
export const versionsGet: ActionCreator<ModelCatalogThunkResult> = () => (dispatch) => {
    debug('Fetching versions');
    let api = new SoftwareVersionApi();
    api.softwareversionsGet({username: DEFAULT_GRAPH})
        .then((data) => {
            console.log(data);
            dispatch({
                type: VERSIONS_GET,
                payload: data.reduce(idReducer, {})
            });
        })
        .catch((err) => {console.log('Error on getVersions', err)})
}

export const CONFIGURATIONS_GET = "CONFIGURATIONS_GET";
interface MCAConfigurationsGet extends Action<'CONFIGURATIONS_GET'> { payload: any };
export const configurationsGet: ActionCreator<ModelCatalogThunkResult> = () => (dispatch) => {
    debug('Fetching configurations');
    let api = new ModelConfigurationApi();
    api.modelconfigurationsGet({username: DEFAULT_GRAPH})
        .then((data) => {
            dispatch({
                type: CONFIGURATIONS_GET,
                payload: data.reduce(idReducer, {})
            });
        })
        .catch((err) => {console.log('Error on getConfigs', err)})
}

export const CONFIGURATION_PUT = "CONFIGURATION_PUT";
interface MCAConfigurationPut extends Action<'CONFIGURATION_PUT'> { payload: any };
export const configurationPut: ActionCreator<ModelCatalogThunkResult> = (config) => (dispatch) => {
    debug('Updating configuration', config.id);
    let state: any = store.getState();
    let status = state.app.prefs.modelCatalog.status;
    let token = state.app.prefs.modelCatalog.accessToken;
    let C : Configuration = new Configuration({accessToken: token});

    if (status === 'DONE') {
        let api = new ModelConfigurationApi(C);
        let id = config.id.split('/').pop();
        api.modelconfigurationsIdPut({id: id, user: DEFAULT_GRAPH, modelConfiguration: config, username: DEFAULT_GRAPH}) //<- my username
            .then((data) => {
                console.log(data);
            })
            .catch((err) => {console.log('Error on putConfigs', err)})
    } else if (status === 'LOADING') {
        console.log('waiting...')
        dispatch({
            type: 'WAIT_UNTIL',
            predicate: action => (action.type === 'FETCH_MODEL_CATALOG_ACCESS_TOKEN'),
            run: (dispatch, getState, action) => {
                dispatch(configurationPut(config));
                console.log('dispaching async')
            }
        })
    }
}

export const CONFIGURATION_POST = "CONFIGURATION_POST";
interface MCAConfigurationPost extends Action<'CONFIGURATION_POST'> { payload: any };
export const configurationPost: ActionCreator<ModelCatalogThunkResult> = (config) => (dispatch) => {
    debug('creating new configuration', config);

    let state: any = store.getState();
    let status = state.app.prefs.modelCatalog.status;
    let token = state.app.prefs.modelCatalog.accessToken;
    let C : Configuration = new Configuration({accessToken: token});

    if (status === 'DONE') {
        config.id = '';
        let api = new ModelConfigurationApi(C);
        api.modelconfigurationsPost({user: DEFAULT_GRAPH, modelConfiguration: config}) //<- my username
            .then((data) => {
                console.log(data);
            })
            .catch((err) => {console.log('Error on putConfigs', err)})
    } else if (status === 'LOADING') {
        console.log('waiting...')
        dispatch({
            type: 'WAIT_UNTIL',
            predicate: action => (action.type === 'FETCH_MODEL_CATALOG_ACCESS_TOKEN'),
            run: (dispatch, getState, action) => {
                dispatch(configurationPost(config));
                console.log('dispaching async')
            }
        })
    }
}


export const PARAMETER_GET = "PARAMETER_GET";
interface MCAParameterGet extends Action<'PARAMETER_GET'> { payload: any };
export const parameterGet: ActionCreator<ModelCatalogThunkResult> = (uri) => (dispatch) => {
    debug('Fetching parameter', uri);
    let id = uri.split('/').pop();
    let api = new ParameterApi();
    api.parametersIdGet({username: DEFAULT_GRAPH, id: id})
        .then((resp) => {
            let data = {};
            data[uri] = fixPosition(resp);
            dispatch({
                type: PARAMETER_GET,
                payload: data
            });
        })
        .catch((err) => {console.log('Error on getParameter', err)})
}

export const DATASET_SPECIFICATION_GET = "DATASET_SPECIFICATION_GET";
interface MCADatasetSpecificationGet extends Action<'DATASET_SPECIFICATION_GET'> { payload: any };
export const datasetSpecificationGet: ActionCreator<ModelCatalogThunkResult> = (uri) => (dispatch) => {
    debug('Fetching dataset specification', uri);
    let id = uri.split('/').pop();
    let api = new DatasetSpecificationApi();
    api.datasetspecificationsIdGet({username: DEFAULT_GRAPH, id: id})
        .then((resp) => {
            let data = {};
            data[uri] = fixPosition(resp);
            dispatch({
                type: DATASET_SPECIFICATION_GET,
                payload: data
            });
        })
        .catch((err) => {console.log('Error on getDatasetSpecification', err)})
}

export const PERSON_GET = "PERSON_GET";
interface MCAPersonGet extends Action<'PERSON_GET'> { payload: any };
export const personGet: ActionCreator<ModelCatalogThunkResult> = (uri) => (dispatch) => {
    debug('Fetching person', uri);
    let id = uri.split('/').pop();
    let api = new PersonApi();
    api.personsIdGet({username: DEFAULT_GRAPH, id: id})
        .then((resp) => {
            let data = {};
            data[uri] = resp;
            dispatch({
                type: PERSON_GET,
                payload: data
            });
        })
        .catch((err) => {console.log('Error on getPerson', err)})
}

export const GRID_GET = "GRID_GET";
interface MCAGridGet extends Action<'GRID_GET'> { payload: any };
export const gridGet: ActionCreator<ModelCatalogThunkResult> = (uri) => (dispatch) => {
    debug('Fetching grid', uri);
    let id = uri.split('/').pop();
    let api = new GridApi();
    api.gridsIdGet({username: DEFAULT_GRAPH, id: id})
        .then((resp) => {
            let data = {};
            data[uri] = resp;
            dispatch({
                type: GRID_GET,
                payload: data
            });
        })
        .catch((err) => {console.log('Error on getGrid', err)})
}

export const PROCESS_GET = "PROCESS_GET";
interface MCAProcessGet extends Action<'PROCESS_GET'> { payload: any };
export const processGet: ActionCreator<ModelCatalogThunkResult> = (uri) => (dispatch) => {
    debug('Fetching process', uri);
    let id = uri.split('/').pop();
    let api = new ProcessApi();
    api.processsIdGet({username: DEFAULT_GRAPH, id: id})
        .then((resp) => {
            let data = {};
            data[uri] = resp;
            dispatch({
                type: PROCESS_GET,
                payload: data
            });
        })
        .catch((err) => {console.log('Error on getProcess', err)})
}

export const TIME_INTERVAL_GET = "TIME_INTERVAL_GET";
interface MCATimeIntervalGet extends Action<'TIME_INTERVAL_GET'> { payload: any };
export const timeIntervalGet: ActionCreator<ModelCatalogThunkResult> = (uri) => (dispatch) => {
    debug('Fetching timeinterval', uri);
    let id = uri.split('/').pop();
    let api = new TimeIntervalApi();
    api.timeintervalsIdGet({username: DEFAULT_GRAPH, id: id})
        .then((resp) => {
            let data = {};
            data[uri] = resp;
            dispatch({
                type: TIME_INTERVAL_GET,
                payload: data
            });
        })
        .catch((err) => {console.log('Error on getTimeInterval', err)})
}

export const SOFTWARE_IMAGE_GET = "SOFTWARE_IMAGE_GET";
interface MCASoftwareImageGet extends Action<'SOFTWARE_IMAGE_GET'> { payload: any };
export const softwareImageGet: ActionCreator<ModelCatalogThunkResult> = (uri) => (dispatch) => {
    debug('Fetching software image', uri);
    let id = uri.split('/').pop();
    let api = new SoftwareImageApi();
    api.softwareimagesIdGet({username: DEFAULT_GRAPH, id: id})
        .then((resp) => {
            let data = {};
            data[uri] = resp;
            dispatch({
                type: SOFTWARE_IMAGE_GET,
                payload: data
            });
        })
        .catch((err) => {console.log('Error on getSoftwareImage', err)})
}

export type ModelCatalogAction = MCAModelsGet | MCAVersionsGet | MCAConfigurationsGet | MCAConfigurationPut | MCAParameterGet |
                                 MCADatasetSpecificationGet | MCAGridGet | MCAProcess | MCATimeIntervalGet | MCASoftwareImageGet;
type ModelCatalogThunkResult = ThunkAction<void, RootState, undefined, ModelCatalogAction>;
