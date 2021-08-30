/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const CHATTING__MESSAGE_MODEL                   = require('../model/chatting.message-model').MODEL;


module.exports = {
    /**
	 * ============================ ****************** ===============================
	 * ============================ 	 MESSAGE  	   ===============================
	 * ============================ ****************** ===============================
	 */

	/**
	 * Dev: MinhVH
	 * Func: Thêm tin nhắn trong cuộc hội thoại
	 * Date: 17/08/2021
	 */
	insertMessage: {
        params: {
			conversationID  : { type: "string" },
            parentID		: { type: "string", optional: true },
            type 			: { type: "string" },
            content 		: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: senderID } = ctx.meta.infoUser;
                const { conversationID, parentID, content, type, files, usersAssigned } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.insertMessage({
					conversationID, senderID, parentID, content, type, files, usersAssigned, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật Danh sách đã xem tin nhắn trong cuộc hội thoại
	 * Date: 30/08/2021
	 */
	updateSeenMessage: {
        params: {
			conversationID  : { type: "string" },
            messageID		: { type: "string" }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { conversationID, messageID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.updateSeenMessage({
					conversationID, messageID, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Xoá tin nhắn của cuộc hội thoại (media, text)
	 * Date: 16/08/2021
	 * Updated: 28/08/2021 - MinhVH
	 */
	deleteMessage: {
        params: {
			conversationID  : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { conversationID, messagesID, filesID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.deleteMessage({
					conversationID, userID, messagesID, filesID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Thu hồi tin nhắn của cuộc hội thoại (media, text)
	 * Date: 16/08/2021
	 * Updated: 28/08/2021 - MinhVH
	 */
	revokeMessage: {
        params: {
			conversationID  : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { conversationID, messagesID, filesID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.revokeMessage({
					conversationID, userID, messagesID, filesID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Chia sẻ tin nhắn đến các cuộc hội thoại 
	 * Date: 23/08/2021
	 */
	shareMessageConversation: {
        params: {},
        async handler(ctx) {
            try {
				const { _id: userID } = ctx.meta.infoUser;
                const { conversationsID, messagesID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.shareMessageConversation({
					conversationsID, messagesID, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Pin 1 tin nhắn trong cuộc hội thoại 
	 * Date: 25/08/2021
	 */
	updatePinMessageConversation: {
        params: {
			conversationID	: { type: 'string' },
			messageID		: { type: 'string' },
			isPin			: { type: 'string' },
		},
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { conversationID, messageID, isPin } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.updatePinMessageConversation({
					conversationID, messageID, userID, isPin
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Danh sách tin nhắn được pin trong cuộc hội thoại (phân trang)
	 * Date: 28/08/2021
	 */
	getListMessagePinConversation: {
        params: {
			conversationID	: { type: 'string' },
			page			: { type: 'string', optional: true },
			limit			: { type: 'string', optional: true },
		},
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { conversationID, page, limit } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.getListMessagePinConversation({
					conversationID, page, limit, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Thêm tin nhắn bình chọn trong cuộc hội thoại 
	 * Date: 25/08/2021
	 */
	insertMessagePoll: {
        params: {
			conversationID	: { type: 'string' },
			name			: { type: 'string' },
		},
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { conversationID, name, options } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.insertMessagePoll({
					conversationID, name, options, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật tin nhắn bình chọn trong cuộc hội thoại
	 * Date: 28/08/2021
	 */
	updateMessagePoll: {
        params: {
			conversationID	: { type: 'string' },
			messageID		: { type: 'string' },
		},
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { conversationID, messageID, newVotes, votesCancel, newOptions } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.updateMessagePoll({
					conversationID, messageID, newVotes, votesCancel, newOptions, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Đóng tin nhắn bình chọn trong cuộc hội thoại
	 * Date: 29/08/2021
	 */
	closeMessagePoll: {
        params: {
			conversationID	: { type: 'string' },
			messageID		: { type: 'string' },
		},
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { conversationID, messageID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.closeMessagePoll({
					conversationID, messageID, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Danh sách tin nhắn bình chọn trong cuộc hội thoại
	 * Date: 30/08/2021
	 */
	getListMessagePoll: {
        params: {
			conversationID		: { type: "string" },
            lastestMessageID 	: { type: "string", optional: true }
		},
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { conversationID, lastestMessageID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.getListMessagePoll({
					conversationID, lastestMessageID, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
	

}
