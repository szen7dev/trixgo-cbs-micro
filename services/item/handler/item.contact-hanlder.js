/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ITEM__CONTACT_MODEL                   	= require('../model/item.contact-model').MODEL;


module.exports = {
    getListContact: {
        params: {
            lastestID: { type: "string", optional: true },
            limit: { type: "number", optional: true },
            keyword: { type: "string", optional: true },
            companyID: { type: "string", optional: true },
            departmentID: { type: "string", optional: true },
            filter: { type: "string", optional: true },
            select: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID } = ctx.meta.infoUser;
                const { lastestID, companyID, departmentID, keyword, limit, filter, select } = ctx.params;

                const resultAfterCallHandler = await ITEM__CONTACT_MODEL.getListContact({
                    lastestID, userID, companyID, departmentID, keyword, limit, filter, select
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
}
