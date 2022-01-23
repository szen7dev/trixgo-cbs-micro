/**
 * TOOLS
 */
const { renderStatusCodeAndResponse } 			= require('../../../tools/utils/status_code')

/**
 * MODEL
 */
const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL                         	= require('../model/accounting.financial_general_journal').MODEL;

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
                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.insertFull({ 
                    updown: 1,
                    advancePayment: 0,
                    quantity: 1,
                    unitprice: 1929500,
                    amount: 1929500,
                    amountPayment: 0,
                    fcuType: 1,
                    fcuExRate: 0,
                    fcuAmount: 1929500,
                    cash: 1,
                    vat: 0,
                    companyID: "5e8415e651d84b60937abe71",
                    fundaID: "5e846addd7e3490be59ae8d5",
                    authorID: "5f2cc4bd039d212061a13986",
                    voucher: "6198727abc3b2e745ae5277c",
                    customerDebit: "5fb37ee7e5c18a7517c3aa5a",
                    customerCredit: "5f159c873799c005a52b7de2",
                    note: "ssss",
                    debit: "5efc0e3ebf8da144aecfe59b",
                    credit: "5f697dd0de339308feba62c5",
                    date: "2021-11-20T10:58:50.297+07:00",
                });

                console.log({resultAfterCallHandler});
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
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
    }
}
