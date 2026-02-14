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
     * Name: Insert
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    insert: {
        auth: "required",
        params: {
            name                : { type: "string" },
            // fundaID             : { type: "string" },
            // fromDate            : { type: "string" },
            // toDate              : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { fundaID, parentID, subtypeID, name, note, revenue, expense, actualRevenue, actualExpense, fromDate, toDate, status } = ctx.params;

                // console.log(ctx.params)

                let { _id: userID, company } = ctx.meta.infoUser;

                const resultAfterCallHandler = await FIN__CASH_FLOW_PLAN_MODEL.insert({
                    companyID: company._id, userID, fundaID, parentID, subtypeID, name, note, revenue, expense, actualRevenue, actualExpense, fromDate, toDate, status
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Update
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    update: {
        auth: "required",
        params: {
            cashFlowID          : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const {
                    cashFlowID, fundaID, subtypeID, name, note, revenue, expense, actualRevenue, actualExpense, fromDate, toDate, status
                } = ctx.params;

                // console.log(ctx.params)

                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await FIN__CASH_FLOW_PLAN_MODEL.update({
                    cashFlowID, fundaID, subtypeID, name, note, revenue, expense, actualRevenue, actualExpense, fromDate, toDate, status, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: syncData
     * Author: HiepNH
     * Code: 14/2/2026
     */
    syncData: {
        params: {
            salaryID : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { option, cashFlowID } = ctx.params;

                // console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FIN__CASH_FLOW_PLAN_MODEL.syncData({
                    userID, companyID: company._id, option, cashFlowID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Remove
     * Author: MinhVH
     * Date: 20/06/2022
     */
    remove: {
        auth: "required",
        params: {
            cashFlowsID: { type: "array" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { cashFlowsID  } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FIN__CASH_FLOW_PLAN_MODEL.remove({
                    cashFlowsID, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Get info and get list
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getInfoAndGetList: {
        auth: "required",
        params: {
            cashFlowID      : { type: "string", optional: true },

            // Field mặc định
            keyword     : { type: "string", optional: true },
            limit       : { type: "string", optional: true },
            lastestID   : { type: "string", optional: true },
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
            sortKey     : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {
                    cashFlowID, companyID, parentID,
                    keyword, limit, lastestID, populates, select, sortKey
                } = ctx.params;

                const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler;
                if(cashFlowID){
                    resultAfterCallHandler = await FIN__CASH_FLOW_PLAN_MODEL.getInfo({
                        cashFlowID, userID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await FIN__CASH_FLOW_PLAN_MODEL.getList({
                        userID, companyID, parentID, keyword, limit, lastestID, select, populates, sortKey
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Gom nhóm theo thuộc tính
     * Author: Hiepnh
     * Date: 17/04/2022
     */
     getAmountByProperty: {
        auth: "required",
        params: {
            companyID       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { companyID, parentID, projectID, contractID, outin, year, type, property, option, real } = ctx.params;

                const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler = await FIN__CASH_FLOW_PLAN_MODEL.getAmountByProperty({
                    userID, companyID, parentID, projectID, contractID, outin, year, type, property, option, real, ctx
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },
}