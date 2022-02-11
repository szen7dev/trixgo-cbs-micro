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
			sign            : { type: "string", optional: true },
			contractID      : { type: "string", optional: true },
			projectID       : { type: "string" },
			companyID       : { type: "string", optional: true },
			parentID        : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				let { _id: userID, company } = ctx.meta.infoUser;
                let { name, sign, contractID, projectID, companyID, parentID } = ctx.params;
                if(!companyID){
                    companyID = company._id;
                }

                let resultAfterCallHandler = await DOCUMENT__PACKAGE_MODEL.insert({
                    name, sign, contractID, authorID: userID, projectID, companyID, parentID
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
            documentPackageID       : { type: "string" },
            name                    : { type: "string", optional: true },
            membersAddID            : { type: "array", optional: true },
            membersRemoveID         : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID, company } = ctx.meta.infoUser;
                let { documentPackageID, name, membersAddID, membersRemoveID } = ctx.params;
                let resultAfterCallHandler = await DOCUMENT__PACKAGE_MODEL.update({
                    documentPackageID, name, membersAddID, membersRemoveID
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
			documentPackageID: { type: "string", optional: true },
            // =========================
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
			select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { documentPackageID, lastestID, departmentID, keyword, select, populates } = ctx.params;
                let resultAfterCallHandler;
                
                if(documentPackageID){
                    resultAfterCallHandler = await DOCUMENT__PACKAGE_MODEL.getInfo({
                        documentPackageID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await DOCUMENT__PACKAGE_MODEL.getListPackage({
                        departmentID, userID, lastestID, keyword, select, populates
                    });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

}
