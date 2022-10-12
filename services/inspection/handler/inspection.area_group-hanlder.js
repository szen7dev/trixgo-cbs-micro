/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
const INSPECTION__AREA_GROUP_MODEL            = require('../model/inspection.area_group-model').MODEL;

module.exports = {
    /**
	 * Dev: Depv 
	 * Func: Thêm khu vực
	 * Date: 19/08/2021
	 */
    insert: {
        auth: "required",
        params: {
            projectID       : { type: "string" },
			areaID          : { type: "string" },
			groupID         : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { projectID, areaID, groupID } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__AREA_GROUP_MODEL.insert({
					projectID, areaID, groupID, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv 
	 * Func: Cập nhật khu vực
	 * Date: 19/08/2021
	 */
    update: {
        auth: "required",
        params: {
            areaGroupID     : { type: "string" },
			percentage      : { type: "number", option: true },
			status          : { type: "number", option: true },
			note            : { type: "string", option: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { areaGroupID, percentage, status, note } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__AREA_GROUP_MODEL.update({
					areaGroupID, percentage, status, note, userID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    
    /**
	 * Dev: Depv 
	 * Func: Xóa khu vực
	 * Date: 19/08/2021
	 */
    remove: {
        auth: "required",
        params: {
            areaGroupID   : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { areaGroupID } = ctx.params;
                const resultAfterCallHandler = await INSPECTION__AREA_GROUP_MODEL.remove({
					areaGroupID
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv 
	 * Func: Xóa khu vực
	 * Date: 19/08/2021
	 */
    getInfoAndGetList: {
        auth: "required",
        params: {
            projectID       : { type: "string", optional: true },
            areaID          : { type: "string", optional: true },
            groupID         : { type: "string", optional: true },
            option          : { type: "string", optional: true },
            areaGroupID     : { type: "string", optional: true },
            
            keyword         : { type: "string", optional: true },
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            select          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { projectID, areaID, groupID, option, areaGroupID, keyword, limit, lastestID, select  } = ctx.params;
                let resultAfterCallHandler;
                if(areaGroupID){
                    resultAfterCallHandler = await INSPECTION__AREA_GROUP_MODEL.getInfo({
                        areaGroupID, select
                    });
                }else{
                    resultAfterCallHandler = await INSPECTION__AREA_GROUP_MODEL.getList({
                        projectID, areaID, groupID, option, keyword, limit, lastestID, select 
                    });
                }
              
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
}