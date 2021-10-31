/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ITEM__CONTACT_MODEL                   	= require('../model/item.contact-model').MODEL;


module.exports = {
    getList: {
        params: {
            page: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { page }        = ctx.params;
                return { 
                    error: false, page: page, message: 'contract'
                }
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}