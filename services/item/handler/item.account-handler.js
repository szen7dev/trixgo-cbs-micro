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
	 * Dev: Depv ✅
	 * Func: Danh sách account
	 */
    getInfoAndGetList: {
        params: {
            accountID       : { type: "string", optional: true },
            companyID       : { type: "string", optional: true },
            // Field mặc định
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { accountID, companyID, keyword, 
                    limit, lastestID, select, populates,
                    status, type, level,
                } = ctx.params;
                const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }
                console.log({___ : limit})
                let resultAfterCallHandler;
                if(accountID){
                    resultAfterCallHandler = await ITEM__ACCOUNT_MODEL.getInfo({
                        accountID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await ITEM__ACCOUNT_MODEL.getList({
                        companyID, lastestID, keyword, select, limit, populates,
                        status, type, level,
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    getInfoAccountWithName:{
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
        },
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
				const { _id: userID, company } = ctx.meta.infoUser;
                const { accountID,status, showInReportMonth, isNestedOfCompany } = ctx.params;
                let resultAfterCallHandler;
                if(isNestedOfCompany){
                    resultAfterCallHandler = await ITEM__ACCOUNT_MODEL.getListByCompany({ companyID: company._id, status, showInReportMonth });
                }
                if(!isNestedOfCompany){
                    resultAfterCallHandler = await ITEM__ACCOUNT_MODEL.getListNestedItem({ accountID });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

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