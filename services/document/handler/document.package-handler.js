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
	 * Func: Danh sách gói thầu
	 * Date: 27/10/2021
	 */
    getListPackage: {
        params: {
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
			limit           : { type: "number", optional: true },
			departmentID    : { type: "string", optional: true },
			select          : { type: "string", optional: true },
            filter          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { lastestID, departmentID, keyword, limit, select, filter } = ctx.params;
                
                const resultAfterCallHandler = await DOCUMENT__PACKAGE_MODEL.getListPackage({
                    lastestID, departmentID, userID, keyword, limit, select, filter
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

}
