"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * import inter-coll, exter-coll
 */
const TRAINING__SUBJECT_COLL           = require('../database/training.subject-coll');
const TRAINING__SUBJECT_RATING_COLL    = require('../database/training.subject_rating-coll');

const { RANGE_BASE_PAGINATION } 	   = require('../../../tools/cursor_base/playground/index');

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */

class Model extends BaseModel {

    constructor() {
        super(TRAINING__SUBJECT_COLL);
    }

    /**
     * Name: insert subject ✅
     * Author: Depv 
     * Code: F02501
     */
    insert({ type, name, description, content, parent, userID }) { 
        return new Promise(async (resolve) => {
            try {   

                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = { };
                
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                dataInsert = { userCreate: userID, userUpdate: userID };

                if(type){
                    dataInsert.type = type;
                }
                if(name){
                    dataInsert.name = name;
                }

                if(description){
                    dataInsert.description = description;
                }

                if(content){
                    dataInsert.content = content;
                }

                if(parent){
                    dataInsert.parent = parent;
                }

                let infoAterInsert = await this.insertData(dataInsert);

                if(!infoAterInsert)
                    return resolve({ error: true, message: "Can't insert subject", status: 403 });

                return resolve({ error: false, data: infoAterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
     /**
     * Name: update subject ✅
     * Author: Depv 
     * Code: F02502
     */
    update({ subjectID, name, logo, description, content, userID }) { 
        return new Promise(async (resolve) => {
            try {   

                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { };
                
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(!checkObjectIDs(subjectID))
                    return resolve({ error: true, message: 'Request params subjectID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                dataUpdate = { userCreate: userID, userUpdate: userID };
                
                if(name){
                    dataUpdate.name = name;
                }
                // Chờ hỏi Minh xem cách update ntn
                // if(logo){
                //     dataUpdate.logo = logo;
                // }

                if(description){
                    dataUpdate.description = description;
                }

                if(checkObjectIDs(logo)){
                    dataUpdate.logo = logo;
                }

                if(content){
                    dataUpdate.content = content;
                }
                
                let infoAterUpdate = await TRAINING__SUBJECT_COLL.findByIdAndUpdate(subjectID, dataUpdate, { new: true });

                if(!infoAterUpdate)
                    return resolve({ error: true, message: "Can't insert subject", status: 403 });

                return resolve({ error: false, data: infoAterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }


     /**
     * Name: Remove subject ✅
     * Author: Depv 
     * Code: F02503
     */
    remove({ subjectID }) { 
        return new Promise(async (resolve) => {
            try {   

                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { };
                
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                if(!checkObjectIDs(subjectID))
                    return resolve({ error: true, message: 'Request params subjectID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
              
                let infoAterUpdate = await TRAINING__SUBJECT_COLL.findByIdAndUpdate(subjectID, { state: 2 }, { new: true });

                if(!infoAterUpdate)
                    return resolve({ error: true, message: "Can't remove subject", status: 403 });

                return resolve({ error: false, message: "Remove success", status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Get info subject ✅
     * Author: Depv 
     * Code: F02504
     */
    getInfo({ subjectID, userID, select }) { 
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
                if(!checkObjectIDs(subjectID))
                    return resolve({ error: true, message: 'Request params subjectID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */

                let infoData = await TRAINING__SUBJECT_COLL.findById(subjectID).select(select).lean();
                if(!infoData)
                    return resolve({ error: true, message: "Can't get info subject", status: 403 });
                
                //Update amountViews cho subject
                await TRAINING__SUBJECT_COLL.findByIdAndUpdate(subjectID, {
                    $inc: { amountViews: 1 }
                })

                if(infoData.parent){
                    //Update amountViews cho subject
                    await TRAINING__SUBJECT_COLL.findByIdAndUpdate(infoData.parent, {
                        $inc: { amountViews: 1 }
                    })
                }

                let checkUserRating = await TRAINING__SUBJECT_RATING_COLL.findOne({ lession: subjectID, userCreate: userID }).select("score");
                infoData.useRated = checkUserRating
                console.log({ infoData });
                console.log({ checkUserRating });

                return resolve({ error: false, data: infoData, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    /** 
     * Name: Danh sách subject ✅
     * Author: Depv 
     * Code: F02505
     */
    getList({ keyword, limit = 10, lastestID, type, parentID, filter = {}, select = {} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {state:1};

                if(checkObjectIDs(parentID)){
                    conditionObj.parent = parentID;
                }
                
                if(type){
                    conditionObj.type = type;
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
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await TRAINING__SUBJECT_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

					let nextInfo = `${infoData.createAt}_${infoData._id}`;
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
                
                let infoDataAfterGet = await TRAINING__SUBJECT_COLL.find({...conditionObj, ...conditionFind }, { ...filter, ...objSort })
                    .populate({
                        path: "parent",
                        select: select.parent
                    }).populate({
                        path: "logo",
                        select: "url name size"
                    })
                    .limit(+limit+1)
                    .sort(sortBy) 
                    .lean(); 

                // GET TOTAL RECORD
				// let totalRecord = await TRAINING__SUBJECT_COLL.count(conditionObj);
                let totalCurrentPage = await TRAINING__SUBJECT_COLL.count(conditionFind);
                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get template docs", status: 403 });
                

                let totalRecord = await TRAINING__SUBJECT_COLL.countDocuments(conditionObj);
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