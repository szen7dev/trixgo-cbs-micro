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
            lastestIDDepartment: { type: "string", optional: true },
            keyword: { type: "string", optional: true },
            departmentID: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { keyword, limit, lastestIDDepartment, departmentID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(departmentID){
                    resultAfterCallHandler = await ITEM__DEPARTMENT_MODEL.getInfo({
                        templateID
                    });
                }else{
                    resultAfterCallHandler = await ITEM__DEPARTMENT_MODEL.getListDepartment({
                        keyword, limit, lastestIDDepartment, userID
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}