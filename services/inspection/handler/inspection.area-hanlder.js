/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
const INSPECTION__AREA_MODEL            = require('../model/inspection.area-model').MODEL;

module.exports = {
    /**
	 * Dev: Depv 
	 * Func: Thêm khu vực
	 * Date: 19/08/2021
	 */
    insert: {
        auth: "required",
        params: {
            projectID   : { type: "string" },
			name        : { type: "string" },
            parentID    : { type: "string", optional: true },
            sign        : { type: "string", optional: true },
            description : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { parentID, projectID, name, sign, description } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__AREA_MODEL.insert({
					parentID, projectID, name, sign, description, userID
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
            areaID      : { type: "string" },
			name        : { type: "string" },
            sign        : { type: "string", optional: true },
            description : { type: "string", optional: true },
            order       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { areaID, name, sign, description, order } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__AREA_MODEL.update({
					areaID, name, sign, description, order, userID
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
            areaID   : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { areaID } = ctx.params;
                const resultAfterCallHandler = await INSPECTION__AREA_MODEL.remove({
					areaID
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
            parentID        : { type: "string", optional: true },
            areaID          : { type: "string", optional: true },
            option          : { type: "string", optional: true },

            keyword         : { type: "string", optional: true },
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            select          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { projectID, parentID, areaID, option, keyword, limit, lastestID, select, populates } = ctx.params;
                let resultAfterCallHandler;
                if(areaID){
                    resultAfterCallHandler = await INSPECTION__AREA_MODEL.getInfo({
                        areaID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await INSPECTION__AREA_MODEL.getList({
                        projectID, parentID, option, keyword, limit, lastestID, select, populates 
                    });
                }
              
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
}