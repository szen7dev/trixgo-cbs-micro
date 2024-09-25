/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const STORE_ORDER_PRODUCT_MODEL            = require('../model/store.order_product-model.js').MODEL;

module.exports = {
    /**
     * Name: Insert 
     * Author: HiepNH
     * Code: 15/9/2024
     */
    insert: {
        auth: "required",
        params: {
            orderID             : { type: "string" },
            goodsID             : { type: "string", optional: true  },
            subGoodsID          : { type: "string", optional: true },
            size                : { type: "number", optional: true },
            sugar               : { type: "number", optional: true },
            ice                 : { type: "number", optional: true },
            quantity            : { type: "number", optional: true },
            unitPrice           : { type: "number", optional: true },
            note                : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { fundaID, orderID, accountID, contraID, customerID, contractID, goodsID, assetsID, workID, subtypeID, name, sign, note, quantity, weight, unitPrice } = ctx.params;

                // console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await STORE_ORDER_PRODUCT_MODEL.insert({ userID, fundaID, orderID, accountID, contraID, customerID, contractID, goodsID, assetsID, workID, subtypeID, name, sign, note, quantity, weight, unitPrice });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Update 
     * Author: HiepNH
     * Code: 15/9/2024
	 */
    update: {
        auth: "required",
        params: {
            orderProductID  : { type: "string" },
            filesID: { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { orderProductID, filesID, checked, fundaID, accountID, contraID, customerID, contractID, goodsID, assetsID, workID, subtypeID, name, note, quantity, weight, unitPrice } = ctx.params;

                // console.log(ctx.params)

				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await STORE_ORDER_PRODUCT_MODEL.update({ userID, orderProductID, filesID, checked, fundaID, accountID, contraID, customerID, contractID, goodsID, assetsID, workID, subtypeID, name, note, quantity, weight, unitPrice });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Remove 
     * Author: HiepNH
     * Code: 15/9/2024
	 */
    remove: {
        auth: "required",
        params: {
            orderID   : { type: "string" }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  orderID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await STORE_ORDER_PRODUCT_MODEL.remove({
                    orderID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: getInfoAndGetList 
     * Author: HiepNH
     * Code: 15/9/2024
	 */
    getInfoAndGetList: {
        auth: "required",
        params: {
            orderProductID     : { type: "string", optional: true },

            //==============================================
            keyword     : { type: "string", optional: true },
            limit       : { type: "string", optional: true },
            lastestID   : { type: "string", optional: true },
            select      : { type: "string", optional: true },
            populates   : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { orderProductID, option, status, outin, type, companyID, fundaID, projectID, packageID, toPackageID, warehouseID, accountID, contraID, customerID, goodsID, parentGoodsID, assetsID, workID, subtypeID, orderID, userCreateID, fromDate, toDate, keyword, limit, lastestID, select, populates, sortKey } = ctx.params;
                
                // console.log('====================')
                // console.log(ctx.params)
                
				const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler;
                if (orderProductID) {
                    resultAfterCallHandler = await STORE_ORDER_PRODUCT_MODEL.getInfo({
                        orderProductID, userID, select, populates
                    });
                } else {
                    resultAfterCallHandler = await STORE_ORDER_PRODUCT_MODEL.getList({
                        userID, option, status, outin, type, companyID, fundaID, projectID, packageID, toPackageID, warehouseID, accountID, contraID, customerID, goodsID, parentGoodsID, assetsID, workID, subtypeID, orderID, userCreateID, fromDate, toDate, keyword, limit, lastestID, select, populates, sortKey
                     });
 
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: getListByProperty 
     * Author: HiepNH
     * Code: 15/9/2024
	 */
    getListByProperty: {
        auth: "required",
        params: {
            option          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { option, outin, type, projectID, warehouseID, accountID, contraID, customerID, goodsID, assetsID, workID, subtypeID, userCreateID, fromDate, toDate } = ctx.params;

                // console.log(ctx.params)
                
                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await STORE_ORDER_PRODUCT_MODEL.getListByProperty({ companyID: company._id, option, outin, type, projectID, warehouseID, accountID, customerID, goodsID, assetsID, workID, subtypeID, userCreateID, fromDate, toDate })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /*
     * Name: Gom nhóm theo thuộc tính 
     * Code: HiepNH
     * Date: 20/9/2024
     */
    getAmountByProperty: {
        auth: "required",
        params: {
            companyID       : { type: "string", optional: true },
            parentID        : { type: "string", optional: true },
            accountID       : { type: "string", optional: true },
            year            : { type: "string", optional: true },
            option          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { companyID, parentID, accountID, year, option } = ctx.params;

                const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                let resultAfterCallHandler = await STORE_ORDER_PRODUCT_MODEL.getAmountByProperty({
                    userID, companyID, parentID, accountID, year, option, ctx
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Name: downloadTemplateExcel 
     * Author: HiepNH
     * Code: 15/9/2024
	 */
    downloadTemplateExcel: {
        auth: 'required',
        params: {

        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;

                const resultAfterCallHandler = await STORE_ORDER_PRODUCT_MODEL.downloadTemplateExcel({
                    companyID: company._id, userID 
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Name: importFromExcel 
     * Author: HiepNH
     * Code: 15/9/2024
	 */
    importFromExcel: {
        auth: 'required',
        params: {
            dataImport: { type: 'string' }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { dataImport } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await STORE_ORDER_PRODUCT_MODEL.importFromExcel({
                    taskID, dataImport, userID, ctx
                })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Name: exportExcel 
     * Author: HiepNH
     * Code: 15/9/2024
	 */
    exportExcel: {
        auth: 'required',
        params: {
            companyID: { type: "string", optional: true },
            option: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                
				const { _id: userID, email, company } = ctx.meta.infoUser;
                let { companyID, option, month, year, filterParams } = ctx.params;

                if(!companyID) {
                    companyID = company._id;
                }

                const resultAfterCallHandler = await STORE_ORDER_PRODUCT_MODEL.exportExcel({
                    userID, email, companyID, option, month, year, filterParams
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Name Download Excel Contact by pagination
     * Date: 13/12/2023
     */
    exportExcelByFilter: {
        auth: "required",
        async handler(ctx) {
            try {
				await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;

                let { option, filterParams } = ctx.params;
                
                // console.log(ctx.params)

                const resultAfterCallHandler = await STORE_ORDER_PRODUCT_MODEL.exportExcelByFilter({
                    userID, companyID: company._id, option, filterParams, ctx
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
}