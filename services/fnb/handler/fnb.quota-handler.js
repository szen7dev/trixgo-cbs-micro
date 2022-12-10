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

     /**
     * Dev: HiepNH
     * Func: Download Template Excel
     * Date: 8/12/2022
     */
     downloadTemplateExcel: {
        auth: 'required',
        params: {

        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;

                // console.log('====================HERE===================')
                // console.log('====================HERE===================')
                // console.log('====================HERE===================')
                const resultAfterCallHandler = await FNB_QUOTA_MODEL.downloadTemplateExcel({
                    companyID: company._id, userID 
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Dev: HiepNH
     * Func: Download Template Excel
     * Date: 9/12/2022
     */
    importFromExcel: {
        auth: 'required',
        params: {
            dataImport: { type: 'string' }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { dataImport } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                // console.log(dataImport)

                console.log('====================HERE===================')
                console.log('====================HERE===================')
                console.log('====================HERE===================')

                console.log(dataImport)

                const resultAfterCallHandler = await FNB_QUOTA_MODEL.importFromExcel({
                    taskID, dataImport, userID, ctx
                })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Dev: HiepNH
     * Func: Download Template Excel
     * Date: 9/12/2022
     */
    exportExcel: {
        auth: 'required',
        params: {
            companyID: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;
                let { companyID, filterParams } = ctx.params;

                if(!companyID) {
                    companyID = company._id;
                }

                const resultAfterCallHandler = await FNB_QUOTA_MODEL.exportExcel({
                    userID, companyID, filterParams, ctx
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },
    
}