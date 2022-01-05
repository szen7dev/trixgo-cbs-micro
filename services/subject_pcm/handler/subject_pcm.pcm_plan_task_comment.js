/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');
const { CF_DOMAIN_SERVICES } 					= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_REACTION } 				    = require('../../reaction/helper/reaction.actions-constant');
const { CF_ACTIONS_FILE } 				        = require('../../file/helper/file.actions-constant');

 /**
  * MODELS
  */
const SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_MODEL        = require('../model/subject_pcm.pcm_plan_task_comment-model').MODEL;
const SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_FILE_MODEL   = require('../model/subject_pcm.pcm_plan_task_comment_file-model').MODEL;

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
            parentID   : { type: "string", optional: true },
            files      : { type: "array", optional: true },
            images     : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID, fullname } = ctx.meta.infoUser;
                const {  content, taskID , parentID, files, images } = ctx.params;
                
                // call service comment để insert comment_core
                const infoCommentCore = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_CORE_INSERT}`, {
					content, files, images
				});

                if(!infoCommentCore || infoCommentCore.error)
                    return renderStatusCodeAndResponse({ resultAfterCallHandler: infoCommentCore, ctx });

                let commentCoreID = infoCommentCore.data._id;
                let resultAfterCallHandler = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_MODEL.insert({
					taskID, commentCoreID, content, fullname, parentID, ctx
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
			commentTemplateID  : { type: "string" },
			commentCoreID  : { type: "string" },
			content    : { type: "string" },
            files      : { type: "array", optional: true },
            fileIDsRemoved: { type: "array", optional: true },
        }, 
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { commentTemplateID, commentCoreID, content, fileIDsRemoved, files } = ctx.params;

                // Call service comment core để cập nhật
                let infoCommentCore = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_UPDATE}`, {
					commentID: commentCoreID, content
				});

                let infoCommentDoc = await INSPECTION__TEMPLATE_DOC_COMMENT_MODEL.getInfo({ commentTemplateID });
                let { template: taskID } = infoCommentDoc.data;

                // Nếu files có thì call service file để thêm
                if(files){
                    for (const file of files) {
                        let { name, url, size } = file;

                        // Add file core
                        const infoFileCore = await ctx.call(`${CF_DOMAIN_SERVICES.FILE}.${CF_ACTIONS_FILE.INSERT_FILE}`, {
                            app: CF_DOMAIN_SERVICES.FILE, name, url, size
                        });

                        // Inser file vào collection template_doc_comment_file-coll
                        const resultAfterCallModel = await INSPECTION__TEMPLATE_DOC_COMMENT_FILE_MODEL.insert({ comment: infoCommentCore.data._id, template: taskID, file: infoFileCore.data._id });
                        console.log({ infoFileCore, resultAfterCallModel });
                    }
                }

                // Xóa tempalte_doc_comment_file nếu có fileIDsRemoved
                if(fileIDsRemoved && fileIDsRemoved.length){
                    for (const fileID of fileIDsRemoved) {
                        const resultAfterCallModel = await INSPECTION__TEMPLATE_DOC_COMMENT_FILE_MODEL.remove({ fileID });
                    }
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler: { message: "update_comment_success"}, ctx });
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
			commentTemplateID  : { type: "string" },
        }, 
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { commentTemplateID } = ctx.params;
                let resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_COMMENT_MODEL.remove({ commentID: commentTemplateID });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
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
            limit           : { type: "string", optional: true },
            lastestIDComment: { type: "string", optional: true },
            parentID        : { type: "string", optional: true },
            taskID          : { type: "string", optional: true },
            commentTemplateID: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { taskID, limit, parentID, lastestIDComment, commentTemplateID }  = ctx.params;
                let resultAfterCallHandler;
                if(commentTemplateID){
                    // Get info
                    resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_COMMENT_MODEL.getInfo({
                        commentTemplateID
                    });
                }else{
                    // Get list
                    resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_COMMENT_MODEL.getListComment({
                        taskID, limit, lastestIDComment, parentID
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}