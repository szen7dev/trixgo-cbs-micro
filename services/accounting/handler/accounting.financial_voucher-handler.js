/**
 * CONSTANTS
 */
 const { CF_DOMAIN_SERVICES } 	        = require('../../gateway/helper/domain.constant')
 const { CF_ACTIONS_ITEM }              = require('../../item/helper/item.actions-constant')

/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }   = require('../../../tools/utils/status_code')

/**
 * MODELS
 */
const ACCOUNTING__FINANCIAL_VOUCHER_MODEL = require('../model/accounting.financial_voucher-model').MODEL

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
                let { 
                    fundaID, 
                    customerID,
                    contractID, 
                    storageID, 
                    projectID,
                    type, date, name, sign, signInvoice, dateInvoice, vat,
                    receiver, note, 
                    forward, forwardIs, returning, advancePayment, cancel, 
                    fcuExRate, 
                    selectedJournals, 
                    isImport,
                } = ctx.params;

                const { _id: userID, company } = ctx.meta.infoUser;

                let  resultAfterCallHandler;

                if(!fundaID){
                    let infoFundaCompany = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.FUNDA_GET_INFO_AND_GET_LIST}`,{ })
                    console.log(infoFundaCompany.data.listRecords[0])
                
                    if(infoFundaCompany.error){
                        resultAfterCallHandler.message = 'Not found funda comany ';
                        return renderStatusCodeAndResponse({ resultAfterCallHandler: infoFundaCompany, ctx })
                    }
    
                    fundaID = infoFundaCompany.data && infoFundaCompany.data.listRecords[infoFundaCompany.data.listRecords.length-1]._id
                }
                
                resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.insert({ 
                    authorID : userID, 
                    companyID: company._id,
                    fundaID,
                    customerID,
                    contractID, 
                    storageID, 
                    projectID,
                    type, date, name, sign, signInvoice, dateInvoice, vat,
                    receiver, note,
                    forward: (!isNaN(forward) && [0,1].includes(Number(forward))) ? Number(forward) : 0,
                    forwardIs: (!isNaN(forwardIs) && [0,1].includes(Number(forwardIs))) ? Number(forwardIs) : 0,
                    returning: (!isNaN(returning) && [0,1].includes(Number(returning))) ? Number(returning) : 0,
                    advancePayment: (!isNaN(advancePayment) && [0,1].includes(Number(advancePayment))) ? Number(advancePayment) : 0,
                    cancel: (!isNaN(cancel) && [0,1].includes(Number(cancel))) ? Number(cancel) : 0,
                    fcuExRate: !isNaN(fcuExRate) ? Number(fcuExRate) : 0,
                    selectedJournals, 
                    isImport,
                    ctx,
                }) 

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx })
            } catch (error) {
                return { error: true, message: error.message };
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

                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.update({
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

                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.remove({
                    cashBooksID, userID
                });

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
            cashBookID: { type: "string", optional: true },
            parentID: { type: "string", optional: true },
            accountID: { type: "string", optional: true },
            customerID: { type: "string", optional: true },
            contractID: { type: "string", optional: true },
            sortKey: { type: "string", optional: true },
            outin: { type: "string", optional: true },

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
                let { outin, cashBookID, companyID, accountID, customerID, contractID, parentID, keyword, limit, lastestID, populates, select, sortKey } = ctx.params;
                
                const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler;
                if (cashBookID) {
                    resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.getInfo({
                        cashBookID, userID, select, populates
                    });
                } else {
                    resultAfterCallHandler = await ACCOUNTING__FINANCIAL_VOUCHER_MODEL.getList({
                        outin, companyID, accountID, customerID, contractID, parentID, userID, keyword, limit, lastestID, select, populates, sortKey
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
}