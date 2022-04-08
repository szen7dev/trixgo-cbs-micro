// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_BUDGET';
/**
 * CASE_1, CASE_2 tương ứng trong phần AUTH SERVICE, có 2 coll: user, company
 */
const BUDGET                        = 'BUDGET';

const CF_ACT_BUDGET = {
    /**
    * BUDGET
    */
    BUDGET_INSERT                                      : `${BASE_ACTIONS}_${BUDGET}_INSERT`,
    BUDGET_UPDATE                                      : `${BASE_ACTIONS}_${BUDGET}_UPDATE`,
    BUDGET_REMOVE                                      : `${BASE_ACTIONS}_${BUDGET}_REMOVE`,
    BUDGET_GET_INFO_AND_GET_LIST                       : `${BASE_ACTIONS}_${BUDGET}_GET_INFO_AND_GET_LIST`,
}

exports.CF_ACT_BUDGET = CF_ACT_BUDGET;