const BASE_ROUTE = '/subject_pcm';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */

const PCM_PLAN_TASK         = '/pcm_plan_tasks';
const PCM_PLAN_REPORT       = '/pcm_plan_reports';
const USER_PCM_PLAN_REPORT  = '/user_pcm_plan_reports';
const PCM_PLAN_GROUP        = '/pcm_plan_groups';
const PCM_PLAN_TASK_COMMENT = '/pcm_plan_task_comments';

const CF_ROUTINGS_SUBJECT_PCM = {
    ORIGIN_APP: BASE_ROUTE,
    // ================================PCM_PLAN_TASK=======================================//
    PCM__PCM_PLAN_TASK                  : `${BASE_ROUTE}${PCM_PLAN_TASK}`,
    SUBJECT__PCM_PLAN_REPORT            : `${BASE_ROUTE}${PCM_PLAN_REPORT}`,
    SUBJECT__USER_PCM_PLAN_REPORT       : `${BASE_ROUTE}${USER_PCM_PLAN_REPORT}`,
    SUBJECT__PCM_PLAN_GROUP             : `${BASE_ROUTE}${PCM_PLAN_GROUP}`,
    SUBJECT_PCM__PCM_PLAN_TASK_COMMENT  : `${BASE_ROUTE}${PCM_PLAN_TASK_COMMENT}`,
}

exports.CF_ROUTINGS_SUBJECT_PCM = CF_ROUTINGS_SUBJECT_PCM;