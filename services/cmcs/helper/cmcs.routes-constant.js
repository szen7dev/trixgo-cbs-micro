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
    CONTRACT_BILL_JOB_GET_LIST         : `${BASE_ROUTE}${CONTRACT_BILL_JOB}`, 

    // ================================CONTRACT IPC============================================//
    CONTRACT_IPC                       : `${BASE_ROUTE}${CONTRACT_IPC}`, 

    // ================================CONTRACT PRODUCTION=====================================//
    CONTRACT_PRODUCTION                : `${BASE_ROUTE}${CONTRACT_PRODUCTION}`, 

    // ================================CONTRACT PAYMENT=====================================//
    CONTRACT_PAYMENT                   : `${BASE_ROUTE}${CONTRACT_PAYMENT}`, 
    CONTRACT_PAYMENT_GET_AMOUNT_BY_MONTH     : `${BASE_ROUTE}${CONTRACT_PAYMENT}/get-amount-by-month`,
}

exports.CF_ROUTINGS_CMCS = CF_ROUTINGS_CMCS;