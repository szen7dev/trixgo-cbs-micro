/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ITEM__CONTACT_MODEL                   = require('../model/item.contact-model').MODEL;

module.exports = {
    
    /**
	 * Dev: Depv ✅
	 * Func: Danh sách doctype
	 */
    getInfoAndGetList: {
        params: {
            // Field bổ sung
            contactID           : { type: "string", optional: true },
            type                : { type: "string", optional: true },

            // Field mặc định
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            filter          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { contactID, type, keyword, limit, lastestID, select, filter, populates } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(contactID){
                    resultAfterCallHandler = await ITEM__CONTACT_MODEL.getInfo({
                        contactID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await ITEM__CONTACT_MODEL.getList({
                        companyID: company._id, type, lastestID, userID, keyword, limit, select, filter, populates
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

}