/**
 * CONSTATNS
 */

/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const CHATTING__CONVERSATION_GROUP_MODEL        = require('../model/chatting.conversation_group-model').MODEL;


module.exports = {

	/**
	 * ============================ ************************* ===============================
	 * ============================ 	CONVERSATION GROUP    ===============================
	 * ============================ ************************* ===============================
	 */

    /**
	 * Dev: MinhVH
	 * Func: Thêm folder mới
	 * Date: 11/02/2022
	 */
    insert: {
        params: {
            name                    : { type: "string" },
            includedConversations   : { type: "array", optional: true },
            excludedConversations   : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { name, includedConversations, excludedConversations } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_GROUP_MODEL.insert({
					name, includedConversations, excludedConversations, authorID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật folder
	 * Date: 11/02/2022
	 */
	update: {
        params: {
            groupID                 : { type: "string" },
            name                    : { type: "string", optional: true },
            includedConversations   : { type: "array", optional: true },
            excludedConversations   : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { groupID, name, includedConversations, excludedConversations } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_GROUP_MODEL.update({
					groupID, name, includedConversations, excludedConversations, authorID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: VinhHV
	 * Func: Lấy thông tin folder
	 * Date: 11/02/2022
	 */
    getInfo: {
        params: {
            groupID     : { type: "string" },
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { groupID, select, populates } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_GROUP_MODEL.getInfo({ 
					groupID, select, populates, authorID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Lấy danh sách folder
	 * Date: 11/02/2022
	 */
	getList: {
        params: {
            keyword     : { type: "string", optional: true },
            limit       : { type: "string", optional: true },
            lastestID   : { type: "string", optional: true },
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: authorID } = ctx.meta.infoUser;
                const { lastestID, keyword, limit, select, populates } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_GROUP_MODEL.getList({ 
					lastestID, keyword, limit, select, populates, authorID
				});

				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
				return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Xóa folder
	 * Date: 11/02/2022
	 */
	delete: {
        params: {
            groupID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: authorID } = ctx.meta.infoUser;
                const { groupID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_GROUP_MODEL.delete({ 
					groupID, authorID
				});

				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
				return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    //========================= END CONVERSATION GROUP  ==============================
}
