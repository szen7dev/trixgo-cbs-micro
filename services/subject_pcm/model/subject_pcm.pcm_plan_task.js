"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const PromisePool				        = require('@supercharge/promise-pool');
const ObjectID                          = require('mongoose').Types.ObjectId;
const moment                            = require('moment')

/**
 * Import utils, constants
 */
const { CF_DOMAIN_SERVICES } 		            = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 				        = require('../../file/helper/file.actions-constant');
const { CF_ACTIONS_AUTH }                       = require('../../auth/helper/auth.actions-constant');
const { CF_ACTIONS_ITEM } 		                = require('../../item/helper/item.actions-constant');
const { CF_ACTIONS_NOTIFICATION }               = require('../../notification/helper/notification.actions-constant');

const {
    checkObjectIDs,
    IsJsonString,
    validateParamsObjectID
} = require('../../../tools/utils/utils');

const stringUtils					            = require('../../../tools/utils/string_utils');
const { addDate }					            = require('../../../tools/utils/time_utils');
const { KEY_ERROR, APP_KEYS, LANGUAGE_KEYS }    = require('../../../tools/keys');
const { sendNoticeToMember }                    = require('../../../tools/mailer/module/notice_pcm_task');
const { ENV_DEVICE_WEB_CBS }                    = require('../../notification/helper/notification.keys-constant');
const { RANGE_BASE_PAGINATION_V2 } 	            = require('../../../tools/cursor_base/playground/index');

/**
 * import inter-coll, exter-coll
 */
