/*******************************************************
 *    TÊN MODULE : APP COMPANY                         *
 *    NGƯỜI VIÊT : PHAN VĂN ĐỆ                         *
 *    LIỆN HỆ    : lucdeit1997@gmail.com - 0393553224  *
 *    THỜI GIAN  : 27/01/2022                          *
********************************************************/
/**
 * TOOLS
 */
const { renderStatusCodeAndResponse } = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const AUTH__APP_COMPANY = require('../model/auth.app_company').MODEL;

module.exports = {
    update: {
        auth: "required",
        params: {
            appCompanyID    : { type: "string" },
            maxCount        : { type: "number", optional: true },
            maxData         : { type: "number", optional: true },
            startTime       : { type: "string", optional: true },
            endTime         : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID }          = ctx.meta.infoUser;
                let { appCompanyID, maxCount, maxData, startTime, endTime } = ctx.params;
                
                let resultAfterCallHandler = await AUTH__APP_COMPANY.update({ appCompanyID, maxCount, maxData, startTime, endTime, userID  });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}