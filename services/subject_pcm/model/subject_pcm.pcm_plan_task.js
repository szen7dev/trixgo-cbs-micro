"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');

const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const ObjectID                          = require('mongoose').Types.ObjectId;

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');

/**
 * import inter-coll, exter-coll
 */
const SUBJECT_PCM__PCM_PLAN_TASK_COLL       = require('../database/subject_pcm.pcm_plan_task-coll');
const SUBJECT_PCM__PCM_PLAN_GROUP_COLL      = require('../database/subject_pcm.pcm_plan_group-coll');
const { RANGE_BASE_PAGINATION_V2 } 	        = require('../../../tools/cursor_base/playground/index');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {               

    constructor() {
        super(SUBJECT_PCM__PCM_PLAN_TASK_COLL);
    }

    /**
     * Name: insert task ✅
     * Author: Depv
     * Code: 
     */
    insert({ projectID, groupID, authorID, name, description, sign, type, note, startTime, expiredTime, expiredHour, amountoftime, assigneeID, relatedIDs, progressType, parentID, docreID, messageID, contractID, documentID, boardID, reportID, groupReportID, draft, isproposal, template, workflowTemplateID, reminderExpired, hoursReminderExpired, draftExpired, hoursDraftExpired, addRelatedExpired, hoursAddRelatedExpired, fieldID, taskCopy, authorAttachs, ctx }) { 
        return new Promise(async (resolve) => {
            try {
                
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = { };
                let suid = await stringUtils.randomAndCheckExists(SUBJECT_PCM__PCM_PLAN_TASK_COLL, 'suid');
                let infoGroup = await SUBJECT_PCM__PCM_PLAN_GROUP_COLL.findById(groupID).select('_id contract property type')
                // let dateConcatnate = setTimeZone(new Date(`${expiredTime} ${expiredHour}:00`)).format('Y-MM-DD H:m:sZ');
                
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                let companyID;
                if(!parentID){
                    // call service department để lấy thông tin
                    
                    let infoProject = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST}`, {
                        departmentID: projectID
                    })
                    /**
                     * Company lấy theo company của project
                     * Chứ không phải lấy theo company của user tạo task
                     */ 
                    companyID = infoProject.data.company;
                    if(!companyID)
                        return res.json({ error: true, message: "company_invalid" }); 
                    
                }else{
                    // Lấy thông tin công ty theo công việc cha
                    let infoTaskParent = await this.getInfo({ 
                        taskID: parentID, 
                        userID: authorID,
                        populates: JSON.stringify({
                            path: 'author assignee',
                            select: '_id'
                        })
                    });
                    let { author, assignee, company, isproposal } = infoTaskParent.data;
                    /**   
                     * Check quyền nếu user là author hoặc assignee của công việc cha thì mới cho tạo
                     * Hiepnh: Cần bổ sung cả người liên quan cũng được tạo => đối với RFI
                     */
                    if(Number(isproposal) != 1){
                        if(author._id.toString() != authorID.toString() && assignee._id.toString() != authorID.toString())
                            return resolve({ error: true, message: 'permission_denied' })
                    }
                    companyID = company._id;
                }

                if(!name)
                    return resolve({ error: true, message: 'name_invalid', status: 400 });

                if(!checkObjectIDs(projectID))
                    return resolve({ error: true, message: 'projectID_invalid', status: 400 });
                
                if(!checkObjectIDs(groupID))
                    return resolve({ error: true, message: 'groupID_invalid', status: 400 });
                
                if(!checkObjectIDs(assigneeID))
                    return resolve({ error: true, message: 'assignee_invalid', status: 400 });
                
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                dataInsert = {  
                    name, 
                    company : companyID,
                    project : projectID, 
                    group   : groupID, 
                    assignee: assigneeID,
                    author  : authorID,
                    suid,
                    expiredTime,
                    actualFinishTime: expiredTime,
                    amountoftime: (amountoftime && !isNaN(amountoftime) ? Number(amountoftime) : 0), 
                    type,
                }

                if(parentID && checkObjectIDs(parentID)){
                    dataInsert.parent = parentID;
                }
                
                //_______File của người tạo việc
                if(checkObjectIDs(authorAttachs)){
                    dataInsert.authorAttachs = authorAttachs;
                }

                if(checkObjectIDs(relatedIDs)){
                    dataInsert.related = relatedIDs;
                }

                if(isproposal){
                    dataInsert.isproposal = isproposal;
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
                    dataInsert.startTime = startTime;
                    dataInsert.actualStartTime = startTime;
                } else {
                    dataInsert.startTime = Date.now();
                    dataInsert.actualStartTime = Date.now();
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
                if(isproposal && !isNaN(isproposal)){
                    dataInsert.isproposal = Number(isproposal);
                }else{
                    // Lấy theo group
                    if(infoGroup.type){
                        dataInsert.isproposal = infoGroup.type
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

                //_________Trường hợp tạo việc từ Workflow mẫu
                if(workflowTemplateID && ObjectID.isValid(workflowTemplateID)){
                    let infoWorkflowTemplate = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findById(workflowTemplateID);
                    let startTimeFromWorkflowTemplate   = infoWorkflowTemplate.startTime;
                    let expiredTimeFromWorkflowTemplate = infoWorkflowTemplate.expiredTime;
                    let relatedFromWorkflowTemplate     = infoWorkflowTemplate.related;

                    // Tổng số ngày chênh lệch giửa 2 ngày
                    let amountDate          = numberOfNightsBetweenDates(startTimeFromWorkflowTemplate, expiredTimeFromWorkflowTemplate);
                    let expiredTimeFormat   = new Date(startTime);
                    let expiredTimeAfterSet = expiredTimeFormat.setDate(expiredTimeFormat.getDate() + amountDate); 

                    dataInsert.templateApply= workflowTemplateID; // Gán ID để phục vụ show Dashboard theo quy trình
                    dataInsert.assignee     = infoWorkflowTemplate.assignee;
                    dataInsert.expiredTime  = expiredTimeAfterSet;
                    dataInsert.actualFinishTime = expiredTimeAfterSet
                    dataInsert.related      = relatedFromWorkflowTemplate;
                    dataInsert.note         = infoWorkflowTemplate.note;
                    dataInsert.isproposal   = infoWorkflowTemplate.isproposal;
                    dataInsert.field        = infoWorkflowTemplate.field;
                }

                //_________Trường hợp tạo việc từ nhân bản 1 việc khác
                if(taskCopy && ObjectID.isValid(taskCopy)){
                    let infoTaskCopy            = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findById(taskCopy);
                    let startTimeFromTaskCopy   = infoTaskCopy.startTime;
                    let expiredTimeFromTaskCopy = infoTaskCopy.actualFinishTime;

                    // Tổng số ngày chênh lệch giửa 2 ngày
                    let amountDate = numberOfNightsBetweenDates(startTimeFromTaskCopy, expiredTimeFromTaskCopy);

                    let expiredTimeFormat   = new Date(startTime);
                    let expiredTimeAfterSet = expiredTimeFormat.setDate(expiredTimeFormat.getDate() + amountDate); 

                    dataInsert.expiredTime       = expiredTimeAfterSet;
                    dataInsert.actualFinishTime  = expiredTimeAfterSet;
                }
               
                //Xử lý thêm Nhắc nhở trước thời hạn hoàn thành (h)
                if(reminderExpired){
                    let reminderExpiredTemp = new Date(reminderExpired);
                    if(hoursReminderExpired){
                        reminderExpiredTemp.setHours(hoursReminderExpired);
                    }
                    dataInsert.reminderExpired = reminderExpiredTemp;
                }

                //Thời hạn tự động biến việc nháp thành chính thức
                if(draftExpired){
                    let draftExpiredTemp = new Date(draftExpired);
                    if(hoursDraftExpired){
                        draftExpiredTemp.setHours(hoursDraftExpired);
                    }
                    dataInsert.draftExpired = draftExpiredTemp;
                }

                //Thời hạn add người liên quan
                if(addRelatedExpired){
                    let addRelatedExpiredTemp = new Date(addRelatedExpired);
                    if(hoursAddRelatedExpired){
                        addRelatedExpiredTemp.setHours(hoursAddRelatedExpired);
                    }
                    dataInsert.addRelatedExpired = addRelatedExpiredTemp;
                }

                //relatedIDs thêm người liên quan chờ collections related_pcm_plan_task
                let infoAterInsert = await this.insertData(dataInsert);
                if(!infoAterInsert)
                    return resolve({ error: true, message: "can't_insert_task ", status: 403 });


                //_________B4. Cập nhật ngược lại cho parent (Công việc cha, nhóm công việc, tài liệu-Docre)
                let taskID = infoAterInsert._id;

                /**
                 * CẬP NHẬT LẠI THÔNG TIN CHO CÁC COLLECTION LIÊN ĐỚI
                 */
                //__________Công việc cha
                if(parentID) {
                    await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findByIdAndUpdate(parentID, {
                        $addToSet: { childs: taskID } 
                    }, { new: true });
                }
 
                //__________Nhóm công việc
                await SUBJECT_PCM__PCM_PLAN_GROUP_COLL.findByIdAndUpdate(groupID, {
                    $addToSet: { tasks: taskID }   
                }, { new: true })
                 
                //__________Tin nhắn (nếu có)
                //  if(messageID && ObjectID.isValid(messageID)){
                //      await MESSAGE_COLL.findByIdAndUpdate(messageID, { task: taskID }, { new: true });
                //  }
 
                 //__________Văn bản (nếu có)
                //  if(documentID){
                //      await DOCUMENT_DOC_COLL.findByIdAndUpdate(documentID, {
                //          $addToSet: { tasks: taskID }
                //      }, { new: true });
                //  }
 
                 //__________Board (nếu có)
                //  if(boardID){
                //      await PCM_PLAN_BOARD_COLL.findByIdAndUpdate(boardID, {
                //          $addToSet: { 
                //              tasks: {
                //                  task: taskID
                //              } 
                //          }
                //      }, { new: true });
                //  }
 
                 //_________Thông báo công việc mới tạo
                //  if(author !== assignee){
                //      if(assignee){
                //          await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, {
                //              $addToSet: { 
                //                  news: assignee
                //              }
                //          }, { new: true });
                //      }
                //  }
 
                 /*
                 * Nếu có Nhóm báo váo thì push vào nhóm báo cáo
                 * Nếu không có thì push vào Báo có chính (Depv)
                 */
                //  if(groupReportID && ObjectID.isValid(groupReportID)){
                //      //_________Add task trong báo cáo nhóm xác định
                //      await PCM_PLAN_REPORT_COLL.findByIdAndUpdate(groupReportID, {
                //          $addToSet: {
                //              tasks: {
                //                  task: taskID
                //              }
                //          }
                //      }, { new: true });
                //  }else{
                //      //_________Add task trong báo cáo nhóm gốc
                //      if(reportID && ObjectID.isValid(reportID)){
                //          await PCM_PLAN_REPORT_COLL.findByIdAndUpdate(reportID, {
                //              $addToSet: {
                //                  tasks: {
                //                      task: taskID
                //                  }
                //              }
                //          }, { new: true });
                //      }
                //  }
 
                //_________Trường hợp tạo Đệ trình từ Mẫu thì copy checklist mẫu
                if(workflowTemplateID && ObjectID.isValid(workflowTemplateID)){

                    let infoWorkflowTemplate = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findById(workflowTemplateID).populate('subtasks');
                    let checklistFromWordflowTemplate = infoWorkflowTemplate.subtasks;

                    let arrChecklistCopy = [];
                    let TYPE_CHECKLIST = 2;

                    await( async function() {
                        for (let checklist of checklistFromWordflowTemplate) {

                            //  Tổng số ngày chênh lệch giữa 2 ngày
                            let amountDateChecklist = numberOfNightsBetweenDates(checklist.startTime, checklist.actualFinishTime);
                            
                            let expiredTimeChecklistFormat = new Date(startTime);
                            let expiredTimeAfterSet = expiredTimeChecklistFormat.setDate(expiredTimeChecklistFormat.getDate() + amountDateChecklist); 
                            let checkListAfterInsert = await that.insertFromCopy({
                                taskID, 
                                workflowTemplateID, 
                                templateApply: checklist._id,
                                author: checklist.author,
                                assignee: checklist.assignee,
                                name: checklist.name,
                                startTime: startTime,
                                expiredTime: expiredTimeAfterSet,
                                type: TYPE_CHECKLIST
                            });
                            arrChecklistCopy.push(checkListAfterInsert.data._id);
                        }
                    })()
                    // Update checklist cho task
                    // await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, { checklists: arrChecklistCopy });
                    await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, { subtasks: arrChecklistCopy });
                }
 
                //_________Trường hợp nhân bản công việc thì copy checklist mẫu
                if(taskCopy && ObjectID.isValid(taskCopy)){
                // Các tên biến này được copy từ trường hợp tạo workflow nên vẫn giữ nguyên
                let infoTask = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findById(taskCopy);
                let listCheckList = infoTask.subtasks;
                let startTimeTask = infoTask.startTime;
                let arrChecklistCopy = [];
                let TYPE_CHECKLIST = 2;

                await( async function() {
                    for (let checklist of listCheckList) {

                    let infoTask = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findById(checklist).select("_id company name sign field assignee author related project group isproposal description note childs,startTime, expiredTime  ");
                    // let { company, name, sign, field, assignee, author, related, project, group, isproposal, description, note, childs, startTime, expiredTime } = infoTask
                    let { company, sign, field, assignee, author, related, project, group, isproposal, description, note, childs, startTime, expiredTime } = infoTask
                    
                    //  Tổng số ngày chênh lệch giữa 2 ngày
                    let amountDateChecklist = numberOfNightsBetweenDates(startTimeTask, expiredTime);
                    let expiredTimeChecklistFormat = new Date();
                    let expiredTimeAfterSet = expiredTimeChecklistFormat.setDate(expiredTimeChecklistFormat.getDate() + amountDateChecklist); 
                
                    let dataInsertChild = { taskID, name: `Copy of - ${name}`, sign, field, assignee, author, related, project, group, isproposal, description, note, draft: 1, startTime: new Date(), expireDate: expiredTimeAfterSet }
                    let infoTaskChild = await that.insertSubtask(dataInsertChild);
                    arrChecklistCopy.push(infoTaskChild.data.infoAfterInsert._id);
                    }
                })()
                await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, { subtasks: arrChecklistCopy });
                }
 
                return resolve({ error: false, data: infoAterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: update task ✅
     * Author: Depv
     * Code: 
     */
    update({ typeUpdate,
        taskID, sign, name, description, note, startTime, expiredTime, amountoftime, amountPerHour, assigneeID, userID, progressType, fieldID, 
        contractID, draft, isproposal, usersDeleteID, related, offtimeReason, offbudgetReason, templateID, priority, status, lock, signatures, 
        links, authorAttachs, assigneeAttachs, percentage, judgement, overdue, score, urgent, difficult, finishTime, punish, approver, timeApproved, 
        valueApproved, bidPrice, bidPriceDiscount, bidPriceAdjustment, openedUsers, openedStatus, flags, lastLogID
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
                let dataUpdate = { };
                let dataAddToset = {};
                
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(taskID))
                    return resolve({ error: true, message: 'taskID_invalid', status: 400 });
                
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
                //_________Kế hoạch ban đầu
                if(startTime){
                    dataUpdate.startTime = startTime;
                }
                //_________Kế hoạch ban đầu
                if(expiredTime){
                    dataUpdate.expiredTime = expiredTime;
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
                if([0, 1].includes(draft)){
                    dataUpdate.draft = draft;
                }

                //_________Phân loại công việc
                if(isproposal){
                    dataUpdate.isproposal = +isproposal;
                }

                //_________User xóa task
                if(checkObjectIDs(usersDeleteID)){
                    dataAddToset = { ...dataAddToset, usersDelete: usersDeleteID }
                }

                //_________Người liên quan
                if(checkObjectIDs(related)){
                    dataAddToset = { ...dataAddToset, related }
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

                //_________File của người tạo việc-cân nhắc bỏ do không linh hoạt phiên bản
                if(checkObjectIDs(authorAttachs)){
                    dataAddToset = { ...dataAddToset, authorAttachs }
                }
                
                //_________File của người thực hiện-cân nhắc bỏ do không linh hoạt phiên bản
                if(checkObjectIDs(assigneeAttachs)){
                    dataAddToset = { ...dataAddToset, assigneeAttachs }
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

                //_________Trường hợp cập nhật nhiều dữ liệu addToSet cùng 1 lúc
                if(dataAddToset){
                    dataUpdate.$addToSet = dataAddToset;
                }

                if(checkObjectIDs(lastLogID)){
                    dataUpdate.lastLog = lastLogID;
                }
                
                let infoAterUpdate = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, dataUpdate, { new: true });
                
                if(!infoAterUpdate)
                    return resolve({ error: true, message: "Can't_update_task", status: 403 });

                return resolve({ error: false, data: infoAterUpdate, status: 200 });
            } catch (error) { 
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: get info task ✅
     * Author: Depv
     * Code: 
     */
    getInfo({ taskID, userID, select, populates }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(taskID))
                    return resolve({ error: true, message: 'param_invalid' });

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

                let infoTask = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findById(taskID)
                                .select(select)
                                .populate(populates).lean();

				if (!infoTask) 
                    return resolve({ error: true, message: 'cannot_get' });

                //_________Remove khỏi thông tin những người chưa xem những thay đổi mới
                // await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, {
                //     $pull: { 
                //         news: userID
                //     },
                //     $addToSet: {
                //         viewedUsers: userID
                //     }
                // }, { new: true })

				// let logID = infoTask && infoTask.lastLog;

                //_________Update usersSeen lastLog
                // if(logID){
                //     await PCM_PLAN_LOG_COLL.findByIdAndUpdate(logID, { 
                //         $addToSet: {
                //             usersSeen: userID
                //         }
                //     });
                // }
                return resolve({ error: false, data: infoTask });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
    
    /**
     * Name  : Danh sách pcm_plan_task ✅
     * Author: Depv
     * Code  : 
     */
    getList({ 
        projectID, assigneeID, authorID, status, draft, type, typeStatus, collection, 
        isproposal, isExpired, fromDate, toDate, signGroupOfTask, isChecklist,
        userID, parentID, companyOfAuthor, companyOfAssignee, fieldID, isSortChecklist,
        keyword, limit = 10, lastestID, select, populates = {}
    }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {
                    status: { $ne: 3 },
                    usersDelete: { $nin: [userID] },
                };
                
                let sortBy;
                let keys	 = ['actualFinishTime__-1', '_id__-1'];
                if(isSortChecklist == 1){
                    keys = ['createAt__-1', '_id__-1'];
                }

                let start = new Date();
                start.setHours(0,0,0,0);

                let end = new Date();
                end.setHours(23,59,59,999);

                function addDate(days) {
                    let date = new Date();
                    date.setDate(date.getDate() + days);
                    return date;
                }
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                 //__________B1: Get danh sách các nhóm dữ liệu mà userID là members
                let listGroups;
                if(signGroupOfTask){
                    let keyword = signGroupOfTask.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let signGroup = new RegExp(keyword, 'i');
 
                    let listGroupBySign = await  SUBJECT_PCM__PCM_PLAN_GROUP_COLL.find({ sign: signGroup });
                    let listGroupBySignID = listGroupBySign.map(item => item._id);
                    listGroups = await SUBJECT_PCM__PCM_PLAN_GROUP_COLL.find({ members: { $in: [userID]}, _id: { $in: listGroupBySignID } });
                 }else{
                    listGroups = await SUBJECT_PCM__PCM_PLAN_GROUP_COLL.find({ members: { $in: [userID]} });
                }
                 
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
                    conditionObj.status = { $in: status }
                }

                // Tìm kiếm điều kiên công việc nhanh chậm
                if(isExpired && isExpired == 1){
                    //Việc bình thường
                    conditionObj.actualFinishTime = { $gt: new Date() }
                }

                if(isExpired && isExpired == 2){
                    //Việc chậm
                    conditionObj.status = { $ne: 3 }
                    conditionObj.actualFinishTime = { $lt: new Date() }
				}

                // Lấy những công việc từ ngày đến ngày
                if(fromDate && toDate){
                    conditionObj.actualFinishTime = { $gte: new Date(fromDate), $lte: new Date(toDate) }
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
                if(isproposal){
                    conditionObj.isproposal = isproposal;
                }
                
                /**
                 * Type = 0 Việc của tôi + Giao + Liên quan
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

                // typeStatus
                // 1 Ngày nay
                // 2 Tới hạn tuần tới
                // 3 Tới hạn + 7 ngày tới
                // 4 Quá hạn
                // Lấy việc ngày nay
                if(typeStatus && typeStatus == 1){
                    conditionObj.actualFinishTime = {
                        $gte: start,
                        $lte: end,
                    }
                }

                // Lấy việc tới hạn tuần tới
                if(typeStatus && typeStatus == 2){
                    conditionObj.actualFinishTime = {
                        $gte: addDate(1),
                        $lte: addDate(7)
                    }
                }

                // lấy việc tới hạn + 7 ngày tới
                if(typeStatus && typeStatus == 3){
                    conditionObj.actualFinishTime = {
                        $gt: addDate(7)
                    }
                }

                // lấy việc quá hạn
                if(typeStatus && typeStatus == 4){
                    conditionObj.actualFinishTime = {
                        $lt: start
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
                    }else{
                        conditionObj.type = 1;
                    }
                }

                // Công ty của người tạo việc
                if(companyOfAuthor && checkObjectIDs(companyOfAuthor)){
                    conditionObj.companyOfAuthor = companyOfAuthor;
                }
                
                // Công ty của người thực hiện
                if(companyOfAssignee && checkObjectIDs(companyOfAssignee)){
                    conditionObj.companyOfAssignee = companyOfAssignee;
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

                let conditionObjOrg = {...conditionObj};
                // Phân trang kiểu mới
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj  = dataPagingAndSort.data.find;
					sortBy        = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy        = dataPagingAndSort.data.sort;
                }

                // Bắt đầu query trong db
                let infoDataAfterGet = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.find(conditionObj)
                    .limit(+limit+1)
                    .select(select)
                    .populate(populates)
                    .sort(sortBy)
                    .lean();

                // Kiểm tra nếu không có dữ liệu
                if(!infoDataAfterGet)
                   return resolve({ error: true, message: "Can't get data", status: 403 });

                // nextCursor phần tử cuối cùng khi phân trang
                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }   
                // Tổng số việc tìm thấy
                let totalRecord = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.count(conditionObjOrg);
                
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
     * Name: Lấy số lượng task của bạn ✅
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
                let amountTask = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.count({
                    assignee: userID, 
                    status: { $ne: 3 },
                    usersDelete: { $nin: [userID] },
                })

                /**
                 * Số lượng công việc thuộc đệ trình phê duyệt
                 */
                let amountTaskIsRFa = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.count({
                    assignee: userID,
                    isproposal: 2,
                    status: { $ne: 3 },
                    usersDelete: { $nin: [userID] },
                })

                /**
                 * Tổng số lượng công việc thuộc yêu cầu thông tin
                 */
                let amountTaskIsRFis = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.count({
                    assignee: userID,
                    isproposal: 1,
                    status: { $ne: 3 },
                    usersDelete: { $nin: [userID] },
                })

                /**
                 * Tổng số lượng công việc bạn quan tâm
                 */
                let amountTaskIsFlags = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.count({
                    flags: {
                       $in: [userID]
                    },
                    usersDelete: { $nin: [userID] },
                });

                /**
                 * Tổng số lượng công việc bạn đã giao người khac
                 */
                let amountTaskIsAssignee = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.count({
                    author: userID,
                    status: { $ne: 3 },
                    usersDelete: { $nin: [userID] },
                });

                /**
                 * Tổng số lượng công việc nháp
                 */
                let amountTaskIsDraft = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.count({
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
     * Name: Api thêm 2 trường dữ liệu companyOfAuthor và companyOfAssignee ✅
     * Author: Depv
     */
    updateCompanyOfAuthorAndCompanyOfAssignee(){
        return new Promise(async resolve => {
            try {
                
                let listTaskAfterUpdate = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.find({}).select("author assignee")
                                        .populate({
                                            path: "author assignee",
                                            select: "company"
                                        });
                let amount = 0;
                for (const task of listTaskAfterUpdate) {
                    let abc = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findByIdAndUpdate(task._id, { 
                        companyOfAuthor: task.author.company, 
                        companyOfAssignee: task.assignee.company, 
                    }, { new: true });
                    amount++;
                }

                return resolve({ error: false, message: "Vui lòng đợi" });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

}

exports.MODEL = new Model;