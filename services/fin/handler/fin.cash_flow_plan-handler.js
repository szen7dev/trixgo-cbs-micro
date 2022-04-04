/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const FIN__CASH_FLOW_PLAN_MODEL              = require('../model/fin.cash_flow_plan-model').MODEL;

module.exports = {
    /**
	 * Dev: Hiepnh ✅
	 * Func: Thêm cash flow plan
	 */
    insert: {
        auth: "required",
        params: {
            fundaID             : { type: "string", optional: true },
            contractID          : { type: "string", optional: true },
            parentID            : { type: "string", optional: true },
            type                : { type: "number", optional: true },
            property            : { type: "number", optional: true },
            outin               : { type: "number", optional: true },
            name                : { type: "string" },
            sign                : { type: "string", optional: true },
            note                : { type: "string", optional: true },
            date                : { type: "string" },
            planValue           : { type: "number" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { contractID, fundaID, parentID, type, property, outin, name, sign, note, date, planValue } = ctx.params;

                const { _id: userID, company } = ctx.meta.infoUser;

                let companyID;
                if(!contractID){
                    companyID = company._id
                }

                const resultAfterCallHandler = await FIN__CASH_FLOW_PLAN_MODEL.insert({
                    companyID, contractID, fundaID, parentID, type, property, outin, name, sign, note, date, planValue, userID, ctx
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: Sửa cash flow plan
	 */
    update: {
        auth: "required",
        params: {
            contractPaymentID   : { type: "string" },
            ipc                 : { type: "string", optional: true  },
            date                : { type: "string", optional: true  },
            name                : { type: "string", optional: true  },
            sign                : { type: "string", optional: true  },
            description         : { type: "string", optional: true  },
            value               : { type: "number", optional: true  },
        },
        async handler(ctx) {  
            try {
                await this.validateEntity(ctx.params);
                const { contractPaymentID, ipc, date, name, sign, description, value } = ctx.params;
                const { _id: userID } = ctx.meta.infoUser;
                const resultAfterCallHandler = await CMCS__CONTRACT_PAYMENT_MODEL.update({
                    contractPaymentID, ipc, date, name, sign, description, value, userID
                });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Dev: Depv ✅
     * Func: Xóa cash flow plan
     */
    remove: {
        auth: "required",
        params: {
            contractPaymentID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { contractPaymentID  } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                let resultAfterCallHandler = await CMCS__CONTRACT_PAYMENT_MODEL.remove({
                    contractPaymentID, userID
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Dev: Depv ✅
     * Func: get info and get list cash flow plan
     */
    getInfoAndGetList: {
        auth: "required",
        params: {
            contractPaymentID : { type: "string", optional: true },
            contractID        : { type: "string", optional: true },

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
                let { contractPaymentID, contractID, keyword, limit, lastestID, populates, select } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                let resultAfterCallHandler;
                if(contractPaymentID){
                    resultAfterCallHandler = await CMCS__CONTRACT_PAYMENT_MODEL.getInfo({
                        contractPaymentID, userID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await CMCS__CONTRACT_PAYMENT_MODEL.getList({
                        contractID, userID, keyword, limit, lastestID, select, populates
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}