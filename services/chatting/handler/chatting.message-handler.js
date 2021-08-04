/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const CHATTING__MESSAGE_MODEL                   = require('../model/chatting.message-model').MODEL;


module.exports = {
    // EXAMPLE
    // insertFast: {
    //     params: {
    //         name: { type: "string" }
    //     },
    //     async handler(ctx) {
    //         try {
    //             let { name }        = ctx.params;
    //             // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)

	// 			await this.validateEntity(name);

    //             let resultAfterCallHandler = await AUTH__COMPANY_MODEL.insertFast({ name });

    //             return resultAfterCallHandler;
    //         } catch (error) {
    //             return error;
    //         }
    //     }
    // },

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
    }

}
