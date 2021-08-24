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
	 * Dev: VinhHV
	 * Func: Lấy danh sách tin nhắn của cuộc hội thoại
	 * Date: ...
	 * Updated: MinhVH - 03/08/2021
	 */
    getListMessageByConversationID: {
        params: {
			conversationID  : { type: "string" },
            userID          : { type: "string" },
            latestMessageID : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { conversationID, userID, latestMessageID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.getMessageByConversationIDWithPage({
					conversationID, userID, latestMessageID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Thêm tin nhắn trong cuộc hội thoại
	 * Date: 17/08/2021
	 */
	insertMessage: {
        params: {
			conversationID  : { type: "string" },
            type 			: { type: "string" },
            content 		: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: senderID } = ctx.meta.infoUser;
                const { conversationID, content, type, files, membersAssigned } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.insertMessage({
					conversationID, senderID, content, type, files, membersAssigned, ctx
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
	 */
	deleteMessage: {
        params: {
			conversationID  : { type: "string" },
            typeMessage 	: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { conversationID, messagesID, typeMessage, filesID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.deleteMessage({
					conversationID, userID, messagesID, typeMessage, filesID
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
	 */
	revokeMessage: {
        params: {
			conversationID  : { type: "string" },
			typeMessage 	: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { conversationID, messagesID, typeMessage, filesID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.revokeMessage({
					conversationID, userID, messagesID, typeMessage, filesID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

}
