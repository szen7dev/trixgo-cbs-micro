const BASE_ROUTE = '/reaction';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const REACTION = '/reactions';
const COMMENT_CORES  = '/comment_cores';

const CF_ROUTINGS_REACTION = {
    ORIGIN_APP: BASE_ROUTE,

    // ================================REACTION=======================================//
    REACTION_GET_LIST                         : `${BASE_ROUTE}${REACTION}`,

    // ================================COMMENT=======================================//
    COMMENT_CORES                              : `${BASE_ROUTE}${COMMENT_CORES}`,
}

exports.CF_ROUTINGS_REACTION = CF_ROUTINGS_REACTION;