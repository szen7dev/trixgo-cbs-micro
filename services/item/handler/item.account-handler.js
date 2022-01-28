/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ITEM__ACCOUNT_MODEL                    = require('../model/item.account-model').MODEL;

module.exports = {
    
    /**
	 * Dev: HuynhVinh ✅
	 * Func:
	 */
    getInfoAccountWithName: {
        params: {
            companyID     : { type: "string", optional: true },
            name          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { companyID, name } = ctx.params;
                const resultAfterCallHandler = await ITEM__ACCOUNT_MODEL.getInfoAccountWithName({ companyID, name });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
    
    /**
	 * Dev: HuynhVinh ✅
	 * Func:
	 */
    getInfoAccount: {
        params: {
            accountID     : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { accountID } = ctx.params;
                const resultAfterCallHandler = await ITEM__ACCOUNT_MODEL.getInfoAccount({ accountID });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
	 * Dev: HuynhVinh ✅
	 * Func:
    */
    getListNestedItem: {
        params: {
            accountID     : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { accountID } = ctx.params;
                const resultAfterCallHandler = await ITEM__ACCOUNT_MODEL.getListNestedItem({ accountID });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

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
                const { key, lastestID, limit } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;
                const resultAfterCallHandler = await ITEM__ACCOUNT_MODEL.getListWithKey({ companyID: company._id, key, limit, lastestID })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },


}