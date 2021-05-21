const BASE_ROUTE = '/posts';

const CF_ROUTINGS_POSTS = {
    
    REMOVE: `${BASE_ROUTE}/remove/:postID`,
    FIND_BY_ID: `${BASE_ROUTE}/:postID`,
    ADD_COMMENT: `${BASE_ROUTE}/add-comment`,
    REMOVE_COMMENT: `${BASE_ROUTE}/remove-comment/:commentID`,
    ORIGIN_APP: BASE_ROUTE,

    APP_ID: `602d067116982545ecd5923e`,
}

exports.CF_ROUTINGS_POSTS = CF_ROUTINGS_POSTS;