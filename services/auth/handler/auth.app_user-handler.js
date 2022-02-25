/*******************************************************
 *    TÊN MODULE : APP USER                      *
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
const AUTH__APP_USER = require('../model/auth.app_users').MODEL;

module.exports = {
    
    getListAppOfUser: {
        auth: "required",
        params: {
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID }          = ctx.meta.infoUser;
                let { limit, lastestID, select, populates } = ctx.params;

                let resultAfterCallHandler = await AUTH__APP_USER.getListAppOfUser({ userID, limit: +limit, lastestID, select, populates  });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
    
    checkPermissionsAccessApp: {
        auth: "required",
        params: {
            appID           : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID }              = ctx.meta.infoUser;
                let { appID, select, populates } = ctx.params;

                let resultAfterCallHandler = await AUTH__APP_USER.checkPermissionsAccessApp({ appID, userID, select, populates });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}