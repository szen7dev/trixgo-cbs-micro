const BASE_ACTIONS               = 'ACT_STORE';

const ORDER                      = 'ORDER';
const ORDER_PRODUCT              = 'ORDER_PRODUCT';
const VOUCHER                    = 'VOUCHER';
const LOT                        = 'LOT';
const ITEM                       = 'ITEM';

const CF_ACTIONS_STORE= {

   /**
   * ORDER
   */
   ORDER_INSERT                                    : `${BASE_ACTIONS}_${ORDER}_INSERT`,
   ORDER_UPDATE                                    : `${BASE_ACTIONS}_${ORDER}_UPDATE`,
   ORDER_REMOVE                                    : `${BASE_ACTIONS}_${ORDER}_REMOVE`,
   ORDER_INSERT_FULL                               : `${BASE_ACTIONS}_${ORDER}_INSERT_FULL`,
   ORDER_GET_INFO_AND_GET_LIST                     : `${BASE_ACTIONS}_${ORDER}_GET_INFO_AND_GET_LIST`,
   ORDER_GET_LIST_BY_PROPERTY                      : `${BASE_ACTIONS}_${ORDER}_GET_LIST_BY_PROPERTY`,
   ORDER_DOWNLOAD_TEMPLATE_EXCEL                   : `${BASE_ACTIONS}_${ORDER}_DOWNLOAD_TEMPLATE_EXCEL`,
   ORDER_IMPORT_FROM_EXCEL                         : `${BASE_ACTIONS}_${ORDER}_IMPORT_FROM_EXCEL`,
   ORDER_EXPORT_EXCEL                              : `${BASE_ACTIONS}_${ORDER}_EXPORT_EXCEL`,

   /**
   * ORDER_PRODUCT
   */
   ORDER_PRODUCT_INSERT                            : `${BASE_ACTIONS}_${ORDER_PRODUCT}_INSERT`,
   ORDER_PRODUCT_UPDATE                            : `${BASE_ACTIONS}_${ORDER_PRODUCT}_UPDATE`,
   ORDER_PRODUCT_REMOVE                            : `${BASE_ACTIONS}_${ORDER_PRODUCT}_REMOVE`,
   ORDER_PRODUCT_GET_INFO_AND_GET_LIST             : `${BASE_ACTIONS}_${ORDER_PRODUCT}_GET_INFO_AND_GET_LIST`,
   ORDER_PRODUCT_GET_AMOUNT_BY_PROPERTY            : `${BASE_ACTIONS}_${ORDER_PRODUCT}_GET_AMOUNT_BY_PROPERTY`,
   ORDER_PRODUCT_GET_LIST_BY_PROPERTY              : `${BASE_ACTIONS}_${ORDER_PRODUCT}_GET_LIST_BY_PROPERTY`,
   ORDER_PRODUCT_DOWNLOAD_TEMPLATE_EXCEL           : `${BASE_ACTIONS}_${ORDER_PRODUCT}_DOWNLOAD_TEMPLATE_EXCEL`,
   ORDER_PRODUCT_IMPORT_FROM_EXCEL                 : `${BASE_ACTIONS}_${ORDER_PRODUCT}_IMPORT_FROM_EXCEL`,
   ORDER_PRODUCT_EXPORT_EXCEL                      : `${BASE_ACTIONS}_${ORDER_PRODUCT}_EXPORT_EXCEL`,
   ORDER_PRODUCT_EXPORT_EXCEL_BY_FILTER            : `${BASE_ACTIONS}_${ORDER_PRODUCT}_EXPORT_EXCEL_BY_FILTER`,
   ORDER_PRODUCT_ANALYSE_PRIME_COST                : `${BASE_ACTIONS}_${ORDER_PRODUCT}_ANALYSE_PRIME_COST`,

   /**
   * VOUCHER
   */
   VOUCHER_INSERT                                  : `${BASE_ACTIONS}_${VOUCHER}_INSERT`,
   VOUCHER_UPDATE                                  : `${BASE_ACTIONS}_${VOUCHER}_UPDATE`,
   VOUCHER_REMOVE                                  : `${BASE_ACTIONS}_${VOUCHER}_REMOVE`,
   VOUCHER_GET_INFO_AND_GET_LIST                   : `${BASE_ACTIONS}_${VOUCHER}_GET_INFO_AND_GET_LIST`,
   VOUCHER_DOWNLOAD_TEMPLATE_EXCEL                 : `${BASE_ACTIONS}_${VOUCHER}_DOWNLOAD_TEMPLATE_EXCEL`,
   VOUCHER_IMPORT_FROM_EXCEL                       : `${BASE_ACTIONS}_${VOUCHER}_IMPORT_FROM_EXCEL`,
   VOUCHER_EXPORT_EXCEL                            : `${BASE_ACTIONS}_${VOUCHER}_EXPORT_EXCEL`,

   /**
   * LOT
   */
   LOT_INSERT                                    : `${BASE_ACTIONS}_${LOT}_INSERT`,
   LOT_UPDATE                                    : `${BASE_ACTIONS}_${LOT}_UPDATE`,
   LOT_REMOVE                                    : `${BASE_ACTIONS}_${LOT}_REMOVE`,
   LOT_GET_INFO_AND_GET_LIST                     : `${BASE_ACTIONS}_${LOT}_GET_INFO_AND_GET_LIST`,
   LOT_DOWNLOAD_TEMPLATE_EXCEL                   : `${BASE_ACTIONS}_${LOT}_DOWNLOAD_TEMPLATE_EXCEL`,
   LOT_IMPORT_FROM_EXCEL                         : `${BASE_ACTIONS}_${LOT}_IMPORT_FROM_EXCEL`,
   LOT_EXPORT_EXCEL                              : `${BASE_ACTIONS}_${LOT}_EXPORT_EXCEL`,

   /**
   * ITEM
   */
   ITEM_INSERT                                    : `${BASE_ACTIONS}_${ITEM}_INSERT`,
   ITEM_UPDATE                                    : `${BASE_ACTIONS}_${ITEM}_UPDATE`,
   ITEM_REMOVE                                    : `${BASE_ACTIONS}_${ITEM}_REMOVE`,
   ITEM_GET_INFO_AND_GET_LIST                     : `${BASE_ACTIONS}_${ITEM}_GET_INFO_AND_GET_LIST`,
   ITEM_GET_LIST_BY_PROPERTY                      : `${BASE_ACTIONS}_${ITEM}_GET_AMOUNT_BY_PROPERTY`,
   ITEM_DOWNLOAD_TEMPLATE_EXCEL                   : `${BASE_ACTIONS}_${ITEM}_GET_LIST_BY_PROPERTY`,
   ITEM_IMPORT_FROM_EXCEL                         : `${BASE_ACTIONS}_${ITEM}_IMPORT_FROM_EXCEL`,
   ITEM_EXPORT_EXCEL                              : `${BASE_ACTIONS}_${ITEM}_EXPORT_EXCEL`,
}

exports.CF_ACTIONS_STORE = CF_ACTIONS_STORE