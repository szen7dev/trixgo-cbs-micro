/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ITEM__DEPARTMENT_MODEL                   = require('../model/item.department-model').MODEL;

module.exports = {
    
    /**
	 * Dev: Depv ✅
	 * Func: Danh sách dự án mà user được quyền truy cập
	 */
    getInfoAndGetList: {
        params: {
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
            departmentID    : { type: "string", optional: true },
            companyID       : { type: "string", optional: true },
            type            : { type: "number", optional: true },
            select          : { type: "string", optional: true },
            filter          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { keyword, limit, lastestID, departmentID, companyID, type, select, filter } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(departmentID){
                    resultAfterCallHandler = await ITEM__DEPARTMENT_MODEL.getInfo({
                        departmentID, select
                    });
                }else{
                    resultAfterCallHandler = await ITEM__DEPARTMENT_MODEL.getList({
                        companyID, keyword, limit, lastestID, userID, type, select, filter
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

}