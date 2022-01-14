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
    insert({ type, contractID, name, sign, description, date, note, acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, timeForPayment, amountPaid, remainingPayment, userID, ctx  }) { 
        return new Promise(async (resolve) => {
            try {
                
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = { userCreate: userID };
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                let companyID;
                let projectID;
                if(contractID){
                    // call service contract để lấy thông tin
                    let infoContract = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_GET_INFO_AND_GET_LIST}`, {
                        contractID
                    })
                    /**
                     * Company lấy theo company của project
                     * Chứ không phải lấy theo company của user tạo task
                     */ 
                    companyID = infoContract?.data?.company;
                    projectID = infoContract?.data?.project;
                }

                if(companyID){
                    dataInsert.company = companyID
                }

                if(projectID){
                    dataInsert.project = projectID
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
                //______Giá trị nghiệm thu trước VAT (1)
                if(acceptance){
                    dataInsert.acceptance = acceptance;
                }
                //______Giá trị nghiệm thu phần VAT (2)
                if(vatAcceptance){
                    dataInsert.vatAcceptance = vatAcceptance;
                }
                //______Giá trị nghiệm thu phát sinh trước VAT(3)
                if(plusAcceptance){
                    dataInsert.plusAcceptance = plusAcceptance;
                }
                //_____Giá trị nghiệm thu phát sinh phần VAT(4)
                if(vatPlusAcceptance){
                    dataInsert.vatPlusAcceptance = vatPlusAcceptance;
                }
                //_____Giá trị giữ lại (5)
                if(retainedValue){
                    dataInsert.retainedValue = retainedValue;
                }
                //_____Thu hồi tạm ứng (6)
                if(advancePaymentDeduction){
                    dataInsert.advancePaymentDeduction = advancePaymentDeduction;
                }
                //_____Khấu trừ khác (nếu có) (7)
                if(otherDeduction){
                    dataInsert.otherDeduction = otherDeduction;
                }
                //_____Đề nghị tạm ứng/thanh toán '(8)=(1+2+3+4)-(5+6+7)
                if(recommendedPayment){
                    let recommendedPaymentTemp  = (Number(acceptance) + Number(vatAcceptance) + Number(plusAcceptance) + Number(vatPlusAcceptance)) - (Number(retainedValue) + Number(advancePaymentDeduction) + Number(otherDeduction) )

                    if(recommendedPayment != recommendedPaymentTemp)
                        return resolve({ error: true, message: "recommendedPayment_invalid", status: 403 });
 
                    dataInsert.recommendedPayment = recommendedPayment;
                }
                //_____Thời hạn thanh toán theo hợp đồng (9)
                if(timeForPayment){
                    dataInsert.timeForPayment = timeForPayment;
                }
                //_____Đã giải ngân (10)
                if(amountPaid){
                    dataInsert.amountPaid = amountPaid;
                }
                //_____Còn lại chưa giải ngân (11)=(8)-(10)
                if(remainingPayment){
                    let remainingPaymentTemp    = recommendedPayment - amountPaid;
                    if(remainingPayment != remainingPaymentTemp)
                        return resolve({ error: true, message: "remainingPayment_invalid", status: 403 });
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
        contractIpcID, type, name, sign, description, date, note, acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, timeForPayment, amountPaid, remainingPayment, userID, ctx
    }){ 
        return new Promise(async (resolve) => {
            try {
                
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID };
                
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */

                if(type){
                    dataUpdate.type = type;
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

                //______Giá trị nghiệm thu trước VAT (1)
                if(acceptance){
                    dataUpdate.acceptance = acceptance;
                }
                //______Giá trị nghiệm thu phần VAT (2)
                if(vatAcceptance){
                    dataUpdate.vatAcceptance = vatAcceptance;
                }
                //______Giá trị nghiệm thu phát sinh trước VAT(3)
                if(plusAcceptance){
                    dataUpdate.plusAcceptance = plusAcceptance;
                }
                //_____Giá trị nghiệm thu phát sinh phần VAT(4)
                if(vatPlusAcceptance){
                    dataUpdate.vatPlusAcceptance = vatPlusAcceptance;
                }
                //_____Giá trị giữ lại (5)
                if(retainedValue){
                    dataUpdate.retainedValue = retainedValue;
                }
                //_____Thu hồi tạm ứng (6)
                if(advancePaymentDeduction){
                    dataUpdate.advancePaymentDeduction = advancePaymentDeduction;
                }
                //_____Khấu trừ khác (nếu có) (7)
                if(otherDeduction){
                    dataUpdate.otherDeduction = otherDeduction;
                }
                //_____Đề nghị tạm ứng/thanh toán '(8)=(1+2+3+4)-(5+6+7)
                if(recommendedPayment){
                    let recommendedPaymentTemp  = (Number(acceptance) + Number(vatAcceptance) + Number(plusAcceptance) + Number(vatPlusAcceptance)) - (Number(retainedValue) + Number(advancePaymentDeduction) + Number(otherDeduction) )

                    if(recommendedPayment != recommendedPaymentTemp)
                        return resolve({ error: true, message: "recommendedPayment_invalid", status: 403 });
 
                    dataUpdate.recommendedPayment = recommendedPayment;
                }
                //_____Thời hạn thanh toán theo hợp đồng (9)
                if(timeForPayment){
                    dataUpdate.timeForPayment = timeForPayment;
                }
                //_____Đã giải ngân (10)
                if(amountPaid){
                    dataUpdate.amountPaid = amountPaid;
                }
                //_____Còn lại chưa giải ngân (11)=(8)-(10)
                if(remainingPayment){
                    let remainingPaymentTemp    = recommendedPayment - amountPaid;
                    if(remainingPayment != remainingPaymentTemp)
                        return resolve({ error: true, message: "remainingPayment_invalid", status: 403 });
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
        select, populates }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(contractIpcID))
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

                let infoContractIPC = await CMCS__CONTRACT_IPC_COLL.findById(contractIpcID)
                                .select(select)
                                .populate(populates)

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
    getList({ type, contractID, userID,
        keyword, limit = 10, lastestID, select, populates= {} }) { 
        return new Promise(async (resolve) => {
            try {

                if(limit > 20){
                    limit = 20
                }
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
                // TRẠNG THÁI CÔNG VIỆC
                if(type){
                    conditionObj.type = type
                }

                // HỢP ĐỒNG
                if(contractID && checkObjectIDs(contractID)){
                    conditionObj.contract = contractID;
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regExpSearch = RegExp(keyword, 'i');
                    conditionObj.name = regExpSearch;
                    // conditionObj.$or = [
                    //     { name: regExpSearch },
                    //     { sign: regExpSearch }
                    // ]
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
                
                let infoDataAfterGet = await CMCS__CONTRACT_IPC_COLL.find({...conditionObj, ...conditionFind })
                    .limit(+limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
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

                let totalRecord = await CMCS__CONTRACT_IPC_COLL.count(conditionObj);
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