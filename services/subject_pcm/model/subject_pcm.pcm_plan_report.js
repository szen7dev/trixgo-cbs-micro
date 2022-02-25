"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const ObjectID                          = require('mongoose').Types.ObjectId;

/**
 * import inter-coll, exter-coll
 */
const PCM_PLAN_REPORT_COLL        = require('../database/subject_pcm.pcm_plan_report-coll');
const USER_PCM_PLAN_REPORT_COLL   = require('../database/subject_pcm.user_pcm_plan_report-coll');

const { RANGE_BASE_PAGINATION_V2 } 	   = require('../../../tools/cursor_base/playground/index');

/**
 * import inter-model, exter-model
 */
const PCM_PLAN_REPORT_MODEL   = require('./subject_pcm.user_pcm_plan_report').MODEL;

class Model extends BaseModel {

    constructor() {
        super(PCM_PLAN_REPORT_COLL);
    }

    /**
     * Name: insert pcm_plan_report ✅
     * Author: Depv
     * Code: 
     */
    insert({ companyID, projectID, type, name, parentID, userID }) { 
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

                if(!checkObjectIDs(companyID))
                    return resolve({ error: true, message: 'Request params companyID invalid', status: 400 });
                
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                dataInsert = { company: companyID, project: projectID, author: userID, userUpdate: userID };

                if(type){
                    dataInsert.type = type;
                }

                if(name){
                    dataInsert.name = name; 
                }

                if(ObjectID.isValid(parentID)){
                    dataInsert.parent = parentID;
                }

                if(ObjectID.isValid(projectID)){
                    dataInsert.project = projectID;
                }

                let infoAterInsert = await this.insertData(dataInsert);

                if(!infoAterInsert)
                    return resolve({ error: true, message: "Can't insert pcm_plan_report", status: 403 });

                return resolve({ error: false, data: infoAterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

     /**
     * Name: update pcm_plan_report ✅
     * Author: Depv
     * Code: 
     */
    update({ reportID, name, type, userID, select, conditionPin }) { 
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

                if(!ObjectID.isValid(reportID))
                    return resolve({ error: true, message: 'Request params reportID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                dataUpdate = { userUpdate: userID };
                
                if(name){
                    dataUpdate.name = name;
                }

                if(type){
                    dataUpdate.type = type;
                }

                if(conditionPin){

                    dataUpdate.conditionPin = conditionPin;
                }
                
                let infoAterUpdate = await PCM_PLAN_REPORT_COLL.findByIdAndUpdate(reportID, dataUpdate, { new: true }).select(select);

                if(!infoAterUpdate)
                    return resolve({ error: true, message: "Can't update pcm plan report", status: 403 });

                return resolve({ error: false, data: infoAterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }


     /**
     * Name: Remove pcm_plan_report ✅
     * Author: Depv 
     * Code: F02503
     */
    remove({ reportID }) { 
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

                if(!checkObjectIDs(reportID))
                    return resolve({ error: true, message: 'Request params reportID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
              
                let infoAterUpdate = await PCM_PLAN_REPORT_COLL.findByIdAndUpdate(reportID, { state: 2 }, { new: true });

                if(!infoAterUpdate)
                    return resolve({ error: true, message: "Can't remove subject", status: 403 });

                return resolve({ error: false, message: "Remove success", status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Get info pcm_plan_report ✅
     * Author: Depv 
     * Code: F02504
     */
    getInfo({ reportID, select, populates= {} }) { 
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
                if(!checkObjectIDs(reportID))
                    return resolve({ error: true, message: 'Request params reportID invalid', status: 400 });

                // populates
                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				}
              
                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */

                let infoData = await PCM_PLAN_REPORT_COLL.findById(reportID)
                                .select(select)
                                .populate(populates)
                                .lean();
                if(!infoData)
                    return resolve({ error: true, message: "Can't get info subject", status: 403 });

                return resolve({ error: false, data: infoData, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    /** 
     * Name: Danh sách pcm_plan_report ✅
     * Author: Depv 
     * Code:
     */
    getList({ keyword, limit = 10, lastestID, type, parentID, userID, select, populates= {} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { author: userID };
                let sortBy;
                let keys	 = ['createAt__-1', '_id__-1'];

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(checkObjectIDs(parentID)){
                    conditionObj.parent = parentID;
                }else{
                    conditionObj.parent = null;
                }
                
                if(type){
                    conditionObj.type = type;
                }
				
                // populates
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

                // SEARCH TEXT
                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }

                let conditionObjOrg = { ...conditionObj };
               
                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                // GET CONDITION PAGINATION
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await PCM_PLAN_REPORT_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
                    sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy       = dataPagingAndSort.data.sort;
                }
                
                let infoDataAfterGet = await PCM_PLAN_REPORT_COLL.find(conditionObj)
                    .limit(+limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();
                
                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let totalRecord = await PCM_PLAN_REPORT_COLL.countDocuments(conditionObjOrg);
				let nextCursor	= null;
                let totalPage = Math.ceil(totalRecord/limit);
                    
				if(infoDataAfterGet && infoDataAfterGet.length){
					if(infoDataAfterGet.length > limit){
						nextCursor = infoDataAfterGet[limit - 1]._id;
						infoDataAfterGet.length = limit;
					}
				}

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