/**
 * TOOLS
 */
 const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
 const INSPECTION_DOC_MODEL                   = require('../model/inspection.doc-model').MODEL;

module.exports = {
    /**
     * Name: Thêm
     * Author: HiepNH
     * Code: 2/10/2022
     */
    insert: {
        auth: "required",
        params: {
            contractID  : { type: "string", optional: true },
			areaID      : { type: "string", optional: true },
			groupID     : { type: "string", optional: true },
            assigneeID  : { type: "string", optional: true },
            name        : { type: "string" },
            expiredTime : { type: "string", optional: true },
            sign        : { type: "string", optional: true },
            templateID  : { type: "string", optional: true },
            relatedIDs     : { type: "array", optional: true },
            description : { type: "string", optional: true },
            belongSystem : { type: "string", optional: true },
            authorAttachs    : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { contractID, areaID, groupID, sign, templateID, assigneeID, relatedIDs, name, expiredTime, description, belongSystem, authorAttachs } = ctx.params;
                // console.log({contractID, areaID, groupID, sign, templateID, assigneeID, relatedIDs, name, expiredTime, description})

                const resultAfterCallHandler = await INSPECTION_DOC_MODEL.insert({
					contractID, areaID, groupID, sign, templateID, assigneeID, relatedIDs, name, expiredTime, description, belongSystem, authorAttachs, userID, ctx
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
            taskID       : { type: "string", optional: true },
            assigneeID  : { type: "string", optional: true },
            sign        : { type: "string", optional: true },
            templateID  : { type: "string", optional: true },
            relatedIDs     : { type: "array", optional: true },
            linksDocs     : { type: "array", optional: true },
            name        : { type: "string", optional: true },
            expiredTime : { type: "string", optional: true },
            description : { type: "string", optional: true },
            status      : { type: "number", optional: true },
            percentage      : { type: "number", optional: true },
            option          : { type: "number", optional: true },
            optionSeen      : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {          
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { taskID, sign, assigneeID, name, expiredTime, description, status, relatedIDs, percentage, option, optionSeen, linksDocs } = ctx.params;

                const resultAfterCallHandler = await INSPECTION_DOC_MODEL.update({
					taskID, sign, assigneeID, name, expiredTime, description, status, relatedIDs, percentage, option, optionSeen, linksDocs, userID 
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
			taskID : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { taskID } = ctx.params;
                const resultAfterCallHandler = await INSPECTION_DOC_MODEL.remove({
					taskID 
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
    getInfoAndGetList: {
        params: {
            projectID   : { type: "string", optional: true },
            contractID  : { type: "string", optional: true },
            taskID       : { type: "string", optional: true },
            belongSystem  : { type: "string", optional: true },
            option      : { type: "string", optional: true },
            optionSeen      : { type: "string", optional: true },
            // assignee    : { type: "string", optional: true },
            // author      : { type: "string", optional: true },
            // contract    : { type: "string", optional: true },
            // signature   : { type: "string", optional: true },
            // area        : { type: "string", optional: true },
            // fromDate    : { type: "string", optional: true },
            // toDate      : { type: "string", optional: true },
            // fromCreateAt: { type: "string", optional: true },
            // toCreateAt  : { type: "string", optional: true },
            
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
                let { option, optionSeen, taskID, projectID, contractID, parentAreaID, areaID, parentGroupID, groupID, statusNe, belongSystem, keyword, limit, lastestID, select, populates, sortKey } = ctx.params;
                let resultAfterCallHandler;
                
                if(taskID){
                    resultAfterCallHandler = await INSPECTION_DOC_MODEL.getInfo({
                        taskID, userID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await INSPECTION_DOC_MODEL.getList({
                        option, optionSeen, projectID, contractID, parentAreaID, areaID, parentGroupID, groupID, statusNe, belongSystem, keyword, limit, lastestID, select, populates, sortKey, userID
                    });
                }
             
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Danh sách theo phân loại
     * Author: HiepNH
     * Code: 14/10/2022
     */
    getListByProperty: {
        params: {
            projectID   : { type: "string", optional: true },
            contractID  : { type: "string", optional: true },
            taskID       : { type: "string", optional: true },
            belongSystem  : { type: "string", optional: true },
            option      : { type: "string", optional: true },
            optionArea      : { type: "string", optional: true },
            optionGroup      : { type: "string", optional: true },
            optionTime      : { type: "string", optional: true },
            // assignee    : { type: "string", optional: true },
            // author      : { type: "string", optional: true },
            // contract    : { type: "string", optional: true },
            // signature   : { type: "string", optional: true },
            // area        : { type: "string", optional: true },
            // fromDate    : { type: "string", optional: true },
            // toDate      : { type: "string", optional: true },
            // fromCreateAt: { type: "string", optional: true },
            // toCreateAt  : { type: "string", optional: true },
            
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
                let { option, optionProcess, optionArea, optionGroup, optionTime, optionContract, optionAssignee, year, month, projectID, contractID, parentAreaID, areaID, parentGroupID, groupID, statusNe, belongSystem, keyword, limit, lastestID, select, populates, sortKey } = ctx.params;

                console.log('==========Danh sách theo phân loại================')

                let resultAfterCallHandler = await INSPECTION_DOC_MODEL.getListByProperty({
                    option, optionProcess, optionArea, optionGroup, optionTime, optionContract, optionAssignee, year, month, projectID, contractID, parentAreaID, areaID, parentGroupID, groupID, statusNe, belongSystem, keyword, limit, lastestID, select, populates, sortKey, userID
                    });
             
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}