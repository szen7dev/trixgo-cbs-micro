/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const SUBJECT__PCM_PLAN_GROUP_MODEL            = require('../model/subject_pcm.pcm_plan_group').MODEL;

module.exports = {

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
            projectID   : { type: "string", optional: true },
            planGroupID : { type: "string", optional: true },
            filter      : { type: "string", optional: true },
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
            populates1: { type: "string", optional: true },
            populates2: { type: "string", optional: true },
            populates3: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { keyword, limit, lastestID, projectID, planGroupID, filter, select, populates, populates1, populates2, populates3 } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                let resultAfterCallHandler; 
                if(planGroupID){
                    resultAfterCallHandler = await SUBJECT__PCM_PLAN_GROUP_MODEL.getInfo({
                        planGroupID, select, populates, populates1, populates2, populates3
                    });
                }else{
                    resultAfterCallHandler = await SUBJECT__PCM_PLAN_GROUP_MODEL.getList({
                        keyword, limit, userID, lastestID, projectID, filter, populates, populates1, populates2, populates3
                    });
                }
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}