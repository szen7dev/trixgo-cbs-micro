/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ITEM__AREA_MODEL                    = require('../model/item.area-model').MODEL;

module.exports = {
    
    /**
	 * Dev: Depv 
	 * Func: Danh sách area
	 */
    getInfoAndGetList: {
        params: {
            areaID          : { type: "string", optional: true },
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
                let { areaID,  keyword, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;
                
                let resultAfterCallHandler;
                if(areaID){
                    resultAfterCallHandler = await ITEM__AREA_MODEL.getInfo({
                        areaID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await ITEM__AREA_MODEL.getList({
                        companyID: company._id, lastestID, keyword, select, limit, populates
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

}