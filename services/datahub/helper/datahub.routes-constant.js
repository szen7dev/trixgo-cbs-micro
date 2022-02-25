const BASE_ROUTE = '/datahub';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const DATAHUB_TYPE     = '/datahub_types';

const CF_ROUTINGS_DATAHUB = {
    ORIGIN_APP: BASE_ROUTE,

    //__________DATAHUB_TYPE
    DATAHUB_TYPE         : `${BASE_ROUTE}${DATAHUB_TYPE}`, 
}

exports.CF_ROUTINGS_DATAHUB = CF_ROUTINGS_DATAHUB;