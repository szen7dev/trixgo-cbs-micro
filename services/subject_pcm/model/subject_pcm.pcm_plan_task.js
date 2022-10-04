"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const PromisePool				        = require('@supercharge/promise-pool');
const ObjectID                          = require('mongoose').Types.ObjectId;
const moment                            = require('moment')
const XlsxPopulate                      = require('xlsx-populate');
const path                              = require('path');
const fs                                = require('fs');

/**
 * Import utils, constants
 */
const { CF_DOMAIN_SERVICES } 		            = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 				        = require('../../file/helper/file.actions-constant');
const { CF_ACTIONS_AUTH }                       = require('../../auth/helper/auth.actions-constant');
const { CF_ACTIONS_ITEM } 		                = require('../../item/helper/item.actions-constant');
const { CF_ACTIONS_REMINDER }                   = require('../../reminder/helper/reminder.actions-constant');

const {
    checkObjectIDs,
    IsJsonString,
    validateParamsObjectID
} = require('../../../tools/utils/utils');

const stringUtils					            = require('../../../tools/utils/string_utils');
const { addDate, calculateExpireTime }          = require('../../../tools/utils/time_utils');
const { KEY_ERROR, APP_KEYS, LANGUAGE_KEYS }    = require('../../../tools/keys');
const { sendNoticeToMember }                    = require('../../../tools/mailer/module/notice_pcm_task');
const { ENV_DEVICE_WEB_CBS }                    = require('../../notification/helper/notification.keys-constant');
const { RANGE_BASE_PAGINATION_V2 } 	            = require('../../../tools/cursor_base/playground/index');
const { PCM_STATUS_TASK }			            = require('../../../tools/constants');
const { uploadFileS3 }                  = require('../../../tools/s3');

/**
 * import inter-coll, exter-coll
 */
const PCM_PLAN_TASK_COLL                = require('../database/subject_pcm.pcm_plan_task-coll');
const PCM_PLAN_GROUP_COLL               = require('../database/subject_pcm.pcm_plan_group-coll');
const DEPARTMENT_COLL                   = require('../../item/database/item.department-coll');
const CONTRACT_COLL                     = require('../../item/database/item.contract-coll');
const USER_COLL                         = require('../../auth/database/auth.user-coll');
// const { email } = require('../../../tools/mailer/config/cf_mailer');

const PCM_FILE_MODEL                    = require('../model/subject_pcm.pcm_file-model').MODEL;
const PCM_COMMENT_MODEL                 = require('../model/subject_pcm.pcm_comment-model').MODEL;
class Model extends BaseModel {

    constructor() {
        super(PCM_PLAN_TASK_COLL);
    }

    /**
     * Dev: MinhVH
     * Func: Thêm file vào pcm_file
     * Date: 26/04/2022
     */
    handleAddFiles({ infoTask, files, authorID, ctx }) {
        return new Promise(async resolve => {
            try {
                let { results, errors } = await PromisePool
                    .for(files)
                    .withConcurrency(2)
                    .process(async fileID => {
                        // File mới
                        const infoFileCore = await ctx.call(`${CF_DOMAIN_SERVICES.FILE}.${CF_ACTIONS_FILE.GET_INFO_FILE}`, {
                            fileID: fileID.toString()
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
                                fileID: fileID,
                                taskID: infoTask._id,
                                contractID: infoTask.contract,
                                projectID: infoTask.project?._id,
                                groupID: infoTask.group,
                                companyID: infoTask.company,
                                authorID: author,
                                name, nameOrg, path, size, mimeType, description, type
                            });

                            return infoAfterInserted.data && infoAfterInserted.data._id;
                        }
                    });

                results = results?.filter(Boolean);

                if(errors.length || !results.length) {
                    return resolve({
                        error: true,
                        errors,
                        message: "Quá trình upload file có vấn đề, chúng tôi đang tìm cách khắc phục",
                        keyError: "error_occurred",
                        status: 422
                    })
                }

                return resolve({
                    error: false,
                    data: { results },
                });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: insert task
     * Author: Depv
     * Code:
     */
    insert({ projectID, groupID, authorID, name, description, sign, type, startTime, expiredTime, expiredHour, amountoftime, assigneeID, relatedIDs, progressType, parentID, contractID, draft, template, fieldID, subType, authorAttachs, bizfullname, isNotiEmail, senderMail, select, populates, ctx }) {
        // console.log({ projectID, groupID, authorID, name, description, sign, type, startTime, expiredTime, expiredHour, amountoftime, assigneeID, relatedIDs, progressType, parentID, messageID, contractID, documentID, boardID, draft, template, fieldID, subType, authorAttachs, bizfullname, isNotiEmail, senderMail, select, populates })
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = {};
                let accessUsers = [authorID, assigneeID];
                let infoGroup = null;
                let companyID = null;
                let infoTaskParent = null;
                let suid = await stringUtils.randomAndCheckExists(PCM_PLAN_TASK_COLL, 'suid');

                if(!name)
                    return resolve({ error: true, message: 'name_invalid', status: 400 });

                if(!checkObjectIDs(projectID))
                    return resolve({ error: true, message: 'projectID_invalid', status: 400 });

                if(!checkObjectIDs(groupID))
                    return resolve({ error: true, message: 'groupID_invalid', status: 400 });

                if(!checkObjectIDs(assigneeID))
                    return resolve({ error: true, message: 'assignee_invalid', status: 400 });

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
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                let infoProject = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST}`, {
                    departmentID: projectID
                })

                companyID = infoProject?.data?.company

                if(!companyID)
                    return resolve({ error: true, message: "company_invalid", status: 400 })

                infoGroup = await PCM_PLAN_GROUP_COLL.findById(groupID).select('_id contract property type');

                dataInsert = {
                    name,
                    namecv: stringUtils.removeAccents(name),
                    company : companyID,
                    project : projectID,
                    group   : groupID,
                    assignee: assigneeID,
                    author  : authorID,
                    suid,
                    accessUsers,
                    amountoftime: (amountoftime && !isNaN(amountoftime) ? Number(amountoftime) : 0),
                    type
                }
                // console.log({ expiredTime, expiredHour })

                if(parentID){
                    infoTaskParent = await PCM_PLAN_TASK_COLL.findById(parentID).lean();
                    dataInsert.subtype = infoTaskParent.subtype;
                }else{
                    dataInsert.subtype = subType;
                }

                if(expiredTime) {
                    dataInsert.expiredTime = new Date(expiredTime);
                    dataInsert.actualFinishTime = new Date(expiredTime);
                } else{
                    dataInsert.expiredTime = new Date();
                    dataInsert.actualFinishTime = new Date();
                }

                if(expiredHour && expiredTime) {
                    const [month, day, year] = expiredTime.split('/');
                    const date = `${year}-${month}-${day}`;
                    const formatDate = new Date(`${date} ${expiredHour}`);

                    dataInsert.expiredTime = formatDate;
                    dataInsert.actualFinishTime = formatDate;
                }

                /**
                 * Precalculated
                 */
                let infoAuthor = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.USER_GET_INFO_AND_GET_LIST}`, {
                    userID: authorID, select: "_id company"
                })

                let infoAssignee = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.USER_GET_INFO_AND_GET_LIST}`, {
                    userID: assigneeID, select: "_id company"
                })

                // companyOfAuthor
                if(!infoAuthor.error){
                    dataInsert.companyOfAuthor = infoAuthor.data.company;
                }

                // companyOfAssignee
                if(!infoAssignee.error){
                    dataInsert.companyOfAssignee = infoAssignee.data.company;
                }

                // Việc con hoặc check list
                if(parentID && checkObjectIDs(parentID)){
                    dataInsert.parent = parentID;
                }

                //_______File của người tạo việc
                if(checkObjectIDs(authorAttachs)){
                    dataInsert.authorAttachs = authorAttachs;
                }

                if(relatedIDs && relatedIDs.length){
                    relatedIDs = [...new Set(relatedIDs)];

                    if(!checkObjectIDs(relatedIDs)) {
                        return resolve({ error: true, message: "relatedIDs_invalid", status: 400 });
                    }
                    dataInsert.related = relatedIDs;
                    accessUsers.push(...relatedIDs);
                }

                if(description){
                    dataInsert.description = description;
                    dataInsert.descriptioncv = stringUtils.removeAccents(description);
                }

                if(sign){
                    dataInsert.sign = sign;
                }

                if(progressType && !isNaN(Number(progressType)) && Number(progressType) > 0){
                    dataInsert.progressType = Number(progressType);
                }

                if(startTime){
                    dataInsert.startTime = new Date(startTime);
                    dataInsert.actualStartTime = new Date(startTime);
                } else {
                    dataInsert.startTime =  new Date();
                    dataInsert.actualStartTime = new Date();
                }

                //_________B2.3 Kiểm tra có contractID
                if(contractID && ObjectID.isValid(contractID)){
                    dataInsert.contract = contractID;
                }else{
                    // Lấy theo group
                    if(infoGroup && infoGroup.contract){
                        dataInsert.contract = infoGroup.contract
                    }
                }

                //_________Phân loại khác
                if(fieldID && ObjectID.isValid(fieldID)){
                    dataInsert.field = fieldID;
                }

                //_________Việc nháp/chính thức
                if(draft && !isNaN(draft)){
                    dataInsert.draft = Number(draft);
                }

                //_________Trường hợp tạo mẫu Đệ trình (template)
                if(template && !isNaN(template)){
                    dataInsert.template = Number(template);
                }

                /**
                 * Những user chưa xem công việc
                 * - Sẽ xóa user khi bấm xem
                 * - Sẽ thêm user khi có thông báo mới
                 */
                dataInsert.news = accessUsers.filter(userId => userId !== authorID);

                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert) {
                    return resolve({
                        error: true,
                        message: "can't_insert_task",
                        keyError: KEY_ERROR.INSERT_FAILED,
                        status: 403
                    });
                }

                // Thêm reminder nhắc công việc đến hạn
                ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.ADD_JOB_REMINDER_EXPIRED_TASK}`, {
                    senderMail,
                    status: infoAfterInsert.status,
                    taskID: infoAfterInsert._id?.toString(),
                    userID: infoAfterInsert.author?.toString(),
                    alert: 0.4, // Mặc định khi tạo task, nhắc hẹn trước 15 phút
                    actualFinishTime: dataInsert.actualFinishTime?.toString(),
                })

                // Thêm record vào bảng pcm_comment phục vụ search
                await PCM_COMMENT_MODEL.insertCommentTask({
                    taskID: infoAfterInsert._id,
                    authorID,
                    type: 5,
                    files: authorAttachs,
                    content: `${infoAfterInsert.name} - ${infoAfterInsert.description}`,
                    rawContent: infoAfterInsert.name,
                    ctx
                });

                /**
                 * KIỂM TRA NẾU CÓ CÔNG VIỆC CHA
                 */
                if(parentID && checkObjectIDs(parentID)){
                    let infoParentTask = await PCM_PLAN_TASK_COLL.findById(parentID).select('_id level')
                    
                    // Cập nhật việc cha
                    await PCM_PLAN_TASK_COLL.findByIdAndUpdate(parentID, {
                        $inc: { amountSubtask: 1 },
                        $addToSet: { news: authorID },
                        $set: {
                            modifyAt: new Date(),
                            level: Number(infoParentTask.level) + Number(1)
                        }
                    });
                }

                /**
                 * CẬP NHẬT SỐ LƯỢNG CÔNG VIỆC CHO GROUP
                 */
                await PCM_PLAN_GROUP_COLL.findByIdAndUpdate(groupID, { $inc: { amountTasks: 1 }})

                /**
                 * Tạo việc con mới
                 * + Insert thông báo vào DB và bắn Cloud MSS
                 */
                if([1,2].includes(type)) {
                    let webUrl              = '';
                    let titleMSS            = '';
                    let descriptionMSS      = '';
                    let languageKey         = '';
                    let dataSend 		    = { app: APP_KEYS.PCM_PLAN_TASK };
                    let taskID              = parentID;

                    if(!parentID) {
                        taskID = infoAfterInsert._id;
                        webUrl = `/pcm/detail/${taskID}`;
                        languageKey = LANGUAGE_KEYS.CREATE_NEW_TASK;
                    } else {
                        webUrl = `/pcm/detail/${taskID}#${'childtask'}_${infoAfterInsert._id}`;
                        languageKey = LANGUAGE_KEYS.CREATE_CHILDTASK_PCM;
                    }

                    let infoTask = await PCM_PLAN_TASK_COLL.findById(taskID).lean();
                    let { name: taskName, author, assignee, related, accessUsers } = infoTask;
                    let arrReceiver = [];

                     /**
                     * 0: chính thức
                     * 1: việc nháp
                     */
                    if(draft == 0) {
                        if(accessUsers && accessUsers.length) {
                            arrReceiver = accessUsers.filter(receiverID => receiverID !== authorID.toString());
                        } else{
                            related = related.map(userID => userID.toString());

                            let listReceivers = [...new Set([author.toString(), assignee.toString(), ...related])];
                            arrReceiver = listReceivers.filter(receiverID => receiverID !== authorID.toString());
                        }
                    }

                    if(arrReceiver && arrReceiver.length) {
                        if(parentID) {
                            let { assignee, related } = infoTaskParent;
                            related = related.map(userID => userID.toString());

                            let listReceivers = [...new Set([assignee.toString(), ...related])];
                            arrReceiver = listReceivers.filter(receiverID => receiverID !== authorID.toString());

                            dataSend = {
                                ...dataSend,
                                languageKey,
                                mainColl: {
                                    kind: 'pcm_plan_task',
                                    item: { _id: taskID }
                                },
                            };
                            titleMSS        = taskName;
                            descriptionMSS  = `${bizfullname} đã tạo 1 việc con cho bạn`;
                        } else {
                            dataSend = {
                                ...dataSend,
                                languageKey,
                                mainColl: {
                                    kind: 'pcm_plan_task',
                                    item: { _id: taskID }
                                }
                            };
                            titleMSS        = taskName;
                            descriptionMSS  = `${bizfullname} đã tạo 1 công việc mới`;
                        }

                        ctx.emit("NOTIFICATION__LOG_CREATE:MOBILE_WEB", {
                            users: arrReceiver,
                            title: titleMSS,
                            description: descriptionMSS,
                            dataSend,
                            web_url: webUrl,
                            env: ENV_DEVICE_WEB_CBS
                        });
                    }
                }

