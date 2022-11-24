const BASE_ROUTE = '/fnb';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */

const ORDER                 = '/orders';
const PRODUCT               = '/products';

const CF_ROUTINGS_FNB = {
    ORIGIN_APP: BASE_ROUTE,

    // ================================FNB_ORDER=======================================//
    ORDERS                             : `${BASE_ROUTE}${ORDER}`,

    // ================================FNB_PRODUCT=======================================//
    PRODUCTS                            : `${BASE_ROUTE}${PRODUCT}`,
    
}

exports.CF_ROUTINGS_FNB = CF_ROUTINGS_FNB;