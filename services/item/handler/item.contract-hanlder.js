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
        params: { },
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

    getList: {
        params: {
            page: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { page }        = ctx.params;
                return { 
                    error: false, page: page, message: 'contract'
                }
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}