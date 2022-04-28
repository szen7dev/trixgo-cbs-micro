const BASE_ROUTE = '/fin';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const CASH_FLOW_PLAN     = '/cash_flow_plans';
const CASH_BOOK          = '/cash_books';

const CF_ROUTINGS_FIN = {
    ORIGIN_APP: BASE_ROUTE,

    // ================================CASH_FLOW_PLAN=======================================//
    CASH_FLOW_PLAN                          : `${BASE_ROUTE}${CASH_FLOW_PLAN}`, 
    CASH_FLOW_PLAN_GET_AMOUNT_BY_PROPERTY   : `${BASE_ROUTE}${CASH_FLOW_PLAN}/get-amount-by-property`,

    // ================================CASH_BOOK=======================================//
    CASH_BOOK                               : `${BASE_ROUTE}${CASH_BOOK}`, 
    CASH_BOOK_GET_AMOUNT_BY_PROPERTY        : `${BASE_ROUTE}${CASH_BOOK}/get-amount-by-property`,
    CASH_BOOK_GET_AMOUNT_INCOME_EXPENSE_BY_PARENT   : `${BASE_ROUTE}${CASH_BOOK}/get-amount-income-expense-by-parent`,
}

exports.CF_ROUTINGS_FIN = CF_ROUTINGS_FIN;