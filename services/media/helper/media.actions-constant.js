const BASE_ACTIONS = 'ACT_MEDIA';
const COMMENT      = 'COMMENT';
const MENU      = 'MENU';
const CATE      = 'CATE';
const TAG      = 'TAG';
const QUESTION      = 'QUESTION';

const CF_ACTIONS_MEDIA = {
	/**
     * MEDIA
     */
	INSERT_MEDIA                  		          : `${BASE_ACTIONS}_INSERT`,
	UPDATE_MEDIA                  			     : `${BASE_ACTIONS}_UPDATE`,
	DELETE_MEDIA                  			     : `${BASE_ACTIONS}_DELETE`,
	INFO_MEDIA                  			          : `${BASE_ACTIONS}_INFO`,
	LIST_MEDIA                  			          : `${BASE_ACTIONS}_LIST`,
	UPDATE_VIEW_MEDIA                  		     : `${BASE_ACTIONS}_UPDATE_VIEW_MEDIA`,
	LIST_SEEN_MEDIA                  			     : `${BASE_ACTIONS}_LIST_SEEN_MEDIA`,

     /**
     * MENU
     */
	MENU_INSERT                		               : `${BASE_ACTIONS}_${MENU}_INSERT`,
	MENU_UPDATE                 			          : `${BASE_ACTIONS}_${MENU}_UPDATE`,
	MENU_REMOVE                			          : `${BASE_ACTIONS}_${MENU}_REMOVE`,
	MENU_GET_INFO_AND_GET_LIST                        : `${BASE_ACTIONS}_${MENU}_GET_INFO_AND_GET_LIST`,

     /**
     * CATE
     */
	CATE_INSERT                		               : `${BASE_ACTIONS}_${CATE}_INSERT`,
	CATE_UPDATE                 			          : `${BASE_ACTIONS}_${CATE}_UPDATE`,
	CATE_REMOVE                			          : `${BASE_ACTIONS}_${CATE}_REMOVE`,
	CATE_GET_INFO_AND_GET_LIST                        : `${BASE_ACTIONS}_${CATE}_GET_INFO_AND_GET_LIST`,

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
      * FILE MEDIA
      */
     GET_INFO_AND_GET_LIST_MEMDIA_FILE                 : `${BASE_ACTIONS}_${COMMENT}_GET_INFO_AND_GET_LIST_MEMDIA_FILE`,

     /**
     * SAVE MEDIA
     */
	LIST_SAVE_MEDIA                  				: `${BASE_ACTIONS}_LIST_SAVE_MEDIA`,
	SAVE_MEDIA                  					: `${BASE_ACTIONS}_SAVE_MEDIA`,

    /**
     * PIN MEDIA
     */
	LIST_PIN_MEDIA                  				: `${BASE_ACTIONS}_LIST_PIN_MEDIA`,
	PIN_MEDIA                  					: `${BASE_ACTIONS}_PIN_MEDIA`,

    /**
     * REACTION
     */
    REACTION_MEDIA                              	     : `${BASE_ACTIONS}_REACTION_MEDIA`,
    GET_LIST_REACTION_MEDIA                     	     : `${BASE_ACTIONS}_GET_LIST_REACTION_MEDIA`,
    REACTION_FILE               		        	     : `${BASE_ACTIONS}_REACTION_FILE`,
    GET_LIST_REACTION_FILE     		        	     : `${BASE_ACTIONS}_GET_LIST_REACTION_FILE`,
    REACTION_COMMENT_MEDIA                             : `${BASE_ACTIONS}_${COMMENT}_REACTION_MEDIA`,
    REACTION_COMMENT_FILE                              : `${BASE_ACTIONS}_${COMMENT}_REACTION_FILE`,
    GET_LIST_REACTION_COMMENT                     	: `${BASE_ACTIONS}_${COMMENT}_GET_LIST_REACTION`,

    /**
     * COMMENT
     */
    INSERT_COMMENT_MEDIA                               : `${BASE_ACTIONS}_${COMMENT}_INSERT_COMMENT_MEDIA`,
    GET_INFO_AND_GET_LIST_COMMENT_MEDIA                : `${BASE_ACTIONS}_${COMMENT}_GET_INFO_AND_GET_LIST_COMMENT_MEDIA`,
    UPDATE_COMMENT_MEDIA	                    	     : `${BASE_ACTIONS}_${COMMENT}_UPDATE_COMMENT_MEDIA`,
    DELETE_COMMENT_MEDIA	                    	     : `${BASE_ACTIONS}_${COMMENT}_DELETE_COMMENT_MEDIA`,
    INSERT_COMMENT_FILE                                : `${BASE_ACTIONS}_${COMMENT}_INSERT_COMMENT_FILE`,
    GET_INFO_AND_GET_LIST_COMMENT_FILE                 : `${BASE_ACTIONS}_${COMMENT}_GET_INFO_AND_GET_LIST_COMMENT_FILE`,
    UPDATE_COMMENT_FILE	                    	     : `${BASE_ACTIONS}_${COMMENT}_UPDATE_COMMENT_FILE`,
    DELETE_COMMENT_FILE	                    	     : `${BASE_ACTIONS}_${COMMENT}_DELETE_COMMENT_FILE`,
}

exports.CF_ACTIONS_MEDIA = CF_ACTIONS_MEDIA;