/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
 const INSPECTION__TEMPLATE_DOC_MODEL                   = require('../model/inspection.area-model').MODEL;


module.exports = {
    /**
	 * Dev: HiepNH
	 * Func: Thêm khu vực
	 * Date: 19/08/2021
	 */
     insert: {
        auth: "required",
        params: {
			name  : { type: "string" },
            sign    : { type: "string" },
            description    : { type: "description", optional: true },
            // content 		: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userCreate } = ctx.meta.infoUser;
                const { name, sign, description } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_MODEL.insert({
					name, 
                    sign, 
                    description,
                    userCreate
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    getList: {
        params: {
            page            : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { page }        = ctx.params;
                return { 
                    error: false, page: page
                }
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}