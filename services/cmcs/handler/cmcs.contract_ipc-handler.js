/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const CMCS__CONTRACT_IPC_MODEL                 = require('../model/cmcs.contract_ipc-model').MODEL;

module.exports = {
    /**
	 * Dev: Depv ✅
	 * Func: Thêm contract ipc
	 */
    insert: {
        params: {
            type                : { type: "string" },
            contractID          : { type: "string" },
            name                : { type: "string" },
            sign                : { type: "string" },
            description         : { type: "string", optional: true },
            date                : { type: "string" },
            note                : { type: "string", optional: true },
            acceptance          : { type: "string", optional: true },
            vatAcceptance       : { type: "string", optional: true },
            plusAcceptance      : { type: "string", optional: true },
            vatPlusAcceptance   : { type: "string", optional: true },
            retainedValue       : { type: "string", optional: true },
            advancePaymentDeduction: { type: "string", optional: true },
            otherDeduction         : { type: "string", optional: true },
            timeForPayment         : { type: "string", optional: true },
            amountPaid             : { type: "string", optional: true },
            remainingPayment       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { type, projectID, contractID, name, sign, description, date, note, acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, timeForPayment, amountPaid, remainingPayment } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                
                let resultAfterCallHandler = await CMCS__CONTRACT_IPC_MODEL.insert({
                    type, projectID, contractID, name, sign, description, date, note, acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, timeForPayment, amountPaid, remainingPayment, userID, ctx
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },


    /**
	 * Dev: Depv ✅
	 * Func: Sửa contract ipc
	 */
    update: {
        params: {
            contractIpcID       : { type: "string" },
            type                : { type: "string", optional: true },
            name                : { type: "string", optional: true },
            sign                : { type: "string", optional: true },
            description         : { type: "string", optional: true },
            date                : { type: "string", optional: true  },
            note                : { type: "string", optional: true },
            acceptance          : { type: "string", optional: true },
            vatAcceptance       : { type: "string", optional: true },
            plusAcceptance      : { type: "string", optional: true },
            vatPlusAcceptance   : { type: "string", optional: true },
            retainedValue       : { type: "string", optional: true },
            advancePaymentDeduction: { type: "string", optional: true },
            otherDeduction         : { type: "string", optional: true },
            timeForPayment         : { type: "string", optional: true },
            amountPaid             : { type: "string", optional: true },
            remainingPayment       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { contractIpcID, type, name, sign, description, date, note, acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, timeForPayment, amountPaid, remainingPayment } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                let resultAfterCallHandler = await CMCS__CONTRACT_IPC_MODEL.update({
                    contractIpcID, type, name, sign, description, date, note, acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, timeForPayment, amountPaid, remainingPayment, userID, ctx
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Dev: Depv ✅
     * Func: Xóa contract ipc
     */
    remove: {
        params: {
            contractIpcID       : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { contractIpcID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                
                let resultAfterCallHandler = await CMCS__CONTRACT_IPC_MODEL.remove({
                    contractIpcID
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Dev: Depv ✅
     * Func: get info and get list contract ipc
     */
    getInfoAndGetList: {
        params: {
            contractIpcID : { type: "string", optional: true },
            type          : { type: "number", optional: true },
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
                let { contractIpcID, type, contractID, keyword, limit, lastestID, populates, select } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(contractIpcID){
                    resultAfterCallHandler = await CMCS__CONTRACT_IPC_MODEL.getInfo({
                        contractIpcID, userID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await CMCS__CONTRACT_IPC_MODEL.getList({
                        type, contractID, userID, keyword, limit, lastestID, select, populates
                    });
                }
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}