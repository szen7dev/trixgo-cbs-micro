/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const CMCS__CONTRACT_PAYMENT_MODEL              = require('../model/cmcs.contract_payment-model').MODEL;

module.exports = {
    /**
	 * Dev: Depv ✅
	 * Func: Thêm contract payment
	 */
    insert: {
        auth: "required",
        params: {
            contractID          : { type: "string" },
            ipc                 : { type: "string" },
            date                : { type: "string" },
            name                : { type: "string" },
            sign                : { type: "string" },
            description         : { type: "string", optional: true },
            value               : { type: "number" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { contractID, ipc, date, name, sign, description, value } = ctx.params;
                const { _id: userID } = ctx.meta.infoUser;
                const resultAfterCallHandler = await CMCS__CONTRACT_PAYMENT_MODEL.insert({
                    contractID, ipc, date, name, sign, description, value, userID, ctx
                });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: Sửa contract payment
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
     * Func: Xóa contract payment
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
     * Func: get info and get list contract payment
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

    /**
     * Dev: Hiepnh ✅
     * Func: get amount by month
     */
     getAmountByMonth: {
        auth: "required",
        params: {
            outin : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { contractPaymentID, contractID, keyword, limit, lastestID, populates, select } = ctx.params;

                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await CMCS__CONTRACT_PAYMENT_MODEL.getAmountByMonth({
                    userID, companyID: company._id, outin, year
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

}