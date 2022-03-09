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
	 * Func: insert Group
	 */
    insert: {
        auth: "required",
        params: {
            projectID : { type: "string" },
            name      : { type: "string" },
            sign      : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  projectID, name, sign } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await PCM_PLAN_GROUP_MODEL.insert({
                    projectID, name, sign, userID
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },


    /**
	 * Dev: Depv ✅
	 * Func: update Group
	 */
    update: {
        auth: "required",
        params: {
            groupID   : { type: "string" },
            name      : { type: "string" },
            sign      : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  groupID, name, sign } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await PCM_PLAN_GROUP_MODEL.update({
                    groupID, name, sign, userID
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    
    /**
	 * Dev: Depv ✅
	 * Func: remove Group
	 */
    remove: {
        auth: "required",
        params: {
            groupID   : { type: "string" }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  groupID } = ctx.params; 
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await PCM_PLAN_GROUP_MODEL.remove({
                    groupID
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
            projectID   : { type: "string", optional: true },
            groupID : { type: "string", optional: true },
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
                let {  projectID, groupID, keyword, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                let resultAfterCallHandler; 
                if(groupID){
                    resultAfterCallHandler = await PCM_PLAN_GROUP_MODEL.getInfo({
                        groupID, select, populates, 
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