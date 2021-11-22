/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const SUBJECT__PCM_PLAN_REPORT_MODEL            = require('../model/subject.pcm_plan_report').MODEL;

module.exports = {
    /**
	 * Dev: Depv ✅
	 * Func: insert pcm_plan_report
	 */
    insert: {
        auth: "required",
        params: {
            type              : { type: "string", optional: true },
            name              : { type: "string", optional: true },
            parentID            : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { type, name, parentID } = ctx.params;
				const { _id: userID, company: companyID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await SUBJECT__PCM_PLAN_REPORT_MODEL.insert({
                    companyID, type, name, parentID, userID
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: update pcm_plan_report
	 */
    update: {
        auth: "required",
        params: {
            reportID          : { type: "string" },
            name              : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { reportID, name } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                // Bước check quyền
                let resultAfterCallHandler = await SUBJECT__PCM_PLAN_REPORT_MODEL.update({
                    reportID, name, userID
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

     /**
	 * Dev: Depv ✅
	 * Func: remove pcm_plan_report
	 */
    remove: {
        auth: "required",
        params: {
            reportID         : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { reportID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                // Bước check quyền

                let resultAfterCallHandler = await SUBJECT__PCM_PLAN_REPORT_MODEL.remove({
                    reportID
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: getList and getInfo pcm_plan_report
	 */
    getInfoAndGetList: {
        auth: "required",
        params: {
            keyword     : { type: "string", optional: true },
            limit       : { type: "string", optional: true },
            lastestID   : { type: "string", optional: true },
            type        : { type: "string", optional: true },
            parentID    : { type: "string", optional: true },
            filter      : { type: "string", optional: true },
            select      : { type: "string", optional: true },
            reportID   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { reportID, keyword, limit, lastestID, type, parentID, filter, select } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                    
                let resultAfterCallHandler;
                if(reportID){
                    resultAfterCallHandler = await SUBJECT__PCM_PLAN_REPORT_MODEL.getInfo({
                        reportID, select
                    });
                }else{
                    resultAfterCallHandler = await SUBJECT__PCM_PLAN_REPORT_MODEL.getList({
                        keyword, limit, lastestID, type, parentID, filter, select
                    });
                }
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}