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
	 * Dev: Depv ✅
	 * Func: Thêm template hồ sơ/biên bản
	 * Date: 17/08/2021
	 */
    insertDoc: {
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
				const { _id: authorID } = ctx.meta.infoUser;
                const { name, sign , description, type } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_MODEL.insert({
					type, name, sign, description, authorID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: Cập nhật template hồ sơ/biên bản
	 * Date: 17/08/2021
	 */
    updateDoc: {
        auth: "required",
        params: {
			templateDocID  : { type: "string" },
			name           : { type: "string" },
            sign           : { type: "string" },
            description    : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { templateDocID, name, sign , description } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_MODEL.update({
					templateDocID, name, sign, description, authorID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: Cập nhật template hồ sơ/biên bản
	 * Date: 17/08/2021
	 */
    removeDoc: {
        auth: "required",
        params: {
			templateDocID  : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { templateDocID } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_MODEL.remove({
					templateDocID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
    /**
	 * Dev: Depv ✅
	 * Func: Danh sách template hồ sơ/biên bản
	 * Date: 17/08/2021
	 */
    getList: {
        params: {
            limit: { type: "string", optional: true },
            lastestIDTemplateDoc: { type: "string", optional: true },
            type: { type: "string" },
            keyword: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { limit, type, lastestIDTemplateDoc, keyword }        = ctx.params;

                const resultAfterCallHandler = await INSPECTION__TEMPLATE_DOC_MODEL.getListByType({
					limit, type, lastestIDTemplateDoc, keyword
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}