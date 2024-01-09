const BASE_ACTIONS = 'ACT_FNB';

/**
 * CASE_1, CASE_2 tương ứng trong phần AUTH SERVICE, có 2 coll: user, company
 */
const ORDER                      = 'ORDER';
const PRODUCT                    = 'PRODUCT';
const ORDER_PRODUCT              = 'ORDER_PRODUCT';
const SHIFT                      = 'SHIFT';
const MISTAKE                    = 'MISTAKE';
const VOUCHER                    = 'VOUCHER';
const ZALOOA                     = 'ZALOOA';

const CF_ACTIONS_FNB = {
  
   /**
   * ORDER
   */
   ORDER_INSERT                                    : `${BASE_ACTIONS}_${ORDER}_INSERT`,
   ORDER_UPDATE                                    : `${BASE_ACTIONS}_${ORDER}_UPDATE`,
   ORDER_REMOVE                                    : `${BASE_ACTIONS}_${ORDER}_REMOVE`,
   ORDER_GET_INFO_AND_GET_LIST                     : `${BASE_ACTIONS}_${ORDER}_GET_INFO_AND_GET_LIST`,
   ORDER_GET_LIST_BY_PROPERTY                      : `${BASE_ACTIONS}_${ORDER}_GET_LIST_BY_PROPERTY`,
   ORDER_UPDATE_VALUE                              : `${BASE_ACTIONS}_${ORDER}_UPDATE_VALUE`,
   ORDER_DOWNLOAD_TEMPLATE_EXCEL                   : `${BASE_ACTIONS}_${ORDER}_DOWNLOAD_TEMPLATE_EXCEL`,
   ORDER_IMPORT_FROM_EXCEL                         : `${BASE_ACTIONS}_${ORDER}_IMPORT_FROM_EXCEL`,
   ORDER_EXPORT_EXCEL                              : `${BASE_ACTIONS}_${ORDER}_EXPORT_EXCEL`,
   ORDER_EXPORT_EXCEL2                             : `${BASE_ACTIONS}_${ORDER}_EXPORT_EXCEL2`,
   ORDER_EXPORT_EXCEL3                             : `${BASE_ACTIONS}_${ORDER}_EXPORT_EXCEL3`,
   ORDER_RESET_ALL_DATA                            : `${BASE_ACTIONS}_${ORDER}_RESET_ALL_DATA`,
   ORDER_CONVERT_ALL_DATA                          : `${BASE_ACTIONS}_${ORDER}_CONVERT_ALL_DATA`,

   /**
   * PRODUCT
   */
   PRODUCT_INSERT                                    : `${BASE_ACTIONS}_${PRODUCT}_INSERT`,
   PRODUCT_UPDATE                                    : `${BASE_ACTIONS}_${PRODUCT}_UPDATE`,
   PRODUCT_REMOVE                                    : `${BASE_ACTIONS}_${PRODUCT}_REMOVE`,
   PRODUCT_GET_INFO_AND_GET_LIST                     : `${BASE_ACTIONS}_${PRODUCT}_GET_INFO_AND_GET_LIST`,
   PRODUCT_DOWNLOAD_TEMPLATE_EXCEL                   : `${BASE_ACTIONS}_${PRODUCT}_DOWNLOAD_TEMPLATE_EXCEL`,
   PRODUCT_IMPORT_FROM_EXCEL                         : `${BASE_ACTIONS}_${PRODUCT}_IMPORT_FROM_EXCEL`,
   PRODUCT_EXPORT_EXCEL                              : `${BASE_ACTIONS}_${PRODUCT}_EXPORT_EXCEL`,

   /**
   * ORDER_PRODUCT
   */
   ORDER_PRODUCT_INSERT                            : `${BASE_ACTIONS}_${ORDER_PRODUCT}_INSERT`,
   ORDER_PRODUCT_UPDATE                            : `${BASE_ACTIONS}_${ORDER_PRODUCT}_UPDATE`,
   ORDER_PRODUCT_REMOVE                            : `${BASE_ACTIONS}_${ORDER_PRODUCT}_REMOVE`,
   ORDER_PRODUCT_GET_INFO_AND_GET_LIST             : `${BASE_ACTIONS}_${ORDER_PRODUCT}_GET_INFO_AND_GET_LIST`,
   ORDER_PRODUCT_GET_LIST_BY_PROPERTY              : `${BASE_ACTIONS}_${ORDER_PRODUCT}_GET_LIST_BY_PROPERTY`,
   ORDER_PRODUCT_DOWNLOAD_TEMPLATE_EXCEL           : `${BASE_ACTIONS}_${ORDER_PRODUCT}_DOWNLOAD_TEMPLATE_EXCEL`,
   ORDER_PRODUCT_IMPORT_FROM_EXCEL                 : `${BASE_ACTIONS}_${ORDER_PRODUCT}_IMPORT_FROM_EXCEL`,
   ORDER_PRODUCT_EXPORT_EXCEL                      : `${BASE_ACTIONS}_${ORDER_PRODUCT}_EXPORT_EXCEL`,

   /**
   * SHIFT
   */
   SHIFT_INSERT                                    : `${BASE_ACTIONS}_${SHIFT}_INSERT`,
   SHIFT_UPDATE                                    : `${BASE_ACTIONS}_${SHIFT}_UPDATE`,
   SHIFT_UPDATE_SALARY                             : `${BASE_ACTIONS}_${SHIFT}_UPDATE_SALARY`,
   SHIFT_REMOVE                                    : `${BASE_ACTIONS}_${SHIFT}_REMOVE`,
   SHIFT_GET_INFO_AND_GET_LIST                     : `${BASE_ACTIONS}_${SHIFT}_GET_INFO_AND_GET_LIST`,
   SHIFT_GET_LIST_BY_PROPERTY                      : `${BASE_ACTIONS}_${SHIFT}_GET_LIST_BY_PROPERTY`,
   SHIFT_DOWNLOAD_TEMPLATE_EXCEL                   : `${BASE_ACTIONS}_${SHIFT}_DOWNLOAD_TEMPLATE_EXCEL`,
   SHIFT_IMPORT_FROM_EXCEL                         : `${BASE_ACTIONS}_${SHIFT}_IMPORT_FROM_EXCEL`,
   SHIFT_EXPORT_EXCEL                              : `${BASE_ACTIONS}_${SHIFT}_EXPORT_EXCEL`,
   SHIFT_EXPORT_EXCEL2                             : `${BASE_ACTIONS}_${SHIFT}_EXPORT_EXCEL2`,

   /**
   * MISTAKE
   */
   MISTAKE_INSERT                                    : `${BASE_ACTIONS}_${MISTAKE}_INSERT`,
   MISTAKE_UPDATE                                    : `${BASE_ACTIONS}_${MISTAKE}_UPDATE`,
   MISTAKE_UPDATE_KPI                                : `${BASE_ACTIONS}_${MISTAKE}_UPDATE_KPI`,
   MISTAKE_REMOVE                                    : `${BASE_ACTIONS}_${MISTAKE}_REMOVE`,
   MISTAKE_GET_INFO_AND_GET_LIST                     : `${BASE_ACTIONS}_${MISTAKE}_GET_INFO_AND_GET_LIST`,
   MISTAKE_GET_LIST_BY_PROPERTY                      : `${BASE_ACTIONS}_${MISTAKE}_GET_LIST_BY_PROPERTY`,
   MISTAKE_DOWNLOAD_TEMPLATE_EXCEL                   : `${BASE_ACTIONS}_${MISTAKE}_DOWNLOAD_TEMPLATE_EXCEL`,
   MISTAKE_IMPORT_FROM_EXCEL                         : `${BASE_ACTIONS}_${MISTAKE}_IMPORT_FROM_EXCEL`,
   MISTAKE_EXPORT_EXCEL                              : `${BASE_ACTIONS}_${MISTAKE}_EXPORT_EXCEL`,

   /**
   * VOUCHER
   */
   VOUCHER_INSERT                                    : `${BASE_ACTIONS}_${VOUCHER}_INSERT`,
   VOUCHER_UPDATE                                    : `${BASE_ACTIONS}_${VOUCHER}_UPDATE`,
   VOUCHER_REMOVE                                    : `${BASE_ACTIONS}_${VOUCHER}_REMOVE`,
   VOUCHER_GET_INFO_AND_GET_LIST                     : `${BASE_ACTIONS}_${VOUCHER}_GET_INFO_AND_GET_LIST`,
   VOUCHER_DOWNLOAD_TEMPLATE_EXCEL                   : `${BASE_ACTIONS}_${VOUCHER}_DOWNLOAD_TEMPLATE_EXCEL`,
   VOUCHER_IMPORT_FROM_EXCEL                         : `${BASE_ACTIONS}_${VOUCHER}_IMPORT_FROM_EXCEL`,
   VOUCHER_EXPORT_EXCEL                              : `${BASE_ACTIONS}_${VOUCHER}_EXPORT_EXCEL`,

   /**
   * ZALOOA
   */
   ZALOOA_INSERT                                    : `${BASE_ACTIONS}_${ZALOOA}_INSERT`,
   ZALOOA_UPDATE                                    : `${BASE_ACTIONS}_${ZALOOA}_UPDATE`,
   ZALOOA_REMOVE                                    : `${BASE_ACTIONS}_${ZALOOA}_REMOVE`,
   ZALOOA_GET_INFO_AND_GET_LIST                     : `${BASE_ACTIONS}_${ZALOOA}_GET_INFO_AND_GET_LIST`,
   ZALOOA_DOWNLOAD_TEMPLATE_EXCEL                   : `${BASE_ACTIONS}_${ZALOOA}_DOWNLOAD_TEMPLATE_EXCEL`,
   ZALOOA_IMPORT_FROM_EXCEL                         : `${BASE_ACTIONS}_${ZALOOA}_IMPORT_FROM_EXCEL`,
   ZALOOA_EXPORT_EXCEL                              : `${BASE_ACTIONS}_${ZALOOA}_EXPORT_EXCEL`,
}

exports.CF_ACTIONS_FNB = CF_ACTIONS_FNB;