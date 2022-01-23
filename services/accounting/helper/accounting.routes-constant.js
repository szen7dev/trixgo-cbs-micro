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
    INSERT_VOUCHER                          : `${BASE_ROUTE}${VOUCHER}/insertFull`,
    UPDATE_VOUCHER                          : `${BASE_ROUTE}${VOUCHER}/update`,
    REMOVE_VOUCHER                          : `${BASE_ROUTE}${VOUCHER}/remove`,
    GET_LIST_VOUCHER_OF_COMPANY             : `${BASE_ROUTE}${VOUCHER}/list-voucher`,
    GET_LIST_VAT_VOUCHER_OF_COMPANY         : `${BASE_ROUTE}${VOUCHER}/list-vat-voucher`,
    FIND_VOUCHER_IN_COMPANY                 : `${BASE_ROUTE}${VOUCHER}/find-voucher`,
    GET_INFO_VOUCHER                        : `${BASE_ROUTE}${VOUCHER}/:voucherID`,

    //  JOURNAL
    INSERT_GENERAL_JOURNAL      : `${BASE_ROUTE}${GENERAL_JOURNAL}/insertFull`,
    REMOVE_GENERAL_JOURNAL      : `${BASE_ROUTE}${GENERAL_JOURNAL}/remove`,
    GET_INFO_GENERAL_JOURNAL    : `${BASE_ROUTE}${GENERAL_JOURNAL}/:journalID`,

    // UPDATE_GENERAL_JOURNAL  : `${BASE_ROUTE}${GENERAL_JOURNAL}/update`,
}

exports.CF_ROUTINGS_ACCOUNTING = CF_ROUTINGS_ACCOUNTING;