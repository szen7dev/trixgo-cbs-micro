/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const DOCUMENT__PACKAGE_MODEL                   = require('../model/document.package-model').MODEL;


module.exports = {
    /**
	 * ============================ ****************** ===============================
	 * ============================ 	 PACKAGE  	   ===============================
	 * ============================ ****************** ===============================
	 */

    /**
	 * Dev: MinhVH
	 * Func: Danh sách gói thầu hoặc chi tiết gói thầu
	 * Date: 27/10/2021
	 */
    getInfoAndGetList: {
        params: {
			departmentID     : { type: "string", optional: true },
			documentPackageID: { type: "string", optional: true },
            // =========================
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
			select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { documentPackageID, lastestID, departmentID, keyword, select, populates } = ctx.params;
                let resultAfterCallHandler;
                
                if(documentPackageID){
                    resultAfterCallHandler = await DOCUMENT__PACKAGE_MODEL.getInfo({
                        documentPackageID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await DOCUMENT__PACKAGE_MODEL.getListPackage({
                        departmentID, userID, lastestID, keyword, select, populates
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

}
