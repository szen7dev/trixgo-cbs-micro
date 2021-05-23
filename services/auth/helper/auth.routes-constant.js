const BASE_ROUTE = '/auth';

/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
 const COMPANY = '/company',
       USER    = '/user';

const CF_ROUTINGS_AUTH = {
    ORIGIN_APP: BASE_ROUTE,
    INSERT_FAST: `${BASE_ROUTE}${COMPANY}`,
}

exports.CF_ROUTINGS_AUTH = CF_ROUTINGS_AUTH;