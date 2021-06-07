"use strict";
const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_CHATTING } 	        = require('./helper/chatting.actions-constant');
const CHATTING__CONVERSATION_HANDLER    = require('./handler/chatting.convensation-handler');
const CHATTING__MESSAGE_HANDLER         = require('./handler/chatting.message-handler');
const CHATTING__EVENTS_CONSTANT   		= require('./helper/chatting.events-constant');

module.exports = {
	name: CF_DOMAIN_SERVICES.CHATTING,
	mixins: [
		// DbService(CATEGORY_COLL), 
		DbService('message_messages'),  
		DbService('message_conversations'), 
		CacheCleaner([CF_DOMAIN_SERVICES.CHATTING])
    ],
    
	/**
	* Service settings
	*/
	/**
	 * * Dữ liệu 1 - 1 => Populate 
	 * * Dữ liệu 1 - N hoặc N-N -> cần phải tách API (cần phải tách ra 1 bảng riêng, thay vì lưu [objectID])
	 */
	// settings: {
	// 	fields: ["_id", "name", "products"],
	// 	populates : {
	// 		"products": {
	// 			action: "products.get",
	// 			params: ["name"]
	// 		}
	// 	},
	// 	entityValidator: {
	// 		name: { type: "string"}
	// 	}
	// },

	/**
	 	* Service metadata
	*/
	metadata: {

	},

	/**
		* Service dependencies
	*/
	dependencies: [],

	/**
 		* Actions
	*/
	actions: {	
		//================================================================   CONVERSATION ACTIONS   =================================================================
		
		// Thêm cuộc hội thoại mới
		[CF_ACTIONS_CHATTING.INSERT_CONVERSATION] 		            : CHATTING__CONVERSATION_HANDLER.insert,
		
		// Lấy danh sách các cuộc hội thoại phân trang 20 mẫu tin
		[CF_ACTIONS_CHATTING.GET_LIST_CONVERSATION_BY_USER_ID] 		: CHATTING__CONVERSATION_HANDLER.getListConversationByUserID,

		// Tìm kiếm cuộc hội thoại theo tên + Api tìm kiếm  bạn bè (bạn bè cũng là 1 liên lạc)
		[CF_ACTIONS_CHATTING.GET_LIST_CONVERSATION_WITH_KEY] 		: CHATTING__CONVERSATION_HANDLER.getListConversationByKey,

		// Lấy thông tin một cuộc hội thoại theo ID
		[CF_ACTIONS_CHATTING.GET_LIST_CONVERSATION_BY_ID] 			: CHATTING__CONVERSATION_HANDLER.getListConversationByID,
		
		// Xem các tệp của cuộc hội thoại [****** để sau]

		// Danh sách bạn bè để thêm vào cuộc hội thoại ----> lấy từ api lấy thông tin user 

		//================================================================   	MESSAGE ACTIONS 		=================================================================

		// Lây tin nhắn của cuộc hội thoại phân trang 30 mẫu tin
		[CF_ACTIONS_CHATTING.GET_LIST_MESSAGE_BY_CONVERSATION_ID] 	: CHATTING__MESSAGE_HANDLER.getListMessageByConversationID,

		// Tìm kiếm tinh nhắn trong một cuộc hội thoại [******** để sau]
	},

	/**
	 	* Events
	*/
	events: {
		...CHATTING__EVENTS_CONSTANT
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
