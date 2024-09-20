const BASE_ROUTE = '/store';
const ORDER                 = '/orders';
const ORDER_PRODUCT         = '/order_products';

const CF_ROUTINGS_STORE = {
    ORIGIN_APP: BASE_ROUTE,

    //================================FNB_ORDER=======================================//
    ORDERS                                  : `${BASE_ROUTE}${ORDER}`,
    ORDER_GET_LIST_BY_PROPERTY              : `${BASE_ROUTE}${ORDER}/get-list-by-property`,
    ORDER_DOWNLOAD_TEMPLATE_EXCEL           : `${BASE_ROUTE}${ORDER}/download-template-excel`,
    ORDER_IMPORT_FROM_EXCEL                 : `${BASE_ROUTE}${ORDER}/import-from-excel`,
    ORDER_EXPORT_EXCEL                      : `${BASE_ROUTE}${ORDER}/export-excel`,

    //================================FNB_ORDER_PRODUCT=======================================//
    ORDER_PRODUCTS                          : `${BASE_ROUTE}${ORDER_PRODUCT}`,
    ORDER_PRODUCT_GET_AMOUNT_BY_PROPERTY    : `${BASE_ROUTE}${ORDER_PRODUCT}/get-amount-by-property`,
    ORDER_PRODUCT_GET_LIST_BY_PROPERTY      : `${BASE_ROUTE}${ORDER_PRODUCT}/get-list-by-property`,
    ORDER_PRODUCT_DOWNLOAD_TEMPLATE_EXCEL   : `${BASE_ROUTE}${ORDER_PRODUCT}/download-template-excel`,
    ORDER_PRODUCT_IMPORT_FROM_EXCEL         : `${BASE_ROUTE}${ORDER_PRODUCT}/import-from-excel`,
    ORDER_PRODUCT_EXPORT_EXCEL              : `${BASE_ROUTE}${ORDER_PRODUCT}/export-excel`,
}

exports.CF_ROUTINGS_STORE = CF_ROUTINGS_STORE;
