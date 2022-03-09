const BASE_ROUTE = '/datahub';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const DATAHUB_TYPE     = '/datahub_types';
const DATAHUB_PROJECT  = '/datahub_projects';
const DATAHUB_PACKAGES = '/datahub_packages';
const DATAHUB_FINREPORT  = '/datahub_finreports';
const DATAHUB_CONTRACTOR = '/datahub_contractors';
const DATAHUB_PROFILE    = '/datahub_profiles';

const CF_ROUTINGS_DATAHUB = {
    ORIGIN_APP: BASE_ROUTE,

    DATAHUB_TYPE         : `${BASE_ROUTE}${DATAHUB_TYPE}`, 
    DATAHUB_PROJECT      : `${BASE_ROUTE}${DATAHUB_PROJECT}`, 
    DATAHUB_PACKAGE      : `${BASE_ROUTE}${DATAHUB_PACKAGES}`, 
    DATAHUB_FINREPORT    : `${BASE_ROUTE}${DATAHUB_FINREPORT}`, 
    DATAHUB_CONTRACTOR   : `${BASE_ROUTE}${DATAHUB_CONTRACTOR}`, 
    DATAHUB_PROFILE      : `${BASE_ROUTE}${DATAHUB_PROFILE}`, 
}

exports.CF_ROUTINGS_DATAHUB = CF_ROUTINGS_DATAHUB;