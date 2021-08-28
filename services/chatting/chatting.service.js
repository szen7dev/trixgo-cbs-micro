"use strict";

const DbService                	    	= require("../../tools/mixins/db.mixin");
const CacheCleaner                	    = require("../../tools/mixins/cache.cleaner.mixin");

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../gateway/helper/domain.constant');
const { CF_ACTIONS_CHATTING } 	        = require('./helper/chatting.actions-constant');

/**
 * HANDLERS
 */
const CHATTING__CONVERSATION_HANDLER    = require('./handler/chatting.conversation-handler');
const CHATTING__MESSAGE_HANDLER         = require('./handler/chatting.message-handler');

module.exports = {
	name: CF_DOMAIN_SERVICES.CHATTING,
	mixins: [
		DbService('message_messages'),
		DbService('message_conversations'),
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
	dependencies: [
		CF_DOMAIN_SERVICES.AUTH
	],

	/**
	* Actions
	*/
	actions: {
		// ======================  CONVERSATION ===========================

		// Thêm cuộc hội thoại mới
		[CF_ACTIONS_CHATTING.INSERT_CONVERSATION] 		            			: CHATTING__CONVERSATION_HANDLER.insertConversation,

		// Cập nhật cuộc hội thoại
		[CF_ACTIONS_CHATTING.UPDATE_CONVERSATION] 		            			: CHATTING__CONVERSATION_HANDLER.updateConversation,

		// Thêm thành viên cuộc hội thoại
		[CF_ACTIONS_CHATTING.ADD_MEMBER_CONVERSATION] 		    				: CHATTING__CONVERSATION_HANDLER.addMembersToConversation,

		// Xoá thành viên cuộc hội thoại
		[CF_ACTIONS_CHATTING.REMOVE_MEMBER_CONVERSATION] 		    			: CHATTING__CONVERSATION_HANDLER.removeMemberInConversation,

		// Cập nhật admin cho cuộc hội thoại
		[CF_ACTIONS_CHATTING.UPDATE_ADMIN_CONVERSATION] 		    			: CHATTING__CONVERSATION_HANDLER.updateAdminConversation,

		// Cập nhật cài đặt cho cuộc hội thoại
		[CF_ACTIONS_CHATTING.UPDATE_CONFIG_CONVERSATION] 		    			: CHATTING__CONVERSATION_HANDLER.updateConfigConversation,

		// Cập nhật pin cuộc hội thoại
		[CF_ACTIONS_CHATTING.UPDATE_PIN_CONVERSATION] 		    				: CHATTING__CONVERSATION_HANDLER.updatePinConversation,

		// Lấy danh sách thành viên cuộc hội thoại theo ID
		[CF_ACTIONS_CHATTING.GET_LIST_MEMBER_CONVERSATION_BY_ID]    			: CHATTING__CONVERSATION_HANDLER.getListMembersConversationByID,

		// Lấy thông tin một cuộc hội thoại theo ID
		[CF_ACTIONS_CHATTING.GET_INFO_CONVERSATION_BY_ID] 						: CHATTING__CONVERSATION_HANDLER.getInfoConversationByID,

		// Xem các nhóm chung với 1 thành viên
		[CF_ACTIONS_CHATTING.GET_INFO_GENERAL_GROUP_BY_MEMBER] 					: CHATTING__CONVERSATION_HANDLER.getInfoGeneralGroupsByMember,

		// Lấy danh sách tin nhắn media cuộc hội thoại
		[CF_ACTIONS_CHATTING.GET_LIST_MESSAGE_MEDIA_CONVERSATION] 				: CHATTING__CONVERSATION_HANDLER.getListMessagesMediaConversation,

		// Lấy danh sách thành viên gửi tin nhắn media cuộc hội thoại
		[CF_ACTIONS_CHATTING.GET_LIST_MEMBER_SEND_MESSAGE_MEDIA_CONVERSATION] 	: CHATTING__CONVERSATION_HANDLER.getListMemberSendMessagesMediaConversation,

		// Cập nhật trạng thái ẩn cuộc hội thoại của 1 user
		[CF_ACTIONS_CHATTING.UPDATE_HIDE_CONVERSATION] 							: CHATTING__CONVERSATION_HANDLER.updateHideConversation,

		// Cập nhật on/off thông báo cuộc hội thoại của 1 user
		[CF_ACTIONS_CHATTING.UPDATE_MUTE_CONVERSATION] 							: CHATTING__CONVERSATION_HANDLER.updateMuteConversation,

		// Đánh dấu đã đọc cuộc hội thoại của 1 user
		[CF_ACTIONS_CHATTING.MARK_READ_CONVERSATION] 							: CHATTING__CONVERSATION_HANDLER.markReadConversation,

		// Member rời khỏi cuộc hội thoại
		[CF_ACTIONS_CHATTING.MEMBER_LEAVE_CONVERSATION] 						: CHATTING__CONVERSATION_HANDLER.memberLeaveConversation,

		// Giải tán cuộc hội thoại (xóa nhóm)
		[CF_ACTIONS_CHATTING.DELETE_CONVERSATION] 								: CHATTING__CONVERSATION_HANDLER.deleteConversation,

		// Xoá lịch sử cuộc hội thoại
		[CF_ACTIONS_CHATTING.DELETE_HISTORY_CONVERSATION] 						: CHATTING__CONVERSATION_HANDLER.deleteHistoryConversation,

		// Danh sách cuộc hội thoại (hoặc tìm kiếm theo tên)
		[CF_ACTIONS_CHATTING.GET_LIST_CONVERSATION_WITH_PAGE]					: CHATTING__CONVERSATION_HANDLER.getListConversationWithPage,


		// =========================  MESSAGE  ============================

		// Lấy danh sách tin nhắn cuộc hội thoại (phân trang)
		[CF_ACTIONS_CHATTING.GET_LIST_MESSAGE_CONVERSATION_WITH_PAGE] 			: CHATTING__CONVERSATION_HANDLER.getListMessagesConversationWithPage,

		// Tìm kiếm tin nhắn cuộc hội thoại (Dữ liệu trả về là 5 tin nhắn trước và sau tin nhắn tìm thấy)
		[CF_ACTIONS_CHATTING.SEARCH_MESSAGE_CONVERSATION_BY_ID] 				: CHATTING__CONVERSATION_HANDLER.searchMessageConversationById,

		// Thêm tin nhắn trong cuộc hội thoại (text, emoij, tag name)
		[CF_ACTIONS_CHATTING.INSERT_MESSAGE_CONVERSATION] 						: CHATTING__MESSAGE_HANDLER.insertMessage,

		// Xoá tin nhắn của cuộc hội thoại (media, text)
		[CF_ACTIONS_CHATTING.DELETE_MESSAGE_CONVERSATION] 						: CHATTING__MESSAGE_HANDLER.deleteMessage,

		// Thu hồi tin nhắn của cuộc hội thoại (media, text)
		[CF_ACTIONS_CHATTING.REVOKE_MESSAGE_CONVERSATION] 						: CHATTING__MESSAGE_HANDLER.revokeMessage,

		// Chia sẻ tin nhắn đến các cuộc hội thoại 
		[CF_ACTIONS_CHATTING.SHARE_MESSAGE_CONVERSATION] 						: CHATTING__MESSAGE_HANDLER.shareMessageConversation,





		// AUTHOR: VinhVH

		// // Lấy danh sách các cuộc hội thoại phân trang 20 mẫu tin
		// [CF_ACTIONS_CHATTING.GET_LIST_CONVERSATION_BY_USER_ID] 		: CHATTING__CONVERSATION_HANDLER.getListConversationByUserID,

		// Lấy danh sách link của cuộc hội thoại
		[CF_ACTIONS_CHATTING.GET_LINKS_CONVERSATION_BY_ID] 			: CHATTING__CONVERSATION_HANDLER.getLinkConversationByID,
		
		// Lấy danh sách file của cuộc hội thoại
		[CF_ACTIONS_CHATTING.GET_INFO_CONVERSATION_FILE_BY_ID] 		: CHATTING__CONVERSATION_HANDLER.getFileConversationByID,
		
		// Lấy bản nháp đang soạn của một user trong một cuộ hội thoại
		// [CF_ACTIONS_CHATTING.GET_INFO_CONVERSATION_DRAFT] 			: CHATTING__CONVERSATION_HANDLER.getConversationDraftByUserID,
		

		// // Xem các tệp của cuộc hội thoại [****** để sau]

		// // Danh sách cuộc hội thoại có tin nhắn chưa đọc
		// [CF_ACTIONS_CHATTING.GET_LIST_CONVERSATION_MISS_BY_USER_ID] : CHATTING__CONVERSATION_HANDLER.getListConversationMissMessageByUserID,

		// // Lấy danh sách link của cuộc hội thoại
		// [CF_ACTIONS_CHATTING.GET_LINKS_CONVERSATION_BY_ID] 			: CHATTING__CONVERSATION_HANDLER.getLinkConversationByID,

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
