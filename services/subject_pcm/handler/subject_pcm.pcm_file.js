/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const PCM_FILE_MODEL                            = require('../model/subject_pcm.pcm_file-model').MODEL;

module.exports = {
    /**
	 * Dev: MinhVH
	 * Func: Get info and list
	 */
    getInfoAndGetList: {
        auth: "required",
        params: {
            pcmFileID    : { type: "string", optional: true },
            companyID    : { type: "string", optional: true },
            projectID    : { type: "string", optional: true },
            groupID      : { type: "string", optional: true },
            taskID       : { type: "string", optional: true },
            authorID     : { type: "string", optional: true },
            type         : { type: "string", optional: true },
            fromDate     : { type: "string", optional: true },
            toDate       : { type: "string", optional: true },

            keyword      : { type: "string", optional: true },
            limit        : { type: "string", optional: true },
            lastestID    : { type: "string", optional: true },
            select       : { type: "string", optional: true },
            populates    : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const {
                    keyword, companyID, projectID, groupID, taskID, authorID, type, fromDate, toDate,
                    limit, lastestID, select, populates
                } = ctx.params;

                const resultAfterCallHandler = await PCM_FILE_MODEL.getList({
                    companyID, projectID, groupID, taskID, authorID, keyword, type, fromDate, toDate,
                    limit, lastestID, select, populates
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Dev: MinhVH
     * Func: Lấy danh sách file, group theo tháng năm
     * Date: 02/04/2022
     */
    getListFilesGroupByDate: {
        auth: "required",
        params: {
            companyID    : { type: "string", optional: true },
            projectID    : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { companyID, projectID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await PCM_FILE_MODEL.getListFilesGroupByDate({
                    companyID, projectID, userID, ctx
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Dev: MinhVH
     * Func: Lấy danh sách file, group theo hợp đồng
     * Date: 02/04/2022
     */
    getListFilesGroupByContract: {
        auth: "required",
        params: {
            projectID   : { type: "string" },
            keyword     : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { keyword, projectID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await PCM_FILE_MODEL.getListFilesGroupByContract({
                    keyword, projectID, userID, ctx
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },
}