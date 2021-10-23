const BASE_ROUTE = '/medias';

const CF_ROUTINGS_MEDIA = {
    ORIGIN_APP: BASE_ROUTE,

	// ======================== ROUTE - API ===============================
    
    MAIN_MEDIA                  		        : `${BASE_ROUTE}`,
    SAVE_MEDIA                  		        : `${BASE_ROUTE}/save`,
    PIN_MEDIA                  		            : `${BASE_ROUTE}/pin`,
    WATCHED_MEDIA                  		        : `${BASE_ROUTE}/watched`,
    REACTION_MEDIA                              : `${BASE_ROUTE}/reaction`,
    COMMENT_MEDIA     		                    : `${BASE_ROUTE}/comment`,
    DETAIL_COMMENT_MEDIA     		            : `${BASE_ROUTE}/detail-comment`,
    REACTION_COMMENT               		        : `${BASE_ROUTE}/reaction-comment`,
    REPLY_COMMENT_MEDIA     		            : `${BASE_ROUTE}/reply-comment`,

    IMAGE_MEDIA                                  : `${BASE_ROUTE}/images`,
    REACTION_IMAGE_MEDIA                         : `${BASE_ROUTE}/reaction-images`,
    COMMENT_IMAGE_MEDIA     		             : `${BASE_ROUTE}/comment-images`,
    DETAIL_COMMENT_IMAGE_MEDIA     		         : `${BASE_ROUTE}/detail-comment-images`,
    REACTION_COMMENT_IMAGE               		 : `${BASE_ROUTE}/reaction-comment-images`,
    REPLY_COMMENT_IMAGE_MEDIA     		         : `${BASE_ROUTE}/reply-comment-images`,
}
exports.CF_ROUTINGS_MEDIA = CF_ROUTINGS_MEDIA;