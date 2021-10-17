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
const INSPECTION__DOC_COMMENT_MODEL        = require('../model/inspection.doc_comment-model').MODEL;
const INSPECTION__DOC_COMMENT_FILE_MODEL   = require('../model/inspection.doc_comment_file-model').MODEL;

module.exports = {
    /**
	 * Dev: Depv ✅
	 * Func: comment cho inspection docs
	 * Date: 17/08/2021
	 */
    insertComment: {
        auth: "required",
        params: {
			content    : { type: "string" },
            inspectionID : { type: "string" },
            parentID : { type: "string", optional: true },
            files    : { type: "array", optional: true }
        }, 
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const {  content, inspectionID , parentID, files } = ctx.params;

                // call service file để insert
                const infoCommentCore = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_INSERT}`, {
					content
				});

                let commentID = infoCommentCore.data._id;
                
                const resultAfterCallHandler = await INSPECTION__DOC_COMMENT_MODEL.insert({
					inspection: inspectionID, comment: commentID, parent: parentID
				});

                // Nếu files có thì call service file để thêm
                if(files){
                    for (const file of files) {
                        let { name, url, size } = file;

                        // Add file core
                        const infoFileCore = await ctx.call(`${CF_DOMAIN_SERVICES.FILE}.${CF_ACTIONS_FILE.INSERT_FILE}`, {
                            app: CF_DOMAIN_SERVICES.FILE, name, url, size
                        });

                        // Inser file vào collection template_doc_comment_file-coll
                        const resultAfterCallModel = await INSPECTION__DOC_COMMENT_FILE_MODEL.insert({ comment: resultAfterCallHandler.data._id, inspection: inspectionID, file: infoFileCore.data._id });
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
	 * Dev: Depv ✅
	 * Func: Cập nhật comment inspection docs
	 * Date: 17/08/2021
	 */
    updateComment: {
        auth: "required",
        params: {
			commentDocID  : { type: "string" },
			commentCoreID  : { type: "string" },
			content    : { type: "string" },
            files      : { type: "array", optional: true },
            fileIDsRemoved: { type: "array", optional: true },
        }, 
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { commentDocID, commentCoreID, content, fileIDsRemoved, files } = ctx.params;

                // Call service comment core để cập nhật
                let infoCommentCore = await ctx.call(`${CF_DOMAIN_SERVICES.REACTION}.${CF_ACTIONS_REACTION.COMMENT_UPDATE}`, {
					commentID: commentCoreID, content
				});

                let infoCommentDoc = await INSPECTION__DOC_COMMENT_MODEL.getInfo({ commentID: commentDocID });
                let { inspection: inspectionID } = infoCommentDoc.data;

                // Nếu files có thì call service file để thêm
                if(files){
                    for (const file of files) {
                        let { name, url, size } = file;

                        // Add file core
                        const infoFileCore = await ctx.call(`${CF_DOMAIN_SERVICES.FILE}.${CF_ACTIONS_FILE.INSERT_FILE}`, {
                            app: CF_DOMAIN_SERVICES.FILE, name, url, size
                        });

                        // Inser file vào collection template_doc_comment_file-coll
                        const resultAfterCallModel = await INSPECTION__DOC_COMMENT_FILE_MODEL.insert({ comment: infoCommentCore.data._id, inspection: inspectionID, file: infoFileCore.data._id });
                        console.log({ infoFileCore, resultAfterCallModel });
                    }
                }

                // Xóa tempalte_doc_comment_file nếu có fileIDsRemoved
                if(fileIDsRemoved && fileIDsRemoved.length){
                    for (const fileID of fileIDsRemoved) {
                        const resultAfterCallModel = await INSPECTION__DOC_COMMENT_FILE_MODEL.remove({ fileID });
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
	 * Func: Xóa comment trong inspection docs
	 * Date: 17/08/2021
	 */
    removeComment: {
        auth: "required",
        params: {
			commentDocID  : { type: "string" },
        }, 
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { commentDocID } = ctx.params;
                let resultAfterCallHandler = await INSPECTION__DOC_COMMENT_MODEL.remove({ commentID: commentDocID });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv 
	 * Func: Danh sách comment trong inspection docs
	 * Date: 17/08/2021
	 */
    listComment: {
        params: {
            limit           : { type: "string", optional: true },
            lastestIDComment: { type: "string", optional: true },
            parentID        : { type: "string", optional: true },
            inspectionID      : { type: "string", optional: true },
            commentDocID    : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { inspectionID, limit, parentID, lastestIDComment, commentDocID }  = ctx.params;
                let resultAfterCallHandler;
                if(commentDocID){
                    // Get info
                    resultAfterCallHandler = await INSPECTION__DOC_COMMENT_MODEL.getInfo({
                        commentID: commentDocID
                    });
                }else{
                    // Get list
                    resultAfterCallHandler = await INSPECTION__DOC_COMMENT_MODEL.getListComment({
                        inspectionID, limit, lastestIDComment, parentID
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}