"use strict";

/**
 * import external
 */
const PromisePool							    = require('@supercharge/promise-pool');

/**
 * import internal
 */
const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }          = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION_V2 }              = require('../../../tools/cursor_base/playground/index');

const { CF_DOMAIN_SERVICES } 		            = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_NOTIFICATION } 		        = require('../../notification/helper/notification.actions-constant');
const { CF_ACTIONS_FILE } 						= require('../../file/helper/file.actions-constant');
const { CF_ACTIONS_ITEM } 		                = require('../../item/helper/item.actions-constant');

const { APP_KEYS, KEY_ERROR, LANGUAGE_KEYS }    = require('../../../tools/keys');
const { ENV_DEVICE_WEB_CBS }                    = require('../../notification/helper/notification.keys-constant');

/**
 * import inter-coll, exter-coll
 */
const PCM_PLAN_TASK_COLL                        = require('../database/subject_pcm.pcm_plan_task-coll');
const PCM_COMMENT_COLL                          = require('../database/subject_pcm.pcm_comment-coll');
const PCM_COMMENT_REACTION_COLL                 = require('../database/subject_pcm.pcm_comment_reaction-coll');
const PCM_FILE_COLL                             = require('../database/subject_pcm.pcm_file-coll');
const PCM_FILE_MODEL                            = require('../model/subject_pcm.pcm_file-model').MODEL;

class Model extends BaseModel {

    constructor() {
        super(PCM_COMMENT_COLL);

        this.COMMENT_PCM = 1;
        this.RESPONSE_PCM = 2;
    }

