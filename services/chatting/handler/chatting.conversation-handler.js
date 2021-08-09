/**
 * CONSTANTS
 */
const { CF_DATA_DEMO_CHATTING }                       = require('../helper/chatting.data-demo-constant');

/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }                 = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const CHATTING__CONVERSATION_MODEL                    = require('../model/chatting.conversation-model').MODEL;
const CHATTING__CONVERSATION_DRAFT_MODEL              = require('../model/chatting.coversation_draft-model').MODEL;
const CHATTING__CONVERSATION_LINK_MODEL               = require('../model/chatring.conversation_link-model').MODEL;
const CHATTING__CONVERSATION_FILE_MODEL               = require('../model/chatting.conversation_file-model').MODEL;


module.exports = {

	/**
	 * ============================ ********************* ===============================
	 * ============================ 	CONVERSATION  	  ===============================
	 * ============================ ********************* ===============================
	 */

    /**
	 * Dev: VinhHV
	 * Func: Thêm cuộc hội thoại mới
	 * Date: ...
	 * Updated: MinhVH - 03/08/2021
	 */
    insertConversation: {
        params: {
            name        : { type: "string" },
            description : { type: "string", optional: true },
            authorID    : { type: "string" },
            isPrivate   : { type: "boolean" }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { name, description, authorID, membersID, isPrivate } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.insertConversation({
					name, description, authorID, membersID, isPrivate
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật cuộc hội thoại
	 * Date: 04/08/2021
	 */
	 updateConversation: {
        params: {
            conversationID  : { type: "string" },
            userID        	: { type: "string" },
            name        	: { type: "string", optional: true },
            description 	: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { conversationID, userID, name, description, avatar } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.updateConversation({
					conversationID, userID, name, description, avatar, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Thêm thành viên cuộc hội thoại
	 * Date: 06/08/2021
	 */
	 addMembersToConversation: {
        params: {
            conversationID  : { type: "string" },
            authorID        : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { conversationID, authorID, membersID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.addMembersToConversationByID({
					conversationID, authorID, membersID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Thêm thành viên cuộc hội thoại
	 * Date: 06/08/2021
	 */
	 removeMembersInConversation: {
        params: {
            conversationID  : { type: "string" },
            authorID        : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { conversationID, authorID, membersID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.removeMembersInConversation({
					conversationID, authorID, membersID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật admin cho cuộc hội thoại
	 * Date: 07/08/2021
	 */
	updateAdminConversation: {
        params: {
            conversationID  : { type: "string" },
            authorID        : { type: "string" },
            memberID        : { type: "string" },
            isSetAdmin      : { type: "boolean" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { conversationID, authorID, memberID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.insertNewAdmin({
					conversationID, authorID, memberID, isSetAdmin
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật cài đặt cho cuộc hội thoại (group chat)
	 * Date: 09/08/2021
	 */
	updateConfigConversation: {
        params: {
            conversationID  : { type: "string" },
            authorID        : { type: "string" },
            typeConfig      : { type: "string" },
            valueConfig     : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { conversationID, authorID, typeConfig, valueConfig } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.updateConfigConversation({
					conversationID, authorID, typeConfig, valueConfig
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
	 * Updated: MinhVH - 04/08/2021
	 */
	 getInfoConversationByID: {
        params: {
            conversationID	: { type: "string" },
            userID			: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                let { conversationID, userID } = ctx.params;

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getInfoConversationByID({ 
					conversationID, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: VinhHV
	 * Func: Lấy danh sách cuộc hội thoại (hoặc tìm theo key)
	 * Date: ...
	 * Updated: MinhVH - 03/08/2021
	 */
	 getListConversationByKey: {
        params: {
            userID	: { type: "string" },
            key		: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { userID, key } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getListConversationByKey({
					userID, key
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
	 * Updated: MinhVH - 03/08/2021
	 */
    getListConversationByUserID: {
        params: {
            userID					: { type: "string" },
			lastestConversationID 	: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                let { userID, lastestConversationID } = ctx.params;

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getListConversationByUserID({ 
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
	 * Func: Lấy danh sách cuộc hội thoại chưa đọc
	 * Date: ...
	 * Updated: MinhVH - 03/08/2021
	 */
	 getListConversationMissMessageByUserID: {
        params: {
            userID       			: { type: "string" },
            lastestConversationID 	: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                let { userID, lastestConversationID } = ctx.params;

                let resultAfterCallHandler = await CHATTING__CONVERSATION_MODEL.getListConversationMissMessage({ 
					userID, lastestConversationID
				})

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
