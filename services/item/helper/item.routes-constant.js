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
const ACCOUNT    = '/accounts';
const GOODS      = '/goods';
const FUNDA      = '/fundas';
const SIGNATURE  = '/signatures';

const CF_ROUTINGS_ITEM = {
    ORIGIN_APP: BASE_ROUTE,
    
    // ================================DEPARTMENT=======================================//
    DEPARTMENTS                                : `${BASE_ROUTE}${DEPARTMENT}`,
    LIST_DEPARTMENT_IS_MEMBERS                : `${BASE_ROUTE}/list-department-is-members`,
    DEPARTMENTS_ANALYSIS_ONTIME_ONBUDGET       : `${BASE_ROUTE}${DEPARTMENT}/analysis`,

    // ================================CONTRACT=========================================//
    CONTRACTS                                  : `${BASE_ROUTE}${CONTRACT}`,
    LIST_CONTRACT_IS_MEMBERS                   : `${BASE_ROUTE}/list-contract-is-members`,
    CONTRACT_GET_AMOUNT_BY_MONTH               : `${BASE_ROUTE}${CONTRACT}/get-amount-by-month`,
    CONTRACT_GET_LIST_BY_MONTH                 : `${BASE_ROUTE}${CONTRACT}/get-list-by-month`,
    CONTRACT_UPDATE_VALUE                      : `${BASE_ROUTE}${CONTRACT}/update-value`,

    // ================================DOCTYPE==========================================//
    DOCTYPES                                   : `${BASE_ROUTE}${DOCTYPE}`,

    // ================================CONTACT==========================================//
    CONTACTS                                   : `${BASE_ROUTE}${CONTACT}`,
    CONTACTS_GET_LIST_OF_SYSTEM                : `${BASE_ROUTE}${CONTACT}/contact-of-system`,

    // ================================WAREHOUSE=======================================//
    WAREHOUSES                                 : `${BASE_ROUTE}${WAREHOUSE}`,

    // ================================AREA============================================//
    AREA                                       : `${BASE_ROUTE}${AREA}`,

    // ================================POSITION========================================//
    POSITION                                   : `${BASE_ROUTE}${POSITION}`,

    // ================================STORAGE=========================================//
    STORAGE                                    : `${BASE_ROUTE}${STORAGE}`,

    // ================================ACCOUNT=========================================//
    ACCOUNT                                    : `${BASE_ROUTE}${ACCOUNT}`,

    // ================================GOOD============================================//
    GOODS                                      : `${BASE_ROUTE}${GOODS}`,

    // ================================FUNDA===========================================//
    FUNDA                                      : `${BASE_ROUTE}${FUNDA}`,

    // ================================SIGNATURE===========================================//
    SIGNATURE                                  : `${BASE_ROUTE}${SIGNATURE}`,
}

exports.CF_ROUTINGS_ITEM = CF_ROUTINGS_ITEM;
