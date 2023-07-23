/**
 * EXTERNAL PACKAGE
 */
const moment = require('moment');

/**
 * TOOLS
 */
const { renderStatusCodeAndResponse } = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL = require('../model/accounting.financial_general_journal-model').MODEL;

module.exports = {
    /**
     * Name: Insert 
     * Author: Hiepnh
     * Date: 30/4/2022
     */
    insert: {
        auth: "required",
        params: {
            
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { } = ctx.params;

                const { _id: userID, company } = ctx.meta.infoUser;

                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.insert({});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Update 
     * Author: Hiepnh
     * Date: 30/4/2022
     */
    update: {
        auth: "required",
        params: {

        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { } = ctx.params;

                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.update({});
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Remove
     * Author: Hiepnh
     * Date: 30/4/2022
     */
    remove: {
        auth: "required",
        params: {
            
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { cashBooksID } = ctx.params;
                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.remove({});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Get info and Get list 
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getInfoAndGetList: {
        auth: "required",
        params: {
            journalID: { type: "string", optional: true },
            companyID: { type: "string", optional: true },
            fundaID: { type: "string", optional: true },
            projectID: { type: "string", optional: true },
            voucherID: { type: "string", optional: true },
            accountID: { type: "string", optional: true },
            contractID: { type: "string", optional: true },
            budgetID: { type: "string", optional: true },
            budgetItemID: { type: "string", optional: true },
            budgetGroupID: { type: "string", optional: true },
            budgetWorkID: { type: "string", optional: true },
            
            // Field mặc định
            keyword: { type: "string", optional: true },
            limit: { type: "string", optional: true },
            lastestID: { type: "string", optional: true },
            select: { type: "string", optional: true },
            populates: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { journalID, companyID, fundaID, projectID, contractID, voucherID, accountID, budgetID, budgetItemID, budgetGroupID, budgetWorkID, fromDate, toDate, keyword, limit, lastestID, populates, select, sortKey } = ctx.params;
                
                const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler;
                if (journalID) {
                    resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.getInfo({
                        journalID, userID, select, populates
                    });
                } else {
                    resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.getList({
                        companyID, fundaID, projectID, contractID, voucherID, accountID, budgetID, budgetItemID, budgetGroupID, budgetWorkID, fromDate, toDate, userID, keyword, limit, lastestID, select, populates, sortKey, ctx
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Dev: Hiepnh 
     * Func: Tổng hợp ngân sách đã thực hiện
     * Date: 30/4/2022
     */
    calImpleBudget: {
        auth: "required",
        params: {
            workID : { type: "string", optional: true },
            groupID : { type: "string", optional: true },
            itemID : { type: "string", optional: true },
            budgetID : { type: "string", optional: true },
        },
        async handler(ctx) {  
            try {
                await this.validateEntity(ctx.params);
                let { workID, groupID, itemID, budgetID } = ctx.params;
            
                const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.calImpleBudget({
                    workID, groupID, itemID, budgetID, userID, ctx
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Lấy số dư tài khoản
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getAccountBalance: {
        auth: "required",
        params: {
            fromDate        : { type: "string" },
            toDate          : { type: "string" },
            option          : { type: "string", optional: true },
            name            : { type: "string", optional: true },
            multiple        : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { companyID, fundaID, contractID, accountID, fromDate, toDate, name, option, multiple } = ctx.params;
                
                const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                /**
                 * Convert dữ liệu ngày tháng để theo chuẩn chung
                 */
                fromDate   = moment(fromDate).startOf('day').format();// <=== fix ISODate here
                toDate     = moment(toDate).endOf('day').format();// <=== fix ISODate here

                let resultAfterCallHandler;
                if (multiple) {
                    
                } else {
                    resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.getAccountBalance({
                        companyID, fundaID, contractID, accountID, fromDate, toDate, name, option, userID, ctx
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
}