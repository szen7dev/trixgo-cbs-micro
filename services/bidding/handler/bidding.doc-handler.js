/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 	        = require('../../gateway/helper/domain.constant')
const { CF_ACTIONS_AUTH }               = require('../../auth/helper/auth.actions-constant')

/**
 * TOOLS
 */
const { renderStatusCodeAndResponse } = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const BIDDING__DOC_MODEL = require('../model/bidding.doc-model').MODEL;

module.exports = {
    /**
     * Name: Insert 
     * Author: Hiepnh
     * Date: 30/4/2022
     */
    insert: {
        auth: "required",
        params: {
            planID          : { type: "string" },
            parentID      : { type: "string", optional: true },
            assigneeID      : { type: "string", optional: true },
            name            : { type: "string" },
            note            : { type: "string", optional: true },
        },

        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { planID, parentID, name, sign, note, releaseTime, closingTime, assigneeID, agreeStatus, bidPrice, bidPriceDiscount, bidPriceAdjustment, openedStatus, bidderID, tenderPrice, vatTenderPrice, factor1, factor2, factor3, factor4, factor5 } = ctx.params;

                // Hồ sơ dự thầu
                let companyOfAssigneeID;
                if(parentID && assigneeID){
                    let infoCompanyOfAssigneeID = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`,{ userID: assigneeID })
                    // console.log('infoCompanyOfAssigneeID=================>>>>>>>>>>>>>>')
                    // console.log(infoCompanyOfAssigneeID)

                    if(infoCompanyOfAssigneeID){
                        companyOfAssigneeID = infoCompanyOfAssigneeID.data.company
                    }
                }

                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await BIDDING__DOC_MODEL.insert({
                    userID, ctx, planID, parentID, name, sign, note, releaseTime, closingTime, companyOfAssigneeID, assigneeID, agreeStatus, bidPrice, bidPriceDiscount, bidPriceAdjustment, openedStatus, bidderID, tenderPrice, vatTenderPrice, factor1, factor2, factor3, factor4, factor5
                });

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
            // docID: { type: "string" },
            // accountID: { type: "string", optional: true },
            // customerID: { type: "string", optional: true },
            // contractID: { type: "string", optional: true },
            // name: { type: "string", optional: true },
            // sign: { type: "string", optional: true },
            // note: { type: "string", optional: true },
            // date: { type: "string", optional: true },
            // income: { type: "number", optional: true },
            // expense: { type: "number", optional: true },
            // active: { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { docID, name, sign, note, releaseTime, closingTime, agreeStatus, bidPrice, bidPriceDiscount, bidPriceAdjustment, openedStatus, bidderID, tenderPrice, vatTenderPrice, timeApproved, factor1, factor2, factor3, factor4, factor5 } = ctx.params;

                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await BIDDING__DOC_MODEL.update({
                    docID, userID, ctx, name, sign, note, releaseTime, closingTime, agreeStatus, bidPrice, bidPriceDiscount, bidPriceAdjustment, openedStatus, bidderID, tenderPrice, vatTenderPrice, timeApproved, factor1, factor2, factor3, factor4, factor5
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
     * Date: 30/4/2022
     */
    remove: {
        auth: "required",
        params: {
            docID: { type: "array" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { docID } = ctx.params;
                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await BIDDING__DOC_MODEL.remove({
                    docID, userID
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
     * Date: 30/4/2022
     */
    getInfoAndGetList: {
        auth: "required",
        params: {
            docID: { type: "string", optional: true },
            // parentID: { type: "string", optional: true },
            // accountID: { type: "string", optional: true },
            // customerID: { type: "string", optional: true },
            // contractID: { type: "string", optional: true },
            // sortKey: { type: "string", optional: true },
            // outin: { type: "string", optional: true },

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
                let { docID, 
                    clientID, projectID, planID, parentID, bidderID, contractID, 
                    keyword, limit, lastestID, populates, select, sortKey } = ctx.params;
                
                const { _id: userID, company } = ctx.meta.infoUser;

                if(!clientID){
                    clientID = company._id
                }

                let resultAfterCallHandler;
                if (docID) {
                    resultAfterCallHandler = await BIDDING__DOC_MODEL.getInfo({
                        docID, userID, select, populates
                    });
                } else {
                    resultAfterCallHandler = await BIDDING__DOC_MODEL.getList({
                        clientID, projectID, planID, parentID, bidderID, contractID,
                        userID, keyword, limit, lastestID, populates, select, sortKey
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

}