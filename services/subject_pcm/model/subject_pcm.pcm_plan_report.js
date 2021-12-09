"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const ObjectID                          = require('mongoose').Types.ObjectId;

/**
 * import inter-coll, exter-coll
 */
const SUBJECT_PCM__PCM_PLAN_REPORT_COLL        = require('../database/subject_pcm.pcm_plan_report-coll');
const SUBJECT_PCM__USER_PCM_PLAN_REPORT_COLL   = require('../database/subject_pcm.user_pcm_plan_report-coll');

const { RANGE_BASE_PAGINATION } 	   = require('../../../tools/cursor_base/playground/index');

/**
 * import inter-model, exter-model
 */
const SUBJECT__USER_PCM_PLAN_REPORT_MODEL   = require('./subject_pcm.user_pcm_plan_report').MODEL;
const SUBJECT_PCM__PCM_PLAN_TASK_MODEL      = require('./subject_pcm.pcm_plan_task').MODEL;

class Model extends BaseModel {

    constructor() {
        super(SUBJECT_PCM__PCM_PLAN_REPORT_COLL);
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

                // if(!checkObjectIDs(projectID))
                //     return resolve({ error: true, message: 'Request params projectID invalid', status: 400 });
                
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                dataInsert = { company: companyID, project: projectID, userCreate: userID, userUpdate: userID };

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

                // TẠO USER_PCM_PLAN_REPORT
                await SUBJECT__USER_PCM_PLAN_REPORT_MODEL.insert({ userID, subjectID: infoAterInsert._id, role: 1, author: userID });

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
                dataUpdate = { userCreate: userID, userUpdate: userID, conditionPin };
                
                if(name){
                    dataUpdate.name = name;
                }

                if(type){
                    dataUpdate.type = type;
                }

                if(conditionPin){
                    dataUpdate.conditionPin = conditionPin;
                }
                
                let infoAterUpdate = await SUBJECT_PCM__PCM_PLAN_REPORT_COLL.findByIdAndUpdate(reportID, dataUpdate, { new: true }).select(select);

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
              
                let infoAterUpdate = await SUBJECT_PCM__PCM_PLAN_REPORT_COLL.findByIdAndUpdate(reportID, { state: 2 }, { new: true });

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
    getInfo({ reportID, select, filter = {}, populates= {}, populates1={}, populates2={}, populates3={} }) { 
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
                // populates1
                if(populates1 && typeof populates1 === 'string'){
					if(!IsJsonString(populates1))
						return resolve({ error: true, message: 'Request params populates1 invalid', status: 400 });

					populates1 = JSON.parse(populates1);
				}

                // populates2
                if(populates2 && typeof populates2 === 'string'){
					if(!IsJsonString(populates2))
						return resolve({ error: true, message: 'Request params populates2 invalid', status: 400 });

					populates2 = JSON.parse(populates2);
				}
                
                // populates3
                if(populates3 && typeof populates3 === 'string'){
					if(!IsJsonString(populates3))
						return resolve({ error: true, message: 'Request params populates3 invalid', status: 400 });

					populates3 = JSON.parse(populates3);
				}

                if(filter && typeof filter === 'string'){
					if(!IsJsonString(filter))
						return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

					filter = JSON.parse(filter);
				}
                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */

                let infoData = await SUBJECT_PCM__PCM_PLAN_REPORT_COLL.findById(reportID)
                .select(select)
                .populate({//1
                    path: populates?.value || "",
                    select: populates?.select || "",
                    populate: {//2
                        path: populates1?.value || "",
                        select: populates1?.select || "",
                        populate: {//3
                            path: populates2?.value || "",
                            select: populates2?.select || "",
                            populate: {//4
                                path: populates3?.value || "",
                                select: populates3?.select || "",
                            }
                        }
                    }
                })
                .lean();
                if(!infoData)
                    return resolve({ error: true, message: "Can't get info subject", status: 403 });
                let { type, conditionPin } = infoData;

                let listDataPin = [];
                if(type == 2 && conditionPin ){
                    listDataPin = await SUBJECT_PCM__PCM_PLAN_TASK_MODEL.getList({ ...conditionPin, filter, populates, populates1, populates2, populates3 });
                }

                return resolve({ error: false, data: { infoData, listDataPin }, status: 200 });
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
    getList({ keyword, limit = 10, lastestID, type, parentID, userID, filter = {}, populates= {}, populates1={}, populates2={}, populates3={} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { state: 1 };
                let conditionFind = {};
                let sortBy   = { createAt: -1 };
				let objSort  = {};

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

                if(filter && typeof filter === 'string'){
					if(!IsJsonString(filter))
						return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

					filter = JSON.parse(filter);
				}
				
                // populates
                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				}
                // populates1
                if(populates1 && typeof populates1 === 'string'){
					if(!IsJsonString(populates1))
						return resolve({ error: true, message: 'Request params populates1 invalid', status: 400 });

					populates1 = JSON.parse(populates1);
				}

                // populates2
                if(populates2 && typeof populates2 === 'string'){
					if(!IsJsonString(populates2))
						return resolve({ error: true, message: 'Request params populates2 invalid', status: 400 });

					populates2 = JSON.parse(populates2);
				}
                
                // populates3
                if(populates3 && typeof populates3 === 'string'){
					if(!IsJsonString(populates3))
						return resolve({ error: true, message: 'Request params populates3 invalid', status: 400 });

					populates3 = JSON.parse(populates3);
				}

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                // GET CONDITION PAGINATION
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await SUBJECT_PCM__PCM_PLAN_REPORT_COLL.findById(lastestID);
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

                let listUserPcmPlanReportAccess = await SUBJECT_PCM__USER_PCM_PLAN_REPORT_COLL.find({ user: userID });

                let listSubjectAccess = listUserPcmPlanReportAccess.map(item => item.subject);   
                // conditionObj._id = { $in: listSubjectAccess };

                let infoDataAfterGet = await SUBJECT_PCM__PCM_PLAN_REPORT_COLL.find({...conditionObj, ...conditionFind }, { ...filter, ...objSort })
                    .limit(+limit+1)
                    .sort(sortBy)
                    .populate({//1
                        path: populates?.value || "",
                        select: populates?.select || "",
                        populate: {//2
                            path: populates1?.value || "",
                            select: populates1?.select || "",
                            populate: {//3
                                path: populates2?.value || "",
                                select: populates2?.select || "",
                                populate: {//4
                                    path: populates3?.value || "",
                                    select: populates3?.select || "",
                                }
                            }
                        }
                    })
                    .lean();
                
                // GET TOTAL RECORD
				// let totalRecord = await SUBJECT_PCM__PCM_PLAN_REPORT_COLL.count(conditionObj);
                let totalCurrentPage = await SUBJECT_PCM__PCM_PLAN_REPORT_COLL.count(conditionFind);
                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let totalRecord = await SUBJECT_PCM__PCM_PLAN_REPORT_COLL.countDocuments(conditionObj);
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