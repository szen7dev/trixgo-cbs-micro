/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_REACTION } 				    = require('../../reaction/helper/reaction.actions-constant');

 /**
  * MODELS
  */
const INSPECTION__TEMPLATE_DOC_REACTION_MODEL   = require('../model/inspection.template_doc_reaction-model').MODEL;

module.exports = {
    /**
	 * Dev: Depv ✅
	 * Func: Thêm template reaction cho inspection
	 * Date: 17/08/2021
	 */
    insertReaction: {
        auth: "required",
        params: {
			type    : { type: "string" },
            template: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const {  type, template } = ctx.params;
                const infoReactionCore = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.REACTION_INSERT}`, {
					type
				});
                let reactionID = infoReactionCore.data._id;
                const resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_REACTION_MODEL.insert({
					template, reaction: reactionID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv ❌
	 * Func: Cập nhật template hồ sơ/biên bản
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

                const resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_REACTION_MODEL.remove({
					templateDocReactionID: reactionID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv ❌
	 * Func: Danh sách template hồ sơ/biên bản
	 * Date: 17/08/2021
	 */
    listReaction: {
        params: {
            limit: { type: "string", optional: true },
            lastestIDTemplateDocReaction: { type: "string", optional: true },
            templateDocReactionID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { limit, lastestIDTemplateDocReaction, templateDocReactionID }        = ctx.params;

                const resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_REACTION_MODEL.getListTemplateDoc({
					templateDocReactionID, limit, lastestIDTemplateDocReaction
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}