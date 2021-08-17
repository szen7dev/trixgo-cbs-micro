// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_REACTION';
/**
 * CASE_1, CASE_2 tương ứng trong phần AUTH SERVICE, có 2 coll: user, company
 */
const REACTION          = 'REACTION';
const COMMENT           = 'COMMENT';

const CF_ACTIONS_REACTION = {
     /**
     * REACTION
    */
    REACTION_GET_LIST                        : `${BASE_ACTIONS}_${REACTION}_REACTION_GET_LIST`,

     /**
     * COMMENT
    */
    COMMENT_GET_LIST                         : `${BASE_ACTIONS}_${COMMENT}_COMMENT_GET_LIST`,
}

exports.CF_ACTIONS_REACTION = CF_ACTIONS_REACTION;