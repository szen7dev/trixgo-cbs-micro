"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid }                        
                                        = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION } 		= require('../../../tools/cursor_base/playground/index');
const { getCurrentPage }			= require('../../../tools/utils/calculate_current_page');

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_NOTIFICATION } 		= require('../../notification/helper/notification.actions-constant');
const { CF_ACTIONS_SUBJECT_PCM } 		= require('../../subject_pcm/helper/subject_pcm.actions-constant');
const { CF_ACTIONS_ANALYSIS } 		    = require('../../analysis/helper/analysis.actions-constant');

/**
 * import inter-coll, exter-coll
 */
const SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL       = require('../database/subject_pcm.pcm_plan_task_comment-coll');
const SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_FILE_COLL  = require('../database/subject_pcm.pcm_plan_task_comment_file-coll');

/**
 * import inter-model, exter-model
 */
const SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_FILE_MODEL = require('../model/subject_pcm.pcm_plan_task_comment_file-model').MODEL;

/**
 * import util files
 */

class Model extends BaseModel {

    constructor() {
        super(SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL);
    }
    
    /**
     * Name  : Thêm comment ✅
     * Author: Depv
     */
    insert({ taskID, commentCoreID, content, fullname, parentID, ctx }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = {};
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(taskID))
                    return resolve({ error: true, message: 'Request params taskID invalid', status: 400 });

                if(!checkObjectIDs(commentCoreID))
                    return resolve({ error: true, message: 'Request params commentCoreID invalid', status: 400 }); 

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                dataInsert = { comment: commentCoreID, task: taskID };

                if(checkObjectIDs(parentID)){
                    dataInsert.parent = parentID;
                }

                let infoDataAfterInserted = await this.insertData(dataInsert); 
                if(!infoDataAfterInserted)
                    return resolve({ error: true, message: "Can't create comment task", status: 403 });
                try {
                    let infoTask = await ctx.call(`${CF_DOMAIN_SERVICES.SUBJECT_PCM}.${CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_GET_INFO_AND_GET_LIST}`, {
                        taskID
                    })
                    if(infoTask.error)
                        return resolve({ error: true, message: "task_not_exist"});

                    let receivers = [ infoTask.data.author, infoTask.data.author,  ...infoTask.data.related];
                    receivers = [...new Set(receivers)];

                    // Gửi thông báo cho user
                    let infoNotification = await ctx.call(`${CF_DOMAIN_SERVICES.NOTIFICATION}.${CF_ACTIONS_NOTIFICATION.INSERT_NOTIFICATION}`, {
                        title: `${fullname} Vừa thêm bình luận mới`,
                        content,
                        receivers,
                        path: `/pcm/home?taskID=${taskID}`,
                        type: 1
                    })

                    let infoHistoryLog = await ctx.call(`${CF_DOMAIN_SERVICES.ANALYSIS}.${CF_ACTIONS_ANALYSIS.HISTORY_LOG_INSERT}`, {
                        // project: "5e4785eb8b50843d34481d49",
                        // contract: "5e3f93fa1969583819518362",
                        type: 2,
                        parentCollection: {
                            kind: "pcm_plan_task",
                            item: taskID
                        },
                        subCollection: {
                            kind: "pcm_plan_task_comment",
                            item: infoDataAfterInserted._id
                        },
                        content: `${fullname} Vừa thêm bình luận mới - ${content}`,
                    })
                    console.log({ infoHistoryLog });
                } catch (error) {
                    console.log({error});
                }

                return resolve({ error: false, data: infoDataAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Xóa comment ✅
     * Author: Depv
     */
    remove({ commentID }) { 
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
                if(!checkObjectIDs(commentID))
                    return resolve({ error: true, message: 'Request params commentID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                let infoDataAfterUpdate = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL.findByIdAndDelete(commentID);
                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't remove comment", status: 403 });

                return resolve({ error: false, data: infoDataAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Thông tin comment ✅
     * Author: Depv
     */
    getInfo({ commentID, 
        select, populates, populates1, populates2, populates3 }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(commentID))
                    return resolve({ error: true, message: 'param_invalid' });

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

                let infoComment = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL.findById(commentID)
                                .select(select)
                                .populate({
                                    path: populates?.value || "",
                                    select: populates?.select || "",
                                    populate: {
                                        path: populates1?.value ||"",
                                        select: populates1?.select || "",
                                        populate: {
                                            path: populates2?.value || "",
                                            select: populates2?.select || "",
                                            populate: {
                                                path: populates3?.value || "",
                                                select: populates3?.select || "",
                                            }
                                        }
                                    }
                                })

				if (!infoComment) return resolve({ error: true, message: 'cannot_get' });
                                
                return resolve({ error: false, data: infoComment });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name   : Danh sách comment ✅
     * Author : Depv
     * problem: Bị hạn chế không thể sort createAt = 1
     */
    getList({ taskID, parentID,
        keyword, limit = 10, lastestID, populates2={}, populates3={}, filter = {}, populates= {}, populates1={} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { 
                };

                let conditionFind = { };
                let sortBy   = { createAt: -1 };
				let objSort  = {};
              
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                
                // LẤY NHỮNG TRƯỜNG CẦN THIẾT
                if(filter && typeof filter === 'string'){
					if(!IsJsonString(filter))
						return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

					filter = JSON.parse(filter);
				}
				
                // POPULATE
                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				}
                // POPULATE 1
                if(populates1 && typeof populates1 === 'string'){
					if(!IsJsonString(populates1))
						return resolve({ error: true, message: 'Request params populates1 invalid', status: 400 });

					populates1 = JSON.parse(populates1);
				}
                // POPULATE 2
                if(populates2 && typeof populates2 === 'string'){
					if(!IsJsonString(populates2))
						return resolve({ error: true, message: 'Request params populates2 invalid', status: 400 });

					populates2 = JSON.parse(populates2);
				}
                
                // POPULATE 3
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
                if(checkObjectIDs(taskID)){
                    conditionObj.task = taskID;
                }

                if(checkObjectIDs(parentID)){
                    conditionObj.parent = parentID;
                }

                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL.findById(lastestID);
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
                
				if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.content = new RegExp(keyword, 'i');
                }
                
                let infoDataAfterGet = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL.find({...conditionObj, ...conditionFind }, { ...filter, ...objSort })
                    .limit(+limit+1)
                    .sort(sortBy)
                    .populate({
                        path: populates?.value || "",
                        select: populates?.select || "",
                        populate: {
                            path: populates1?.value || "",
                            select: populates1?.select || "",
                            populate: {
                                path: populates2?.value || "",
                                select: populates2?.select || "",
                                populate: {
                                    path: populates3?.value || "",
                                    select: populates3?.select || "",
                                }
                            }
                        }
                    })
                    .lean(); 

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }
                
                // GET TOTAL RECORD
                let totalCurrentPage = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL.count(conditionFind);
                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let totalRecord = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL.countDocuments(conditionObj);
                let totalPage = Math.ceil(totalRecord/limit);

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