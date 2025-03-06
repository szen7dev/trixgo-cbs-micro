const BASE_ROUTE        = '/medias';
const COMMENTS          = '/comments';
const REACTIONS         = '/reactions';
const MENU              = '/menu';
const TAG               = '/tag';
const QUESTION          = '/question';
const BANNER            = '/banner';

const CF_ROUTINGS_MEDIA = {
    ORIGIN_APP: BASE_ROUTE,

    MAIN_MEDIA                  		        : `${BASE_ROUTE}`,
    UPDATE_VIEW_MEDIA                  		    : `${BASE_ROUTE}/views`,
    LIST_SEEN_MEDIA                  		    : `${BASE_ROUTE}/seens`,
    SAVE_MEDIA                  		        : `${BASE_ROUTE}/save`,
    PIN_MEDIA                  		            : `${BASE_ROUTE}/pin`,
    FILE_MEDIA                  		        : `${BASE_ROUTE}/files`,

    REACTION_MEDIA                              : `${BASE_ROUTE}${REACTIONS}`,
    REACTION_FILE               		        : `${BASE_ROUTE}${REACTIONS}/file`,

    REACTION_COMMENT_MEDIA                      : `${BASE_ROUTE}${REACTIONS}${COMMENTS}/media`,
    REACTION_COMMENT_FILE       		        : `${BASE_ROUTE}${REACTIONS}${COMMENTS}/file`,
    REACTION_COMMENT       		                : `${BASE_ROUTE}${REACTIONS}${COMMENTS}`,

    COMMENT_MEDIA     		                    : `${BASE_ROUTE}${COMMENTS}`,
    COMMENT_FILE     		                    : `${BASE_ROUTE}${COMMENTS}/file`,

    
    //================================MEDIA_MENU=======================================//
    MENU                                       : `${BASE_ROUTE}${MENU}`,

    //================================MEDIA_TAG=======================================//
    TAG                                        : `${BASE_ROUTE}${TAG}`,

    //================================MEDIA_QUESTION=======================================//
    QUESTION                                   : `${BASE_ROUTE}${QUESTION}`,

    //================================MEDIA_BANNER=======================================//
    BANNER                                      : `${BASE_ROUTE}${BANNER}`,
}

exports.CF_ROUTINGS_MEDIA = CF_ROUTINGS_MEDIA;