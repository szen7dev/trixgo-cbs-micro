/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }       = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const PCM_COMMENT_MODEL                     = require('../model/subject_pcm.pcm_comment-model').MODEL;

module.exports = {
    /**
	 * Dev: MinhVH
	 * Func: Tạo comment
	 * Date: 17/08/2021
	 * Update: 22/02/2022
	 */
    insert: {
        auth: "required",
        params: {
			content    : { type: "string", optional: true },
            taskID     : { type: "string" },
            type       : { type: "number" },
            parentID   : { type: "string", optional: true },
            files      : { type: "array", optional: true },
            images     : { type: "array", optional: true },
            select     : { type: "string", optional: true },
            populates  : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID, bizfullname } = ctx.meta.infoUser;
                const { content, taskID, type, parentID, files, images, select, populates } = ctx.params;

                const resultAfterCallHandler = await PCM_COMMENT_MODEL.insert({
					taskID, parentID, authorID, type, content, files, images, select, populates, bizfullname, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

     /**
	 * Dev: MinhVH
	 * Func: Cập nhật comment
	 * Date: 22/02/2022
	 */
    update: {
        auth: "required",
        params: {
            taskID              : { type: "string" },
            commentID           : { type: "string" },
			content             : { type: "string", optional: true },
            files               : { type: "array", optional: true },
            images              : { type: "array", optional: true },
            select              : { type: "string", optional: true },
            populates           : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { taskID, commentID, content, files, images, select, populates } = ctx.params;

                const resultAfterCallHandler = await PCM_COMMENT_MODEL.update({
					taskID, commentID, authorID, content, files, images, select, populates
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Cập nhật đánh dấu comment
	 * Date: 17/08/2021
	 * Update: 22/02/2022
	 */
    updateMarkResponse: {
        auth: "required",
        params: {
			commentID   : { type: "string" },
			taskID      : { type: "string" },
            official    : { type: "boolean" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
                const { taskID, commentID, official } = ctx.params;

                const resultAfterCallHandler = await PCM_COMMENT_MODEL.updateMarkResponse({
					taskID, commentID, official
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Xóa comment
	 * Date: 17/08/2021
	 * Update: 22/02/2022
	 */
    delete: {
        auth: "required",
        params: {
			commentID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { commentID } = ctx.params;

                const resultAfterCallHandler = await PCM_COMMENT_MODEL.delete({ commentID, authorID });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: Danh sách hoặc chi tiết comment
	 * Date: 17/08/2021
	 * Update: 22/02/2022
	 */
    getInfoAndGetList: {
        params: {
            taskID              : { type: "string", optional: true },
            type                : { type: "string", optional: true },
            official            : { type: "string", optional: true },
            limit               : { type: "string", optional: true },
            lastestID           : { type: "string", optional: true },
            parentID            : { type: "string", optional: true },
            commentID           : { type: "string", optional: true },
            contractID          : { type: "string", optional: true },
            select              : { type: "string", optional: true },
            populates           : { type: "string", optional: true },
            sortKey             : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				let { _id: authorID } = ctx.meta.infoUser;
                let { taskID, limit, parentID, lastestID, commentID, contractID, type, official, sortKey, select, populates } = ctx.params;
                let resultAfterCallHandler = null;

                if(commentID){
                    resultAfterCallHandler = await PCM_COMMENT_MODEL.getInfo({
                        commentID, select, populates
                    });
                } else{
                    resultAfterCallHandler = await PCM_COMMENT_MODEL.getList({
                        taskID, contractID, parentID, limit, lastestID, type, official, sortKey, select, populates, authorID
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Danh sách comment tìm kiếm theo id
	 * Date: ...
	 * Update: 22/02/2022
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

                let resultAfterCallHandler = await PCM_COMMENT_MODEL.searchCommentById({
                    taskID, authorID, commentID, select, populates
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
}