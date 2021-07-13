const BASE_ROUTE = '/files'; //đối với những trường hợp service chỉ có 1 coll(chính nó là core) -> cần thêm 's' để đảm bảo restful API
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */

const CF_ROUTINGS_FILE = {
    ORIGIN_APP: BASE_ROUTE,

    FILES                                : `${BASE_ROUTE}`, //  GET, POST, PUT, DELETE /files
    FILE_DETAIL                          : `${BASE_ROUTE}/:fileID`, //  GET, POST, PUT, DELETE /files/:fileID
    GET_LIST_FILE_OF_USER_WITH_STATUS    : `${BASE_ROUTE}/users/:userID/status/:status`, // GET /files/users/:userID/status/:status
}

exports.CF_ROUTINGS_FILE = CF_ROUTINGS_FILE;