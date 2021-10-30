"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid }                        
                                        = require('../../../tools/utils/utils');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const moment                            =  require("moment");

/**
 * import inter-coll, exter-coll
 */
const INSPECTION__DOC_COLL                 = require('../database/inspection.doc-coll');
const ITEM__CONTRACT_COLL                  = require('../../item/database/item.contract-coll');
const INSPECTION__TEMPLATE_CHECKLIST_COLL  = require('../database/inspection.template_checklist-coll');

const { RANGE_BASE_PAGINATION } 		   = require('../../../tools/cursor_base/playground/index');
const INSPECTION__CHECKLIST_MODEL          = require('../model/inspection.checklist-model').MODEL;

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */

class Model extends BaseModel {
    
    constructor() {
        super(INSPECTION__DOC_COLL);
    }
    
    /**
     * Name: Thêm inspection docs
     * Author: DePV ✅
     * Code: F0231
     */
    insert({ projectID, contractID, sign, template, assignee, members, name, expiredTime, job, areas, description, userID }) { 
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

                if(!checkObjectIDs(template))
                    return resolve({ error: true, message: 'Request params template invalid', status: 400 });
                
                if(!checkObjectIDs(assignee))
                    return resolve({ error: true, message: 'Request params assignee invalid', status: 400 });
                
                if(!checkObjectIDs(areas))
                    return resolve({ error: true, message: 'Request params areas invalid', status: 400 });
                  
                if(!checkObjectIDs(job))
                    return resolve({ error: true, message: 'Request params job invalid', status: 400 });

                if(!checkObjectIDs(contractID))
                    return resolve({ error: true, message: 'Request params contractID invalid', status: 400 });

                if(!checkObjectIDs(projectID))
                    return resolve({ error: true, message: 'Request params projectID invalid', status: 400 });

                if(!sign)
                    return resolve({ error: true, message: 'Request params sign invalid', status: 400 });
                
                if (!expiredTime)
                    return resolve({ error: true, message: 'expiredTime_invalid', status: 400 });

                let checkSign = await INSPECTION__DOC_COLL.findOne({ sign, contract: contractID, state: 1 });
                if(checkSign)
                    return resolve({ error: true, message: 'Sign existed', status: 400 });
                /** 
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                dataInsert = { project: projectID, contract: contractID, template, sign, assignee, members, name, areas, expiredTime, job, userCreate: userID, userUpdate: userID };
                if(description){
                    dataInsert.description = description;
                }

                let infoDataAfterInserted = await this.insertData(dataInsert);
                if(!infoDataAfterInserted)
                    return resolve({ error: true, message: "Can't create inspection doc", status: 403 });
            
                // Tiến hành thêm checklist từ tempalte checklist
                let listTemplateChecklist = await INSPECTION__TEMPLATE_CHECKLIST_COLL.find({ inspection: template });
                if(listTemplateChecklist.length){
                    for (const templateChecklist of listTemplateChecklist) {
                        let { name } = templateChecklist;
                        let infoChecklistAfterInsert = await INSPECTION__CHECKLIST_MODEL.insert({
                            inspection: infoDataAfterInserted._id, template, name, authorID: userID
                        })
                    }
                }
                
                return resolve({ error: false, data: infoDataAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    /**
     * Name: Cập nhật inspection docs
     * Author: DePV ✅
     * Code: F0232
     */
    update({ docID, sign, template, assignee, members, name, expiredTime, job, areas, description, userID }) { 
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

                if(!checkObjectIDs(template))
                    return resolve({ error: true, message: 'Request params template invalid', status: 400 });
                
                if(!checkObjectIDs(assignee))
                    return resolve({ error: true, message: 'Request params assignee invalid', status: 400 });
                
                if(!checkObjectIDs(areas))
                    return resolve({ error: true, message: 'Request params areas invalid', status: 400 });
                  
                if(!checkObjectIDs(job))
                    return resolve({ error: true, message: 'Request params job invalid', status: 400 });

                if(!sign)
                    return resolve({ error: true, message: 'Request params sign invalid', status: 400 });
                
                if (!expiredTime)
                    return resolve({ error: true, message: 'Request params expiredTime invalid', status: 400 });

                /** 
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                dataUpdate = { template, sign, assignee, members, name, areas, expiredTime, job, userUpdate: userID };
                 
                if(description){
                    dataUpdate.description = description;
                }

                let infoDataAfterUpdate = await INSPECTION__DOC_COLL.findByIdAndUpdate(docID, dataUpdate , { new: true });
                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't update docs", status: 403 });

                return resolve({ error: false, data: infoDataAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    /**
     * Name: Xóa inspection docs
     * Author: DePV ✅
     * Code: F0233
     */
    remove({ docID }) { 
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
                if(!checkObjectIDs(docID))
                    return resolve({ error: true, message: 'Request params docID invalid', status: 400 });
         
                let infoDataAfterRemove = await INSPECTION__DOC_COLL.findByIdAndUpdate(docID, { state: 2 }, { new: true });
                if(!infoDataAfterRemove)
                    return resolve({ error: true, message: "Can't remove inspection docs", status: 403 });

                return resolve({ error: false, data: "Remove success", status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

     /**
     * Name: Lấy thông tin inspection docs
     * Author: DePV ✅
     * Code: F0234
     */
    getInfo({ docID, select }) { 
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
                if(!checkObjectIDs(docID))
                    return resolve({ error: true, message: 'Request params docID invalid', status: 400 });
                    
                let infoDocs = await INSPECTION__DOC_COLL.findById(docID)
                                .select(select)
                                .populate({
                                    path: "areas",
                                    select: "name"
                                })
                                .populate({
                                    path: "project",
                                    select: "name area",
                                    // populate: "area"
                                })
                                .populate({
                                    path: "members",
                                    select: "image fullname"
                                })
                                .populate({
                                    path: "contract",
                                    select: "name"
                                })
                                .populate({
                                    path: "template",
                                    select: "name"
                                })
                                .populate({
                                    path: "assignee",
                                    select: "image fullname"
                                });
                if(!infoDocs)
                    return resolve({ error: true, message: "Can't get info inspection docs", status: 403 });

                return resolve({ error: false, data: infoDocs, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    /**
     * Name: Danh sách area theo project
     * Author: DePV ✅
     * Code: F0235
     */
    getList({ contractID, limit = 10, lastestID, select, assignee, author, userID, signature, area, fromDate, toDate, fromCreateAt, toCreateAt }) { 
        return new Promise(async (resolve) => {
            try {
                /** 
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { state: 1 };
                if(checkObjectIDs(contractID)){
                    conditionObj.contract = contractID;
                }
                if(checkObjectIDs(assignee)){
                    conditionObj.assignee = assignee;
                }

                if(checkObjectIDs(author)){
                    conditionObj.userCreate = author;
                }

                if(checkObjectIDs(signature)){
                    conditionObj.signatures = { $in: [signature] };
                }

                if(checkObjectIDs(area)){
                    conditionObj.areas = { $in: [area] };
                }

                if(fromDate && toDate){
					conditionObj.expiredTime = {
                        $gte: moment(fromDate).toDate(),
                        $lte: moment(toDate).toDate() 
                    }
                }

                if(fromCreateAt && toCreateAt){
					conditionObj.createdAt = {
                        $gte: moment(fromCreateAt),
                        $lte: moment(toCreateAt).endOf('day')._d 
                    }
                }
                // Danh sách phải được lấy theo điều kiền members, assignee, userCreateAt
                conditionObj["$or"] = [ 
                    {  members: { $in: [userID] }  }, 
                    { assignee }, 
                    { userCreateAt: userID }  
                ];

                console.log({conditionObj});

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
				if(lastestID && checkObjectIDs(lastestID)){
					let infoMessage = await INSPECTION__DOC_COLL.findById(lastestID);
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
                let infoDataAfterGet = await INSPECTION__DOC_COLL.find({...conditionObj, ...conditionFind })
                    .select(select)
                    .populate({
                        path: "areas",
                        select: "name"
                    })
                    .populate({
                        path: "project",
                        select: "name area",
                        // populate: "area"
                    })
                    .populate({
                        path: "members",
                        select: "image fullname"
                    })
                    .populate({
                        path: "contract",
                        select: "name"
                    })
                    .populate({
                        path: "template",
                        select: "name"
                    })
                    .populate({
                        path: "assignee",
                        select: "image fullname"
                    })
                    .limit(+limit)
                    .sort(sortBy) 
                    .lean();

                // GET TOTAL RECORD
				let totalRecord = await INSPECTION__DOC_COLL.count(conditionObj);
                let totalCurrentPage = await INSPECTION__DOC_COLL.count(conditionFind);

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get docs", status: 403 });
                
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