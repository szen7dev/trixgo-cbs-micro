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
const CMCS__CONTRACT_IPC_COLL           = require('../database/cmcs.contract_ipc-coll');
const { RANGE_BASE_PAGINATION } 	    = require('../../../tools/cursor_base/playground/index');
const { template }                      = require('lodash');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {               

    constructor() {
        super(CMCS__CONTRACT_IPC_COLL);
    }
    
    /**
     * Name: insert contract ipc ✅
     * Author: Depv
     * Code: 
     */
    insert({ type, projectID, contractID, name, sign, description, date, note, acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, timeForPayment, amountPaid, remainingPayment, userID, ctx  }) { 
        return new Promise(async (resolve) => {
            try {
                
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = { project: projectID, userCreate: userID };
                console.log({ type, projectID, contractID, name, sign, description, date, note, acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, timeForPayment, amountPaid, remainingPayment, userID });
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                let companyID;
                if(projectID){
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
                        return resolve({ error: true, message: "company_invalid" });
                }

                if(companyID){
                    dataInsert.company = companyID
                }
             
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */

                if(type){
                    dataInsert.type = type;
                }

                if(contractID){
                    dataInsert.contract = contractID;
                }

                if(name){
                    dataInsert.name = name;
                }

                if(sign){
                    dataInsert.sign = sign;
                }

                if(description){
                    dataInsert.description = description;
                }

                if(date){
                    dataInsert.date = date;
                }

                if(note){
                    dataInsert.note = note;
                }

                if(acceptance){
                    dataInsert.acceptance = acceptance;
                }

                if(vatAcceptance){
                    dataInsert.vatAcceptance = vatAcceptance;
                }

                if(plusAcceptance){
                    dataInsert.plusAcceptance = plusAcceptance;
                }

                if(vatPlusAcceptance){
                    dataInsert.vatPlusAcceptance = vatPlusAcceptance;
                }

                if(retainedValue){
                    dataInsert.retainedValue = retainedValue;
                }

                if(advancePaymentDeduction){
                    dataInsert.advancePaymentDeduction = advancePaymentDeduction;
                }

                if(otherDeduction){
                    dataInsert.otherDeduction = otherDeduction;
                }

                if(recommendedPayment){
                    dataInsert.recommendedPayment = recommendedPayment;
                }

                if(timeForPayment){
                    dataInsert.timeForPayment = timeForPayment;
                }

                if(amountPaid){
                    dataInsert.amountPaid = amountPaid;
                }

                if(remainingPayment){
                    dataInsert.remainingPayment = remainingPayment;
                }

                let infoAterInsert = await this.insertData(dataInsert);
                if(!infoAterInsert)
                    return resolve({ error: true, message: "can't_insert_task ", status: 403 });

                return resolve({ error: false, data: infoAterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: update contract ipc ✅
     * Author: Depv
     * Code: 
     */
    update({ 
        contractIpcID, type, projectID, contractID, name, sign, description, date, note, acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, timeForPayment, amountPaid, remainingPayment, userID, ctx
    }){ 
        return new Promise(async (resolve) => {
            try {
                
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { project: projectID, userCreate: userID };
                
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                let companyID;
                if(!projectID){
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
                }

                if(companyID){
                    dataUpdate.company = companyID
                }
             
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */

                if(type){
                    dataUpdate.type = type;
                }

                if(contractID){
                    dataUpdate.contract = contractID;
                }

                if(name){
                    dataUpdate.name = name;
                }

                if(sign){
                    dataUpdate.sign = sign;
                }

                if(description){
                    dataUpdate.description = description;
                }

                if(date){
                    dataUpdate.date = date;
                }

                if(note){
                    dataUpdate.note = note;
                }

                if(acceptance){
                    dataUpdate.acceptance = acceptance;
                }

                if(vatAcceptance){
                    dataUpdate.vatAcceptance = vatAcceptance;
                }

                if(plusAcceptance){
                    dataUpdate.plusAcceptance = plusAcceptance;
                }

                if(vatPlusAcceptance){
                    dataUpdate.vatPlusAcceptance = vatPlusAcceptance;
                }

                if(retainedValue){
                    dataUpdate.retainedValue = retainedValue;
                }

                if(advancePaymentDeduction){
                    dataUpdate.advancePaymentDeduction = advancePaymentDeduction;
                }

                if(otherDeduction){
                    dataUpdate.otherDeduction = otherDeduction;
                }

                if(recommendedPayment){
                    dataUpdate.recommendedPayment = recommendedPayment;
                }

                if(timeForPayment){
                    dataUpdate.timeForPayment = timeForPayment;
                }

                if(amountPaid){
                    dataUpdate.amountPaid = amountPaid;
                }

                if(remainingPayment){
                    dataUpdate.remainingPayment = remainingPayment;
                }

                let infoAterUpdate = await CMCS__CONTRACT_IPC_COLL.findByIdAndUpdate(contractIpcID, dataUpdate, { new: true });
                if(!infoAterUpdate)
                    return resolve({ error: true, message: "can't_update_contract_ipc", status: 403 });

                return resolve({ error: false, data: infoAterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }


      /**
     * Name: Remove contract ipc ✅
     * Author: Depv
     * Code: 
     */
    remove({ contractIpcID }) { 
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
                if(!checkObjectIDs(contractIpcID))
                    return resolve({ error: true, message: 'Request params contractIpcID invalid', status: 400 });
                    
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                let infoAterRemove = await CMCS__CONTRACT_IPC_COLL.findByIdAndDelete(contractIpcID);
                if(!infoAterRemove)
                    return resolve({ error: true, message: "can't_remove", status: 403 });
 
                return resolve({ error: false, data: infoAterRemove, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }


    /**
     * Name: get info contract ipc ✅
     * Author: Depv
     * Code: 
     */
    getInfo({ contractIpcID, userID, 
        select, populates, populates1, populates2, populates3 }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(contractIpcID))
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

                let infoContractIPC = await CMCS__CONTRACT_IPC_COLL.findById(contractIpcID)
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

				if (!infoContractIPC) return resolve({ error: true, message: 'cannot_get' });

                return resolve({ error: false, data: infoContractIPC });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name  : Danh sách contract ipc ✅
     * Author: Depv
     * Code  : 
     */
    getList({ type, projectID, contractID, userID,
        keyword, limit = 10, lastestID, populates2={}, populates3={}, filter = {}, populates= {}, populates1={} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { 
                    // state: 1,
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
                // TRẠNG THÁI CÔNG VIỆC
                if(type){
                    conditionObj.type = type
                }

                // DỰ ÁN
                if(projectID && checkObjectIDs(projectID)){
                    conditionObj.project = projectID;
                }

                // HỢP ĐỒNG
                if(contractID && checkObjectIDs(contractID)){
                    conditionObj.contract = contractID;
                }

                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await CMCS__CONTRACT_IPC_COLL.findById(lastestID);
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
                    let regExpSearch = RegExp(keyword, 'i');
                    conditionObj.$or = [
                        { name: regExpSearch },
                        { sign: regExpSearch }
                    ]
                }
                
                let infoDataAfterGet = await CMCS__CONTRACT_IPC_COLL.find({...conditionObj, ...conditionFind }, { ...filter, ...objSort })
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
                
                // GET TOTAL RECORD
                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await CMCS__CONTRACT_IPC_COLL.countDocuments(conditionObj);
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