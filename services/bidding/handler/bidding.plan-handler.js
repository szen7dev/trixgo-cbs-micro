/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const BIDDING__DOC_MODEL                   = require('../model/bidding.plan-model').MODEL;

module.exports = {
    /**
	 * ============================ ****************** ===============================
	 * ============================ 	 DOC FILE  	   ===============================
	 * ============================ ****************** ===============================
	 */

    /**
	 * Dev: HiepNH
	 * Func: Thêm mẩu tin
	 * Date: 04/3/2022
	 */
    insert: {
        params: {
            type     : { type: "number" },
			parentID      : { type: "string", optional: true },
			projectID     : { type: "string" },
			name          : { type: "string" },
			sign          : { type: "string", optional: true },
			note          : { type: "string", optional: true },
			factor1       : { type: "string", optional: true },
			factor2       : { type: "string", optional: true },
			factor3       : { type: "string", optional: true },
			factor4       : { type: "string", optional: true },
			factor5       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { parentID, type, projectID, name, sign, note, factor1, factor2, factor3, factor4, factor5 } = ctx.params;
                let resultAfterCallHandler = await BIDDING__DOC_MODEL.insert({
                    parentID, type, projectID, userID, name, sign, note, factor1, factor2, factor3, factor4, factor5, ctx
                });
          
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: Xóa doc file
	 * Date: 27/10/2021
	 */
    remove: {
        params: {
			docFileID      : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { docFileID } = ctx.params;

                let resultAfterCallHandler = await BIDDING__DOC_MODEL.delete({
                    docFileID 
                });
          
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: Danh sách vaf chi tiết doc file
	 * Date: 27/10/2021
	 */
    getInfoAndGetList: {
        params: {
			documentID      : { type: "string", optional: true },
			docFileID       : { type: "string", optional: true },
            
            lastestID       : { type: "string", optional: true },
            limit           : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
			select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { docFileID, documentID, keyword, select, lastestID, limit, populates } = ctx.params;
                let resultAfterCallHandler;
                
                if(docFileID){
                    resultAfterCallHandler = await BIDDING__DOC_MODEL.getInfo({
                        docFileID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await BIDDING__DOC_MODEL.getList({
                        documentID, userID, lastestID, limit: +limit, keyword, select, populates
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

}
