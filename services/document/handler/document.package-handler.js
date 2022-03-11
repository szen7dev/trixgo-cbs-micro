/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const DOCUMENT__PACKAGE_MODEL                   = require('../model/document.package-model').MODEL;

module.exports = {
    /**
	 * ============================ ****************** ===============================
	 * ============================ 	 PACKAGE  	   ===============================
	 * ============================ ****************** ===============================
	 */

     /**
	 * Dev: Depv
	 * Func: Tạo gói thầu
	 * Date: 11/02/2022
	 */
    insert: {
        params: {
			name            : { type: "string" },
			sign            : { type: "string" },
			projectID       : { type: "string" },
			parentID        : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { name, sign, projectID, parentID } = ctx.params;
                const resultAfterCallHandler = await DOCUMENT__PACKAGE_MODEL.insert({
                    name, sign, userID, projectID, parentID, ctx
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: Cập nhật gói thầu
	 * Date: 11/02/2022
	 */
    update: {
        params: {
            packageID               : { type: "string" },
            name                    : { type: "string", optional: true },
            sign                    : { type: "string", optional: true },
            members                 : { type: "array", optional: true },
            membersRemove           : { type: "array", optional: true },
            admins                  : { type: "array", optional: true },
            adminsRemove            : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID } = ctx.meta.infoUser;
                let { packageID, name, sign, members, membersRemove, admins, adminsRemove } = ctx.params;
                let resultAfterCallHandler = await DOCUMENT__PACKAGE_MODEL.update({
                    packageID, name, sign, members, membersRemove, admins, adminsRemove, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

     /**
	 * Dev: Depv
	 * Func: Xoa gói thầu
	 * Date: 11/02/2022
	 */
    remove: {
        params: {
            packageID : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID, company } = ctx.meta.infoUser;
                let { packageID } = ctx.params;
                let resultAfterCallHandler = await DOCUMENT__PACKAGE_MODEL.remove({
                    packageID
                });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: Xoá nhiều gói thầu
	 * Date: 11/02/2022
	 */
    removeMany: {
        params: {
            packagesID : { type: "array" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID, company } = ctx.meta.infoUser;
                let { packagesID } = ctx.params;
                let resultAfterCallHandler = await DOCUMENT__PACKAGE_MODEL.removeMany({
                    packagesID
                });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
    
    /**
	 * Dev: Depv
	 * Func: Danh sách gói thầu hoặc chi tiết gói thầu
	 * Date: 27/10/2021
	 */
    getInfoAndGetList: {
        params: {
			departmentID     : { type: "string", optional: true },
			packageID        : { type: "string", optional: true },
            // =========================
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
			select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
            limit           : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { packageID, lastestID, departmentID, keyword, select, populates, limit } = ctx.params;
                let resultAfterCallHandler;
                
                if(packageID){
                    resultAfterCallHandler = await DOCUMENT__PACKAGE_MODEL.getInfo({
                        packageID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await DOCUMENT__PACKAGE_MODEL.getListPackage({
                        departmentID, userID, lastestID, keyword, select, populates, limit
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

}
