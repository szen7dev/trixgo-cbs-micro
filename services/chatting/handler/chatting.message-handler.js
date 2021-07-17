/**
 * MODELS
 */
let CHATTING__MESSAGE_MODEL                   = require('../model/chatting.message-model').MODEL;

/**
 * UTILS
 */
let { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');


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

    //==============================  MESSAGE  ================================

	/**
	 * Dev: VinhHV
	 * Func: Lấy danh sách tin nhắn của cuộc hội thoại
	 * Date: ...
	 */
    getListMessageByConversationID: {
        params: {
            currentPage     : { type: "string" },
            conversationID  : { type: "string" },
            userID          : { type: "string" },
            latestMessageID : { type: "string" },
        },
        async handler(ctx) {
            try {
                let { currentPage, conversationID, userID, latestMessageID } = ctx.params;

                let resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.getMessageByConversationIDWithPage({
					latestMessageID, conversationID, userID, currentPage 
				});
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    }

    //============================ END MESSAGE  ============================
}
