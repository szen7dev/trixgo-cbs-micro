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

    getList: {
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
                const { voucherID, keyword, limit, lastestID, select,
                    populates, accountID, fromDate, toDate, isGetForAccountDetails, arrAccountObjectID
                } = ctx.params;
                const { _id: userID, company } = ctx.meta.infoUser;
                let fundaID;
                let resultAfterCallHandler;
                if(isGetForAccountDetails){
                    let infoFundaCompany    = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.FUNDA_GET_INFO_AND_GET_LIST}`,{ });
            
                    if(infoFundaCompany.error){
                        resultAfterCallHandler.error = true;
                        resultAfterCallHandler.message = 'Not found funda comany ';
                        return renderStatusCodeAndResponse({ resultAfterCallHandler: infoFundaCompany, ctx });
                    }
                    fundaID = infoFundaCompany.data && infoFundaCompany.data.listRecords[infoFundaCompany.data.listRecords.length-1]._id;
                }
                
                resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.getList({ companyID: company._id, voucherID, keyword,
                    limit, lastestID, select, populates,
                    accountID, fromDate, toDate, isGetForAccountDetails, fundaID, arrAccountObjectID
                });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][JOUNRAL_HANEDLER][getListJournalOfAccount] ${error}`);
                return { error: true, message: error.message };
            }
        }
    },

    // Chi tiết tài khoản
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
                const { accountID, fromDate, toDate  } = ctx.params;
                let { fundaID } = ctx.params;
                let resultAfterCallHandler;
                if(!fundaID){
                    const infoFundaCompany    = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.FUNDA_GET_INFO_AND_GET_LIST}`,{ });
                    if(infoFundaCompany.error){
                        resultAfterCallHandler.error = true;
                        resultAfterCallHandler.message = 'Not found funda comany ';
                        return renderStatusCodeAndResponse({ resultAfterCallHandler: infoFundaCompany, ctx });
                    }
                    fundaID = infoFundaCompany.data && infoFundaCompany.data.listRecords[infoFundaCompany.data.listRecords.length-1]._id;
                }
                resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.getListJournalOfAccount({ ctx, accountID, fromDate, toDate,fundaID })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][JOUNRAL_HANEDLER][getListJournalOfAccount] ${error}`);
                return { error: true, message: error.message };
            }
        }
    },

    // Sổ tổng hợp tài khoản chữ T
    tBookAccount: {
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
                const {  contractID, accountID, fromDate, toDate } = ctx.params;
                const { company } = ctx.meta.infoUser;
                let { fundaID  } = ctx.params;
                let resultAfterCallHandler;
                if(!fundaID){
                    const infoFundaCompany    = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.FUNDA_GET_INFO_AND_GET_LIST}`,{ });
                    if(infoFundaCompany.error){
                        resultAfterCallHandler.error = true;
                        resultAfterCallHandler.message = 'Not found funda comany ';
                        return renderStatusCodeAndResponse({ resultAfterCallHandler: infoFundaCompany, ctx });
                    }
                    fundaID = infoFundaCompany.data && infoFundaCompany.data.listRecords[infoFundaCompany.data.listRecords.length-1]._id;
                }
                resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.listTbookByAccount({ ctx, companyID: company._id, fundaID, contractID, accountID, fromDate, toDate });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][JOUNRAL_HANEDLER][getListJournalOfAccount] ${error}`);
                return { error: true, message: error.message }; 
            }
        }
    },

    // Bảng cân đối tài chính
    financialReport: {
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
                const {  accountID, fromDate, toDate   } = ctx.params;
                let { fundaID } = ctx.params;
                let resultAfterCallHandler;
                if(!fundaID){
                    const infoFundaCompany    = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.FUNDA_GET_INFO_AND_GET_LIST}`,{ });
                    if(infoFundaCompany.error){
                        resultAfterCallHandler.error = true;
                        resultAfterCallHandler.message = 'Not found funda comany ';
                        return renderStatusCodeAndResponse({ resultAfterCallHandler: infoFundaCompany, ctx });
                    }
                    fundaID = infoFundaCompany.data && infoFundaCompany.data.listRecords[infoFundaCompany.data.listRecords.length-1]._id;
                }
                resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.financialReport({ ctx, accountID, fromDate, toDate,fundaID })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][JOUNRAL_HANEDLER][getListJournalOfAccount] ${error}`);
                return { error: true, message: error.message };
            }
        }
    },
  
    // Danh sách công nợ 
    debtTracking: {
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
                const {  accountID, fromDate, toDate   } = ctx.params;
                let { fundaID  } = ctx.params;
                let resultAfterCallHandler;
                if(!fundaID){
                    const infoFundaCompany    = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.FUNDA_GET_INFO_AND_GET_LIST}`,{ });
                    if(infoFundaCompany.error){
                        resultAfterCallHandler.error = true;
                        resultAfterCallHandler.message = 'Not found funda comany ';
                        return renderStatusCodeAndResponse({ resultAfterCallHandler: infoFundaCompany, ctx });
                    }
                    fundaID = infoFundaCompany.data && infoFundaCompany.data.listRecords[infoFundaCompany.data.listRecords.length-1]._id;
                }


                if (accountID) {
                    resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.debtTrackingAccountWithCusomerDetails({ ctx, fundaID, accountID, fromDate, toDate });
                }else{
                    resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.debtTracking({ ctx, accountID, fromDate, toDate,fundaID });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                console.log(`[ACCOUNTING][JOUNRAL_HANEDLER][getListJournalOfAccount] ${error}`);
                return { error: true, message: error.message }; 
            }
        }
    },

}
