const BASE_ROUTE            = '/store';
const ORDER                 = '/orders';
const ORDER_PRODUCT         = '/order_products';
const VOUCHER               = '/vouchers';
const LOT                   = '/lots';
const ITEM                  = '/items';

const CF_ROUTINGS_STORE = {
    ORIGIN_APP: BASE_ROUTE,

    //================================STORE_ORDER=======================================//
    ORDERS                                  : `${BASE_ROUTE}${ORDER}`,
    ORDER_INSERT_FULL                       : `${BASE_ROUTE}${ORDER}/insert-full`,
    ORDER_GET_LIST_BY_PROPERTY              : `${BASE_ROUTE}${ORDER}/get-list-by-property`,
    ORDER_DOWNLOAD_TEMPLATE_EXCEL           : `${BASE_ROUTE}${ORDER}/download-template-excel`,
    ORDER_IMPORT_FROM_EXCEL                 : `${BASE_ROUTE}${ORDER}/import-from-excel`,
    ORDER_EXPORT_EXCEL                      : `${BASE_ROUTE}${ORDER}/export-excel`,

    //================================STORE_ORDER_PRODUCT=======================================//
    ORDER_PRODUCTS                          : `${BASE_ROUTE}${ORDER_PRODUCT}`,
    ORDER_PRODUCT_GET_AMOUNT_BY_PROPERTY    : `${BASE_ROUTE}${ORDER_PRODUCT}/get-amount-by-property`,
    ORDER_PRODUCT_GET_LIST_BY_PROPERTY      : `${BASE_ROUTE}${ORDER_PRODUCT}/get-list-by-property`,
    ORDER_PRODUCT_DOWNLOAD_TEMPLATE_EXCEL   : `${BASE_ROUTE}${ORDER_PRODUCT}/download-template-excel`,
    ORDER_PRODUCT_IMPORT_FROM_EXCEL         : `${BASE_ROUTE}${ORDER_PRODUCT}/import-from-excel`,
    ORDER_PRODUCT_EXPORT_EXCEL              : `${BASE_ROUTE}${ORDER_PRODUCT}/export-excel`,
    ORDER_PRODUCT_EXPORT_EXCEL_BY_FILTER    : `${BASE_ROUTE}${ORDER_PRODUCT}/export-excel-by-filter`,
    ORDER_PRODUCT_ANALYSE_PRIME_COST        : `${BASE_ROUTE}${ORDER_PRODUCT}/analyse-prime-cost`,

    //================================STORE_VOUCHER=======================================//
    VOUCHERS                                : `${BASE_ROUTE}${VOUCHER}`,
    VOUCHER_DOWNLOAD_TEMPLATE_EXCEL         : `${BASE_ROUTE}${VOUCHER}/download-template-excel`,
    VOUCHER_IMPORT_FROM_EXCEL               : `${BASE_ROUTE}${VOUCHER}/import-from-excel`,
    VOUCHER_EXPORT_EXCEL                    : `${BASE_ROUTE}${VOUCHER}/export-excel`,

    //================================STORE_LOT=======================================//
    LOT                                     : `${BASE_ROUTE}${LOT}`,
    LOT_DOWNLOAD_TEMPLATE_EXCEL             : `${BASE_ROUTE}${LOT}/download-template-excel`,
    LOT_IMPORT_FROM_EXCEL                   : `${BASE_ROUTE}${LOT}/import-from-excel`,
    LOT_EXPORT_EXCEL                        : `${BASE_ROUTE}${LOT}/export-excel`,

    //================================STORE_ITEM=======================================//
    ITEM                                    : `${BASE_ROUTE}${ITEM}`,
    ITEM_GET_LIST_BY_PROPERTY               : `${BASE_ROUTE}${ITEM}/get-list-by-property`,
    ITEM_DOWNLOAD_TEMPLATE_EXCEL            : `${BASE_ROUTE}${ITEM}/download-template-excel`,
    ITEM_IMPORT_FROM_EXCEL                  : `${BASE_ROUTE}${ITEM}/import-from-excel`,
    ITEM_EXPORT_EXCEL                       : `${BASE_ROUTE}${ITEM}/export-excel`,
}

exports.CF_ROUTINGS_STORE = CF_ROUTINGS_STORE;