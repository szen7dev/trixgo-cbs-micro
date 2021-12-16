const BASE_ROUTE = '/notifications';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */

const CF_ROUTINGS_NOTIFICATION = {
    ORIGIN_APP: BASE_ROUTE,

    GET_LIST_NOTIFICATION               : `${BASE_ROUTE}/list-notifications`,
    UPDATE_STATUS_NOTIFICATION          : `${BASE_ROUTE}/update-status-notification`,
}

exports.CF_ROUTINGS_NOTIFICATION = CF_ROUTINGS_NOTIFICATION;