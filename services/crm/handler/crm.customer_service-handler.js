/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const CRM_CUSTOMER_SERVICE_MODEL            = require('../model/crm.customer_service-model').MODEL;

module.exports = {
    /**
     * Name: Insert 
     * Author: HiepNH
     * Code: 24/11/2022
     */
    insert: {
        auth: "required",
        params: {
            customerID          : { type: "string", optional: true },
            name                : { type: "string", optional: true },
            businessID          : { type: "string", optional: true },
            orderID             : { type: "string", optional: true },
            mistakeID           : { type: "string", optional: true },
            journeyID           : { type: "string", optional: true },
            type                : { type: "number", optional: true },
            description         : { type: "string", optional: true },
            note                : { type: "string", optional: true },
            amount              : { type: "number", optional: true },
            status              : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { customerID, childID, fundaID, orderID, mistakeID, type, description, date, name, note, status, imagesID } = ctx.params;
                
                console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await CRM_CUSTOMER_SERVICE_MODEL.insert({
                    companyID: company._id, userID, customerID, childID, fundaID, orderID, mistakeID, type, description, date, name, note, status, imagesID
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: HiepNH
	 * Func: update Group
	 */
    update: {
        auth: "required",
        params: {
            customerCareID      : { type: "string", optional: true },
            customerID          : { type: "string", optional: true },
            businessID          : { type: "string", optional: true },
            orderID             : { type: "string", optional: true },
            mistakeID           : { type: "string", optional: true },
            journeyID           : { type: "string", optional: true },
            name                : { type: "string", optional: true },
            type                : { type: "number", optional: true },
            description         : { type: "string", optional: true },
            note                : { type: "string", optional: true },
            rating              : { type: "number", optional: true },
            amount              : { type: "number", optional: true },
            status              : { type: "number", optional: true },
            imagesID            : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const {  customerCareID, customerID, childID, orderID, mistakeID, type, description, date, name, note, status, imagesID } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                console.log(ctx.params)

                const resultAfterCallHandler = await CRM_CUSTOMER_SERVICE_MODEL.update({
                    userID, customerCareID, customerID, childID, orderID, mistakeID, type, description, date, name, note, status, imagesID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: HiepNH
	 * Func: remove Group
	 */
    remove: {
        auth: "required",
        params: {
            orderMistakeID   : { type: "string" }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  orderMistakeID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await CRM_CUSTOMER_SERVICE_MODEL.remove({
                    orderMistakeID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: HiepNH
	 * Func: getList and getInfo pcm_plan_report
	 */
    getInfoAndGetList: {
        auth: "required",
        params: {
            companyID           : { type: "string", optional: true },
            fundasID            : { type: "array", optional: true },
            journeyID           : { type: "string", optional: true },
            customerID          : { type: "string", optional: true },
            userCreateID        : { type: "string", optional: true },
            managerID           : { type: "string", optional: true },
            fromDate            : { type: "string", optional: true },
            toDate              : { type: "string", optional: true },
            type                : { type: "string", optional: true },
            channel             : { type: "string", optional: true },

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
                let { companyID, orderMistakeID, fundasID, customerID, userCreateID, fromDate, toDate, status, type, keyword, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                if(!companyID){
                    companyID = company._id
                }

                // console.log(ctx.params)

                let resultAfterCallHandler;
                if(orderMistakeID){
                    resultAfterCallHandler = await CRM_CUSTOMER_SERVICE_MODEL.getInfo({
                        orderMistakeID, select, populates,
                    });
                }else{
                    resultAfterCallHandler = await CRM_CUSTOMER_SERVICE_MODEL.getList({
                        companyID, fundasID, customerID, userCreateID, fromDate, toDate, status, type, keyword, limit, lastestID, select, populates, userID
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Danh sách theo phân loại
     * Author: HiepNH
     * Code: 14/10/2022
     */
    getListByProperty: {
        params: {
            fundasID        : { type: "array", optional: true },
            option          : { type: "string", optional: true },
            mistakeID       : { type: "string", optional: true },
            executorID      : { type: "string", optional: true },
            optionGroup     : { type: "string", optional: true },
            optionTime      : { type: "string", optional: true },
            year            : { type: "string", optional: true },
            month           : { type: "string", optional: true },
            fromDate        : { type: "string", optional: true },
            toDate          : { type: "string", optional: true },
            
            //_____________THÔNG SỐ MẶC ĐỊNH________________
            keyword         : { type: "string", optional: true },
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            select          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;

                let { option, optionGroup, optionTime, fundasID, businessID, mistakeID, executorID, customerID, year, month, fromDate, toDate, status,
                     keyword, limit, lastestID, select, populates, sortKey } = ctx.params;

                // console.log(ctx.params)

                let resultAfterCallHandler = await CRM_CUSTOMER_SERVICE_MODEL.getListByProperty({
                    companyID: company._id,
                    option, optionGroup, optionTime, fundasID, businessID, mistakeID, executorID, customerID, year, month, fromDate, toDate,
                     keyword, limit, lastestID, select, populates, sortKey, 
                     status, userID 
                    });
             
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

     /**
     * Dev: HiepNH
     * Func: Download Template Excel
     * Date: 8/12/2022
     */
     downloadTemplateExcel: {
        auth: 'required',
        params: {
            
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params)
				const { _id: userID, company } = ctx.meta.infoUser

                const resultAfterCallHandler = await CRM_CUSTOMER_SERVICE_MODEL.downloadTemplateExcel({
                    companyID: company._id, userID 
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Dev: HiepNH
     * Func: Download Template Excel
     * Date: 9/12/2022
     */
    importFromExcel: {
        auth: 'required',
        params: {
            // option    : { type: 'string', optional: true },
            dataImport: { type: 'string' }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { dataImport, option } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;
                // console.log(option)

                const resultAfterCallHandler = await CRM_CUSTOMER_SERVICE_MODEL.importFromExcel({
                    companyID: company._id, userID, dataImport, option, ctx
                })
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Dev: HiepNH
     * Func: Download Excel
     * Date: 5/2/2024
     */
    exportExcel: {
        auth: 'required',
        params: {
            year: { type: "string", optional: true },
            month: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;
                let { option, companyID, fundaID, fromDate, toDate, month, year, status, type, salesChannel, managerID } = ctx.params;

                console.log(ctx.params)

                if(!companyID) {
                    companyID = company._id;
                }

                const resultAfterCallHandler = await CRM_CUSTOMER_SERVICE_MODEL.exportExcel({
                    option, userID, companyID, fundaID, fromDate, toDate, month, year, status, type, salesChannel, managerID
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    }
}