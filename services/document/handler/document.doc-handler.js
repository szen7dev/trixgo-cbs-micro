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
            name                : { type: "string" },
            sign                : { type: "string" },
            storeSign           : { type: "string" },
            type                : { type: "number" },
            description         : { type: "string", optional: true },
            note                : { type: "string", optional: true },
            approver            : { type: "string" },
            date                : { type: "string" },
            receivedDate        : { type: "string" },
            style               : { type: "string" },
            status              : { type: "string" },
            amount              : { type: "number" },
            amountDelivery      : { type: "number" },
            requestResponse     : { type: "number" },
            expiredResponse     : { type: "string" },
            direction           : { type: "number" },
            packageID           : { type: "string", optional: true },
            senderID            : { type: "string", optional: true },
            receiverID          : { type: "string", optional: true },
            fieldID             : { type: "string", optional: true },
            propertyID          : { type: "string", optional: true },
            otherID             : { type: "string", optional: true },
            storageID           : { type: "string", optional: true },
            departmentID        : { type: "string" },
            companyID           : { type: "string" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const {
                    parentID, name, sign, storeSign, description, approver, date, receivedDate, type, style, status,
                    amount, amountDelivery, requestResponse, expiredResponse, direction, packageID, senderID, receiverID,
                    fieldID, propertyID, otherID, storageID, note, departmentID, companyID
                } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.insertDocument({
                    parentID, name, sign, storeSign, description, approver, date, receivedDate, type, style, status,
                    amount, amountDelivery, requestResponse, expiredResponse, direction, packageID, senderID, receiverID,
                    fieldID, propertyID, otherID, storageID, note, departmentID, companyID, userID, ctx
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
            name                : { type: "string" },
            sign                : { type: "string" },
            storeSign           : { type: "string" },
            type                : { type: "number" },
            description         : { type: "string", optional: true },
            note                : { type: "string", optional: true },
            approver            : { type: "string", optional: true },
            date                : { type: "string" },
            receivedDate        : { type: "string" },
            style               : { type: "string" },
            status              : { type: "string" },
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
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userUpdate } = ctx.meta.infoUser;
                const {
                    documentID, name, sign, storeSign, description, approver, date, receivedDate, type, style, status,
                    amount, amountDelivery, requestResponse, expiredResponse, direction, packageID, senderID, receiverID,
                    fieldID, propertyID, otherID, storageID, note
                } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.updateDocument({
                    documentID, name, sign, storeSign, description, approver, date, receivedDate, type, style, status,
                    amount, amountDelivery, requestResponse, expiredResponse, direction, packageID, senderID, receiverID,
                    fieldID, propertyID, otherID, storageID, note, userUpdate, ctx
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

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.deleteDocument({
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
	 * Func: Danh sách hồ sơ văn bản
	 * Date: 27/10/2021
	 */
    getListDocument: {
        params: {
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
			limit           : { type: "number", optional: true },
			companyID       : { type: "string", optional: true },
			departmentID    : { type: "string", optional: true },
            packageID	    : { type: "string", optional: true },
			doctypeID	    : { type: "string", optional: true },
			senderID	    : { type: "string", optional: true },
            contractID	    : { type: "string", optional: true },
			requestResponse : { type: "number", optional: true },
			marked          : { type: "number", optional: true },
			select          : { type: "string", optional: true },
            filter          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { lastestID, departmentID, companyID, packageID, doctypeID, senderID, contractID, requestResponse, marked, keyword, limit, select, filter } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.getListDocument({
                    lastestID, departmentID, companyID, packageID, doctypeID, senderID, contractID, userID, requestResponse, marked, keyword, limit, select, filter
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

	/**
	 * Dev: MinhVH
	 * Func: Danh sách tính chất văn bản
	 * Date: 27/10/2021
	 */
    getListDoctype: {
        params: {
            lastestID   	: { type: "string", optional: true },
            keyword     	: { type: "string", optional: true },
			companyID		: { type: "string", optional: true },
            departmentID	: { type: "string", optional: true },
            limit       	: { type: "number", optional: true },
			select      	: { type: "string", optional: true },
            filter      	: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { lastestID, companyID, departmentID, keyword, limit, select, filter } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.getListDoctype({
                    lastestID, userID, companyID, departmentID, keyword, limit, select, filter
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
	 * Dev: MinhVH
	 * Func: Danh sách phân loại hồ sơ trong gói thầu
	 * Date: 27/10/2021
	 */
    getListDoctypeByPackage: {
        params: {
			companyID		: { type: "string", optional: true },
            departmentID	: { type: "string", optional: true },
            packageID	    : { type: "string" },
            type	        : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { companyID, departmentID, packageID, type } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.getListDoctypeByPackage({
                    userID, companyID, departmentID, packageID, type
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
	 * Func: Chia sẻ văn bản
	 * Date: 05/11/2021
	 */
    updateShareDocument: {
        params: {
			documentID  : { type: "string" },
			isShare     : { type: "boolean" },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { documentID, usersID, isShare } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.updateShareDocument({
                    userID, documentID, usersID, isShare
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

}
