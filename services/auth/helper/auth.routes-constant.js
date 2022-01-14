const BASE_ROUTE = '/auth';

/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
 const COMPANY           = '/companies',
       USER              = '/users',
       REGISTER_TRIAL    = '/register_trials';

const CF_ROUTINGS_AUTH = {
    ORIGIN_APP: BASE_ROUTE,
    /**
    * USER
    */
    USERS                               : `${BASE_ROUTE}${USER}`,
    ME                                  : `${BASE_ROUTE}${USER}/me`, //GET, PUT, DELETE /auth/users/me
    
    LOGIN                               : `${BASE_ROUTE}${USER}/login`,
    UPDATE_DEVICE_WHEN_LOGIN_MOBILE     : `${BASE_ROUTE}${USER}/update-device`,

    SEARCH_WITH_FIND                    : `${BASE_ROUTE}${USER}/search-with-find`,
    SEARCH_WITH_FULL_TEXT               : `${BASE_ROUTE}${USER}/search-with-fulltext`,
    
    GET_LIST_FRIEND                     : `${BASE_ROUTE}${USER}/list-friend`,
    GET_LIST_USER                       : `${BASE_ROUTE}${USER}/list-user`,
    
    /**
     * COMPANY
     */
    COMPANY                           : `${BASE_ROUTE}${COMPANY}`,

    /**
     * ĐĂNG KÝ DÙNG THỬ
     */
    REGISTER_TRIAL                    : `${BASE_ROUTE}${REGISTER_TRIAL}`,
    REGISTER_TRIAL_STATISTICS_BY_TYPE : `${BASE_ROUTE}${REGISTER_TRIAL}/statistics-by-type`,
    REGISTER_TRIAL_STATISTICS_BY_YEAR : `${BASE_ROUTE}${REGISTER_TRIAL}/statistics-by-year`,
    REGISTER_TRIAL_STATISTICS_BY_COMPANY : `${BASE_ROUTE}${REGISTER_TRIAL}/statistics-by-company`,
}
exports.CF_ROUTINGS_AUTH = CF_ROUTINGS_AUTH;