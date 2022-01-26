/*******************************************************
 *    TÊN MODULE : MENU ỨNG DỤNG                       *
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
const AUTH__APP_MENU = require('../model/auth.app_menu').MODEL;
 
module.exports = {
    getInfoAndGetList: {
        auth: "required",
        params: {
            appMenuID       : { type: "string", optional: true },
            appID           : { type: "string", optional: true },

            keyword         : { type: "string", optional: true },
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { appMenuID, appID, keyword, select, populates, limit, lastestID } = ctx.params;
                let resultAfterCallHandler;
                if(appMenuID){
                    resultAfterCallHandler = await AUTH__APP_MENU.getInfo({ appMenuID, select, populates });
                }else{
                    resultAfterCallHandler = await AUTH__APP_MENU.getList({ app: appID, keyword, limit, lastestID, select, populates });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}