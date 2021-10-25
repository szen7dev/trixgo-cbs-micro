/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const DOCUMENT__DOC_MODEL                   	= require('../model/document.doc-model').MODEL;

/**
 * COLLECTIONS
 */


module.exports = {
    /**
	 * ============================ ****************** ===============================
	 * ============================ 	 DOCUMENT  	   ===============================
	 * ============================ ****************** ===============================
	 */

	/**
	 * Dev: MinhVH
	 * Func: Demo
	 * Date: 17/08/2021
	 */
	insertDoc: {
        params: {
			conversationID  : { type: "string" },
            parentID		: { type: "string", optional: true },
            type 			: { type: "string" },
            content 		: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: senderID } = ctx.meta.infoUser;
                const { conversationID, parentID, content, type, location, files, usersAssigned } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.insertDoc({
					conversationID, senderID, parentID, content, type, files, location, usersAssigned, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },


}
