/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
const INSPECTION__CHECKLIST_MODEL               = require('../model/inspection.checklist-model').MODEL;

module.exports = {
    /**
     * Name: Thêm
     * Author: HiepNH
     * Code: 2/10/2022
     */
     insertc: {
        auth: "required",
        params: {
            inspectionID    : { type: "string" },
			name            : { type: "string"},
			description     : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { inspectionID, name, description } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__CHECKLIST_MODEL.insert({
					inspectionID, name, description, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
     * Name: Cập nhật
     * Author: HiepNH
     * Code: 2/10/2022
     */
    update: {
        auth: "required",
        params: {
            checklistID     : { type: "string" },
			name            : { type: "string"},
			description     : { type: "string", optional: true },
            status          : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {          
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { checklistID, name, description, status } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__CHECKLIST_MODEL.update({
					checklistID, name, description, status, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
     * Name: Xóa
     * Author: HiepNH
     * Code: 2/10/2022
     */
    remove: {
        auth: "required",
        params: {
			checklistID : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { checklistID } = ctx.params;
                const resultAfterCallHandler = await INSPECTION__CHECKLIST_MODEL.remove({
					checklistID 
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
     * Name: Lấy thông tin + Danh sách
     * Author: HiepNH
     * Code: 2/10/2022
     */
    getList: {
        params: {
            checklistID   : { type: "string", optional: true },
            inspectionID   : { type: "string", optional: true },
            
            //_____________THÔNG SỐ MẶC ĐỊNH________________
            keyword         : { type: "string", optional: true },
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            select          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                let { checklistID, inspectionID, keyword, limit, lastestID, select, populates } = ctx.params;
                let resultAfterCallHandler;
                
                if(checklistID){
                    resultAfterCallHandler = await INSPECTION__CHECKLIST_MODEL.getInfo({
                        checklistID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await INSPECTION__CHECKLIST_MODEL.getList({
                        inspectionID, keyword, limit, lastestID, select, populates
                    });
                }
             
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}