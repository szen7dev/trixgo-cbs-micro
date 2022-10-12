"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * import inter-coll, exter-coll
 */
const INSPECTION__AREA_COLL                 = require('../database/inspection.area-coll');
const { RANGE_BASE_PAGINATION_V2 } 		     = require('../../../tools/cursor_base/playground/index');

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */

class Model extends BaseModel {

    constructor() {
        super(INSPECTION__AREA_COLL);
    }
    
    /**
     *  Thêm mẩu tin: Depv 
     *  F0226
     */
    insert({ parentID, projectID, name, sign, description, userID }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE STEP (1)
                 */
                let dataInsert = {};

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(!checkObjectIDs(projectID))
                    return resolve({ error: true, message: 'Request params projectID invalid', status: 400 });

                if (!name || name == '')
                    return resolve({ error: true, message: 'name_invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                dataInsert = { project: projectID, name, userCreate: userID, userUpdate: userID  };
                
                if(sign){
                    dataInsert.sign = sign;
                    let checkSign = await INSPECTION__AREA_COLL.findOne({ project: projectID, sign });
                    if(checkSign){
                        return resolve({ error: true, message: 'Sign existed', status: 400 });
                    }
                }

                if(parentID){
                    dataInsert.parent = parentID;
                }

                if(description){
                    dataInsert.description = description;
                }

                let infoDataAfterInserted = await this.insertData(dataInsert);
                if(!infoDataAfterInserted)
                    return resolve({ error: true, message: "Can't create inspect area", status: 403 });

                return resolve({ error: false, data: infoDataAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Cập nhât mẩu tin: Depv 
     * F0227
     */
    update({ areaID, name, sign, description, order, userID }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE STEP (1)
                 */
                let dataUpdate = {};

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(!checkObjectIDs(areaID))
                    return resolve({ error: true, message: 'Request params areaID invalid', status: 400 });

                if (!name || name == '')
                    return resolve({ error: true, message: 'name_invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                dataUpdate = { name,  userUpdate: userID, modifyAt: Date.now() };

                if(sign){
                    dataUpdate.sign = sign;
                    let { project } = await INSPECTION__AREA_COLL.findById(areaID).select("project");

                    let checkSign = await INSPECTION__AREA_COLL.findOne({ project, sign, _id: { $ne: areaID }});
                    if(checkSign){
                        return resolve({ error: true, message: 'Sign existed', status: 400 });
                    }
                }

                if(description){
                    dataUpdate.description = description;
                }

                if(!isNaN(order)){
                    dataUpdate.order = Number(order);
                }

                let infoDataAfterUpdate = await INSPECTION__AREA_COLL.findByIdAndUpdate(areaID, dataUpdate, { new: true });
                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't update area", status: 403 });

                return resolve({ error: false, data: infoDataAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Xóa mẩu tin: Depv 
     * F0228
     */
    remove({ areaID }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE STEP (1)
                 */

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(areaID))
                    return resolve({ error: true, message: 'Request params areaID invalid', status: 400 });
         
                let infoDataAfterRemove = await INSPECTION__AREA_COLL.findByIdAndUpdate(areaID, { state: 2 }, { new: true });
                if(!infoDataAfterRemove)
                    return resolve({ error: true, message: "Can't remove area", status: 403 });

                return resolve({ error: false, data: "Remove Success", status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Lấy thông tin khu vực: Depv 
     * F0229
     */
    getInfo({ areaID, select }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE STEP (1)
                 */

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(areaID))
                    return resolve({ error: true, message: 'Request params areaID invalid', status: 400 });
         
                let infoData = await INSPECTION__AREA_COLL.findById(areaID).select(select);
                if(!infoData)
                    return resolve({ error: true, message: "Can't get info area", status: 403 });

                return resolve({ error: false, data: infoData, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Danh sách area theo project: DePV 
     * Code: F0230
     * Author: Depv 
     */
    getList({ projectID, parentID, option, keyword, limit = 10, lastestID, select, populates }) { 
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(projectID))
                    return resolve({ error: true, message: 'Request params projectID invalid', status: 400 });

                let conditionObj = { project: projectID };
                let sortBy;
                let keys	     = ['createAt__-1', '_id__-1'];

                if(limit > 30){
                    limit = 30;
                } else{
                    limit = +limit;
                }

                if(parentID && checkObjectIDs(parentID)){
                    conditionObj.parent = parentID
                }else{
                    // Lấy toàn bộ con
                    if(option && option == 1){
                        conditionObj.parent = { $exists: true, $ne: null }
                    }

                    // Chỉ lấy cha
                    if(option && option == 2){
                        conditionObj.parent = { $exists: false }
                    }
                }

				/**
                 * ĐIỀU KIỆN KHÁC
                 */
                 if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				} else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    const regSearch = new RegExp(keyword, 'i');

                    conditionObj.$or = [
                        { name: regSearch },
                        { sign: regSearch },
                    ]
                }

				if(select && typeof select === 'string'){
					if(!IsJsonString(select))
						return resolve({ error: true, message: 'Request params select invalid', status: 400 });

					select = JSON.parse(select);
				}
 
                let conditionObjOrg = { ...conditionObj };
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoData = await INSPECTION__AREA_COLL.findById(lastestID);
                    if(!infoData)
                        return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj  = dataPagingAndSort.data.find;
                    sortBy        = dataPagingAndSort.data.sort;
                }else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy                = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await INSPECTION__AREA_COLL.find(conditionObj)
                    .limit(limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]?._id;
                        infoDataAfterGet.length = limit;
                    }
                }
                let totalRecord = await INSPECTION__AREA_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: limit,
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