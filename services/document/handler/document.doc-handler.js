/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const DOCUMENT__DOC_MODEL                   	= require('../model/document.doc-model').MODEL;

/**
 * COLLECTIONS
 */


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
            description         : { type: "string", optional: true },
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
                    parentID, name, sign, storeSign, description, approver, date, receivedDate, style, status,
                    amount, amountDelivery, requestResponse, expiredResponse, direction, packageID, senderID, receiverID, 
                    fieldID, propertyID, otherID, storageID, note, departmentID, companyID
                } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.insertDocument({
                    parentID, name, sign, storeSign, description, approver, date, receivedDate, style, status,
                    amount, amountDelivery, requestResponse, expiredResponse, direction, packageID, senderID, receiverID, 
                    fieldID, propertyID, otherID, storageID, note, departmentID, companyID, userID
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
	 * Date: 26/10/2021
	 */
    getListDocument: {
        params: {
            lastestID: { type: "string", optional: true },
            keyword: { type: "string", optional: true },
            limit: { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID } = ctx.meta.infoUser;
                const { lastestID, keyword, limit, select, filter } = ctx.params;

                const resultAfterCallHandler = await DOCUMENT__DOC_MODEL.getListDocument({
                    lastestID, keyword, limit, select, filter, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

}
