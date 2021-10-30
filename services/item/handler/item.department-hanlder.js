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
    getListDepartment: {
        params: {
            limit: { type: "string", optional: true },
            lastestID: { type: "string", optional: true },
            keyword: { type: "string", optional: true },
            departmentID: { type: "string", optional: true },
            type: { type: "string", optional: true },
            select: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { keyword, limit, lastestID, departmentID, type, select } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(departmentID){
                    resultAfterCallHandler = await ITEM__DEPARTMENT_MODEL.getInfo({
                        departmentID, select
                    });
                }else{
                    resultAfterCallHandler = await ITEM__DEPARTMENT_MODEL.getList({
                        keyword, limit, lastestID, userID, type, select
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}