                /**
                 * Gửi mail
                 */
                if(isNotiEmail) {
                    this.sendEmailToMembersInTask({
                        taskID: infoAfterInsert._id,
                        title: infoAfterInsert.name,
                        notice: infoAfterInsert.description,
                        sender: senderMail,
                        receivers: [infoAfterInsert.assignee, ...infoAfterInsert.related],
                        ctx
                    })
                }

                const infoTask = await PCM_PLAN_TASK_COLL
                    .findById(infoAfterInsert._id)
                    .select(select)
                    .populate(populates)
                    .lean();

                return resolve({ error: false, data: infoTask, status: 200 });
            } catch (error) {
                console.error(error);
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: update task
     * Author: DePV/MinhNH/HiepNH
     * Code: 8/9/2022
     */
    update({ typeUpdate,
        taskID, sign, name, description, actualStartTime, actualFinishTime, assigneeID, userID, progressType, fieldID, expiredHour, isUpdateNews,
        contractID, draft, subType, usersDeleteID, related, relatedRemoves, priority, status, signatures, tasksLink,
        links, authorAttachs, assigneeAttachs, percentage, isAddSignature, isOpenBidding,
        openedUsers, flags, flagsRemoves, bizfullname, companyOfUser, milestone, alert, senderMail, ctx
    }){
        return new Promise(async (resolve) => {
            try {
                /**
                 * KHU VỰC CHECK QUYỀN CẬP NHẬT CÔNG VIỆC
                 */
                // Dựa vào trường typeUpdate để cập nhật

                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate   = {};
                let dataAddToset = {};
                let dataPullAll  = {};

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(taskID))
                    return resolve({ error: true, message: 'taskID_invalid', status: 400 });

                const infoTask = await PCM_PLAN_TASK_COLL.findById(taskID).lean();
                // console.log('===============================')
                // console.log(infoTask)

                if(!infoTask)
                    return resolve({ error: true, message: 'task_not_exists', status: 400 });

                /**
                 * Công việc phân loại "LỰA CHỌN NHÀ THẦU"
                 * -> Không được cập nhật task khi hồ sơ thầu đã mở
                 * -> Chỉ được cập nhật thêm người liên quan
                 */
                if(infoTask.subtype === 4 && infoTask.openedStatus === 1 && (!related || !related?.length)) {
                    return resolve({
                        error: true,
                        message: 'Không thể cập nhật công việc khi hồ sơ thầu đã mở',
                        keyError: 'error_occurred',
                        status: 422
                    });
                }

                /**
                 * NẾU LÀ CÔNG VIỆC NHÁP THÌ CHO PHÉP CẬP NHẬT MỘT SỐ THÔNG TIN
                 */
                if(infoTask.draft == 1){
                    /**
                     * Các trường thông tin quan trọng/hay gặp
                     */
                    //_________Việc nháp sang việc chính thức
                    if(+draft === 0){
                        dataUpdate.draft = 0;
                        dataUpdate.companyOfAuthor = companyOfUser;
                        dataUpdate.author = userID;
                    }

                    //_________Người thực hiện
                    if(checkObjectIDs(assigneeID)){
                        dataUpdate.assignee = assigneeID;
                    }

                    //_________Xoá người liên quan
                    if(checkObjectIDs(relatedRemoves)){
                        dataPullAll = {
                            ...dataPullAll,
                            related: relatedRemoves,
                            accessUsers: relatedRemoves,
                            news: relatedRemoves
                        }
                    }

                    //_________Mã công việc
                    if(sign){
                        dataUpdate.sign = sign;
                    }

                    //_________Tên công việc
                    if(name){
                        dataUpdate.name = name;
                        dataUpdate.namecv = stringUtils.removeAccents(name);
                    }

                    //_________Mô tả
                    if(description){
                        dataUpdate.description = description;
                        dataUpdate.descriptioncv = stringUtils.removeAccents(description);
                    }

                    /**
                     * Ngày kết thúc
                     */
                    if(actualFinishTime){
                        dataUpdate.actualFinishTime = new Date(actualFinishTime);
                    }

                    if(expiredHour) {
                        const [month, day, year] = actualFinishTime.split('/');
                        const date = `${year}-${month}-${day}`;
                        const formatDate = new Date(`${date} ${expiredHour}`);

                        dataUpdate.actualFinishTime = formatDate;
                    }

                }else{
                    //_________Mô tả: chỉ áp dụng cho Báo cáo, Họp
                    if(infoTask.subtype === 9 || infoTask.subtype === 11){
                        if(description){
                            dataUpdate.description = description;
                            dataUpdate.descriptioncv = stringUtils.removeAccents(description);
                        }
                    }
                }

                //_________userUpdate
                if(checkObjectIDs(userID)){
                    dataUpdate.userUpdate = userID;
                }

                //_________Thêm người liên quan
                if(checkObjectIDs(related)){
                    dataAddToset = {
                        ...dataAddToset,
                        related,
                        accessUsers: related,
                        news: related
                    }
                }

                /**
                 * Phân loại công việc: không cho phép thay đổi Phân loại Thầu và mua sắm/Báo cáo/Họp
                 */
                 if(subType && !isNaN(subType)){
                    if(infoTask.subtype === 4 || infoTask.subtype === 9 || infoTask.subtype === 11){
                        dataUpdate.subtype = +subType;
                    }
                }

                /**
                 * Ngày bắt đầu
                 */
                if(actualStartTime){
                    dataUpdate.actualStartTime = new Date(actualStartTime);
                }

                /**
                 * Trạng thái công việc
                 * - Chỉ được update khi trạng thái công việc chưa hoàn thành
                 */
                if(status && infoTask.status != 3){
                    dataUpdate.status = status;
                }

                //_________Hợp đồng
                if(checkObjectIDs(contractID)){
                    dataUpdate.contract = contractID;
                }

                //_________Tính chất
                if(checkObjectIDs(fieldID)){
                    dataUpdate.field = fieldID;
                }

                //_________Phân loại tiến độ
                if(progressType){
                    dataUpdate.progressType = progressType;
                }

                //_________User xóa task
                if(checkObjectIDs(usersDeleteID)){
                    dataAddToset = { ...dataAddToset, usersDelete: usersDeleteID }
                }

                //_________Những user đánh dấu quan tâm/start/bookmark
                if(checkObjectIDs(flags)){
                    dataAddToset = { ...dataAddToset, flags }
                }

                //_________User xóa quan tâm
                if(checkObjectIDs(flagsRemoves)) {
                    dataPullAll = { ...dataPullAll, flags: flagsRemoves }
                }

                //_________Phân loại mức độ quan trọng (cao, bình thường, thấp, siêu cao)
                if(priority){
                    dataUpdate.priority = priority;
                }

                //_________Ký duyệt xác nhận
                if(checkObjectIDs(signatures)){
                    dataAddToset = { ...dataAddToset, signatures }
                }

                //_________Các việc có liên quan kèm theo
                if(checkObjectIDs(links)){
                    dataAddToset = { ...dataAddToset, links }
                }

                if(checkObjectIDs(tasksLink)){
                    dataAddToset = { ...dataAddToset, links: tasksLink }
                }

                //_________% hoàn thành (max = 100)
                if(percentage){
                    dataUpdate.percentage = percentage;
                }

                //_________Cột mốc
                if(!isNaN(milestone)){
                    dataUpdate.milestone = milestone;
                }

                // //_________Dự kiến thời lượng (h)
                // if(amountoftime){
                //     dataUpdate.amountoftime = amountoftime;
                // }
                // //_________Đơn giá cho 1 giờ làm
                // if(amountPerHour){
                //     dataUpdate.amountPerHour = amountPerHour;
                // }

                // //_________Số ngày chậm tiến độ
                // if(offtimeReason){
                //     dataUpdate.offtimeReason = offtimeReason;
                // }

                // //_________Giá trị vượt ngân sách
                // if(offbudgetReason){
                //     dataUpdate.offbudgetReason = offbudgetReason;
                // }

                // //_________Giá trị vượt ngân sách
                // if(offbudgetReason){
                //     dataUpdate.offbudgetReason = offbudgetReason;
                // }

                // //_________Phân loại công việc mẫu/thông thường
                // if(checkObjectIDs(templateID)){
                //     dataUpdate.template = templateID;
                // }

                // //_________Khoá/Mở
                // if(lock){
                //     dataUpdate.lock = lock;
                // }

                // //_________Nhận xét
                // if(judgement){
                //     dataUpdate.judgement = judgement;
                // }

                // //_________Tiến độ
                // if(overdue){
                //     dataUpdate.overdue = overdue;
                // }

                // //_________Chất lượng
                // if(score){
                //     dataUpdate.score = score;
                // }

                // //_________Mức độ cấp bách
                // if(urgent){
                //     dataUpdate.urgent = urgent;
                // }

                // //_________Mức độ phức tạp
                // if(difficult){
                //     dataUpdate.difficult = difficult;
                // }

                // //_________Kết thúc thực tế
                // if(finishTime){
                //     dataUpdate.finishTime = finishTime;
                // }

                // //_________Giá trị bị phạt
                // if(punish){
                //     dataUpdate.punish = punish;
                // }

                // //_________Người phê duyệt
                // if(checkObjectIDs(approver)){
                //     dataUpdate.approver = approver;
                // }

                // //_________Thời điểm phê duyệt
                // if(timeApproved){
                //     dataUpdate.timeApproved = timeApproved;
                // }

                // //_________Giá trị phê duyệt/Giá phê duyệt trúng thầu
                // if(valueApproved){
                //     dataUpdate.valueApproved = valueApproved;
                // }

                // //_________Giá dự thầu
                // if(bidPrice){
                //     dataUpdate.bidPrice = bidPrice;
                // }

                // //_________Giảm giá dự thầu
                // if(bidPriceDiscount){
                //     dataUpdate.bidPriceDiscount = bidPriceDiscount;
                // }

                // //_________Giá dự thầu thừa/thiếu
                // if(bidPriceAdjustment){
                //     dataUpdate.bidPriceAdjustment = bidPriceAdjustment;
                // }

                /**
                 * KÝ XÁC NHẬN
                 */
                if(isAddSignature) {
                    const infoSignature = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.SIGNATURE_INSERT}`, {
                        companyID: infoTask.company?.toString(),
                        projectID: infoTask.project?.toString(),
                        coll: {
                            kind: 'pcm_plan_task',
                            item: taskID
                        }
					});
                    if(infoSignature.error) return resolve(infoSignature);

                    const { _id } = infoSignature.data;
                    dataAddToset = { ...dataAddToset, signatures: _id }

                    /**
                     * Nếu người được gán việc nhấn "Đồng ý" (trong chi tiết task)
                     * trong task có phân loại là "Lựa chọn nhà thầu"
                     * -> Cập nhật trạng thái của task thành "Hoàn thành"
                     */
                    if(infoTask.subtype === 4 && userID.toString() === infoTask.assignee?.toString()) {
                        dataUpdate.status = 3;
                    }

                    /**
                     * TH1:
                     * - Nếu là Đề nghị phê duyệt (2) + Thanh toán (3) + Nghiệm thu (5) + Đề nghị thay đổi (7) + Báo cáo (9)
                     * - Người thực hiện ký => phê duyệt luôn
                     * TH2:
                     * - Nếu là Các chủ đề khác còn lại
                     * - Người tạo việc ký => phê duyệt luôn
                     */
                    if([2,3,5,7,9].includes(Number(infoTask.subtype))){
                        if(userID.toString() === infoTask.assignee?.toString()){
                            dataUpdate.approver = userID
                            dataUpdate.timeApproved = Date.now()
                        }
                    }else{
                        if(userID.toString() === infoTask.author?.toString()){
                            dataUpdate.approver = userID
                            dataUpdate.timeApproved = Date.now()
                        }
                    }
                }

                /**
                 * THẦU
                 */
                if(checkObjectIDs(openedUsers)){
                    dataAddToset = { ...dataAddToset, openedUsers }
                }

                if(isOpenBidding) {
                    dataAddToset = { ...dataAddToset, openedUsers: userID }

                    const { openedStatus, openedUsers, related } = infoTask;

                    // Kiểm tra khi tất cả mở thầu => cập nhật sang trạng thái là 1 (mở thầu)
                    if(openedStatus === 0) {
                        const usersOpened = [...openedUsers, userID].map(item => item.toString());
                        const allUsersIsOpened = related.every(item => usersOpened.includes(item.toString()));

                        if(allUsersIsOpened) {
                            dataUpdate.openedStatus = 1;
                        }
                    }
                }

                /**
                 * FILE NGƯỜI TẠO VIỆC ĐÍNH KÈM KHI TẠO TASK
                 */
                if(checkObjectIDs(authorAttachs)){
                    const result = await this.handleAddFiles({
                        infoTask, files: authorAttachs, authorID: userID, ctx
                    })

                    if(result.error) return resolve(result);

                    dataAddToset = { ...dataAddToset, authorAttachs };
                }

                /**
                 * FILE NGƯỜI THỰC HIỆN ĐÍNH KÈM KHI TRẢ BÀI
                 */
                if(checkObjectIDs(assigneeAttachs)){
                    const result = await this.handleAddFiles({
                        infoTask, files: assigneeAttachs, authorID: userID, ctx
                    })

                    if(result.error) return resolve(result);

                    dataAddToset = { ...dataAddToset, assigneeAttachs };
                }

                // Cập nhật nhắc hẹn expired time task
                if(alert >= 0) {
                    dataUpdate.alert = alert;

                    // xóa tất cả job reminder
                    await ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.DELETE_JOB_REMINDER_EXPIRED_TASK}`, {
                        taskID
                    })

                    if(alert > 0) {
                        ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.ADD_JOB_REMINDER_EXPIRED_TASK}`, {
                            alert,
                            senderMail,
                            status: infoTask.status,
                            taskID: infoTask._id?.toString(),
                            userID: infoTask.author?.toString(),
                            actualFinishTime: infoTask.actualFinishTime?.toString(),
                        })
                    }
                }

                /**
                 * Cập nhật user chưa xem
                 */
                if(isUpdateNews) {
                    const usersUnRead = infoTask.accessUsers?.filter(item => item.toString() !== userID.toString());
                    dataAddToset = { ...dataAddToset, news: usersUnRead };
                    dataUpdate.modifyAt = new Date();
                }

                //_________Cập nhật nhiều dữ liệu addToSet cùng 1 lúc
                if(dataAddToset){
                    dataUpdate.$addToSet = dataAddToset;
                }

                //_________Xóa nhiều dữ liệu cùng 1 lúc
                if(dataPullAll){
                    dataUpdate.$pullAll = dataPullAll;
                }

                /**
                 * TIẾN HÀNH CẬP NHẬT CÔNG VIỆC
                 */
                let infoAfterUpdate = await PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, dataUpdate, { new: true });

                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Can't_update_task", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 });

                // Khi link việc A vào việc B thì ở trong việc B, links cũng chứa A
                if(checkObjectIDs(tasksLink)){
                    await PCM_PLAN_TASK_COLL.updateMany({
                        _id: { $in: tasksLink }
                    }, {
                        $addToSet: {
                            links: taskID
                        }
                    });
                }

                // Cập nhật amountFinishedChecklist hoặc amountFinishedSubtask cho việc cha
                if(infoAfterUpdate.parent && status == 3){
                    // Việc con
                    if(infoAfterUpdate.type == 1){
                        await PCM_PLAN_TASK_COLL.findByIdAndUpdate(infoAfterUpdate.parent, { $inc: { amountFinishedSubtask: 1}})
                    } else{
                        // checklist
                        await PCM_PLAN_TASK_COLL.findByIdAndUpdate(infoAfterUpdate.parent, { $inc: { amountFinishedChecklist: 1}})
                    }
                }

                /**
                 * XỬ LÝ SOCKET VÀ CLOUD MSS
                 */
                //1. Socket_CloudMSS_Thêm người liên quan
                if(related && related.length) {
                    const relatedCurrent = infoTask.related.map(item => item.toString());
                    const newRelated = related.filter(item => !relatedCurrent.includes(item));

                    /**
                     * Thêm người liên quan trong công việc
                     * + Insert thông báo vào DB và bắn Cloud MSS
                     */
                    let { name: taskName } = infoAfterUpdate;

                    ctx.emit("NOTIFICATION__LOG_CREATE:MOBILE_WEB", {
                        users: newRelated,
                        title: taskName,
                        description: `${bizfullname} đã thêm bạn làm người liên quan`,
                        dataSend: {
                            app: APP_KEYS.PCM_PLAN_TASK,
                            languageKey: LANGUAGE_KEYS.CREATE_RESPONSE_PCM,
                            mainColl: {
                                kind: 'pcm_plan_task',
                                item: { _id: taskID }
                            }
                        },
                        web_url: `/pcm/detail/${taskID}`,
                        env: ENV_DEVICE_WEB_CBS
                    });
                }

                //2. Socket_CloudMSS_Đồng ý phê duyệt
                if(isAddSignature) {
                    const { name: taskName, related, assignee, author } = infoAfterUpdate;
                    const relatedUsers = related.map(item => item.toString());
                    const listReceivers = [...relatedUsers, assignee.toString(), author.toString()];
                    const receivers = listReceivers.filter(receiver => receiver !== userID.toString());

                    // Cập nhật thông báo cho task (highlight)
                    await PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, {
                        $addToSet: { news: receivers },
                        $set: {
                            modifyAt: new Date()
                        }
                    });

                    ctx.emit("NOTIFICATION__LOG_CREATE:MOBILE_WEB", {
                        users: receivers,
                        title: taskName,
                        description: `${bizfullname} đã ký xác nhận`,
                        dataSend: {
                            app: APP_KEYS.PCM_PLAN_TASK,
                            languageKey: LANGUAGE_KEYS.ADD_SIGNATURE_TASK,
                            mainColl: {
                                kind: 'pcm_plan_task',
                                item: { _id: taskID }
                            }
                        },
                        web_url: `/pcm/detail/${taskID}`,
                        env: ENV_DEVICE_WEB_CBS
                    });
                }

                //3. Socket_CloudMSS_Mở thầu
                if(isOpenBidding) {
                    const { name: taskName, related, author } = infoAfterUpdate;
                    const relatedUsers = related.map(item => item.toString());
                    const listReceivers = [...relatedUsers, author.toString()];
                    const receivers = listReceivers.filter(receiver => receiver !== userID.toString());

                    // Cập nhật thông báo cho task (highlight)
                    await PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, {
                        $addToSet: { news: receivers },
                        $set: {
                            modifyAt: new Date()
                        }
                    });

                    ctx.emit("NOTIFICATION__LOG_CREATE:MOBILE_WEB", {
                        users: receivers,
                        title: taskName,
                        description: `${bizfullname} đã mở thầu`,
                        dataSend: {
                            app: APP_KEYS.PCM_PLAN_TASK,
                            languageKey: LANGUAGE_KEYS.OPEN_BIDDING,
                            mainColl: {
                                kind: 'pcm_plan_task',
                                item: { _id: taskID }
                            }
                        },
                        web_url: `/pcm/detail/${taskID}`,
                        env: ENV_DEVICE_WEB_CBS
                    });
                }

                //4. Socket_CloudMSS_Cập nhật checklist thành công
                if(infoTask.type === 2 && status === 3) {
                    const { name: taskName, related, assignee, author, parent } = infoAfterUpdate;
                    const relatedUsers = related.map(item => item.toString());
                    const listReceivers = [...relatedUsers, author.toString(), assignee.toString()];
                    const receivers = listReceivers.filter(item => item !== userID.toString());

                    // Cập nhật thông báo cho task (highlight)
                    await PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, {
                        $addToSet: { news: receivers },
                        $set: {
                            modifyAt: new Date()
                        }
                    });

                    ctx.emit("NOTIFICATION__LOG_CREATE:MOBILE_WEB", {
                        users: receivers,
                        title: taskName,
                        description: `${bizfullname} đã hoàn thành 1 checklist`,
                        dataSend: {
                            app: APP_KEYS.PCM_PLAN_TASK,
                            languageKey: LANGUAGE_KEYS.CHECK_DONE_CHECKLIST,
                            mainColl: {
                                kind: 'pcm_plan_task',
                                item: { _id: taskID }
                            }
                        },
                        web_url: `/pcm/detail/${parent}#checklist_${taskID}`,
                        env: ENV_DEVICE_WEB_CBS
                    });
                }

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Cập nhật trạng thái, tình trạng xem công việc
     * Author: Depv
     * Update: HiepNH
     * Code: 20/8/2022
     */
    updateStatusMutiple({ taskIDs, parentID, type, option, userID }){
        return new Promise(async resolve => {
            try {
                /**
                 * 1-Cập nhật trạng thái
                 * 2-Cập nhật user đã xem công việc
                 */
                if(!option || option == 0){
                    if (!checkObjectIDs(taskIDs, parentID))
                        return resolve({ error: true, message: 'param_invalid' });

                    // Kiểm tra user update có phải là là người thực hiện checklist hoặc người thực hiện việc con ko
                    let listTasks = await PCM_PLAN_TASK_COLL.find({ _id: { $in: taskIDs }});
                    let isAssignee = true;
                    listTasks.forEach(task => {
                        if(task.assignee.toString() != userID.toString()){
                            isAssignee = false;
                        }
                    });

                    if(!isAssignee)
                        return resolve({ error: true, message: 'Bạn không phải là người thực hiện, nên không được phép cập nhật hoàn thành', keyError: "user_not_assignee" });


                    let infoTaskAfterUpdate = await PCM_PLAN_TASK_COLL.updateMany({ _id: { $in: taskIDs }}, { $set: { status: 3 } }, { new: true});
                    if (!infoTaskAfterUpdate)
                        return resolve({ error: true, message: 'cannot_update', keyError: KEY_ERROR.UPDATE_FAILED });

                    let amountTaskAndChecklist = taskIDs.length;
                    // Việc con
                    if (type == 1) {
                        await PCM_PLAN_TASK_COLL.findByIdAndUpdate(parentID,  { $inc : { amountFinishedSubtask: amountTaskAndChecklist }}, { new: true })
                    }

                    // Checklist
                    if (type == 2) {
                        await PCM_PLAN_TASK_COLL.findByIdAndUpdate(parentID, { $inc : { amountFinishedChecklist: amountTaskAndChecklist }}, { new: true })
                    }

                    return resolve({ error: false, message: "update_success" })
                }

                //2. CẬP NHẬT USER ĐÃ XEM CÔNG VIỆC
                else {
                    // Cập nhật các Task được lựa chọn
                    if(option == 1){
                        let infoTaskAfterUpdate = await PCM_PLAN_TASK_COLL.updateMany(
                            { _id: { $in: taskIDs } },
                            { $pull: { news: userID } },
                            { new: true }
                        );

                        if (!infoTaskAfterUpdate)
                            return resolve({ error: true, message: 'cannot_update', keyError: KEY_ERROR.UPDATE_FAILED });
                    }

                    // Cập nhật tất cả các Task của user chưa đọc
                    if(option == 2){
                        let infoTaskAfterUpdate = await PCM_PLAN_TASK_COLL.updateMany(
                            { news: { $in: userID } },
                            { $pull: { news: userID } },
                            { new: true }
                        );

                        if (!infoTaskAfterUpdate)
                            return resolve({ error: true, message: 'cannot_update', keyError: KEY_ERROR.UPDATE_FAILED });
                    }

                    return resolve({ error: false, message: "update_success" })
                }

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: get info task
     * Author: Depv
     * Code:
     */
    getInfo({ taskID, userID, select, populates }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(taskID))
                    return resolve({ error: true, message: 'param_invalid' });

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
                // Bắt đầu kiểm tra quyền
                let infoTaskToCheckPermission = await PCM_PLAN_TASK_COLL.findById(taskID).populate("group").lean();
                if(!infoTaskToCheckPermission) {
                    return resolve({ error: true, message: 'Not found task', status: 404 });
                }

                let { author, assignee, related, group } = infoTaskToCheckPermission;

                let isAuthor = false;
                let isAssignee = false;
                let isRelated = false;
                let isMemberGroup = false;

                if(author.toString() == userID.toString()){
                    isAuthor = true;
                }

                if(assignee.toString() == userID.toString()){
                    isAssignee = true;
                }

                related = related.map(item => `${item}`);
                if(related.includes(userID)){
                    isRelated = true;
                }

                let memberInGroup = group?.members?.map(item => `${item}`) || [];
                if(memberInGroup.includes(userID.toString())){
                    isMemberGroup = true;
                }

                if(!isAuthor && !isAssignee && !isRelated && !isMemberGroup)
                    return resolve({ error: true, message: 'permission_denied', keyError: KEY_ERROR.PERMISSION_DENIED });

                // Nếu là công việc nháp, không phải là người tạo việc mà là người thực hiện thì không cho phép người thực hiện được vào xem(Đệ bỏ đi)
                // if(Number(infoTaskToCheckPermission.draft) === 1 && isAssignee && !isAuthor &&!isRelated)
                //     return resolve({ error: true, message: 'permission_denied', keyError: KEY_ERROR.PERMISSION_DENIED });

                // Kết thúc kiểm tra quyền
                let infoTask = await PCM_PLAN_TASK_COLL.findById(taskID)
                                .select(select)
                                .populate(populates).lean();

				if (!infoTask)
                    return resolve({ error: true, message: 'cannot_get', keyError: KEY_ERROR.GET_INFO_FAILED });

                return resolve({ error: false, data: infoTask });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name  : Danh sách pcm_plan_task
     * Author: Depv
     * Update: HiepNH
     * Code  : 20/8/2022
     */
    getList({
        projectID, groupID, assigneeID, authorID, status, statusNe, draft, type, level, typeStatus, collection,
        subtype, isExpired, fromDate, toDate, signGroupOfTask, isChecklist, isChildTask, isPassPermision, sortKey, isParent,
        userID, parentID, companyOfAuthor, companyOfAssignee, fieldID, isSortChecklist, isSortChildTask, milestone,
        keyword, limit = 50, unlimit, lastestID, select, populates = {}, unlimited
    }) {
        // console.log('=============Danh sách chủ đề=============>>>>>>>>>>>')
        // console.log({
        //     projectID, groupID, assigneeID, authorID, status, statusNe, draft, type, level, typeStatus, collection,
        //     subtype, isExpired, fromDate, toDate, signGroupOfTask, isChecklist, isChildTask, isPassPermision, sortKey, isParent,
        //     userID, parentID, companyOfAuthor, companyOfAssignee, fieldID, isSortChecklist, isSortChildTask, milestone,
        //     keyword, limit, unlimit, lastestID, select, populates
        // })
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 */

                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                // Các việc user đang active
                let conditionObj = {
                    usersDelete: { $nin: [userID] },
                };

                // Các việc chưa hoàn thành
                if(statusNe){
                    conditionObj.status = { $ne: statusNe };
                }

                let sortBy;
                // let keys	 = ['actualFinishTime__-1', '_id__-1'];
                // let keys	 = ['actualFinishTime__1', '_id__1'];
                let keys	 = ['modifyAt__-1'];
                let totalTaskDone = 0;

                if(isSortChecklist == 1 || isSortChildTask == 1){
                    keys = ['actualFinishTime__1', '_id__1'];
                    // keys = ['modifyAt__', '_id__1'];
                }

                // Làm rõ mục đích để làm gì?
                if (sortKey && typeof sortKey === 'string') {
                    if (!IsJsonString(sortKey))
                        return resolve({ error: true, message: 'Request params sortKey invalid', status: 400 });

                    keys = JSON.parse(sortKey);
                }

                let start = new Date();
                start.setHours(0,0,0,0);
                let end = new Date();
                end.setHours(23,59,59,999);

                //__________Danh sách các nhóm dữ liệu mà userID là members
                let listGroups = await PCM_PLAN_GROUP_COLL.find({ members: { $in: [userID]} })

                // Lấy công việc mà user được quyền truy cập
                conditionObj.$or = [
                    { author: userID },
                    { assignee: userID },
                    { related: { $in: [userID] }},
                    { group: { $in: listGroups.map(item => item._id) }}, // Bỏ, vì việc tra cứu theo thẻ lọc mới cần đến. Còn lại đi theo đường thư mục
                ]

                // Tìm kiếm nếu có trạng thái công việc
                if(status){
                    conditionObj.status = { $in: [status] }
                }

                /**
                 * Quá hạn
                 */
                if(isExpired){
                    // Đã quá hạn
                    if(isExpired == 1) {
                        conditionObj.status = { $ne: 3 }; // Chưa hoàn thành
                        conditionObj.actualFinishTime = {
                            $lt: new Date()
                        }
                    }

                    // Chưa quá hạn
                    if(isExpired == 2) {
                        conditionObj.actualFinishTime = {
                            $gt: new Date()
                        }
                    }
                }else{
                    /**
                     * Lấy những công việc từ ngày đến ngày
                     * - Sẽ không cùng diễn ra với Lọc quá hạn
                     */
                    if(fromDate && toDate){
                        conditionObj.actualFinishTime = {
                            $gte: new Date(fromDate),
                            $lte: new Date(toDate),
                        }
                    }
                }

                // Lấy những việc nháp hoặc không phải việc nháp
                if(draft){
                    conditionObj.draft = draft;
                }

                // Lấy việc trong dự án
                if(projectID && checkObjectIDs(projectID)){
                    conditionObj.project = projectID;
                }

                // Lấy việc trong group
                if(groupID && checkObjectIDs(groupID)){
                    conditionObj.group = groupID
                    conditionObj.parent = { $exists: false } // Chỉ lấy các việc cha
                    delete conditionObj.$or;
                }

                // Việc theo cột mốc
                if(!isNaN(milestone)){
                    conditionObj.milestone = milestone;
                }

                /**
                * Phân loại chủ đề
                * 1-Công việc
                * 2-Checklist
                */
                if(collection){
                    conditionObj.type = collection;
                }

                // Phân loại công việc
                if(!isNaN(subtype)){
                    conditionObj.subtype = +subtype;
                }

                /**
                 * Type = 0 Việc của tôi + Giao + Liên quan(All)
                 * Type = 1 Việc của tôi
                 * Type = 2 Việc giao người khác
                 * Type = 3 Việc đánh dấu quan tâm
                 * Type = 4 Việc nháp
                 * Type = 5 Việc liên quan
                 */
                if(!type || type == 0){
                    conditionObj.$or = [
                        { author: userID },
                        { assignee: userID },
                        { related: { $in: [userID] }}
                    ]
                }

                // Việc của tôi
                if(type == 1){
                    conditionObj.assignee = userID;
                    delete conditionObj.$or
                }

                // Việc giao người khác
                if(type == 2){
                    conditionObj.author = userID;
                    delete conditionObj.$or
                }

                // Việc đánh dấu quan tâm
                if(type == 3){
                    conditionObj.flags = { $in: [userID]};
                    delete conditionObj.$or
                    delete conditionObj.status
                }

                 // Việc nháp
                if(type == 4){
                    conditionObj.$or = [
                        { author: userID }, // Người tạo việc được xem
                        { related: { $in: [userID] } }, // Người liên quan được xem
                    ],
                    conditionObj.draft = 1; // Gồm cả việc nháp
                    delete conditionObj.status
                }

                // Việc liên quan
                if(type == 5){
                    conditionObj.related = { $in: [userID] };
                    delete conditionObj.$or
                }

                if(level){
                    conditionObj.level = level;
                }

                /**
                 * Lấy việc quá hạn
                 * 1-Quá hạn
                 * 2-Tuần tới
                 * 3->7 ngày tới
                 * 4-Hoàn thành
                 */
                if(typeStatus && typeStatus == 1){
                    conditionObj.actualFinishTime = {
                        $lt: start
                    }
                }

                // lấy việc tới hạn Tuần tới
                if(typeStatus && typeStatus == 2){
                    conditionObj.actualFinishTime = {
                        $gte:  moment(start).startOf('day')._d,
                        $lt: moment(addDate(7)).endOf('day')._d
                    }
                }

                // Tới hạn + 7 ngày tới
                if(typeStatus && typeStatus == 3){
                    conditionObj.actualFinishTime = {
                        $gte: addDate(7)
                    }
                }

                // Hoàn thành
                if(typeStatus && typeStatus == 4){
                    conditionObj.status = 3
                }

                // Lấy việc của người thực hiện
                if(assigneeID && checkObjectIDs(assigneeID)){
                    conditionObj.assignee = assigneeID;
                }

                // Lấy việc của người tạo việc
                if(authorID && checkObjectIDs(authorID)){
                    conditionObj.author = authorID;
                }

                // ID công việc cha, công việc chứa checklist
                if(parentID && checkObjectIDs(parentID)){
                    conditionObj.parent = parentID;
                    delete conditionObj.$or
                    delete conditionObj.status;
                }

                // Chỉ lấy task cha
                if(isParent == 1){
                    conditionObj.parent = { $exists: false };
                }

                // Công ty của người tạo việc
                if(companyOfAuthor && checkObjectIDs(companyOfAuthor)){
                    conditionObj.companyOfAuthor = companyOfAuthor;
                }

                // Công ty của người thực hiện
                if(companyOfAssignee && checkObjectIDs(companyOfAssignee)){
                    conditionObj.companyOfAssignee = companyOfAssignee;
                }

                // isPassPermision dùng để bỏ qua 1 trong 4 quyền
                if(isPassPermision == 1){
                    delete conditionObj.$or;
                }

                if(fieldID && checkObjectIDs(fieldID)){
                    conditionObj.field = fieldID;
                }

                // Kiểm tra điều kiện populates
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

                // console.log(conditionObj)

                // Tìm kiếm theo keyword
				if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.$or = [
                        { name  :  new RegExp(keyword, 'i') },
                        { description  :  new RegExp(keyword, 'i') }
                    ]
                }

                let conditionObjOrg = {...conditionObj};

				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await PCM_PLAN_TASK_COLL.findById(lastestID);
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

                // Tổng số việc tìm thấy
                let totalRecord = await PCM_PLAN_TASK_COLL.count(conditionObjOrg);
                if(unlimit == 1){
                    limit = totalRecord;
                }
                /**
                 * Dùng để lấy all data, Chỉ:
                 * - Dùng internal services
                 * - Không cho client truyền qua API
                 */
                if(unlimited) {
                    const infoDataAfterGet = await PCM_PLAN_TASK_COLL
                        .find({ ...conditionObj, draft: 0 })
                        .select(select)
                        .populate(populates)
                        .sort(sortBy)
                        .lean();

                    return resolve({
                        data: infoDataAfterGet
                    });
                }

                // Bắt đầu query trong db
                let infoDataAfterGet = await PCM_PLAN_TASK_COLL.find(conditionObj)
                    .limit(limit+1)
                    .select(select)
                    .populate(populates)
                    .sort(sortBy)
                    .lean();

                // Kiểm tra nếu không có dữ liệu
                if(!infoDataAfterGet)
                   return resolve({ error: true, message: "Can't get data", keyError: KEY_ERROR.GET_LIST_FAILED, status: 200 });

                // nextCursor phần tử cuối cùng khi phân trang
                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                // Lấy tổng subtask đã hoàn thành (show in detail task)
                if(parentID && checkObjectIDs(parentID)){
                    totalTaskDone = await PCM_PLAN_TASK_COLL.count({
                        parent: parentID,
                        type: 2,
                        status: 3
                    });
                }

                // Tổng số trang
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit,
                    totalTaskDone,
                    totalRecord,
                    totalPage,
                    nextCursor,
                }, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Dev: MinhVH
     * Func: Tìm kiếm Task
     * Date: 11/05/2022
     */
    getListByFilter({
        fromDate, toDate, assigneesID, companiesOfAssignee, authorsID,
        projectsID, subtypes, status, fieldsID, isExpired, read, isParent, keyword, unlimited,
        limit = 50, lastestID, select, populates, userID
    }) {
        // console.log('=============Danh sách chủ đề TÌM KIẾM=============>>>>>>>>>>>')
        // console.log({fromDate, toDate, assigneesID, companiesOfAssignee, authorsID,
        //     projectsID, subtypes, status, fieldsID, isExpired, read, keyword, isParent, unlimited,
        //     limit, lastestID, select, populates, userID})
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 */

                /**
                 * VALIDATION (1)
                 */
                const validation = validateParamsObjectID({
                    companiesOfAssignee : { value: companiesOfAssignee, isRequire: false },
                    assigneesID         : { value: assigneesID, isRequire: false },
                    authorsID           : { value: authorsID, isRequire: false },
                    projectsID          : { value: projectsID, isRequire: false },
                    fieldsID            : { value: fieldsID, isRequire: false },
                });
                if(validation.error) return resolve(validation);

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
                 * DECALARTION VARIABLE (2)
                 */
                let conditionObj = {
                    usersDelete: { $nin: [userID] },
                };
                let nextCursor  = null;
                let sortBy      = null;
                let keys	 = ['modifyAt__-1', '_id__-1'];
                // let keys	    = ['actualFinishTime__-1', '_id__-1'];

                /**
                 * LOGIC CODE (3)
                 */
                if(limit > 50 && isNaN(limit)){
                    limit = 50;
                } else{
                    limit = +limit;
                }

                /**
                 * Kiểm soát quyền truy cập Task
                 */
                // Lấy danh sách các nhóm dữ liệu mà userID là members
                const listGroups = await PCM_PLAN_GROUP_COLL.find({ members: { $in: [userID]} })

                // Lấy công việc mà mình được quyền truy cập
                conditionObj.$or = [
                    { author: userID },
                    { assignee: userID },
                    { related: { $in: [userID] }},
                    { group: { $in: listGroups.map(item => item._id) }},
                ]

                /**
                 * Bộ lọc với nhiều lựa chọn
                 */
                status && status.length                             && (conditionObj.status = { $in: status });
                projectsID && projectsID.length                     && (conditionObj.project = { $in: projectsID });
                subtypes && subtypes.length                         && (conditionObj.subtype = { $in: subtypes });
                assigneesID && assigneesID.length                   && (conditionObj.assignee = { $in: assigneesID });
                authorsID && authorsID.length                       && (conditionObj.author = { $in: authorsID });
                fieldsID && fieldsID.length                         && (conditionObj.field = { $in: fieldsID });
                companiesOfAssignee && companiesOfAssignee.length   && (conditionObj.companyOfAssignee = { $in: companiesOfAssignee });

                // Chỉ lấy task cha hoặc lấy tất cả
                if(isParent && isParent == 1){
                    conditionObj.parent = { $exists: false };
                }
                if(isParent && isParent == 2){
                    conditionObj.parent = { $exists: true };
                }

                // Chưa xem (user nắm trong mảng new)
                if(read && read == 1){
                    conditionObj.news = { $in: [userID] }
                }

                // Đã xem (user bị xoá ra khỏi mảng news)
                if(read && read == 2){
                    conditionObj.news = { $nin: [userID] }
                }

                /**
                 * Quá hạn
                 */
                if(isExpired){
                    // Đã quá hạn
                    if(isExpired == 1) {
                        conditionObj.status = { $ne: 3 }; // Chưa hoàn thành
                        conditionObj.actualFinishTime = {
                            $lt: new Date()
                        }
                    }

                    // Chưa quá hạn
                    if(isExpired == 2) {
                        conditionObj.actualFinishTime = {
                            $gt: new Date()
                        }
                    }
                }else{
                    /**
                     * Lấy những công việc từ ngày đến ngày
                     * - Sẽ không cùng diễn ra với Lọc quá hạn
                     */
                    if(fromDate && toDate){
                        conditionObj.actualFinishTime = {
                            $gte: new Date(fromDate),
                            $lte: new Date(toDate),
                        }
                    }
                }

                // Tìm kiếm theo keyword
				if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i')
                    // conditionObj.$or = [
                    //     { name  :  new RegExp(keyword, 'i') },
                    //     { description  :  new RegExp(keyword, 'i') }
                    // ]
                }
                // console.log('========================')
                // console.log(conditionObj)

                let conditionObjOrg = {...conditionObj};
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await PCM_PLAN_TASK_COLL.findById(lastestID);
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

                /**
                 * Dùng để lấy all data, Chỉ:
                 * - Dùng internal services
                 * - Không cho client truyền qua API
                 */
                if(unlimited) {
                    const infoDataAfterGet = await PCM_PLAN_TASK_COLL
                        .find(conditionObj)
                        .select(select)
                        .populate(populates)
                        .sort(sortBy)
                        .lean();

                    return resolve({
                        data: infoDataAfterGet
                    });
                }

                /**
                 * QUERY DATABASE (4)
                 */
                const infoDataAfterGet = await PCM_PLAN_TASK_COLL
                    .find(conditionObj)
                    .limit(limit+1)
                    .select(select)
                    .populate(populates)
                    .sort(sortBy)
                    .lean();

                if(!infoDataAfterGet) {
                    return resolve({
                        error: true,
                        message: 'Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục',
                        keyError: 'error_occurred',
                        status: 422
                    });
                }

                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                const totalRecord = await PCM_PLAN_TASK_COLL.countDocuments(conditionObjOrg);
                const totalPage   = Math.ceil(totalRecord / limit);

                return resolve({
                    error: false,
                    status: 200,
                    data: {
                        listRecords: infoDataAfterGet,
                        limit,
                        totalRecord,
                        totalPage,
                        nextCursor,
                    },
                });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Lấy thông báo công việc (chưa đọc)
     * Author: HiepNH
     */
    getAmountNotification({ userID, option }){
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * Không truyền option => lấy cả 3 loại cùng lúc
                 * option = 1: Số công việc chưa xem
                 * option = 2: Số công việc của tôi
                 * option = 3: Số công việc nháp
                 */
                let amountUnreadTask =0, amountMyTask=0, amountDraftTask=0

                if(!option){
                    // Số công việc chưa xem
                    amountUnreadTask = await PCM_PLAN_TASK_COLL.count({
                        news: { $in: [userID] },
                        usersDelete: { $nin: [userID] }
                    })

                    // Số công việc của tôi (mà chưa hoàn thành)
                    amountMyTask = await PCM_PLAN_TASK_COLL.count({
                        assignee: userID,
                        status: { $ne: 3 },
                        usersDelete: { $nin: [userID] }
                    })

                    // Số lượng công việc nháp
                    amountDraftTask = await PCM_PLAN_TASK_COLL.count({
                        author: userID,
                        draft: 1,
                        usersDelete: { $nin: [userID] }
                    })
                }else{
                    if(option == 1){
                        // Số công việc chưa xem
                        amountUnreadTask = await PCM_PLAN_TASK_COLL.count({
                            news: { $in: [userID] },
                            usersDelete: { $nin: [userID] }
                        })
                    }

                    if(option == 2){
                        // Số công việc của tôi (mà chưa hoàn thành)
                        amountMyTask = await PCM_PLAN_TASK_COLL.count({
                            assignee: userID,
                            status: { $ne: 3 },
                            usersDelete: { $nin: [userID] }
                        })
                    }

                    if(option == 3){
                        // Số lượng công việc nháp
                        amountDraftTask = await PCM_PLAN_TASK_COLL.count({
                            author: userID,
                            draft: 1,
                            usersDelete: { $nin: [userID] }
                        })
                    }
                }

                return resolve({ error: false, data: {
                    amountUnreadTask, amountMyTask, amountDraftTask
                }});
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Lấy số lượng task của bạn
     * Author: Depv
     */
    getAmountTask({ userID }){
        return new Promise(async resolve => {
            try {
                /**
                    { value: 0, text: 'Việc thông thường', sign: 'Tasks', key: 'task' },
                    { value: 1, text: 'Yêu cầu thông tin', sign: 'RFis', key: 'rfi' },
                    { value: 2, text: 'Yêu cầu phê duyệt', sign: 'RFa', key: 'rfa' },
                    { value: 3, text: 'Thanh toán', sign: 'CRFa', key: 'crfa' },
                    { value: 4, text: 'Lựa chọn nhà thầu', sign: 'BRFa', key: 'brfa' },
                    { value: 5, text: 'Nghiệm thu chất lượng', sign: 'QRFa', key: 'inspection' },
                    { value: 6, text: 'Yêu cầu sửa chữa', sign: 'Punch', key: 'punch' },
                    { value: 7, text: 'Yêu cầu thay đổi', sign: 'RFc', key: 'rfc' },
                    { value: 8, text: 'Yêu cầu thực hiện', sign: 'RFe', key: 'rfe' },
                    { value: 9, text: 'Báo cáo', sign: 'Report', key: 'report' },
                    { value: 10, text: 'Tiến độ', sign: 'Schedule', key: 'schedule' },
                    { value: 11, text: 'Họp', sign: 'MOM', key: 'mom' },
                 */
                /**
                 * Tổng số lượng công việc của tôi
                 */
                let amountTask = await PCM_PLAN_TASK_COLL.count({
                    actualFinishTime: { $exists: true, $ne: null  },
                    assignee: userID,
                    status: { $ne: 3 },
                    usersDelete: { $nin: [userID] },
                })

                /**
                 * Số lượng công việc thuộc đệ trình phê duyệt
                 */
                let amountTaskIsRFa = await PCM_PLAN_TASK_COLL.count({
                    actualFinishTime: { $exists: true, $ne: null  },
                    assignee: userID,
                    subtype: 2,
                    status: { $ne: 3 },
                    usersDelete: { $nin: [userID] },
                })

                /**
                 * Tổng số lượng công việc thuộc yêu cầu thông tin
                 */
                let amountTaskIsRFis = await PCM_PLAN_TASK_COLL.count({
                    actualFinishTime: { $exists: true, $ne: null  },
                    assignee: userID,
                    subtype: 1,
                    status: { $ne: 3 },
                    usersDelete: { $nin: [userID] },
                })

                /**
                 * Tổng số lượng công việc bạn quan tâm
                 */
                let amountTaskIsFlags = await PCM_PLAN_TASK_COLL.count({
                    actualFinishTime: { $exists: true, $ne: null  },
                    flags: {
                       $in: [userID]
                    },
                    usersDelete: { $nin: [userID] },
                });

                /**
                 * Tổng số lượng công việc bạn đã giao người khac
                 */
                let amountTaskIsAssignee = await PCM_PLAN_TASK_COLL.count({
                    actualFinishTime: { $exists: true, $ne: null  },
                    author: userID,
                    status: { $ne: 3 },
                    usersDelete: { $nin: [userID] },
                });

                /**
                 * Tổng số lượng công việc nháp
                 */
                let amountTaskIsDraft = await PCM_PLAN_TASK_COLL.count({
                    actualFinishTime: { $exists: true, $ne: null  },
                    $or: [
                        { author: userID },
                        { related: { $in: [userID] } },
                    ],
                    draft: 1,
                    usersDelete: { $nin: [userID] },
                });

                return resolve({ error: false, data: {
                    amountTask, amountTaskIsRFa, amountTaskIsRFis, amountTaskIsFlags, amountTaskIsAssignee, amountTaskIsDraft
                }});
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Lấy số lượng task đấu thầu
     * Author: Depv
     */
    getBadgeBidding({ userID }){
        return new Promise(async resolve => {
            try {
                /**
                 *  Đang dự thầu
                 */
                let amountBiddingInProgress = await PCM_PLAN_TASK_COLL.count({
                    actualFinishTime: { $exists: true, $ne: null  },
                    assignee: userID,
                    status: { $ne: 3 },
                    usersDelete: { $nin: [userID] },
                    subtype: 4,
                    level: 2
                })

                /**
                 *  Hoàn thành dự thầu
                 */
                let amountBiddingInComplete = await PCM_PLAN_TASK_COLL.count({
                    actualFinishTime: { $exists: true, $ne: null  },
                    assignee: userID,
                    status: 3,
                    usersDelete: { $nin: [userID] },
                    subtype: 4,
                    level: 2
                })

                /**
                 *  Đang mời thầu
                 */
                let amountBiddingInviting = await PCM_PLAN_TASK_COLL.count({
                    actualFinishTime: { $exists: true, $ne: null  },
                    usersDelete: { $nin: [userID] },
                    subtype: 4,
                    level: 1,
                    $or: [
                        {
                            author: userID
                        },
                        {
                            related: { $in: [userID] }
                        },
                    ]
                })

                /**
                 *  Hoàn thành mời thầu
                 */
                let amountBiddingInvitingComplete = await PCM_PLAN_TASK_COLL.count({
                    actualFinishTime: { $exists: true, $ne: null  },
                    usersDelete: { $nin: [userID] },
                    subtype: 4,
                    level: 1,
                    status: 3,
                    $or: [
                        {
                            author: userID
                        },
                        {
                            related: { $in: [userID] }
                        },
                    ]
                })

                return resolve({ error: false, data: {
                    amountBiddingInProgress,
                    amountBiddingInComplete,
                    amountBiddingInviting,
                    amountBiddingInvitingComplete
                }});
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Gửi thông báo email tới các thành viên trong task
     * Depv
     */
    sendEmailToMembersInTask({ taskID, title, notice, sender, receivers, emails, userID, ctx }) {
        return new Promise(async resolve => {
            try {
                let infoTask = await PCM_PLAN_TASK_COLL
                    .findById(taskID)
                    .populate('author assignee related project')
                    .lean();

                if (!infoTask)
                    return resolve({ error: true, message: 'cannot_get_info_task', status: 400 });

                /**
                 * CẤU TRÚC EMAIL
                 * Người nhận email
                 * Tiêu đề
                 * Nội dung
                 */
                let mailsUser = [];

                if(receivers && receivers.length) {
                    const { data: users } = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.USER_GET_INFO_AND_GET_LIST}`,
                        { arrayID: JSON.stringify([...receivers, userID]), select: "_id email", isLoadAll: true }
                    );
                    // console.log({ users, emails })

                    if(users.length) {
                        mailsUser = users.map(item => item.email);
                    }
                }

                if(emails) {
                    emails = emails.split(',');

                    if(emails.length) {
                        mailsUser = [...mailsUser, ...emails];
                    }
                }

                if(!mailsUser.length) {
                    return resolve({
                        error: true,
                        message: 'Tham số mails không hợp lệ',
                        keyError: 'params_mails_invalid',
                        status: 400
                    });
                }

                for (const email of mailsUser) {
                    if(!stringUtils.validEmail(email.trim())) {
                        return resolve({
                            error: true,
                            message: `Mail không hợp lệ: ${email}`,
                            keyError: 'params_mail_invalid',
                            status: 400
                        });
                    }
                }
                mailsUser = mailsUser.join(',');

                const result = await sendNoticeToMember({
                    email: mailsUser,
                    title,
                    content: { sender, notice, infoTask }
                });

                return resolve(result);

                // console.log({ __: MAIL_CONSTANTS.MAIL_NOTI_PCM_TASK, __: { email: mailsUser, title, content: { sender, notice, infoTask } } });
                // pool
                //     .exec(MAIL_CONSTANTS.MAIL_NOTI_PCM_TASK, [JSON.stringify({ email: mailsUser, title, content: { sender, notice, infoTask } })])
            } catch (error) {
                console.error(error);
                return resolve({ error: true, message: error.message, status: 500 });
            }
        });
    }

    /**
     * Name: Lấy số lượng công việc của companyOfAssignee (gom nhóm theo user, project)
     * Author: HiepNH
     * Code: 23/9/2022
     */
    getAmountTaskOfCompanyOfAssigneeV1({ option, companyID, projectID, keyword, subtype, ctx }){
        // console.log('==================Tổng hợp theo đơn vị thực hiện 2222================>>>>>>>>>>>>>>>>>')
        // console.log({ option, companyID, keyword, subtype })
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(companyID))
                    return resolve({ error: true, message: 'companyID_invalid' });

                let objCodition = {
                    companyOfAssignee: ObjectID(companyID),
                }

                if(subtype){
                    objCodition.subtype = +subtype;
                }

                let conditionGroup = {}, listUserOfCompany, listProjectOfCompany

                if(option == 1){
                    if(projectID && checkObjectIDs(projectID)){
                        objCodition.project = ObjectID(projectID)
                    }

                    conditionGroup = {
                        _id: "$assignee",
                        count: { $sum: 1 }
                    }

                    /**
                     * DANH SÁCH USER THỰC HIỆN CÔNG VIỆC CỦA CÔNG TY
                     */
                    let listUser = await PCM_PLAN_TASK_COLL.aggregate([
                        { $match: objCodition },
                        { $group: { _id: "$assignee" } },
                        { $sort: { _id: -1} }
                    ]);
                    // console.log(listUser)

                    let conditionObj = {}

                    if(keyword){
                        keyword = keyword.split(" ");
                        keyword = '.*' + keyword.join(".*") + '.*';
                        conditionObj.fullname = new RegExp(keyword, 'i');
                    }
                    let conditionPopulate = {
                        path: '_id',
                        select: '_id fullname bizfullname sign image position department',
                        model: 'user',
                        match: conditionObj
                    }

                    let conditionPopulate2 = {
                        path: '_id.position',
                        select: 'name sign',
                        model: 'position',
                    }

                    let conditionPopulate3 = {
                        path: '_id.department',
                        select: 'name sign modifyAt',
                        model: 'department',
                    }

                    await PCM_PLAN_TASK_COLL.populate(listUser, conditionPopulate);
                    await PCM_PLAN_TASK_COLL.populate(listUser, conditionPopulate2);
                    await PCM_PLAN_TASK_COLL.populate(listUser, conditionPopulate3);
                    listUserOfCompany = listUser.map(item => item._id).filter(Boolean);
                }

                if(option == 2){
                    conditionGroup = {
                        _id: "$project",
                        count: { $sum: 1 }
                    }

                    /**
                     * DANH SÁCH DỰ ÁN MÀ USER CÔNG TY THAM GIA THỰC HIỆN
                     */
                    let listProject = await PCM_PLAN_TASK_COLL.aggregate([
                        { $match: objCodition },
                        { $group: { _id: "$project" } },
                        { $sort: { _id: -1} }
                    ]);
                    // console.log(listProject)

                    let conditionObj = {}

                    if(keyword){
                        keyword = keyword.split(" ");
                        keyword = '.*' + keyword.join(".*") + '.*';
                        conditionObj.name = new RegExp(keyword, 'i');
                    }
                    let conditionPopulate = {
                        path: '_id',
                        select: '_id name sign image modifyAt',
                        options: { sort: { 'modifyAt': -1 } },
                        model: 'department',
                        match: conditionObj
                    }

                    await PCM_PLAN_TASK_COLL.populate(listProject, conditionPopulate);
                    listProjectOfCompany = listProject.map(item => item._id).filter(Boolean);
                }

                /**
                 * Việc quá hạn
                 */
                let start = new Date();
                start.setHours(0,0,0,0);

                let conditionSearchTask = {
                    companyOfAssignee: ObjectID(companyID)
                }

                if(subtype){
                    conditionSearchTask.subtype = +subtype;
                }

                if(projectID && checkObjectIDs(projectID)){
                    conditionSearchTask.project = ObjectID(projectID);
                }

                let listTaskOverdueWork = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            ...conditionSearchTask,
                            actualFinishTime: {
                                $lt: start,
                                $exists: true,
                                $ne: null
                            },
                            status: { $ne: 3 }
                        }
                    },
                    {
                        $group: conditionGroup
                    },
                    { $sort: { _id: -1 }},
                ]);

                let listTaskNextWeekWork = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            ...conditionSearchTask,
                            actualFinishTime: {
                                $gte: start,
                                $lt: addDate(7),
                                $exists: true,
                                $ne: null
                            },
                            status: { $ne: 3 }
                        }
                    },
                    {
                        $group: conditionGroup
                    },
                    { $sort: { _id: -1 }},
                ]);

                let listTaskMoreThan7Days = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            ...conditionSearchTask,
                            actualFinishTime: {
                                $gte: addDate(7),
                                $exists: true,
                                $ne: null
                            },
                            status: { $ne: 3 }
                        }
                    },
                    {
                        $group: conditionGroup
                    },
                    { $sort: { _id: -1 }},
                ]);

                let listTaskFinish = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            ...conditionSearchTask,
                            status: 3
                        }
                    },
                    {
                        $group: conditionGroup
                    },
                    { $sort: { _id: -1 }},
                ]);

                return resolve({ error: false, data: {
                    listUserOfCompany, listProjectOfCompany,
                    listTaskOverdueWork, listTaskNextWeekWork,  listTaskMoreThan7Days, listTaskFinish
                    }
                })

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Lấy số lượng công việc của companyOfAssignee trong dự án V2
     * Author: Depv
     * Code:
     */
    getAmountTaskOfCompanyOfAssigneeV2({ projectID, keyword, subtype, ctx }){
        // console.log('==================Tổng hợp theo đơn vị thực hiện trong DỰ ÁN================>>>>>>>>>>>>>>>>>')
        // console.log({ projectID, keyword, subtype })
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(projectID))
                    return resolve({ error: true, message: 'projectID_invalid' });

                let objectSearch = {
                    project: ObjectID(projectID), companyOfAssignee: { $exists: true },
                }

                if(subtype){
                    objectSearch.subtype = +subtype;
                }

                let listCompanyOfAssignee = await PCM_PLAN_TASK_COLL.aggregate([
                    { $match: objectSearch },
                    { $group: { _id: "$companyOfAssignee" } },
                    { $sort: { _id: -1} }
                ]);

                let conditionObjCompany = {};
                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObjCompany.name = new RegExp(keyword, 'i');
                }

                let conditionPopulate = {
                    path: '_id',
                    select: '_id name sign image',
                    model: 'company',
                    match: conditionObjCompany
                }

                let listData = await PCM_PLAN_TASK_COLL.populate(listCompanyOfAssignee, conditionPopulate);
                // console.log(listData)

                // let listCompany = listCompanyOfAssignee.map(item => item._id).filter(Boolean);
                let listCompany = listCompanyOfAssignee.map(item => item._id).filter(Boolean);
                // console.log(listCompany)

                let start = new Date();
                start.setHours(0,0,0,0);

                let conditionSearchTask = {
                    project: ObjectID(projectID),
                    companyOfAssignee: { $exists: true },
                }

                if(subtype){
                    conditionSearchTask.subtype = +subtype;
                }

                let listCompanyAndTaskOverdueWork = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            ...conditionSearchTask,
                            actualFinishTime: {
                                $lt: start,
                                $exists: true,
                                $ne: null
                            },
                            status: { $ne: 3 }
                        }
                    },
                    {
                        $group: {
                            _id: "$companyOfAssignee",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 }},
                ]);

                let listCompanyAndTaskNextWeekWork = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            ...conditionSearchTask,
                            actualFinishTime: {
                                $gte: start,
                                $lt: addDate(7),
                                $exists: true,
                                $ne: null
                            },
                            status: { $ne: 3 }
                        }
                    },
                    {
                        $group: {
                            _id: "$companyOfAssignee",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 }},
                ]);

                let listCompanyAndTaskMoreThan7Days = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            ...conditionSearchTask,
                            actualFinishTime: {
                                $gte: addDate(7),
                                $exists: true,
                                $ne: null
                            },
                            status: { $ne: 3 }
                        }
                    },
                    {
                        $group: {
                            _id: "$companyOfAssignee",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 }},
                ]);

                let listCompanyAndTaskFinish = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            ...conditionSearchTask,
                            status: 3
                        }
                    },
                    {
                        $group: {
                            _id: "$companyOfAssignee",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 }},
                ]);

                return resolve({ error: false, data: {
                    listCompany,
                    listCompanyAndTaskOverdueWork, listCompanyAndTaskNextWeekWork,  listCompanyAndTaskMoreThan7Days,
                    listCompanyAndTaskFinish
                    } });

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Lấy số lượng công việc của companyOfAuthor trong dự án V2
     * Author: Depv
     * Code:
     */
    getAmountTaskOfCompanyOfAuthorV2({ projectID, keyword, subtype, ctx }){
        // console.log('==================Tổng hợp theo đơn vị thực hiện trong DỰ ÁN================>>>>>>>>>>>>>>>>>')
        // console.log({ projectID, keyword, subtype })
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(projectID))
                    return resolve({ error: true, message: 'projectID_invalid' });
                let objectSearch = {
                    project: ObjectID(projectID),
                    companyOfAuthor: { $exists: true },
                    parent: { $exists: false },
                }

                if(subtype){
                    objectSearch.subtype = +subtype;
                }

                let listCompanyOfAuthor = await PCM_PLAN_TASK_COLL.aggregate([
                    { $match: objectSearch },
                    { $group: { _id: "$companyOfAuthor" } },
                    { $sort: { _id: -1} }
                ]);

                let conditionObjCompany = {};
                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObjCompany.name = new RegExp(keyword, 'i');
                }
                let conditionPopulate = {
                    path: '_id',
                    select: '_id name sign image',
                    model: 'company',
                    match: conditionObjCompany
                }

                await PCM_PLAN_TASK_COLL.populate(listCompanyOfAuthor, conditionPopulate);
                let listCompany = listCompanyOfAuthor.map(item => item._id).filter(Boolean);
                let start = new Date();
                start.setHours(0,0,0,0);

                let conditionSearchTask = {
                    project: ObjectID(projectID),
                    companyOfAuthor: { $exists: true },
                    parent: { $exists: false },
                }

                if(subtype){
                    conditionSearchTask.subtype = +subtype;
                }

                let listCompanyAndTaskOverdueWork = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            ...conditionSearchTask,
                            actualFinishTime: {
                                $lt: start,
                                $exists: true,
                                $ne: null
                            },
                            status: { $ne: 3 }
                        }
                    },
                    {
                        $group: {
                            _id: "$companyOfAuthor",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 }},
                ]);

                let listCompanyAndTaskNextWeekWork = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            ...conditionSearchTask,
                            actualFinishTime: {
                                $gte: start,
                                $lt: addDate(7),
                                $exists: true,
                                $ne: null
                            },
                            status: { $ne: 3 }
                        }
                    },
                    {
                        $group: {
                            _id: "$companyOfAuthor",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 }},
                ]);

                let listCompanyAndTaskMoreThan7Days = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            ...conditionSearchTask,
                            actualFinishTime: {
                                $gte: addDate(7),
                                $exists: true,
                                $ne: null
                            },
                            status: { $ne: 3 }
                        }
                    },
                    {
                        $group: {
                            _id: "$companyOfAuthor",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 }},
                ]);

                let listCompanyAndTaskFinish = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            ...conditionSearchTask,
                            status: 3
                        }
                    },
                    {
                        $group: {
                            _id: "$companyOfAuthor",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 }},
                ]);

                return resolve({ error: false, data: {
                    listCompany,
                    listCompanyAndTaskOverdueWork, listCompanyAndTaskNextWeekWork,  listCompanyAndTaskMoreThan7Days,
                    listCompanyAndTaskFinish
                    } });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Lấy số lượng công việc theo milestone
     * Author: Depv
     * Code:
     */
    getAmountTaskByMilestone({ projectID, ctx }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(projectID))
                    return resolve({ error: true, message: 'projectID_invalid' });

                let start = new Date();
                start.setHours(0,0,0,0);

                let taskOverdueWork = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            project: ObjectID(projectID),
                            milestone: { $exists: true },
                            actualFinishTime: {
                                $lt: start,
                                $exists: true,
                                $ne: null
                            },
                            status: { $ne: 3 }
                        }
                    },
                    {
                        $group: {
                            _id: "$milestone",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 }},
                ]);

                let taskNextWeekWork = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            project: ObjectID(projectID),
                            milestone: { $exists: true },
                            actualFinishTime: {
                                $gte:  moment(start).startOf('day')._d,
                                $lt: moment(addDate(7)).endOf('day')._d,
                                $exists: true,
                                $ne: null
                            },
                            status: { $ne: 3 }
                        }
                    },
                    {
                        $group: {
                            _id: "$milestone",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 }},
                ]);

                let taskMoreThan7Days = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            project: ObjectID(projectID),
                            milestone: { $exists: true },
                            actualFinishTime: {
                                $gte: addDate(7),
                                $exists: true,
                                $ne: null
                            },
                            status: { $ne: 3 }
                        }
                    },
                    {
                        $group: {
                            _id: "$milestone",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 }},
                ]);

                let taskFinish = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            project: ObjectID(projectID),
                            milestone: { $exists: true },
                            status: 3
                        }
                    },
                    {
                        $group: {
                            _id: "$milestone",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 }},
                ]);

                let taskAll = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            project: ObjectID(projectID),
                            milestone: { $exists: true },
                        }
                    },
                    {
                        $group: {
                            _id: "$milestone",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 }},
                ]);

                return resolve({ error: false, data: {
                    taskOverdueWork, taskNextWeekWork, taskMoreThan7Days, taskAll, taskFinish
                } });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Lấy số lượng công việc của tất cả project mà user là members
     * Author: Depv
     */
    getAmountTaskByProjects({ userID, fromDate, toDate, ctx }){
        return new Promise(async resolve => {
            try {
                // Call service list project
                let listProject = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST_IS_MEMBERS}`, {
                    unLimit: true, select: "sign name", populates: JSON.stringify({
                        path: "company",
                        select: "name sign"
                    })
                });
                listProject       = listProject?.data|| [];
                let listProjectID = listProject.map(project => ObjectID(project._id));
                let conditionObj = { project: { $in: listProjectID } };
                if(fromDate && toDate){
                    conditionObj.createAt = { $gte: new Date(fromDate), $lt: moment(toDate, 'YYYY-MM-DD').endOf('day')._d }
                }
                // Số lượng công việc trong mỗi dự án
                let listAmountTask = await PCM_PLAN_TASK_COLL.aggregate([
                    { $match: conditionObj },
                    { $group: {
                        _id: "$project",
                        amount: { $sum: 1 }
                    }},
                    { $sort: { _id: -1} }
                ]);

                let start = new Date();
                start.setHours(0,0,0,0);

                // Số lượng công việc quá hạn
                let listAmountTaskOverdueWork = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            project: { $in: listProjectID } ,
                            status: { $ne: 3 },
                            actualFinishTime: {
                                $lt: start,
                                $exists: true,
                                $ne: null
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$project",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 }},
                ]);

                // Số lượng công việc Tuần tới
                let listAmountTaskNextWeekWork = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            project: { $in: listProjectID } ,
                            status: { $ne: 3 },
                            actualFinishTime: {
                                $gte: start,
                                $lt: addDate(7),
                                $exists: true,
                                $ne: null
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$project",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 }},
                ]);

                // Số lượng công việc > 7 ngày tới
                let listAmountTaskMoreThan7Days = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            project: { $in: listProjectID } ,
                            status: { $ne: 3 },
                            actualFinishTime: {
                                $gte: addDate(7),
                                $exists: true,
                                $ne: null
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$project",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 }},
                ]);

                // Số lượng công việc hoàn thành
                let listAmountTaskFinish = await PCM_PLAN_TASK_COLL.aggregate([
                    {
                        $match: {
                            project: { $in: listProjectID } ,
                            status: 3,
                        }
                    },
                    {
                        $group: {
                            _id: "$project",
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: -1 }},
                ]);

                return resolve({ error: false, data: { listProject, listAmountTask, listAmountTaskOverdueWork, listAmountTaskNextWeekWork, listAmountTaskMoreThan7Days, listAmountTaskFinish } });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: Di chuyển công việc đến việc cha
     * Date: 22/04/2022
	 */
    moveTaskToParent({ parentID, taskID, userID }) {
        // console.log({ parentID, taskID, userID })
        return new Promise(async resolve => {
            try {
                const validation = validateParamsObjectID({
                    parentID,
                    taskID,
                    userID
                })
                if(validation.error) return resolve(validation);

                if(parentID.toString() == taskID.toString()) {
                    return resolve({
                        error: true,
                        message: 'Không thể tự di chuyển vào chính công việc này',
                        keyError: 'error_occurred',
                        status: 422
                    });
                }

                /**
                 * Thông tin công việc cha
                 */
                const infoParent = await PCM_PLAN_TASK_COLL.findById(parentID)

                if(!infoParent) {
                    return resolve({
                        error: true,
                        message: 'Công việc cha không tồn tại',
                        keyError: 'parent_task_not_exists',
                        status: 400
                    });
                }

                const { project } = infoParent;

                /**
                * Gán project từ việc cha sang việc con (không gán Group)
                * - Chỉ cho phép người tạo việc, thực hiện di chuyển
                * - Tăng số lượng subtask của task cha
                */
                const result = await PCM_PLAN_TASK_COLL.findOneAndUpdate({
                    _id: taskID,
                    project,
                    // $or: [
                    //     { author: userID },
                    //     { assignee: userID },
                    // ]
                },
                {
                    $set: {
                        parent: parentID,
                    },
                }, { new: true })

                // Cập nhật số lượng công việc con của việc cha
                await PCM_PLAN_TASK_COLL.findByIdAndUpdate(parentID,
                {
                    $inc: {
                        amountSubtask: 1,
                    }
                }, { new: true })

                if(!result) {
                    return resolve({
                        error: true,
                        message: 'Di chuyển không thành công (công việc không tồn tại hoặc không cùng dự án)',
                        keyError: 'error_occurred',
                        status: 422
                    });
                }

                return resolve({ error: false, data: result, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: Di chuyển công việc đến nhóm dữ liệu khác (trong cùng dự án)
     * Date: 22/04/2022
	 */
    moveTaskToGroup({ groupID, taskID, userID }) {
        return new Promise(async resolve => {
            try {
                const validation = validateParamsObjectID({
                    groupID,
                    taskID,
                    userID
                })

                if(validation.error) return resolve(validation);

                const infoGroup = await PCM_PLAN_GROUP_COLL.findById(groupID);

                if(!infoGroup) {
                    return resolve({
                        error: true,
                        message: 'Nhóm dữ liệu không tồn tại',
                        keyError: 'group_not_exists',
                        status: 400
                    });
                }

                const result = await PCM_PLAN_TASK_COLL.findOneAndUpdate({
                    _id: taskID,
                    project: infoGroup.project,
                    $or: [
                        { author: userID },
                        { assignee: userID },
                    ]
                }, {
                    $set: {
                        group: groupID
                    }
                }, { new: true })

                if(!result) {
                    return resolve({
                        error: true,
                        message: 'Di chuyển không thành công (công việc không tồn tại hoặc không cùng dự án)',
                        keyError: 'error_occurred',
                        status: 422
                    });
                }

                return resolve({ error: false, data: result, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Dev: MinhVH
     * Func: Copy child task
     * Date: 01/09/2022
     */
    cloneChildTask({ parentId, parentTask, isDraftTask, callback = null }) {
        return new Promise(async resolve => {
            try {
                const listTasks = await PCM_PLAN_TASK_COLL
                    .find({ parent: parentId })
                    .populate('parent', 'startTime expiredTime')
                    .lean();

                if(!listTasks || !listTasks.length) {
                    return resolve({
                        results: [],
                        errors: ['not found tasks']
                    })
                }

                const { results, errors } = await PromisePool
                    .for(listTasks)
                    .withConcurrency(4)
                    .process(async childTask => {
                        const childTaskID = childTask._id;

                        // Thời gian bắt đầu task cha (1)
                        let startTime = childTask.parent?.startTime;

                        // Deadline task con (2)
                        let expiredTime = childTask.expiredTime;

                        // Tổng ngày từ startTime task cha -> deadline task con (3)
                        let totalDayStartTimeToExpiredTime = calculateExpireTime(startTime, expiredTime, 'days');

                        /**
                         * Lấy startTime của task cha (new) + thêm (3)
                         * => Deadline mới cho task con (new)
                         */
                        let newExpiredTime = moment(parentTask.startTime, "DD-MM-YYYY")
                            .add(totalDayStartTimeToExpiredTime, 'days');

                        let suid = await stringUtils.randomAndCheckExists(PCM_PLAN_TASK_COLL, 'suid');

                        // console.log({
                        //     startTimeParentTask: parentTask.startTime,
                        //     oldStartTimeParentTask: startTime,
                        //     expiredTime,
                        //     totalDayStartTimeToExpiredTime,
                        //     newExpiredTime,
                        //     childID: childTask._id,
                        //     parentID: parentTask._id,
                        // })

                        delete childTask._id;
                        const newChildTask = await PCM_PLAN_TASK_COLL.create({
                            ...childTask,
                            suid,
                            parent: parentTask._id,
                            startTime: new Date(),
                            actualStartTime: new Date(),
                            expiredTime: new Date(newExpiredTime),
                            actualFinishTime: new Date(newExpiredTime),
                            draft: isDraftTask ? 1 : 0,
                        })

                        if(callback) {
                            await callback(childTaskID, newChildTask);
                        }

                        return newChildTask;
                    })

                return resolve({ results, errors });
            } catch(error) {
                return resolve({
                    results: [],
                    errors: [error.message]
                });
            }
        })
    }

    /**
     * Dev: MinhVH
     * Func: Copy task
     * Date: 22/04/2022
     * Updated: 01/09/2022 - MinhVH
     */
    copyTask({
        taskID, name, projectID, groupID, assigneeID, relatedIDs,
        authorAttachs, type, subtype, description, startTime, expiredHour,
        expiredTime, contractID, isDraftTask, isCloneChildTask,
        userID, bizfullname, ctx
    }) {
        return new Promise(async resolve => {
            try {
                const validation = validateParamsObjectID({
                    taskID          : { value: taskID, isRequire: true },
                    projectID       : { value: projectID, isRequire: true },
                    groupID         : { value: groupID, isRequire: true },
                    assigneeID      : { value: assigneeID, isRequire: true },
                    relatedIDs      : { value: relatedIDs, isRequire: false },
                    contractID      : { value: contractID, isRequire: false },
                    authorAttachs   : { value: authorAttachs, isRequire: false },
                    userID          : { value: userID, isRequire: true },
                });
                if(validation.error) return resolve(validation);

                const infoOldTask = await PCM_PLAN_TASK_COLL
                    .findById(taskID)
                    .lean();

                if(!infoOldTask) {
                    return resolve({
                        error: true,
                        message: 'Công việc cũ không tồn tại',
                        keyError: 'old_task_not_exists',
                        status: 400
                    });
                }

                const { amountoftime, parent } = infoOldTask;

                // Clone task
                const infoAfterCloneTask = await this.insert({
                    name,
                    description,
                    projectID,
                    groupID,
                    contractID,
                    authorID: userID,
                    assigneeID,
                    relatedIDs,
                    parentID: parent,
                    authorAttachs,
                    type,
                    subType: subtype,
                    startTime,
                    expiredHour,
                    expiredTime,
                    draft: isDraftTask ? 1 : 0,
                    amountoftime,
                    bizfullname,
                    ctx
                })
                if(infoAfterCloneTask.error) return resolve(infoAfterCloneTask);

                if(isCloneChildTask) {
                    // Clone child task (level 2)
                    await this.cloneChildTask({
                        parentId: taskID,
                        parentTask: infoAfterCloneTask.data,
                        isDraftTask,
                        callback: async (childTaskID, newChildTask) => {

                            // Clone grand child task (level 3)
                            await this.cloneChildTask({
                                parentId: childTaskID,
                                parentTask: newChildTask,
                                isDraftTask
                            })
                        }
                    })
                }

                return resolve({ error: false, data: infoAfterCloneTask?.data, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Gom nhóm theo thuộc tính
     * Author: Hiepnh
     * Date: 21/9/2022
     */
    getListByProperty({ userID, option, fromDate, toDate, projectID, companyID }){
        // console.log({ userID, option, fromDate, toDate, projectID, companyID })
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * 1-Lấy danh sách các công việc
                 * 2-Gom nhóm dữ liệu
                 */
                let conditionObj = {}
                //__________Danh sách các nhóm dữ liệu mà userID là members
                // let listGroups = await PCM_PLAN_GROUP_COLL.find({ members: { $in: [userID]} })

                // Lấy công việc mà user được quyền truy cập
                conditionObj.$or = [
                    { author: ObjectID(userID) },
                    { assignee: ObjectID(userID) },
                    { related: { $in: [ObjectID(userID)] }},
                    // { group: { $in: listGroups.map(item => item._id) }}, // Bỏ, vì việc tra cứu theo thẻ lọc mới cần đến. Còn lại đi theo đường thư mục
                ]

                /**
                 * Tính tổng số lượng theo các phân loại của Nhà thầu
                 */
                if(option == 1 || option == 2){
                    let listTasks = await PCM_PLAN_TASK_COLL.find(conditionObj).select('_id')
                    // let listTasks = await PCM_PLAN_TASK_COLL.find({accessUsers: {$in: [userID]}}).select('_id')
                    // console.log(listTasks)

                    let objectGroup, conditionPopulateProject, conditionPopulateCompany, sortProject, sortCompany

                    if(option == 1){
                        conditionPopulateProject = {
                            path: '_id.project',
                            select: '_id name sign image',
                            model: 'department'
                        }

                        conditionPopulateCompany = {
                            path: '_id.companyOfAuthor',
                            select: '_id name sign image',
                            model: 'company'
                        }

                        objectGroup = { project: '$project', companyOfAuthor: '$companyOfAuthor' }

                        sortProject = { "_id.project": 1 }
                        sortCompany = { "_id.companyOfAuthor": 1 }
                    }

                    if(option == 2){

                        conditionPopulateProject = {
                            path: '_id.project',
                            select: '_id name sign image',
                            model: 'department'
                        }

                        conditionPopulateCompany = {
                            path: '_id.companyOfAssignee',
                            select: '_id name sign image',
                            model: 'company'
                        }

                        objectGroup = { project: '$project', companyOfAssignee: '$companyOfAssignee' }

                        sortProject = { "_id.project": 1 }
                        sortCompany = { "_id.companyOfAssignee": 1 }
                    }

                    let listDataProject = await PCM_PLAN_TASK_COLL.aggregate([
                        {
                            $match: {
                                _id: {$in: listTasks.map(item=>item._id)}
                            }
                        },
                        {
                            $group: {
                                _id: { project: '$project' },
                                amount: { $sum: 1 },
                            }
                        },
                        { $sort: sortProject},
                    ])

                    let listDataProjectCompany = await PCM_PLAN_TASK_COLL.aggregate([
                        {
                            $match: {
                                _id: {$in: listTasks.map(item=>item._id)}
                            }
                        },
                        {
                            $group: {
                                _id: objectGroup,
                                amount: { $sum: 1 },
                            }
                        },
                        { $sort: sortCompany},
                    ])

                    if(listDataProject.length){
                        await DEPARTMENT_COLL.populate(listDataProject, conditionPopulateProject)
                    }
                    // console.log(listDataProject)

                    if(listDataProjectCompany.length){
                        await DEPARTMENT_COLL.populate(listDataProjectCompany, conditionPopulateCompany)
                    }
                    // console.log(listDataProjectCompany)

                    return resolve({ error: false, data: { listDataProject, listDataProjectCompany } });
                }

                // Danh sách các công việc theo phân loại
                if(option == 3){
                    // console.log(conditionObj)
                    conditionObj.project = ObjectID(projectID)
                    conditionObj.companyOfAuthor = ObjectID(companyID)
                    let listDataTasks = await PCM_PLAN_TASK_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $group: {
                                _id: { subtype: '$subtype' },
                                amount: { $sum: 1 },
                            }
                        },
                    ])

                    return resolve({ error: false, data: listDataTasks });
                }

                if(option == 4){
                    // console.log(conditionObj)
                    conditionObj.project = ObjectID(projectID)
                    conditionObj.companyOfAssignee = ObjectID(companyID)
                    let listDataTasks = await PCM_PLAN_TASK_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $group: {
                                _id: { subtype: '$subtype' },
                                amount: { $sum: 1 },
                            }
                        },
                    ])

                    return resolve({ error: false, data: listDataTasks });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Dev: Depv
     * Func: Download excel task
     * Date: 15/09/2022
     */
    downloadExcelTask({ option = 1, conditionDownload, userID }) {
        return new Promise(async resolve => {
            try {

                const getPercentageCompletion = (startTimeX, expiredTimeX) => {
                    let startTime  = moment(startTimeX);
                    let endTime    = moment(expiredTimeX);
                    let toDateTime = moment();

                    let percentageCompletion = Math.round(100*(toDateTime - startTime)/(endTime - startTime));
                    if(percentageCompletion > 100){
                        percentageCompletion = 100;
                    }

                    if(!percentageCompletion){
                        percentageCompletion = 0;
                    }

                    if(percentageCompletion == "-Infinity"){
                        percentageCompletion = 0;
                    }

                    return percentageCompletion;
                }
                conditionDownload = JSON.parse(conditionDownload);
                const dataTaskByCondition = await this.getList({
                    ...conditionDownload,
                    select: 'name expiredTime startTime percentage author assignee description status unit quantity unitPrice amount urgent difficult factor ontime quality bugType judgement amountComment expiredTime approver timeApproved finishTime',
                    populates: JSON.stringify({
                        path: 'assignee approver bugType project',
                        select: 'bizfullname name sign'
                    }),
                    unlimited: true,
                    userID
                })

                if(!dataTaskByCondition || !dataTaskByCondition?.data) {
                    return resolve({
                        error: true,
                        message: 'Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục',
                        keyError: 'error_occurred',
                        status: 422
                    });
                }

                const listTaskPin = dataTaskByCondition?.data || [];

                if(!option){
                    XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/pcm_13_TaskPin.xlsm')))
                    .then(async workbook => {

                        let indexExcel = 4;

                        listTaskPin.map((infoTask, index) => {
                            workbook.sheet("Data").row(indexExcel).cell(1).value(index+1);
                            workbook.sheet("Data").row(indexExcel).cell(2).value(infoTask.name);
                            workbook.sheet("Data").row(indexExcel).cell(3).value(infoTask.expiredTime);

                            workbook.sheet("Data").row(indexExcel).cell(4).value(`${infoTask.percentage}/${getPercentageCompletion(infoTask.startTime, infoTask.expiredTime)}`);

                            workbook.sheet("Data").row(indexExcel).cell(5).value(infoTask.assignee?.bizfullname);

                            if (infoTask.description) {
                                // workbook.sheet("Data").row(indexExcel).cell(8).value(removeHtmlTag(infoTask.description));
                                workbook.sheet("Data").row(indexExcel).cell(8).value(infoTask.description);
                            }

                            workbook.sheet("Data").row(indexExcel).cell(9).value(PCM_STATUS_TASK[infoTask.status - 1].text);

                            indexExcel++;
                        })

                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `List-task-${now.getTime()}.xlsm`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                        await workbook.toFileAsync(pathWriteFile);

                        const result = await uploadFileS3(pathWriteFile, fileName);
                        fs.unlinkSync(pathWriteFile);

                        return resolve({ error: false, data: result?.Location, status: 200 });
                    });
                }else{
                    if(option == 1){
                        XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/pcm_human_kpi.xlsx')))
                        .then(async workbook => {

                            let indexExcel = 7;

                            listTaskPin.map((infoTask, index) => {
                                workbook.sheet("KPI").row(indexExcel).cell(1).value(index+1);
                                workbook.sheet("KPI").row(indexExcel).cell(2).value(infoTask.project?.sign);
                                workbook.sheet("KPI").row(indexExcel).cell(3).value(infoTask.name);
                                workbook.sheet("KPI").row(indexExcel).cell(4).value(infoTask.assignee?.bizfullname);
                                workbook.sheet("KPI").row(indexExcel).cell(5).value(PCM_STATUS_TASK[infoTask.status - 1].text);
                                workbook.sheet("KPI").row(indexExcel).cell(6).value(`${infoTask.percentage}/${getPercentageCompletion(infoTask.startTime, infoTask.expiredTime)}`);
                                workbook.sheet("KPI").row(indexExcel).cell(7).value(infoTask.unit);
                                workbook.sheet("KPI").row(indexExcel).cell(8).value(Number(infoTask.quantity || 0));
                                workbook.sheet("KPI").row(indexExcel).cell(9).value(Number(infoTask.unitPrice || 0));
                                workbook.sheet("KPI").row(indexExcel).cell(10).value(Number(infoTask.amount || 0));
                                if (infoTask.description) {
                                    // workbook.sheet("Data").row(indexExcel).cell(11).value(removeHtmlTag(infoTask.note));
                                    workbook.sheet("KPI").row(indexExcel).cell(11).value(infoTask.description);
                                }
                                workbook.sheet("KPI").row(indexExcel).cell(12).value(Number(infoTask.urgent));
                                workbook.sheet("KPI").row(indexExcel).cell(13).value(Number(infoTask.difficult));
                                workbook.sheet("KPI").row(indexExcel).cell(14).value(Number(infoTask.factor));
                                workbook.sheet("KPI").row(indexExcel).cell(15).value(Number(infoTask.ontime));
                                workbook.sheet("KPI").row(indexExcel).cell(16).value(Number(infoTask.quality));
                                workbook.sheet("KPI").row(indexExcel).cell(17).value(infoTask.bugType?.name);
                                workbook.sheet("KPI").row(indexExcel).cell(18).value(infoTask.judgement);
                                workbook.sheet("KPI").row(indexExcel).cell(19).value(Number(infoTask.amountComment));
                                workbook.sheet("KPI").row(indexExcel).cell(20).value(infoTask.expiredTime);
                                workbook.sheet("KPI").row(indexExcel).cell(21).value(infoTask.approver?.bizfullname);
                                workbook.sheet("KPI").row(indexExcel).cell(22).value(infoTask.timeApproved);

                                indexExcel++;
                            })

                            const now = new Date();
                            const filePath = '../../../files/temporary_uploads/';
                            const fileName = `task_report_${now.getTime()}.xlsx`;
                            const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                            await workbook.toFileAsync(pathWriteFile);

                            const result = await uploadFileS3(pathWriteFile, fileName);
                            fs.unlinkSync(pathWriteFile);

                            return resolve({ error: false, data: result?.Location, status: 200 });
                        });
                    }
                }
            } catch (error) {
                console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Dev: Depv
     * Func: Download template import excel
     * Date: 15/09/2022
     */
    downloadTemplateImportExcel({ projectID, userID }) {
        return new Promise(async resolve => {
            try {

                let infoProject = await DEPARTMENT_COLL.findById(projectID).populate({ path: "members", select: "fullname name" });
                if(infoProject.error)
                    return res.json(infoProject);

                let memberInProject     = infoProject.members;
                let planGroupInProject  = await PCM_PLAN_GROUP_COLL.find({ project: projectID, members: {$in: [userID]} }).select("name sign");
                let listContracts = await CONTRACT_COLL.find({ company: infoProject.company }).select('_id name sign').sort({_id: 1})

                // Modify the workbook.
                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/pcm_2_ImportTask.xlsm')))
                .then(async workbook => {
                    var i = 2;
                    planGroupInProject?.forEach((item, index) => {
                        workbook.sheet("Export").row(i).cell(1).value(`${item._id}`);
                        workbook.sheet("Export").row(i).cell(2).value(`${item.sign}-${item.name}`);
                        i++
                    });

                    var i = 2;
                    memberInProject.forEach((item, index) => {
                        workbook.sheet("Export").row(i).cell(4).value(`${item._id}`);
                        workbook.sheet("Export").row(i).cell(5).value(item.fullname);
                        i++
                    });

                    var i = 2;
                    listContracts.forEach((item, index) => {
                        workbook.sheet("Export").row(i).cell(7).value(`${item._id}`);
                        workbook.sheet("Export").row(i).cell(8).value(`${item.sign}-${item.name}`);
                        i++
                    });

                    const now = new Date();
                    const filePath = '../../../files/temporary_uploads/';
                    const fileName = `Template_import_task_${now.getTime()}.xlsm`;
                    const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                    await workbook.toFileAsync(pathWriteFile);
                    const result = await uploadFileS3(pathWriteFile, fileName);
                    fs.unlinkSync(pathWriteFile);
                    console.log({ result })
                    return resolve({ error: false, data: result?.Location, status: 200 });
                });

            } catch (error) {
                console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Dev: Depv
     * Func: Tạo task từ dữ liệu excel
     * Date: 15/09/2022
     */
    importTaskFromExcel({ taskID, dataImport, userID, ctx }) {
        return new Promise(async resolve => {
            try {
                const dataImportJSON = JSON.parse(dataImport);
                // console.log('=============Log data===================');
                // return console.log({ dataImportJSON });
                let index = 0;
                let errorNumber = 0;
                let parentID;
                for (const data of dataImportJSON) {
                    if(index > 0){
                        let dataInsert = {
                            name: data?.__EMPTY_1,
                            groupID: data?.__EMPTY_12,
                            authorID: userID,
                            sign: data?.__EMPTY_8,
                            type: data?.__EMPTY_9,
                            description: data?.__EMPTY_10,
                            startTime:  data?.__EMPTY_14,
                            expiredTime:  data?.__EMPTY_15,
                            assigneeID: data?.__EMPTY_13,
                            draft: data?.__EMPTY_17,
                            contractID: data?.__EMPTY_16,
                            subType: data?.__EMPTY_9,
                            ctx,
                        }

                        let listEmailRelates = data?.__EMPTY_5?.split(",");
                        let related = await USER_COLL.find({ email: { $in: listEmailRelates?.map(email => email.trim()) }}).select("_id")

                        if(related && related.length){
                            dataInsert.relatedIDs = related.map(item => ObjectID(item._id));
                        }

                        if(checkObjectIDs(taskID)){
                            dataInsert.parentID = taskID;
                        }

                        // Kiểm tra nếu có việc con
                        if(data.__EMPTY_2 && parentID){
                            dataInsert.parentID = parentID;
                            dataInsert.name = data.__EMPTY_2;
                        }

                        let infoGroup = await PCM_PLAN_GROUP_COLL.findById(data.__EMPTY_12).select("project");
                        if(!infoGroup){
                            errorNumber++;
                            return resolve({ error: true, message: "Nhóm dữ liệu không hợp lệ" });
                        }
                        // console.log({ dataInsert });

                        dataInsert.projectID = `${infoGroup.project}`;
                        let infoAfterInsert = await this.insert(dataInsert);
                        if(data?.__EMPTY_1){
                            parentID = infoAfterInsert?.data?._id;
                        }
                        if(infoAfterInsert.error){
                            errorNumber++;
                        }

                    }
                    index ++;
                }
                if(errorNumber != 0)
                    return resolve({ error: true, message: "import field" });
                console.log("Xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
                // Update timeImportExcel trick reload việc con
                await PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, { $set: { timeImportExcel: new Date() }}, { new: true });

                return resolve({ error: false, message: "import success" });
            } catch (error) {
                console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;