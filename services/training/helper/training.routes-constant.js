const BASE_ROUTE = '/training';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const SUBJECT = '/subjects';

const CF_ROUTINGS_TRAINING = {
    ORIGIN_APP: BASE_ROUTE,

    // ================================CONTRACT BILL JOB=======================================//
    TRAINING__SUBJECT         : `${BASE_ROUTE}${SUBJECT}`, 
}

exports.CF_ROUTINGS_TRAINING = CF_ROUTINGS_TRAINING;