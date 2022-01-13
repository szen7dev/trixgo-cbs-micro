/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const CMCS__CONTRACT_PRODUCTION_MODEL            = require('../model/cmcs.contract_production-model').MODEL;

module.exports = {
    /**
	 * Dev: Depv ✅
	 * Func: Thêm contract production 
	 */
    insert: {
        params: {
            projectID           : { type: "string" },
            contractID          : { type: "string" },
            name                : { type: "string" },
            sign                : { type: "string" },
            description         : { type: "string", optional: true },
            date                : { type: "string" },
            produce             : { type: "number", optional: true },
            vatProduce          : { type: "number", optional: true },
            plusProduce         : { type: "number", optional: true },
            vatPlusProduce      : { type: "number", optional: true },
          
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { projectID, contractID, name, sign, description, date, produce, vatProduce, plusProduce, vatPlusProduce, } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                
                let resultAfterCallHandler = await CMCS__CONTRACT_PRODUCTION_MODEL.insert({
                    projectID, contractID, name, sign, description, date, produce, vatProduce, plusProduce, vatPlusProduce, userID, ctx
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: Sửa contract production
	 */
    update: {
        params: {
            contractProductionID: { type: "string" },
            projectID           : { type: "string" },
            contractID          : { type: "string" },
            name                : { type: "string" },
            sign                : { type: "string" },
            description         : { type: "string", optional: true },
            date                : { type: "string" },
            produce             : { type: "number", optional: true },
            vatProduce          : { type: "number", optional: true },
            plusProduce         : { type: "number", optional: true },
            vatPlusProduce      : { type: "number", optional: true }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { contractProductionID, projectID, contractID, name, sign, description, date, produce, vatProduce, plusProduce, vatPlusProduce } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                
                let resultAfterCallHandler = await CMCS__CONTRACT_PRODUCTION_MODEL.update({
                    contractProductionID, projectID, contractID, name, sign, description, date, produce, vatProduce, plusProduce, vatPlusProduce, userID, ctx
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
    
    /**
     * Dev: Depv ✅
     * Func: Xóa contract production
     */
    remove: {
        params: {
            contractProductionID : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { contractProductionID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                
                let resultAfterCallHandler = await CMCS__CONTRACT_PRODUCTION_MODEL.remove({
                    contractProductionID
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Dev: Depv ✅
     * Func: get info and get list contract production
     */
    getInfoAndGetList: {
        params: {
            contractProductionID : { type: "string", optional: true },
            projectID     : { type: "string", optional: true },
            contractID    : { type: "string", optional: true },

            // Field mặc định
            keyword     : { type: "string", optional: true },
            limit       : { type: "string", optional: true },
            lastestID   : { type: "string", optional: true },
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { contractProductionID, projectID, contractID, keyword, limit, lastestID, populates, select } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(contractProductionID){
                    resultAfterCallHandler = await CMCS__CONTRACT_PRODUCTION_MODEL.getInfo({
                        contractProductionID, userID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await CMCS__CONTRACT_PRODUCTION_MODEL.getList({
                        projectID, contractID, userID, keyword, limit, lastestID, select, populates
                    });
                }
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}