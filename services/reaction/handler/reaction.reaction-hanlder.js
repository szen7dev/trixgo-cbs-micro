/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const REACTION_MODEL      = require('../model/reaction.reaction-model').MODEL;

module.exports = {
    /**
	 * Dev: DePV ✅
	 * Func: Thêm template checklist
	 * Date: 17/08/2021
	 */
    insertReaction: {
        auth: "required",
        params: {
			type          : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { type } = ctx.params;

                const resultAfterCallHandler = await REACTION_MODEL.insert({
					type, userID: authorID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
}