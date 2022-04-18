// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_FIN';
/**
 * CASE_1, CASE_2 tương ứng trong phần AUTH SERVICE, có 2 coll: user, company
 */
const CASH_FLOW_PLAN        = 'CASH_FLOW_PLAN';
const CASH_BOOK             = 'CASH_BOOK';

const CF_ACTIONS_FIN = {
    /**
    * CASH_FLOW_PLAN
    */
    CASH_FLOW_PLAN_INSERT                   : `${BASE_ACTIONS}_${CASH_FLOW_PLAN}_INSERT`,
    CASH_FLOW_PLAN_UPDATE                   : `${BASE_ACTIONS}_${CASH_FLOW_PLAN}_UPDATE`,
    CASH_FLOW_PLAN_REMOVE                   : `${BASE_ACTIONS}_${CASH_FLOW_PLAN}_REMOVE`,
    CASH_FLOW_PLAN_GET_INFO_AND_GET_LIST    : `${BASE_ACTIONS}_${CASH_FLOW_PLAN}_GET_INFO_AND_GET_LIST`,

    /**
    * CASH_BOOK
    */
    CASH_BOOK_INSERT                        : `${BASE_ACTIONS}_${CASH_BOOK}_INSERT`,
    CASH_BOOK_UPDATE                        : `${BASE_ACTIONS}_${CASH_BOOK}_UPDATE`,
    CASH_BOOK_REMOVE                        : `${BASE_ACTIONS}_${CASH_BOOK}_REMOVE`,
    CASH_BOOK_GET_INFO_AND_GET_LIST         : `${BASE_ACTIONS}_${CASH_BOOK}_GET_INFO_AND_GET_LIST`,   
    CASH_BOOK_GET_AMOUNT_BY_PROPERTY        : `${BASE_ACTIONS}_${CASH_BOOK}_GET_AMOUNT_BY_PROPERTY`,
}

exports.CF_ACTIONS_FIN = CF_ACTIONS_FIN;