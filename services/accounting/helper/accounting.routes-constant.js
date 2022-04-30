const BASE_ROUTE = '/accounting';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const VOUCHER           = '/vouchers';
const JOURNAL           = '/journals';

const CF_ROUTINGS_ACCOUNTING = {
    ORIGIN_APP: BASE_ROUTE,

    // ================================CASH_FLOW_PLAN=======================================//
    VOUCHER                          : `${BASE_ROUTE}${VOUCHER}`, 

    // ================================CASH_FLOW_PLAN=======================================//
    JOURNAL                          : `${BASE_ROUTE}${JOURNAL}`, 
    JOURNAL_CAL_IMPLE_BUDGET         : `${BASE_ROUTE}${JOURNAL}/cal-imple-budget`
}

exports.CF_ROUTINGS_ACCOUNTING = CF_ROUTINGS_ACCOUNTING;