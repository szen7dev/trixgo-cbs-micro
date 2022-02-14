const BASE_ROUTE = '/medias';
const COMMENTS = '/comments';
const REACTIONS = '/reactions';

const CF_ROUTINGS_MEDIA = {
    ORIGIN_APP: BASE_ROUTE,

    MAIN_MEDIA                  		        : `${BASE_ROUTE}`,
    INFO_MEDIA                  		        : `${BASE_ROUTE}/:mediaID`,
    SAVE_MEDIA                  		        : `${BASE_ROUTE}/save`,
    PIN_MEDIA                  		            : `${BASE_ROUTE}/pin`,
    WATCHED_MEDIA                  		        : `${BASE_ROUTE}/watched`,

    REACTION_MEDIA                              : `${BASE_ROUTE}${REACTIONS}`,
    REACTION_FILE               		        : `${BASE_ROUTE}${REACTIONS}/file`,

    COMMENT_MEDIA     		                    : `${BASE_ROUTE}${COMMENTS}`,
    COMMENT_FILE     		                    : `${BASE_ROUTE}${COMMENTS}/file`,
}

exports.CF_ROUTINGS_MEDIA = CF_ROUTINGS_MEDIA;