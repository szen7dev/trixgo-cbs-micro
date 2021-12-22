/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const CONTACT_DOCUMENT_MODEL                    = require('../model/human.contact_document-model').MODEL;


module.exports = {
    /**
	 * ============================ ****************** ===============================
	 * ============================ 	 HUMAN  	   ===============================
	 * ============================ ****************** ===============================
	 */

    /**
	 * Dev: MinhVH
	 * Func: Danh sách hồ sơ nhân sự
	 * Date: 26/11/2021
	 */
    getListContactDocument: {
        params: {
            lastestID           : { type: "string", optional: true },
            keyword             : { type: "string", optional: true },
			limit               : { type: "string", optional: true },
			companyID           : { type: "string" },
			type                : { type: "string", optional: true },
			isExpire            : { type: "string", optional: true },
			select              : { type: "string", optional: true },
            filter              : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { lastestID, companyID, type, isExpire, keyword, limit, select, filter } = ctx.params;

                const resultAfterCallHandler = await CONTACT_DOCUMENT_MODEL.getListContactDocument({
                    lastestID, companyID, userID, type, isExpire, keyword, limit, select, filter
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
    
    /**
	 * Dev: MinhVH
	 * Func: Chi tiết nhân sự
	 * Date: 30/11/2021
	 */
    getInfoContactDocument: {
        params: {
			contactID  : { type: "string" },
			type       : { type: "string" },
			select     : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { contactID, type, select } = ctx.params;

                const resultAfterCallHandler = await CONTACT_DOCUMENT_MODEL.getInfoContactDocument({
                    userID, contactID, type, select
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

}
