/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');
let AUTH__COMPANY_MODEL                         = require('../model/auth.company-model.js').MODEL;

module.exports = {
    insert: {
        auth: "required",
        params: {
            name            : { type: "string" },
            sign            : { type: "string" },
            taxid           : { type: "string" },
            address         : { type: "string" },
            area            : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let {  name, sign, taxid, address, area  } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await AUTH__COMPANY_MODEL.insert({
                    name, sign, taxid, address, area, userID 
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
   
    update: {
        auth: "required",
        params: {
            companyID       : { type: "string" },
            name            : { type: "string" },
            sign            : { type: "string" },
            taxid           : { type: "string" },
            address         : { type: "string" },
            area            : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { companyID, name, sign, taxid, address, area  } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await AUTH__COMPANY_MODEL.update({
                    companyID, name, sign, taxid, address, area, userID 
                });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    getInfoAndGetListCompany: {
        auth: "required",
        params: {
            // Field bổ sung
            companyID       : { type: "string", optional: true },
            // Field mặc định
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            filter          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { 
                    companyID,
                    keyword, limit, lastestID, select, populates } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(companyID){
                    resultAfterCallHandler = await AUTH__COMPANY_MODEL.getInfo({
                        companyID, select, populates
                    });
                }else{
                    resultAfterCallHandler = await AUTH__COMPANY_MODEL.getList({
                        userID, keyword, limit, lastestID, select, populates
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
}   