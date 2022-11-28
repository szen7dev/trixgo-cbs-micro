/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const FNB_SHIFT_HANDOVER_MODEL            = require('../model/fnb.shift_handover-model').MODEL;

module.exports = {
    /**
     * Name: Insert 
     * Author: HiepNH
     * Code: 24/11/2022
     */
    insert: {
        auth: "required",
        params: {
            shiftID             : { type: "string" },
            goodsID             : { type: "string" },
            note                : { type: "string", optional: true  },
            openingQuantity     : { type: "number", optional: true },
            usedQuantity        : { type: "number", optional: true },
            closingQuantity     : { type: "number", optional: true },
            quotaQuantity       : { type: "number", optional: true },
            unitPrice           : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { shiftID, goodsID, openingQuantity, usedQuantity, closingQuantity, quotaQuantity, unitPrice, note } = ctx.params;

                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FNB_SHIFT_HANDOVER_MODEL.insert({
                    shiftID, goodsID, openingQuantity, usedQuantity, closingQuantity, quotaQuantity, unitPrice, note, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: update Group
	 */
    update: {
        auth: "required",
        params: {
            shiftGoodsID        : { type: "string" },
            note                : { type: "string", optional: true  },
            openingQuantity     : { type: "number", optional: true },
            usedQuantity        : { type: "number", optional: true },
            closingQuantity     : { type: "number", optional: true },
            quotaQuantity       : { type: "number", optional: true },
            unitPrice           : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  shiftGoodsID, openingQuantity, usedQuantity, closingQuantity, quotaQuantity, unitPrice, note } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FNB_SHIFT_HANDOVER_MODEL.update({
                    shiftGoodsID, userID,
                    openingQuantity, usedQuantity, closingQuantity, quotaQuantity, unitPrice, note
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: update Group
	 */
    updateQuota: {
        auth: "required",
        params: {
            shiftID : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  shiftID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FNB_SHIFT_HANDOVER_MODEL.updateQuota({
                    shiftID, userID
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
            shiftGoodsID   : { type: "string" }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  shiftGoodsID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FNB_SHIFT_HANDOVER_MODEL.remove({
                    shiftGoodsID
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
            shiftID             : { type: "string", optional: true },
            shiftGoodsID        : { type: "string", optional: true },
            fromDate            : { type: "string", optional: true },
            toDate              : { type: "string", optional: true },

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
                let { shiftGoodsID, shiftID, fromDate, toDate, keyword, limit, lastestID, select, populates, sortKey } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(shiftGoodsID){
                    resultAfterCallHandler = await FNB_SHIFT_HANDOVER_MODEL.getInfo({
                        shiftGoodsID, select, populates,
                    });
                }else{
                    resultAfterCallHandler = await FNB_SHIFT_HANDOVER_MODEL.getList({
                        shiftID, fromDate, toDate, keyword, limit, lastestID, select, populates, sortKey, userID
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Danh sách theo phân loại
     * Author: HiepNH
     * Code: 14/10/2022
     */
    getListByProperty: {
        params: {
            fundasID        : { type: "array", optional: true },
            option          : { type: "string", optional: true },
            optionGroup     : { type: "string", optional: true },
            optionTime      : { type: "string", optional: true },
            year            : { type: "string", optional: true },
            fromDate        : { type: "string", optional: true },
            toDate          : { type: "string", optional: true },
            
            //_____________THÔNG SỐ MẶC ĐỊNH________________
            keyword         : { type: "string", optional: true },
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            select          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                let { option, optionGroup, optionTime, fundasID, year, fromDate, toDate,
                     keyword, limit, lastestID, select, populates, sortKey } = ctx.params;

                let resultAfterCallHandler = await FNB_SHIFT_HANDOVER_MODEL.getListByProperty({
                    option, optionGroup, optionTime, fundasID, year, fromDate, toDate,
                     keyword, limit, lastestID, select, populates, sortKey, 
                     userID
                    });
             
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}