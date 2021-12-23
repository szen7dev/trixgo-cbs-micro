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
	 * Func: Tạo mới comment core
	 * Date: 17/08/2021
	 */
    insert: {
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
	 * Func: Cập nhật comment core
	 * Date: 17/08/2021
	 */
    update: {
        auth: "required",
        params: {
			commentID           : { type: "string" },
			content             : { type: "string", optional: true },
			amountCommentReply  : { type: "number", optional: true },
			amountReaction      : { type: "number", optional: true },
			files               : { type: "array", optional: true },
			images              : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { commentID, content, files, images, amountCommentReply, amountReaction } = ctx.params;
                console.log({ commentID, content, files, images, amountCommentReply, amountReaction });

                const resultAfterCallHandler = await REACTION__COMMENT_MODEL.update({
					commentCoreID: commentID, authorID, content, files, images, amountCommentReply, amountReaction
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: getList and getInfo comment core
	 */
    getInfoAndGetList: {
        auth: "required",
        params: {
            commentID   : { type: "string", optional: true },
            // Những trường thông tin mặc định
            limit       : { type: "string", optional: true },
            lastestID   : { type: "string", optional: true },
            filter      : { type: "string", optional: true },
            select      : { type: "string", optional: true },
            subjectID   : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
            populates1  : { type: "string", optional: true },
            populates2  : { type: "string", optional: true },
            populates3  : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { commentID,
                    keyword, limit, lastestID, filter, select, populates, populates1, populates2, populates3 } = ctx.params;
                const { _id: userID } = ctx.meta.infoUser;
                    
                let resultAfterCallHandler;
                if(commentID){
                    resultAfterCallHandler = await REACTION__COMMENT_MODEL.getInfo({
                        commentID, select, populates, populates1, populates2, populates3 
                    });
                }else{
                   // Hiện tại chưa có chức năng nào lấy danh sách comment core
                }
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

}