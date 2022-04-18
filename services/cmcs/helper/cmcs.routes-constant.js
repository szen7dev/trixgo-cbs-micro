const BASE_ROUTE = '/cmcs';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const CONTRACT_BILL_JOB     = '/contract_bill_jobs';
const CONTRACT_IPC          = '/contract_ipcs';
const CONTRACT_PRODUCTION   = '/contract_productions';
const CONTRACT_PAYMENT      = '/contract_payments';

const CF_ROUTINGS_CMCS = {
    ORIGIN_APP: BASE_ROUTE,

    // ================================CONTRACT BILL JOB=======================================//
    CONTRACT_BILL_JOB_GET_LIST                                  : `${BASE_ROUTE}${CONTRACT_BILL_JOB}`,

    // ================================CONTRACT PRODUCTION=====================================//
    CONTRACT_PRODUCTION                                         : `${BASE_ROUTE}${CONTRACT_PRODUCTION}`,
    CONTRACT_PRODUCTION_GET_LIST_BY_MONTH                       : `${BASE_ROUTE}${CONTRACT_PRODUCTION}/get-list-by-month`,
    CONTRACT_PRODUCTION_GET_AMOUNT_BY_MONTH                     : `${BASE_ROUTE}${CONTRACT_PRODUCTION}/get-amount-by-month`,
    CONTRACT_PRODUCTION_GET_AMOUNT_BY_OBJECT                    : `${BASE_ROUTE}${CONTRACT_PRODUCTION}/get-amount-by-object`,
    CONTRACT_PRODUCTION_GET_AMOUNT_BY_PROPERTY                  : `${BASE_ROUTE}${CONTRACT_PRODUCTION}/get-amount-by-property`,

    // ================================CONTRACT IPC============================================//
    CONTRACT_IPC                                                : `${BASE_ROUTE}${CONTRACT_IPC}`,
    CONTRACT_IPC_GET_LIST_BY_MONTH                              : `${BASE_ROUTE}${CONTRACT_IPC}/get-list-by-month`,
    CONTRACT_IPC_GET_AMOUNT_BY_MONTH                            : `${BASE_ROUTE}${CONTRACT_IPC}/get-amount-by-month`,
    CONTRACT_IPC_GET_AMOUNT_BY_OBJECT                           : `${BASE_ROUTE}${CONTRACT_IPC}/get-amount-by-object`,
    CONTRACT_IPC_GET_AMOUNT_BY_PROPERTY                         : `${BASE_ROUTE}${CONTRACT_IPC}/get-amount-by-property`,

    // ================================CONTRACT PAYMENT=====================================//
    CONTRACT_PAYMENT                                            : `${BASE_ROUTE}${CONTRACT_PAYMENT}`,
    CONTRACT_PAYMENT_GET_LIST_BY_MONTH                          : `${BASE_ROUTE}${CONTRACT_PAYMENT}/get-list-by-month`,
    CONTRACT_PAYMENT_GET_AMOUNT_BY_MONTH                        : `${BASE_ROUTE}${CONTRACT_PAYMENT}/get-amount-by-month`,
    CONTRACT_PAYMENT_GET_AMOUNT_CONTRACT_VALUE_GROUP_BY_DATE    : `${BASE_ROUTE}${CONTRACT_PAYMENT}/get-amount-contract-value-group-by-date`,
    CONTRACT_PAYMENT_GET_AMOUNT_BY_OBJECT                       : `${BASE_ROUTE}${CONTRACT_PAYMENT}/get-amount-by-object`,
    CONTRACT_PAYMENT_GET_AMOUNT_BY_PROPERTY                     : `${BASE_ROUTE}${CONTRACT_PAYMENT}/get-amount-by-property`,
}

exports.CF_ROUTINGS_CMCS = CF_ROUTINGS_CMCS;