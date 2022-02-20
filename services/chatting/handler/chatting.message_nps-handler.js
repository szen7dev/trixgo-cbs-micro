/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const CHATTING__MESSAGE_NPS_MODEL               = require('../model/chatting.message_nps-model').MODEL;


module.exports = {

	/**
	 * ============================ ****************** ===============================
	 * ============================ 	MESSAGE NPS    ===============================
	 * ============================ ****************** ===============================
	 */

    /**
	 * Dev: MinhVH
	 * Func: Thêm tin nhắn nps mới
	 * Date: 20/02/2022
	 */
    insert: {
        params: {
			conversationID	: { type: 'string' },
            serviceID       : { type: "string" },
            type            : { type: "number" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { type, conversationID, serviceID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_NPS_MODEL.insert({
					type, conversationID, serviceID, authorID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Cập nhật nps
	 * Date: 20/02/2022
	 */
	update: {
        params: {
            conversationID	: { type: 'string' },
			messageID		: { type: 'string' },
			score		    : { type: 'number', optional: true },
			reasons		    : { type: 'array', optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { conversationID, messageID, score, reasons } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_NPS_MODEL.update({
					conversationID, messageID, score, reasons, authorID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Đóng nps
	 * Date: 20/02/2022
	 */
    closeNps: {
        params: {
            conversationID	: { type: 'string' },
			messageID		: { type: 'string' },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { conversationID, messageID } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_NPS_MODEL.closeNps({ 
					conversationID, messageID, authorID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Lấy danh sách nps
	 * Date: 20/02/2022
	 */
	getList: {
        params: {
            conversationID	: { type: 'string' },
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: authorID } = ctx.meta.infoUser;
                const { conversationID, lastestID, limit, select, populates } = ctx.params;

                const resultAfterCallHandler = await CHATTING__MESSAGE_NPS_MODEL.getList({ 
					conversationID, lastestID, limit, select, populates, authorID
				});

				return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
				return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

}
