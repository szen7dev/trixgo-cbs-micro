const BASE_ROUTE = '/item';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const DEPARTMENT = '/departments';
const CONTRACT   = '/contracts';

const CF_ROUTINGS_ITEM = {
    ORIGIN_APP: BASE_ROUTE,

    // ================================DEPARTMENT=======================================//
    DEPARTMENT_GET_LIST                                : `${BASE_ROUTE}${DEPARTMENT}`, // /item/departments

    // ================================CONTRACT=======================================//
    CONTRACT_GET_LIST                                  : `${BASE_ROUTE}${CONTRACT}`, // /item/contracts
}

exports.CF_ROUTINGS_ITEM = CF_ROUTINGS_ITEM;