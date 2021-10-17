"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid }                        
                                        = require('../../../tools/utils/utils');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * import inter-coll, exter-coll
 */
const INSPECTION__AREA_COLL                 = require('../database/inspection.area-coll');
const { RANGE_BASE_PAGINATION } 		     = require('../../../tools/cursor_base/playground/index');

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
     *  Thêm mẩu tin: Depv ✅
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
     * Cập nhât mẩu tin: Depv ✅
     * F0227
     */
    update({ areaID, name, sign, description, userID }) { 
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
                dataUpdate = { name, userCreate: userID, userUpdate: userID  };

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

                let infoDataAfterUpdate = await this.insertData(dataUpdate);
                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't update area", status: 403 });

                return resolve({ error: false, data: infoDataAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Xóa mẩu tin: Depv ✅
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
                    return resolve({ error: true, message: "Can't update inspect area", status: 403 });

                return resolve({ error: false, data: "Remove Success", status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Lấy thông tin khu vực: Depv ✅
     * F0229
     */
    getInfo({ areaID }) { 
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
         
                let infoData = await INSPECTION__AREA_COLL.findById(areaID);
                if(!infoData)
                    return resolve({ error: true, message: "Can't update inspect area", status: 403 });

                return resolve({ error: false, data: infoData, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Danh sách area theo project: DePV ✅
     * F0230
     */
    getListArea({ keyword, projectID, limit = 10, lastestIDArea  }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { project: projectID, state: 1 };
                let conditionFind = {};
                let sortBy = { createAt: -1 };
                let objSort = {};
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                // GET CONDITION PAGINATION
				if(lastestIDArea && checkObjectIDs(lastestIDArea)){
					let infoMessage = await INSPECTION__AREA_COLL.findById(lastestIDArea);
					if(!infoMessage)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

					let nextInfo = `${infoMessage.createAt}_${infoMessage._id}`;
                    // Lưu ý nêu sắp xếp tăng dần thì sửa lại ['createAt__1', '_id__1'];
					let keys	 = ['createAt__-1', '_id__-1'];
                    // console.log({ nextInfo });
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

                let infoDataAfterGet = await INSPECTION__AREA_COLL.find({...conditionObj, ...conditionFind }, objSort)
                    .limit(+limit)
                    .sort(sortBy) 
                    .lean();

                // GET TOTAL RECORD
				let totalRecord = await INSPECTION__AREA_COLL.count(conditionObj);
                let totalCurrentPage = await INSPECTION__AREA_COLL.count(conditionFind);

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get template docs", status: 403 });
                
                let totalPage = Math.ceil(totalRecord/limit);
                let currentPage = getCurrentPage({ totalRecord, totalCurrentPage, limit });
                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: +limit,
                    totalRecord,
                    totalPage,
                    currentPage
                }, status: 200 });

            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
 }

exports.MODEL = new Model;