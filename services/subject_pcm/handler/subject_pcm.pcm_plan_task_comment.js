/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_MODEL  = require('../model/subject_pcm.pcm_plan_task_comment-model').MODEL;

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

                let resultAfterCallHandler = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_MODEL.insert({
					taskID, parentID, authorID, type, content, bizfullname, files, images, ctx
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
			taskID              : { type: "string" },
            isMarked            : { type: "boolean", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { taskID, commentTemplateID, isMarked } = ctx.params;

                // Call service comment core để cập nhật
                // let infoCommentCore = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_UPDATE}`, {
				// 	commentID: commentCoreID, content
				// });

                let resultAfterCallHandler = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_MODEL.updateMarkResponse({
					taskID, commentID: commentTemplateID, isMarked
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
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
	 * Func: Danh sách hoặc chi tiết ✅
	 * Date: 17/08/2021
	 */
    getInfoAndGetList: {
        params: {
            taskID              : { type: "string", optional: true },
            isMarked            : { type: "string", optional: true },
            limit               : { type: "string", optional: true },
            lastestID           : { type: "string", optional: true },
            parentID            : { type: "string", optional: true },
            commentTemplateID   : { type: "string", optional: true },
            select              : { type: "string", optional: true },
            populates           : { type: "string", optional: true },
            sortKey             : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { taskID, limit, parentID, lastestID, commentTemplateID, isMarked, sortKey, select, populates } = ctx.params;
                let resultAfterCallHandler = null;

                if(commentTemplateID){
                    // Get info
                    resultAfterCallHandler = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_MODEL.getInfo({
                        commentID: commentTemplateID, select, populates
                    });
                } else{
                    // Get list
                    resultAfterCallHandler = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_MODEL.getList({
                        taskID, parentID, limit, lastestID, isMarked, sortKey, select, populates
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
     * Name   : Danh sách comment tìm kiếm theo id ✅
     * Author : MinhVH
     */
    searchCommentById: {
        params: {
            taskID      : { type: "string" },
            commentID   : { type: "string" },
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                let { taskID, commentID, select, populates } = ctx.params;

                let resultAfterCallHandler = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_MODEL.searchCommentById({
                    taskID, authorID, commentID, select, populates
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
}