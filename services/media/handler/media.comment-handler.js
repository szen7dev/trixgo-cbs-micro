/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
const MEDIA__COMMENT_MODEL                      = require('../model/media.comment-model').MODEL;
 
module.exports = {
    /**
     * Dev: Depv ✅
     * Func: insert comment media
     */
    insert: {
        auth: "required",
        params: {
            mediaID         : { type: "string" },
            parentID        : { type: "string", optional: true },
            content         : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID } = ctx.meta.infoUser;
                let { mediaID, parentID, content, files, images } = ctx.params;

                let resultAfterCallHandler = await MEDIA__COMMENT_MODEL.insert({
                    mediaID, parentID, content, files, images, userID, ctx
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

     /**
	 * Dev: NPNguyen 🐸
	 * Func: XÓA COMMENT TRONG BÀI VIẾT
	 */
    deleteComment: {
        params: {
            commentID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { _id: authorID } = ctx.meta.infoUser;
                const { commentID } = ctx.params;

                const resultAfterCallHandler = await MEDIA__COMMENT_MODEL.delete({
					authorID, commentID, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
 
    /**
     * Dev: Depv ✅
     * Func: getList and getInfo comment media
     */
    getInfoAndGetList: {
        auth: "required",
        params: {
            // Field bổ sung
            commentID   : { type: "string", optional: true },
            mediaID     : { type: "string" },
            parentID    : { type: "string", optional: true },
            // Field mặc định
            keyword     : { type: "string", optional: true },
            limit       : { type: "string", optional: true },
            lastestID   : { type: "string", optional: true },
            filter      : { type: "string", optional: true },
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
            populates1  : { type: "string", optional: true },
            populates2  : { type: "string", optional: true },
            populates3  : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { 
                    commentID, mediaID, parentID, limit, lastestID, select, filter,
                    populates, populates1, populates2, populates3
                } = ctx.params;
                let resultAfterCallHandler;

                if(commentID){
                    resultAfterCallHandler = await MEDIA__COMMENT_MODEL.getInfo({
                        commentID, select, populates, populates1, populates2, populates3
                    });
                } else{
                    resultAfterCallHandler = await MEDIA__COMMENT_MODEL.getList({
                        mediaID, parentID, limit, lastestID, populates, populates1, populates2, populates3, filter
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
 }