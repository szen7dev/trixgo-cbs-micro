const BASE_ROUTE = '/item';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const DEPARTMENT = '/departments';
const CONTRACT   = '/contracts';
const DOCTYPE    = '/doctypes';
const CONTACT    = '/contacts';
const WAREHOUSE  = '/warehouses';
const AREA       = '/areas';
const POSITION   = '/positions';
const STORAGE    = '/storages';
const ACCOUNT    = '/_accounts';


const CF_ROUTINGS_ITEM = {
    ORIGIN_APP: BASE_ROUTE,
    
    // ================================DEPARTMENT=======================================//
    DEPARTMENTS                                : `${BASE_ROUTE}${DEPARTMENT}`,
    DEPARTMENTS_ANALYSIS_ONTIME_ONBUDGET       : `${BASE_ROUTE}${DEPARTMENT}/analysis`,

    // ================================CONTRACT=======================================//
    CONTRACTS                                  : `${BASE_ROUTE}${CONTRACT}`,
    
    // ================================DOCTYPE=======================================//
    DOCTYPES                                   : `${BASE_ROUTE}${DOCTYPE}`,

    // ================================CONTACT=======================================//
    CONTACTS                                   : `${BASE_ROUTE}${CONTACT}`,

    // ================================WAREHOUSE=======================================//
    WAREHOUSES                                 : `${BASE_ROUTE}${WAREHOUSE}`,

    // ================================AREA=======================================//
    AREA                                       : `${BASE_ROUTE}${AREA}`,

    // ================================POSITION=======================================//
    POSITION                                   : `${BASE_ROUTE}${POSITION}`,

    // ================================STORAGE=======================================//
    STORAGE                                    : `${BASE_ROUTE}${STORAGE}`,

    // ================================STORAGE=======================================//
    ACCOUNT_SEARCH_WITH_KEY                    : `${BASE_ROUTE}${ACCOUNT}`,
}

exports.CF_ROUTINGS_ITEM = CF_ROUTINGS_ITEM;
