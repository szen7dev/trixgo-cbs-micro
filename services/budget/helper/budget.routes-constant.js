const BASE_ROUTE = '/budgets';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const BUDGET     = '/budgets';
// const CONTRACT_IPC          = '/contract_ipcs';
// const CONTRACT_PRODUCTION   = '/contract_productions';
// const CONTRACT_PAYMENT      = '/contract_payments';

const CF_ROUTINGS_BUDGET = {
    ORIGIN_APP: BASE_ROUTE,

    // ================================CONTRACT IPC============================================//
    BUDGET                                                          : `${BASE_ROUTE}`,
    // CONTRACT_IPC_GET_AMOUNT_BY_MONTH                            : `${BASE_ROUTE}${CONTRACT_IPC}/get-amount-by-month`,
    // CONTRACT_IPC_GET_LIST_BY_MONTH                              : `${BASE_ROUTE}${CONTRACT_IPC}/get-list-by-month`,
}

exports.CF_ROUTINGS_BUDGET = CF_ROUTINGS_BUDGET;