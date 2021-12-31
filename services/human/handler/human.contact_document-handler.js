/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const HUMAN__CONTACT_DOCUMENT_MODEL                    = require('../model/human.contact_document-model').MODEL;

module.exports = {
    
    /**
	 * Dev: Depv ✅
	 * Func: Danh sách doctype
	 */
    getInfoAndGetList: {
        params: {
            contactDocumentID : { type: "string", optional: true },
            type              : { type: "string", optional: true },
            contactID         : { type: "string", optional: true },
            
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
                let { contactDocumentID, type, contactID, keyword, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(contactDocumentID){
                    resultAfterCallHandler = await HUMAN__CONTACT_DOCUMENT_MODEL.getInfo({
                        contactDocumentID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await HUMAN__CONTACT_DOCUMENT_MODEL.getList({
                        companyID: company._id, type, contactID, lastestID, keyword, select, limit, populates
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

}