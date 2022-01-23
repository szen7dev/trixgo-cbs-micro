/**
 * TOOLS
 */
const { renderStatusCodeAndResponse } 			= require('../../../tools/utils/status_code');
/**
 * MODEL
 */
const ACCOUNTING__FINANCIAL_VOUCHER_MODEL                         	= require('../model/accounting.financial_voucher').MODEL;

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
                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.insertFull({
                    ctx,
                    forward: 0,
                    forwardIs: 0,
                    returning: 0,
                    advancePayment: 0,
                    cancel: 0,
                    selectedJournals: [
                        {
                            debit: '6073a7b15268570c011b7d3f',
                                credit: '6073a7b05268570c011b7cf3',
                                customerDebit: '6046add9b55525368b108d51',
                                customerCredit: '60a3cd10c8efdd21e8489bc8',
                                goods: '',
                                warehouse: '',
                                contract: '',
                                budget: '',
                                quantity: 3,
                                amount: 300000,
                                note: '',
                                updown: 1
                        }
                    ],
                    type: 1,
                    vat: 0,
                    dateInvoice: "2021-11-30T07:00:00.000+07:00",
                    status: 1,
                    lock: 0,
                    sign: "CPMI.PKT649",
                    fcuExRate: 0,
                    staff: [],
                    source: 1,
                    orderNew: 1,
                    pricePolicy: 1,
                    discountCost: 0,
                    otherCost: 0,
                    shipperCost: 0,
                    files: [],
                    company: "5e8415e651d84b60937abe71",
                    fundaID: "5e846addd7e3490be59ae8d5",
                    authorID: "5f2cc4bd039d212061a13986",
                    date: "2022-01-13T07:00:00.000+07:00",
                    name: "Tính tiền hụi thnasg 01/2022222",
                    signInvoice: "CPMI.PKT418",
                    customer: "5fb37ee7e5c18a7517c3aa5a",
                    shipperName: null
                });
                console.log({resultAfterCallHandler});
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][VOUCHER_HANDLER][INSERT_FULL] ${error}`);
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
                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.update({ 
                    voucherID: "6198727abc3b2e745ae5277c",
                    ctx, 
                    forward: 0,
                    forwardIs: 0,
                    returning: 0,
                    advancePayment: 0,
                    cancel: 0,
                    selectedJournals: [
                        {
                            journalID:'6198727abc3b2e745ae5277f',
                            debit: '6073a7b15268570c011b7d3f',
                            credit: '6073a7b05268570c011b7cf3',
                            customerDebit: '6046add9b55525368b108d51',
                            customerCredit: '60a3cd10c8efdd21e8489bc8',
                            goods: '',
                            warehouse: '',
                            contract: '',
                            budget: '',
                            quantity: 1,
                            amount: 1,
                            note: '',
                            updown: 1
                        }
                    ],
                    type: 1,
                    vat: 0,
                    dateInvoice: "2022-11-30T07:00:00.000+07:00",
                    status: 1,
                    lock: 0,
                    sign: "CPMI.PKT649",
                    fcuExRate: 0,
                    staff: [],
                    source: 1,
                    orderNew: 1,
                    pricePolicy: 1,
                    discountCost: 0,
                    otherCost: 0,
                    shipperCost: 0,
                    files: [],
                    company: "5e8415e651d84b60937abe71",
                    fundaID: "5e846addd7e3490be59ae8d5",
                    authorID: "5f2cc4bd039d212061a13986",
                    date: "2022-01-13T07:00:00.000+07:00",
                    name: "Tính tiền hụi thnasg 01/100000",
                    signInvoice: "CPMI.PKT418___new",
                    customer: "5fb37ee7e5c18a7517c3aa5a",
                    shipperName: null,
                    companyID:"5e8415e651d84b60937abe71"
                });
                console.log({resultAfterCallHandler});
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][VOUCHER_HANDLER][UPDATE] ${error}`);
                return { error: true, message: error.message };
            }
        }
    },

    remnove:{
        params: {
            // email           : { type: "string" },
            // fullname        : { type: "string" },
            // username        : { type: "string" },
            // level           : { type: "string" },
            // companyID       : { type: "string" },
            voucherID           : { type: "string" },
        },
        async handler(ctx) {
            try {
                const { voucherID } = ctx.params;
                // const voucherID = '61e43deaac5b40893b163750';
                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.remove({ voucherID })
                console.log({resultAfterCallHandler});
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][VOUCHER_HANDLER][REMOVE] ${error}`);
                return { error: true, message: error.message };
            }
        }
    },

    getInfoVoucher:{
        params: {
            // email           : { type: "string" },
            // fullname        : { type: "string" },
            // username        : { type: "string" },
            // level           : { type: "string" },
            // companyID       : { type: "string" },
            // voucherID           : { type: "string" },
        },
        async handler(ctx) {
            try {
                const {  voucherID  } = ctx.params;
                // const voucherID = '61e43deaac5b40893b163750';
                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.getInfo({ voucherID })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][VOUCHER_HANDLER][GET_INFO_VOUCHER] ${error}`);
                return { error: true, message: error.message };
            }
        }
    },

    getListVoucherOfCompany:{
        params: {
            // email           : { type: "string" },
            // fullname        : { type: "string" },
            // username        : { type: "string" },
            // level           : { type: "string" },
            // companyID       : { type: "string" },
            // voucherID           : { type: "string" },
        },
        async handler(ctx) {
            try {
                const {  companyID, fundaID, contractID, currentPage, perPage, fromDate, toDate, type, _id, createAt  } = ctx.params;
                // const voucherID = '61e43deaac5b40893b163750';
                const nextInfo = { _id, createAt }
                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.getListVoucherOfCompany({ fundaID, currentPage, perPage, fromDate, toDate, type, nextInfo })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][VOUCHER_HANDLER][GET_LIST_VOUCHER_OF_COMPANY] ${error}`);
                return { error: true, message: error.message };
            }
        }
    },

    getListVATVoucherOfCompany:{
        params: {
            // email           : { type: "string" },
            // fullname        : { type: "string" },
            // username        : { type: "string" },
            // level           : { type: "string" },
            // companyID       : { type: "string" },
            // voucherID           : { type: "string" },
        },
        async handler(ctx) {
            try {
                const {  companyID, fundaID, fromDate, toDate, vat, nextInfo, perPage  } = ctx.params;
                // const voucherID = '61e43deaac5b40893b163750';
                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.getListVATVoucherOfCompany({ companyID, fundaID, fromDate, toDate, vat, nextInfo, perPage })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][VOUCHER_HANDLER][GET_LIST_VAT_VOUCHER_OF_COMPANY] ${error}`);
                return { error: true, message: error.message };
            }
        }
    },

    findVoucherInCompany:{
        params: {
            // email           : { type: "string" },
            // fullname        : { type: "string" },
            // username        : { type: "string" },
            // level           : { type: "string" },
            // companyID       : { type: "string" },
            // voucherID           : { type: "string" },
        },
        async handler(ctx) {
            try {
                const { key, type, customer, author, fromDate, toDate, fundaID, companyID, _id, createAt } = ctx.params;
                // const voucherID = '61e43deaac5b40893b163750';
                const nextInfo = { _id, createAt }
                console.log({nextInfo})
                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.findVoucherInCompany({ nextInfo, key, type, customer, author, fromDate, toDate, fundaID, companyID })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][VOUCHER_HANDLER][FIND_VOUCHER_IN_COMPANY] ${error}`);
                return { error: true, message: error.message };
            }
        }
    }
}
