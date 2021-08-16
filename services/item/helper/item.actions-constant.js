// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_ITEM';
/**
 * CASE_1, CASE_2 tương ứng trong phần AUTH SERVICE, có 2 coll: user, company
 */
const CONTRACT          = 'CONTRACT';
const DEPARTMENT        = 'DEPARTMENT';

const CF_ACTIONS_ITEM = {
     /**
     * CONTRACT
    */
    CONTRACT_GET_LIST                        : `${BASE_ACTIONS}_${CONTRACT}_CONTRACT_GET_LIST`,

     /**
     * DEPARTMENT
    */
    DEPARTMENT_GET_LIST                      : `${BASE_ACTIONS}_${DEPARTMENT}_DEPARTMENT_GET_LIST`,
}

exports.CF_ACTIONS_ITEM = CF_ACTIONS_ITEM;