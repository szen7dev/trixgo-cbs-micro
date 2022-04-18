/**
 * TOOLS
 */
const { renderStatusCodeAndResponse } = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const FIN__CASH_BOOK_MODEL = require('../model/fin.cash_book-model').MODEL;

module.exports = {
    /**
     * Name: Insert ✅
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    insert: {
        auth: "required",
        params: {
            parentID: { type: "string", optional: true },
            accountID: { type: "string", optional: true },
            customerID: { type: "string", optional: true },
            contractID: { type: "string", optional: true },
            name: { type: "string" },
            sign: { type: "string", optional: true },
            note: { type: "string", optional: true },
            date: { type: "string", optional: true },
            income: { type: "number", optional: true },
            expense: { type: "number", optional: true },
            arising: { type: "number", optional: true },
            openingBalance: { type: "number", optional: true },
            closingBalance: { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { parentID, accountID, customerID, contractID, name, sign, note, date, income, expense, arising, openingBalance, closingBalance } = ctx.params;

                const { _id: userID, company } = ctx.meta.infoUser;

                const resultAfterCallHandler = await FIN__CASH_BOOK_MODEL.insert({
                    companyID: company._id, userID, parentID, accountID, customerID, contractID, name, sign, note, date, income, expense, arising, openingBalance, closingBalance
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Update ✅
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    update: {
        auth: "required",
        params: {
            cashBookID: { type: "string" },
            accountID: { type: "string", optional: true },
            customerID: { type: "string", optional: true },
            contractID: { type: "string", optional: true },
            name: { type: "string", optional: true },
            sign: { type: "string", optional: true },
            note: { type: "string", optional: true },
            date: { type: "string", optional: true },
            income: { type: "number", optional: true },
            expense: { type: "number", optional: true },
            active: { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { cashBookID, accountID, customerID, contractID, name, sign, note, date, income, expense, active } = ctx.params;
                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await FIN__CASH_BOOK_MODEL.update({
                    cashBookID, accountID, customerID, contractID, name, sign, note, date, income, expense, active, userID
                });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Remove
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    remove: {
        auth: "required",
        params: {
            cashBooksID: { type: "array" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { cashBooksID } = ctx.params;
                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await FIN__CASH_BOOK_MODEL.remove({
                    cashBooksID, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Get info and Get list ✅
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getInfoAndGetList: {
        auth: "required",
        params: {
            cashBookID: { type: "string", optional: true },
            parentID: { type: "string", optional: true },
            accountID: { type: "string", optional: true },
            customerID: { type: "string", optional: true },
            contractID: { type: "string", optional: true },
            sortKey: { type: "string", optional: true },
            isMember: { type: "string", optional: true },

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
                let { isMember, cashBookID, companyID, accountID, customerID, contractID, parentID, keyword, limit, lastestID, populates, select, sortKey } = ctx.params;
                
                const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler;
                if (cashBookID) {
                    resultAfterCallHandler = await FIN__CASH_BOOK_MODEL.getInfo({
                        cashBookID, userID, select, populates
                    });
                } else {
                    resultAfterCallHandler = await FIN__CASH_BOOK_MODEL.getList({
                        isMember, companyID, accountID, customerID, contractID, parentID, userID, keyword, limit, lastestID, select, populates, sortKey
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
    * Name  : Lấy tổng thu và chi theo sổ
    * Author: MinhVH
    * Date  : 18/4/2022
    */
    getAmountIncomeAndExpenseByParent: {
        auth: "required",
        params: {
            parentID: { type: "string" }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { parentID } = ctx.params;

                const resultAfterCallHandler = await FIN__CASH_BOOK_MODEL.getAmountIncomeAndExpenseByParent({
                    parentID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Name: Gom nhóm theo thuộc tính ✅
     * Author: Hiepnh
     * Date: 17/04/2022
     */
    getAmountByProperty: {
        auth: "required",
        params: {
            companyID: { type: "string", optional: true },
            parentID: { type: "string", optional: true },
            accountID: { type: "string", optional: true },
            year: { type: "string", optional: true },
            option: { type: "string", optional: true },

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
                let { companyID, parentID, accountID, year, option } = ctx.params;

                const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler = await FIN__CASH_BOOK_MODEL.getAmountByProperty({
                    userID, companyID, parentID, accountID, year, option, ctx
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },
}