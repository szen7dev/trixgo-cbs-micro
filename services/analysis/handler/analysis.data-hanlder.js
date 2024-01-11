/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');
    
/**
 * MODELS
 */
const ANALYSIS__DATA_MODEL                      = require('../model/analysis.data').MODEL;

module.exports = {
    getData: {
        auth: 'required',
        params: {
            option: { type: "string" },
            companyID: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
				const { _id: userID, email, company } = ctx.meta.infoUser;
                let { option, companyID, page, unit, getNumber } = ctx.params;

                // console.log(ctx.params)

                if(!companyID){
                    companyID = company._id
                }

                const resultAfterCallHandler = await ANALYSIS__DATA_MODEL.getData({
                    option, email, userID, companyID, page, unit, getNumber
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
                let { option, companyID, page, unit, getNumber } = ctx.params;

                // console.log(ctx.params)

                if(!companyID){
                    companyID = company._id
                }

                const resultAfterCallHandler = await ANALYSIS__DATA_MODEL.exportExcel({
                    option, email, userID, companyID, page, unit, getNumber
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
                let { option, companyID, page, unit, getNumber } = ctx.params;

                // console.log(ctx.params)

                if(!companyID){
                    companyID = company._id
                }

                const resultAfterCallHandler = await ANALYSIS__DATA_MODEL.convertData({
                    option, email, userID, companyID, page, unit, getNumber
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
                await this.validateEntity(ctx.params);
				const { _id: userID, email, company } = ctx.meta.infoUser;
                let { option, companyID, page, unit, getNumber } = ctx.params;

                // console.log(ctx.params)

                if(!companyID){
                    companyID = company._id
                }

                const resultAfterCallHandler = await ANALYSIS__DATA_MODEL.resetData({
                    option, email, userID, companyID, page, unit, getNumber
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },
}