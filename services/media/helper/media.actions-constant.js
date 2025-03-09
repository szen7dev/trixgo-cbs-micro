const BASE_ACTIONS            = 'ACT_MEDIA';

const COMMENT                 = 'COMMENT';
const MENU                    = 'MENU';
const TAG                     = 'TAG';
const QUESTION                = 'QUESTION';
const BANNER                  = 'BANNER';

const CF_ACTIONS_MEDIA = {
	/**
     * MEDIA
     */
	INSERT_MEDIA                  		          : `${BASE_ACTIONS}_INSERT`,
	UPDATE_MEDIA                  			     : `${BASE_ACTIONS}_UPDATE`,
	DELETE_MEDIA                  			     : `${BASE_ACTIONS}_DELETE`,
	MEDIA_GET_INFO_AND_GET_LIST                       : `${BASE_ACTIONS}_GET_INFO_AND_GET_LIST`,
	UPDATE_VIEW_MEDIA                  		     : `${BASE_ACTIONS}_UPDATE_VIEW_MEDIA`,

     /**
     * MENU
     */
	MENU_INSERT                		               : `${BASE_ACTIONS}_${MENU}_INSERT`,
	MENU_UPDATE                 			          : `${BASE_ACTIONS}_${MENU}_UPDATE`,
	MENU_REMOVE                			          : `${BASE_ACTIONS}_${MENU}_REMOVE`,
	MENU_GET_INFO_AND_GET_LIST                        : `${BASE_ACTIONS}_${MENU}_GET_INFO_AND_GET_LIST`,

     /**
     * BANNER
     */
	BANNER_INSERT                		               : `${BASE_ACTIONS}_${BANNER}_INSERT`,
	BANNER_UPDATE                 			     : `${BASE_ACTIONS}_${BANNER}_UPDATE`,
	BANNER_REMOVE                			          : `${BASE_ACTIONS}_${BANNER}_REMOVE`,
	BANNER_GET_INFO_AND_GET_LIST                      : `${BASE_ACTIONS}_${BANNER}_GET_INFO_AND_GET_LIST`,

     /**
     * TAG
     */
	TAG_INSERT                		               : `${BASE_ACTIONS}_${TAG}_INSERT`,
	TAG_UPDATE                 			          : `${BASE_ACTIONS}_${TAG}_UPDATE`,
	TAG_REMOVE                			          : `${BASE_ACTIONS}_${TAG}_REMOVE`,
	TAG_GET_INFO_AND_GET_LIST                        : `${BASE_ACTIONS}_${TAG}_GET_INFO_AND_GET_LIST`,

     /**
     * QUESTION
     */
	QUESTION_INSERT                		               : `${BASE_ACTIONS}_${QUESTION}_INSERT`,
	QUESTION_UPDATE                 			          : `${BASE_ACTIONS}_${QUESTION}_UPDATE`,
	QUESTION_REMOVE                			          : `${BASE_ACTIONS}_${QUESTION}_REMOVE`,
	QUESTION_GET_INFO_AND_GET_LIST                        : `${BASE_ACTIONS}_${QUESTION}_GET_INFO_AND_GET_LIST`,

    /**
     * COMMENT
     */
    INSERT_COMMENT_MEDIA                               : `${BASE_ACTIONS}_${COMMENT}_INSERT_COMMENT_MEDIA`,
    GET_INFO_AND_GET_LIST_COMMENT_MEDIA                : `${BASE_ACTIONS}_${COMMENT}_GET_INFO_AND_GET_LIST_COMMENT_MEDIA`,
    UPDATE_COMMENT_MEDIA	                    	     : `${BASE_ACTIONS}_${COMMENT}_UPDATE_COMMENT_MEDIA`,
    DELETE_COMMENT_MEDIA	                    	     : `${BASE_ACTIONS}_${COMMENT}_DELETE_COMMENT_MEDIA`,
}

exports.CF_ACTIONS_MEDIA = CF_ACTIONS_MEDIA;