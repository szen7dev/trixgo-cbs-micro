const BASE_ACTIONS = 'ACT_FNB';

/**
 * CASE_1, CASE_2 tương ứng trong phần AUTH SERVICE, có 2 coll: user, company
 */
const ORDER                      = 'ORDER';
const PRODUCT                    = 'PRODUCT';
const ORDER_PRODUCT              = 'ORDER_PRODUCT';
const SHIFT                      = 'SHIFT';
const MISTAKE                    = 'MISTAKE';
const QUOTA                      = 'QUOTA';
const ORDER_MATERIAL             = 'ORDER_MATERIAL';
const SHIFT_HANDOVER             = 'SHIFT_HANDOVER';
const GENERAL_BOOK               = 'GENERAL_BOOK';

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
   ORDER_RESET_ALL_DATA                            : `${BASE_ACTIONS}_${ORDER}_RESET_ALL_DATA`,

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
   SHIFT_REMOVE                                    : `${BASE_ACTIONS}_${SHIFT}_REMOVE`,
   SHIFT_GET_INFO_AND_GET_LIST                     : `${BASE_ACTIONS}_${SHIFT}_GET_INFO_AND_GET_LIST`,
   SHIFT_DOWNLOAD_TEMPLATE_EXCEL                   : `${BASE_ACTIONS}_${SHIFT}_DOWNLOAD_TEMPLATE_EXCEL`,
   SHIFT_IMPORT_FROM_EXCEL                         : `${BASE_ACTIONS}_${SHIFT}_IMPORT_FROM_EXCEL`,
   SHIFT_EXPORT_EXCEL                              : `${BASE_ACTIONS}_${SHIFT}_EXPORT_EXCEL`,

   /**
   * MISTAKE
   */
   MISTAKE_INSERT                                    : `${BASE_ACTIONS}_${MISTAKE}_INSERT`,
   MISTAKE_UPDATE                                    : `${BASE_ACTIONS}_${MISTAKE}_UPDATE`,
   MISTAKE_REMOVE                                    : `${BASE_ACTIONS}_${MISTAKE}_REMOVE`,
   MISTAKE_GET_INFO_AND_GET_LIST                     : `${BASE_ACTIONS}_${MISTAKE}_GET_INFO_AND_GET_LIST`,
   MISTAKE_GET_LIST_BY_PROPERTY                      : `${BASE_ACTIONS}_${MISTAKE}_GET_LIST_BY_PROPERTY`,
   MISTAKE_DOWNLOAD_TEMPLATE_EXCEL                   : `${BASE_ACTIONS}_${MISTAKE}_DOWNLOAD_TEMPLATE_EXCEL`,
   MISTAKE_IMPORT_FROM_EXCEL                         : `${BASE_ACTIONS}_${MISTAKE}_IMPORT_FROM_EXCEL`,
   MISTAKE_EXPORT_EXCEL                              : `${BASE_ACTIONS}_${MISTAKE}_EXPORT_EXCEL`,

   /**
   * QUOTA
   */
   QUOTA_INSERT                                    : `${BASE_ACTIONS}_${QUOTA}_INSERT`,
   QUOTA_UPDATE                                    : `${BASE_ACTIONS}_${QUOTA}_UPDATE`,
   QUOTA_REMOVE                                    : `${BASE_ACTIONS}_${QUOTA}_REMOVE`,
   QUOTA_GET_INFO_AND_GET_LIST                     : `${BASE_ACTIONS}_${QUOTA}_GET_INFO_AND_GET_LIST`,
   QUOTA_DOWNLOAD_TEMPLATE_EXCEL                   : `${BASE_ACTIONS}_${QUOTA}_DOWNLOAD_TEMPLATE_EXCEL`,
   QUOTA_IMPORT_FROM_EXCEL                         : `${BASE_ACTIONS}_${QUOTA}_IMPORT_FROM_EXCEL`,
   QUOTA_EXPORT_EXCEL                              : `${BASE_ACTIONS}_${QUOTA}_EXPORT_EXCEL`,

   /**
   * ORDER_MATERIAL
   */
   ORDER_MATERIAL_INSERT                                : `${BASE_ACTIONS}_${ORDER_MATERIAL}_INSERT`,
   ORDER_MATERIAL_UPDATE                                : `${BASE_ACTIONS}_${ORDER_MATERIAL}_UPDATE`,
   ORDER_MATERIAL_REMOVE                                : `${BASE_ACTIONS}_${ORDER_MATERIAL}_REMOVE`,
   ORDER_MATERIAL_GET_INFO_AND_GET_LIST                 : `${BASE_ACTIONS}_${ORDER_MATERIAL}_GET_INFO_AND_GET_LIST`,
   ORDER_MATERIAL_DOWNLOAD_TEMPLATE_EXCEL               : `${BASE_ACTIONS}_${ORDER_MATERIAL}_DOWNLOAD_TEMPLATE_EXCEL`,
   ORDER_MATERIAL_IMPORT_FROM_EXCEL                     : `${BASE_ACTIONS}_${ORDER_MATERIAL}_IMPORT_FROM_EXCEL`,
   ORDER_MATERIAL_EXPORT_EXCEL                          : `${BASE_ACTIONS}_${ORDER_MATERIAL}_EXPORT_EXCEL`,

   /**
   * SHIFT_HANDOVER
   */
   SHIFT_HANDOVER_INSERT                                    : `${BASE_ACTIONS}_${SHIFT_HANDOVER}_INSERT`,
   SHIFT_HANDOVER_UPDATE                                    : `${BASE_ACTIONS}_${SHIFT_HANDOVER}_UPDATE`,
   SHIFT_HANDOVER_REMOVE                                    : `${BASE_ACTIONS}_${SHIFT_HANDOVER}_REMOVE`,
   SHIFT_HANDOVER_GET_INFO_AND_GET_LIST                     : `${BASE_ACTIONS}_${SHIFT_HANDOVER}_GET_INFO_AND_GET_LIST`,
   SHIFT_HANDOVER_UPDATE_QUOTA                              : `${BASE_ACTIONS}_${SHIFT_HANDOVER}_UPDATE_QUOTA`,
   SHIFT_HANDOVER_DOWNLOAD_TEMPLATE_EXCEL                   : `${BASE_ACTIONS}_${SHIFT_HANDOVER}_DOWNLOAD_TEMPLATE_EXCEL`,
   SHIFT_HANDOVER_IMPORT_FROM_EXCEL                         : `${BASE_ACTIONS}_${SHIFT_HANDOVER}_IMPORT_FROM_EXCEL`,
   SHIFT_HANDOVER_EXPORT_EXCEL                              : `${BASE_ACTIONS}_${SHIFT_HANDOVER}_EXPORT_EXCEL`,

   /**
   * GENERAL_BOOK
   */
   GENERAL_BOOK_INSERT                                    : `${BASE_ACTIONS}_${GENERAL_BOOK}_INSERT`,
   GENERAL_BOOK_UPDATE                                    : `${BASE_ACTIONS}_${GENERAL_BOOK}_UPDATE`,
   GENERAL_BOOK_REMOVE                                    : `${BASE_ACTIONS}_${GENERAL_BOOK}_REMOVE`,
   GENERAL_BOOK_GET_INFO_AND_GET_LIST                     : `${BASE_ACTIONS}_${GENERAL_BOOK}_GET_INFO_AND_GET_LIST`,
   GENERAL_BOOK_GET_LIST_BY_PROPERTY                      : `${BASE_ACTIONS}_${GENERAL_BOOK}_GET_LIST_BY_PROPERTY`,
   GENERAL_BOOK_UPDATE_VALUE                              : `${BASE_ACTIONS}_${GENERAL_BOOK}_UPDATE_VALUE`,
   GENERAL_BOOK_DOWNLOAD_TEMPLATE_EXCEL                   : `${BASE_ACTIONS}_${GENERAL_BOOK}_DOWNLOAD_TEMPLATE_EXCEL`,
   GENERAL_BOOK_IMPORT_FROM_EXCEL                         : `${BASE_ACTIONS}_${GENERAL_BOOK}_IMPORT_FROM_EXCEL`,
   GENERAL_BOOK_EXPORT_EXCEL                              : `${BASE_ACTIONS}_${GENERAL_BOOK}_EXPORT_EXCEL`,
}

exports.CF_ACTIONS_FNB = CF_ACTIONS_FNB;