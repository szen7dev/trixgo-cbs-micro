/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const HUMAN_MODEL                               = require('../model/human.contact_document-model').MODEL;


module.exports = {
    /**
	 * ============================ ****************** ===============================
	 * ============================ 	 HUMAN  	   ===============================
	 * ============================ ****************** ===============================
	 */

    /**
	 * Dev: MinhVH
	 * Func: Danh sách hồ sơ nhân sự sắp hết hạn
	 * Date: 26/11/2021
	 */
    getListHumanByExpireDocument: {
        params: {
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
			limit           : { type: "number", optional: true },
			companyID       : { type: "string" },
			select          : { type: "string", optional: true },
            filter          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { lastestID, companyID, keyword, limit, select, filter } = ctx.params;
                
                const resultAfterCallHandler = await HUMAN_MODEL.getListHumanByExpireDocument({
                    lastestID, companyID, userID, keyword, limit, select, filter
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

}
