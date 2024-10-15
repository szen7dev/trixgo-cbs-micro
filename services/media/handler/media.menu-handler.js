/**
 * TOOLS
 */
const { renderStatusCodeAndResponse } = require('../../../tools/utils/status_code.js');

/**
 * MODELS
 */
const MEDIA_MENU_MODEL = require('../model/media.menu-model.js').MODEL;

module.exports = {
    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 9/4/2022
     */
    insert: {
        auth: "required",
        params: {
            accountID: { type: "string", optional: true },
            customerID: { type: "string", optional: true },
            contractID: { type: "string", optional: true },
            name: { type: "string" },
            sign: { type: "string", optional: true },
            note: { type: "string", optional: true },
            date: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { outin, type, fundaID, projectID, packageID, toPackageID, warehouseID, toWarehouseID, customerID, contractID, date, name, sign, note, linkID } = ctx.params;

                // console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await MEDIA_MENU_MODEL.insert({
                    companyID: company._id, userID, outin, type, fundaID, projectID, packageID, toPackageID, warehouseID, toWarehouseID, customerID, contractID, date, name, sign, note, linkID
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx })
            } catch (error) {
                return { error: true, message: error.message };
            }
        }

    },

    /**
     * Name: Update
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    update: {
        auth: "required",
        params: {
            orderID  : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { orderID, filesID, fundaID, projectID, packageID, toPackageID, warehouseID, toWarehouseID, accountID, customerID, contractID, goodsID, assetsID, workID, name, sign, note, linkID, date, members, admins, outin, type, status, isAddSignature } = ctx.params;
                // console.log(ctx.params)

                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await MEDIA_MENU_MODEL.update({ userID, orderID, filesID, fundaID, projectID, packageID, toPackageID, warehouseID, toWarehouseID, accountID, customerID, contractID, goodsID, assetsID, workID, name, sign, note, linkID, date, members, admins, outin, type, status, isAddSignature, ctx });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Remove
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    remove: {
        auth: "required",
        params: {
            cashBooksID: { type: "array" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { cashBooksID } = ctx.params;
                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await MEDIA_MENU_MODEL.remove({
                    cashBooksID, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
     * Name: Get info and Get list
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getInfoAndGetList: {
        auth: "required",
        params: {
            orderID         : { type: "string", optional: true },
            parentID        : { type: "string", optional: true },
            accountID       : { type: "string", optional: true },
            customerID      : { type: "string", optional: true },
            contractID      : { type: "string", optional: true },
            sortKey         : { type: "string", optional: true },
            outin           : { type: "string", optional: true },
            isCompanyOther  : { type: "string", optional: true },
            arrType         : { type: 'array', optional: true },

            // Field mặc định
            keyword         : { type: "string", optional: true },
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { option, status, arrType, outin, type, orderID, companyID, projectID, packageID, toPackageID, warehouseID, accountID, customerID, goodsID, assetsID, contractID, parentID, userCreateID, isCompanyOther, keyword, fromDate, toDate, limit, lastestID, populates, select, sortKey
                } = ctx.params;

                // console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler;
                if (orderID) {
                    resultAfterCallHandler = await MEDIA_MENU_MODEL.getInfo({
                        orderID, userID, select, populates
                    });
                } else {
                    resultAfterCallHandler = await MEDIA_MENU_MODEL.getList({ option, status, arrType, outin, type, companyID, projectID, packageID, toPackageID, warehouseID, accountID, customerID, goodsID, assetsID, contractID, parentID, userID, userCreateID, isCompanyOther, keyword, limit, lastestID, select, populates, sortKey, companyOfUser: company._id, fromDate, toDate
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
}