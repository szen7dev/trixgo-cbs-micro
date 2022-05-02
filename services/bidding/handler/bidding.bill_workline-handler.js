/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const BIDDING__BILL_WORKLINE_MODEL              = require('../model/bidding.bill_workline-model').MODEL;

module.exports = {
    /**
     * Name: Insert 
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    insert: {
        auth: "required",
        params: {
            companyID           : { type: "string", optional: true },
            fundaID             : { type: "string", optional: true },
            contractID          : { type: "string", optional: true },
            projectID           : { type: "string", optional: true },
            parentID            : { type: "string", optional: true },
            type                : { type: "number", optional: true },
            property            : { type: "number", optional: true },
            outin               : { type: "number", optional: true },
            name                : { type: "string" },
            sign                : { type: "string", optional: true },
            openingBalance      : { type: "number", optional: true },
            arising             : { type: "number", optional: true },
            closingBalance      : { type: "number", optional: true },
            note                : { type: "string", optional: true },
            date                : { type: "string" },
            value               : { type: "number", optional: true },
            realDate            : { type: "string", optional: true },
            realValue           : { type: "number", optional: true },
            priority            : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { companyID, fundaID, contractID, projectID, parentID, priority, type, property, outin, name, openingBalance, arising, closingBalance, sign, note, date, value, realDate, realValue } = ctx.params;

                let { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                const resultAfterCallHandler = await BIDDING__BILL_WORKLINE_MODEL.insert({
                    companyID, fundaID, contractID, projectID, parentID, priority, type, property, outin, name, openingBalance, arising, closingBalance, sign, note, date, value, realDate, realValue, userID, ctx
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
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
            cashFlowID          : { type: "string" },
            contractID          : { type: "string", optional: true },
            name                : { type: "string", optional: true },
            sign                : { type: "string", optional: true },
            openingBalance      : { type: "number", optional: true },
            arising             : { type: "number", optional: true },
            closingBalance      : { type: "number", optional: true },
            note                : { type: "string", optional: true },
            outin               : { type: "number", optional: true },
            property            : { type: "number", optional: true },
            status              : { type: "number", optional: true },
            type                : { type: "number", optional: true },
            date                : { type: "string", optional: true },
            value               : { type: "number", optional: true },
            realDate            : { type: "string", optional: true },
            realValue           : { type: "number", optional: true },
            priority            : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { 
                    cashFlowID, contractID, name, openingBalance, arising, closingBalance, sign, note, date, value, realDate, realValue, priority, outin, property, status, type
                } = ctx.params;
                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await BIDDING__BILL_WORKLINE_MODEL.update({
                    cashFlowID, contractID, name, openingBalance, arising, closingBalance, sign, note, date, value, realDate, realValue, priority, outin, property, status, type, userID, ctx
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
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
            cashFlowsID: { type: "array" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { cashFlowsID  } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await BIDDING__BILL_WORKLINE_MODEL.remove({
                    cashFlowsID, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Get info and get list 
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getInfoAndGetList: {
        auth: "required",
        params: {
            worklineID      : { type: "string", optional: true },
            workID          : { type: "string", optional: true },

            // Field mặc định
            keyword     : { type: "string", optional: true },
            limit       : { type: "string", optional: true },
            lastestID   : { type: "string", optional: true },
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { worklineID, workID, keyword, limit, lastestID, populates, select, sortKey } = ctx.params;
				
                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(worklineID){
                    resultAfterCallHandler = await BIDDING__BILL_WORKLINE_MODEL.getInfo({
                        worklineID, userID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await BIDDING__BILL_WORKLINE_MODEL.getList({
                        workID, userID, keyword, limit, lastestID, select, populates, sortKey
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}