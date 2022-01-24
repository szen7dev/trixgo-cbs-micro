/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ITEM__DOCTYPE_MODEL                   = require('../model/item.doctype-model').MODEL;

module.exports = {
    
    /**
	 * Dev: Depv ✅
	 * Func: Danh sách doctype
	 */
    getInfoAndGetList: {
        params: {
            // Field bổ sung
            projectID       : { type: "string", optional: true },
            type            : { type: "string", optional: true },
            doctypeID       : { type: "string", optional: true },
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
                let { doctypeID, projectID, type, keyword, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }
                
                let resultAfterCallHandler;
                if(doctypeID){
                    resultAfterCallHandler = await ITEM__DOCTYPE_MODEL.getInfo({
                        doctypeID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await ITEM__DOCTYPE_MODEL.getList({
                        companyID, projectID, lastestID, userID, type, keyword, limit, select, populates
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

}