const PCM_PLAN_TASK_COLL                = require('../database/subject_pcm.pcm_plan_task-coll');
const PCM_PLAN_GROUP_COLL               = require('../database/subject_pcm.pcm_plan_group-coll');
const PCM_FILE_MODEL                    = require('../model/subject_pcm.pcm_file-model').MODEL;

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
    insert({ projectID, groupID, authorID, name, description, sign, type, note, startTime, expiredTime, expiredHour, amountoftime, assigneeID, relatedIDs, progressType, parentID, docreID, messageID, contractID, documentID, boardID, reportID, groupReportID, draft, isproposal, template, workflowTemplateID, reminderExpired, hoursReminderExpired, draftExpired, hoursDraftExpired, addRelatedExpired, hoursAddRelatedExpired, fieldID, subType, authorAttachs, bizfullname, select, populates, ctx }) {
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = {};
                let infoGroup = null;
                let companyID = null;
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
                if(!parentID){
                    // call service department để lấy thông tin
                    let infoProject = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST}`, {
                        departmentID: projectID
                    })
                    /**
                     * Company lấy theo company của project
                     * Chứ không phải lấy theo company của user tạo task
                     */
                    companyID = infoProject?.data?.company;

                    if(!companyID)
                        return resolve({ error: true, message: "company_invalid", status: 400 });
                } else{
                    // Lấy thông tin công ty theo công việc cha
                    let infoTaskParent = await this.getInfo({
                        taskID: parentID,
                        userID: authorID,
                        populates: JSON.stringify({
                            path: 'author assignee',
                            select: '_id'
                        })
                    });

                    let { author, assignee, company, subtype } = infoTaskParent.data;
                    /**
                     * Check quyền nếu user là author hoặc assignee của công việc cha thì mới cho tạo
                     * Hiepnh: Cần bổ sung cả người liên quan cũng được tạo => đối với RFI
                     */
                    if(Number(subtype) != 1){
                        if(author._id.toString() != authorID.toString() && assignee._id.toString() != authorID.toString())
                            return resolve({ error: true, message: 'permission_denied', keyError: KEY_ERROR.PERMISSION_DENIED, status: 403 })
                    }
                    companyID = company._id;
                }

                infoGroup = await PCM_PLAN_GROUP_COLL.findById(groupID).select('_id contract property type');
                dataInsert = {
                    name,
                    company : companyID,
                    project : projectID,
                    group   : groupID,
                    assignee: assigneeID,
                    author  : authorID,
                    suid,
                    amountoftime: (amountoftime && !isNaN(amountoftime) ? Number(amountoftime) : 0),
                    type,
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

                // precalculated
                // companyOfAuthor
                // companyOfAssignee
                // subtype (Xử lý sau)
                // amountChecklist
                // amountFinishedChecklist
                // amountSubtask
                // amountFinishedSubtask
                // amountResponse
                // amountMarkedResponse
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
                }

                if(description){
                    dataInsert.description = description;
                }

                if(sign){
                    dataInsert.sign = sign;
                }

                if(note){
                    dataInsert.note = note;
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

                //_________B2.1 Kiểm tra có docreID hay không (nếu tạo từ tài liệu)
                if(docreID && ObjectID.isValid(docreID)){
                    dataInsert.docre = docreID;
                }

                //_________B2.2 Kiểm tra có messageID có hay không (nếu tạo từ tin nhắn)
                if(messageID && ObjectID.isValid(messageID)){
                    dataInsert.message = messageID;
                }

                //_________B2.3 Kiểm tra có contractID có hay không (nếu tạo từ ngân sách hợp đồng)
                if(contractID && ObjectID.isValid(contractID)){
                    dataInsert.contract = contractID;
                }else{
                    // Lấy theo group
                    if(infoGroup && infoGroup.contract){
                        dataInsert.contract = infoGroup.contract
                    }
                }
                //_________B2.4 Kiểm tra có contractID có hay không (nếu tạo từ văn bản)
                if(documentID && ObjectID.isValid(documentID)){
                    dataInsert.document = documentID;
                }

                if(fieldID && ObjectID.isValid(fieldID)){
                    dataInsert.field = fieldID;
                }

                //_________B2.5 Kiểm tra có boardID có hay không (nếu tạo từ board)
                if(boardID && ObjectID.isValid(boardID)){
                    dataInsert.board = boardID;
                }

                //_________Trường hợp tạo Đệ trình phê duyệt
                if(subType && !isNaN(subType)){
                    dataInsert.subtype = +subType;
                } else{
                    // Lấy theo group
                    if(infoGroup.type){
                        dataInsert.subtype = infoGroup.type;
                    }
                }

                //_________Phân loại khác
                if(infoGroup && infoGroup.property){
                    dataInsert.field = infoGroup.property;
                }

                //_________Việc nháp/chính thức
                if(draft && !isNaN(draft)){
                    dataInsert.draft = Number(draft);
                }

                //_________Trường hợp tạo mẫu Đệ trình (template)
                if(template && !isNaN(template)){
                    dataInsert.template = Number(template);
                }

                //relatedIDs thêm người liên quan chờ collections related_pcm_plan_task
                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "can't_insert_task", keyError: KEY_ERROR.INSERT_FAILED, status: 403 });

                // Cập nhật amountChecklist hoặc amountSubtask cho việc cha
                if(parentID && checkObjectIDs(parentID)){
                    // Việc con
                    if(type == 1){
                        await PCM_PLAN_TASK_COLL.findByIdAndUpdate(parentID, { $inc: { amountSubtask: 1 }})
                    } else{ // checklist
                        await PCM_PLAN_TASK_COLL.findByIdAndUpdate(parentID, { $inc: { amountChecklist: 1 }})
                    }
                }

                // if(Object.keys(dataAdditional).length) {
                //     infoAfterInsert = await PCM_PLAN_TASK_COLL.findByIdAndUpdate(infoAfterInsert._id, dataAdditional, { new: true });

                //     if(!infoAfterInsert)
                //         return resolve({ error: true, message: "Can't_update_task", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 });
                // }

                /**
                 * Tạo checklist hoặc việc con mới
                 * + Insert thông báo vào DB và bắn Cloud MSS
                 */
                if([1,2].includes(type)) {
                    let webUrl              = '';
                    let titleMSS            = '';
                    let descriptionMSS      = '';
                    let languageKey         = '';
                    let dataSend 		    = { app: APP_KEYS.PCM_PLAN_TASK };
                    let taskID              = parentID;
                    let isChecklist         = type === 2;

                    if(!parentID) {
                        taskID = infoAfterInsert._id;
                        webUrl = `/pcm/detail/${taskID}`;
                        languageKey = LANGUAGE_KEYS.CREATE_NEW_TASK;
                    } else {
                        webUrl = `/pcm/detail/${taskID}#${isChecklist ? 'checklist' : 'childtask'}_${infoAfterInsert._id}`;
                        languageKey = isChecklist ? LANGUAGE_KEYS.CREATE_CHECKLIST_PCM : LANGUAGE_KEYS.CREATE_CHILDTASK_PCM;
                    }

                    let infoTask = await PCM_PLAN_TASK_COLL.findById(taskID).lean();

                    let { name: taskName, author, assignee, related, project, contract } = infoTask;
                    related = related.map(userID => userID.toString());

                    let listReceivers = [...new Set([author.toString(), assignee.toString(), ...related])];
                    let arrReceiver = listReceivers.filter(receiverID => receiverID !== authorID.toString());

                    if(arrReceiver && arrReceiver.length) {
                        // CLOUD MSS
                        if(parentID) {
                            const infoAssignee = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_BY_ID}`, {
                                userID: assigneeID,
                                select: '_id'
                            });

                            if(!infoAssignee.error) {
                                arrReceiver = [infoAssignee?.data?._id];
                            }

                            dataSend = {
                                ...dataSend,
                                languageKey,
                                mainColl: {
                                    kind: 'pcm_plan_task',
                                    item: { _id: taskID }
                                },
                            };
                            titleMSS        = taskName;
                            descriptionMSS  = `${bizfullname} đã tạo 1 ${isChecklist ? 'checklist' : 'việc con'} cho bạn`;
                        } else {
                            dataSend = {
                                ...dataSend,
                                languageKey,
                                mainColl: {
                                    kind: 'pcm_plan_task',
                                    item: { _id: taskID }
                                }
                            };
                            titleMSS        = `THÔNG BÁO`;
                            descriptionMSS  = `${bizfullname} đã tạo 1 công việc mới`;
                        }

                        // INSERT NOTIFICATION
                        await ctx.call(`${CF_DOMAIN_SERVICES.NOTIFICATION}.${CF_ACTIONS_NOTIFICATION.INSERT_NOTIFICATION}`, {
                            content: name,
                            receivers: arrReceiver,
                            project: project?.toString(),
                            contract: contract?.toString(),
                            path: webUrl,
                            languageKey,
                            app: APP_KEYS.PCM_PLAN_TASK,
                            mainColl: {
                                kind: "pcm_plan_task",
                                item: taskID
                            },
                            subColl: {
                                kind: "pcm_plan_task",
                                item: infoAfterInsert._id
                            },
                            type: 1 // InApp (Socket)
                        })

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

                // Update amountTasks cho group;
                await PCM_PLAN_GROUP_COLL.findByIdAndUpdate(groupID, { $inc: { amountTasks: 1 }})
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
     * Author: Depv
     * Code:
     */
    update({ typeUpdate,
        taskID, sign, name, description, note, actualStartTime, actualFinishTime, amountoftime, amountPerHour, assigneeID, userID, progressType, fieldID, expiredHour,
        contractID, draft, subType, usersDeleteID, related, relatedRemoves, offtimeReason, offbudgetReason, templateID, priority, status, lock, signatures,
        links, authorAttachs, assigneeAttachs, percentage, judgement, overdue, score, urgent, difficult, finishTime, punish, approver, timeApproved, isAddSignature, isOpenBidding,
        valueApproved, bidPrice, bidPriceDiscount, bidPriceAdjustment, openedUsers, openedStatus, flags, flagsRemoves, lastLogID, bizfullname, companyOfUser, milestone, ctx
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

                if(!infoTask)
                    return resolve({ error: true, message: 'task_not_exists', status: 400 });

                /**
                 * Công việc phân loại "LỰA CHỌN NHÀ THẦU"
                 * -> Không được cập nhật task khi hồ sơ thầu đã mở
                 * -> Chỉ được cập nhật thêm người liên quan
                 */
                if(infoTask.subtype === 4 && infoTask.openedStatus === 1 && (!related && !related.length)) {
                    return resolve({
                        error: true,
                        message: 'Không thể cập nhật công việc khi hồ sơ thầu đã mở',
                        keyError: 'error_occurred',
                        status: 422
                    });
                }

                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                //_________Mã công việc
                if(sign){
                    dataUpdate.sign = sign;
                }
                //_________Tên công việc
                if(name){
                    dataUpdate.name = name;
                }
                //_________Mô tả
                if(description){
                    dataUpdate.description = description;
                }
                //_________Ghi chú
                if(note){
                    dataUpdate.note = note;
                }

                if(actualStartTime){
                    dataUpdate.actualStartTime = actualStartTime;
                }

                if(actualFinishTime){
                    dataUpdate.actualFinishTime = new Date(actualFinishTime);
                }
                //_________Dự kiến thời lượng (h)
                if(amountoftime){
                    dataUpdate.amountoftime = amountoftime;
                }
                //_________Đơn giá cho 1 giờ làm
                if(amountPerHour){
                    dataUpdate.amountPerHour = amountPerHour;
                }

                //_________người thực hiện
                if(checkObjectIDs(assigneeID)){
                    dataUpdate.assignee = assigneeID;
                }

                //_________userUpdate
                if(checkObjectIDs(userID)){
                    dataUpdate.userUpdate = userID;
                }
                //_________Phân loại tiến độ
                if(progressType){
                    dataUpdate.progressType = progressType;
                }
                //_________Tính chất
                if(checkObjectIDs(fieldID)){
                    dataUpdate.field = fieldID;
                }

                //_________Hợp đồng
                if(checkObjectIDs(contractID)){
                    dataUpdate.contract = contractID;
                }

                //_________Việc nháp
                if(draft === 0 && infoTask.draft === 1){
                    dataUpdate.draft = 0;
                    dataUpdate.companyOfAuthor = companyOfUser;
                    dataUpdate.author = userID;
                }

                //_________Phân loại công việc
                if(subType && !isNaN(subType)){
                    dataUpdate.subtype = +subType;
                }

                //_________User xóa task
                if(checkObjectIDs(usersDeleteID)){
                    dataAddToset = { ...dataAddToset, usersDelete: usersDeleteID }
                }

                //_________Thêm người liên quan
                if(checkObjectIDs(related)){
                    dataAddToset = { ...dataAddToset, related }
                }

                //_________Xoá người liên quan
                if(checkObjectIDs(relatedRemoves)){
                    dataPullAll = { ...dataPullAll, related: relatedRemoves }
                }

                if(checkObjectIDs(flagsRemoves)) {
                    dataPullAll = { ...dataPullAll, flags: flagsRemoves }
                }

                //_________Trạng thái công việc
                if(status){
                    dataUpdate.status = status;
                }

                //_________Số ngày chậm tiến độ
                if(offtimeReason){
                    dataUpdate.offtimeReason = offtimeReason;
                }

                //_________Giá trị vượt ngân sách
                if(offbudgetReason){
                    dataUpdate.offbudgetReason = offbudgetReason;
                }

                //_________Giá trị vượt ngân sách
                if(offbudgetReason){
                    dataUpdate.offbudgetReason = offbudgetReason;
                }

                //_________Phân loại công việc mẫu/thông thường
                if(checkObjectIDs(templateID)){
                    dataUpdate.template = templateID;
                }

                //_________Phân loại mức độ quan trọng (cao, bình thường, thấp, siêu cao)
                if(priority){
                    dataUpdate.priority = priority;
                }

                //_________Khoá/Mở
                if(lock){
                    dataUpdate.lock = lock;
                }

                //_________Ký duyệt xác nhận
                if(checkObjectIDs(signatures)){
                    dataAddToset = { ...dataAddToset, signatures }
                }

                //_________Các việc có liên quan kèm theo
                if(checkObjectIDs(links)){
                    dataAddToset = { ...dataAddToset, links }
                }

                //_________% hoàn thành (max = 100)
                if(percentage){
                    dataUpdate.percentage = percentage;
                }

                //_________Nhận xét
                if(judgement){
                    dataUpdate.judgement = judgement;
                }

                //_________Tiến độ
                if(overdue){
                    dataUpdate.overdue = overdue;
                }

                //_________Chất lượng
                if(score){
                    dataUpdate.score = score;
                }

                //_________Mức độ cấp bách
                if(urgent){
                    dataUpdate.urgent = urgent;
                }

                //_________Mức độ phức tạp
                if(difficult){
                    dataUpdate.difficult = difficult;
                }

                //_________Kết thúc thực tế
                if(finishTime){
                    dataUpdate.finishTime = finishTime;
                }

                //_________Giá trị bị phạt
                if(punish){
                    dataUpdate.punish = punish;
                }

                //_________Người phê duyệt
                if(checkObjectIDs(approver)){
                    dataUpdate.approver = approver;
                }

                //_________Thời điểm phê duyệt
                if(timeApproved){
                    dataUpdate.timeApproved = timeApproved;
                }

                //_________Giá trị phê duyệt/Giá phê duyệt trúng thầu
                if(valueApproved){
                    dataUpdate.valueApproved = valueApproved;
                }

                //_________Giá dự thầu
                if(bidPrice){
                    dataUpdate.bidPrice = bidPrice;
                }

                //_________Giảm giá dự thầu
                if(bidPriceDiscount){
                    dataUpdate.bidPriceDiscount = bidPriceDiscount;
                }

                //_________Giá dự thầu thừa/thiếu
                if(bidPriceAdjustment){
                    dataUpdate.bidPriceAdjustment = bidPriceAdjustment;
                }

                if(checkObjectIDs(lastLogID)){
                    dataUpdate.lastLog = lastLogID;
                }

                //_________User đồng ý mở thầu
                if(checkObjectIDs(openedUsers)){
                    dataAddToset = { ...dataAddToset, openedUsers }
                }

                //_________Hồ sơ thầu đã được mở hay chưa (0/1)
                if(checkObjectIDs(openedStatus)){
                    dataUpdate.openedStatus = openedStatus
                }

                //_________Những user đánh dấu quan tâm/start/bookmark
                if(checkObjectIDs(flags)){
                    dataAddToset = { ...dataAddToset, flags }
                }

                //_________Cột mốc
                if(!isNaN(milestone)){
                    dataUpdate.milestone = milestone;
                }

                if(expiredHour) {
                    const [month, day, year] = actualFinishTime.split('/');
                    const date = `${year}-${month}-${day}`;
                    const formatDate = new Date(`${date} ${expiredHour}`);

                    dataUpdate.actualFinishTime = formatDate;
                }

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
                }

                if(isOpenBidding) {
                    dataAddToset = { ...dataAddToset, openedUsers: userID }

                    const { openedStatus, openedUsers, related } = infoTask;

                    if(openedStatus === 0) {
                        const usersOpened = [...openedUsers, userID].map(item => item.toString());
                        const allUsersIsOpened = related.every(item => usersOpened.includes(item.toString()));

                        if(allUsersIsOpened) {
                            dataUpdate.openedStatus = 1;
                        }
                    }
                }

                //_________File của người tạo việc-cân nhắc bỏ do không linh hoạt phiên bản
                //  if(checkObjectIDs(authorAttachs)){
                //     dataAddToset = { ...dataAddToset, authorAttachs }
                // }

                //_________File của người thực hiện-cân nhắc bỏ do không linh hoạt phiên bản
                // if(checkObjectIDs(assigneeAttachs)){
                //     dataAddToset = { ...dataAddToset, assigneeAttachs }
                // }

                if(checkObjectIDs(authorAttachs)){
                    const result = await this.handleAddFiles({
                        infoTask, files: authorAttachs, authorID: userID, ctx
                    })

                    if(result.error) return resolve(result);

                    dataAddToset = { ...dataAddToset, authorAttachs };
                }

                if(checkObjectIDs(assigneeAttachs)){
                    const result = await this.handleAddFiles({
                        infoTask, files: assigneeAttachs, authorID: userID, ctx
                    })

                    if(result.error) return resolve(result);

                    dataAddToset = { ...dataAddToset, assigneeAttachs };
                }

                //_________Trường hợp cập nhật nhiều dữ liệu addToSet cùng 1 lúc
                if(dataAddToset){
                    dataUpdate.$addToSet = dataAddToset;
                }

                if(dataPullAll){
                    dataUpdate.$pullAll = dataPullAll;
                }

                let infoAfterUpdate = await PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, dataUpdate, { new: true });

                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Can't_update_task", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 });

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

                // Thêm người liên quan
                if(related && related.length) {
                    const relatedCurrent = infoTask.related.map(item => item.toString());
                    const newRelated = related.filter(item => !relatedCurrent.includes(item));

                    /**
                     * Thêm người liên quan trong công việc
                     * + Insert thông báo vào DB và bắn Cloud MSS
                     */
                    const webUrl = `/pcm/detail/${taskID}`;
                    let { name: taskName, project, contract } = infoAfterUpdate;

                    const dataSend = {
                        app: APP_KEYS.PCM_PLAN_TASK,
                        languageKey: LANGUAGE_KEYS.CREATE_RESPONSE_PCM,
                        mainColl: {
                            kind: 'pcm_plan_task',
                            item: { _id: taskID }
                        }
                    };

                    ctx.call(`${CF_DOMAIN_SERVICES.NOTIFICATION}.${CF_ACTIONS_NOTIFICATION.INSERT_NOTIFICATION}`, {
                        content: `đã thêm bạn làm người liên quan`,
                        receivers: newRelated,
                        project: project?.toString(),
                        contract: contract?.toString(),
                        path: webUrl,
                        languageKey: LANGUAGE_KEYS.ADD_RELATION_USER,
                        app: APP_KEYS.PCM_PLAN_TASK,
                        mainColl: {
                            kind: "pcm_plan_task",
                            item: taskID
                        },
                        type: 1 // InApp (Socket)
                    })

                    ctx.emit("NOTIFICATION__LOG_CREATE:MOBILE_WEB", {
                        users: newRelated,
                        title: taskName,
                        description: `${bizfullname} đã thêm bạn làm người liên quan`,
                        dataSend,
                        web_url: webUrl,
                        env: ENV_DEVICE_WEB_CBS
                    });
                }

                // Đồng ý phê duyệt
                if(isAddSignature) {
                    const { project, contract, related, assignee, author } = infoAfterUpdate;
                    const relatedUsers = related.map(item => item.toString());
                    const listReceivers = [...relatedUsers, assignee.toString(), author.toString()];
                    const receivers = listReceivers.filter(receiver => receiver !== userID.toString());

                    ctx.call(`${CF_DOMAIN_SERVICES.NOTIFICATION}.${CF_ACTIONS_NOTIFICATION.INSERT_NOTIFICATION}`, {
                        content: `đã phê duyệt 1 công việc`,
                        receivers,
                        project: project.toString(),
                        contract: contract?.toString(),
                        path: `/pcm/detail/${taskID}`,
                        languageKey: LANGUAGE_KEYS.ADD_SIGNATURE_TASK,
                        app: APP_KEYS.PCM_PLAN_TASK,
                        mainColl: {
                            kind: "pcm_plan_task",
                            item: taskID
                        },
                        type: 1 // InApp (Socket)
                    })
                }

                // Mở thầu
                if(isOpenBidding) {
                    const { project, contract, related, author } = infoAfterUpdate;
                    const relatedUsers = related.map(item => item.toString());
                    const listReceivers = [...relatedUsers, author.toString()];
                    const receivers = listReceivers.filter(receiver => receiver !== userID.toString());

                    ctx.call(`${CF_DOMAIN_SERVICES.NOTIFICATION}.${CF_ACTIONS_NOTIFICATION.INSERT_NOTIFICATION}`, {
                        content: `đã mở thầu`,
                        receivers,
                        project: project.toString(),
                        contract: contract?.toString(),
                        path: `/pcm/detail/${taskID}`,
                        languageKey: LANGUAGE_KEYS.OPEN_BIDDING,
                        app: APP_KEYS.PCM_PLAN_TASK,
                        mainColl: {
                            kind: "pcm_plan_task",
                            item: taskID
                        },
                        type: 1 // InApp (Socket)
                    })
                }

                // Cập nhật checklist thành công
                if(infoTask.type === 2 && status === 3) {
                    const { name: taskName, project, contract, related, assignee, author, parent } = infoAfterUpdate;
                    const relatedUsers = related.map(item => item.toString());
                    const listReceivers = [...relatedUsers, author.toString(), assignee.toString()];
                    const receivers = listReceivers.filter(item => item !== userID.toString());
                    const webUrl = `/pcm/detail/${parent}#checklist_${taskID}`;

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
                        web_url: webUrl,
                        env: ENV_DEVICE_WEB_CBS
                    });

                    ctx.call(`${CF_DOMAIN_SERVICES.NOTIFICATION}.${CF_ACTIONS_NOTIFICATION.INSERT_NOTIFICATION}`, {
                        content: `đã hoàn thành 1 checklist`,
                        receivers,
                        project: project?.toString(),
                        contract: contract?.toString(),
                        path: webUrl,
                        languageKey: LANGUAGE_KEYS.CHECK_DONE_CHECKLIST,
                        app: APP_KEYS.PCM_PLAN_TASK,
                        mainColl: {
                            kind: "pcm_plan_task",
                            item: parent
                        },
                        subColl: {
                            kind: "pcm_plan_task",
                            item: taskID
                        },
                        type: 1 // InApp (Socket)
                    })
                }

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: update status mutiple
     * Author: Depv
     * Code:
     */
    updateStatusMutiple({ taskIDs, parentID, type, userID }){
        return new Promise(async resolve => {
            try {
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

                return resolve({ error: false, message: "update_success" });
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

                // Nếu là công việc nháp, không phải là người tạo việc mà là người thực hiện thì không cho phép người thực hiện được vào xem
                if(Number(infoTaskToCheckPermission.draft) === 1 && isAssignee && !isAuthor &&!isRelated)
                    return resolve({ error: true, message: 'permission_denied', keyError: KEY_ERROR.PERMISSION_DENIED });

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
     * Code  :
     */
    getList({
        projectID, groupID, assigneeID, authorID, status, statusNe, draft, type, level, typeStatus, collection,
        subtype, isExpired, fromDate, toDate, signGroupOfTask, isChecklist, isChildTask, isPassPermision, sortKey, isParent,
        userID, parentID, companyOfAuthor, companyOfAssignee, fieldID, isSortChecklist, isSortChildTask, milestone,
        keyword, limit = 10, unlimit, lastestID, select, populates = {}
    }) {
        return new Promise(async (resolve) => {
            try {
                if(limit > 20){
                    limit = 20;
                } else{
                    limit = +limit;
                }

                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {
                    usersDelete: { $nin: [userID] },
                };

                if(statusNe){
                    conditionObj.status = { $ne: statusNe };
                }

                let sortBy;
                let keys	 = ['actualFinishTime__-1', '_id__-1'];
                if(isSortChecklist == 1 || isSortChildTask == 1){
                    keys = ['createAt__-1', '_id__-1'];
                }

                if (sortKey && typeof sortKey === 'string') {
                    if (!IsJsonString(sortKey))
                        return resolve({ error: true, message: 'Request params sortKey invalid', status: 400 });

                    keys = JSON.parse(sortKey);
                }

                let start = new Date();
                start.setHours(0,0,0,0);

                let end = new Date();
                end.setHours(23,59,59,999);

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                 //__________B1: Get danh sách các nhóm dữ liệu mà userID là members
                let listGroups = await PCM_PLAN_GROUP_COLL.find({ members: { $in: [userID]} })

                // Lấy công việc mà mình được quyền truy cập
                conditionObj.$or = [
                    { author: userID },
                    { assignee: userID },
                    { related: { $in: [userID] }},
                    { group: { $in: listGroups.map(item => item._id) }},
                ]

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

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */

                // Tìm kiếm nếu có trạng thái công việc
                if(status){
                    conditionObj.status = { $in: [status] }
                }

                // Tìm kiếm điều kiên công việc nhanh chậm
                if(isExpired && isExpired == 1){
                    //Việc bình thường
                    conditionObj.actualFinishTime = {
                        $gt: new Date(),
                        $exists: true,
                        $ne: null
                    }
                }

                if(isExpired && isExpired == 2){
                    //Việc chậm
                    conditionObj.status = { $ne: 3 }
                    conditionObj.actualFinishTime = {
                        $lt: new Date(),
                        $exists: true,
                        $ne: null
                    }
				}

                // Lấy những công việc từ ngày đến ngày
                if(fromDate && toDate){
                    conditionObj.actualFinishTime = {
                        $gte: new Date(fromDate), $lte: new Date(toDate),
                        $exists: true,
                        $ne: null
                    }
				}

                // lấy những việc nháp hoặc không phải việc nháp
                if(draft && [0,1].includes(draft)){
                    conditionObj.draft = draft;
                }

                // Lấy việc trong dự án
                if(projectID && checkObjectIDs(projectID)){
                    conditionObj.project = projectID;
                }
                /**
                * Phân loại chủ đề
                * 1-Công việc
                * 2-Checklist
                */
                if(collection){
                    conditionObj.type = collection;
                }

                //Phân loại công việc
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

                if(type == 1){
                    conditionObj.assignee = userID;
                    delete conditionObj.$or
                }

                if(type == 2){
                    conditionObj.author = userID;
                    delete conditionObj.$or
                }

                if(type == 3){
                    conditionObj.flags = { $in: [userID]};
                    delete conditionObj.$or
                    delete conditionObj.status
                }

                if(type == 4){
                    // conditionObj.author = userID;
                    conditionObj.$or = [
                        { author: userID },
                        { related: { $in: [userID] } },
                    ],
                    conditionObj.draft = 1;
                    delete conditionObj.status
                }

                if(type == 5){
                    conditionObj.related = { $in: [userID] };
                }

                if(level){
                    conditionObj.level = level;
                }

                // typeStatus
                // 1 Quá hạn
                // 2 Tới hạn tuần tới
                // 3 Tới hạn + 7 ngày tới
                // Lấy việc quá hạn
                if(typeStatus && typeStatus == 1){
                    conditionObj.actualFinishTime = {
                        $lt: start,
                        $exists: true,
                        $ne: null
                    }
                }

                // lấy việc tới hạn Tuần tới
                if(typeStatus && typeStatus == 2){
                    conditionObj.actualFinishTime = {
                        $gte:  moment(start).startOf('day')._d,
                        $lt: moment(addDate(7)).endOf('day')._d,
                        $exists: true,
                        $ne: null
                    }
                }

                // Tới hạn + 7 ngày tới
                if(typeStatus && typeStatus == 3){
                    conditionObj.actualFinishTime = {
                        $gte: addDate(7),
                        $exists: true,
                        $ne: null
                    }
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
                    // isChecklist == 1 là lấy danh sách checklist, nếu ko truyền isChecklist mà có truyền parentID thì sẽ lấy công việc con
                    if(isChecklist == 1){
                        conditionObj.type = 2;
                        delete conditionObj.status;
                    } else{
                        conditionObj.type = 1;
                    }

                    if(isChildTask == 1){
                        conditionObj.type = 1;
                        delete conditionObj.status;
                    }
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
                
                // Tìm kiếm theo keyword
				if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }

                if(groupID && checkObjectIDs(groupID)){
                    conditionObj.group = groupID
                    conditionObj.parent = { $exists: false }
                    delete conditionObj.$or;
                }
                
                if(!isNaN(milestone)){
                    conditionObj.milestone = milestone;
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
               

                // Tổng số trang
                let totalPage   = Math.ceil(totalRecord/limit);

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

    /**
     * Dev: MinhVH
     * Func: Search Task
     * Date: 11/05/2022
     */
    getListByFilter({
        fromDate, toDate, assigneesID, companiesOfAssignee, authorsID,
        projectsID, subtypes, status, fieldsID, isExpired, keyword, unlimited,
        limit = 20, lastestID, select, populates, userID
    }) {
        return new Promise(async resolve => {
            try {
                /**
                 * VALIDATION (1)
                 */
                const validation = validateParamsObjectID({
                    assigneesID         : { value: assigneesID, isRequire: false },
                    authorsID           : { value: authorsID, isRequire: false },
                    projectsID          : { value: projectsID, isRequire: false },
                    fieldsID            : { value: fieldsID, isRequire: false },
                    companiesOfAssignee : { value: companiesOfAssignee, isRequire: false },
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
                let keys	    = ['actualFinishTime__-1', '_id__-1'];

                let start = new Date();
                start.setHours(0,0,0,0);

                let end = new Date();
                end.setHours(23,59,59,999);

                /**
                 * LOGIC CODE (3)
                 */
                if(limit > 20 && isNaN(limit)){
                    limit = 20;
                } else{
                    limit = +limit;
                }

                // Lấy danh sách các nhóm dữ liệu mà userID là members
                const listGroups = await PCM_PLAN_GROUP_COLL.find({ members: { $in: [userID]} })

                // Lấy công việc mà mình được quyền truy cập
                conditionObj.$or = [
                    { author: userID },
                    { assignee: userID },
                    { related: { $in: [userID] }},
                    { group: { $in: listGroups.map(item => item._id) }},
                ]

                // Điều kiện bộ lọc
                status && status.length                             && (conditionObj.status = { $in: status });
                projectsID && projectsID.length                     && (conditionObj.project = { $in: projectsID });
                subtypes && subtypes.length                         && (conditionObj.subtype = { $in: subtypes });
                assigneesID && assigneesID.length                   && (conditionObj.assignee = { $in: assigneesID });
                authorsID && authorsID.length                       && (conditionObj.author = { $in: authorsID });
                fieldsID && fieldsID.length                         && (conditionObj.field = { $in: fieldsID });
                companiesOfAssignee && companiesOfAssignee.length   && (conditionObj.companyOfAssignee = { $in: companiesOfAssignee });

                if(isExpired){
                    // Việc bình thường
                    if(isExpired == 1) {
                        conditionObj.actualFinishTime = {
                            $gt: new Date(),
                            $exists: true,
                            $ne: null
                        }
                    }

                    // Việc chậm
                    if(isExpired == 2) {
                        conditionObj.status = { $ne: 3 };
                        conditionObj.actualFinishTime = {
                            $lt: new Date(),
                            $exists: true,
                            $ne: null
                        }
                    }
                }

                // Lấy những công việc từ ngày đến ngày
                if(fromDate && toDate){
                    conditionObj.actualFinishTime = {
                        $exists: true,
                        $ne: null,
                        $gte: new Date(fromDate),
                        $lte: new Date(toDate),
                    }
				}

                // Tìm kiếm theo keyword
				if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
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
                    let users = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.USER_GET_INFO_AND_GET_LIST}`,
                        { arrayID: JSON.stringify([...receivers, userID]), select: "_id email" }
                    );
                    users = users?.data?.listRecords || [];

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
                return resolve({ error: true, message: error.message, status: 500 });
            }
        });
    }

    /**
     * Name: Lấy số lượng công việc của companyOfAssignee trong dự án V2
     * Author: Depv
     * Code:
     */
    getAmountTaskOfCompanyOfAssigneeV2({ projectID, keyword, subtype, ctx }){
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

                await PCM_PLAN_TASK_COLL.populate(listCompanyOfAssignee, conditionPopulate);
                let listCompany = listCompanyOfAssignee.map(item => item._id).filter(Boolean);
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
     * Name: Lấy số lượng công việc của companyOfAssignee trong dự án V2
     * Author: Depv
     * Code:
     */
    getAmountTaskOfCompanyOfAuthor({ projectID, keyword, subtype, ctx }){
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
                                // $gte: start,
                                // $lt: addDate(7),
                                $gte:  moment(start).startOf('day')._d,
                                $lt: moment(addDate(7)).endOf('day')._d,
                                $exists: true,
                                $ne: null
                            },
                            status: { $ne: 3 }
                        }
                    },

                //      // lấy việc tới hạn Tuần tới
                // if(typeStatus && typeStatus == 2){
                //     conditionObj.actualFinishTime = {
                //         $gte:  moment(start).startOf('day')._d,
                //         $lt: moment(addDate(7)).endOf('day')._d,
                //         // $gte: start,
                //         // $lt: addDate(7),
                //         $exists: true,
                //         $ne: null
                //     }
                // }
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
        return new Promise(async resolve => {
            try {
                const validation = validateParamsObjectID({
                    parentID,
                    taskID,
                    userID
                })
                if(validation.error) return resolve(validation);

                const infoParent = await PCM_PLAN_TASK_COLL.findById(parentID);

                if(!infoParent) {
                    return resolve({
                        error: true,
                        message: 'Công việc cha không tồn tại',
                        keyError: 'parent_task_not_exists',
                        status: 400
                    });
                }

                const { project, group } = infoParent;

                const result = await PCM_PLAN_TASK_COLL.findOneAndUpdate({
                    _id: taskID,
                    project,
                    $or: [
                        { author: userID },
                        { assignee: userID },
                    ]
                }, {
                    $set: {
                        parent: parentID,
                        group
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
     * Func: Copy task
     * Date: 22/04/2022
     */
    copyTask({ taskID, userID, companyOfUser }) {
        return new Promise(async resolve => {
            try {
                const validation = validateParamsObjectID({
                    taskID: { value: taskID, isRequire: true },
                    userID: { value: userID, isRequire: true },
                    companyOfUser: { value: companyOfUser, isRequire: true },
                });
                if(validation.error) return resolve(validation);

                const infoOldTask = await PCM_PLAN_TASK_COLL
                    .findById(taskID)
                    .select('company project group parent name related assignee companyOfAssignee')
                    .lean();

                if(!infoOldTask) {
                    return resolve({
                        error: true,
                        message: 'Công việc cũ không tồn tại',
                        keyError: 'old_task_not_exists',
                        status: 400
                    });
                }

                const { company, project, group, parent, name, related, assignee, companyOfAssignee } = infoOldTask;

                const suid = await stringUtils.randomAndCheckExists(PCM_PLAN_TASK_COLL, 'suid');
                const result = await this.insertData({
                    suid,
                    name: `Copy of ${name}`,
                    draft: 1, // Việc nháp
                    companyOfAuthor: companyOfUser,
                    companyOfAssignee,
                    author: userID,
                    assignee,
                    related,
                    company,
                    project,
                    group,
                    parent
                });

                if(!result) {
                    return resolve({
                        error: true,
                        message: 'Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục',
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

}

exports.MODEL = new Model;