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
	 * Dev: Depv 
	 * Func: Thêm template hồ sơ/biên bản
	 * Date: 17/08/2021
	 */
    insert: {
        auth: "required",
        params: {
			name  : { type: "string" },
            sign    : { type: "string" },
            type    : { type: "string" },
            description : { type: "string", optional: true },
            // content 		: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { name, sign, description, type } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_MODEL.insert({
					type, name, sign, description, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv 
	 * Func: Cập nhật template hồ sơ/biên bản
	 * Date: 17/08/2021
	 */
    update: {
        auth: "required",
        params: {
			templateID     : { type: "string" },
			name           : { type: "string" },
            sign           : { type: "string" },
            description    : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { templateID, name, sign , description } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_MODEL.update({
					templateID, name, sign, description, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv 
	 * Func: Cập nhật template hồ sơ/biên bản
	 * Date: 17/08/2021
	 */
    remove: {
        auth: "required",
        params: {
			templateID  : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { templateID } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_MODEL.remove({
					templateID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
    /**
	 * Dev: Depv 
	 * Func: Danh sách template hồ sơ/biên bản
	 * Date: 17/08/2021
	 */
    getList: {
        params: {
            type      : { type: "string" },
            limit     : { type: "string", optional: true },
            lastestID : { type: "string", optional: true },
            keyword   : { type: "string", optional: true },
            templateID: { type: "string", optional: true },
            filter    : { type: "string", optional: true },
            select    : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { limit, type, lastestID, keyword, templateID, filter, select }        = ctx.params;
                let resultAfterCallHandler;
                if(templateID){
                    resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_MODEL.getInfo({
                        templateID, filter
                    });
                }else{
                    resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_MODEL.getList({
                        limit, type, lastestID, keyword, filter, select
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}