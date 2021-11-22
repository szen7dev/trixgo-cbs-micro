const BASE_ROUTE = '/subject';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */

const SUBJECT    = '/subjects';

const CF_ROUTINGS_SUBJECT = {
    ORIGIN_APP: BASE_ROUTE,

    // ================================SUBJECT=======================================//
    SUBJECT__SUBJECT        : `${BASE_ROUTE}${SUBJECT}`,
}

exports.CF_ROUTINGS_SUBJECT = CF_ROUTINGS_SUBJECT;