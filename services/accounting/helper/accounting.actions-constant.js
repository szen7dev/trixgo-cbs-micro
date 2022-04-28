// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_ACCOUNTING';
/**
 * CASE_1, CASE_2 tương ứng trong phần AUTH SERVICE, có 2 coll: user, company
 */
 const VOUCHER  = 'VOUCHER';
 const JOURNAL  = 'JOURNAL';

const CF_ACTIONS_ACCOUNTING = {
    /**
    * CASH_FLOW_PLAN
    */
    VOUCHER_INSERT                   : `${BASE_ACTIONS}_${VOUCHER}_INSERT`,
    VOUCHER_UPDATE                   : `${BASE_ACTIONS}_${VOUCHER}_UPDATE`,
    VOUCHER_REMOVE                   : `${BASE_ACTIONS}_${VOUCHER}_REMOVE`,
    VOUCHER_GET_INFO_AND_GET_LIST    : `${BASE_ACTIONS}_${VOUCHER}_GET_INFO_AND_GET_LIST`,

    /**
    * CASH_BOOK
    */
    JOURNAL_INSERT                   : `${BASE_ACTIONS}_${JOURNAL}_INSERT`,
    JOURNAL_UPDATE                   : `${BASE_ACTIONS}_${JOURNAL}_UPDATE`,
    JOURNAL_REMOVE                   : `${BASE_ACTIONS}_${JOURNAL}_REMOVE`,
    JOURNAL_GET_INFO_AND_GET_LIST    : `${BASE_ACTIONS}_${JOURNAL}_GET_INFO_AND_GET_LIST`,
}

exports.CF_ACTIONS_ACCOUNTING = CF_ACTIONS_ACCOUNTING;