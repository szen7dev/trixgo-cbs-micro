"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const _isValid                          = require('mongoose').Types.ObjectId;

/**
 * DOMAIN AND ACTIONS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		    = require('../../item/helper/item.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * COLLECTIONS
 */
const TIMESHEET__EXPERT_TIMESHEET_COLL  = require('../database/timesheet.expert_timesheet-coll');

class Model extends BaseModel {

    constructor() {
        super(TIMESHEET__EXPERT_TIMESHEET_COLL);
    }

    /**
     * Name: Insert expert timesheet 
     * Author: Depv
     * Code: 
     */
    insert({ userCreate, companyID, parentID, name, date, type, note, projectID, assigneeID, ctx }) {
        return new Promise(async resolve => {
            try {

                if(!name){
                    return resolve({ 
                        error: true, 
                        message: "Name invalid",
                        keyError: "name_invalid",
                    });
                }

                // if(projectID){
                //     // call service department để lấy thông tin
                //     let infoProject = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST}`, {
                //         departmentID: projectID
                //     })

                //     /**
                //      * Company lấy theo company của project
                //      * Chứ không phải lấy theo company của user tạo task
                //      */ 
                //     companyID = infoProject.data.company;
                //     if(!companyID)
                //         return resolve({ 
                //             error: true, 
                //             message: "Company invalid",
                //             keyError: "company_invalid",
                //         });
                // }

                if(checkObjectIDs(parentID)){
                    let infoParent = await TIMESHEET__EXPERT_TIMESHEET_COLL.findById(parentID);
                    companyID = infoParent.company;
                }

                //__________Khai báo và validate dữ liệu
                let dataInsert = {
                    userCreate, name
                }

                if(checkObjectIDs(parentID)){
                    dataInsert.parent = parentID
                }
                
                if(assigneeID){
                    dataInsert.assignee = assigneeID;
                }

                if(companyID){
                    dataInsert.company = companyID;
                }

                if(projectID){
                    dataInsert.project = projectID;
                }

                if(date){
                    dataInsert.date = date;
                }

                if(type){
                    dataInsert.type = type;
                }

                if(note){
                    dataInsert.note = note;
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                // console.log(infoAfterInsert)
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert" });

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
    
    /**
     * Name: Update expert timesheet 
     * Author: Depv
     * Code: 
     */
    update({ expertTimesheetID, userUpdate, projectID, name, type, assigneeID, hours, unitprice, status, approver, note, date, dateIn1, dateOut1, dateIn2, dateOut2, dateIn3, dateOut3, ctx  }){
        return new Promise(async (resolve) => {
            try {
                if(!_isValid(expertTimesheetID))
                    return resolve({ 
                        error: true, 
                        message: 'expertTimesheetID invalid',
                        keyError: "expertTimesheetID_invalid"
                    });
                
                let infoTimeSheetID = await TIMESHEET__EXPERT_TIMESHEET_COLL.findById(expertTimesheetID);

                let dataUpdate = {
                    userUpdate: userUpdate,
                    modifyAt: Date.now(),
                }

                if(projectID){
                    dataUpdate.project = projectID;
                }
               
                if(checkObjectIDs(assigneeID)){
                    dataUpdate.assignee = assigneeID;
                }

                if(name){
                    dataUpdate.name = name;
                }

                if(date){
                    dataUpdate.date = date;
                }

                if(type){
                    dataUpdate.type = type;
                }

                if(hours){
                    dataUpdate.hours = hours;
                    // Cập nhật hours cho parent
                    if(infoTimeSheetID.parent){
                        let hoursCurrent = infoTimeSheetID.hours;
                        let hoursAfter   = hours - hoursCurrent;
                        await TIMESHEET__EXPERT_TIMESHEET_COLL.findByIdAndUpdate(infoTimeSheetID.parent, { $inc: { hours: hoursAfter }})
                    }
                }
                
                if(unitprice){ 
                    dataUpdate.unitprice = unitprice;
                }

                if(hours && unitprice){
                    let amount  = hours * unitprice;
                    dataUpdate.amount = amount
                    // Cập nhật amount cho parent
                    if(infoTimeSheetID.parent){
                        let amountCurrent = infoTimeSheetID.amount;
                        let amountAfter   = amount - amountCurrent;
                        await TIMESHEET__EXPERT_TIMESHEET_COLL.findByIdAndUpdate(infoTimeSheetID.parent, { $inc: { amount: amountAfter }})
                    }
                }

                if(status){
                    dataUpdate.status = status;
                }

                if(approver){
                    dataUpdate.approver = approver;
                    dataUpdate.timeApprover =  Date.now();
                }

                if(note){
                    dataUpdate.note = note;
                }

                if(dateIn1){
                    dataUpdate.dateIn1 = dateIn1;
                }

                if(dateOut1){
                    dataUpdate.dateOut1 = dateOut1;
                }

                if(dateIn2){
                    dataUpdate.dateIn2 = dateIn2;
                }

                if(dateOut2){
                    dataUpdate.dateOut2 = dateOut2;
                }

                if(dateIn3){
                    dataUpdate.dateIn3 = dateIn3;
                }
                
                if(dateOut3){
                    dataUpdate.dateOut3 = dateOut3;
                }
                
                let infoAfterUpdate = await TIMESHEET__EXPERT_TIMESHEET_COLL.findByIdAndUpdate(expertTimesheetID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ 
                        error: true, 
                        message: "Cannot update",
                        keyError: "cannot_update",
                    });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
    * Name: Remove expert timesheet 
    * Author: Depv
    * Code: 
    */
   remove({ expertTimesheetID }) { 
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
                if(!checkObjectIDs(expertTimesheetID))
                    return resolve({ 
                       error: true, 
                       message: 'Request params expertTimesheetID invalid', 
                       keyError: 'request_params_expertTimesheetID_invalid', 
                       status: 400 
                    });
             
                /**
                * LOGIC STEP (3)
                * 3.1: Convert type + update name (ví dụ: string -> number)
                * 3.2: Operation database
                */
                let infoAterRemove = await TIMESHEET__EXPERT_TIMESHEET_COLL.findByIdAndDelete(expertTimesheetID)

                if(!infoAterRemove)
                   return resolve({ error: true, message: "can't_remove", status: 403 });

                return resolve({ error: false, data: infoAterRemove, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
       })
   }

    /**
     * Name: get info expert timesheet 
     * Author: Depv
     * Code: 
     */
    getInfo({ expertTimesheetID, select, populates }) { 
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
                if(!checkObjectIDs(expertTimesheetID))
                    return resolve({ error: true, message: 'Request params expertTimesheetID invalid', status: 400 });
                
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
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                let infoAterGet = await TIMESHEET__EXPERT_TIMESHEET_COLL.findById(expertTimesheetID)
                                    .select(select)
                                    .populate(populates) 
                if(!infoAterGet)
                    return resolve({ error: true, message: "can't_get_info", status: 403 });
 
                return resolve({ error: false, data: infoAterGet, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    /**
     * Name  : Danh sách expert timesheet 
     * Author: Depv
     * Code  : 
     */
    getList({
        parentID, companyID, projectID,
        keyword, limit = 10, lastestID, select, populates= {} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { 
                };

                let sortBy   = { createAt: 1, _id: 1 };
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                // POPULATE
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

				if(checkObjectIDs(parentID)){
					conditionObj.parent = parentID;
				}else{
					conditionObj.parent = { $exists: false };
                }

                if(checkObjectIDs(companyID)){
					conditionObj.company = companyID;
				}

                if(checkObjectIDs(projectID)){
					conditionObj.project = projectID;
				}
                  
				if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }
                let conditionObjOrg = { ...conditionObj };
                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await TIMESHEET__EXPERT_TIMESHEET_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

					let keys	 = ['createAt__1', '_id__1'];
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });

					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}
                
                let infoDataAfterGet = await TIMESHEET__EXPERT_TIMESHEET_COLL.find(conditionObj)
                    .select(select)
                    .limit(+limit+1)
                    .sort(sortBy)
                    .populate(populates)
                    .lean(); 

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await TIMESHEET__EXPERT_TIMESHEET_COLL.count(conditionObjOrg);
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
}

exports.MODEL = new Model;
