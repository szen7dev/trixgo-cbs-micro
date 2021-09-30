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
const INSPECTION__TEMPLATE_DOC_COMMENT_MODEL        = require('../model/inspection.template_doc_comment-model').MODEL;
const INSPECTION__TEMPLATE_DOC_COMMENT_FILE_MODEL   = require('../model/inspection.template_doc_comment_file-model').MODEL;

module.exports = {
    /**
	 * Dev: Depv ✅
	 * Func: comment cho inspection template
	 * Date: 17/08/2021
	 */
    insertComment: {
        auth: "required",
        params: {
			content    : { type: "string" },
            templateID : { type: "string" },
            parentID : { type: "string", optional: true },
            files    : { type: "array", optional: true }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const {  content, templateID , parentID, files } = ctx.params;
                // call service file để insert
                const infoCommentCore = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_INSERT}`, {
					content
				});
                let commentID = infoCommentCore.data._id;

              

                const resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_COMMENT_MODEL.insert({
					template: templateID, comment: commentID, parent: parentID
				});

                // Nếu files có thì call service file để thêm
                if(files){
                    for (const file of files) {
                        let { name, url, size } = file;
                        
                        const infoFileCore = await ctx.call(`${CF_DOMAIN_SERVICES.FILE}.${CF_ACTIONS_FILE.INSERT_FILE}`, {
                            app: CF_DOMAIN_SERVICES.FILE, name, url, size
                        });

                        // Inser file vào collection template_doc_comment_file-coll
                        const resultAfterCallModel = await INSPECTION__TEMPLATE_DOC_COMMENT_FILE_MODEL.insert({ comment: resultAfterCallHandler.data._id, template: templateID, file: infoFileCore.data._id });
                        console.log({ resultAfterCallModel });
                    }
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv ❌
	 * Func: Cập nhật template hồ sơ/biên bản
	 * Date: 17/08/2021
	 */
    // removeReaction: {
    //     auth: "required",
    //     params: {
	// 		reactionID  : { type: "string" },
    //     },
    //     async handler(ctx) {
    //         try {
	// 			await this.validateEntity(ctx.params);
	// 			const { _id: authorID } = ctx.meta.infoUser;
    //             const { reactionID } = ctx.params;

    //             const resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_REACTION_MODEL.remove({
	// 				templateDocReactionID: reactionID
	// 			});

    //             return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
    //         } catch (error) {
    //             return renderStatusCodeAndResponse({ ctx, error_message: error.message });
    //         }
    //     }
    // },

    /**
	 * Dev: Depv ❌
	 * Func: Danh sách template hồ sơ/biên bản
	 * Date: 17/08/2021
	 */
    listComment: {
        params: {
            limit: { type: "string", optional: true },
            lastestIDComment: { type: "string", optional: true },
            parentID: { type: "string", optional: true },
            templateID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { templateID, limit, parentID, lastestIDComment }  = ctx.params;
                const resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_COMMENT_MODEL.getListComment({
					templateID, limit, lastestIDComment, parentID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}