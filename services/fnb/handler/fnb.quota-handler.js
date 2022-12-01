/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const FNB_QUOTA_MODEL            = require('../model/fnb.quota-model').MODEL;

module.exports = {
    /**
     * Name: Insert 
     * Author: HiepNH
     * Code: 24/11/2022
     */
    insert: {
        auth: "required",
        params: {
            productID           : { type: "string" },
            goodsID             : { type: "string" },
            note                : { type: "string", optional: true },
            quantity            : { type: "number" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  productID, goodsID, note, quantity } = ctx.params;

                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FNB_QUOTA_MODEL.insert({
                    productID, goodsID, note, quantity, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Update 
     * Author: HiepNH
     * Code: 24/11/2022
     */
    update: {
        auth: "required",
        params: {
            quotaID             : { type: "string" },
            note                : { type: "string", optional: true },
            quantity            : { type: "number" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  quotaID, note, quantity } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FNB_QUOTA_MODEL.update({
                    quotaID, userID,
                    note, quantity
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: remove Group
	 */
    remove: {
        auth: "required",
        params: {
            quotaID   : { type: "string" }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  quotaID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FNB_QUOTA_MODEL.remove({
                    quotaID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: getList and getInfo pcm_plan_report
	 */
    getInfoAndGetList: {
        auth: "required",
        params: {
            productID           : { type: "string", optional: true },
            quotaID             : { type: "string", optional: true },

            //==============================================
            keyword     : { type: "string", optional: true },
            limit       : { type: "string", optional: true },
            lastestID   : { type: "string", optional: true },
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { quotaID, productID, keyword, limit, lastestID, select, populates, sortKey } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(quotaID){
                    resultAfterCallHandler = await FNB_QUOTA_MODEL.getInfo({
                        quotaID, select, populates,
                    });
                }else{
                    resultAfterCallHandler = await FNB_QUOTA_MODEL.getList({
                        productID, keyword, limit, lastestID, select, populates, sortKey, userID
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}