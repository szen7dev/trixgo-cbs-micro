/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const FIN__CASH_BOOK_MODEL              = require('../model/fin.cash_book-model').MODEL;

module.exports = {
    /**
	 * Dev: Hiepnh ✅
	 * Func: Thêm cash flow plan
	 */
    insert: {
        auth: "required",
        params: {
            parentID            : { type: "string", optional: true },
            accountID           : { type: "string", optional: true },
            customerID          : { type: "string", optional: true },
            contractID          : { type: "string", optional: true },
            name                : { type: "string" },
            sign                : { type: "string", optional: true },
            note                : { type: "string", optional: true },
            date                : { type: "string", optional: true },
            income              : { type: "number", optional: true },
            expense             : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { parentID, accountID, customerID, contractID, name, sign, note, date, income, expense } = ctx.params;

                const { _id: userID, company } = ctx.meta.infoUser;

                const resultAfterCallHandler = await FIN__CASH_BOOK_MODEL.insert({
                    companyID: company._id, userID, parentID, accountID, customerID, contractID, name, sign, note, date, income, expense, ctx
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
            cashFlowPlanID   : { type: "string" },
            name                : { type: "string" },
            sign                : { type: "string", optional: true },
            note                : { type: "string", optional: true },
            date                : { type: "string" },
            planValue           : { type: "number" },
        },
        async handler(ctx) {  
            try {
                await this.validateEntity(ctx.params);
                const { cashFlowPlanID, ipc, date, name, sign, description, value } = ctx.params;
                const { _id: userID } = ctx.meta.infoUser;
                const resultAfterCallHandler = await FIN__CASH_BOOK_MODEL.update({
                    cashFlowPlanID, ipc, date, name, sign, description, value, userID
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
                let resultAfterCallHandler = await FIN__CASH_BOOK_MODEL.remove({
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
            cashFlowPlanID : { type: "string", optional: true },
            companyID     : { type: "string", optional: true },
            projectID     : { type: "string", optional: true },
            contractID     : { type: "string", optional: true },
            outin     : { type: "number", optional: true },
            type     : { type: "number", optional: true },
            property     : { type: "number", optional: true },
            priority     : { type: "number", optional: true },

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
                let { cashFlowPlanID, companyID, projectID, contractID, outin, type, property, priority, keyword, limit, lastestID, populates, select } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                let resultAfterCallHandler;
                if(cashFlowPlanID){
                    resultAfterCallHandler = await FIN__CASH_BOOK_MODEL.getInfo({
                        cashFlowPlanID, userID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await FIN__CASH_BOOK_MODEL.getList({
                        companyID, projectID, contractID, outin, type, property, priority, userID, keyword, limit, lastestID, select, populates
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}