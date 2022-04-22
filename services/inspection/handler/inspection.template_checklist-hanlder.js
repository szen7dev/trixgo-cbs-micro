/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
 const INSPECTION__TEMPLATE_DOC_MODEL            = require('../model/inspection.template_doc-model').MODEL;
 const INSPECTION__TEMPLATE_CHECKLIST_MODEL      = require('../model/inspection.template_checklist-model').MODEL;


module.exports = {
    /**
	 * Dev: DePV 
	 * Func: Thêm template checklist
	 * Date: 17/08/2021
	 */
    insert: {
        auth: "required",
        params: {
			name          : { type: "string" },
            inspection    : { type: "string" },
            description   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { inspection, name, description } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__TEMPLATE_CHECKLIST_MODEL.insert({
					inspection, name, description, authorID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv 
	 * Func: Cập nhật template checklist
	 * Date: 17/08/2021
	 */
    update: {
        auth: "required",
        params: {
			checklistID    : { type: "string" },
			name           : { type: "string" },
            description    : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { checklistID, name, description } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__TEMPLATE_CHECKLIST_MODEL.update({
					checklistID, name, description, authorID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv 
	 * Func: Xóa template checklist
	 * Date: 17/08/2021
	 */
    remove: {
        auth: "required",
        params: {
			checklistID  : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { checklistID } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__TEMPLATE_CHECKLIST_MODEL.remove({
					checklistID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: Danh sách template checklist của inspection
	 * Date: 17/08/2021
	 */
    getInfoAndGetList: {
        params: {
            limit       : { type: "string", optional: true },
            lastestID   : { type: "string", optional: true },
            templateID  : { type: "string", optional: true },
            checklistID : { type: "string", optional: true },
            keyword     : { type: "string", optional: true },
            filter      : { type: "string", optional: true },
            select      : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { limit, lastestID, templateID, checklistID, keyword, filter, select } = ctx.params;
                let resultAfterCallHandler;
                if(checklistID){
                    resultAfterCallHandler = await INSPECTION__TEMPLATE_CHECKLIST_MODEL.getInfo({
                        checklistID, filter
                    });
                }else{
                    resultAfterCallHandler = await INSPECTION__TEMPLATE_CHECKLIST_MODEL.getList({
                        keyword, templateID, limit, lastestID, filter, select
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}