"use strict";

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_MEDIA } 	            = require('./helper/media.actions-constant');

/**
 * HANDLERS
 */
const MEDIA_HANDLER    					= require('./handler/media-handler');
const MEDIA__COMMENT_HANDLER    		= require('./handler/media.comment-handler');
const MEDIA__MENU_HANDLER				= require('./handler/media.menu-handler');
const MEDIA__TAG_HANDLER				= require('./handler/media.tag-handler');
const MEDIA__QUESTION_HANDLER			= require('./handler/media.question-handler');
const MEDIA__BANNER_HANDLER				= require('./handler/media.banner-handler');

module.exports = {
	name: CF_DOMAIN_SERVICES.MEDIA,
	mixins: [
		DbService('media'),
		DbService('media_comment'),
		DbService('media_menu'),
		DbService('media_tag'),
		DbService('media_question'),
		DbService('media_banner'),
		CacheCleaner([CF_DOMAIN_SERVICES.MEDIA])
    ],

	/**
	* Service metadata
	*/
	metadata: {

	},

	/**
	* Service dependencies
	*/
	dependencies: [
		CF_DOMAIN_SERVICES.AUTH
	],

	/**
	* Actions
	*/
	actions: {

		// ================================  MEDIA  ================================
		[CF_ACTIONS_MEDIA.INSERT_MEDIA] 		            			: MEDIA_HANDLER.insert,
		[CF_ACTIONS_MEDIA.UPDATE_MEDIA] 		            			: MEDIA_HANDLER.update,
		[CF_ACTIONS_MEDIA.DELETE_MEDIA] 		            			: MEDIA_HANDLER.delete,
		[CF_ACTIONS_MEDIA.MEDIA_GET_INFO_AND_GET_LIST] 					: MEDIA_HANDLER.getInfoAndGetList,
		[CF_ACTIONS_MEDIA.MEDIA_GET_LIST_BY_PROPERTY]					: MEDIA_HANDLER.getListByProperty,

		// ================================  MEDIA COMMENT  ================================
		[CF_ACTIONS_MEDIA.INSERT_COMMENT_MEDIA]   						: MEDIA__COMMENT_HANDLER.insert,
		[CF_ACTIONS_MEDIA.UPDATE_COMMENT_MEDIA]            				: MEDIA__COMMENT_HANDLER.update,
		[CF_ACTIONS_MEDIA.DELETE_COMMENT_MEDIA]            				: MEDIA__COMMENT_HANDLER.delete,
		[CF_ACTIONS_MEDIA.GET_INFO_AND_GET_LIST_COMMENT_MEDIA]			: MEDIA__COMMENT_HANDLER.getInfoAndGetList,

		//========================================== MEDIA_MENU ==============================================//
		[CF_ACTIONS_MEDIA.MENU_INSERT]									: MEDIA__MENU_HANDLER.insert,
		[CF_ACTIONS_MEDIA.MENU_UPDATE]									: MEDIA__MENU_HANDLER.update,
		[CF_ACTIONS_MEDIA.MENU_REMOVE]									: MEDIA__MENU_HANDLER.remove,
		[CF_ACTIONS_MEDIA.MENU_GET_INFO_AND_GET_LIST]					: MEDIA__MENU_HANDLER.getInfoAndGetList,

		//========================================== MEDIA_TAG ==============================================//
		[CF_ACTIONS_MEDIA.TAG_INSERT]									: MEDIA__TAG_HANDLER.insert,
		[CF_ACTIONS_MEDIA.TAG_UPDATE]									: MEDIA__TAG_HANDLER.update,
		[CF_ACTIONS_MEDIA.TAG_REMOVE]									: MEDIA__TAG_HANDLER.remove,
		[CF_ACTIONS_MEDIA.TAG_GET_INFO_AND_GET_LIST]					: MEDIA__TAG_HANDLER.getInfoAndGetList,

		//========================================== MEDIA_QUESTION ==============================================//
		[CF_ACTIONS_MEDIA.QUESTION_INSERT]								: MEDIA__QUESTION_HANDLER.insert,
		[CF_ACTIONS_MEDIA.QUESTION_UPDATE]								: MEDIA__QUESTION_HANDLER.update,
		[CF_ACTIONS_MEDIA.QUESTION_REMOVE]								: MEDIA__QUESTION_HANDLER.remove,
		[CF_ACTIONS_MEDIA.QUESTION_GET_INFO_AND_GET_LIST]				: MEDIA__QUESTION_HANDLER.getInfoAndGetList,

		//========================================== MEDIA_BANNER ==============================================//
		[CF_ACTIONS_MEDIA.BANNER_INSERT]								: MEDIA__BANNER_HANDLER.insert,
		[CF_ACTIONS_MEDIA.BANNER_UPDATE]								: MEDIA__BANNER_HANDLER.update,
		[CF_ACTIONS_MEDIA.BANNER_REMOVE]								: MEDIA__BANNER_HANDLER.remove,
		[CF_ACTIONS_MEDIA.BANNER_GET_INFO_AND_GET_LIST]					: MEDIA__BANNER_HANDLER.getInfoAndGetList,
	},

	/**
	* Events
	*/
	events: {

	},

	/**
	* Methods
	*/
	methods: {

	},

	/**
	 * Service created lifecycle event handler
	*/
	created() {

	},

	/**
	* Service started lifecycle event handler
	*/
	async started() {

	},

	/**
	* Service stopped lifecycle event handler
	*/
	async stopped() {

	}
}