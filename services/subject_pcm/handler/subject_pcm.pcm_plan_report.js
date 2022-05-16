/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const PCM_PLAN_REPORT_MODEL            = require('../model/subject_pcm.pcm_plan_report').MODEL;

module.exports = {
    /**
	 * Dev: Depv
	 * Func: insert pcm_plan_report
	 */
    insert: {
        auth: "required",
        params: {
            type              : { type: "string", optional: true },
            name              : { type: "string", optional: true },
            description       : { type: "string", optional: true },
            parentID          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { type, name, description, parentID } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await PCM_PLAN_REPORT_MODEL.insert({
                    companyID: company._id, type, name, description, parentID, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: update pcm_plan_report
	 */
    update: {
        auth: "required",
        params: {
            subjectID         : { type: "string" },
            name              : { type: "string", optional: true },
            type              : { type: "number", optional: true },
            select            : { type: "string", optional: true },
            members           : { type: "array", optional: true },
            conditionPin      : { type: "object", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { subjectID, name, type, select, members, conditionPin } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await PCM_PLAN_REPORT_MODEL.update({
                    reportID: subjectID, name, type, userID, select, members, conditionPin
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

     /**
	 * Dev: Depv
	 * Func: remove pcm_plan_report
	 */
    remove: {
        auth: "required",
        params: {
            subjectID         : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { subjectID } = ctx.params;

				const { _id: userID } = ctx.meta.infoUser;

                // Bước check quyền
                let resultAfterCallHandler = await PCM_PLAN_REPORT_MODEL.remove({
                    reportID: subjectID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: getList and getInfo pcm_plan_report
	 */
    getInfoAndGetList: {
        auth: "required",
        params: {
            type        : { type: "string", optional: true },
            parentID    : { type: "string", optional: true },
            subjectID   : { type: "string", optional: true },
            //==============================================
            keyword     : { type: "string", optional: true },
            limit       : { type: "string", optional: true },
            lastestID   : { type: "string", optional: true },
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },

        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { subjectID, type, parentID,
                    keyword, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(subjectID){
                    resultAfterCallHandler = await PCM_PLAN_REPORT_MODEL.getInfo({
                        reportID: subjectID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await PCM_PLAN_REPORT_MODEL.getList({
                        type, parentID, userID, keyword, limit, lastestID, select, populates
                    })
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}