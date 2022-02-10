"use strict";

const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }          = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION_V2 }              = require('../../../tools/cursor_base/playground/index');
const { CF_DOMAIN_SERVICES } 		            = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_NOTIFICATION } 		        = require('../../notification/helper/notification.actions-constant');
const { CF_ACTIONS_SUBJECT_PCM } 		        = require('../../subject_pcm/helper/subject_pcm.actions-constant');
const { CF_ACTIONS_ANALYSIS } 		            = require('../../analysis/helper/analysis.actions-constant');
const { PCM_COMMENT_TYPE }                      = require('../helper/subject_pcm.keys-constant');

/**
 * import inter-coll, exter-coll
 */
const SUBJECT_PCM__PCM_PLAN_TASK_COLL           = require('../database/subject_pcm.pcm_plan_task-coll');
const SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL   = require('../database/subject_pcm.pcm_plan_task_comment-coll');

class Model extends BaseModel {

    constructor() {
        super(SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL);
    }

    /**
     * Name  : Thêm comment ✅
     * Author: Depv
     */
    insert({ taskID, commentCoreID, type, content, bizfullname, parentID, authorID, ctx }) { 
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

                if(!checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params authorID invalid', status: 400 }); 

                if(!type || !PCM_COMMENT_TYPE.includes(type))
                    return resolve({ error: true, message: 'Request params type invalid', status: 400 }); 

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                dataInsert = { type, comment: commentCoreID, task: taskID, userCreate: authorID };

                if(checkObjectIDs(parentID)){
                    dataInsert.parent = parentID;
                }

                let infoDataAfterInserted = await this.insertData(dataInsert); 
                if(!infoDataAfterInserted)
                    return resolve({ error: true, message: "Can't create comment task", status: 403 });

                let infoTask = await ctx.call(`${CF_DOMAIN_SERVICES.SUBJECT_PCM}.${CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_GET_INFO_AND_GET_LIST}`, {
                    taskID
                });

                if(infoTask.error)
                    return resolve({ error: true, message: "task_not_exist", status: 403 });

                let { author, assignee, related } = infoTask.data;
                let receivers = [...new Set([author, assignee, ...related])];
                let contentLog = '';
                let title = '';

                content = content.length > 200 ? content.substring(0, 200) : content;

                switch (type) {
                    case 1:
                        title = `${bizfullname} đã thêm 1 bình luận mới`;
                        contentLog = `${bizfullname} Vừa thêm bình luận mới - ${content}`;
                        break;
                    case 2:
                        title = `${bizfullname} đã thêm 1 phản hồi liên quan`;
                        contentLog = `${bizfullname} Vừa thêm phản hồi mới - ${content}`;
                        break;
                    case 3:
                        title = `${bizfullname} đã thêm 1 hiện trạng`;
                        contentLog = `${bizfullname} Vừa thêm hiện trạng mới - ${content}`;
                        break;
                    case 4:
                        title = `${bizfullname} đã thêm 1 giải pháp`;
                        contentLog = `${bizfullname} Vừa thêm giải pháp mới - ${content}`;
                        break;
                    default:
                        break;
                }

                // receivers = receivers.filter(receiverID => receiverID.toString() !== authorID.toString());
                // Gửi thông báo cho user
                await ctx.call(`${CF_DOMAIN_SERVICES.NOTIFICATION}.${CF_ACTIONS_NOTIFICATION.INSERT_NOTIFICATION}`, {
                    title,
                    content,
                    receivers,
                    path: `/pcm/detail/${taskID}#${infoDataAfterInserted._id}`,
                    type: 1 // InApp (Socket)
                })

                // Ghi log cho khi comment
                await ctx.call(`${CF_DOMAIN_SERVICES.ANALYSIS}.${CF_ACTIONS_ANALYSIS.HISTORY_LOG_INSERT}`, {
                    type: 2,
                    parentCollection: {
                        kind: "pcm_plan_task",
                        item: taskID
                    },
                    subCollection: {
                        kind: "pcm_plan_task_comment",
                        item: infoDataAfterInserted._id
                    },
                    content: contentLog,
                })

                // Cập nhật số lượng phản hồi liên quan
                await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, {
                    $inc: {
                        amountResponse: 1
                    }
                });

                infoDataAfterInserted = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL
                    .findById(infoDataAfterInserted._id)
                    .select('comment isMarked type task userCreate createAt')
                    .populate({
                        path: "comment userCreate",
                        select: "_id bizfullname fullname image files images content",
                        populate: {
                            path: 'images files',
                            select: '_id name nameOrg path description createAt userCreate',
                            populate: {
                                path: 'userCreate',
                                select: '_id bizfullname'
                            }
                        }
                    })
                    .lean();

                return resolve({ error: false, data: {
                    result: infoDataAfterInserted,
                    receivers
                }, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Cập nhật đánh dấu response ✅
     * Author: Depv
     */
    updateMarkResponse({ taskID, commentID, isMarked }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs([taskID, commentID])) {
                    return resolve({ 
                        error: true, 
                        message: 'Tham số commentID hoặc taskID không hợp lệ', 
                        keyError: 'params_commentID_or_taskID_invalid', 
                        status: 400
                    });
                }

                const infoResponse = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL.findById(commentID).lean();
                if(!infoResponse) {
                    return resolve({ 
                        error: true, 
                        message: 'Không thể lấy thông tin response', 
                        keyError: 'cannot_get_info_response', 
                        status: 403
                    });
                }

                let dataUpdate = { isMarked };
                let valueCalculate = -1;

                if(isMarked) {
                    valueCalculate = 1;
                }

                console.log({ commentID, isMarked, valueCalculate, dataUpdate })
                await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, {
                    $inc: {
                        amountResponseMarked: valueCalculate
                    }
                });

                const infoAfterUpdated = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL.findByIdAndUpdate(commentID, dataUpdate, { new: true });

                return resolve({ error: false, data: infoAfterUpdated, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Xóa comment ✅
     * Author: Depv
     */
    remove({ commentID, authorID }) { 
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

                if(!checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params authorID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                let infoDataAfterUpdate = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL.findOneAndDelete({
                    _id: commentID,
                    userCreate: authorID
                });

                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't remove comment", status: 422 });

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
    getInfo({ commentID, select, populates }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(commentID))
                    return resolve({ error: true, message: 'param_invalid', status: 400 });

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

                let infoComment = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL
                    .findById(commentID)
                    .select(select)
                    .populate(populates)
                    .lean();

				if (!infoComment)
                    return resolve({ error: true, message: 'cannot_get', status: 403 });
   
                return resolve({ error: false, data: infoComment, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name   : Danh sách comment ✅
     * Author : Depv
     */
    getList({ taskID, parentID, limit = 10, lastestID, isMarked, sortKey, select, populates }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {};
                let keys = ['createAt__-1', '_id__-1'];
                let sortBy = {};

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                if(limit > 20 || isNaN(limit)){
					limit = 20;
                } else {
                    limit = +limit;
                }

                if(sortKey && typeof sortKey === 'string'){
					if(!IsJsonString(sortKey))
						return resolve({ error: true, message: 'Request params sortKey invalid', status: 400 });

					sortKey = JSON.parse(sortKey);
                    keys = sortKey.keys;
				}

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

                if(isMarked === 'true') {
                    conditionObj.isMarked = true;
                }

                let conditionObjOrg = { ...conditionObj };
                if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj  = dataPagingAndSort.data.find;
					sortBy        = dataPagingAndSort.data.sort;
				} else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy        = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL.find(conditionObj)
                    .limit(limit + 1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 422 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL.countDocuments(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord / limit);

                if(!sortKey) {
                    infoDataAfterGet = infoDataAfterGet.reverse();
                }

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                }, status: 200 });
            } catch (error) {
                console.error(error)
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name   : Danh sách comment tìm kiếm theo id ✅
     * Author : MinhVH
     */
	searchCommentById({ taskID, authorID, commentID, select, populates = {} }){
		return new Promise(async resolve => {
			try {
				// Check params
				if(!checkObjectIDs([taskID, commentID, authorID])) {
                    return resolve({
                        error: true,
                        message: 'Tham số task ID hoặc comment ID không hợp lệ',
                        keyError: 'params_taskID_or_commentID_invalid',
                        status: 400
                    })
                }

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

				let infoTask = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findById(taskID).lean();

				if(!infoTask) {
                    return resolve({
                        error: true,
                        message: 'Công việc không tồn tại',
                        keyError: 'cannot_get_info_task',
                        status: 403
                    })
                }

				let conditionObjFrontList 		= { _id: { $lt: commentID }, task: taskID };
				let conditionObjBackList 		= { _id: { $gt: commentID }, task: taskID };
				let conditionObjSearchMessage 	= { _id: commentID, task: taskID };

				let infoComment = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL
					.findOne(conditionObjSearchMessage)
                    .select(select)
                    .populate(populates)
					.lean();

				if(!infoComment) {
                    return resolve({
                        error: true,
                        message: 'Phản hồi không tồn tại',
                        keyError: 'cannot_get_info_comment',
                        status: 403
                    })
                }

				let listCommentsFront = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL.find(conditionObjFrontList)
                    .limit(5)
                    .sort({ createAt: -1, _id: -1 })
                    .select(select)
                    .populate(populates)
					.lean();

				let listCommentsBack = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL.find(conditionObjBackList)
                    .limit(5)
                    .sort({ createAt: 1, _id: 1 })
                    .select(select)
                    .populate(populates)
					.lean();

				let listComments = [...listCommentsFront.reverse(), infoComment, ...listCommentsBack];

                const totalRecordFront = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL.countDocuments(conditionObjFrontList);
                const totalRecordBack = await SUBJECT_PCM__PCM_PLAN_TASK_COMMENT_COLL.countDocuments(conditionObjBackList);

				return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listComments,
                        totalRecordFront,
                        totalRecordBack
					}
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 });
			}
		})
	}
}

exports.MODEL = new Model;