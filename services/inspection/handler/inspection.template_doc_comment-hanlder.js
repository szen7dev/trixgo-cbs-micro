/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_REACTION } 				    = require('../../reaction/helper/reaction.actions-constant');

 /**
  * MODELS
  */
const INSPECTION__TEMPLATE_DOC_COMMENT_MODEL   = require('../model/inspection.template_doc_comment-model').MODEL;

module.exports = {
    /**
	 * Dev: Depv ✅
	 * Func: comment cho inspection template
	 * Date: 17/08/2021
	 */
    insertComment: {
        auth: "required",
        params: {
			content    : { type: "string" },
            templateID : { type: "string" },
            parentID : { type: "string", optional: true }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const {  content, templateID , parentID } = ctx.params;
                const infoReactionCore = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_INSERT}`, {
					content
				});
                let commentID = infoReactionCore.data._id;
                console.log({ ssssssss:infoReactionCore.data, content, templateID , parentID });

                const resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_COMMENT_MODEL.insert({
					template: templateID, comment: commentID, parent: parentID
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