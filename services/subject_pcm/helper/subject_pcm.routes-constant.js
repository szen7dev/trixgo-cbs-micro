const BASE_ROUTE = '/subject_pcm';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */

const PCM_PLAN_TASK         = '/pcm_plan_tasks';
const PCM_PLAN_REPORT       = '/pcm_plan_reports';
const USER_PCM_PLAN_REPORT  = '/user_pcm_plan_reports';
const PCM_PLAN_GROUP        = '/pcm_plan_groups';
const PCM_PLAN_TASK_COMMENT = '/pcm_comments';
const PCM_FILE              = '/pcm_files';

const CF_ROUTINGS_SUBJECT_PCM = {
    ORIGIN_APP: BASE_ROUTE,
    // ================================PCM_PLAN_TASK=======================================//
    PCM__PCM_PLAN_TASK                                  : `${BASE_ROUTE}${PCM_PLAN_TASK}`,
    PCM__PCM_PLAN_TASK_UPDATE_STATUS_MUTIPLE            : `${BASE_ROUTE}${PCM_PLAN_TASK}/update-status-mutiple`,
    PCM__PCM_PLAN_TASK_GET_BADGE                        : `${BASE_ROUTE}${PCM_PLAN_TASK}/badge`,
    PCM__PCM_PLAN_TASK_GET_BADGE_BIDDING                : `${BASE_ROUTE}${PCM_PLAN_TASK}/badge-bidding`,
    PCM__PCM_PLAN_TASK_SEND_EMAIL_TO_MEMBER_IN_TASK     : `${BASE_ROUTE}${PCM_PLAN_TASK}/send-email-to-member-in-task`,
    PCM__PCM_PLAN_TASK_GET_AMOUNT_TASK_OF_COMPANY_OF_ASSIGNEE : `${BASE_ROUTE}${PCM_PLAN_TASK}/amount-task-of-company_of_assignee`,
    PCM__PCM_PLAN_TASK_GET_AMOUNT_TASK_OF_PROJECT             : `${BASE_ROUTE}${PCM_PLAN_TASK}/amount-task-of-projects`,
    // Report
    SUBJECT__PCM_PLAN_REPORT                            : `${BASE_ROUTE}${PCM_PLAN_REPORT}`,
    SUBJECT__USER_PCM_PLAN_REPORT                       : `${BASE_ROUTE}${USER_PCM_PLAN_REPORT}`,
    
    // Group
    SUBJECT__PCM_PLAN_GROUP                             : `${BASE_ROUTE}${PCM_PLAN_GROUP}`,
    SUBJECT__PCM_PLAN_GROUP_REMOVE_MANY                 : `${BASE_ROUTE}${PCM_PLAN_GROUP}/remove-many`,

    //Comment
    SUBJECT_PCM__PCM_PLAN_TASK_COMMENT                  : `${BASE_ROUTE}${PCM_PLAN_TASK_COMMENT}`,
    SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_UPDATE_MARK      : `${BASE_ROUTE}${PCM_PLAN_TASK_COMMENT}/mark`,
    SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_SEARCH_BY_ID     : `${BASE_ROUTE}${PCM_PLAN_TASK_COMMENT}/search-by-id`,
    
    // Reaction_comment
    SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_REACTION         : `${BASE_ROUTE}${PCM_PLAN_TASK_COMMENT}/reactions`,

    // pcm_file
    PCM_FILE                                            : `${BASE_ROUTE}${PCM_FILE}`,
    PCM_FILE_GROUP_BY_DATE                              : `${BASE_ROUTE}${PCM_FILE}/group-by-date`,
    PCM_FILE_GROUP_BY_CONTRACT                          : `${BASE_ROUTE}${PCM_FILE}/group-by-contract`,
}

exports.CF_ROUTINGS_SUBJECT_PCM = CF_ROUTINGS_SUBJECT_PCM;