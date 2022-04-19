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
    /**
     * Name: Tạo app menu
     * Dev: Depv
     */
    insert: {
        auth: "required",
        params: {
            name       : { type: "string" },
            slug       : { type: "string" },
            appID      : { type: "string" },
            parentID   : { type: "string", optional: true },
            order      : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID }          = ctx.meta.infoUser;
                let { name, slug, parentID, appID, order  } = ctx.params;
                let resultAfterCallHandler = await AUTH__APP_MENU.insert({ name, slug, parent: parentID, appID, authorID: userID, order  });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },


    /**
     * Name: Cập nhật app menu
     * Dev: Depv
     */
    update: {
        auth: "required",
        params: {
            appMenuID  : { type: "string" },
            name       : { type: "string", optional: true },
            slug       : { type: "string", optional: true },
            order      : { type: "number", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID }          = ctx.meta.infoUser;
                let { appMenuID, name, slug, order  } = ctx.params;
                let resultAfterCallHandler = await AUTH__APP_MENU.update({ appMenuID, name, slug, order, userID });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },


    /**
     * Name: Xoá app menu
     * Dev: Depv
     */
    remove: {
        auth: "required",
        params: {
            appMenuID  : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { _id: userID } = ctx.meta.infoUser;
                let { appMenuID }   = ctx.params;
                let resultAfterCallHandler = await AUTH__APP_MENU.remove({ appMenuID });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Lấy thông tin hoặc danh sách
     * Dev: Depv
     */
    getInfoAndGetList: {
        auth: "required",
        params: {
            appMenuID       : { type: "string", optional: true },
            appID           : { type: "string", optional: true },
            parentID        : { type: "string", optional: true },
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { appMenuID, appID, parentID, select, populates, limit, lastestID } = ctx.params;
                let resultAfterCallHandler;
                if(appMenuID){
                    resultAfterCallHandler = await AUTH__APP_MENU.getInfo({ appMenuID, select, populates });
                }else{
                    resultAfterCallHandler = await AUTH__APP_MENU.getList({ app: appID, parent: parentID, limit, lastestID, select, populates });
                }
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
     * Name: Danh sách các công ty mà user được quyền truy cập vào 1 màn hình cụ thể
     * Author: Hiepnh
     * Date: 18/4/2022
     */
    getListCompany: {
        auth: "required",
        params: {
            menuID          : { type: "string", optional: true },
            appID           : { type: "string", optional: true },
            type            : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { menuID, appID, type } = ctx.params;

                console.log({menuID, appID, type})

                let { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler = await AUTH__APP_MENU.getListCompany({ type, user: userID, app: appID, menu: menuID });
                
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });

            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}