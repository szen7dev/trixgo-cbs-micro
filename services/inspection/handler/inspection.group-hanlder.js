/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

 /**
  * MODELS
  */
const INSPECTION__GROUP_MODEL            = require('../model/inspection.group-model').MODEL;

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

                const resultAfterCallHandler = await INSPECTION__GROUP_MODEL.insert({
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
            groupID      : { type: "string" },
			name        : { type: "string" },
            sign        : { type: "string", optional: true },
            description : { type: "string", optional: true },
            order       : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { groupID, name, sign, description, order } = ctx.params;

                const resultAfterCallHandler = await INSPECTION__GROUP_MODEL.update({
					groupID, name, sign, description, order, userID
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
            groupID   : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { groupID } = ctx.params;
                const resultAfterCallHandler = await INSPECTION__GROUP_MODEL.remove({
					groupID
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
            keyword         : { type: "string", optional: true },
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            groupID          : { type: "string", optional: true },
            select          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { projectID, parentID, keyword, limit, lastestID, groupID, select, filter  } = ctx.params;
                let resultAfterCallHandler;
                if(groupID){
                    resultAfterCallHandler = await INSPECTION__GROUP_MODEL.getInfo({
                        groupID, select
                    });
                }else{
                    resultAfterCallHandler = await INSPECTION__GROUP_MODEL.getList({
                        keyword, projectID, parentID, limit, lastestID, select, filter 
                    });
                }
              
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
}