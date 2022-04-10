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
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
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

                // Precalculate-Trường để update các giá trị vào Dự án

                // Precalculate-Trường để update các giá trị vào Hợp đồng
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
                // Tính toán tổng giá trị của hợp đồng tới hiện tại, không gồm mẩu tin đang xét
                let listData = await CMCS__CONTRACT_IPC_COLL.aggregate([
                    {
                        $match: {
                            contract: ObjectID(contractID),
                        }
                    }, 
                    {
                        $group: {
                            _id: { },
                            acceptance: { $sum: "$acceptance" },
                            vatAcceptance: { $sum: "$vatAcceptance" },
                            plusAcceptance: { $sum: "$plusAcceptance" },
                            vatPlusAcceptance: { $sum: "$vatPlusAcceptance" },
                            retainedValue: { $sum: "$retainedValue" },
                            advancePaymentDeduction: { $sum: "$advancePaymentDeduction" },
                            otherDeduction: { $sum: "$otherDeduction" },
                            recommendedPayment: { $sum: "$recommendedPayment" },
                            remainingPayment: { $sum: "$remainingPayment" },
                        }
                    }, 
                ])
                if(listData.length){
                    updateContract.acceptance = Number(listData[0].acceptance)
                    updateContract.vatAcceptance = Number(listData[0].vatAcceptance)
                    updateContract.plusAcceptance = Number(listData[0].plusAcceptance)
                    updateContract.vatPlusAcceptance = Number(listData[0].vatPlusAcceptance)
                    updateContract.retainedValue = Number(listData[0].retainedValue)
                    updateContract.advancePaymentDeduction = Number(listData[0].advancePaymentDeduction)
                    updateContract.otherDeduction = Number(listData[0].otherDeduction)
                    updateContract.recommendedPayment = Number(listData[0].recommendedPayment)
                    updateContract.remainingPayment = Number(listData[0].remainingPayment)
                    updateContract.advancePaymentPaid = Number(0)
                    updateContract.amountPaid = Number(0)
                }else{
                    updateContract.acceptance = Number(0)
                    updateContract.vatAcceptance = Number(0)
                    updateContract.plusAcceptance = Number(0)
                    updateContract.vatPlusAcceptance = Number(0)
                    updateContract.retainedValue = Number(0)
                    updateContract.advancePaymentDeduction = Number(0)
                    updateContract.otherDeduction = Number(0)
                    updateContract.recommendedPayment = Number(0)
                    updateContract.remainingPayment = Number(0)
                    updateContract.advancePaymentPaid = Number(0)
                    updateContract.amountPaid = Number(0)
                }
                // console.log(updateContract)

                // Đã tạm ứng
                let listData1 = await CMCS__CONTRACT_IPC_COLL.aggregate([
                    {
                        $match: {
                            contract: ObjectID(contractID),
                            type: 1,
                        }
                    }, 
                    {
                        $group: {
                            _id: { },
                            advancePaymentPaid: { $sum: "$amountPaid" },
                        }
                    }, 
                ])

                // Đã thanh toán
                let listData2 = await CMCS__CONTRACT_IPC_COLL.aggregate([
                    {
                        $match: {
                            contract: ObjectID(contractID),
                            type: 2,
                        }
                    }, 
                    {
                        $group: {
                            _id: { },
                            amountPaid: { $sum: "$amountPaid" },
                        }
                    }, 
                ])

                if(listData1.length){
                    updateContract.advancePaymentPaid = Number(listData1[0].advancePaymentPaid)
                }

                if(listData2.length){
                    updateContract.amountPaid = Number(listData2[0].amountPaid)
                }
                console.log('End==============contract')
                console.log(updateContract)
                /**End tính toán cho hợp đồng */

                if(type && [1,2].includes(Number(type))){
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
                if(!isNaN(acceptance) && Number(acceptance) >= 0){
                    dataInsert.acceptance     = acceptance;
                    updateContract.acceptance = Number(updateContract.acceptance)+Number(acceptance)
                }
                //______Giá trị nghiệm thu phần VAT (2)
                if(!isNaN(vatAcceptance) && Number(vatAcceptance) >= 0){
                    dataInsert.vatAcceptance     = vatAcceptance;
                    updateContract.vatAcceptance = Number(updateContract.vatAcceptance)+Number(vatAcceptance)
                }
                //______Giá trị nghiệm thu phát sinh trước VAT(3)
                if(!isNaN(plusAcceptance) && Number(plusAcceptance) >= 0){   
                    dataInsert.plusAcceptance     = plusAcceptance;
                    updateContract.plusAcceptance = Number(updateContract.plusAcceptance)+Number(plusAcceptance)
                }
                //_____Giá trị nghiệm thu phát sinh phần VAT(4)
                if(!isNaN(vatPlusAcceptance) && Number(vatPlusAcceptance) >= 0){
                    dataInsert.vatPlusAcceptance  = vatPlusAcceptance;
                    updateContract.vatPlusAcceptance = Number(updateContract.vatPlusAcceptance)+Number(vatPlusAcceptance)
                }
                //_____Giá trị giữ lại (5)
                if(!isNaN(retainedValue) && Number(retainedValue) >= 0){  
                    dataInsert.retainedValue     = retainedValue;
                    updateContract.retainedValue = Number(updateContract.retainedValue)+Number(retainedValue)
                }
                //_____Thu hồi tạm ứng (6)
                if(!isNaN(advancePaymentDeduction) && Number(advancePaymentDeduction) >= 0){  
                    dataInsert.advancePaymentDeduction     = advancePaymentDeduction;
                    updateContract.advancePaymentDeduction = Number(updateContract.advancePaymentDeduction)+Number(advancePaymentDeduction)
                }
                //_____Khấu trừ khác (nếu có) (7)
                if(!isNaN(otherDeduction) && Number(otherDeduction) >= 0){   
                    dataInsert.otherDeduction     = otherDeduction;
                    updateContract.otherDeduction = Number(updateContract.otherDeduction)+Number(otherDeduction)
                }
                //_____Đề nghị tạm ứng/thanh toán '(8)=(1+2+3+4)-(5+6+7)
                if(!isNaN(recommendedPayment) && Number(recommendedPayment) >= 0){ 
                    dataInsert.recommendedPayment     = recommendedPayment;
                    updateContract.recommendedPayment = Number(updateContract.recommendedPayment)+Number(recommendedPayment)
                }

                //_____Thời hạn thanh toán theo hợp đồng (9)
                if(timeForPayment){
                    dataInsert.timeForPayment     = timeForPayment;
                }
                //_____Đã giải ngân (10)
                if(!isNaN(amountPaid) && Number(amountPaid) >= 0){    
                    dataInsert.amountPaid     = amountPaid;

                    if(Number(type) === 1){
                        updateContract.advancePaymentPaid = Number(updateContract.advancePaymentPaid)+Number(amountPaid)
                    }
                    
                    if(Number(type) === 2){
                        updateContract.amountPaid = Number(updateContract.amountPaid)+Number(amountPaid)
                    }
                }
                //_____Còn lại chưa giải ngân (11)=(8)-(10)
                if(!isNaN(remainingPayment) && Number(remainingPayment) >= 0){  
                    dataInsert.remainingPayment     = remainingPayment;
                    updateContract.remainingPayment = Number(updateContract.remainingPayment)+Number(remainingPayment)
                }
                
                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "Không thể thêm contract ipc" ,keyError: "can't_insert_contract_ipc " });
              
                // Cập nhật các trường thông tin cho hợp đồng
                let infoContractAfterUpdate = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_UPDATE}`, {
                    contractID,
                    acceptance: Number(updateContract.acceptance),
                    vatAcceptance: Number(updateContract.vatAcceptance),
                    plusAcceptance: Number(updateContract.plusAcceptance),
                    vatPlusAcceptance: Number(updateContract.vatPlusAcceptance),
                    retainedValue: Number(updateContract.retainedValue),
                    advancePaymentDeduction: Number(updateContract.advancePaymentDeduction),
                    otherDeduction: Number(updateContract.otherDeduction),
                    recommendedPayment: Number(updateContract.recommendedPayment),
                    amountPaid: Number(updateContract.amountPaid),
                    remainingPayment: Number(updateContract.remainingPayment),
                })

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
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
                let updateContract = {}

                if(!checkObjectIDs(contractIpcID))
                    return resolve({ error: true, message: "Mã IPC không hợp kệ", keyError: "contract_ipc_invalid" })

                let infoContractIPC = await CMCS__CONTRACT_IPC_COLL.findById(contractIpcID);
                let contractID = infoContractIPC.contract;
                // console.log(infoContractIPC)
                // console.log(contractID)

                // Tính toán tổng giá trị của hợp đồng tới hiện tại, không gồm mẩu tin đang xét
                //===========CẦN DỰA VÀO TYPE ĐỂ PHÂN TÍNH TOÁN UPDATE CHO CONTRACT
                let listData = await CMCS__CONTRACT_IPC_COLL.aggregate([
                    {
                        $match: {
                            contract: ObjectID(contractID),
                            _id: { $nin: [ ObjectID(contractIpcID) ] },
                        }
                    }, 
                    {
                        $group: {
                            _id: { },
                            acceptance: { $sum: "$acceptance" },
                            vatAcceptance: { $sum: "$vatAcceptance" },
                            plusAcceptance: { $sum: "$plusAcceptance" },
                            vatPlusAcceptance: { $sum: "$vatPlusAcceptance" },
                            retainedValue: { $sum: "$retainedValue" },
                            advancePaymentDeduction: { $sum: "$advancePaymentDeduction" },
                            otherDeduction: { $sum: "$otherDeduction" },
                            recommendedPayment: { $sum: "$recommendedPayment" },
                            remainingPayment: { $sum: "$remainingPayment" },
                        }
                    }, 
                ])
                if(listData.length){
                    updateContract.acceptance = Number(listData[0].acceptance)
                    updateContract.vatAcceptance = Number(listData[0].vatAcceptance)
                    updateContract.plusAcceptance = Number(listData[0].plusAcceptance)
                    updateContract.vatPlusAcceptance = Number(listData[0].vatPlusAcceptance)
                    updateContract.retainedValue = Number(listData[0].retainedValue)
                    updateContract.advancePaymentDeduction = Number(listData[0].advancePaymentDeduction)
                    updateContract.otherDeduction = Number(listData[0].otherDeduction)
                    updateContract.recommendedPayment = Number(listData[0].recommendedPayment)
                    updateContract.remainingPayment = Number(listData[0].remainingPayment)
                    updateContract.advancePaymentPaid = Number(0)
                    updateContract.amountPaid = Number(0)
                }else{
                    updateContract.acceptance = Number(0)
                    updateContract.vatAcceptance = Number(0)
                    updateContract.plusAcceptance = Number(0)
                    updateContract.vatPlusAcceptance = Number(0)
                    updateContract.retainedValue = Number(0)
                    updateContract.advancePaymentDeduction = Number(0)
                    updateContract.otherDeduction = Number(0)
                    updateContract.recommendedPayment = Number(0)
                    updateContract.remainingPayment = Number(0)
                    updateContract.advancePaymentPaid = Number(0)
                    updateContract.amountPaid = Number(0)
                }

                // Đã tạm ứng
                let listData1 = await CMCS__CONTRACT_IPC_COLL.aggregate([
                    {
                        $match: {
                            contract: ObjectID(contractID),
                            type: 1,
                            _id: { $nin: [ ObjectID(contractIpcID) ] },
                        }
                    }, 
                    {
                        $group: {
                            _id: { },
                            advancePaymentPaid: { $sum: "$amountPaid" },
                        }
                    }, 
                ])

                // Đã thanh toán
                let listData2 = await CMCS__CONTRACT_IPC_COLL.aggregate([
                    {
                        $match: {
                            contract: ObjectID(contractID),
                            type: 2,
                            _id: { $nin: [ ObjectID(contractIpcID) ] },
                        }
                    }, 
                    {
                        $group: {
                            _id: { },
                            amountPaid: { $sum: "$amountPaid" },
                        }
                    }, 
                ])

                if(listData1.length){
                    updateContract.advancePaymentPaid = Number(listData1[0].advancePaymentPaid)
                }

                if(listData2.length){
                    updateContract.amountPaid = Number(listData2[0].amountPaid)
                }
                console.log('End==============contract')
                console.log(updateContract)

                /**End tính toán cho hợp đồng */

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
                if(!isNaN(acceptance) && Number(acceptance) >= 0){
                    dataUpdate.acceptance = acceptance;
                    updateContract.acceptance = Number(updateContract.acceptance)+Number(acceptance)
                }

                //______Giá trị nghiệm thu phần VAT (2)
                if(!isNaN(vatAcceptance) && Number(vatAcceptance) >= 0){
                    dataUpdate.vatAcceptance = vatAcceptance;
                    updateContract.vatAcceptance = Number(updateContract.vatAcceptance)+Number(vatAcceptance)
                }

                //______Giá trị nghiệm thu phát sinh trước VAT(3)
                if(!isNaN(plusAcceptance) && Number(plusAcceptance) >= 0){    
                    dataUpdate.plusAcceptance = plusAcceptance;
                    updateContract.plusAcceptance = Number(updateContract.plusAcceptance)+Number(plusAcceptance)
                }

                //_____Giá trị nghiệm thu phát sinh phần VAT(4)
                if(!isNaN(vatPlusAcceptance) && Number(vatPlusAcceptance) >= 0){
                    dataUpdate.vatPlusAcceptance = vatPlusAcceptance;
                    updateContract.vatPlusAcceptance = Number(updateContract.vatPlusAcceptance)+Number(vatPlusAcceptance)
                }

                //_____Giá trị giữ lại (5)
                if(!isNaN(retainedValue) && Number(retainedValue) >= 0){    
                    dataUpdate.retainedValue = retainedValue;
                    updateContract.retainedValue = Number(updateContract.retainedValue)+Number(retainedValue)
                }

                //_____Thu hồi tạm ứng (6)
                if(!isNaN(advancePaymentDeduction) && Number(advancePaymentDeduction) >= 0){    
                    dataUpdate.advancePaymentDeduction = advancePaymentDeduction;
                    updateContract.advancePaymentDeduction = Number(updateContract.advancePaymentDeduction)+Number(advancePaymentDeduction)
                }

                //_____Khấu trừ khác (nếu có) (7)
                if(!isNaN(otherDeduction) && Number(otherDeduction) >= 0){    
                    dataUpdate.otherDeduction = otherDeduction;
                    updateContract.otherDeduction = Number(updateContract.otherDeduction)+Number(otherDeduction)
                }
                
                //_____Đề nghị tạm ứng/thanh toán '(8)=(1+2+3+4)-(5+6+7)
                if(!isNaN(recommendedPayment) && Number(recommendedPayment) >= 0){    
                    dataUpdate.recommendedPayment = recommendedPayment;
                    updateContract.recommendedPayment = Number(updateContract.recommendedPayment)+Number(recommendedPayment)
                }

                //_____Thời hạn thanh toán theo hợp đồng (9)
                if(timeForPayment){
                    dataUpdate.timeForPayment = timeForPayment;
                }

                //_____Đã giải ngân (10)
                if(!isNaN(amountPaid) && Number(amountPaid) >= 0){   
                    dataUpdate.amountPaid = amountPaid;

                    if(Number(type) === 1){
                        updateContract.advancePaymentPaid = Number(updateContract.advancePaymentPaid)+Number(amountPaid)
                    }
                    
                    if(Number(type) === 2){
                        updateContract.amountPaid = Number(updateContract.amountPaid)+Number(amountPaid)
                    }
                }

                //_____Còn lại chưa giải ngân (11)=(8)-(10)
                if(!isNaN(remainingPayment) && Number(remainingPayment) >= 0){    
                    dataUpdate.remainingPayment = remainingPayment;
                    updateContract.remainingPayment = Number(updateContract.remainingPayment)+Number(remainingPayment)
                }
                console.log(updateContract)

                let infoAterUpdate = await CMCS__CONTRACT_IPC_COLL.findByIdAndUpdate(contractIpcID, dataUpdate, { new: true });
                if(!infoAterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại" ,keyError: "can't_update_contract_ipc", status: 403 });
                
                // Cập nhật các trường thông tin cho hợp đồng
                let infoContractAfterUpdate = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_UPDATE}`, {
                    contractID: `${contractID}`, // Convert để nhận đầu vào dạng String do Model contract yêu cầu
                    acceptance: Number(updateContract.acceptance),
                    vatAcceptance: Number(updateContract.vatAcceptance),
                    plusAcceptance: Number(updateContract.plusAcceptance),
                    vatPlusAcceptance: Number(updateContract.vatPlusAcceptance),
                    retainedValue: Number(updateContract.retainedValue),
                    advancePaymentDeduction: Number(updateContract.advancePaymentDeduction),
                    otherDeduction: Number(updateContract.otherDeduction),
                    recommendedPayment: Number(updateContract.recommendedPayment),
                    advancePaymentPaid: Number(updateContract.advancePaymentPaid),
                    amountPaid: Number(updateContract.amountPaid),
                    remainingPayment: Number(updateContract.remainingPayment),
                })
                // console.log(infoContractAfterUpdate)

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
    
    /**
     * Name: get info contract ipc ✅
     * Author: Depv
     * Code: 
     */
    getInfo({ contractIpcID, 
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
                }else{
                    limit = +limit;
                }
                /**
                 * DECALARTION VARIABLE (1)
                 */
                 let sortBy;
                 let conditionObj = {};
                 let keys	     = ['createAt__-1', '_id__-1'];
             
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
                }
                let conditionObjOrg = { ...conditionObj };

                // PHÂN TRANG KIỂU MỚI
                if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await CMCS__CONTRACT_IPC_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy       = dataPagingAndSort.data.sort;
                }
                
                let infoDataAfterGet = await CMCS__CONTRACT_IPC_COLL.find(conditionObj)
                    .limit(limit+1)
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

                let totalRecord = await CMCS__CONTRACT_IPC_COLL.count(conditionObjOrg);
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
     * Name: Gom nhóm theo tháng trong năm✅
     * Author: Hiepnh
     */
    getAmountByMonth({ userID, companyID, outin, year, ctx }){
        // console.log({ userID, companyID, outin, year })
        return new Promise(async resolve => {
            try {
                let listData = await CMCS__CONTRACT_IPC_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            outin: Number(outin),
                        }
                    }, 
                    {
                        $project : { 
                            year : {$year : "$date"},
                            month : {$month : "$date"},
                            amount: { $sum: ["$acceptance", "$vatAcceptance", "$plusAcceptance", "$vatPlusAcceptance"] },
                        }
                    },
                    {
                        $match: {
                            "year": Number(year),
                        }
                    }, 
                    {
                        $group: {
                            _id: { month: "$month" },
                            amount: { $sum: "$amount" },
                        }
                    },
                    {$sort: {"_id.month": 1}}    
                ])

                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Danh sách theo tháng trong năm✅
     * Author: Hiepnh
     * Date: 05/04/2022
     */
    getListByMonth({ userID, companyID, outin, month, year, 
        keyword, limit = 20, lastestID, select, populates= {} }){
        return new Promise(async resolve => {
            try {
                if(limit > 20){
                    limit = 20;
                } else{
                    limit = +limit;
                }

                let sortBy;
                let conditionObj = {};
                let keys	     = ['createAt__-1', '_id__-1'];

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

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regExpSearch = RegExp(keyword, 'i');
                    conditionObj.name = regExpSearch;
                }

                // Danh sách các Payment trong tháng, năm của công ty
                let listData = await CMCS__CONTRACT_IPC_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            outin: Number(outin),
                        }
                    },
                    {
                        $project : {
                            year : {$year : "$date"},
                            month : {$month : "$date"},
                        }
                    },
                    {
                        $match: {
                            "year": Number(year),
                            "month": Number(month),
                        }
                    },
                    {$sort: {"date": 1}}
                ])
                conditionObj._id = {$in: listData.map(item=>item._id)}

                // Trả về danh sách mẩu tin
                let conditionObjOrg = { ...conditionObj };

                if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await CMCS__CONTRACT_IPC_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy       = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await CMCS__CONTRACT_IPC_COLL.find(conditionObj)
                    .limit(limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data" });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await CMCS__CONTRACT_IPC_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: +limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                }, status: 200 });

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    } 
}

exports.MODEL = new Model;