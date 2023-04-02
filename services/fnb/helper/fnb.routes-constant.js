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
const ORDER_MATERIAL        = '/order_materials';
const SHIFT_HANDOVER        = '/shift_handovers';
const GENERAL_BOOK          = '/general_books';
const VOUCHER               = '/vouchers';

const CF_ROUTINGS_FNB = {
    ORIGIN_APP: BASE_ROUTE,

    //================================FNB_ORDER=======================================//
    ORDERS                                  : `${BASE_ROUTE}${ORDER}`,
    ORDER_GET_LIST_BY_PROPERTY              : `${BASE_ROUTE}${ORDER}/get-list-by-property`,
    ORDER_UPDATE_VALUE                      : `${BASE_ROUTE}${ORDER}/update-value`,
    ORDER_DOWNLOAD_TEMPLATE_EXCEL           : `${BASE_ROUTE}${ORDER}/download-template-excel`,
    ORDER_IMPORT_FROM_EXCEL                 : `${BASE_ROUTE}${ORDER}/import-from-excel`,
    ORDER_EXPORT_EXCEL                      : `${BASE_ROUTE}${ORDER}/export-excel`,
    ORDER_EXPORT_EXCEL2                      : `${BASE_ROUTE}${ORDER}/export-excel2`,
    ORDER_EXPORT_EXCEL3                      : `${BASE_ROUTE}${ORDER}/export-excel3`,
    ORDER_RESET_ALL_DATA                    : `${BASE_ROUTE}${ORDER}/reset-all-data`,

    //================================FNB_PRODUCT=======================================//
    PRODUCTS                                : `${BASE_ROUTE}${PRODUCT}`,
    PRODUCT_DOWNLOAD_TEMPLATE_EXCEL         : `${BASE_ROUTE}${PRODUCT}/download-template-excel`,
    PRODUCT_IMPORT_FROM_EXCEL               : `${BASE_ROUTE}${PRODUCT}/import-from-excel`,
    PRODUCT_EXPORT_EXCEL                    : `${BASE_ROUTE}${PRODUCT}/export-excel`,

    //================================FNB_ORDER_PRODUCT=======================================//
    ORDER_PRODUCTS                          : `${BASE_ROUTE}${ORDER_PRODUCT}`,
    ORDER_PRODUCT_GET_LIST_BY_PROPERTY      : `${BASE_ROUTE}${ORDER_PRODUCT}/get-list-by-property`,
    ORDER_PRODUCT_DOWNLOAD_TEMPLATE_EXCEL   : `${BASE_ROUTE}${ORDER_PRODUCT}/download-template-excel`,
    ORDER_PRODUCT_IMPORT_FROM_EXCEL         : `${BASE_ROUTE}${ORDER_PRODUCT}/import-from-excel`,
    ORDER_PRODUCT_EXPORT_EXCEL              : `${BASE_ROUTE}${ORDER_PRODUCT}/export-excel`,

    //================================FNB_SHIFT=======================================//
    SHIFTS                                  : `${BASE_ROUTE}${SHIFT}`,
    SHIFT_UPDATE_SALARY                     : `${BASE_ROUTE}${SHIFT}/update-salary`,
    SHIFT_GET_LIST_BY_PROPERTY              : `${BASE_ROUTE}${SHIFT}/get-list-by-property`,
    SHIFT_DOWNLOAD_TEMPLATE_EXCEL           : `${BASE_ROUTE}${SHIFT}/download-template-excel`,
    SHIFT_IMPORT_FROM_EXCEL                 : `${BASE_ROUTE}${SHIFT}/import-from-excel`,
    SHIFT_EXPORT_EXCEL                      : `${BASE_ROUTE}${SHIFT}/export-excel`,
    SHIFT_EXPORT_EXCEL2                      : `${BASE_ROUTE}${SHIFT}/export-excel2`,

    //================================FNB_MISTAKE=======================================//
    MISTAKES                                : `${BASE_ROUTE}${MISTAKE}`,
    MISTAKE_UPDATE_KPI                      : `${BASE_ROUTE}${MISTAKE}/update-kpi`,
    MISTAKE_GET_LIST_BY_PROPERTY            : `${BASE_ROUTE}${MISTAKE}/get-list-by-property`,
    MISTAKE_DOWNLOAD_TEMPLATE_EXCEL         : `${BASE_ROUTE}${MISTAKE}/download-template-excel`,
    MISTAKE_IMPORT_FROM_EXCEL               : `${BASE_ROUTE}${MISTAKE}/import-from-excel`,
    MISTAKE_EXPORT_EXCEL                    : `${BASE_ROUTE}${MISTAKE}/export-excel`,

    //================================FNB_QUOTA=======================================//
    QUOTAS                                  : `${BASE_ROUTE}${QUOTA}`,
    QUOTA_DOWNLOAD_TEMPLATE_EXCEL           : `${BASE_ROUTE}${QUOTA}/download-template-excel`,
    QUOTA_IMPORT_FROM_EXCEL                 : `${BASE_ROUTE}${QUOTA}/import-from-excel`,
    QUOTA_EXPORT_EXCEL                      : `${BASE_ROUTE}${QUOTA}/export-excel`,

    //================================FNB_ORDER_MATERIAL=======================================//
    ORDER_MATERIALS                         : `${BASE_ROUTE}${ORDER_MATERIAL}`,
    ORDER_MATERIAL_DOWNLOAD_TEMPLATE_EXCEL  : `${BASE_ROUTE}${ORDER_MATERIAL}/download-template-excel`,
    ORDER_MATERIAL_IMPORT_FROM_EXCEL        : `${BASE_ROUTE}${ORDER_MATERIAL}/import-from-excel`,
    ORDER_MATERIAL_EXPORT_EXCEL             : `${BASE_ROUTE}${ORDER_MATERIAL}/export-excel`,

    //================================FNB_SHIFT_HANDOVERL=======================================//
    SHIFT_HANDOVERS                         : `${BASE_ROUTE}${SHIFT_HANDOVER}`,
    SHIFT_HANDOVER_UPDATE_QUOTA             : `${BASE_ROUTE}${SHIFT_HANDOVER}/update-quota`,
    SHIFT_HANDOVER_DOWNLOAD_TEMPLATE_EXCEL  : `${BASE_ROUTE}${SHIFT_HANDOVER}/download-template-excel`,
    SHIFT_HANDOVER_IMPORT_FROM_EXCEL        : `${BASE_ROUTE}${SHIFT_HANDOVER}/import-from-excel`,
    SHIFT_HANDOVER_EXPORT_EXCEL             : `${BASE_ROUTE}${SHIFT_HANDOVER}/export-excel`,

    //================================FNB_GENERAL_BOOK=======================================//
    GENERAL_BOOKS                           : `${BASE_ROUTE}${GENERAL_BOOK}`,
    GENERAL_BOOK_GET_LIST_BY_PROPERTY       : `${BASE_ROUTE}${GENERAL_BOOK}/get-list-by-property`,
    GENERAL_BOOK_DOWNLOAD_TEMPLATE_EXCEL    : `${BASE_ROUTE}${GENERAL_BOOK}/download-template-excel`,
    GENERAL_BOOK_IMPORT_FROM_EXCEL          : `${BASE_ROUTE}${GENERAL_BOOK}/import-from-excel`,
    GENERAL_BOOK_EXPORT_EXCEL               : `${BASE_ROUTE}${GENERAL_BOOK}/export-excel`,

    //================================FNB_VOUCHER=======================================//
    VOUCHERS                                : `${BASE_ROUTE}${VOUCHER}`,
    VOUCHER_DOWNLOAD_TEMPLATE_EXCEL         : `${BASE_ROUTE}${VOUCHER}/download-template-excel`,
    VOUCHER_IMPORT_FROM_EXCEL               : `${BASE_ROUTE}${VOUCHER}/import-from-excel`,
    VOUCHER_EXPORT_EXCEL                    : `${BASE_ROUTE}${VOUCHER}/export-excel`,
}

exports.CF_ROUTINGS_FNB = CF_ROUTINGS_FNB;