"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString, objectID }                        
                                        = require('../../../tools/utils/utils');
const { KEY_ERROR }                     = require('../../../tools/keys/index');

/**s
 * import inter-coll, exter-coll
 */
const AUTH__APP_COMPANY_COLL                = require('../database/permission/auth.app_company-coll');
const AUTH__APP_USER_COLL                   = require('../database/permission/auth.app_user-coll');
const { RANGE_BASE_PAGINATION_V2 } 	        = require('../../../tools/cursor_base/playground/index');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {              

    constructor() {
        super(AUTH__APP_COMPANY_COLL);
    }
    
    /**
     * Name  : Thêm mẩu tin
     * - A Hiệp: lưu ý 1 company và 1 app chỉ tồn tại 1 mẩu tin duy nhất
     * - Khi cập nhật thông tin của app_company => cũng phải cập nhật app_user theo trường endTime
     * Author: Depv
     * Code  : 
     */ 
    insert({ app, company, maxCount, maxData, startTime, endTime, userID }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = { app, company, maxCount, maxData, startTime, endTime, userCreate: userID, userUpdate: userID };
                
                let checkExist = await AUTH__APP_COMPANY_COLL.findOne({ app, company });
                console.log({ checkExist });
                if(checkExist)
                    return resolve({ error: true, message: "App của công ty đã tồn tại", keyError: "app_company_exist", status: 200 });

                let infoAterInsert = await this.insertData(dataInsert);
                if(!infoAterInsert)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 });

                // Cập nhật endTime cho app user
                await AUTH__APP_USER_COLL.updateMany({ app, company }, { $set: { endTime }});
                
                return resolve({ error: false, data: infoAterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    /** 
     * Name  : update app company ✅
     * Author: Depv
     * Code  : 
     */
    update({ appCompanyID, maxCount, maxData, startTime, endTime, userID }) { 
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(appCompanyID))
                    return resolve({ error: true, message: "Mã appCompanyID không hợp lệ", keyError: "appCompanyID_invalid", status: 403 });
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID };

                if(maxCount){
                    dataUpdate.maxCount = maxCount;
                }

                if(maxData){
                    dataUpdate.maxData = maxData;
                }

                if(startTime){
                    dataUpdate.startTime = startTime;
                }

                if(endTime){
                    dataUpdate.endTime = endTime;
                }
                
                let infoAterUpdate = await AUTH__APP_COMPANY_COLL.findByIdAndUpdate(appCompanyID, dataUpdate);
                if(!infoAterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 });

                if(endTime){
                    if(infoAterUpdate.endTime.getTime() != (new Date(endTime)).getTime()){
                        let app     = infoAterUpdate.app;
                        let company = infoAterUpdate.company;
                        //Cập nhật endTime cho App_User
                        await AUTH__APP_USER_COLL.updateMany({ app, company }, { $set: { endTime }});
                    }
                }

                return resolve({ error: false, data: infoAterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Remove app company ✅ 
     * Author: Depv
     * Code  : 
     */
    remove({ appCompanyID }) { 
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(appCompanyID))
                    return resolve({ error: true, message: "Mã appCompanyID không hợp lệ", keyError: "appCompanyID_invalid", status: 200 });
                
                let infoAterRemove = await AUTH__APP_COMPANY_COLL.findByIdAndDelete(appCompanyID);
                if(!infoAterRemove)
                    return resolve({ error: true, message: "Xoá thất bại", keyError: KEY_ERROR.DELETE_FAILED, status: 200 });
                let { app, company } = infoAterRemove;
                // Xoá app user
                await AUTH__APP_USER_COLL.deleteMany({ app, company });

                return resolve({ error: false, message: "Xoá thành công", status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: get info app company ✅
     * Author: Depv
     * Code: 
     */
    getInfo({ appCompanyID, select, populates }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(appCompanyID))
                    return resolve({ error: true, message: 'Request params appCompanyID invalid', status: 200 });
                
                 // populates
                 if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 200 });

					populates = JSON.parse(populates);
				}else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                let infoAterGet = await AUTH__APP_COMPANY_COLL.findById(appCompanyID)
                                    .select(select)
                                    .populate(populates)
                if(!infoAterGet)
                    return resolve({ error: true, message: "can't_get_info", keyError: KEY_ERROR.GET_INFO_FAILED, status: 200 });
 
                return resolve({ error: false, data: infoAterGet, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    /**
     * Name  : Danh sách app company ✅
     * Author: Depv
     * Code  : 
     */
    getList({
        companyID,
        keyword, limit = 10, lastestID, select, populates= {} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */

                let sortBy;
                let conditionObj = { };
                let keys	 = ['createAt__-1', '_id__-1'];

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

                if(companyID){
                    conditionObj.company = companyID;
                }
               
                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }
                
                let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await AUTH__APP_COMPANY_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy       = dataPagingAndSort.data.sort;
                }
                
                let infoDataAfterGet = await AUTH__APP_COMPANY_COLL.find(conditionObj)
                    .select(select)
                    .limit(+limit+1)
                    .sort(sortBy)
                    .populate(populates)
                    .lean(); 

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await AUTH__APP_COMPANY_COLL.countDocuments(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

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

}

exports.MODEL = new Model;