/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
 const AUTH__REGISTER_TRIAL                     = require('../model/auth.register_trial-model').MODEL;
 
module.exports = {
    /**
     * Dev: Depv 
     * Func: insert register trial
     */
    insert: {
        params: {
            fullname      : { type: "string" },
            organization  : { type: "string" },
            type          : { type: "number" },
            email         : { type: "string" },
            phone         : { type: "string", optional: true },
            note          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { fullname, organization, type, email, phone, note } = ctx.params;
                let resultAfterCallHandler = await AUTH__REGISTER_TRIAL.insert({
                    fullname, organization, type, email, phone, note
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
            registerTrialID : { type: "string" },
            fullname        : { type: "string", optional: true },
            organization    : { type: "string", optional: true },
            type            : { type: "number", optional: true },
            email           : { type: "string", optional: true },
            phone           : { type: "string", optional: true },
            note            : { type: "string", optional: true },
            
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID } = ctx.meta.infoUser;
                let { registerTrialID, fullname, organization, type, email, phone, note } = ctx.params;

                let resultAfterCallHandler = await AUTH__REGISTER_TRIAL.update({
                    registerTrialID, fullname, organization, type, email, phone, note, userID
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
            registerTrialID : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { registerTrialID } = ctx.params;

                let resultAfterCallHandler = await AUTH__REGISTER_TRIAL.remove({
                    registerTrialID
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },


    /**
     * Dev: Depv 
     * Func: get info and get list register trialprogram
     */
    getInfoAndGetList: {
        auth: "required",
        params: {
            registerTrialID : { type: "string", optional: true },
            type            : { type: "string", optional: true },

            keyword         : { type: "string", optional: true },
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            filter          : { type: "string", optional: true },
            select          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);

                let { registerTrialID, type, keyword, filter, select, limit, lastestID } = ctx.params;
                let resultAfterCallHandler;
                if(registerTrialID){
                    resultAfterCallHandler = await AUTH__REGISTER_TRIAL.getInfo({ registerTrialID, select });
                }else{
                    resultAfterCallHandler = await AUTH__REGISTER_TRIAL.getList({  type, keyword, limit, lastestID, filter });
                }
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Dev: Depv 
     * Func: Thống kê theo tổ chức
     */
    statisticsByType: {
        auth: "required",
        params: {
            fromDate : { type: "string" },
            toDate   : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  fromDate, toDate } = ctx.params;

                let resultAfterCallHandler = await AUTH__REGISTER_TRIAL.statisticsByType({
                    fromDate, toDate
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },


    /**
     * Dev: Depv 
     * Func: Thống kê theo năm
     */
    statisticsByYear: {
        auth: "required",
        params: {
            year : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { year } = ctx.params;

                let resultAfterCallHandler = await AUTH__REGISTER_TRIAL.statisticsByYear({
                    year
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },


      /**
     * Dev: Depv 
     * Func: Thống kê theo công ty
     */
    statisticsByCompany: {
        auth: "required",
        params: {
            fromDate : { type: "string" },
            toDate   : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { fromDate, toDate } = ctx.params;

                let resultAfterCallHandler = await AUTH__REGISTER_TRIAL.statisticsByCompany({
                    fromDate, toDate
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
   
}