let CHATTING__MESSAGE_MODEL                   = require('../model/chatting.message-model').MODEL;
let { CF_DATA_DEMO_CHATTING }                 = require('../helper/chatting.data-demo-constant')

let { renderStatusCode }                            = require('../../../tools/utils/status_code');

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

    // AUTHOR : HUYNHVINH

   
    //================================================================  MESAGE  ============================================================

    // Lấy danh sách tin nhắn của cuộc hội thoại
    getListMessageByConversationID: {
        params: {
            currentPage     : { type: "string" },
            conversationID  : { type: "string" },
            userID          : { type: "string" },
            latestMessageID : { type: "string" },
        },
        async handler(ctx) {
            try {
                let {  currentPage, conversationID, userID, latestMessageID }        = ctx.params;
                let resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.getMessageByConversationIDWithPage({ latestMessageID, conversationID, userID, currentPage });
                renderStatusCode({ resultAfterCallHandler, ctx })
                return resultAfterCallHandler;
            } catch (error) {
                renderStatusCode({ resultAfterCallHandler: null, ctx })
                return { error:  true, message: error.message };
            }
        }
    }
    //================================================================ END MESAGE  ============================================================
}