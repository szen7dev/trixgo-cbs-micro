let CHATTING__MESSAGE_MODEL                   = require('../model/chatting.message-model').MODEL;
let { CF_DATA_DEMO_CHATTING }                 = require('../helper/chatting.data-demo-constant')


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
            nextInfo        : { type: "string" },

        },
        async handler(ctx) {
            try {
                let {  currentPage, conversationID, nextInfo }        = ctx.params;

                // if(!conversationID){
                //     conversationID = '602c7a51ea1d1274020b2e08';
                // }
                // if(!currentPage){
                //     currentPage = 1;
                // }
                //'5e60f58cf63b8a4e196a1942'
                // if(!nextInfo){
                //     nextInfo =  `2021-05-06T10:13:15.000Z_6093ca895ad4a270bce7234d`
                // }
                let resultAfterCallHandler = await CHATTING__MESSAGE_MODEL.getMessageByConversationIDWithPage({ conversationID, userID : CF_DATA_DEMO_CHATTING.userID_1, currentPage, nextInfo });
                return resultAfterCallHandler;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    }
    //================================================================ END MESAGE  ============================================================
}