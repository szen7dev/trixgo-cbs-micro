/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
 const ITEM__CONTRACT_MODEL                   	= require('../model/item.contract-model').MODEL;

module.exports = {
    updateContractByCondition: {
        async handler(ctx) {
            try {
                let { condition, update } = ctx.params;

                const resultAfterCallHandler = await ITEM__CONTRACT_MODEL.updateContractByCondition({ condition, update });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    getListContract: {
        params: {
            lastestID: { type: "string", optional: true },
            limit: { type: "number", optional: true },
            keyword: { type: "string", optional: true },
            departmentID: { type: "string", optional: true },
            filter: { type: "string", optional: true },
            select: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID } = ctx.meta.infoUser;
                const { lastestID, departmentID, keyword, limit, filter, select } = ctx.params;

                const resultAfterCallHandler = await ITEM__CONTRACT_MODEL.getListContract({
                    lastestID, userID, departmentID, keyword, limit, filter, select
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
}
