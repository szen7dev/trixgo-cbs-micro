/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const REACTION__COMMENT_FILE_CORE_MODEL         = require('../model/reaction.comment_file_core-model').MODEL;

module.exports = {
    /**
	 * Dev: DePV ✅
	 * Func: Tạo mới comment file core
	 * Date: 17/08/2021
	 */
    insertCommentFileCore: {
        auth: "required",
        params: {
			comment    : { type: "string" },
			fileCore   : { type: "string" }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				// const { _id: authorID } = ctx.meta.infoUser;
                const { comment, fileCore }  = ctx.params;
                console.log({ comment, fileCore });
                const resultAfterCallHandler = await REACTION__COMMENT_FILE_CORE_MODEL.insert({
					comment, fileCore
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
}