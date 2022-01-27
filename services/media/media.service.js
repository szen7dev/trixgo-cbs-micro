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

module.exports = {
	name: CF_DOMAIN_SERVICES.MEDIA,
	mixins: [
		DbService('media'),
		DbService('media_file'),  
		DbService('media_reaction'),  
		DbService('media_comment'),  
		DbService('media_comment_image'),
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

		// ================================  MEDIA  ================================ //

		// ✅ 	THÊM BÀI VIẾT MỚI
		[CF_ACTIONS_MEDIA.INSERT_MEDIA] 		            			: MEDIA_HANDLER.insertMedia,

		// ✅	LẤY DANH SÁCH BÀI VIẾT 	
		[CF_ACTIONS_MEDIA.LIST_MEDIA] 		            			    : MEDIA_HANDLER.getListMedia,
		
		// ✅	CHỈNH SỬA BÀI VIẾT
		[CF_ACTIONS_MEDIA.UPDATE_MEDIA] 		            			: MEDIA_HANDLER.updateMedia,

		// ✅	XÓA BÀI VIẾT	
		[CF_ACTIONS_MEDIA.DELETE_MEDIA] 		            			: MEDIA_HANDLER.deleteMedia,

		// ✅	CHI TIẾT BÀI VIẾT	
		[CF_ACTIONS_MEDIA.INFO_MEDIA] 		            				: MEDIA_HANDLER.getInfoMedia,
		
		// ✅	LƯU BÀI VIẾT
		[CF_ACTIONS_MEDIA.SAVE_MEDIA] 		            				: MEDIA_HANDLER.saveMedia,
		
		// ✅	LẤY DANH SÁCH BÀI VIẾT ĐÃ LƯU
		[CF_ACTIONS_MEDIA.LIST_SAVE_MEDIA] 		            			: MEDIA_HANDLER.getListSaveMedia,
		
		// ✅	XÓA BÀI VIẾT ĐÃ LƯU
		[CF_ACTIONS_MEDIA.DELETE_SAVE_MEDIA] 		            		: MEDIA_HANDLER.deleteSaveMedia,
		
		// ✅	GHIM BÀI VIẾT
		[CF_ACTIONS_MEDIA.PIN_MEDIA] 		            				: MEDIA_HANDLER.pinMedia,

		// ✅	LẤY DANH SÁCH BÀI VIẾT ĐÃ GHIM
		[CF_ACTIONS_MEDIA.LIST_PIN_MEDIA] 		            			: MEDIA_HANDLER.getListPinMedia,

		// ✅	HỦY GHIM BÀI VIẾT
		[CF_ACTIONS_MEDIA.DELETE_PIN_MEDIA] 		            		: MEDIA_HANDLER.deletePinMedia,

		// ================================  MEDIA COMMENT  ================================ //

		[CF_ACTIONS_MEDIA.COMMENT_INSERT]   							: MEDIA__COMMENT_HANDLER.insert,
		[CF_ACTIONS_MEDIA.DELETE_COMMENT_MEDIA]            				: MEDIA__COMMENT_HANDLER.deleteComment,
		[CF_ACTIONS_MEDIA.COMMENT_GET_INFO_AND_GET_LIST]				: MEDIA__COMMENT_HANDLER.getInfoAndGetList,

		// ================================  MEDIA REACTION  ================================ //

		// ✅	THẢ CẢM XÚC VÀO COMMENT TRONG BÀI VIẾT
		[CF_ACTIONS_MEDIA.REACTION_COMMENT]            					: MEDIA_HANDLER.reactionComment,

		// ✅	LẤY DANH SÁCH CÁC USER ĐÃ THẢ CẢM XÚC VÀO COMMENT
		[CF_ACTIONS_MEDIA.GET_LIST_REACTION_COMMENT]   					: MEDIA_HANDLER.getListReactionComment,

		// ✅	THẢ CẢM XÚC TRONG BÀI VIẾT
		[CF_ACTIONS_MEDIA.REACTION_MEDIA] 		            			: MEDIA_HANDLER.reactionMedia,

		// ✅	LẤY DANH SÁCH USER ĐÃ THẢ CẢM XÚC TRONG BÀI VIẾT
		[CF_ACTIONS_MEDIA.GET_LIST_REACTION]							: MEDIA_HANDLER.getListReaction,


		// ================================  MEDIA IMAGE COMMENT  ================================ //

		// ✅	COMMENT ẢNH TRONG BÀI VIẾT
		[CF_ACTIONS_MEDIA.COMMENT_IMAGE_MEDIA]            			  	: MEDIA_HANDLER.commentImageMedia,

		// ✅	LẤY DANH SÁCH COMMENT ẢNH TRONG BÀI VIẾT
		[CF_ACTIONS_MEDIA.GET_LIST_COMMENT_IMAGE_MEDIA]            		: MEDIA_HANDLER.getListCommentImageMedia,

		// ✅	LẤY CHI TIẾT COMMENT TRONG BÀI VIẾT
		[CF_ACTIONS_MEDIA.GET_DETAIL_COMMENT_IMAGE_MEDIA]            	: MEDIA_HANDLER.getDetailCommentImageMedia,

		// ✅	CHỈNH SỬA COMMENT ẢNH TRONG BÀI VIẾT
		[CF_ACTIONS_MEDIA.UPDATE_COMMENT_IMAGE_MEDIA]            		: MEDIA_HANDLER.updateCommentImageMedia,

		// ✅	XÓA COMMENT ẢNH TRONG BÀI VIẾT
		[CF_ACTIONS_MEDIA.DELETE_COMMENT_IMAGE_MEDIA]            		: MEDIA_HANDLER.deleteCommentImageMedia,

		// ✅	TRẢ LỜI COMMENT ẢNH TRONG BÀI VIẾT
		[CF_ACTIONS_MEDIA.REPLY_COMMENT_IMAGE_MEDIA]         			: MEDIA_HANDLER.replyCommentImageMedia,

		// ================================  MEDIA IMAGE REACTION  ================================ //

		// ✅	THẢ CẢM XÚC TRONG ẢNH CỦA BÀI VIẾT
		[CF_ACTIONS_MEDIA.REACTION_IMAGE_MEDIA] 		            	: MEDIA_HANDLER.reactionImageMedia,

		// ✅	LẤY DANH SÁCH USER ĐÃ THẢ CẢM XÚC TRONG ẢNH CỦA BÀI VIẾT
		[CF_ACTIONS_MEDIA.GET_LIST_REACTION_IMAGE_MEDIA]            	: MEDIA_HANDLER.getListReactionImageMedia,

		// ✅	THẢ CẢM XÚC VÀO TRONG COMMENT ẢNH CỦA BÀI VIẾT
		[CF_ACTIONS_MEDIA.REACTION_COMMENT_IMAGE]            			: MEDIA_HANDLER.reactionCommentImage,

		// ✅	LẤY DANH SÁCH USER ĐÃ THẢ CẢM XÚC VÀO TRONG COMMENT ẢNH CỦA BÀI VIẾT
		[CF_ACTIONS_MEDIA.GET_LIST_REACTION_COMMENT_IMAGE]   			: MEDIA_HANDLER.getListReactionCommentImage,
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
};
