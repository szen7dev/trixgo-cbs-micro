const BASE_ROUTE = '/datahub';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const DATAHUB_TYPE     = '/datahub_types';
const DATAHUB_PROJECT  = '/datahub_projects';

const CF_ROUTINGS_DATAHUB = {
    ORIGIN_APP: BASE_ROUTE,

    DATAHUB_TYPE         : `${BASE_ROUTE}${DATAHUB_TYPE}`, 
    DATAHUB_PROJECT      : `${BASE_ROUTE}${DATAHUB_PROJECT}`, 
}

exports.CF_ROUTINGS_DATAHUB = CF_ROUTINGS_DATAHUB;