const BASE_ROUTE = '/auth';

/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
 const COMPANY           = '/companies',
       USER              = '/users',
       REGISTER_TRIAL    = '/register_trials',
       APP               = '/apps',
       APP_MENU          = '/app_menus',
       APP_ROLE_MENU     = '/app_role_menus',
       APP_ROLE          = '/app_roles',
       APP_USER          = '/app_users',
       APP_COMPANY       = '/app_companies'

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
    GET_LIST_USER_SEND_TO_FRIENDS       : `${BASE_ROUTE}${USER}/list-user-send-to-friends`,
    GET_LIST_USER_RECEIVE_FROM_FRIENDS  : `${BASE_ROUTE}${USER}/list-user-receiver-from-friends`,
    GET_LIST_USER                       : `${BASE_ROUTE}${USER}/list-user`,

    /**
     * COMPANY
     */
    COMPANY                            : `${BASE_ROUTE}${COMPANY}`,

    /**
     * APP
     */
    APP                                : `${BASE_ROUTE}${APP}`,

    /**
     * APP_MENU
     */
    APP_MENU                           : `${BASE_ROUTE}${APP_MENU}`,

    /**
     * APP_COMPANY
     */
    APP_COMPANY                         : `${BASE_ROUTE}${APP_COMPANY}`,

    /**
     * APP_ROLE
     */
    APP_ROLE                           : `${BASE_ROUTE}${APP_ROLE}`,
    APP_ROLE_REMOVE_MANY               : `${BASE_ROUTE}${APP_ROLE}/remove-many`,

    /**
     * APP_ROLE_MENU
     */
    APP_ROLE_MENU                      : `${BASE_ROUTE}${APP_ROLE_MENU}`,
    APP_ROLE_MENU_PERMISSION            : `${BASE_ROUTE}${APP_ROLE_MENU}/permission`,
    APP_ROLE_MENU_GET_PERMISSION_TO_ACCESS_ONE_MENU_OF_APP : `${BASE_ROUTE}${APP_ROLE_MENU}/permission-to-access-one-menu-of-app`,

    /**
     * APP_USER
     */
    APP_USER                                : `${BASE_ROUTE}${APP_USER}`,
    APP_USER_LIST_APP_OFF_USER              : `${BASE_ROUTE}${APP_USER}/list-app-of-user`,
    APP_USER_CHECK_PERMISSIONS_ACCESS_APP   : `${BASE_ROUTE}${APP_USER}/check-permissions-access-app`,
    /**
     * ĐĂNG KÝ DÙNG THỬ
     */
    REGISTER_TRIAL                    : `${BASE_ROUTE}${REGISTER_TRIAL}`,
    REGISTER_TRIAL_STATISTICS_BY_TYPE : `${BASE_ROUTE}${REGISTER_TRIAL}/statistics-by-type`,
    REGISTER_TRIAL_STATISTICS_BY_YEAR : `${BASE_ROUTE}${REGISTER_TRIAL}/statistics-by-year`,
    REGISTER_TRIAL_STATISTICS_BY_COMPANY : `${BASE_ROUTE}${REGISTER_TRIAL}/statistics-by-company`,

    /**
     * VERSION APP
     */
    CHECK_LASTEST_APP : `/check-lastest-app`,
}
exports.CF_ROUTINGS_AUTH = CF_ROUTINGS_AUTH;