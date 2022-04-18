"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString, objectID }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const moment                            = require("moment");

const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const ObjectID                          = require('mongoose').Types.ObjectId;
const { KEY_ERROR }                     = require('../../../tools/keys/index');

/**s
 * import inter-coll, exter-coll
 */
const AUTH__APP_ROLE_COLL                   = require('../database/permission/auth.app_role-coll');
const AUTH__APP_MENU_COLL                   = require('../database/permission/auth.app_menu-coll');
const AUTH__APP_ROLE_MENU_COLL              = require('../database/permission/auth.app_role_menu-coll');

const { RANGE_BASE_PAGINATION_V2 } 	        = require('../../../tools/cursor_base/playground/index');
const { template }                          = require('lodash');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {               
    
    constructor() {
        super(AUTH__APP_MENU_COLL);
    }

    insert({ name, slug, parent, appID, authorID, order }) {
        return new Promise(async (resolve) => {
            try {
                if(!name)
                    return resolve({ error: true, keyError: "name_invalid", message: "Tên App Menu không hợp lệ" });

                if(!slug)
                    return resolve({ error: true, keyError: "slug_invalid", message: "Slug Menu không hợp lệ" });
                
                if(!appID)
                    return resolve({ error: true, keyError: "appID_invalid", message: "AppID không hợp lệ" });

                let dataInsert = { name, slug, app: appID, userCreate: authorID, userUpdate: authorID };

                if(order){
                    dataInsert.order = order
                }

                if(parent && ObjectID.isValid(parent)){
                    dataInsert.parent = parent;
                    let infoMenuParent = await AUTH__APP_MENU_COLL.findById(parent);
                    dataInsert.level = infoMenuParent.level + 1;
                }
                let infoAfterInsert = await this.insertData(dataInsert);
                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    update({ appMenuID, name, slug, order, userID }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(appMenuID))
                    return resolve({ error: true, message: "Mã app menu không hợp lệ",keyError: 'appMenuID_invalid', status: 400 });

                let dataUpdate = { userUpdate: userID };
                if(name){
                    dataUpdate.name = name
                }

                if(slug){
                    dataUpdate.slug = slug
                }

                if(order){
                    dataUpdate.order = order
                }
                let infoAfterUpdate = await AUTH__APP_MENU_COLL.findByIdAndUpdate(appMenuID,dataUpdate, { new: true });
                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    remove({ appMenuID }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(appMenuID))
                    return resolve({ error: true, message: "Mã app menu không hợp lệ", keyError: 'appMenuID_invalid', status: 400 });

                let infoAfterRemove = await AUTH__APP_MENU_COLL.findByIdAndDelete(appMenuID);
                if(!infoAfterRemove)
                    return resolve({ error: true, message: "Xoá thất bại", keyError: KEY_ERROR.DELETE_FAILED, status: 400 });

                return resolve({ error: false, data: infoAfterRemove });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: get app menu ✅
     * Author: Depv
     * Code: 
     */
    getInfo({ appMenuID, select, populates }) { 
        return new Promise(async (resolve) => {
            try {
                // LẤY NHỮNG TRƯỜNG CẦN THIẾT
                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				}else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(appMenuID))
                    return resolve({ error: true, message: "Mã nhóm chức năng không hợp lệ",keyError: 'appMenuID_invalid', status: 400 });
                    
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                let infoAterGet = await AUTH__APP_MENU_COLL.findById(appMenuID)
                    .select(select)
                    .populate(populates)
                    .lean();

                if(!infoAterGet)
                    return resolve({ error: true, message: KEY_ERROR.GET_INFO_FAILED, status: 403 });
 
                return resolve({ error: false, data: infoAterGet, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    /**
     * Name  : Danh sách app menu ✅
     * Author: Depv
     * Code  : 
     */
    getList({ app,
        parent, limit = 10, lastestID, select, populates = {} }) { 
        return new Promise(async (resolve) => {
            try {
                if(limit > 20){
                    limit = 20
                }else{
                    limit = +limit
                }
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {};
                let sortBy;
                let keys	 = ['order__1', '_id__1'];
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(parent){
                    // Danh sách menu của một Menu cha
                    conditionObj.app = app;
                    conditionObj.parent = parent;
                }else{
                    // Danh sách menu của ứng dụng
                    conditionObj.app = app
                }
                
                // LẤY NHỮNG TRƯỜNG CẦN THIẾT
                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				}else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }
                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                let conditionObjOrg = { ...conditionObj };

                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await AUTH__APP_MENU_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy                = dataPagingAndSort.data.sort;
                }
                
                let infoDataAfterGet = await AUTH__APP_MENU_COLL.find(conditionObj)
                    .select(select)
                    .limit(+limit+1)
                    .populate(populates)
                    .sort(sortBy)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Lấy danh sách thất bại", keyError: KEY_ERROR.GET_LIST_FAILED, status: 403 });
                    
                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await AUTH__APP_MENU_COLL.countDocuments(conditionObjOrg);
                let totalPage = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: +limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                }, status: 200 });
                
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Danh sách các công ty mà user được quyền truy cập vào 1 màn hình cụ thể
     * Author: Hiepnh
     * Date: 18/4/2022
     */
    getListCompany({ type=1, user, app, menu }) {
        return new Promise(async resolve => {
            try {
                let listRoles = await AUTH__APP_ROLE_COLL.find({
                    type: type,
                    app: app,
                    members:  { $in: [user] }
                })
                .select('_id name')

                // console.log(listRoles.map(item=>item._id))
                
                let listData = await AUTH__APP_ROLE_MENU_COLL.aggregate([
                    {
                        $match: {
                            "read": {$gt: 0},
                            "menu" : ObjectID(menu),
                            "app" : ObjectID(app),
                            "role": { $in: listRoles.map(item=>item._id) }
                        }
                    },
                    {
                        $group: {
                            _id: { company: "$company" },
                        }
                    },
                ]);
                // console.log(listData)

                if (!listData) 
                    return resolve({ error: true, message: 'cannot_get_list_data', keyError: KEY_ERROR.GET_LIST_FAILED });

                let conditionPopulate = {
                    path: '_id.company',
                    select: '_id name sign image',
                    model: 'company'
                }
                await AUTH__APP_ROLE_MENU_COLL.populate(listData, conditionPopulate)

                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }
}

exports.MODEL = new Model;