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
        auth: "required",
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
                    cash, vat, note, updown, advancePayment , 
                    date, subtype, budgetWork } = ctx.params;

                const { _id: userID, company } = ctx.meta.infoUser;

                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.insertFull({ 
                    authorID: userID, companyID: company._id, fundaID, voucher, debit, credit, customerDebit,
                    customerCredit, goods, quantity, amount, fcuExRate, contract, 
                   cash, vat, note, updown, advancePayment , 
                    date, subtype, budgetWork, ctx
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                // console.log(`[ACCOUNTING][JOUNRAL_HANEDLER][INSERT_FULL] ${error}`);
                return { error: true, message: error.message };
            }
        }
    },

    update: {
        auth: "required",
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
        auth: "required",
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
        auth: "required",
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

    /**
     * Dev: Hiepnh 
     * Func: Tổng hợp ngân sách đã thực hiện
     * Date: 10/4/2022
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

    getList: {
        auth: "required",
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
                const { option, companyID, fundaID, voucherID, contractID, budgetID, budgetItemID, budgetGroupID, budgetWorkID, isGetForAccountDetails, arrAccountObjectID, fromDate, toDate, keyword, limit, lastestID, select, populates } = ctx.params;

                const { _id: userID, company } = ctx.meta.infoUser;

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
                
                resultAfterCallHandler = await ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_MODEL.getList({  option, companyID: company._id, fundaID, voucherID, contractID, budgetID, budgetItemID, budgetGroupID, budgetWorkID, isGetForAccountDetails, arrAccountObjectID, fromDate, toDate, keyword, limit, lastestID, select, populates
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
        auth: "required",
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
        auth: "required",
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
        auth: "required",
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
        auth: "required",
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
