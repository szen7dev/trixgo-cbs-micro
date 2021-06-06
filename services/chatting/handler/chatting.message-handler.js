let CHATTING__CONVERSATION_MODEL              = require('../model/chatting.conversation-model').MODEL;
let CHATTING__MESSAGE_MODEL                   = require('../model/chatting.message-model').MODEL;


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
        },
        async handler(ctx) {
            try {
                let {  currentPage, conversationID }        = ctx.params;

                // if(!conversationID){
                //     conversationID = '602c7a51ea1d1274020b2e08';
                // }
                // if(!currentPage){
                //     currentPage = 1;
                // }
                
                let resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.getMessageByConversationIDWithPage({ conversationID, userID: '5e60f58cf63b8a4e196a1942', currentPage });
                console.log({resultAfterCallHandler})
                return resultAfterCallHandler;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    }

    //================================================================ END MESAGE  ============================================================


}