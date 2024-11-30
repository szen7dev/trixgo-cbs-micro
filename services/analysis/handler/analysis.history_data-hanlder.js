/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');
const moment = require('moment');
    
/**
 * MODELS
 */
const ANALYSIS__HISTORY_DATA_MODEL              = require('../model/analysis.history_data').MODEL;

module.exports = {
    insert: {
        auth: "required",
        params: {
            type              : { type: "number", option: "true" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  type } = ctx.params;
				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await ANALYSIS__HISTORY_DATA_MODEL.insert({
                    type, userCreate: userID
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    getData: {
        auth: 'required',
        params: {
            option: { type: "string" },
            companyID: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                // console.log('===========================')
                await this.validateEntity(ctx.params);
				const { _id: userID, email, company } = ctx.meta.infoUser;
                let { option, companyID, page, unit, getNumber } = ctx.params;

                // console.log(ctx.params)

                if(!companyID){
                    companyID = company._id
                }

                const resultAfterCallHandler = await ANALYSIS__HISTORY_DATA_MODEL.getData({
                    option, email, userID, companyID, page, unit, getNumber
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    cloneData: {
        auth: 'required',
        params: {
            option: { type: "string" },
            companyID: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, company } = ctx.meta.infoUser;
                let { option, companyID, orgProjectID, targetProjectID, copyPermission  } = ctx.params;

                // console.log(ctx.params)

                if(!companyID){
                    companyID = company._id
                }

                const resultAfterCallHandler = await ANALYSIS__HISTORY_DATA_MODEL.cloneData({
                    option, userID, companyID, orgProjectID, targetProjectID, copyPermission 
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    convertData: {
        auth: 'required',
        params: {
            option: { type: "string" },
            companyID: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, email, company } = ctx.meta.infoUser;
                let { option, companyID, page, unit, getNumber, fundaID, warehouseID, contactID, fundasID, fromDate, toDate, month, year, docID, parentID, goodsID } = ctx.params;

                // console.log(ctx.params)

                if(!companyID){
                    companyID = company._id
                }

                const resultAfterCallHandler = await ANALYSIS__HISTORY_DATA_MODEL.convertData({
                    option, email, userID, companyID, page, unit, getNumber, fundaID, warehouseID, contactID, fundasID, fromDate, toDate, month, year, docID, parentID, goodsID
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    resetData: {
        auth: 'required',
        params: {
            option: { type: "string" },
            companyID: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                // console.log('===========================')
                await this.validateEntity(ctx.params);
				const { _id: userID, email, company } = ctx.meta.infoUser;
                let { option, companyID, page, unit, getNumber, newPassword, pass, salaryID } = ctx.params;

                // console.log('===========================')
                // console.log(ctx.params)

                if(!companyID){
                    companyID = company._id
                }

                const resultAfterCallHandler = await ANALYSIS__HISTORY_DATA_MODEL.resetData({
                    option, email, userID, companyID, page, unit, getNumber, newPassword, pass, salaryID
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    exportExcel: {
        auth: 'required',
        params: {
            option: { type: "string" },
            companyID: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, email, company } = ctx.meta.infoUser;
                let { option, isPrivate, companyID, year, fromDate, toDate } = ctx.params;

                // console.log(ctx.params)

                if(!companyID){
                    companyID = company._id
                }

                const resultAfterCallHandler = await ANALYSIS__HISTORY_DATA_MODEL.exportExcel({
                    option, isPrivate, companyID, year, fromDate, toDate
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    sendZns: {
        auth: "required",
        params: {
            option: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  option, templateId, appId, start_date, expire, voucher_code, note, salesChannel, fromDate, toDate, min, max, quantity, isTest, phoneTest, page, limit } = ctx.params;
                // console.log(ctx.params)

				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await ANALYSIS__HISTORY_DATA_MODEL.sendZns({
                    ctx, option, companyID: company._id, userID, templateId, appId, start_date, expire, voucher_code, note, salesChannel, fromDate, toDate, min, max, quantity, isTest, phoneTest, page, limit
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}