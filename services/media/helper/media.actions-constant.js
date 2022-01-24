// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_MEDIA';
const COMMENT      = 'COMMENT';

/**
 * nguyên tắc chuyển đổi từ method trong .handler
 *  VD: handler(insertFast) -> action(INSERT_FAST)
 */
const CF_ACTIONS_MEDIA = {

	/// MEDIA
	INSERT_MEDIA                  					: `${BASE_ACTIONS}_INSERT`,
	LIST_MEDIA                  			        : `${BASE_ACTIONS}_LIST`,
	DELETE_MEDIA                  			        : `${BASE_ACTIONS}_DELETE`,
	INFO_MEDIA                  			        : `${BASE_ACTIONS}_INFO_MEDIA`,
	LIST_SAVE_MEDIA                  				: `${BASE_ACTIONS}_LIST_SAVE_MEDIA`,
	UPDATE_MEDIA                  			        : `${BASE_ACTIONS}_UPDATE`,
	SAVE_MEDIA                  					: `${BASE_ACTIONS}_SAVE_MEDIA`,
	DELETE_SAVE_MEDIA                  				: `${BASE_ACTIONS}_DELETE_SAVE_MEDIA`,
	LIST_PIN_MEDIA                  				: `${BASE_ACTIONS}_LIST_PIN_MEDIA`,
	PIN_MEDIA                  						: `${BASE_ACTIONS}_PIN_MEDIA`,
	DELETE_PIN_MEDIA                  				: `${BASE_ACTIONS}_DELETE_PIN_MEDIA`,
	REACTION_MEDIA                              	: `${BASE_ACTIONS}_REACTION_MEDIA`,
    GET_LIST_REACTION_MEDIA                     	: `${BASE_ACTIONS}_GET_LIST_REACTION_MEDIA`,
    REACTION_COMMENT               		        	: `${BASE_ACTIONS}_REACTION_COMMENT`,
    GET_LIST_REACTION_COMMENT     		        	: `${BASE_ACTIONS}_GET_LIST_REACTION_COMMENT`,
	REACTION_IMAGE_MEDIA                            : `${BASE_ACTIONS}_REACTION_IMAGE_MEDIA`,
    GET_LIST_REACTION_IMAGE_MEDIA                   : `${BASE_ACTIONS}_GET_LIST_REACTION_IMAGE_MEDIA`,
    COMMENT_IMAGE_MEDIA     		                : `${BASE_ACTIONS}_COMMENT_IMAGE_MEDIA`,
    GET_LIST_COMMENT_IMAGE_MEDIA	                : `${BASE_ACTIONS}_GET_LIST_COMMENT_IMAGE_MEDIA`,
    UPDATE_COMMENT_IMAGE_MEDIA	                   	: `${BASE_ACTIONS}_UPDATE_COMMENT_IMAGE_MEDIA`,
    DELETE_COMMENT_IMAGE_MEDIA	                    : `${BASE_ACTIONS}_DELETE_COMMENT_IMAGE_MEDIA`,
    GET_DETAIL_COMMENT_IMAGE_MEDIA	                : `${BASE_ACTIONS}_GET_DETAIL_COMMENT_IMAGE_MEDIA`,
    REACTION_COMMENT_IMAGE               		    : `${BASE_ACTIONS}_REACTION_COMMENT_IMAGE`,
    GET_LIST_REACTION_COMMENT_IMAGE     		    : `${BASE_ACTIONS}_GET_LIST_REACTION_COMMENT_IMAGE`,
    REPLY_COMMENT_IMAGE_MEDIA     		            : `${BASE_ACTIONS}_REPLY_COMMENT_IMAGE_MEDIA`,

    /**
     * COMMENT
     */
    COMMENT_INSERT                                  : `${BASE_ACTIONS}_${COMMENT}_INSERT`,
    COMMENT_GET_INFO_AND_GET_LIST                   : `${BASE_ACTIONS}_${COMMENT}_GET_INFO_AND_GET_LIST`,
    DELETE_COMMENT_MEDIA	                    	: `${BASE_ACTIONS}_${COMMENT}_DELETE`,
}

exports.CF_ACTIONS_MEDIA = CF_ACTIONS_MEDIA;