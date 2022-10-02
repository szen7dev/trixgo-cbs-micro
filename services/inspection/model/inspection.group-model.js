"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * import inter-coll, exter-coll
 */
const INSPECTION__GROUP_COLL                 = require('../database/inspection.group-coll');
const { RANGE_BASE_PAGINATION } 		     = require('../../../tools/cursor_base/playground/index');

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */

class Model extends BaseModel {

    constructor() {
        super(INSPECTION__GROUP_COLL);
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
                    let checkSign = await INSPECTION__GROUP_COLL.findOne({ project: projectID, sign });
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
    update({ groupID, name, sign, description, userID }) { 
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

                if(!checkObjectIDs(groupID))
                    return resolve({ error: true, message: 'Request params groupID invalid', status: 400 });

                if (!name || name == '')
                    return resolve({ error: true, message: 'name_invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                dataUpdate = { name, userUpdate: userID, modifyAt: Date.now()  };

                if(sign){
                    dataUpdate.sign = sign;
                    let { project } = await INSPECTION__GROUP_COLL.findById(groupID).select("project");

                    let checkSign = await INSPECTION__GROUP_COLL.findOne({ project, sign, _id: { $ne: groupID }});
                    if(checkSign){
                        return resolve({ error: true, message: 'Sign existed', status: 400 });
                    }
                }

                if(description){
                    dataUpdate.description = description;
                }

                let infoDataAfterUpdate = await INSPECTION__GROUP_COLL.findByIdAndUpdate(groupID, dataUpdate, { new: true });
                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't update group", status: 403 });

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
    remove({ groupID }) { 
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
                if(!checkObjectIDs(groupID))
                    return resolve({ error: true, message: 'Request params groupID invalid', status: 400 });
         
                let infoDataAfterRemove = await INSPECTION__GROUP_COLL.findByIdAndUpdate(groupID, { state: 2 }, { new: true });
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
    getInfo({ groupID, select }) { 
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
                if(!checkObjectIDs(groupID))
                    return resolve({ error: true, message: 'Request params groupID invalid', status: 400 });
         
                let infoData = await INSPECTION__GROUP_COLL.findById(groupID).select(select);
                if(!infoData)
                    return resolve({ error: true, message: "Can't update inspect area", status: 403 });

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
    getList({ keyword, projectID, parentID, limit = 10, lastestID, filter = {}, select = {} }) { 
        return new Promise(async (resolve) => {
            try {

                if(!checkObjectIDs(projectID))
                    return resolve({ error: true, message: 'Request params projectID invalid', status: 400 });

                let conditionObj = { project: projectID};

                if(parentID && checkObjectIDs(parentID)){
                    conditionObj.parent = parentID
                }

                let conditionFind = {};
                let sortBy = { createAt: -1 };
				let objSort 	 	= {};

                if(filter && typeof filter === 'string'){
					if(!IsJsonString(filter))
						return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

					filter = JSON.parse(filter);
				}

				if(select && typeof select === 'string'){
					if(!IsJsonString(select))
						return resolve({ error: true, message: 'Request params select invalid', status: 400 });

					select = JSON.parse(select);
				}

                // GET CONDITION PAGINATION
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await INSPECTION__GROUP_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

					let nextInfo = `${infoData.createAt}_${infoData._id}`;
                    // Lưu ý nêu sắp xếp tăng dần thì sửa lại ['createAt__1', '_id__1'];
					let keys	 = ['createAt__-1', '_id__-1'];
					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });
					conditionFind = dataPagingAndSort.data.find;
					sortBy = dataPagingAndSort.data.sort;
				}

                // SEARCH TEXT
				if(keyword){
					conditionObj.$text = { $search: keyword };
					objSort.score = { $meta: "textScore" };
					sortBy.score  = { $meta: "textScore" };
				}

                let infoDataAfterGet = await INSPECTION__GROUP_COLL.find({...conditionObj, ...conditionFind }, { ...filter, ...objSort })
                    .limit(+limit+1)
                    .sort(sortBy) 
                    .lean(); 

                // GET TOTAL RECORD
				// let totalRecord = await INSPECTION__GROUP_COLL.count(conditionObj);
                let totalCurrentPage = await INSPECTION__GROUP_COLL.count(conditionFind);
                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get template docs", status: 403 });
                
                let totalRecord = await INSPECTION__GROUP_COLL.countDocuments(conditionObj);
				let nextCursor	= null;
                let totalPage = Math.ceil(totalRecord/limit);

				if(infoDataAfterGet && infoDataAfterGet.length){
					if(infoDataAfterGet.length > limit){
						nextCursor = infoDataAfterGet[limit - 1]._id;
						infoDataAfterGet.length = limit;
					}
				}

                let currentPage = getCurrentPage({ totalRecord, totalCurrentPage, limit }) + 1;
                if(!lastestID){
                    currentPage =  1
                }

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: +limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                    currentPage
                }, status: 200 });
                
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
 }

exports.MODEL = new Model;