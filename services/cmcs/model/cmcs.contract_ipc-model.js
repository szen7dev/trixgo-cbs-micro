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

/**
 * import inter-coll, exter-coll
 */
const CMCS__CONTRACT_IPC_COLL           = require('../database/cmcs.contract_ipc-coll');
const { RANGE_BASE_PAGINATION } 	    = require('../../../tools/cursor_base/playground/index');
const { template }                      = require('lodash');
const { ResumeToken }                   = require('mongodb');

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
                let dataInsert = { userCreate: userID, contract: contractID };

                // Trường để update các giá trị vào hợp đồng
                let updateContract = {};
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                let companyID;
                let projectID;
                if(!checkObjectIDs(contractID))
                    return resolve({ error: true, message: "Mã hợp đồng Không hợp lệ", keyError: "contractID_invalid" })

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
                    dataInsert.acceptance     = acceptance;
                    updateContract.acceptance = acceptance;
                }
                //______Giá trị nghiệm thu phần VAT (2)
                if(vatAcceptance){
                    dataInsert.vatAcceptance     = vatAcceptance;
                    updateContract.vatAcceptance = vatAcceptance;
                }
                //______Giá trị nghiệm thu phát sinh trước VAT(3)
                if(plusAcceptance){
                    dataInsert.plusAcceptance     = plusAcceptance;
                    updateContract.plusAcceptance = plusAcceptance;
                }
                //_____Giá trị nghiệm thu phát sinh phần VAT(4)
                if(vatPlusAcceptance){
                    dataInsert.vatPlusAcceptance  = vatPlusAcceptance;
                    updateContract.plusAcceptance = plusAcceptance;
                }
                //_____Giá trị giữ lại (5)
                if(retainedValue){
                    dataInsert.retainedValue     = retainedValue;
                    updateContract.retainedValue = retainedValue;
                }
                //_____Thu hồi tạm ứng (6)
                if(advancePaymentDeduction){
                    dataInsert.advancePaymentDeduction     = advancePaymentDeduction;
                    updateContract.advancePaymentDeduction = advancePaymentDeduction;
                }
                //_____Khấu trừ khác (nếu có) (7)
                if(otherDeduction){
                    dataInsert.otherDeduction     = otherDeduction;
                    updateContract.otherDeduction = otherDeduction;
                }
                //_____Đề nghị tạm ứng/thanh toán '(8)=(1+2+3+4)-(5+6+7)
                if(recommendedPayment){
                    dataInsert.recommendedPayment     = recommendedPayment;
                    updateContract.recommendedPayment = recommendedPayment;
                }

                //_____Thời hạn thanh toán theo hợp đồng (9)
                if(timeForPayment){
                    dataInsert.timeForPayment     = timeForPayment;
                    // updateContract.timeForPayment = timeForPayment;
                }
                //_____Đã giải ngân (10)
                if(amountPaid){
                    dataInsert.amountPaid     = amountPaid;
                    updateContract.amountPaid = amountPaid;
                }
                //_____Còn lại chưa giải ngân (11)=(8)-(10)
                if(remainingPayment){
                    dataInsert.remainingPayment     = remainingPayment;
                    updateContract.remainingPayment = remainingPayment;
                }
                
                let infoAterInsert = await this.insertData(dataInsert);
                if(!infoAterInsert)
                    return resolve({ error: true, message: "Không thể thêm contract ipc" ,keyError: "can't_insert_contract_ipc ", status: 403 });
              
                // Cập nhật các trường thông tin cho hợp đồng
                let infoContractAfterUpdate = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_UPDATE}`, {
                    contractID, dataInc: updateContract
                })

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

                // Object update contract ($inc)
                let updateContract = {};

                if(!checkObjectIDs(contractIpcID))
                    return resolve({ error: true, message: "Mã IPC không hợp kệ", keyError: "contract_ipc_invalid" })

                let infoContractIPC = await CMCS__CONTRACT_IPC_COLL.findById(contractIpcID);
                let contractID = infoContractIPC.contract;

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
                    // Giá trị acceptance hiện tại lúc chưa thay đổi
                    let acceptanceCurrent = infoContractIPC.acceptance;

                    // Giá trị chênh lệch khi thay đổi
                    let acceptanceAfter   = acceptance - acceptanceCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.acceptance = acceptanceAfter;
                }
                //______Giá trị nghiệm thu phần VAT (2)
                if(vatAcceptance){
                    dataUpdate.vatAcceptance = vatAcceptance;

                    // Giá trị vatAcceptance hiện tại lúc chưa thay đổi
                    let vatAcceptanceCurrent = infoContractIPC.vatAcceptance;
                
                    // Giá trị chênh lệch khi thay đổi
                    let vatAcceptanceAfter   = vatAcceptance - vatAcceptanceCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.vatAcceptance = vatAcceptanceAfter;
                }
                //______Giá trị nghiệm thu phát sinh trước VAT(3)
                if(plusAcceptance){
                    dataUpdate.plusAcceptance = plusAcceptance;

                    // Giá trị plusAcceptance hiện tại lúc chưa thay đổi
                    let plusAcceptanceCurrent = infoContractIPC.plusAcceptance;
            
                    // Giá trị chênh lệch khi thay đổi
                    let plusAcceptanceAfter   = plusAcceptance - plusAcceptanceCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.plusAcceptance = plusAcceptanceAfter;
                }
                //_____Giá trị nghiệm thu phát sinh phần VAT(4)
                if(vatPlusAcceptance){
                    dataUpdate.vatPlusAcceptance = vatPlusAcceptance;

                    // Giá trị vatPlusAcceptance hiện tại lúc chưa thay đổi
                    let vatPlusAcceptanceCurrent = infoContractIPC.vatPlusAcceptance;
        
                    // Giá trị chênh lệch khi thay đổi
                    let vatPlusAcceptanceAfter   = vatPlusAcceptance - vatPlusAcceptanceCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.vatPlusAcceptance = vatPlusAcceptanceAfter;
                }
                //_____Giá trị giữ lại (5)
                if(retainedValue){
                    dataUpdate.retainedValue = retainedValue;

                    // Giá trị retainedValue hiện tại lúc chưa thay đổi
                    let retainedValueCurrent = infoContractIPC.retainedValue;
    
                    // Giá trị chênh lệch khi thay đổi
                    let retainedValueAfter   = retainedValue - retainedValueCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.retainedValue = retainedValueAfter;
                }
                //_____Thu hồi tạm ứng (6)
                if(advancePaymentDeduction){
                    dataUpdate.advancePaymentDeduction = advancePaymentDeduction;

                    // Giá trị advancePaymentDeduction hiện tại lúc chưa thay đổi
                    let advancePaymentDeductionCurrent = infoContractIPC.advancePaymentDeduction;

                    // Giá trị chênh lệch khi thay đổi
                    let advancePaymentDeductionAfter   = advancePaymentDeduction - advancePaymentDeductionCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.advancePaymentDeduction = advancePaymentDeductionAfter;
                }
                //_____Khấu trừ khác (nếu có) (7)
                if(otherDeduction){
                    dataUpdate.otherDeduction = otherDeduction;

                    // Giá trị otherDeduction hiện tại lúc chưa thay đổi
                    let otherDeductionCurrent = infoContractIPC.otherDeduction;

                    // Giá trị chênh lệch khi thay đổi
                    let otherDeductionAfter   = otherDeduction - otherDeductionCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.otherDeduction = otherDeductionAfter;
                }
                //_____Đề nghị tạm ứng/thanh toán '(8)=(1+2+3+4)-(5+6+7)
                if(recommendedPayment){
                    dataUpdate.recommendedPayment = recommendedPayment;

                    // Giá trị recommendedPayment hiện tại lúc chưa thay đổi
                    let recommendedPaymentCurrent = infoContractIPC.recommendedPayment;

                    // Giá trị chênh lệch khi thay đổi
                    let recommendedPaymentAfter   = recommendedPayment - recommendedPaymentCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.recommendedPayment = recommendedPaymentAfter;
                }
                //_____Thời hạn thanh toán theo hợp đồng (9)
                if(timeForPayment){
                    dataUpdate.timeForPayment = timeForPayment;
                }
                //_____Đã giải ngân (10)
                if(amountPaid){
                    dataUpdate.amountPaid = amountPaid;

                    // Giá trị amountPaid hiện tại lúc chưa thay đổi
                    let amountPaidCurrent = infoContractIPC.amountPaid;

                    // Giá trị chênh lệch khi thay đổi
                    let amountPaidAfter   = amountPaid - amountPaidCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.amountPaid = amountPaidAfter;
                }
                //_____Còn lại chưa giải ngân (11)=(8)-(10)
                if(remainingPayment){
                    dataUpdate.remainingPayment = remainingPayment;

                    // Giá trị remainingPayment hiện tại lúc chưa thay đổi
                    let remainingPaymentCurrent = infoContractIPC.remainingPayment;

                    // Giá trị chênh lệch khi thay đổi
                    let remainingPaymentAfter   = remainingPayment - remainingPaymentCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.remainingPayment = remainingPaymentAfter;
                }

                let infoAterUpdate = await CMCS__CONTRACT_IPC_COLL.findByIdAndUpdate(contractIpcID, dataUpdate, { new: true });
                if(!infoAterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại" ,keyError: "can't_update_contract_ipc", status: 403 });
              
                // Cập nhật các trường thông tin cho hợp đồng
                let infoContractAfterUpdate = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_UPDATE}`, {
                    contractID: `${contractID}`, dataInc: updateContract
                })

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