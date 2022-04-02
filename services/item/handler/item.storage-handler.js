/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ITEM__STORAGE_MODEL                    = require('../model/item.storage-model').MODEL;

module.exports = {
    /**
	 * Dev: Depv ✅
	 * Func: insert storage
	 */
    insert: {
        params: {
            companyID  : { type: "string" },
            projectID  : { type: "string" },
            name       : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { projectID, name } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }
               
                let resultAfterCallHandler = await ITEM__STORAGE_MODEL.insert({
                    companyID, projectID, name, userID, ctx
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Dev: Depv ✅
     * Func: update storage
     */
    update: {
        params: {
            storageID  : { type: "string", optional: true },
            name       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { storageID, name } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
               
                let resultAfterCallHandler = await ITEM__STORAGE_MODEL.update({
                    storageID, name, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
    
    /**
     * Dev: Depv ✅
     * Func: remove storage => KHÔNG CHO PHÉP XÓA CÁC DANH MỤC
     */
    
    /**
	 * Dev: Depv ✅
	 * Func: Danh sách doctype
	 */
    getInfoAndGetList: {
        params: {
            storageID       : { type: "string", optional: true },
            companyID       : { type: "string", optional: true },
            projectID       : { type: "string", optional: true },
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
                let { companyID, storageID, projectID, keyword, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;
                if(!companyID){
                    companyID = company._id;
                }
                let resultAfterCallHandler;
                if(storageID){
                    resultAfterCallHandler = await ITEM__STORAGE_MODEL.getInfo({
                        storageID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await ITEM__STORAGE_MODEL.getList({
                        companyID, projectID, lastestID, keyword, limit, select, populates
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
}