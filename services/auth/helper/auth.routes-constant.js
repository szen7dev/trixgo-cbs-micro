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
    USER_DETAIL                         : `${BASE_ROUTE}${USER}/:userID`, //GET, PUT, DELETE /auth/users/:userID
    
    SIGN_IN                             : `${BASE_ROUTE}${USER}/login`,
    UPDATE_DEVICE_WHEN_LOGIN_MOBILE     : `${BASE_ROUTE}${USER}/update-device`,
}

exports.CF_ROUTINGS_AUTH = CF_ROUTINGS_AUTH;