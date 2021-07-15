const BASE_ROUTE = '/auth';

/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
 const COMPANY = '/companies',
       USER    = '/users';

const CF_ROUTINGS_AUTH = {
    ORIGIN_APP: BASE_ROUTE,
    /**
     * USER
    */
    USERS                               : `${BASE_ROUTE}${USER}`, // GET, POST /auth/users
    ME                                  : `${BASE_ROUTE}${USER}/me`, //GET, PUT, DELETE /auth/users/me
    
    LOGIN                               : `${BASE_ROUTE}${USER}/login`,
    UPDATE_DEVICE_WHEN_LOGIN_MOBILE     : `${BASE_ROUTE}${USER}/update-device`,

    SEARCH_WITH_FIND            : `${BASE_ROUTE}${USER}/search-with-find`,
    SEARCH_WITH_FULL_TEXT       : `${BASE_ROUTE}${USER}/search-with-fulltext`,
}

exports.CF_ROUTINGS_AUTH = CF_ROUTINGS_AUTH;