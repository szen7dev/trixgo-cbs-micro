/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ITEM__DEPARTMENT_DERECTORY_MODEL           = require('../model/item.department_directory-model').MODEL;

module.exports = {
    /**
     * Dev: Depv ✅
     * Func: Thêm funda
     */
    insert:{
        params: {
            member      : { type: "string" },
            type        : { type: "string" },
            name        : { type: "string" },
            description : { type: "string" },
            lock        : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID, company } = ctx.meta.infoUser;
                const { member, type, name, description, lock } = ctx.params;
                const resultAfterCallHandler = await ITEM__DEPARTMENT_DERECTORY_MODEL.insert({ companyID: company._id, member, type, name, description, lock, userID });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        },
    },

    /**
     * Dev: Depv ✅
     * Func: Cập nhật funda
     */
    update:{  
        params: {
            departmentDirectoryID  : { type: "string" }, 
            member                 : { type: "string" },
            type                   : { type: "string" },
            name                   : { type: "string" },
            description            : { type: "string" },
            look                   : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { _id: userID, company } = ctx.meta.infoUser;
                const { departmentDirectoryID, member, type, name, description, look } = ctx.params;
                const resultAfterCallHandler = await ITEM__DEPARTMENT_DERECTORY_MODEL.update({ departmentDirectoryID, member, type, name, description, look, userID });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        },
    },

    /**
	 * Dev: Depv 
	 * Func: Danh sách funda
	 */
    getInfoAndGetList: {
        params: {
            departmentDirectoryID   : { type: "string", optional: true },
            
            // Field mặc định
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { departmentDirectoryID, keyword, limit, lastestID, select, populates } = ctx.params;
                const { _id: userID, company } = ctx.meta.infoUser;
                
                let resultAfterCallHandler;
                if(departmentDirectoryID){
                    resultAfterCallHandler = await ITEM__DEPARTMENT_DERECTORY_MODEL.getInfo({
                        departmentDirectoryID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await ITEM__DEPARTMENT_DERECTORY_MODEL.getList({
                        companyID: company._id, keyword, limit, lastestID, select, populates
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message }; 
            }
        }
    },
}