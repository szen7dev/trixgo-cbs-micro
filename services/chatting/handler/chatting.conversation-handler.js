/**
 * MODELS
 */
let CHATTING__CONVERSATION_MODEL                    = require('../model/chatting.conversation-model').MODEL;
let CHATTING__CONVERSATION_DRAFT_MODEL              = require('../model/chatting.coversation_draft-model').MODEL;
let CHATTING__CONVERSATION_LINK_MODEL               = require('../model/chatring.conversation_link-model').MODEL;
let CHATTING__CONVERSATION_FILE_MODEL               = require('../model/chatting.conversation_file-model').MODEL;

/**
 * CONSTANTS
 */
let { CF_DATA_DEMO_CHATTING }                       = require('../helper/chatting.data-demo-constant')

/**
 * TOOLS
 */
let { renderStatusCodeAndResponse }                 = require('../../../tools/utils/status_code');

module.exports = {

	//============================== CONVERSATION ====================================

    /**
	 * Dev: VinhHV
	 * Func: Thêm cuộc hội thoại mới
	 * Date: ...
	 */
    insert: {
        params: {
            name        : { type: "string" },
            description : { type: "string" },
            authorID    : { type: "string" },
            receivers   : { type: "string" }
        },
        async handler(ctx) {
            try {
                let { name, description, authorID, receivers } = ctx.params;

                // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)
                // await this.validateEntity(name);

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.insertConversationMoreTowMember({ 
					name, description, authorID, receivers
				});
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: VinhHV
	 * Func: Lấy danh sách cuộc hội thoại của một người dùng
	 * Date: ...
	 */
    getListConversationByUserID: {
        params: {
            userID: { type: "string" },
        },
        async handler(ctx) {
            try {
                let { userID, lastestConversationID } = ctx.params;
                // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)
                // await this.validateEntity(name);
                // if(!nextInfo){
                //     nextInfo =  `2021-05-06T10:13:15.000Z_6093ca895ad4a270bce7234d`
                // }

				// this.logger.info({
				// 	userID, lastestConversationID
				// });

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getListConversationByAuthorID({ 
					authorID: userID, lastestConversationID 
				});
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: VinhHV
	 * Func: Lấy thông tin một cuộc hội thoại theo ID
	 * Date: ...
	 */
    getInfoConversationByID: {
        params: {
            conversationID  : { type: "string" },
        },
        async handler(ctx) {
            try {
                let { conversationID } = ctx.params;
                // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)

                // await this.validateEntity(name);
                // id demo 
                // conversationID = '602c7a51ea1d1274020b2e08'

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getInfoByUserID({ 
					userID: CF_DATA_DEMO_CHATTING.userID_1, 
					conversationID
				});
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: VinhHV
	 * Func: Lấy danh sách member theo ID
	 * Date: ...
	 */
    getListMemberByID: {
        params: {
            conversationID  : { type: "string" },
        },
        async handler(ctx) {
            try {
                let { conversationID } = ctx.params;
                // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)

                // await this.validateEntity(name);
                // id demo 
                // conversationID = '602c7a51ea1d1274020b2e08'

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getInfoMembersByID({ 
					userID: CF_DATA_DEMO_CHATTING.userID_1, 
					conversationID 
				});
				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
				return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: VinhHV
	 * Func: Tìm cuộc hội thoại 
	 * Date: ...
	 */
    getListConversationByKey: {
        params: {
            key: { type: "string" },
        },
        async handler(ctx) {
            try {
                let { key } = ctx.params;
                // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)
                // await this.validateEntity(name);

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getListCoversationWithKey({ 
					userID: CF_DATA_DEMO_CHATTING.userID_1, 
					key 
				});
				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: VinhHV
	 * Func: Lấy bản nháp đang soạn của user trong một cuộc hội thoại
	 * Date: ...
	 */
    getConversationDraftByUserID: {
        params: {
            conversationID: { type: "string" },
        },
        async handler(ctx) {
            try {
                let { conversationID } = ctx.params;
                // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)
                // await this.validateEntity(name);

                let resultAfterCallHandler = await CHATTING__CONVERSATION_DRAFT_MODEL.getInfoByUserID({ 
					conversationID, 
					userID: CF_DATA_DEMO_CHATTING.userID_1 
				});
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: VinhHV
	 * Func: Lấy danh sách link trong một cuộc hội thoại
	 * Date: ...
	 */
    getLinkConversationByID: {
        params: {
            conversationID      : { type: "string" },
            currentPage         : { type: "string" },
            nextInfo            : { type: "string" },
        },
        async handler(ctx) {
            try {
                let { conversationID, currentPage, nextInfo } = ctx.params;
                // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)
                // await this.validateEntity(name);
                let resultAfterCallHandler = await CHATTING__CONVERSATION_LINK_MODEL.getListWithPage({ 
					conversationID, 
					userID: CF_DATA_DEMO_CHATTING.userID_1, 
					currentPage, 
					nextInfo 
				})
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: VinhHV
	 * Func: Lấy danh sách cuộc hội thoại chưa đọc
	 * Date: ...
	 */
    getConversationsMissByUserID: {
        params: {
            currentPage         : { type: "string" },
            nextInfo            : { type: "string" },
        },
        async handler(ctx) {
            try {
                let { nextInfo, currentPage } = ctx.params;
                // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)
                // await this.validateEntity(name);

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getListConversationMissMessage({ 
					currentPage, 
					nextInfo : '111', 
					userID: CF_DATA_DEMO_CHATTING.userID_1
				})
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: VinhHV
	 * Func: Lấy danh sách file trong một cuộc hội thoại
	 * Date: ...
	 */
    getFileConversationByID: {
        params: {
            conversationID      : { type: "string" },
            currentPage         : { type: "string" },
            nextInfo            : { type: "string" },
        },
        async handler(ctx) {
            try {
                let { conversationID, currentPage, nextInfo } = ctx.params;
                // let { _id : authorID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)
                // await this.validateEntity(name);

                let resultAfterCallHandler = await CHATTING__CONVERSATION_FILE_MODEL.getListWithPage({ 
					conversationID, 
					userID: CF_DATA_DEMO_CHATTING.userID_1, 
					currentPage, 
					nextInfo 
				})
				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    //========================= END CONVERSATION  ==============================
}
