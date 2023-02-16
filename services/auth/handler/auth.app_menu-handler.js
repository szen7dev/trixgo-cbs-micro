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
const AUTH__APP_ROLE_MENU = require('../model/auth.app_role_menu').MODEL;
 
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
                const { menuID, appID, type } = ctx.params;
                const { _id: userID } = ctx.meta.infoUser;

                const resultAfterCallHandler = await AUTH__APP_MENU.getListCompany({ type, user: userID, app: appID, menu: menuID });

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ error_message: error.message, ctx });
            }
        }
    },

    /**
     * Name: Danh sách các màn hình của user khi truy cập vào ứng dụng
     * Dev: HiepNH
     * Date: 15/2/2023
     */
    getMobileFnbMenu: {
        auth: "required",
        params: {

        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);

                let appID = "61e04971fdebf77b072d1b0f"; // FNB_APP
                let arrUser = ["63ed0debc0d91500123495d3","63ed0e083f7a130012d41058","63ed0e1d3f7a130012d41059","63ed0e303f7a130012d4105a","63ed0e860e2f4d00119e52fa"]
                    // MenuID cho Khách hàng
                    // MenuID cho Nhân viên
                    // MenuID cho Quản lý
                    // MenuID cho Ban lãnh đạo
                    // MenuID cho Nhà đầu tư
                // {
                //     "_id": {
                //         "menu": "63af82764faba60012595520"
                //     },
                //     "read": 1,
                //     "create": 1,
                //     "update": 1,
                //     "delete": 0
                // },

                const { _id: userID, company } = ctx.meta.infoUser;
                let accessApp = {level: 0, read: 0, create: 0, update: 0, delete: 0}

                let resultAfterCallHandler = await AUTH__APP_ROLE_MENU.getPermissionToAccessListMenuOfApp({ user: userID, app: appID, company, type: 1 })
                // console.log(resultAfterCallHandler)
                if(!resultAfterCallHandler.error){
                    let arrMenu = resultAfterCallHandler.data.map(item=>item._id.menu.toString())

                    if(arrMenu.includes(arrUser[0].toString())){
                        accessApp.level = 1
                        for(const item of resultAfterCallHandler.data){
                            if(item._id.menu.toString() === arrUser[0].toString()){
                                accessApp.read = Number(item.read)
                                accessApp.create = Number(item.create)
                                accessApp.update = Number(item.update)
                                accessApp.delete = Number(item.delete)
                            }
                        }
                    }else{
                        if(arrMenu.includes(arrUser[1].toString())){
                            accessApp.level = 2
                            for(const item of resultAfterCallHandler.data){
                                if(item._id.menu.toString() === arrUser[1].toString()){
                                    accessApp.read = Number(item.read)
                                    accessApp.create = Number(item.create)
                                    accessApp.update = Number(item.update)
                                    accessApp.delete = Number(item.delete)
                                }
                            }
                        }else{
                            if(arrMenu.includes(arrUser[2].toString())){
                                accessApp.level = 3
                                for(const item of resultAfterCallHandler.data){
                                    if(item._id.menu.toString() === arrUser[2].toString()){
                                        accessApp.read = Number(item.read)
                                        accessApp.create = Number(item.create)
                                        accessApp.update = Number(item.update)
                                        accessApp.delete = Number(item.delete)
                                    }
                                }
                            }else{
                                if(arrMenu.includes(arrUser[3].toString())){
                                    accessApp.level = 4
                                    for(const item of resultAfterCallHandler.data){
                                        if(item._id.menu.toString() === arrUser[3].toString()){
                                            accessApp.read = Number(item.read)
                                            accessApp.create = Number(item.create)
                                            accessApp.update = Number(item.update)
                                            accessApp.delete = Number(item.delete)
                                        }
                                    }
                                }
                            }
                        }
                    }                    
                }
                return ({ error: false, accessApp})
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },
}