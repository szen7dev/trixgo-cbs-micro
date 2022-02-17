const { CF_DOMAIN_SERVICES } 	= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM }       = require('../../item/helper/item.actions-constant');

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
                let { fundaID, type, date, 
                    dateInvoice, name, sign, signInvoice, 
                    customer, receiver, note, vat, contract, 
                    storage, inspection, termination, advancePayment,
                    returning, forward, cancel, source, orderNew, pricePolicy,
                    discountCost, otherCost, shipperName, shipperCost, staff, 
                    fcuExRate, selectedJournals, isImport,
                    ipc, fee, subtype, project } = ctx.params;
                const { _id: userID, company } = ctx.meta.infoUser;
                let  resultAfterCallHandler;

                let infoFundaCompany    = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.FUNDA_GET_LIST_BY_COMPANY_USER}`,{ });
                
                if(infoFundaCompany.error){
                    resultAfterCallHandler.message = 'Not found funda comany ';
                    return renderStatusCodeAndResponse({ resultAfterCallHandler: infoFundaCompany, ctx });
                }
                fundaID = infoFundaCompany.data && infoFundaCompany.data[0]._id;
                resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.insertFull({ 
                    authorID : userID, companyID: company._id, ctx,
                    fundaID, type, date, 
                    dateInvoice, name, sign, signInvoice, 
                    customer, receiver, note, vat, contract, 
                    storage, inspection, termination, advancePayment,
                    returning, forward, cancel, source, orderNew, pricePolicy,
                    discountCost, otherCost, shipperName, shipperCost, staff, 
                    fcuExRate, selectedJournals, isImport,
                    ipc, fee, subtype, project
                }) 
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
                const { _id: userID, company } = ctx.meta.infoUser;
                const { voucherID, type, date, dateInvoice, 
                    name, sign, signInvoice, customer, 
                    receiver, warehouse, note, vat, contract, 
                    storage, inspection, termination, advancePayment,
                    returning, forward, cancel, selectedJournals, deletedJournals,
                    source, orderNew, pricePolicy, discountCost, otherCost, shipperName,
                    shipperCost, staff, fcuExRate, fundaID, project, subtype, fee, ipc } = ctx.params;

                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.update({ 
                    ctx, voucherID, type, date, dateInvoice, 
                    name, sign, signInvoice, customer, 
                    receiver, warehouse, note, vat, contract, 
                    storage, inspection, termination, advancePayment,
                    returning, forward, cancel, selectedJournals, deletedJournals,
                    source, orderNew, pricePolicy, discountCost, otherCost, shipperName,
                    shipperCost, staff, fcuExRate, authorID: userID,
                    companyID: company._id, fundaID, project, subtype, fee, ipc
                })
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
            voucherID           : { type: "string" },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                const {  voucherID, populates  } = ctx.params;
                // const voucherID = '61e43deaac5b40893b163750';
                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.getInfo({ voucherID, populates })
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
                const {   currentPage, perPage, fromDate, toDate, type, lastestID, limit } = ctx.params;
                // const voucherID = '61e43deaac5b40893b163750';
                let fundaID =null;
                //get funda from cache

                if(!fundaID){
                    const infoFundaCompany          = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.FUNDA_GET_LIST_BY_COMPANY_USER}`,{ });
                    fundaID = infoFundaCompany.data && infoFundaCompany.data[0]._id;
                }

                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.getListVoucherOfCompany({ fundaID , currentPage, 
                perPage, fromDate, toDate, type, lastestID, limit })
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
                const {  fundaID, fromDate, toDate, vat, nextInfo, perPage  } = ctx.params;
                // const voucherID = '61e43deaac5b40893b163750';
                const { _id: userID, company } = ctx.meta.infoUser;
                
                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.getListVATVoucherOfCompany({ companyID: company._id, fundaID, fromDate, toDate, vat, nextInfo, perPage })
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
                const { key, type, customer, fromDate, toDate, fundaID, limit, lastestID  } = ctx.params;
                // const voucherID = '61e43deaac5b40893b163750';
                const { _id: userID, company } = ctx.meta.infoUser;
                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.findVoucherInCompany({ limit, lastestID, key, type, customer, author: userID, fromDate, toDate, fundaID, companyID: company._id })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][VOUCHER_HANDLER][FIND_VOUCHER_IN_COMPANY] ${error}`);
                return { error: true, message: error.message };
            }
        }
    }
}
