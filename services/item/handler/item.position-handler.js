/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ITEM__POSITION_MODEL                    = require('../model/item.position-model').MODEL;

module.exports = {
    
    /**
	 * Dev: Depv ✅
	 * Func: Danh sách position
	 */
    getInfoAndGetList: {
        params: {
            positionID      : { type: "string", optional: true },
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
                let { companyID, positionID,  keyword, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler;
                if(positionID){
                    resultAfterCallHandler = await ITEM__POSITION_MODEL.getInfo({
                        positionID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await ITEM__POSITION_MODEL.getList({
                        companyID, lastestID, keyword, select, limit:+ limit, populates
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

}