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
	 * Dev: Depv ✅
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
            type         : { type: "string", optional: true },

            keyword      : { type: "string", optional: true },
            limit        : { type: "string", optional: true },
            lastestID    : { type: "string", optional: true },
            select       : { type: "string", optional: true },
            populates    : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { pcmFileID, companyID, projectID, groupID, taskID, type, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                let resultAfterCallHandler;
                if(pcmFileID){
                    // Get info xử lý sau nếu cần
                }else{
                    resultAfterCallHandler = await PCM_FILE_MODEL.getList({
                        companyID, projectID, groupID, taskID, type, limit, lastestID, select, populates
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}