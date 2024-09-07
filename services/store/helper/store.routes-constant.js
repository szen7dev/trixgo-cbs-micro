const BASE_ROUTE = '/store';
const ORDER                 = '/orders';
const ORDER_PRODUCT         = '/order_products';

const CF_ROUTINGS_STORE = {
    ORIGIN_APP: BASE_ROUTE,

    //================================FNB_ORDER=======================================//
    ORDERS                                  : `${BASE_ROUTE}${ORDER}`,
    ORDERS_KY_SU_HIEP                       : `${BASE_ROUTE}${ORDER}/kysuhiep`,
    ORDER_GET_LIST_BY_PROPERTY              : `${BASE_ROUTE}${ORDER}/get-list-by-property`,
    ORDER_UPDATE_VALUE                      : `${BASE_ROUTE}${ORDER}/update-value`,
    ORDER_DOWNLOAD_TEMPLATE_EXCEL           : `${BASE_ROUTE}${ORDER}/download-template-excel`,
    ORDER_IMPORT_FROM_EXCEL                 : `${BASE_ROUTE}${ORDER}/import-from-excel`,
    ORDER_EXPORT_EXCEL                      : `${BASE_ROUTE}${ORDER}/export-excel`,
    ORDER_EXPORT_EXCEL2                     : `${BASE_ROUTE}${ORDER}/export-excel2`,
    ORDER_EXPORT_EXCEL3                     : `${BASE_ROUTE}${ORDER}/export-excel3`,
    ORDER_RESET_ALL_DATA                    : `${BASE_ROUTE}${ORDER}/reset-all-data`,
    ORDER_CONVERT_ALL_DATA                  : `${BASE_ROUTE}${ORDER}/convert-all-data`,

    //================================FNB_ORDER_PRODUCT=======================================//
    ORDER_PRODUCTS                          : `${BASE_ROUTE}${ORDER_PRODUCT}`,
    ORDER_PRODUCT_GET_LIST_BY_PROPERTY      : `${BASE_ROUTE}${ORDER_PRODUCT}/get-list-by-property`,
    ORDER_PRODUCT_DOWNLOAD_TEMPLATE_EXCEL   : `${BASE_ROUTE}${ORDER_PRODUCT}/download-template-excel`,
    ORDER_PRODUCT_IMPORT_FROM_EXCEL         : `${BASE_ROUTE}${ORDER_PRODUCT}/import-from-excel`,
    ORDER_PRODUCT_EXPORT_EXCEL              : `${BASE_ROUTE}${ORDER_PRODUCT}/export-excel`,
}

exports.CF_ROUTINGS_STORE = CF_ROUTINGS_STORE;
