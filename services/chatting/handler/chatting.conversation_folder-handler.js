/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const CHATTING__CONVERSATION_FOLDER_MODEL       = require('../model/chatting.conversation_folder-model').MODEL;


module.exports = {

	/**
	 * ============================ ************************** ===============================
	 * ============================ 	CONVERSATION FOLDER    ===============================
	 * ============================ ************************** ===============================
	 */

    /**
	 * Dev: MinhVH
	 * Func: Thêm folder mới
	 * Date: 11/02/2022
	 */
    insert: {
        params: {
            name                        : { type: "string" },
            includedConversationsID     : { type: "array", optional: true },
            excludedConversationsIDD    : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { name, includedConversationsID, excludedConversationsID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_FOLDER_MODEL.insert({
					name, includedConversationsID, excludedConversationsID, authorID
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
            folderID                : { type: "string" },
            name                    : { type: "string", optional: true },
            includedConversationsID : { type: "array", optional: true },
            excludedConversationsID : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { folderID, name, includedConversationsID, excludedConversationsID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_FOLDER_MODEL.update({
					folderID, name, includedConversationsID, excludedConversationsID, authorID
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
            folderID    : { type: "string" },
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { folderID, select, populates } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_FOLDER_MODEL.getInfo({ 
					folderID, select, populates, authorID
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

                const resultAfterCallHandler = await CHATTING__CONVERSATION_FOLDER_MODEL.getList({ 
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
            folderID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: authorID } = ctx.meta.infoUser;
                const { folderID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__CONVERSATION_FOLDER_MODEL.delete({ 
					folderID, authorID
				});

				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
				return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    //========================= END CONVERSATION GROUP  ==============================
}
