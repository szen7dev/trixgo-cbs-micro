/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_REACTION } 				    = require('../../reaction/helper/reaction.actions-constant');

/**
 * MODELS
 */
const INSPECTION__DOC_REACTION_MODEL   = require('../model/inspection.doc_reaction-model').MODEL;

module.exports = {
    /**
	 * Dev: Depv ✅
	 * Func: Thêm reaction cho inspection
	 * Date: 17/08/2021
	 */
    insertReaction: {
        auth: "required",
        params: {
			type    : { type: "string" },
            inspection: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const {  type, inspection } = ctx.params;
                const infoReactionCore = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.REACTION_INSERT}`, {
					type
				});
                let reactionID = infoReactionCore.data._id;
                const resultAfterCallHandler = await INSPECTION__DOC_REACTION_MODEL.insert({
					inspection, reaction: reactionID, author: authorID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: Xóa reaction cho inspection
	 * Date: 17/08/2021
	 */
    removeReaction: {
        auth: "required",
        params: {
			reactionID  : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { reactionID } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__DOC_REACTION_MODEL.remove({
					docReactionID : reactionID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: Danh sách reaction của inspection
	 * Date: 17/08/2021
	 */
    listReaction: {
        params: {
            limit: { type: "string", optional: true },
            lastestIDReaction: { type: "string", optional: true },
            inspectionID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { limit, lastestIDReaction, inspectionID }        = ctx.params;

                const resultAfterCallHandler = await INSPECTION__DOC_REACTION_MODEL.getListReactions({
					inspectionID, limit, lastestIDReaction
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}