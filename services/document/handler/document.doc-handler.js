/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const DOCUMENT__DOC_MODEL                   	= require('../model/document.doc-model').MODEL;


module.exports = {
    /**
	 * ============================ ****************** ===============================
	 * ============================ 	 DOCUMENT  	   ===============================
	 * ============================ ****************** ===============================
	 */

	/**
	 * Dev: MinhVH
	 * Func: Tạo mới văn bản
	 * Date: 26/10/2021
	 */
    insertDocument: {
        params: {
            parentID            : { type: "string", optional: true },
            name                : { type: "string",                },
            sign                : { type: "string", optional: true },
            storeSign           : { type: "string", optional: true },
            type                : { type: "number", optional: true },
            description         : { type: "string", optional: true },
            note                : { type: "string", optional: true },
            approver            : { type: "string", optional: true },
            date                : { type: "string", },
            receivedDate        : { type: "string", optional: true },
            style               : { type: "string", optional: true },
            status              : { type: "string", optional: true },
            amount              : { type: "number", optional: true },
            amountDelivery      : { type: "number", optional: true },
            requestResponse     : { type: "number", optional: true },
            expiredResponse     : { type: "string", optional: true },
            direction           : { type: "number",                },
            packageID           : { type: "string",                },
            senderID            : { type: "string", optional: true },
            receiverID          : { type: "string", optional: true },
            fieldID             : { type: "string", optional: true },
            datahubContactID    : { type: "string", optional: true },
            propertyID          : { type: "string", optional: true },
            contractID          : { type: "string", optional: true },
            otherID             : { type: "string", optional: true },
            storageID           : { type: "string", optional: true },
            departmentID        : { type: "string",                },
            value               : { type: "number", optional: true },
            completeStatus      : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const {
                    parentID, name, sign, storeSign, description, approver, date, receivedDate, type, style, status,
                    amount, amountDelivery, requestResponse, expiredResponse, direction, packageID, senderID, receiverID,
                    fieldID, propertyID, otherID, storageID, note, departmentID, value, completeStatus, contractID, datahubContactID
                } = ctx.params;
                // console.log({   parentID, name, sign, storeSign, description, approver, date, receivedDate, type, style, status,
                //     amount, amountDelivery, requestResponse, expiredResponse, direction, packageID, senderID, receiverID,
                //     fieldID, propertyID, otherID, storageID, note, departmentID, value, completeStatus, contractID })
                    
                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.insert({   
                    parentID, name, sign, storeSign, description, approver, date, receivedDate, type, style, status,
                    amount, amountDelivery, requestResponse, expiredResponse, direction, packageID, senderID, receiverID,
                    fieldID, propertyID, otherID, storageID, note, departmentID, userID, value, completeStatus,contractID, datahubContactID, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
    /**
	 * Dev: MinhVH
	 * Func: Cập nhật văn bản
	 * Date: 28/10/2021
	 */
    updateDocument: {
        params: {
            documentID          : { type: "string" },
            name                : { type: "string", optional: true },
            sign                : { type: "string", optional: true },
            storeSign           : { type: "string", optional: true },
            type                : { type: "number", optional: true },
            description         : { type: "string", optional: true },
            note                : { type: "string", optional: true },
            approver            : { type: "string", optional: true },
            date                : { type: "string", },
            receivedDate        : { type: "string", optional: true },
            style               : { type: "string", optional: true },
            status              : { type: "string", optional: true },
            amount              : { type: "number", optional: true },
            amountDelivery      : { type: "number", optional: true },
            requestResponse     : { type: "number", optional: true },
            expiredResponse     : { type: "string", optional: true },
            direction           : { type: "number", optional: true },
            packageID           : { type: "string", optional: true },
            senderID            : { type: "string", optional: true },
            receiverID          : { type: "string", optional: true },
            fieldID             : { type: "string", optional: true },
            propertyID          : { type: "string", optional: true },
            otherID             : { type: "string", optional: true },
            storageID           : { type: "string", optional: true },
            value               : { type: "number", optional: true },
            completeStatus      : { type: "number", optional: true },
            contractID          : { type: "string", optional: true },
            datahubContactID    : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userUpdate } = ctx.meta.infoUser;
                const {
                    documentID, name, sign, storeSign, description, approver, date, receivedDate, type, style, status,
                    amount, amountDelivery, requestResponse, expiredResponse, direction, packageID, senderID, receiverID,
                    fieldID, propertyID, otherID, storageID, note, value, completeStatus, contractID, datahubContactID
                } = ctx.params;
                
                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.update({
                    documentID, name, sign, storeSign, description, approver, date, receivedDate, type, style, status,
                    amount, amountDelivery, requestResponse, expiredResponse, direction, packageID, senderID, receiverID,
                    fieldID, propertyID, otherID, storageID, note, userID: userUpdate, value, completeStatus, contractID, datahubContactID, ctx
				});

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });   
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Xóa văn bản
	 * Date: 30/10/2021
	 */
    deleteDocument: {
        params: {
			documentID: { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { documentID } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.remove({
                    userID, documentID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Chi tiết hồ sơ văn bản
	 * Date: 12/11/2021
	 */
    getInfoDocumment: {
        params: {
			documentID : { type: "string" },
            populates  : { type: "string", optional: true },
			select     : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { documentID, select, populates } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.getInfo({
                    userID, documentID, select, populates
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Danh sách hồ sơ văn bản
	 * Date: 27/10/2021
	 */
    getListDocument: {
        params: {
			parentID        : { type: "string", optional: true },
			companyID       : { type: "string", optional: true },
			departmentID    : { type: "string", optional: true },
            packageID	    : { type: "string", optional: true },
			doctypeID	    : { type: "string", optional: true },
			senderID	    : { type: "string", optional: true },
            contractID	    : { type: "string", optional: true },
			requestResponse : { type: "string", optional: true },
			type            : { type: "string", optional: true },
			direction       : { type: "string", optional: true },
			datahubContactID: { type: "string", optional: true },
			marked          : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
			select          : { type: "string", optional: true },
			receivedDate    : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;
                let { 
                    parentID, companyID, packageID, departmentID, direction, senderID, receiverID, propertyID, receivedDate, datahubContactID,
                    type, contractID, storageID, requestResponse, fieldID, fromDate, toDate, marked, keyword, limit, lastestID, select, populates
                } = ctx.params;
                
                // if(!companyID){
                //     companyID = company._id
                // }
                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.getList({
                    parentID, companyID, packageID, departmentID, direction, senderID, receiverID, propertyID, receivedDate,
                    type, contractID, storageID, requestResponse, fieldID, fromDate, toDate, marked, datahubContactID, userID, keyword, 
                    limit, lastestID, select, populates
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx }); 
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Danh sách nhóm phân loại hồ sơ
	 * Date: 27/10/2021
	 */
    getListGroupDoctype: {
        params: {
			companyID		: { type: "string", optional: true },
            departmentID	: { type: "string", optional: true },
            packageID	    : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { companyID, departmentID, packageID } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.statisticalByType({
                    userID, companyID, departmentID, packageID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

     /**
	 * Dev: MinhVH
	 * Func: Danh sách lưu trữ hồ sơ văn bản
	 * Date: 30/10/2021
	 */
    getListStorage: {
        params: {
			companyID   : { type: "string" },
            lastestID   : { type: "string", optional: true },
            keyword     : { type: "string", optional: true },
            limit       : { type: "number", optional: true },
			select      : { type: "string", optional: true },
            filter      : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { companyID, lastestID, keyword, limit, select, filter } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.getListStorage({
                    userID, companyID, lastestID, keyword, limit, select, filter
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Đánh dấu hồ sơ
	 * Date: 30/12/2021
	 */  
    updateMarkDocument: {
        params: {
			documentID: { type: "string" },
			isMark: { type: "boolean" }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { documentID, isMark } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.updateMarkDocument({
                    userID, documentID, isMark
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Chia sẻ văn bản
	 * Date: 05/11/2021
	 */
    updateShareDocument: {
        params: {
			documentID  : { type: "string" },
			isShare     : { type: "boolean" }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { documentID, usersID, isShare } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.updateShareDocument({
                    authorID, documentID, usersID, isShare
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Cập nhật quyền người được chia sẻ văn bản
	 * Date: 05/11/2021
	 */
    updatePermissionShare: {
        params: {
			documentID  : { type: "string" },
			userID      : { type: "string" },
			permission  : { type: "number" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { documentID, userID, permission } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.updatePermissionShare({
                    authorID, documentID, userID, permission
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Danh sách user được truy cập hồ sơ
	 * Date: 10/11/2021
	 */
    getListUserShared: {
        params: {
			documentID  : { type: "string" },
            lastestID   : { type: "string", optional: true },
            limit       : { type: "number", optional: true },
			select      : { type: "string", optional: true },
            filter      : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { documentID, lastestID, limit, select, filter } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.getListUserShared({
                    userID, documentID, lastestID, limit, select, filter
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Thêm file đính kèm trong hồ sơ
	 * Date: 13/11/2021
	 */  
    addFileAttachment: {
        params: {
			documentID: { type: "string" }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: authorID } = ctx.meta.infoUser;
                const { documentID, filesID } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.addFileAttachment({
                    authorID, documentID, filesID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },


    /**
	 * Dev: Depv
	 * Func: Thống kê theo type
	 * Date: 13/11/2021
	 */  
    statisticalByType: {
        params: {
			departmentID        : { type: "string", optional: true },
			packageID           : { type: "string", optional: true },
			isDatahubContact    : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID, company    } = ctx.meta.infoUser;
                const { departmentID, packageID, isDatahubContact } = ctx.params;
                let resultAfterCallHandler;
                if(isDatahubContact == 1){
                    resultAfterCallHandler = await DOCUMENT__DOC_MODEL.statisticalByDatahubContact({
                        userID, companyID: company._id, departmentID, packageID, isDatahubContact
                    });
                }else{
                    resultAfterCallHandler = await DOCUMENT__DOC_MODEL.statisticalByType({
                        userID, companyID: company._id, departmentID, packageID
                    });
                }
                console.log({ resultAfterCallHandler })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: Lấy số lượng công việc của tất cả project mà user là members
	 * Date: 13/11/2021
	 */  
     getAmountDocumentByProjects: {
        params: {
			fromDate : { type: "string", optional: true },
			toDate   : { type: "string", optional: true }
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID, company    } = ctx.meta.infoUser;
                const { fromDate, toDate } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.getAmountDocumentByProjects({
                    userID, fromDate, toDate, ctx
                });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

}
