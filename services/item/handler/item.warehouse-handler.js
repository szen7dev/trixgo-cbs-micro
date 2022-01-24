/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ITEM__WAREHOUSE_MODEL                    = require('../model/item.warehouse-model').MODEL;

module.exports = {
    
    /**
	 * Dev: Depv ✅
	 * Func: Danh sách doctype
	 */
    getInfoAndGetList: {
        params: {
            warehouseID     : { type: "string", optional: true },
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
                let { warehouseID,  keyword, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler;
                if(warehouseID){
                    resultAfterCallHandler = await ITEM__WAREHOUSE_MODEL.getInfo({
                        warehouseID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await ITEM__WAREHOUSE_MODEL.getList({
                        companyID, lastestID, keyword, limit, select, populates
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

}