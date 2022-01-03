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

const CF_ROUTINGS_ITEM = {
    ORIGIN_APP: BASE_ROUTE,
    
    // ================================DEPARTMENT=======================================//
    DEPARTMENTS                                : `${BASE_ROUTE}${DEPARTMENT}`,

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
}

exports.CF_ROUTINGS_ITEM = CF_ROUTINGS_ITEM;
