const BASE_ROUTE = '/fnb';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */

const ORDER                 = '/orders';
const PRODUCT               = '/products';
const ORDER_PRODUCT         = '/order_products';
const SHIFT                 = '/shifts';
const MISTAKE               = '/mistakes';
const QUOTA                 = '/quotas';
const ORDER_MATERIAL        = '/materials';

const CF_ROUTINGS_FNB = {
    ORIGIN_APP: BASE_ROUTE,

    //================================FNB_ORDER=======================================//
    ORDERS                              : `${BASE_ROUTE}${ORDER}`,
    ORDER_GET_LIST_BY_PROPERTY          : `${BASE_ROUTE}${ORDER}/get-list-by-property`,
    ORDER_UPDATE_VALUE                  : `${BASE_ROUTE}${ORDER}/update-value`,

    //================================FNB_PRODUCT=======================================//
    PRODUCTS                            : `${BASE_ROUTE}${PRODUCT}`,

    //================================FNB_ORDER_PRODUCT=======================================//
    ORDER_PRODUCTS                      : `${BASE_ROUTE}${ORDER_PRODUCT}`,

    //================================FNB_SHIFT=======================================//
    SHIFTS                              : `${BASE_ROUTE}${SHIFT}`,

    //================================FNB_MISTAKE=======================================//
    MISTAKES                            : `${BASE_ROUTE}${MISTAKE}`,

    //================================FNB_QUOTA=======================================//
    QUOTAS                              : `${BASE_ROUTE}${QUOTA}`,

    //================================FNB_ORDER_MATERIAL=======================================//
    ORDER_MATERIALS                     : `${BASE_ROUTE}${ORDER_MATERIAL}`,
}

exports.CF_ROUTINGS_FNB = CF_ROUTINGS_FNB;