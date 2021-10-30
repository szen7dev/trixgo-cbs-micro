/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
const INSPECTION__CHECKLIST_MODEL      = require('../model/inspection.checklist-model').MODEL;

module.exports = {
    /**
	 * Dev: DePV ✅
	 * Func: Cập nhật trạng thái hoàn thành checklist
	 * Date: 17/08/2021
	 */
    updateStatus: {
        auth: "required",
        params: {
			checklistID   : { type: "string" },
            status        : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { checklistID, status} = ctx.params;

                const resultAfterCallHandler = await INSPECTION__CHECKLIST_MODEL.updateStatus({
					checklistID, status, authorID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv✅
	 * Func: Danh sách checklist của inspection hoặc thông tin checklist
	 * Date: 17/08/2021
	 */
    getListOrGetInfoChecklist: {
        params: {
            inspectionID        : { type: "string" },
            limit               : { type: "string", optional: true },
            lastestIDchecklist  : { type: "string", optional: true },
            checklistID         : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { inspectionID, limit, lastestIDchecklist, checklistID } = ctx.params;

                let resultAfterCallHandler;
                if(checklistID){
                    resultAfterCallHandler = await INSPECTION__CHECKLIST_MODEL.getInfo({
                        checklistID 
                    });
                }else{
                    resultAfterCallHandler = await INSPECTION__CHECKLIST_MODEL.getListByInspection({
                        inspectionID, limit, lastestIDchecklist
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}