    /**
     * Dev: MinhVH
     * Func: Thêm file vào pcm_file-coll + thêm vào field photos trong project/contract nếu là ảnh
     * Date: 06/04/2022
     */
    handleAddPhoto({ infoTask, commentID, files, fileType, authorID, ctx }) {
        return new Promise(async resolve => {
            try {
                await PromisePool
                    .for(files)
                    .withConcurrency(2)
                    .process(async fileID => {
                        const infoFileCore = await ctx.call(`${CF_DOMAIN_SERVICES.FILE}.${CF_ACTIONS_FILE.GET_INFO_FILE}`, {
                            fileID: fileID
                        }, {
                            meta: {
                                infoUser: { _id: authorID }
                            }
                        });

                        if(!infoFileCore.error) {
                            const {
                                name, nameOrg, description, path, size, mimeType, type, author
                            } = infoFileCore.data;

                            const infoPcmFile = await PCM_FILE_COLL.findOne({
                                comment: commentID,
                                file: fileID
                            }).select('_id')

                            if(infoPcmFile) return;

                            const infoAfterInserted = await PCM_FILE_MODEL.insert({
                                fileID: fileID,
                                commentID,
                                taskID: infoTask._id,
                                contractID: infoTask.contract,
                                projectID: infoTask.project?._id,
                                groupID: infoTask.group,
                                companyID: infoTask.company,
                                authorID: author,
                                name, nameOrg, path, size, mimeType, description, type
                            });

                            return { file: infoAfterInserted.data && infoAfterInserted.data._id }
                        }
                    });

                if(fileType === 'image') {
                    await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_UPDATE}`, {
                        contractID: infoTask.contract?.toString(),
                        photos: files
                    })
                    await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_UPDATE}`, {
                        departmentID: infoTask.project?._id?.toString(),
                        photos: files
                    })
                }

                return resolve({ error: false, message: 'success' });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: Thêm comment
	 * Date: 22/02/2022
	 */
    insert({ taskID, parentID, authorID, type, content, files, images, select, populates, bizfullname, ctx }) {
        return new Promise(async (resolve) => {
            try {

                /**
                 * DECALARTION VARIABLE (1)
                 */
                const dataInsert = { type, task: taskID, author: authorID };
                const TYPE_COMMENT = [this.COMMENT_PCM, this.RESPONSE_PCM];
                let dataSend        = {};
                let webUrl          = '';
                let titleMSS        = '';
                let descriptionMSS  = '';
                let languageKey     = '';

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!TYPE_COMMENT.includes(type)) {
                    return resolve({
                        error: true,
                        message: "Tham số type không hợp lệ",
                        keyError: "params_type_invalid",
                        status: 400
                    })
                }

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

                if(parentID) {
                    if(!checkObjectIDs([parentID])) {
                        return resolve({
                            error: true,
                            message: "Tham số parentID không hợp lệ",
                            keyError: "params_parentID_invalid",
                            status: 400
                        })
                    }

                    dataInsert.parent = parentID;
                }

                let infoTask = await PCM_PLAN_TASK_COLL
                    .findById(taskID)
                    .populate('project', '_id name sign')
                    .populate('author', '_id bizfullname image')
                    .lean();

                if(!infoTask) {
                    return resolve({
                        error: true,
                        message: "Công việc không tồn tại",
                        keyError: "task_not_exists",
                        status: 400
                    })
                }

                if(infoTask.project) {
                    dataInsert.project = infoTask.project?._id;
                }

                if(infoTask.contract) {
                    dataInsert.contract = infoTask.contract;
                }

                if(infoTask.group) {
                    dataInsert.group = infoTask.group;
                }

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                content && (dataInsert.content  = content);
                files   && (dataInsert.files    = files);
                images  && (dataInsert.images   = images);

                let infoAterInsert = await this.insertData(dataInsert);

                if(!infoAterInsert) {
                    return resolve({
                        error: true,
                        message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
                        keyError: "error_occurred",
                        status: 422
                    })
                }

                if(images && images.length) {
                    await PromisePool
                        .for(images)
                        .withConcurrency(2)
                        .process(async imageID => {
                            const infoFileCore = await ctx.call(`${CF_DOMAIN_SERVICES.FILE}.${CF_ACTIONS_FILE.GET_INFO_FILE}`, {
								fileID: imageID
							}, {
								meta: {
									infoUser: { _id: authorID }
								}
							});

							if(!infoFileCore.error) {
								const {
									name, nameOrg, description, path, size, mimeType, type, author
								} = infoFileCore.data;

								const infoAfterInserted = await PCM_FILE_MODEL.insert({
									fileID: imageID,
                                    taskID,
                                    commentID: infoAterInsert._id,
                                    contractID: infoTask.contract,
                                    projectID: infoTask.project?._id,
                                    groupID: infoTask.group,
                                    companyID: infoTask.company,
                                    authorID: author,
									name, nameOrg, path, size, mimeType, description, type
								});

								return { file: infoAfterInserted.data && infoAfterInserted.data._id }
							}
                        });

                    if(infoTask.contract) {
                        await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_UPDATE}`, {
                            contractID: infoTask.contract.toString(),
                            photos: images
                        })
                    }

                    await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_UPDATE}`, {
                        departmentID: infoTask.project?._id?.toString(),
                        photos: images
                    })
                }

                // Cập nhật lastestReplyID và amountCommentReply cho comment cha
                if(parentID){
                    await PCM_COMMENT_COLL.findByIdAndUpdate(parentID, {
                        $set: {
                            lastestReplyID: infoAterInsert._id
                        },
                        $inc: {
                            amountCommentReply: 1
                        }
                    });
                }

                switch (type) {
                    case 1: // Pre-calculate comment
                        await PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, { $inc: { amountComment: 1 } });
                        break;
                    case 2: // Pre-calculate related response
                        await PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, { $inc: { amountResponse: 1 } });
                        break;
                    default:
                        break;
                }

                let { name: taskName, sign: taskSign, author, assignee, related, project, contract } = infoTask;
                related = related.map(userID => userID.toString());

                let listReceivers   = [...new Set([author?._id.toString(), assignee.toString(), ...related])];
                let arrReceiver     = listReceivers.filter(receiverID => receiverID !== authorID.toString());

                switch (infoAterInsert.type) {
                    case 1:
                        languageKey     = LANGUAGE_KEYS.CREATE_COMMENT_PCM;
                        descriptionMSS  = `${bizfullname} đã tạo 1 bình luận`;
                        webUrl          = `/pcm/detail/${taskID}#comment_${infoAterInsert._id}`;
                        break;
                    case 2:
                        languageKey     = LANGUAGE_KEYS.CREATE_RESPONSE_PCM;
                        descriptionMSS  = `${bizfullname} đã tạo 1 phản hồi liên quan`;
                        webUrl          = `/pcm/detail/${taskID}#response_${infoAterInsert._id}`;
                        break;
                    default:
                        break;
                }

                dataSend = {
                    app: APP_KEYS.PCM_PLAN_TASK,
                    languageKey,
                    mainColl: {
                        kind: 'pcm_plan_task',
                        item: {
                            _id: taskID,
                            name: taskName,
                            project: {
                                sign: project?.sign
                            },
                            author: {
                                _id: author?._id,
                                bizfullname: author?.bizfullname,
                                image: author?.image
                            }
                        }
                    },
                    subColl: {
                        kind: 'pcm_comment',
                        item: {
                            _id: infoAterInsert._id
                        }
                    },
                }

                if(taskSign) {
                    titleMSS = `CÔNG VIỆC: ${taskSign}.${taskName}`;
                } else{
                    titleMSS = `CÔNG VIỆC: ${taskName}`;
                }

                if(arrReceiver && arrReceiver.length) {
                    ctx.emit("NOTIFICATION__LOG_CREATE:MOBILE_WEB", {
                        users: arrReceiver,
                        title: titleMSS,
                        description: descriptionMSS,
                        dataSend,
                        web_url: webUrl,
                        env: ENV_DEVICE_WEB_CBS
                    });

                    ctx.call(`${CF_DOMAIN_SERVICES.NOTIFICATION}.${CF_ACTIONS_NOTIFICATION.INSERT_NOTIFICATION}`, {
                        content,
                        receivers: arrReceiver,
                        project: project?._id?.toString(),
                        contract: contract?.toString(),
                        path: webUrl,
                        languageKey: dataSend.languageKey,
                        app: APP_KEYS.PCM_PLAN_TASK,
                        mainColl: {
                            kind: "pcm_plan_task",
                            item: taskID
                        },
                        subColl: {
                            kind: "pcm_comment",
                            item: infoAterInsert._id
                        },
                        type: 1 // InApp (Socket)
                    })
                }

                infoAterInsert = await PCM_COMMENT_COLL
                    .findById(infoAterInsert._id)
                    .select(select)
                    .populate(populates)
                    .lean();

                infoAterInsert.receivers = arrReceiver;

                return resolve({ error: false, data: infoAterInsert, status: 200 });
            } catch (error) {
                console.error(error);
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: Cập nhật comment
	 * Date: 22/02/2022
	 */
    update({ taskID, commentID, authorID, content, files, images, select, populates, ctx }) {
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

                let infoComment = await PCM_COMMENT_COLL
                    .findOne({
                        _id: commentID,
                        task: taskID
                    }).lean();

                if(!infoComment) {
                    return resolve({
                        error: true,
                        message: "Comment không tồn tại hoặc comment không thuộc task hiện tại",
                        keyError: "comment_not_exists_or_comment_not_belong_task",
                        status: 400
                    })
                }

                let infoTask = await PCM_PLAN_TASK_COLL
                    .findById(taskID)
                    .populate('project', '_id name sign')
                    .populate('author', '_id bizfullname image')
                    .lean();

                if(!infoTask) {
                    return resolve({
                        error: true,
                        message: "Công việc không tồn tại",
                        keyError: "task_not_exists",
                        status: 400
                    })
                }

                /**
                * LOGIC STEP (3)
                *  3.1: convert type + update name (ví dụ: string -> number)
                *  3.2: operation database
                */

                if(infoComment.type === 2) {
                    dataUpdate = {
                        $addToSet: {}
                    };

                    if(checkObjectIDs(files)){
                        dataUpdate.$addToSet['files'] = files;
                    }

                    if(checkObjectIDs(images)){
                        dataUpdate.$addToSet['images'] = images;
                    }
                } else{
                    content && (dataUpdate.content = content);

                    const expireTime = new Date(infoComment.createAt).addHours(1);
                    const now 		 = new Date(Date.now());

                    if(expireTime < now){
                        return resolve({
                            error: true,
                            message: "Bình luận đã hết hạn cập nhật (1 tiếng)",
                            keyError: "time_to_delete_comment_has_expired",
                            status: 403
                        })
                    }

                    // CẬP NHẬT FILE MỚI
                    if(checkObjectIDs(files)){
                        dataUpdate.files = files;
                    } else{
                        dataUpdate.files = [];
                    }

                    // CẬP NHẬT HÌNH ẢNH MỚI
                    if(checkObjectIDs(images)){
                        dataUpdate.images = images;
                    } else{
                        dataUpdate.images = [];
                    }
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

                // Cập nhật/Xóa pcm_file
                if(infoComment.type !== 2) {
                    if(!checkObjectIDs(files)) {
                        await PCM_FILE_COLL.deleteMany({
                            comment: infoComment._id,
                            type: 2
                        })
                    }

                    if(!checkObjectIDs(images)) {
                        await PCM_FILE_COLL.deleteMany({
                            comment: infoComment._id,
                            type: 1
                        })
                    }
                } else{
                    if(checkObjectIDs(files)) {
                        await this.handleAddPhoto({
                            infoTask, commentID, files, fileType: 'file', authorID, ctx
                        })
                    }

                    if(checkObjectIDs(images)) {
                        await this.handleAddPhoto({
                            infoTask, commentID, files: images, fileType: 'image', authorID, ctx
                        })
                    }
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
    updateMarkResponse({ taskID, commentID, official }) {
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

                const dataUpdate = { official };
                let valueCalculate = -1;

                if(official) {
                    valueCalculate = 1;
                }

                await PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, {
                    $inc: {
                        amountMarkedResponse: valueCalculate
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

                const infoComment = await PCM_COMMENT_COLL
                    .findById(commentID)
                    .lean();

                if(!infoComment) {
                    return resolve({
                        error: true,
                        message: "Bình luận không tồn tại",
                        keyError: "comment_not_exists_or_comment_is_response",
                        status: 400
                    })
                }

                if(infoComment.type === 2) {
                    return resolve({
                        error: true,
                        message: "Phản hồi liên quan không thể xóa",
                        keyError: "response_cannot_delete",
                        status: 403
                    })
                }

                const expireTime = new Date(infoComment.createAt).addHours(1);
                const now 		 = new Date(Date.now());

                if(expireTime < now){
                    return resolve({
                        error: true,
                        message: "Bình luận đã hết hạn xóa (1 tiếng)",
                        keyError: "time_to_delete_comment_has_expired",
                        status: 403
                    })
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

                await PCM_FILE_COLL.deleteMany({
                    comment: commentID
                });

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
                        keyError: KEY_ERROR.GET_INFO_FAILED,
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
    getList({ taskID, contractID, projectID, parentID, limit = 10, lastestID, type, official, sortKey, select, populates, authorID }) {
        return new Promise(async (resolve) => {
            try {
                if(limit > 20){
                    limit = 20
                }else{
                    limit = +limit;
                }
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
                if(taskID){
                    if(!checkObjectIDs([taskID])) {
                        return resolve({
                            error: true,
                            message: "Tham số taskID không hợp lệ",
                            keyError: "params_taskID_invalid",
                            status: 400
                        });
                    }

					conditionObj.task = taskID;
				}

                if(contractID || projectID){
                    if(checkObjectIDs([contractID])) {
                        conditionObj.contract = contractID;
                    }

                    if(checkObjectIDs([projectID])) {
                        conditionObj.project = projectID;
                    }

                    conditionObj.$expr = {
                        $gt: [
                            { $size: "$images" }, 0
                        ]
                    }
                    // conditionObj['images.1'] = { $exists: true };
				} else {
                    if(parentID && checkObjectIDs([parentID])){
                        conditionObj.parent = parentID;
                    } else{
                        conditionObj.parent = { $exists: false };
                    }
                }

                if(official === 'true') {
                    conditionObj.official = true;
                }

                if(type) {
                    conditionObj.type = type;
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
                let dataResponse = [];

                if(infoDataAfterGet && infoDataAfterGet.length && !contractID) {
                    for (const comment of infoDataAfterGet) {
                        const lastReactionComment = await PCM_COMMENT_REACTION_COLL
                            .find({ comment: comment._id })
                            .select('type')
                            .sort({ _id: -1 })
                            .limit(3)
                            .lean();

                        const infoReaction = await PCM_COMMENT_REACTION_COLL.findOne({
                            comment: comment._id,
                            author: authorID
                        }).select('type').lean();

                        if(comment.lastestReplyID && typeof comment.lastestReplyID !== 'string') {
                            const lastReactionCommentReply = await PCM_COMMENT_REACTION_COLL
                                .find({ comment: comment.lastestReplyID?._id })
                                .select('type')
                                .sort({ _id: -1 })
                                .limit(3)
                                .lean();

                            const infoReactionReply = await PCM_COMMENT_REACTION_COLL.findOne({
                                comment: comment.lastestReplyID?._id,
                                author: authorID
                            }).select('type').lean();

                            comment.lastestReplyID['reaction'] = infoReactionReply;
                            comment.lastestReplyID['lastReactionComment'] = lastReactionCommentReply;
                        }

                        dataResponse[dataResponse.length] = {
                            ...comment,
                            reaction: infoReaction,
                            lastReactionComment
                        }
                    }
                }

                return resolve({ error: false, data: {
                    listRecords: dataResponse.length ? dataResponse : infoDataAfterGet,
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
                const totalRecordBack  = await PCM_COMMENT_COLL.countDocuments(conditionObjBackList);

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