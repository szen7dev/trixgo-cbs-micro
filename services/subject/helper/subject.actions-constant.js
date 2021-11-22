// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_SUBJECT';
/**
 * CASE_1, CASE_2 tương ứng trong phần AUTH SERVICE, có 2 coll: user, company
 */
const PCM_PLAN_REPORT          = 'PCM_PLAN_REPORT';

const CF_ACTIONS_SUBJECT = {
    /**
     * SUBJECT
    */
    SUBJECT__PCM_PLAN_REPORT_INSERT                 : `${BASE_ACTIONS}_${SUBJECT}_INSERT`,
    SUBJECT__PCM_PLAN_REPORT_UPDATE                 : `${BASE_ACTIONS}_${SUBJECT}_UPDATE`,
    SUBJECT__PCM_PLAN_REPORT_REMOVE                 : `${BASE_ACTIONS}_${SUBJECT}_REMOVE`,
    SUBJECT__PCM_PLAN_REPORT_GET_INFO_AND_GET_LIST  : `${BASE_ACTIONS}_${SUBJECT}_GET_INFO_AND_GET_LIST`,
}
exports.CF_ACTIONS_SUBJECT = CF_ACTIONS_SUBJECT;