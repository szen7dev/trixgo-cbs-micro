/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }  = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const REACTION__COMMENT_MODEL      = require('../model/reaction.comment_core-model').MODEL;

module.exports = {
    /**
	 * Dev: DePV ✅
	 * Func: Tạo mới comment
	 * Date: 17/08/2021
	 */
    insertComment: {
        auth: "required",
        params: {
			content   : { type: "string", optional: true },
			files     : { type: "array",  optional: true },
			images    : { type: "array",  optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { content, files, images } = ctx.params;
                const resultAfterCallHandler = await REACTION__COMMENT_MODEL.insert({
					content, files, images, userID
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
			commentID           : { type: "string" },
			content             : { type: "string", optional: true },
			amountCommentReply  : { type: "number", optional: true },
			amountReaction      : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { commentID, content, amountCommentReply, amountReaction } = ctx.params;

                const resultAfterCallHandler = await REACTION__COMMENT_MODEL.update({
					commentID, content, amountCommentReply, amountReaction
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

}