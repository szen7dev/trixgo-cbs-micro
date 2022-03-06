/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const PCM_PLAN_GROUP_MODEL            = require('../model/subject_pcm.pcm_plan_group').MODEL;

module.exports = {

    /**
	 * Dev: Depv ✅
	 * Func: getList and getInfo pcm_plan_report
	 */
    getInfoAndGetList: {
        auth: "required",
        params: {
            projectID   : { type: "string", optional: true },
            planGroupID : { type: "string", optional: true },
            //========================================
            keyword     : { type: "string", optional: true },
            limit       : { type: "string", optional: true },
            lastestID   : { type: "string", optional: true },
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  projectID, planGroupID, keyword, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                let resultAfterCallHandler; 
                if(planGroupID){
                    resultAfterCallHandler = await PCM_PLAN_GROUP_MODEL.getInfo({
                        planGroupID, select, populates, 
                    });
                }else{
                    resultAfterCallHandler = await PCM_PLAN_GROUP_MODEL.getList({
                        keyword, limit, userID, lastestID, projectID, select, populates, 
                    });
                }
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}