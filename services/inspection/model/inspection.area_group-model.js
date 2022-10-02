"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const { RANGE_BASE_PAGINATION_V2 } 					= require('../../../tools/cursor_base/playground/index');

/**
 * import inter-coll, exter-coll
 */
const INSPECTION__AREA_GROUP_COLL           = require('../database/inspection.area_group-coll');
const INSPECTION__AREA_COLL                 = require('../database/inspection.area-coll');
const INSPECTION__DOC_COLL                  = require('../database/inspection.doc-coll');

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */

class Model extends BaseModel {

    constructor() {
        super(INSPECTION__AREA_GROUP_COLL);
    }
    
    /**
     *  Thêm mẩu tin: Depv 
     *  F0226
     */
    insert({ projectID, areaID, groupID, userID }) { 
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
                if(!checkObjectIDs(projectID) || !checkObjectIDs(areaID) || !checkObjectIDs(groupID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params projectID|areaID|groupID|userID invalid', status: 400 })

                // Kiểm tra mẩu tin tồn tại hay chưa
                let info = await INSPECTION__AREA_GROUP_COLL.findOne({ project: projectID, area: areaID, group: groupID })
                if(info)
                    return resolve({ error: true, message: "data_exists", keyError: "data_exist", status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                dataInsert = { project: projectID, area: areaID, group: groupID, userCreate: userID };
                
                let infoDataAfterInserted = await this.insertData(dataInsert);
                if(!infoDataAfterInserted)
                    return resolve({ error: true, message: "Can't create", status: 403 });

                /**
                 * CẬP NHẬT TRẠNG THÁI VÀ % HOÀN THÀNH CHO KHU VỰC CHA
                 * % hoàn thành
                 * Trạng thái
                 */
                let infoArea = await INSPECTION__AREA_COLL.findById(areaID)
                if(infoArea.parent && checkObjectIDs(infoArea.parent)){
                    console.log('=====================CẬP NHẬT KHU VỰC CHA=================')
                }

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
    update({ areaGroupID, percentage, status, note, userID }) { 
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
                if(!checkObjectIDs(areaGroupID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params areaGroupID|userID invalid', status: 400 })

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                dataUpdate = { userUpdate: userID, modifyAt: Date.now() };

                if(!isNaN(status)){
                    dataUpdate.status = Number(status)
                }

                if(!isNaN(percentage)){
                    dataUpdate.percentage = Number(percentage)
                }

                if (note || note != ""){
                    dataUpdate.note = note
                }

                let infoDataAfterUpdate = await INSPECTION__AREA_GROUP_COLL.findByIdAndUpdate(areaGroupID, dataUpdate, { new: true });
                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't update", status: 403 });

                /**
                 * CẬP NHẬT TRẠNG THÁI VÀ % HOÀN THÀNH CHO KHU VỰC CHA
                 * % hoàn thành
                 * Trạng thái
                 */
                let infoArea = await INSPECTION__AREA_COLL.findById(areaID)
                if(infoArea.parent && checkObjectIDs(infoArea.parent)){
                    console.log('=====================CẬP NHẬT KHU VỰC CHA=================')
                }                    

                return resolve({ error: false, data: infoDataAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Cập nhật trạng thái
     * Author: HiepNH
     * Code: 2/10/2022
     */
    updateStatus({ areaID, groupID, userID }) { 
        return new Promise(async (resolve) => {
            try {
                let numberOfTask = await INSPECTION__DOC_COLL.count({area: areaID, group: groupID})
                let numberOfFinishedTask = await INSPECTION__DOC_COLL.count({area: areaID, group: groupID, status: 4 })
                console.log({numberOfTask,numberOfFinishedTask})

                let percentage = 0
                if(numberOfTask != 0){
                    percentage = Number(numberOfFinishedTask/numberOfTask)
                }

                let info = await INSPECTION__AREA_GROUP_COLL.findOne({area: areaID, group: groupID})
                let areaGroupID = info._id
                let dataUpdate = {percentage: Number(percentage*100).toFixed(2), userUpdate: userID, modifyAt: Date.now()};

                if(percentage == 100){
                    dataUpdate.status = 4 // Hoàn thành
                }else{
                    dataUpdate.status = 2 // Đang triển khai
                }
               
                let infoDataAfterUpdate = await INSPECTION__AREA_GROUP_COLL.findByIdAndUpdate(areaGroupID, dataUpdate, { new: true });
                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't update", status: 403 });
                console.log(infoDataAfterUpdate)

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
    remove({ areaGroupID }) { 
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
                if(!checkObjectIDs(areaGroupID))
                    return resolve({ error: true, message: 'Request params areaGroupID invalid', status: 400 });
         
                let infoDataAfterRemove = await INSPECTION__AREA_GROUP_COLL.findByIdAndUpdate(areaGroupID, { state: 2 }, { new: true });
                if(!infoDataAfterRemove)
                    return resolve({ error: true, message: "Can't remove group", status: 403 });

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
    getInfo({ areaGroupID, select }) { 
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
                if(!checkObjectIDs(areaGroupID))
                    return resolve({ error: true, message: 'Request params areaGroupID invalid', status: 400 });
         
                let infoData = await INSPECTION__AREA_GROUP_COLL.findById(areaGroupID).select(select);
                if(!infoData)
                    return resolve({ error: true, message: "Can't get info group", status: 403 });

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
    getList({ projectID, areaID, groupID, option, keyword, limit = 10, lastestID, select, populates }) { 
        console.log({ projectID, areaID, groupID, option, keyword, limit, lastestID, select, populates })
        return new Promise(async (resolve) => {
            try {
                if(!option)
                    return resolve({ error: true, message: 'Request params option invalid', status: 400 })

                let conditionObj = {};
                let sortBy;
                let keys	     = ['createAt__-1', '_id__-1'];

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(limit > 30){
                    limit = 30;
                } else{
                    limit = +limit;
                }

                if(option && option==1){
                    if(!checkObjectIDs(projectID) || !checkObjectIDs(groupID))
                        return resolve({ error: true, message: 'Request params projectID|groupID invalid', status: 400 })

                    conditionObj = { project: projectID, group: groupID };
                }

                if(option && option==2){
                    if(!checkObjectIDs(projectID) || !checkObjectIDs(areaID))
                        return resolve({ error: true, message: 'Request params projectID|areaID invalid', status: 400 })

                    conditionObj = { project: projectID, area: areaID };
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
                    let infoData = await DOCUMENT__DOC_COLL.findById(lastestID);
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

                let infoDataAfterGet = await INSPECTION__AREA_GROUP_COLL.find(conditionObj)
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
                let totalRecord = await INSPECTION__AREA_GROUP_COLL.count(conditionObjOrg);
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