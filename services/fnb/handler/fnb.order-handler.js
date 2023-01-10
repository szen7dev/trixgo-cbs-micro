/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const FNB_ORDER_MODEL            = require('../model/fnb.order-model').MODEL;

module.exports = {
    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 24/11/2022
     */
    insert: {
        auth: "required",
        params: {
            parentID            : { type: "string", optional: true },
            fundaID             : { type: "string" },
            customerID          : { type: "string" },
            shiftID             : { type: "string" },
            assigneeID          : { type: "string", optional: true },
            name                : { type: "string" },
            appOrderSign        : { type: "string", optional: true },
            note                : { type: "string", optional: true },
            salesChannel        : { type: "string" },
            paymentMethod       : { type: "string" },
            service             : { type: "string", optional: true },
            total               : { type: "string", optional: true },
            discount            : { type: "string", optional: true },
            salesoff            : { type: "string", optional: true },
            vatAmount           : { type: "string", optional: true },
            products            : { type: "array", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { fundaID, parentID, customerID, shiftID, assigneeID, name, appOrderSign, note, service, salesChannel, paymentMethod, total, discount, salesoff, vatAmount, products } = ctx.params;

                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FNB_ORDER_MODEL.insert({
                    fundaID, parentID, customerID, shiftID, assigneeID, name, appOrderSign, note, service, salesChannel, paymentMethod, total, discount, salesoff, vatAmount, products, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: update Group
	 */
    update: {
        auth: "required",
        params: {
            orderID             : { type: "string" },
            customerID          : { type: "string", optional: true },
            cancelNote          : { type: "string", optional: true },
            status              : { type: "number", optional: true },
            paymentMethod       : { type: "number", optional: true },
            salesChannel        : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  orderID, customerID, cancelNote, status, paymentMethod, salesChannel } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FNB_ORDER_MODEL.update({
                    orderID, userID,
                    customerID, cancelNote, status, paymentMethod, salesChannel
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: update Group
	 */
    updateValue: {
        auth: "required",
        params: {
            orderID             : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  orderID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await FNB_ORDER_MODEL.updateValue({
                    orderID, userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: remove Group
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

                let resultAfterCallHandler = await FNB_ORDER_MODEL.remove({
                    orderID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv
	 * Func: getList and getInfo pcm_plan_report
	 */
    getInfoAndGetList: {
        auth: "required",
        params: {
            orderID             : { type: "string", optional: true },
            fundasID            : { type: "array", optional: true },
            shiftTypes          : { type: "array", optional: true },
            salesChannels       : { type: "array", optional: true },
            services            : { type: "array", optional: true },
            statuss             : { type: "array", optional: true },
            isMistake           : { type: "string", optional: true },
            fromDate            : { type: "string", optional: true },
            toDate              : { type: "string", optional: true },

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
                let { orderID, fundasID, shiftTypes, salesChannels, services, statuss, isMistake, fromDate, toDate, keyword, limit, lastestID, select, populates, sortKey } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(orderID){
                    resultAfterCallHandler = await FNB_ORDER_MODEL.getInfo({
                        orderID, select, populates,
                    });
                }else{
                    resultAfterCallHandler = await FNB_ORDER_MODEL.getList({
                        companyID: company._id, fundasID, shiftTypes, salesChannels, services, statuss, isMistake, fromDate, toDate, keyword, limit, lastestID, select, populates, sortKey, userID
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
            optionGroup     : { type: "string", optional: true },
            optionStatus    : { type: "string", optional: true },
            optionTime      : { type: "string", optional: true },
            year            : { type: "string", optional: true },
            fromDate        : { type: "string", optional: true },
            toDate          : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;
                let { option, optionGroup, optionStatus, optionTime, fundasID, year, fromDate, toDate } = ctx.params;

                let resultAfterCallHandler = await FNB_ORDER_MODEL.getListByProperty({
                    companyID: company._id, fundasID, option, optionGroup, optionStatus, optionTime, year, fromDate, toDate, userID
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
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;

                // console.log('====================HERE===================')
                // console.log('====================HERE===================')
                // console.log('====================HERE===================')
                const resultAfterCallHandler = await FNB_ORDER_MODEL.downloadTemplateExcel({
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
            // taskID    : { type: 'string', optional: true },
            dataImport: { type: 'string' }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { dataImport } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;
                // console.log(dataImport)

                console.log('====================HERE===================')
                console.log('====================HERE===================')
                console.log('====================HERE===================')

                console.log(dataImport)

                const resultAfterCallHandler = await FNB_ORDER_MODEL.importFromExcel({
                    taskID, dataImport, userID, ctx
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
    exportExcel: {
        auth: 'required',
        params: {
            companyID: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;
                let { companyID, filterParams } = ctx.params;

                if(!companyID) {
                    companyID = company._id;
                }

                const resultAfterCallHandler = await FNB_ORDER_MODEL.exportExcel({
                    userID, companyID, filterParams, ctx
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Dev: HiepNH
     * Func: Reset All Data
     * Date: 25/12/2022
     */
    resetAllData: {
        auth: 'required',
        params: {
            option: { type: "string" },
            password: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, email, company } = ctx.meta.infoUser;
                let { option, password } = ctx.params;

                const resultAfterCallHandler = await FNB_ORDER_MODEL.resetAllData({
                    option, email, password, userID, companyID: company._id
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    }
    
}
