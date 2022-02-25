"use strict";

/**
 * import internal
 */
const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }          = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION_V2 }              = require('../../../tools/cursor_base/playground/index');
const { CF_DOMAIN_SERVICES } 		            = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_NOTIFICATION } 		        = require('../../notification/helper/notification.actions-constant');
const { CF_ACTIONS_SUBJECT_PCM } 		        = require('../helper/subject_pcm.actions-constant');
const { PCM_COMMENT_TYPE }                      = require('../helper/subject_pcm.keys-constant');
const { APP_KEYS }								= require('../../../tools/keys');

/**
 * import inter-coll, exter-coll
 */
const PCM_PLAN_TASK_COLL            = require('../database/subject_pcm.pcm_plan_task-coll');
const PCM_COMMENT_COLL              = require('../database/subject_pcm.pcm_comment-coll');

class Model extends BaseModel {

    constructor() {
        super(PCM_COMMENT_COLL);
    }

    /**
	 * Dev: MinhVH 
	 * Func: Thêm comment
	 * Date: 22/02/2022
	 */
    insert({ taskID, parentID, authorID, type, content, bizfullname, files, images, select, populates, ctx }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = { type, task: taskID, author: authorID };

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs([taskID])) {
                    return resolve({
                        error: true,
                        message: "Tham số taskID không hợp lệ",
                        keyError: "params_taskID_invalid",
                        status: 400
                    })
                }

