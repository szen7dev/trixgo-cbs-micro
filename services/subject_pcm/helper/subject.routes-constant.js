const BASE_ROUTE = '/subject';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */

const PCM_PLAN_REPORT    = '/pcm_plan_reports';

const CF_ROUTINGS_SUBJECT = {
    ORIGIN_APP: BASE_ROUTE,

    // ================================PCM_PLAN_REPORT=======================================//
    SUBJECT__PCM_PLAN_REPORT   : `${BASE_ROUTE}${PCM_PLAN_REPORT}`,
}

exports.CF_ROUTINGS_SUBJECT = CF_ROUTINGS_SUBJECT;