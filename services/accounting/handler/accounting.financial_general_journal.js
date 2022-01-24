const { CF_DOMAIN_SERVICES } 	= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM }       = require('../../item/helper/item.actions-constant');

/**
 * TOOLS
 */
const { renderStatusCodeAndResponse } 			= require('../../../tools/utils/status_code')

/**
 * MODEL
 */
const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL   = require('../model/accounting.financial_general_journal').MODEL;

module.exports = {
    /**
     *  Code: F0011
     *  Author: Depv
     */
    insertFull: {
        params: {
            // email           : { type: "string" },
            // fullname        : { type: "string" },
            // username        : { type: "string" },
            // level           : { type: "string" },
            // companyID       : { type: "string" },
            // platform        : { type: "string" },
        },
        async handler(ctx) {
            try {
                const { fundaID, voucher, debit, credit, customerDebit,
                    customerCredit, goods, quantity, amount, fcuExRate, contract, 
                    project, job, cash, vat, note, updown, advancePayment , 
                    date, subtype } = ctx.params;
                const { _id: userID, company } = ctx.meta.infoUser;
                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.insertFull({ 
                    authorID: userID, companyID: company._id, fundaID, voucher, debit, credit, customerDebit,
                    customerCredit, goods, quantity, amount, fcuExRate, contract, 
                    project, job, cash, vat, note, updown, advancePayment , 
                    date, subtype, 
                });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][JOUNRAL_HANEDLER][INSERT_FULL] ${error}`);
                return { error: true, message: error.message };
            }
        }
    },

    update: {
        params: {
            // email           : { type: "string" },
            // fullname        : { type: "string" },
            // username        : { type: "string" },
            // level           : { type: "string" },
            // companyID       : { type: "string" },
            // platform        : { type: "string" },
        },
        async handler(ctx) {
            try {
                const { journalID, debit, credit, customerDebit,
                    customerCredit, goods, quantity, 
                    amount, fcuExRate, note, updown, advancePayment,
                    contract, project, job } = ctx.params;
                const { _id: userID, company } = ctx.meta.infoUser;
                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.update({
                    journalID, debit, credit, customerDebit,
                    customerCredit, goods, quantity, 
                    amount, fcuExRate, note, updown, advancePayment,
                    contract, project, job, authorID: userID
                });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][JOUNRAL_HANEDLER][INSERT_FULL] ${error}`);
                return { error: true, message: error.message };
            }
        }
    },
    removeById: {
        params: {
            // email           : { type: "string" },
            // fullname        : { type: "string" },
            // username        : { type: "string" },
            // level           : { type: "string" },
            // companyID       : { type: "string" },
            // platform        : { type: "string" },
        },
        async handler(ctx) {
            try {
                const { journalID } = ctx.params;
                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.remove({ journalID });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][JOUNRAL_HANEDLER][REMOVE_BY_ID] ${error}`);
                return { error: true, message: error.message };
            }
        }
    },

    getInfo: {
        params: {
            // email           : { type: "string" },
            // fullname        : { type: "string" },
            // username        : { type: "string" },
            // level           : { type: "string" },
            // companyID       : { type: "string" },
            // platform        : { type: "string" },
        },
        async handler(ctx) {
            try {
                const { journalID } = ctx.params;
                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.getInfo({ journalID })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][JOUNRAL_HANEDLER][GET_INFO] ${error}`);
                return { error: true, message: error.message };
            }
        }
    },

    getListJournalOfAccount: {
        params: {
            // email           : { type: "string" },
            // fullname        : { type: "string" },
            // username        : { type: "string" },
            // level           : { type: "string" },
            // companyID       : { type: "string" },
            // platform        : { type: "string" },
        },
        async handler(ctx) {
            try {
                const { accountID, fromDate, toDate,fundaID  } = ctx.params;
                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.getListJournalOfAccount({ ctx, accountID, fromDate, toDate,fundaID })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][JOUNRAL_HANEDLER][getListJournalOfAccount] ${error}`);
                return { error: true, message: error.message };
            }
        }
    }
}
