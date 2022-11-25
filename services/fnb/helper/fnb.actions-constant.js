const BASE_ACTIONS = 'ACT_FNB';

/**
 * CASE_1, CASE_2 tương ứng trong phần AUTH SERVICE, có 2 coll: user, company
 */
const ORDER                      = 'ORDER';
const PRODUCT                    = 'PRODUCT';
const ORDER_PRODUCT              = 'ORDER_PRODUCT';
const SHIFT                      = 'SHIFT';

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

   /**
   * PRODUCT
   */
   PRODUCT_INSERT                                    : `${BASE_ACTIONS}_${PRODUCT}_INSERT`,
   PRODUCT_UPDATE                                    : `${BASE_ACTIONS}_${PRODUCT}_UPDATE`,
   PRODUCT_REMOVE                                    : `${BASE_ACTIONS}_${PRODUCT}_REMOVE`,
   PRODUCT_GET_INFO_AND_GET_LIST                     : `${BASE_ACTIONS}_${PRODUCT}_GET_INFO_AND_GET_LIST`,

   /**
   * ORDER_PRODUCT
   */
   ORDER_PRODUCT_INSERT                                    : `${BASE_ACTIONS}_${ORDER_PRODUCT}_INSERT`,
   ORDER_PRODUCT_UPDATE                                    : `${BASE_ACTIONS}_${ORDER_PRODUCT}_UPDATE`,
   ORDER_PRODUCT_REMOVE                                    : `${BASE_ACTIONS}_${ORDER_PRODUCT}_REMOVE`,
   ORDER_PRODUCT_GET_INFO_AND_GET_LIST                     : `${BASE_ACTIONS}_${ORDER_PRODUCT}_GET_INFO_AND_GET_LIST`,

   /**
   * SHIFT
   */
   SHIFT_INSERT                                    : `${BASE_ACTIONS}_${SHIFT}_INSERT`,
   SHIFT_UPDATE                                    : `${BASE_ACTIONS}_${SHIFT}_UPDATE`,
   SHIFT_REMOVE                                    : `${BASE_ACTIONS}_${SHIFT}_REMOVE`,
   SHIFT_GET_INFO_AND_GET_LIST                     : `${BASE_ACTIONS}_${SHIFT}_GET_INFO_AND_GET_LIST`,
}

exports.CF_ACTIONS_FNB = CF_ACTIONS_FNB;