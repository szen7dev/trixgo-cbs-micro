const BASE_ROUTE = '/reaction';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const REACTION = '/reactions';
const COMMENT  = '/comments';

const CF_ROUTINGS_REACTION = {
    ORIGIN_APP: BASE_ROUTE,

    // ================================REACTION=======================================//
    REACTION_GET_LIST                                : `${BASE_ROUTE}${REACTION}`, // /item/reactions

    // ================================COMMENT=======================================//
    COMMENT_GET_LIST                                  : `${BASE_ROUTE}${COMMENT}`, // /item/comments
}

exports.CF_ROUTINGS_REACTION = CF_ROUTINGS_REACTION;