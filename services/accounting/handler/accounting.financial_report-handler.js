/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ACCOUNTING__FINANCIAL_REPORT_MODEL = require('../model/accounting.financial_report-model').MODEL

module.exports = {
    /**
     * Name: Insert 
     * Author: HiepNH
     * Code: 15/9/2024
     */
    insert: {
        auth: "required",
        params: {
            parentID             : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { name, note, fromDate, toDate } = ctx.params;

                console.log(ctx.params)

                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await ACCOUNTING__FINANCIAL_REPORT_MODEL.insert({ userID, companyID: company._id, name, note, fromDate, toDate })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx })
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
            reportID    : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { reportID, name, note, fromDate, toDate } = ctx.params;

                // console.log(ctx.params)

				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await ACCOUNTING__FINANCIAL_REPORT_MODEL.update({ userID, reportID, name, note, fromDate, toDate });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
    
    /**
     * Name: syncData
     * Author: HiepNH
     * Code: 22/3/2024
     */
    syncData: {
        params: {
            reportID : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { option, reportID, arrFunda } = ctx.params;

                console.log(ctx.params)

				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await ACCOUNTING__FINANCIAL_REPORT_MODEL.syncData({
                    userID, companyID: company._id, option, reportID, arrFunda
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
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
            reportID   : { type: "string" }
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  reportID } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await ACCOUNTING__FINANCIAL_REPORT_MODEL.remove({
                    reportID
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
            reportID     : { type: "string", optional: true },
            parentID     : { type: "string", optional: true },

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
                let { reportID, parentID, keyword, limit, lastestID, select, populates, sortKey } = ctx.params;
                
                // console.log(ctx.params)
                
				const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if (reportID) {
                    resultAfterCallHandler = await ACCOUNTING__FINANCIAL_REPORT_MODEL.getInfo({
                        reportID, userID, select, populates
                    });
                } else {
                    resultAfterCallHandler = await ACCOUNTING__FINANCIAL_REPORT_MODEL.getList({
                        userID, companyID: company._id, parentID, keyword, limit, lastestID, select, populates, sortKey 
                     })
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
                let { option, reportID, accountID } = ctx.params;

                // console.log(ctx.params)
                
                const { _id: userID, company } = ctx.meta.infoUser;

                let resultAfterCallHandler = await ACCOUNTING__FINANCIAL_REPORT_MODEL.getListByProperty({ companyID: company._id, option, reportID, accountID })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
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

                const resultAfterCallHandler = await ACCOUNTING__FINANCIAL_REPORT_MODEL.exportExcel({
                    userID, email, companyID, option, month, year, filterParams
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    }
}