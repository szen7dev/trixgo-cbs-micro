// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_CMCS';
/**
 * CASE_1, CASE_2 tương ứng trong phần AUTH SERVICE, có 2 coll: user, company
 */
const CONTRACT_BILL_JOB          = 'CONTRACT_BILL_JOB';

const CF_ACTIONS_CMCS = {
    /**
     * CONTRACT BILL JOB
    */
    CONTRACT_BILL_JOB_GET_LIST      : `${BASE_ACTIONS}_${CONTRACT_BILL_JOB}_GET_LIST`,

}
exports.CF_ACTIONS_CMCS = CF_ACTIONS_CMCS;