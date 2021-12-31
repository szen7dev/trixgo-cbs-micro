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
    USERS                               : `${BASE_ROUTE}${USER}`, // GET, POST /auth/users
    ME                                  : `${BASE_ROUTE}${USER}/me`, //GET, PUT, DELETE /auth/users/me
    
    LOGIN                               : `${BASE_ROUTE}${USER}/login`,
    UPDATE_DEVICE_WHEN_LOGIN_MOBILE     : `${BASE_ROUTE}${USER}/update-device`,

    SEARCH_WITH_FIND                    : `${BASE_ROUTE}${USER}/search-with-find`,
    SEARCH_WITH_FULL_TEXT               : `${BASE_ROUTE}${USER}/search-with-fulltext`,
    UPDATE_PASSWORD                     : `${BASE_ROUTE}${USER}/update-password`,
    UPDATE_FULLNAME                     : `${BASE_ROUTE}${USER}/update-fullname`,
    UPDATE_EMAIL                        : `${BASE_ROUTE}${USER}/update-email`,
    UPDATE_LANGUAGE                     : `${BASE_ROUTE}${USER}/update-language`,
    UPDATE_BIRTHDAY                     : `${BASE_ROUTE}${USER}/update-birthday`,
    SEND_OPT_RESET_PASSWORD             : `${BASE_ROUTE}${USER}/send-opt-reset-password`,
    CONFIRM_CODE_RESET_PASSWORD         : `${BASE_ROUTE}${USER}/confirm-code-reset-password`,
    UPDATE_PASSWORD_AFTER_FORGET        : `${BASE_ROUTE}${USER}/update-password-after-forget`,

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
}
exports.CF_ROUTINGS_AUTH = CF_ROUTINGS_AUTH;