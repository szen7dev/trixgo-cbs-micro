const BASE_ROUTE = '/datahub';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const DATAHUB_CONTACT                   = '/datahub_contacts';
const DATAHUB_TYPE                      = '/datahub_types';
const DATAHUB_PROJECT                   = '/datahub_projects';
const DATAHUB_PACKAGES                  = '/datahub_packages';
const DATAHUB_FINREPORT                 = '/datahub_finreports';
const DATAHUB_CONTRACTOR                = '/datahub_contractors';
const DATAHUB_PROFILE                   = '/datahub_profiles';
const DATAHUB_INSPECTION_DOC            = '/datahub_inspection_docs';
const DATAHUB_INSPECTION_CHECKLIST      = '/datahub_inspection_checklists';

const CF_ROUTINGS_DATAHUB = {
    ORIGIN_APP: BASE_ROUTE,

    DATAHUB_CONTACT             : `${BASE_ROUTE}${DATAHUB_CONTACT}`, 
    DATAHUB_TYPE                : `${BASE_ROUTE}${DATAHUB_TYPE}`, 
    DATAHUB_PROJECT             : `${BASE_ROUTE}${DATAHUB_PROJECT}`, 
    DATAHUB_PACKAGE             : `${BASE_ROUTE}${DATAHUB_PACKAGES}`, 
    DATAHUB_FINREPORT           : `${BASE_ROUTE}${DATAHUB_FINREPORT}`, 
    DATAHUB_CONTRACTOR          : `${BASE_ROUTE}${DATAHUB_CONTRACTOR}`, 
    DATAHUB_PROFILE             : `${BASE_ROUTE}${DATAHUB_PROFILE}`, 
    DATAHUB_INSPECTION_DOC      : `${BASE_ROUTE}${DATAHUB_INSPECTION_DOC}`, 
    DATAHUB_INSPECTION_CHECKLIST: `${BASE_ROUTE}${DATAHUB_INSPECTION_CHECKLIST}`, 
}

exports.CF_ROUTINGS_DATAHUB = CF_ROUTINGS_DATAHUB;