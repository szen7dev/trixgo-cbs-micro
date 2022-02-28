/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const DATAHUB_FINREPORT_MODEL                      = require('../model/datahub.datahub_finreport-model').MODEL;

module.exports = {
    /**
	 * Dev: Depv ✅
	 * Func: Thêm datahub finreport
	 */
    insert: {
        params: {
            fiscalYear        : { type: "number" },
            asset             : { type: "number", optional: true  },
            liabilitiy        : { type: "number", optional: true  },
            netWorth          : { type: "number", optional: true  },
            currentAsset      : { type: "number", optional: true  },
            workingCapital    : { type: "number", optional: true  },
            grossRevenue      : { type: "number", optional: true  },
            grossConstructionRevenue : { type: "number", optional: true  },
            grossProfit              : { type: "number", optional: true  },
            grossProfitAfterTax      : { type: "number", optional: true  },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { fiscalYear, asset, liabilitiy, netWorth, currentAsset, workingCapital, grossRevenue, grossConstructionRevenue, grossProfit, grossProfitAfterTax } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                
                let resultAfterCallHandler = await DATAHUB_FINREPORT_MODEL.insert({
                    fiscalYear, asset, liabilitiy, netWorth, currentAsset, workingCapital, grossRevenue, grossConstructionRevenue, grossProfit, grossProfitAfterTax, userID
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: Sửa datahub finreport
	 */
    update: {
        params: {
            datahubFinreportID: { type: "string" },
            fiscalYear        : { type: "number", optional: true  },
            asset             : { type: "number", optional: true  },
            liabilitiy        : { type: "number", optional: true  },
            netWorth          : { type: "number", optional: true  },
            currentAsset      : { type: "number", optional: true  },
            workingCapital    : { type: "number", optional: true  },
            grossRevenue      : { type: "number", optional: true  },
            grossConstructionRevenue : { type: "number", optional: true  },
            grossProfit              : { type: "number", optional: true  },
            grossProfitAfterTax      : { type: "number", optional: true  },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  datahubFinreportID, fiscalYear, asset, liabilitiy, netWorth, currentAsset, workingCapital, grossRevenue, grossConstructionRevenue, grossProfit, grossProfitAfterTax } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                
                let resultAfterCallHandler = await DATAHUB_FINREPORT_MODEL.update({
                    datahubFinreportID, fiscalYear, asset, liabilitiy, netWorth, currentAsset, workingCapital, grossRevenue, grossConstructionRevenue, grossProfit, grossProfitAfterTax, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
    
    /**
     * Dev: Depv ✅
     * Func: Xóa datahub finreport
     */
    remove: {
        params: {
            datahubFinreportID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { datahubFinreportID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                
                let resultAfterCallHandler = await DATAHUB_FINREPORT_MODEL.remove({
                    datahubFinreportID 
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Dev: Depv ✅
     * Func: get info and get list datahub finreport
     */
    getInfoAndGetList: {
        params: {
            datahubFinreportID : { type: "string", optional: true },
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
                let { datahubFinreportID, lastestID, keyword, limit, select, populates } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(datahubFinreportID){
                    resultAfterCallHandler = await DATAHUB_FINREPORT_MODEL.getInfo({
                        datahubFinreportID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await DATAHUB_FINREPORT_MODEL.getList({
                        userID, lastestID, keyword, limit: +limit, select, populates
                    });
                }
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}