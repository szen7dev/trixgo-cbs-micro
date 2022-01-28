/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ITEM__GOODS_MODEL                    = require('../model/item.good-model').MODEL;

module.exports = {

    /**
	 * Dev: HuynhVinh ✅
	 * Func:
    */
    getListWithKey: {
        params: {
            accountID     : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { key, belongSystem, limit, lastestID } = ctx.params;
                const { _id: userID, company } = ctx.meta.infoUser;
                const resultAfterCallHandler = await ITEM__GOODS_MODEL.getListWithKey({ lastestID, companyID: company._id, key, belongSystem, limit })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },


}