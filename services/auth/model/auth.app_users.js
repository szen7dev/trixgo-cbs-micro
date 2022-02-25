"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString, objectID }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const moment                            = require("moment");
const ObjectID                          = require('mongoose').Types.ObjectId;

/**
 * import inter-coll, exter-coll
 */
const AUTH__APP_USER_COLL              = require('../database/permission/auth.app_user-coll');
const { RANGE_BASE_PAGINATION_V2 } 	        = require('../../../tools/cursor_base/playground/index');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {               

    constructor() {
        super(AUTH__APP_USER_COLL);
    }

    /**
     * Name  : Danh sách app mà user được quyền truy cập
     * Author: Depv
     * Code  : 
     */
    getListAppOfUser({ userID,
        limit = 10, lastestID, select, populates = {} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let today = new Date();
                let conditionObj = {
                    endTime: { $gte: today }
                };

                let sortBy;
                let keys	     = ['createAt__-1', '_id__-1'];
                
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(limit > 20){
                    limit = 20
                }

                if(userID){
                    conditionObj.user = userID;
                }

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
					let infoData = await AUTH__APP_USER_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj = dataPagingAndSort.data.find;
					sortBy = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy = dataPagingAndSort.data.sort;
                }
                
                let infoDataAfterGet = await AUTH__APP_USER_COLL.find(conditionObj)
                    .select(select)
                    .limit(+limit+1)
                    .populate(populates)
                    .sort(sortBy)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Lấy danh sách thất bại", keyError: "cannot_get_list", status: 403 });
                    
                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await AUTH__APP_USER_COLL.count(conditionObjOrg);
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
     * Name  : Kiểm tra user có quyền truy cập App hay không
     * Author: Depv
     * Code  : 
     */
    checkPermissionsAccessApp({ appID, userID,
        select, populates = {} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let today = new Date();
                let conditionObj = {
                    app: appID, user: userID,
                    endTime: { $gte: today }
                };
                
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

                let checkPermission = await AUTH__APP_USER_COLL.findOne(conditionObj)
                    .select(select)
                    .populate(populates)

                if(!checkPermission)
                    return resolve({ error: true, message: "permission_denied", status: 403 });                    

                return resolve({ error: false, data: checkPermission, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;