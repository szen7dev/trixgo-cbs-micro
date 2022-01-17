const BASE_ROUTE = '/personal';
const FRIEND_REQUEST = '/friend-request';

const CF_ROUTINGS_PERSONAL = {
    // ==================== FRIEND REQUEST ========================
    GET_CODE              : `${BASE_ROUTE}${FRIEND_REQUEST}/get-code`,
    CHECK_CODE            : `${BASE_ROUTE}${FRIEND_REQUEST}/check-code`,
}

exports.CF_ROUTINGS_PERSONAL = CF_ROUTINGS_PERSONAL;
