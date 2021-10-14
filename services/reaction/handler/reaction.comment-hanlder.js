/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const REACTION__COMMENT_MODEL      = require('../model/reaction.comment-model').MODEL;

module.exports = {
    /**
	 * Dev: DePV ✅
	 * Func: Tạo mới comment
	 * Date: 17/08/2021
	 */
    insertComment: {
        auth: "required",
        params: {
			content   : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { content } = ctx.params;
                
                const resultAfterCallHandler = await REACTION__COMMENT_MODEL.insert({
					content, userID: authorID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: DePV ✅
	 * Func: Cập nhật comment
	 * Date: 17/08/2021
	 */
    updateComment: {
        auth: "required",
        params: {
			commentID : { type: "string" },
			content   : { type: "string",  optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { commentID, content } = ctx.params;

                const resultAfterCallHandler = await REACTION__COMMENT_MODEL.update({
					commentID, content
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
}