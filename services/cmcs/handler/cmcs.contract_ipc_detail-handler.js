/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const CMCS__CONTRACT_IPC_DETAIL_MODEL                 = require('../model/cmcs.contract_ipc_detail-model').MODEL;

module.exports = {
    /**
     * Name: Insert
     * Author: HiepNH
     * Date: 11/9/2022 
     */
    insert: {
        auth: "required",
        params: {
            type                : { type: "number" },
            contractID          : { type: "string" },
            name                : { type: "string" },
            sign                : { type: "string" },
            description         : { type: "string", optional: true },
            date                : { type: "string" },
            note                : { type: "string", optional: true },
            acceptance          : { type: "number", optional: true },
            vatAcceptance       : { type: "number", optional: true },
            plusAcceptance      : { type: "number", optional: true },
            vatPlusAcceptance   : { type: "number", optional: true },
            retainedValue       : { type: "number", optional: true },
            advancePaymentDeduction: { type: "number", optional: true },
            otherDeduction         : { type: "number", optional: true },
            timeForPayment         : { type: "string", optional: true },
            amountPaid             : { type: "number", optional: true },
            remainingPayment       : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { type, projectID, contractID, name, sign, description, date, note, acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, timeForPayment, amountPaid, remainingPayment } = ctx.params;
                const { _id: userID } = ctx.meta.infoUser;
                let resultAfterCallHandler = await CMCS__CONTRACT_IPC_DETAIL_MODEL.insert({
                    type, projectID, contractID, name, sign, description, date, note, acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, timeForPayment, amountPaid, remainingPayment, userID, ctx
                });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Update
     * Author: HiepNH
     * Date: 11/9/2022 
     */
    update: {
        auth: "required",
        params: {
            contractIpcID       : { type: "string" },
            type                : { type: "number", optional: true },
            name                : { type: "string", optional: true },
            sign                : { type: "string", optional: true },
            description         : { type: "string", optional: true },
            date                : { type: "string", optional: true  },
            note                : { type: "string", optional: true },
            acceptance          : { type: "number", optional: true },
            vatAcceptance       : { type: "number", optional: true },
            plusAcceptance      : { type: "number", optional: true },
            vatPlusAcceptance   : { type: "number", optional: true },
            retainedValue       : { type: "number", optional: true },
            advancePaymentDeduction: { type: "number", optional: true },
            otherDeduction         : { type: "number", optional: true },
            timeForPayment         : { type: "string", optional: true },
            amountPaid             : { type: "number", optional: true },
            remainingPayment       : { type: "number", optional: true },
        },
        async handler(ctx) {  
            try {
                await this.validateEntity(ctx.params);
                let { contractIpcID, type, name, sign, description, date, note, acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, timeForPayment, amountPaid, remainingPayment } = ctx.params;
               
                const { _id: userID } = ctx.meta.infoUser;
                let resultAfterCallHandler = await CMCS__CONTRACT_IPC_DETAIL_MODEL.update({
                    contractIpcID, type, name, sign, description, date, note, acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, timeForPayment, amountPaid, remainingPayment, userID, ctx
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Update value
     * Author: HiepNH
     * Date: 11/9/2022 
     */
    updateValue: {
        auth: "required",
        params: {
            option : { type: "number" },
            ipcID : { type: "string" },
        },
        async handler(ctx) {  
            try {
                await this.validateEntity(ctx.params);
                let { option, ipcID } = ctx.params;
            
                const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await CMCS__CONTRACT_IPC_DETAIL_MODEL.updateValue({
                    option, ipcID, userID, ctx
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Remove
     * Author: HiepNH
     * Date: 11/9/2022 
     */
    remove: {
        auth: "required",
        params: {
            contractIpcID       : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { contractIpcID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                let resultAfterCallHandler = await CMCS__CONTRACT_IPC_DETAIL_MODEL.remove({
                    contractIpcID
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Get info and Get list
     * Author: HiepNH
     * Date: 11/9/2022 
     */
    getInfoAndGetList: {
        auth: "required",
        params: {
            contractIpcID   : { type: "string", optional: true },
            companyID       : { type: "string", optional: true },
            projectID       : { type: "string", optional: true },
            contractID      : { type: "string", optional: true },
            type            : { type: "string", optional: true },
            outin           : { type: "string", optional: true },
            real            : { type: "string", optional: true },
            field           : { type: "string", optional: true },
            dependentUnit   : { type: "string", optional: true },
            chair           : { type: "string", optional: true },
            personInCharge  : { type: "string", optional: true },
            buyerInfo       : { type: "string", optional: true },
            sellerInfo      : { type: "string", optional: true },
            isMember        : { type: "string", optional: true },
            option          : { type: "string", optional: true },

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
                let { contractIpcID, isMember, option, companyID, projectID, contractID, type, outin, real, field, dependentUnit, personInCharge, chair, buyerInfo, sellerInfo, keyword, limit, lastestID, populates, select } = ctx.params;
                
				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(contractIpcID){
                    resultAfterCallHandler = await CMCS__CONTRACT_IPC_DETAIL_MODEL.getInfo({
                        contractIpcID, userID, select, populates
                    });
                }else{

                    if(!companyID){
                        companyID = company._id
                    }

                    resultAfterCallHandler = await CMCS__CONTRACT_IPC_DETAIL_MODEL.getList({
                        isMember, option, companyID, projectID, contractID, type: Number(type), outin: Number(outin), real: Number(real), field, dependentUnit, personInCharge, chair, buyerInfo, sellerInfo, userID, keyword, limit, lastestID, select, populates
                    });
                }
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

}