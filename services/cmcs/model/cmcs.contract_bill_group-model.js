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
const CMCS__CONTRACT_PRODUCTION_COLL    = require('../database/cmcs.contract_production-coll');
const CMCS__CONTRACT_PAYMENT_COLL       = require('../database/cmcs.contract_payment-coll');
const CMCS__CONTRACT_BILL_ITEM_COLL     = require('../database/cmcs.contract_bill_item-coll');
const CMCS__CONTRACT_BILL_GROUP_COLL    = require('../database/cmcs.contract_bill_group-coll');
const CMCS__CONTRACT_BILL_JOB_COLL      = require('../database/cmcs.contract_bill_job-coll');
const CMCS__CONTRACT_IPC_DETAIL_COLL    = require('../database/cmcs.contract_ipc_detail-coll');


const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { template }                      = require('lodash');
const { ResumeToken }                   = require('mongodb');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {               
    constructor() {
        super(CMCS__CONTRACT_BILL_GROUP_COLL);
    }
    
    /**
     * Name: insert contract ipc 
     * Author: Depv
     * Code: 
     */
    insert({ type, contractID, name, sign, description, date, note, acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, timeForPayment, amountPaid, remainingPayment, userID, ctx  }) { 
        const that = this
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * Bước 1: Cập nhật thông tin vào IPC
                 * Bước 2: Cập nhật thông tin vào Hợp đồng
                 * Bước 3: Cập nhật thông tin vào Dự án => Nếu là dòng tiền của hợp đồng mua vào
                 */
                const infoContract = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_GET_INFO_AND_GET_LIST}`, {
                    contractID
                })

                if(infoContract.error)
                    return resolve({ error: true, message: "Hợp đồng không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID });

                const { outin, real, field, dependentUnit, personInCharge, chair, buyerInfo, sellerInfo, company, project } = infoContract.data;

                let dataInsert = { userCreate: userID, outin, real, field, dependentUnit, personInCharge, chair, buyerInfo, sellerInfo, company, project, contract: contractID };
                
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
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
                }
                //______Giá trị nghiệm thu phần VAT (2)
                if(!isNaN(vatAcceptance) && Number(vatAcceptance) >= 0){
                    dataInsert.vatAcceptance     = vatAcceptance;
                }
                //______Giá trị nghiệm thu phát sinh trước VAT(3)
                if(!isNaN(plusAcceptance) && Number(plusAcceptance) >= 0){   
                    dataInsert.plusAcceptance     = plusAcceptance;
                }
                //_____Giá trị nghiệm thu phát sinh phần VAT(4)
                if(!isNaN(vatPlusAcceptance) && Number(vatPlusAcceptance) >= 0){
                    dataInsert.vatPlusAcceptance  = vatPlusAcceptance;
                }
                //_____Giá trị giữ lại (5)
                if(!isNaN(retainedValue) && Number(retainedValue) >= 0){  
                    dataInsert.retainedValue     = retainedValue;
                }
                //_____Thu hồi tạm ứng (6)
                if(!isNaN(advancePaymentDeduction) && Number(advancePaymentDeduction) >= 0){  
                    dataInsert.advancePaymentDeduction     = advancePaymentDeduction;
                }
                //_____Khấu trừ khác (nếu có) (7)
                if(!isNaN(otherDeduction) && Number(otherDeduction) >= 0){   
                    dataInsert.otherDeduction     = otherDeduction;
                }
                //_____Đề nghị tạm ứng/thanh toán '(8)=(1+2+3+4)-(5+6+7)
                if(!isNaN(recommendedPayment) && Number(recommendedPayment) >= 0){ 
                    dataInsert.recommendedPayment     = recommendedPayment;
                }

                //_____Thời hạn thanh toán theo hợp đồng (9)
                if(timeForPayment){
                    dataInsert.timeForPayment     = timeForPayment;
                }

                // //_____Đã giải ngân (10)
                // if(!isNaN(amountPaid) && Number(amountPaid) >= 0){    
                //     dataInsert.amountPaid     = amountPaid;
                // }

                //_____Còn lại chưa giải ngân (11)=(8)-(10)
                if(!isNaN(remainingPayment) && Number(remainingPayment) >= 0){  
                    dataInsert.remainingPayment     = remainingPayment;
                }
                
                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "Không thể thêm contract ipc" ,keyError: "can't_insert_contract_ipc " });

                /**
                 * CẬP NHẬT CHO PHẦN HỢP ĐỒNG
                 */    
                await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_UPDATE_VALUE}`, {
                    option: 2,
                    contractID,
                    userID
                })

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: update contract ipc 
     * Author: Depv
     * Code: 
     */
    update({ 
        contractIpcID, type, name, sign, description, date, note, acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, timeForPayment, amountPaid, remainingPayment, userID, ctx
    }){
        const that = this
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID };

                if(!checkObjectIDs(contractIpcID))
                    return resolve({ error: true, message: "Mã IPC không hợp kệ", keyError: "contract_ipc_invalid" })

                let infoContractIPC = await CMCS__CONTRACT_BILL_ITEM_COLL.findById(contractIpcID);
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
                if(!isNaN(acceptance) && Number(acceptance) >= 0){
                    dataUpdate.acceptance = acceptance;
                }

                //______Giá trị nghiệm thu phần VAT (2)
                if(!isNaN(vatAcceptance) && Number(vatAcceptance) >= 0){
                    dataUpdate.vatAcceptance = vatAcceptance;
                }

                //______Giá trị nghiệm thu phát sinh trước VAT(3)
                if(!isNaN(plusAcceptance) && Number(plusAcceptance) >= 0){    
                    dataUpdate.plusAcceptance = plusAcceptance;
                }

                //_____Giá trị nghiệm thu phát sinh phần VAT(4)
                if(!isNaN(vatPlusAcceptance) && Number(vatPlusAcceptance) >= 0){
                    dataUpdate.vatPlusAcceptance = vatPlusAcceptance;
                }

                //_____Giá trị giữ lại (5)
                if(!isNaN(retainedValue) && Number(retainedValue) >= 0){    
                    dataUpdate.retainedValue = retainedValue;
                }

                //_____Thu hồi tạm ứng (6)
                if(!isNaN(advancePaymentDeduction) && Number(advancePaymentDeduction) >= 0){    
                    dataUpdate.advancePaymentDeduction = advancePaymentDeduction;
                }

                //_____Khấu trừ khác (nếu có) (7)
                if(!isNaN(otherDeduction) && Number(otherDeduction) >= 0){    
                    dataUpdate.otherDeduction = otherDeduction;
                }
                
                //_____Đề nghị tạm ứng/thanh toán '(8)=(1+2+3+4)-(5+6+7)
                if(!isNaN(recommendedPayment) && Number(recommendedPayment) >= 0){    
                    dataUpdate.recommendedPayment = recommendedPayment;
                }

                //_____Thời hạn thanh toán theo hợp đồng (9)
                if(timeForPayment){
                    dataUpdate.timeForPayment = timeForPayment;
                }

                //_____Đã giải ngân (10)
                // if(!isNaN(amountPaid) && Number(amountPaid) >= 0){   
                //     dataUpdate.amountPaid = amountPaid;
                // }

                //_____Còn lại chưa giải ngân (11)=(8)-(10)
                if(!isNaN(remainingPayment) && Number(remainingPayment) >= 0){    
                    dataUpdate.remainingPayment = remainingPayment;
                }

                let infoAfterUpdate = await CMCS__CONTRACT_BILL_ITEM_COLL.findByIdAndUpdate(contractIpcID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại" ,keyError: "can't_update_contract_ipc", status: 403 });

                /**
                 * CẬP NHẬT CHO PHẦN HỢP ĐỒNG
                 */    
                console.log('CẬP NHẬT CHO PHẦN HỢP ĐỒNG')
                let infoContract = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTRACT_UPDATE_VALUE}`, {
                    option: 2,
                    contractID: `${contractID}`,
                    userID
                })

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                console.log(error)   
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Cập nhật giá trị 
     * Author: Hiepnh
     * Date  : 12/4/2022 
     */
    updateValue({ 
        option, ipcID, userID
    }){ 
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * 1-Cập nhật giá trị ngân sách
                 * 2-Cập nhật dự báo ngân sách
                 * 3-Cập nhật thực hiện ngân sách
                 */

                if(!checkObjectIDs(ipcID))
                    return resolve({ error: true, message: "Mã hiệu không đúng", keyError: "ipcID_invalid" })

                let infoIpc = await CMCS__CONTRACT_BILL_ITEM_COLL.findById(ipcID)
                let recommendedPayment = 0
                if(infoIpc.recommendedPayment){
                    recommendedPayment = infoIpc.recommendedPayment
                }

                // console.log(infoIpc)
                // console.log(infoIpc.recommendedPayment)
                // console.log({recommendedPayment})
                
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

                //1-Cập nhật Sản lượng

                //2-Cập nhật Doanh thu

                // Cập nhật Tiền về
                if(option && Number(option) === 3){
                    let listData = await CMCS__CONTRACT_PAYMENT_COLL.aggregate([
                        {
                            $match: {
                                ipc: ObjectID(ipcID),
                            }
                        }, 
                        {
                            $group: {
                                _id: { },
                                amount: { $sum: "$value" },
                            }
                        }, 
                    ])

                    // console.log(listData)

                    if(listData && listData.length){
                        dataUpdate.amountPaid = Number(listData[0].amount)
                        dataUpdate.remainingPayment = Number(recommendedPayment) - Number(listData[0].amount)
                    }
                }
                // console.log("dataUpdate====================>>>>>>>>>>>>>>")
                // console.log(dataUpdate)
                

                let infoAfterUpdate = await CMCS__CONTRACT_BILL_ITEM_COLL.findByIdAndUpdate(ipcID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update_contract_ipc", status: 403 });

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Remove contract ipc 
     * Author: Depv
     * Code: 
     */
    
    /**
     * Name: get info contract ipc 
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

                let infoContractIPC = await CMCS__CONTRACT_BILL_ITEM_COLL.findById(contractIpcID)
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
     * Name  : Danh sách contract ipc 
     * Author: Depv
     * Code  : 
     */
    getList({ isMember, option, companyID, projectID, contractID, type, outin, real, field, dependentUnit, personInCharge, chair, buyerInfo, sellerInfo, userID,
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
                if(!isNaN(type) && Number(type) > 0){
                    conditionObj.type = Number(type)
                }

                if(!isNaN(outin) && Number(outin) > 0){
                    conditionObj.outin = Number(outin)
                }

                if(!isNaN(real) && Number(real) > 0){
                    conditionObj.real = real
                }

                if(contractID && checkObjectIDs(contractID)){
                    conditionObj.contract = ObjectID(contractID)
                }else{
                    if(projectID && checkObjectIDs(projectID)){
                        conditionObj.project = ObjectID(projectID)
                    }else{
                        if(companyID && checkObjectIDs(companyID)){
                            conditionObj.company = ObjectID(companyID)
                        }        
                    }
                }

                if(field && checkObjectIDs(field)){
                    conditionObj.field = ObjectID(field)
                }

                if(dependentUnit && checkObjectIDs(dependentUnit)){
                    conditionObjAgg.dependentUnit = ObjectID(dependentUnit)
                }

                if(chair && checkObjectIDs(chair)){
                    conditionObj.chair = ObjectID(chair)
                }

                if(personInCharge && checkObjectIDs(personInCharge)){
                    conditionObj.personInCharge = ObjectID(personInCharge)
                }

                if(buyerInfo && checkObjectIDs(buyerInfo)){
                    conditionObj.buyerInfo = ObjectID(buyerInfo)
                }

                if(sellerInfo && checkObjectIDs(sellerInfo)){
                    conditionObj.sellerInfo = ObjectID(sellerInfo)
                }

                // Công nợ phải thực hiện
                if(!isNaN(option) && Number(option) >= 0){

                    // Cấu hình thời gian để kiểm tra quá hạn
                    let start = new Date();
                    start.setHours(0,0,0,0);

                    conditionObj.remainingPayment = {
                        $gt: 0
                    }   

                    // Tổng công nợ
                    if(!isNaN(option) && Number(option)=== 1){
                       
                    }

                    // Công nợ trong kỳ
                    if(!isNaN(option) && Number(option)=== 2){
                         conditionObj.timeForPayment = {
                             $gte: start,
                             $exists: true,
                             $ne: null
                         }
                    }

                    // Công nợ quá hạn
                    if(!isNaN(option) && Number(option)=== 3){
                        conditionObj.timeForPayment = {
                            $lt: start,
                            $exists: true,
                            $ne: null
                        }
                    }
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
					let infoData = await CMCS__CONTRACT_BILL_ITEM_COLL.findById(lastestID);
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
                
                let infoDataAfterGet = await CMCS__CONTRACT_BILL_ITEM_COLL.find(conditionObj)
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

                let totalRecord = await CMCS__CONTRACT_BILL_ITEM_COLL.count(conditionObjOrg);
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