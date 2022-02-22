/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const MEDIA__REACTION_MODEL                     = require('../model/media.reaction-model').MODEL;

module.exports = {

    /**
	 * Dev: MinhVH
	 * Func: THẢ CẢM XÚC TRONG BÀI VIẾT
	 */
    reaction: {
        params: {
            mediaID         : { type: "string" },
            typeReaction    : { type: "number", optional: true }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { mediaID, typeReaction } = ctx.params;

                const resultAfterCallHandler = await MEDIA__REACTION_MODEL.reaction({
					authorID, mediaID, typeReaction, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: LẤY DANH SÁCH USER ĐÃ THẢ CẢM XÚC TRONG BÀI VIẾT
	 */
    getListReaction: {
        params: {
            mediaID     : { type: "string" },
            type        : { type: "string", optional: true },
            isGetTotal  : { type: "string", optional: true },
            lastestID 	: { type: "string", optional: true },
            limit 	    : { type: "string", optional: true },
            select 	    : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { mediaID, type, lastestID, isGetTotal, limit, select, populates } = ctx.params;

                const resultAfterCallHandler = await MEDIA__REACTION_MODEL.getListReaction({
					userID, mediaID, type, lastestID, isGetTotal, limit, select, populates, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: THẢ CẢM XÚC FILE TRONG BÀI VIẾT
	 */
    reactionFile: {
        params: {
            mediaID         : { type: "string" },
            fileID          : { type: "string" },
            typeReaction    : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { mediaID, fileID, typeReaction } = ctx.params;

                const resultAfterCallHandler = await MEDIA__REACTION_MODEL.reactionFile({
					authorID, mediaID, fileID, typeReaction, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: LẤY DANH SÁCH USER ĐÃ THẢ CẢM XÚC FILE TRONG BÀI VIẾT
	 */
    getListReactionFile: {
        params: {
            mediaID     : { type: "string" },
            fileID      : { type: "string" },
            isGetTotal  : { type: "string", optional: true },
            lastestID 	: { type: "string", optional: true },
            type        : { type: "string", optional: true },
            limit 	    : { type: "string", optional: true },
            select 	    : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { fileID, mediaID, lastestID, isGetTotal, type, limit, select, populates } = ctx.params;

                const resultAfterCallHandler = await MEDIA__REACTION_MODEL.getListReactionFile({
					userID, fileID, mediaID, lastestID, isGetTotal, type, limit, select, populates, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
}