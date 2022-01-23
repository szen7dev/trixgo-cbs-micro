/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
 const ITEM__CONTRACT_MODEL                   	= require('../model/item.contract-model').MODEL;

module.exports = {
    updateContractByCondition: {
        async handler(ctx) {
            try {
                let { condition, update } = ctx.params;

                const resultAfterCallHandler = await ITEM__CONTRACT_MODEL.updateContractByCondition({ condition, update });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    getListContract: {
        params: {
            lastestID: { type: "string", optional: true },
            limit: { type: "number", optional: true },
            keyword: { type: "string", optional: true },
            departmentID: { type: "string", optional: true },
            filter: { type: "string", optional: true },
            select: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID } = ctx.meta.infoUser;
                const { lastestID, departmentID, keyword, limit, filter, select } = ctx.params;

                const resultAfterCallHandler = await ITEM__CONTRACT_MODEL.getListContract({
                    lastestID, userID, departmentID, keyword, limit, filter, select
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
     * KHU VỰC NÀY PHAN VĂN ĐỆ VIẾT
     */

    /**
	 * Dev: Depv ✅
	 * Func: Thêm contract
	 * Date: 19/08/2021
	 */
    insert: {
        auth: "required",
        params: {
            projectID       : { type: "string" },
            parentID        : { type: "string", optional: true },
            admins          : { type: "string", optional: true },
            members         : { type: "string", optional: true },
            draft           : { type: "number", optional: true },
            outin           : { type: "number", optional: true },
            status          : { type: "number", optional: true },
            real            : { type: "number", optional: true },
            outin           : { type: "number", optional: true },
            type            : { type: "number", optional: true },
            subType         : { type: "number", optional: true },
            field           : { type: "string", optional: true },
            chair           : { type: "string", optional: true },
            personInCharge  : { type: "string", optional: true },
            debtStatus      : { type: "string", optional: true },
            warehouse       : { type: "string", optional: true },
            name            : { type: "string", optional: true },
            sign            : { type: "string", optional: true },
            storeSign       : { type: "string", optional: true },
            description     : { type: "string", optional: true },
            note            : { type: "string", optional: true },
            note1           : { type: "string", optional: true },
            date            : { type: "string", optional: true },
            startTime       : { type: "string", optional: true },
            endTime         : { type: "string", optional: true },
            buyerInfo       : { type: "string", optional: true },
            buyerBank       : { type: "string", optional: true },
            sellerBank      : { type: "string", optional: true },
            packageName     : { type: "string", optional: true },
            lock            : { type: "number", optional: true },
            value           : { type: "number", optional: true },
            plus            : { type: "number", optional: true },
            vatValue        : { type: "number", optional: true },
            advancePayment  : { type: "number", optional: true },
            produce         : { type: "number", optional: true },
            plusProduce     : { type: "number", optional: true },
            vatProduce      : { type: "number", optional: true },
            acceptance      : { type: "number", optional: true },
            plusAcceptance  : { type: "number", optional: true },
            vatAcceptance   : { type: "number", optional: true },
            retainedValue   : { type: "number", optional: true },
            advancePaymentDeduction: { type: "number", optional: true },
            otherDeduction         : { type: "number", optional: true },
            recommendedPayment     : { type: "number", optional: true },
            advancePaymentPaid     : { type: "number", optional: true },
            amountPaid             : { type: "number", optional: true },
            remainingPayment       : { type: "number", optional: true },
            advancePaymentOverage  : { type: "number", optional: true },
            finalValue             : { type: "number", optional: true },
            budget                 : { type: "number", optional: true },
            budgetVAT              : { type: "number", optional: true },
            forecastBudget         : { type: "number", optional: true },
            forecastBudgetVAT      : { type: "number", optional: true },
            managementFee          : { type: "number", optional: true },
            subcontractFee         : { type: "number", optional: true },
            expenses               : { type: "number", optional: true },
            profit                 : { type: "number", optional: true },
            cgValue                : { type: "number", optional: true },
            expiredCg              : { type: "string", optional: true },
            agValue                : { type: "number", optional: true },
            expiredAg              : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { projectID, parentID, admins, members, draft, outin, status, real, subType, type, field, chair, personInCharge, debtStatus, warehouse, name,
                     sign, storeSign, description, note, note1, date, startTime, endTime, buyerInfo, buyerBank, sellerInfo, sellerBank, packageName, lock, 
                     value, plus, vatValue, advancePayment, produce, plusProduce, vatProduce, acceptance, plusAcceptance, vatAcceptance, retainedValue, advancePaymentDeduction,
                      otherDeduction, recommendedPayment, advancePaymentPaid, amountPaid, remainingPayment, advancePaymentOverage, finalValue, budget, budgetVAT, forecastBudget, 
                      forecastBudgetVAT, managementFee, subcontractFee, expenses, profit, cgValue, expiredCg, agValue, expiredAg  } = ctx.params;
                
                const resultAfterCallHandler = await ITEM__CONTRACT_MODEL.insert({
					projectID, parentID, admins, members, draft, outin, status, real, subType, type, field, chair, personInCharge, debtStatus, warehouse, name, sign, storeSign, description, note, note1, date, startTime, endTime, buyerInfo, buyerBank, sellerInfo, sellerBank, packageName, lock, value, plus, vatValue, advancePayment, produce, plusProduce, vatProduce, acceptance, plusAcceptance, vatAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, advancePaymentPaid, amountPaid, remainingPayment, advancePaymentOverage, finalValue, budget, budgetVAT, forecastBudget, forecastBudgetVAT, managementFee, subcontractFee, expenses, profit, cgValue, expiredCg, agValue, expiredAg, userID, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },


     /**
	 * Dev: Depv ✅
	 * Func: Cập nhật hợp đồng
	 * Date: 19/08/2021
	 */
    update: {
        auth: "required",
        params: {
            contractID      : { type: "string" },
            projectID       : { type: "string", optional: true },
            parentID        : { type: "string", optional: true },
            admins          : { type: "string", optional: true },
            members         : { type: "string", optional: true },
            draft           : { type: "number", optional: true },
            outin           : { type: "number", optional: true },
            status          : { type: "number", optional: true },
            real            : { type: "number", optional: true },
            outin           : { type: "number", optional: true },
            type            : { type: "number", optional: true },
            subType         : { type: "number", optional: true },
            field           : { type: "string", optional: true },
            chair           : { type: "string", optional: true },
            personInCharge  : { type: "string", optional: true },
            debtStatus      : { type: "string", optional: true },
            warehouse       : { type: "string", optional: true },
            name            : { type: "string", optional: true },
            sign            : { type: "string", optional: true },
            storeSign       : { type: "string", optional: true },
            description     : { type: "string", optional: true },
            note            : { type: "string", optional: true },
            note1           : { type: "string", optional: true },
            date            : { type: "string", optional: true },
            startTime       : { type: "string", optional: true },
            endTime         : { type: "string", optional: true },
            buyerInfo       : { type: "string", optional: true },
            buyerBank       : { type: "string", optional: true },
            sellerBank      : { type: "string", optional: true },
            packageName     : { type: "string", optional: true },
            lock            : { type: "number", optional: true },
            value           : { type: "number", optional: true },
            plus            : { type: "number", optional: true },
            vatValue        : { type: "number", optional: true },
            advancePayment  : { type: "number", optional: true },
            produce         : { type: "number", optional: true },
            plusProduce     : { type: "number", optional: true },
            vatProduce      : { type: "number", optional: true },
            acceptance      : { type: "number", optional: true },
            plusAcceptance  : { type: "number", optional: true }, 
            vatAcceptance   : { type: "number", optional: true },
            retainedValue   : { type: "number", optional: true },
            advancePaymentDeduction: { type: "number", optional: true },
            otherDeduction         : { type: "number", optional: true },
            recommendedPayment     : { type: "number", optional: true },
            advancePaymentPaid     : { type: "number", optional: true },
            amountPaid             : { type: "number", optional: true },
            remainingPayment       : { type: "number", optional: true },
            advancePaymentOverage  : { type: "number", optional: true },
            finalValue             : { type: "number", optional: true },
            budget                 : { type: "number", optional: true },
            budgetVAT              : { type: "number", optional: true },
            forecastBudget         : { type: "number", optional: true },
            forecastBudgetVAT      : { type: "number", optional: true },
            managementFee          : { type: "number", optional: true },
            subcontractFee         : { type: "number", optional: true },
            expenses               : { type: "number", optional: true },
            profit                 : { type: "number", optional: true },
            cgValue                : { type: "number", optional: true },
            expiredCg              : { type: "string", optional: true },
            agValue                : { type: "number", optional: true },
            expiredAg              : { type: "string", optional: true },
            dataInc                : { type: "object", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { contractID, projectID, parentID, admins, members, draft, outin, status, real, subType, type, field, chair, personInCharge, debtStatus, warehouse, name,
                     sign, storeSign, description, note, note1, date, startTime, endTime, buyerInfo, buyerBank, sellerInfo, sellerBank, packageName, lock, 
                     value, plus, vatValue, advancePayment, produce, plusProduce, vatProduce, acceptance, plusAcceptance, vatAcceptance, retainedValue, advancePaymentDeduction,
                      otherDeduction, recommendedPayment, advancePaymentPaid, amountPaid, remainingPayment, advancePaymentOverage, finalValue, budget, budgetVAT, forecastBudget, 
                      forecastBudgetVAT, managementFee, subcontractFee, expenses, profit, cgValue, expiredCg, agValue, expiredAg, dataInc } = ctx.params;
                      
                const resultAfterCallHandler = await ITEM__CONTRACT_MODEL.update({
                    contractID,
					projectID, parentID, admins, members, draft, outin, status, real, subType, type, field, chair, personInCharge, debtStatus, warehouse, name, sign, storeSign, description, note, note1, date, startTime, endTime, buyerInfo, buyerBank, sellerInfo, sellerBank, packageName, lock, value, plus, vatValue, advancePayment, produce, plusProduce, vatProduce, acceptance, plusAcceptance, vatAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, advancePaymentPaid, amountPaid, remainingPayment, advancePaymentOverage, finalValue, budget, budgetVAT, forecastBudget, forecastBudgetVAT, managementFee, subcontractFee, expenses, profit, cgValue, expiredCg, agValue, expiredAg, userID, dataInc, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },


    /**
	 * Dev: Depv ✅
	 * Func: XÓA HỢP ĐỒNG
	 * Date: 19/08/2021
	 */
    remove: {
        auth: "required",
        params: {
            contractID      : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { contractID }  = ctx.params;
                const resultAfterCallHandler = await ITEM__CONTRACT_MODEL.remove({ contractID });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

     /**
	 * Dev: Depv ✅
	 * Func: LẤY THÔNG TIN HOẶC LẤY DANH SACH HỢP ĐỒNG
	 * Date: 19/08/2021
	 */
    getInfoAndGetList: {
        auth: "required",
        params: {
            contractID          : { type: "string", optional: true },
            projectID           : { type: "string", optional: true },
            parentID            : { type: "string", optional: true },
            draft               : { type: "string", optional: true },
            outin               : { type: "string", optional: true },
            status              : { type: "string", optional: true },
            real                : { type: "string", optional: true },
            subType             : { type: "string", optional: true },
            type                : { type: "string", optional: true },
            field               : { type: "string", optional: true },
            chair             : { type: "string", optional: true },
            personInCharge    : { type: "string", optional: true },
            debtStatus        : { type: "string", optional: true },
            warehouse         : { type: "string", optional: true },
            companyID           : { type: "string", optional: true },

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
                let { companyID, contractID, projectID, parentID, draft, outin, status, real, subType, type, field, chair, personInCharge, debtStatus, warehouse, date, startTime, endTime, buyerInfo, buyerBank, sellerInfo, sellerBank, lock, 
                    keyword, limit, lastestID, select, populates
                } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(contractID){
                    resultAfterCallHandler = await ITEM__CONTRACT_MODEL.getInfo({
                        contractID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await ITEM__CONTRACT_MODEL.getList({
                        companyID, projectID, parentID, draft, outin, status, real, subType, type, field, chair, personInCharge, debtStatus, warehouse, date, startTime, endTime, buyerInfo, buyerBank, sellerInfo, sellerBank, lock, userID,
                        keyword, limit, lastestID, select, populates
                    });
                }
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },


}
