/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ITEM__FUNDA_MODEL                   = require('../model/item.funda-model').MODEL;

module.exports = {
    
    getListByUserCompany: {
        params: {
          
        },
        async handler(ctx) {
            try {
				const { company } = ctx.meta.infoUser;
                const resultAfterCallHandler = await ITEM__FUNDA_MODEL.getListFundaOfCompany({ companyID: company._id })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

}