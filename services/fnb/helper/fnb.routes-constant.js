const BASE_ROUTE = '/fnb';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */

const ORDER                 = '/orders';
const PRODUCT               = '/products';
const SHIFT                 = '/shifts';

const CF_ROUTINGS_FNB = {
    ORIGIN_APP: BASE_ROUTE,

    //================================FNB_ORDER=======================================//
    ORDERS                              : `${BASE_ROUTE}${ORDER}`,
    ORDER_GET_LIST_BY_PROPERTY          : `${BASE_ROUTE}${ORDER}/get-list-by-property`,

    //================================FNB_PRODUCT=======================================//
    PRODUCTS                            : `${BASE_ROUTE}${PRODUCT}`,

    //================================FNB_SHIFT=======================================//
    SHIFTS                              : `${BASE_ROUTE}${SHIFT}`,
    
}

exports.CF_ROUTINGS_FNB = CF_ROUTINGS_FNB;