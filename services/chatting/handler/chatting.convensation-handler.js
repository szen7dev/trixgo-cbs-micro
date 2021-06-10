let CHATTING__CONVERSATION_MODEL              = require('../model/chatting.conversation-model').MODEL;
let { CF_DATA_DEMO_CHATTING }                 = require('../helper/chatting.data-demo-constant')
module.exports = {

    // AUTHOR : HUYNHVINH

    //================================================================ CONVERSATION  ============================================================
    // Thêm cuộc hội thoại mới
    insert: {
        params: {
            name        : { type: "string" },
            description : { type: "string" },
            authorID    : { type: "string" },
            receivers   : { type: "string" }
        },
        async handler(ctx) {
            try {
                let {  name, description, authorID, receivers }        = ctx.params;

                // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)

                // await this.validateEntity(name);

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.insertConversationMoreTowMember({ name, description, authorID, receivers });

                return resultAfterCallHandler;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    // Lấy danh sách cuộc hội thoại của một người dùng
    getListConversationByUserID: {
        params: {
            currentPage  : { type: "string" },
        },
        async handler(ctx) {
            try {
                let {  currentPage }        = ctx.params;
                // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)

                // await this.validateEntity(name);

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getListConversationByAuthorID({ authorID: CF_DATA_DEMO_CHATTING.userID_1, currentPage });
                console.log({resultAfterCallHandler})
                return resultAfterCallHandler;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    // Lấy thông tin một cuộc hội thoại theo ID
     getListConversationByID: {
        params: {
            conversationID  : { type: "string" },
        },
        async handler(ctx) {
            try {
                let {  conversationID }        = ctx.params;
                // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)

                // await this.validateEntity(name);
                // id demo 
                // conversationID = '602c7a51ea1d1274020b2e08'

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getInfoByID({ userID: CF_DATA_DEMO_CHATTING.userID_1, conversationID });
                console.log({resultAfterCallHandler})
                return resultAfterCallHandler;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    // Tìm cuộc hội thoại 
    getListConversationByKey: {
        params: {
            key  : { type: "string" },
        },
        async handler(ctx) {
            try {
                let { key }        = ctx.params;
                // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)

                // await this.validateEntity(name);

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getListCoversationWithKey({ userID: CF_DATA_DEMO_CHATTING.userID_1, key });
                console.log({resultAfterCallHandler})
                return resultAfterCallHandler;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
    //================================================================ END CONVERSATION  ============================================================


}