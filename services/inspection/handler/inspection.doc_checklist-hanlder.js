/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
const INSPECTION__CHECKLIST_MODEL      = require('../model/inspection.doc_checklist-model').MODEL;

module.exports = {
    /**
	 * Dev: DePV ✅
	 * Func: Cập nhật trạng thái hoàn thành checklist
	 * Date: 17/08/2021
	 */
    update: {
        auth: "required",
        params: {
			checklistID   : { type: "string" },
            status        : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { checklistID, status } = ctx.params;
                
                const resultAfterCallHandler = await INSPECTION__CHECKLIST_MODEL.update({
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
    getList: {
        params: {
            limit               : { type: "string", optional: true },
            lastestID           : { type: "string", optional: true },
            filter              : { type: "string", optional: true },
            select              : { type: "string", optional: true },
            //-------------------------------------------------------
            inspectionID        : { type: "string", optional: true },
            checklistID         : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { limit, lastestID, filter, select, inspectionID, checklistID } = ctx.params;

                let resultAfterCallHandler;
                if(checklistID){
                    resultAfterCallHandler = await INSPECTION__CHECKLIST_MODEL.getInfo({
                        checklistID 
                    });
                }else{
                    resultAfterCallHandler = await INSPECTION__CHECKLIST_MODEL.getList({
                        limit, lastestID, filter, select, inspectionID, lastestID
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}