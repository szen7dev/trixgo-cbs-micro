"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');


const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const ObjectID                          = require('mongoose').Types.ObjectId;

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');

/**s
 * import inter-coll, exter-coll
 */
const SUBJECT_PCM__PCM_PLAN_TASK_COLL       = require('../database/subject_pcm.pcm_plan_task-coll');
const SUBJECT_PCM__PCM_PLAN_GROUP_COLL      = require('../database/subject_pcm.pcm_plan_group-coll');
const { RANGE_BASE_PAGINATION } 	        = require('../../../tools/cursor_base/playground/index');
const { template } = require('lodash');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {               

    constructor() {
        super(SUBJECT_PCM__PCM_PLAN_TASK_COLL);
    }

    /**
     * Name: insert user_pcm_plan_report ✅
     * Author: Depv
     * Code: 
     */
    insert({ projectID, groupID, authorID, name, description, sign, note, startTime, expiredTime, expiredHour, amountoftime, assigneeID, relatedIDs, progressType, parentID, docreID, messageID, contractID, documentID, boardID, reportID, groupReportID, draft, isproposal, template, workflowTemplateID, reminderExpired, hoursReminderExpired, draftExpired, hoursDraftExpired, addRelatedExpired, hoursAddRelatedExpired, fieldID, taskCopy, ctx  }) { 
        return new Promise(async (resolve) => {
            try {
                
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = { };
                let suid = await stringUtils.randomAndCheckExists(SUBJECT_PCM__PCM_PLAN_TASK_COLL, 'suid');
                let dateConcatnate = setTimeZone(new Date(`${expiredTime} ${expiredHour}:00`)).format('Y-MM-DD H:m:sZ');
                let infoGroup = await SUBJECT_PCM__PCM_PLAN_GROUP_COLL.findById(groupID).select('_id contract property type')
                
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
                    let infoTaskParent = await this.getInfo({ taskID: parentID, userID });
                    let { author, company } = infoTaskParent.data;
                    /**   
                     * Check quyền nếu user là author hoặc assignee của công việc cha thì mới cho tạo
                     * Hiepnh: Cần bổ sung cả người liên quan cũng được tạo => đối với RFI
                     */
                    if(Number(infoTaskParent.data.isproposal) != 1){
                        if(author._id.toString() != userID.toString() && infoTaskParent.data.assignee._id.toString() != userID.toString())
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
                    expiredTime: expiredHour ? dateConcatnate : expiredTime,
                    amountoftime: (amountoftime && !isNaN(amountoftime) ? Number(amountoftime) : 0), 
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
                    if(infoGroup.contract){
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
                if(infoGroup.property){
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
                    // console.log({ arrChecklistCopy, taskID });
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
     * Name: update pcm_plan_report ✅
     * Author: Depv
     * Code: 
     */
    update({ taskID, sign, name, description, note, startTime, expiredTime, amountoftime, amountPerHour, assignee, userUpdate, progressType, field, contract, draft, isproposal }) { 
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
                if(!checkObjectIDs(taskID))
                    return resolve({ error: true, message: 'taskID_invalid', status: 400 });
                
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                if(sign){
                    dataUpdate.sign = sign;
                }

                if(name){
                    dataUpdate.name = name;
                }

                if(description){
                    dataUpdate.description = description;
                }

                if(note){
                    dataUpdate.note = note;
                }

                if(startTime){
                    dataUpdate.startTime = startTime;
                }

                if(expiredTime){
                    dataUpdate.expiredTime = expiredTime;
                }

                if(amountoftime){
                    dataUpdate.amountoftime = amountoftime;
                }

                if(amountPerHour){
                    dataUpdate.amountPerHour = amountPerHour;
                }

                if(checkObjectIDs(assignee)){
                    dataUpdate.assignee = assignee;
                }

                if(checkObjectIDs(userUpdate)){
                    dataUpdate.userUpdate = userUpdate;
                }

                if(progressType){
                    dataUpdate.progressType = progressType;
                }

                if(field){
                    dataUpdate.field = field;
                }

                if(contract){
                    dataUpdate.contract = contract;
                }

                if([0, 1].includes(draft)){
                    dataUpdate.draft = draft;
                }
                
                if(isproposal){
                    dataUpdate.isproposal = isproposal;
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
     * Name: insert user_pcm_plan_report ✅
     * Author: Depv
     * Code: 
     */
    remove({ taskID }) { 
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
                if(!checkObjectIDs(taskID))
                    return resolve({ error: true, message: 'taskID_invalid', status: 400 });
                
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */

                let infoAterRemove = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findByIdAndDelete(taskID);

                if(!infoAterRemove)
                    return resolve({ error: true, message: "Can't_remove_task", status: 403 });

                return resolve({ error: false, data: infoAterRemove, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: get info user_pcm_plan_report ✅
     * Author: Depv
     * Code: 
     */
    getInfo({ taskID, userID, select, populates, populates1, populates2, populates3 }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(taskID))
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

                let infoTask = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findById(taskID)
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

                
                //_________Remove khỏi thông tin những người chưa xem những thay đổi mới
                await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findByIdAndUpdate(taskID, {
                    $pull: { 
                        news: userID
                    },
                    $addToSet: {
                        viewedUsers: userID
                    }
                }, { new: true })

				// let logID = infoTask && infoTask.lastLog;

                //_________Update usersSeen lastLog
                // if(logID){
                //     await PCM_PLAN_LOG_COLL.findByIdAndUpdate(logID, { 
                //         $addToSet: {
                //             usersSeen: userID
                //         }
                //     });
                // }

				if (!infoTask) return resolve({ error: true, message: 'cannot_get' });

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
    getList({ keyword, limit = 10, lastestID, userID, projectID, assigneeID, authorID, status, draft, type, typeStatus, filter = {}, select = {}, populates= {}, populates1={},
         populates2={}, populates3={}, collection, isproposal, isExpired, fromDate, toDate, signGroupOfTask }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { 
                    // state: 1,
                    usersDelete: {$nin: [userID]} 
                };

                let conditionFind = { };
                let sortBy   = { createAt: -1 };
				let objSort  = {};

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
                 
                 // lấy công việc mà mình được quyền truy cập
                conditionObj.$or = [
                    { author: userID },
                    { assignee: userID },
                    { related: { $in: [userID] }},
                    { group: { $in: listGroups.map(item => item._id) }},
                ]

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
                 if(status){
                    conditionObj.status = { $in: status }
                }

                // KIỂM TRA ĐIỀU KIỆN NHANH CHẬM
                if(isExpired && isExpired == 1){
                    // BÌNH THƯỜNG
                    conditionObj.expiredTime = { $gt: new Date() }
                }

                if(isExpired && isExpired == 2){
                    // CHẬM
                    conditionObj.status = { $ne: 3 }
                    conditionObj.expiredTime = { $lt: new Date() }
				}
                // Từ ngày đến ngày
                if(fromDate && toDate){
                    conditionObj.expiredTime = { $gte: new Date(fromDate), $lte: new Date(toDate) }
				}
                // Việc nháp
                if(draft && Number(draft) === 1){
                    conditionObj.draft = 1;
                } else{
                    conditionObj.draft = 0;
                }
                // Dự án
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
                // Loại công việc
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
                }
                if(type == 2){
                    conditionObj.author = userID;
                }
                if(type == 3){
                    conditionObj.flags = { $in: [userID]};
                }
                if(type == 4){
                    conditionObj.author = userID;
                    conditionObj.draft = 1;
                }
                if(type == 5){
                    conditionObj.related = { $in: [userID] };
                }
                // console.log(conditionObj)

                let start = new Date();
                start.setHours(0,0,0,0);

                let end = new Date();
                end.setHours(23,59,59,999);

                function addDate(days) {
                    let date = new Date();
                    date.setDate(date.getDate() + days);
                    return date;
                }

                // typeStatus
                // 1 Ngày nay
                // 2 Tới hạn tuần tới
                // 3 Tới hạn + 7 ngày tới
                // 4 Quá hạn
                if(typeStatus && typeStatus == 1){
                    conditionObj.actualFinishTime = {
                        $gte: start,
                        $lte: end,
                    }
                }
                if(typeStatus && typeStatus == 2){
                    conditionObj.actualFinishTime = {
                        $gte: addDate(1),
                        $lte: addDate(7)
                    }
                }
                if(typeStatus && typeStatus == 3){
                    conditionObj.actualFinishTime = {
                        $gt: addDate(7)
                    }
                }

                if(typeStatus && typeStatus == 4){
                    conditionObj.actualFinishTime = {
                        $lt: start
                    }
                }

                // GET CONDITION PAGINATION
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.findById(lastestID);
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

                // Người thực hiện
                if(assigneeID && checkObjectIDs(assigneeID)){
                    conditionObj.assignee = assigneeID;
                }

                // Người tạo việc
                if(authorID && checkObjectIDs(authorID)){
                    conditionObj.author = authorID;
                }

                // SEARCH TEXT
				// if(keyword){
				// 	conditionObj.$text = { $search: keyword };
				// 	objSort.score = { $meta: "textScore" };
				// 	sortBy.score  = { $meta: "textScore" };
				// }
				if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }

                let infoDataAfterGet = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.find({...conditionObj, ...conditionFind }, { ...filter, ...objSort })
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

                // Gán dữ liệu typeStatus
                let listTask = [];
                if(infoDataAfterGet && infoDataAfterGet.length){
                    for (const element of infoDataAfterGet) {
                        let taskNewTemp = element;
                        if(taskNewTemp && taskNewTemp.expiredTime){
                            // typeStatus
                            // 1 Ngày nay
                            // 2 Tới hạn tuần tới
                            // 3 Tới hạn + 7 ngày tới
                            // 4 Quá hạn
                            // 5 Chưa tới hạn -> 3. Tới hạn + 7 ngày tới
                            let date    = new Date();
                            let today   =  new Date(date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate());
                            let expiredTimeTemp = new Date(taskNewTemp.expiredTime);
                            let expiredTime = new Date(expiredTimeTemp.getFullYear() + "-" + (expiredTimeTemp.getMonth() + 1) + "-" + expiredTimeTemp.getDate());
                            
                            if(+today == +expiredTime){
                                taskNewTemp = {
                                    ...taskNewTemp, 
                                    typeStatus: 1
                                }
                            }else{
                                if(+today < +expiredTime && +expiredTime < +addDate(7)){
                                    taskNewTemp = {
                                        ...taskNewTemp, 
                                        typeStatus: 2
                                    }
                                }else{
                                    if(+today < +expiredTime && +expiredTime < +addDate(14) ){
                                        taskNewTemp = {
                                            ...taskNewTemp, 
                                            typeStatus: 3
                                        }
                                    }else{
                                        if( +expiredTime <= +addDate(14)){
                                            taskNewTemp = {
                                                ...taskNewTemp, 
                                                typeStatus: 4
                                            }
                                        }else{
                                            taskNewTemp = {
                                                ...taskNewTemp, 
                                                typeStatus: 5
                                            }
                                        }
                                    }
                                }
                            }

                            listTask = [...listTask, taskNewTemp];
                        }

                        // Kiểm tra số lượng checklist đã hoàn thành.
                    }
                }

                
                // GET TOTAL RECORD
                let totalCurrentPage = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.count(conditionFind);
                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let totalRecord = await SUBJECT_PCM__PCM_PLAN_TASK_COLL.countDocuments(conditionObj);
				let nextCursor	= null;
                let totalPage = Math.ceil(totalRecord/limit);

				if(infoDataAfterGet && infoDataAfterGet.length){
					if(infoDataAfterGet.length > limit){
						nextCursor = infoDataAfterGet[limit - 1]._id;
						infoDataAfterGet.length = limit;
                        listTask.length = limit;
					}
				}

                let currentPage = getCurrentPage({ totalRecord, totalCurrentPage, limit }) + 1;
                if(!lastestID){
                    currentPage =  1
                }

                return resolve({ error: false, data: {
                    listRecords: listTask,
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