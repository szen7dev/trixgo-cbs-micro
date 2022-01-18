const BASE_ROUTE = '/accounting';

/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const VOUCHER = '/voucher';
const GENERAL_JOURNAL = '/journal';


const CF_ROUTINGS_ACCOUNTING = {
    ORIGIN_APP: BASE_ROUTE,

	// ======================== ROUTE - API ===============================

    // VOUCHER
    INSERT_VOUCHER              : `${BASE_ROUTE}${VOUCHER}/insertFull`,
    UPDATE_VOUCHER              : `${BASE_ROUTE}${VOUCHER}/update`,
    REMOVE_VOUCHER              : `${BASE_ROUTE}${VOUCHER}/remove`,
    GET_LIST_VOUCHER_OF_COMPANY : `${BASE_ROUTE}${VOUCHER}/list-voucher`,


    INSERT_GENERAL_JOURNAL  : `${BASE_ROUTE}${GENERAL_JOURNAL}/insertFull`,
    // UPDATE_GENERAL_JOURNAL  : `${BASE_ROUTE}${GENERAL_JOURNAL}/update`,
}

exports.CF_ROUTINGS_ACCOUNTING = CF_ROUTINGS_ACCOUNTING;