                if(!checkObjectIDs([authorID])) {
                    return resolve({
                        error: true,
                        message: "Tham số authorID không hợp lệ",
                        keyError: "params_authorID_invalid",
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

                if(!type || !PCM_COMMENT_TYPE.includes(type)) {
                    return resolve({
                        error: true,
                        message: "Tham số type không hợp lệ",
                        keyError: "params_type_invalid",
                        status: 400
                    })
                }

                if(parentID) {
                    if(checkObjectIDs([parentID])) {
                        return resolve({
                            error: true,
                            message: "Tham số parentID không hợp lệ",
                            keyError: "params_parentID_invalid",
                            status: 400
                        })
                    }

                    dataInsert.parent = parentID;
                }

                let infoTask = await ctx.call(`${CF_DOMAIN_SERVICES.SUBJECT_PCM}.${CF_ACTIONS_SUBJECT_PCM.PCM_PLAN_TASK_GET_INFO_AND_GET_LIST}`, {
                    taskID
                });

                if(infoTask.error) return resolve(infoTask);

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                content && (dataInsert.content = content);
                files   && (dataInsert.files = files);
                images  && (dataInsert.images = images);

                let infoDataAfterInserted = await this.insertData(dataInsert); 
                if(!infoDataAfterInserted) {
                    return resolve({
                        error: true,
                        message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
                        keyError: "error_occurred",
                        status: 422
                    })
                }

                if(parentID) {
                    await PCM_COMMENT_COLL.findByIdAndUpdate(parentID, {
                        $set: {
                            lastestReplyID: infoDataAfterInserted._id
                        }
                    });
                }

                // Cập nhật số lượng phản hồi liên quan
                await PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, {
                    $inc: {
                        amountResponse: 1
                    }
                });

                let { author, assignee, related } = infoTask.data;
                let receivers = [...new Set([author, assignee, ...related])];
                // let contentLog = '';

                // content = content.length > 200 ? content.substring(0, 200) : content;

                // switch (type) {
                //     case 1:
                //         contentLog = `${bizfullname} Vừa thêm bình luận mới - ${content}`;
                //         break;
                //     case 2:
                //         contentLog = `${bizfullname} Vừa thêm phản hồi mới - ${content}`;
                //         break;
                //     case 3:
                //         contentLog = `${bizfullname} Vừa thêm hiện trạng mới - ${content}`;
                //         break;
                //     case 4:
                //         contentLog = `${bizfullname} Vừa thêm giải pháp mới - ${content}`;
                //         break;
                //     default:
                //         break;
                // }

                // receivers = receivers.filter(receiverID => receiverID.toString() !== authorID.toString());
                // Gửi thông báo cho user
                await ctx.call(`${CF_DOMAIN_SERVICES.NOTIFICATION}.${CF_ACTIONS_NOTIFICATION.INSERT_NOTIFICATION}`, {
                    content,
                    receivers,
                    path: `/pcm/detail/${taskID}#${infoDataAfterInserted._id}`,
                    languageKey: "CREATE_NEW_RESPONSE",
                    app: APP_KEYS.PCM_PLAN_TASK,
                    coll: {
                        kind: "pcm_comment",
                        item: infoDataAfterInserted._id
                    },
                    type: 1 // InApp (Socket)
                })

                infoDataAfterInserted = await PCM_COMMENT_COLL
                    .findById(infoDataAfterInserted._id)
                    .select(select)
                    .populate(populates)
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
	 * Dev: MinhVH
	 * Func: Cập nhật comment
	 * Date: 22/02/2022
	 */ 
    update({ commentID, authorID, content, files, images, select, populates, amountCommentReply, amountReaction }) {
        return new Promise(async (resolve) => {
            try {
               /**
                * DECALARTION VARIABLE (1)
                */
               let dataUpdate = {};

               /** 
                * VALIDATION STEP (2)
                *  - kiểm tra valid từ các input
                *  - kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                */
                if(!checkObjectIDs([commentID])) {
                    return resolve({
                        error: true,
                        message: "Tham số commentID không hợp lệ",
                        keyError: "params_commentID_invalid",
                        status: 400
                    })
                }

                if(!checkObjectIDs([authorID])) {
                    return resolve({
                        error: true,
                        message: "Tham số authorID không hợp lệ",
                        keyError: "params_authorID_invalid",
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

                let infoComment = await PCM_COMMENT_COLL.findById(commentID).lean();

                if(!infoComment || infoComment.type === 2) {
                    return resolve({
                        error: true,
                        message: "Comment không tồn tại hoặc comment là phải hồi",
                        keyError: "comment_not_exists_or_comment_is_response",
                        status: 400
                    })
                }

               /**
                * LOGIC STEP (3)
                *  3.1: convert type + update name (ví dụ: string -> number)
                *  3.2: operation database
                */    
                content && (dataUpdate.content = content);

                if(amountCommentReply){
                    dataUpdate.$inc = {
                        amountCommentReply
                    }
                }

                if(amountReaction){
                    dataUpdate.$inc = {
                        amountReaction
                    }
                }

                // CẬP NHẬT FILE MỚI
                if(files.length && checkObjectIDs(files)){
                    dataUpdate.files = files;
                } else{
                    dataUpdate.files = [];
                }

                // CẬP NHẬT HÌNH ẢNH MỚI
                if(images.length && checkObjectIDs(images)){
                    dataUpdate.images = images;
                } else{
                    dataUpdate.images = [];
                }

                let infoAfterUpdate = await PCM_COMMENT_COLL.findOneAndUpdate({
                    _id: commentID,
                    author: authorID
                }, dataUpdate);

                if(!infoAfterUpdate) {
                    return resolve({
                        error: true,
                        message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
                        keyError: "error_occurred",
                        status: 422
                    })
                }

                infoAfterUpdate = await PCM_COMMENT_COLL
                    .findById(commentID)
                    .select(select)
                    .populate(populates)
                    .lean();

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                console.error(error);
                return resolve({ error: true, message: error.message, status: 500 });
            }
       })
    }

     /**
	 * Dev: MinhVH 
	 * Func: Cập nhật đánh dấu response
	 * Date: 22/02/2022
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

                const infoResponse = await PCM_COMMENT_COLL.findById(commentID).lean();
                if(!infoResponse) {
                    return resolve({ 
                        error: true, 
                        message: 'Phản hồi không tồn tại', 
                        keyError: 'response_not_exists', 
                        status: 400
                    });
                }

                const dataUpdate = { isMarked };
                const valueCalculate = -1;

                if(isMarked) {
                    valueCalculate = 1;
                }

                await PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, {
                    $inc: {
                        amountResponseMarked: valueCalculate
                    }
                });

                const infoAfterUpdated = await PCM_COMMENT_COLL.findByIdAndUpdate(commentID, dataUpdate, { new: true });
                if(!infoAfterUpdated) {
                    return resolve({ 
                        error: true, 
                        message: 'Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục', 
                        keyError: 'error_occurred', 
                        status: 422
                    });
                }

                return resolve({ error: false, data: infoAfterUpdated, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * Dev: MinhVH 
	 * Func: Xóa comment
	 * Date: 22/02/2022
	 */
    delete({ commentID, authorID }) { 
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
                if(!checkObjectIDs([commentID])) {
                    return resolve({ 
                        error: true, 
                        message: 'Tham số commentID không hợp lệ', 
                        keyError: 'params_commentID_invalid', 
                        status: 400
                    });
                }

                if(!checkObjectIDs([authorID])) {
                    return resolve({ 
                        error: true, 
                        message: 'Tham số authorID không hợp lệ', 
                        keyError: 'params_authorID_invalid', 
                        status: 400
                    });
                }

                let infoDataAfterDelete = await PCM_COMMENT_COLL.findOneAndDelete({
                    _id: commentID,
                    author: authorID
                });

                if(!infoDataAfterDelete) {
                    return resolve({ 
                        error: true, 
                        message: 'Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục', 
                        keyError: 'error_occurred', 
                        status: 422
                    });
                }

                return resolve({ error: false, data: infoDataAfterDelete, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

     /**
	 * Dev: MinhVH 
	 * Func: Thông tin comment
	 * Date: 22/02/2022
	 */
    getInfo({ commentID, select, populates }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs([commentID])) {
                    return resolve({ 
                        error: true, 
                        message: 'Tham số commentID không hợp lệ', 
                        keyError: 'params_commentID_invalid', 
                        status: 400
                    });
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

                const infoComment = await PCM_COMMENT_COLL
                    .findById(commentID)
                    .select(select)
                    .populate(populates)
                    .lean();

				if (!infoComment) {
                    return resolve({ 
                        error: true, 
                        message: 'Comment không tồn tại', 
                        keyError: 'comment_not_exists', 
                        status: 400
                    });
                }
   
                return resolve({ error: false, data: infoComment, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * Dev: MinhVH 
	 * Func: Danh sách comment
	 * Date: 22/02/2022
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

                if(+limit > 20 || isNaN(limit)){
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
                if(taskID && checkObjectIDs([taskID])){
                    conditionObj.task = taskID;
                }

                if(parentID && checkObjectIDs([parentID])){
                    conditionObj.parent = parentID;
                } else{
                    conditionObj.parent = { $exists: false };
                }

                if(isMarked === 'true') {
                    conditionObj.isMarked = true;
                }

                let conditionObjOrg = { ...conditionObj };
                if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await PCM_COMMENT_COLL.findById(lastestID);
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

                let infoDataAfterGet = await PCM_COMMENT_COLL
                    .find(conditionObj)
                    .limit(limit + 1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet) {
                    return resolve({
                        error: true,
                        message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
                        keyError: "error_occurs",
                        status: 422
                    })
                }

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await PCM_COMMENT_COLL.countDocuments(conditionObjOrg);
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
	 * Dev: MinhVH 
	 * Func: Danh sách comment tìm kiếm theo id
	 * Date: 22/02/2022
	 */
	searchCommentById({ taskID, authorID, commentID, select, populates }){
		return new Promise(async resolve => {
			try {
				if(!checkObjectIDs([taskID, commentID, authorID])) {
                    return resolve({
                        error: true,
                        message: 'Tham số taskID hoặc commentID, authorID không hợp lệ',
                        keyError: 'params_taskID_or_commentID_or_authorID_invalid',
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

				let infoTask = await PCM_PLAN_TASK_COLL.findById(taskID).lean();

				if(!infoTask) {
                    return resolve({
                        error: true,
                        message: 'Công việc không tồn tại',
                        keyError: 'task_not_exists',
                        status: 403
                    })
                }

				const conditionObjFrontList 		= { _id: { $lt: commentID }, task: taskID };
				const conditionObjBackList 		= { _id: { $gt: commentID }, task: taskID };
				const conditionObjSearchMessage 	= { _id: commentID, task: taskID };

				const infoComment = await PCM_COMMENT_COLL
					.findOne(conditionObjSearchMessage)
                    .select(select)
                    .populate(populates)
					.lean();

				if(!infoComment) {
                    return resolve({
                        error: true,
                        message: 'Comment không tồn tại',
                        keyError: 'comment_not_exists',
                        status: 400
                    })
                }

				const listCommentsFront = await PCM_COMMENT_COLL.find(conditionObjFrontList)
                    .limit(5)
                    .sort({ createAt: -1, _id: -1 })
                    .select(select)
                    .populate(populates)
					.lean();

				const listCommentsBack = await PCM_COMMENT_COLL.find(conditionObjBackList)
                    .limit(5)
                    .sort({ createAt: 1, _id: 1 })
                    .select(select)
                    .populate(populates)
					.lean();

				const listComments = [...listCommentsFront.reverse(), infoComment, ...listCommentsBack];

                const totalRecordFront = await PCM_COMMENT_COLL.countDocuments(conditionObjFrontList);
                const totalRecordBack = await PCM_COMMENT_COLL.countDocuments(conditionObjBackList);

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