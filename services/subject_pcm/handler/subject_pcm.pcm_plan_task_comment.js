/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_REACTION } 				    = require('../../reaction/helper/reaction.actions-constant');

 /**
  * MODELS
  */
const SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_MODEL        = require('../model/subject_pcm.pcm_plan_task_comment-model').MODEL;

module.exports = {
    /**
	 * Dev: Depv ✅
	 * Func: Tạo comment
	 * Date: 17/08/2021
	 */ 
    insert: {
        auth: "required",
        params: {
			content    : { type: "string" },
            taskID     : { type: "string" },
            type       : { type: "number" },
            parentID   : { type: "string", optional: true },
            files      : { type: "array", optional: true },
            images     : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID, bizfullname } = ctx.meta.infoUser;
                const { content, taskID, type, parentID, files, images } = ctx.params;

                // Call service comment để insert comment_core
                const infoCommentCore = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_CORE_INSERT}`, {
					content, files, images
				});

                if(!infoCommentCore || infoCommentCore.error)
                    return renderStatusCodeAndResponse({ resultAfterCallHandler: infoCommentCore, ctx });

                let commentCoreID = infoCommentCore.data._id;
                let resultAfterCallHandler = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_MODEL.insert({
					taskID, commentCoreID, parentID, authorID, type, content, bizfullname, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: Cập nhật comment
	 * Date: 17/08/2021
	 */
    update: {
        auth: "required",
        params: {
			commentTemplateID   : { type: "string" },
			commentCoreID       : { type: "string" },
			taskID              : { type: "string" },
            type                : { type: "number" },
            parentID            : { type: "string", optional: true },
            files               : { type: "array", optional: true },
            images              : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				// const { _id: authorID } = ctx.meta.infoUser;
                // const { commentTemplateID, commentCoreID, content, files } = ctx.params;

                // // Call service comment core để cập nhật
                // let infoCommentCore = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_UPDATE}`, {
				// 	commentID: commentCoreID, content
				// });

                // let resultAfterCallHandler = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_MODEL.update({
				// 	taskID, commentCoreID, parentID, authorID, type, content, bizfullname, ctx
				// });

                // return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
                return renderStatusCodeAndResponse({ ctx, error_message: 'nothing' });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: Xóa comment
	 * Date: 17/08/2021
	 */
    remove: {
        auth: "required",
        params: {
			commentTemplateID: { type: "string" },
        }, 
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { commentTemplateID } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_COMMENT_MODEL.remove({ commentID: commentTemplateID, authorID });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv 
	 * Func: Danh sách hoặc chi tiết
	 * Date: 17/08/2021
	 */
    getInfoAndGetList: {
        params: {
            taskID              : { type: "string", optional: true },
            limit               : { type: "string", optional: true },
            lastestID           : { type: "string", optional: true },
            parentID            : { type: "string", optional: true },
            commentTemplateID   : { type: "string", optional: true },
            select              : { type: "string", optional: true },
            populates           : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { taskID, limit, parentID, lastestID, commentTemplateID } = ctx.params;
                let resultAfterCallHandler = null;

                if(commentTemplateID){
                    // Get info
                    resultAfterCallHandler = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_MODEL.getInfo({
                        commentID: commentTemplateID, select, populates
                    });
                } else{
                    // Get list
                    resultAfterCallHandler = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_MODEL.getList({
                        taskID, parentID, limit, lastestID, select, populates
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
}