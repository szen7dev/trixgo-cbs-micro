/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
 const INSPECTION__TEMPLATE_DOC_MODEL                   = require('../model/inspection.template_doc-model').MODEL;


module.exports = {
    /**
	 * Dev: HiepNH
	 * Func: Thêm template hồ sơ/biên bản
	 * Date: 17/08/2021
	 */
     insertDoc: {
        auth: "required",
        params: {
			name  : { type: "string" },
            sign    : { type: "string" },
            // content 		: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { name, sign } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_MODEL.insert({
					name, sign, 
                    authorID
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