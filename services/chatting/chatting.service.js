"use strict";
const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_CHATTING } 	        = require('./helper/chatting.actions-constant');
const CHATTING__CONVERSATION_HANDLER    = require('./handler/chatting.convensation-handler');
const CHATTING__MESSAGE_HANDLER         = require('./handler/chatting.message-handler');

module.exports = {
	name: CF_DOMAIN_SERVICES.CHATTING,
	mixins: [
		// DbService(CATEGORY_COLL), 
		DbService('message_messages'),  
	
		DbService('message_conversations'), 
		DbService('message_conversation_drafts'),  
		DbService('message_conversation_links'),  
		
		DbService('users'),  

		CacheCleaner([CF_DOMAIN_SERVICES.CHATTING])
    ],
    
	/**
	 	* Service settings
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
		[CF_ACTIONS_CHATTING.GET_INFO_CONVERSATION_BY_ID] 			: CHATTING__CONVERSATION_HANDLER.getListConversationByID,
		
		// Lấy danh sách thành viên cuộc hội thoại theo ID
		[CF_ACTIONS_CHATTING.GET_LIST_MEMBER_CONVERSATION_BY_ID]    : CHATTING__CONVERSATION_HANDLER.getListMemberByID,
		
		// Xem các tệp của cuộc hội thoại [****** để sau]

		// Danh sách cuộc hội thoại có tin nhắn chưa đọc
		[CF_ACTIONS_CHATTING.GET_LIST_CONVERSATION_MISS_BY_USER_ID] : CHATTING__CONVERSATION_HANDLER.getConversationsMissByUserID,

		// Tìm kiếm cuộc hội thoại theo dự án [chưa có]

		// Lấy danh sách link của cuộc hội thoại
		[CF_ACTIONS_CHATTING.GET_LINKS_CONVERSATION_BY_ID] 		: CHATTING__CONVERSATION_HANDLER.getLinkConversationByID,
		
		// Lấy bản nháp đang soạn của một user trong một cuộ hội thoại
		[CF_ACTIONS_CHATTING.GET_INFO_CONVERSATION_DRAFT] 		: CHATTING__CONVERSATION_HANDLER.getConversationDraftByUserID,


		//================================================================   	MESSAGE ACTIONS 		=================================================================

		// Lây tin nhắn của cuộc hội thoại phân trang 30 mẫu tin
		[CF_ACTIONS_CHATTING.GET_LIST_MESSAGE_BY_CONVERSATION_ID] 	: CHATTING__MESSAGE_HANDLER.getListMessageByConversationID,

		// Tìm kiếm tinh nhắn trong một cuộc hội thoại [******** để sau]


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
