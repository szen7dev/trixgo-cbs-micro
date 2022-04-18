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
const CMCS__CONTRACT_IPC_COLL           = require('../database/cmcs.contract_ipc-coll');
const CMCS__CONTRACT_PAYMENT_COLL       = require('../database/cmcs.contract_payment-coll');

const ITEM__DOCTYPE_COLL            	= require('../../item/database/item.doctype-coll');

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

                const { outin, real, field, chair, personInCharge, buyerInfo, sellerInfo, company, project } = infoContract.data;

                let dataInsert = { userCreate: userID, outin, real, field, chair, personInCharge, buyerInfo, sellerInfo, company, project, contract: contractID };
                
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
     * Name: update contract ipc ✅
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

                let infoAfterUpdate = await CMCS__CONTRACT_IPC_COLL.findByIdAndUpdate(contractIpcID, dataUpdate, { new: true });
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
     * Name  : Cập nhật giá trị ✅
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

                let infoIpc = await CMCS__CONTRACT_IPC_COLL.findById(ipcID)
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
                

                let infoAfterUpdate = await CMCS__CONTRACT_IPC_COLL.findByIdAndUpdate(ipcID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update_contract_ipc", status: 403 });

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
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
    getList({ isMember, option, companyID, projectID, contractID, type, outin, real, field, chair, personInCharge, buyerInfo, sellerInfo, userID,
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
                if(!isNaN(type) && Number(type) >= 0){
                    conditionObj.type = type
                }

                if(!isNaN(outin) && Number(outin) >= 0){
                    conditionObj.outin = outin
                }

                if(!isNaN(real) && Number(real) >= 0){
                    conditionObj.real = real
                }

                if(companyID && checkObjectIDs(companyID)){
                    conditionObj.company = ObjectID(companyID)
                }

                if(projectID && checkObjectIDs(projectID)){
                    conditionObj.project = ObjectID(projectID)
                }

                if(contractID && checkObjectIDs(contractID)){
                    conditionObj.contract = ObjectID(contractID)
                }

                if(field && checkObjectIDs(field)){
                    conditionObj.field = ObjectID(field)
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

    /**
     * Name: Gom nhóm theo tháng trong năm✅
     * Author: Hiepnh
     * Date: 5/4/2022
     */
    getAmountByMonth({ userID, companyID, projectID, outin, year, ctx }){
        return new Promise(async resolve => {
            try {
                let conditionObj = {}, conditionGroup = {}, conditionObjYear = {}

                // Tính toán theo companyID
                if(companyID && checkObjectIDs(companyID)){
                    conditionObj.company = ObjectID(companyID)

                    conditionGroup = {
                        _id: { month: "$month" },
                        amount: { $sum: "$amount" },
                    }
                }

                // Tính toán theo projectID: gom nhóm theo các tháng trong năm
                if(projectID && checkObjectIDs(projectID)){
                    conditionObj.project = ObjectID(projectID)

                    conditionGroup = {
                        _id: { month: "$month", year: "$year" },
                        amount: { $sum: "$amount" },
                    }
                }

                if(!isNaN(outin) && Number(outin) >= 0){
                    conditionObj.outin = outin
                }

                if(!isNaN(year) && Number(year) >= 0){
                    conditionObjYear = {
                        "year": Number(year),
                    }
                }

                let listData = await CMCS__CONTRACT_IPC_COLL.aggregate([
                    {
                        $match: conditionObj
                    }, 
                    {
                        $project : { 
                            year : {$year : "$date"},
                            month : {$month : "$date"},
                            amount: { $sum: ["$acceptance", "$vatAcceptance", "$plusAcceptance", "$vatPlusAcceptance"] },
                        }
                    },
                    {
                        $match: conditionObjYear
                    }, 
                    {
                        $group: conditionGroup
                    },
                    {
                        $sort: {
                            "_id.year": 1,
                            "_id.month": 1,
                        }
                    } 
                ])

                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Gom nhóm theo đối tượng ✅
     * Author: Hiepnh
     * Date: 04/04/2022
     */
    getAmountByObject({ userID, outin, companyID, projectID, contractID }){
        console.log('=================IPC:getAmountByObject==>>>>>>>>>>>')
        console.log({ userID, outin, companyID, projectID, contractID })
        return new Promise(async resolve => {
            try {
                /**
                 * BA-Hiepnh 18/4/2022
                 * Kiểm tra lại tại sao lại truyền companyID mặc định lên ở đây khi update IPC?
                 */

                let acceptance=0, vatAcceptance=0, plusAcceptance=0, vatPlusAcceptance=0, retainedValue=0, advancePaymentDeduction=0, otherDeduction=0, recommendedPayment = 0, advancePaymentPaid=0, amountPaid=0, remainingPayment=0

                let conditionObj1 = {type: 1}, conditionObj2 = {type: 2}

                // if(!isNaN(outin) && Number(outin) >= 0){
                //     conditionObj1.outin = outin
                //     conditionObj2.outin = outin
                // }

                if(contractID && checkObjectIDs(contractID)){
                    conditionObj1.contract = ObjectID(contractID)
                    conditionObj2.contract = ObjectID(contractID)
                }else{
                    if(projectID && checkObjectIDs(projectID)){
                        conditionObj1.project = ObjectID(projectID)
                        conditionObj2.project = ObjectID(projectID)
                    }else{
                        if(companyID && checkObjectIDs(companyID)){
                            conditionObj1.company = ObjectID(companyID)
                            conditionObj2.company = ObjectID(companyID)
                        }
                    }
                }

                // console.log(conditionObj1)
                // console.log(conditionObj2)

                let listData1 = await CMCS__CONTRACT_IPC_COLL.aggregate([
                    {
                        $match: conditionObj1
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
                            amountPaid: { $sum: "$amountPaid" },
                            remainingPayment: { $sum: "$remainingPayment" }
                        }
                    }, 
                ])
                // console.log('listData1')
                // console.log(listData1)

                let listData2 = await CMCS__CONTRACT_IPC_COLL.aggregate([
                    {
                        $match: conditionObj2
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
                            amountPaid: { $sum: "$amountPaid" },
                            remainingPayment: { $sum: "$remainingPayment" }
                        }
                    }, 
                ])
                // console.log('listData2')
                // console.log(listData2)

                if(listData1 && listData1.length){
                    acceptance = Number(acceptance) + Number(listData1[0].acceptance)
                    vatAcceptance = Number(vatAcceptance) +  Number(listData1[0].vatAcceptance)
                    plusAcceptance = Number(plusAcceptance) +  Number(listData1[0].plusAcceptance)
                    vatPlusAcceptance = Number(vatPlusAcceptance) +  Number(listData1[0].vatPlusAcceptance)
                    retainedValue = Number(retainedValue) +  Number(listData1[0].retainedValue)
                    advancePaymentDeduction = Number(advancePaymentDeduction) +  Number(listData1[0].advancePaymentDeduction)
                    otherDeduction = Number(otherDeduction) +  Number(listData1[0].otherDeduction)
                    recommendedPayment = Number(recommendedPayment) +  Number(listData1[0].recommendedPayment)
                    advancePaymentPaid = Number(advancePaymentPaid) +  Number(listData1[0].amountPaid) // Tạm ứng
                    remainingPayment = Number(remainingPayment) +  Number(listData1[0].remainingPayment)
                }

                if(listData2 && listData2.length){
                    acceptance = Number(acceptance) + Number(listData2[0].acceptance)
                    vatAcceptance = Number(vatAcceptance) +  Number(listData2[0].vatAcceptance)
                    plusAcceptance = Number(plusAcceptance) +  Number(listData2[0].plusAcceptance)
                    vatPlusAcceptance = Number(vatPlusAcceptance) +  Number(listData2[0].vatPlusAcceptance)
                    retainedValue = Number(retainedValue) +  Number(listData2[0].retainedValue)
                    advancePaymentDeduction = Number(advancePaymentDeduction) +  Number(listData2[0].advancePaymentDeduction)
                    otherDeduction = Number(otherDeduction) +  Number(listData2[0].otherDeduction)
                    recommendedPayment = Number(recommendedPayment) +  Number(listData2[0].recommendedPayment)
                    amountPaid = Number(amountPaid) +  Number(listData2[0].amountPaid) // Thanh toán
                    remainingPayment = Number(remainingPayment) +  Number(listData2[0].remainingPayment)
                }

                return resolve({ error: false, data: { acceptance, vatAcceptance, plusAcceptance, vatPlusAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, advancePaymentPaid, amountPaid, remainingPayment } });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Gom nhóm theo thuộc tính ✅
     * Author: Hiepnh
     * Date: 17/04/2022
     */
    getAmountByProperty({ userID, outin, companyID, projectID, contractID, option, debt, year, ctx }){
        return new Promise(async resolve => {
            try {
                let conditionObj = {}, conditionGroup = {}, conditionObjYear = {}, conditionPopulate = {}, sortBy = {"amount": 1}

                if(!isNaN(outin) && Number(outin) >= 0){
                    conditionObj.outin = outin
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

                console.log(conditionObj)

                // BÁO CÁO CÔNG NỢ
                if(!isNaN(debt) && Number(debt) >= 0){
                    // Tổng công nợ
                    if(Number(debt) === 1){
                        console.log('1.1==================')
                        // Giá trị còn lại phải thanh toán > 0
                        conditionObj.remainingPayment = {
                            $gt: 0
                        }
                    }

                    // Tổng công nợ quá hạn
                    if(Number(debt) === 2){
                        console.log('1.2==================')
                        // Cấu hình thời gian để kiểm tra quá hạn
                        let start = new Date();
                        start.setHours(0,0,0,0);
        
                        // Lấy việc quá hạn
                        conditionObj.timeForPayment = {
                            $lt: start,
                            $exists: true,
                            $ne: null
                        }

                        // Giá trị còn lại phải thanh toán > 0
                        conditionObj.remainingPayment = {
                            $gt: 0
                        }
                    }
                    
                    // Tổng hợp chung, không phân loại
                    conditionGroup = {
                        _id: { },
                        amount: { $sum: "$remainingPayment" },
                    }

                    // Theo Lĩnh vực
                    if(!isNaN(option) && Number(option) === 1){
                        conditionGroup = {
                            _id: { field: "$field" },
                            amount: { $sum: "$remainingPayment" },
                        }

                        conditionPopulate = {
                            path: '_id.field',
                            select: '_id name sign',
                            model: 'doctype'
                        }

                        sortBy = {
                            "_id.field": 1,
                        }
                    }

                    // Theo Người mua
                    if(!isNaN(option) && Number(option) === 2){
                        conditionGroup = {
                            _id: { buyerInfo: "$buyerInfo" },
                            amount: { $sum: "$remainingPayment" },
                        }

                        conditionPopulate = {
                            path: '_id.buyerInfo',
                            select: '_id name sign',
                            model: 'contact'
                        }

                        sortBy = {
                            "_id.buyerInfo": 1,
                        }
                    }

                    // Theo Người bán
                    if(!isNaN(option) && Number(option) === 3){
                        conditionGroup = {
                            _id: { sellerInfo: "$sellerInfo" },
                            amount: { $sum: "$remainingPayment" },
                        }

                        conditionPopulate = {
                            path: '_id.sellerInfo',
                            select: '_id name sign',
                            model: 'contact'
                        }

                        sortBy = {
                            "_id.sellerInfo": 1,
                        }
                    }
                    
                    // Theo Phụ trách/đơn vị
                    if(!isNaN(option) && Number(option) === 4){
                        conditionGroup = {
                            _id: { personInCharge: "$personInCharge" },
                            amount: { $sum: "$remainingPayment" },
                        }

                        conditionPopulate = {
                            path: '_id.personInCharge',
                            select: '_id name sign',
                            model: 'contact'
                        }

                        sortBy = {
                            "_id.personInCharge": 1,
                        }
                    }

                    // Theo Chủ trì
                    if(!isNaN(option) && Number(option) === 5){
                        conditionGroup = {
                            _id: { chair: "$chair" },
                            amount: { $sum: "$remainingPayment" },
                        }

                        conditionPopulate = {
                            path: '_id.chair',
                            select: '_id name sign',
                            model: 'contact'
                        }

                        sortBy = {
                            "_id.chair": 1,
                        }
                    }  
                }else{
                    // BÁO CÁO DOANH THU
                    if(!isNaN(year) && Number(year) >= 0){
                        console.log('2.1==================')
                        conditionObjYear = {
                            "year": Number(year),
                        }

                        // Tổng hợp chung, không phân loại
                        conditionGroup = {
                            _id: { },
                            amount: { $sum: "$amount" },
                        }

                        // Theo Lĩnh vực
                        if(!isNaN(option) && Number(option) === 1){
                            conditionGroup = {
                                _id: { field: "$field", month: "$month", year: "$year" },
                                amount: { $sum: "$amount" },
                            }

                            conditionPopulate = {
                                path: '_id.field',
                                select: '_id name sign',
                                model: 'doctype'
                            }

                            sortBy = {
                                "_id.field": 1,
                            }
                        }

                        // Theo Người mua
                        if(!isNaN(option) && Number(option) === 2){
                            conditionGroup = {
                                _id: { buyerInfo: "$buyerInfo", month: "$month", year: "$year" },
                                amount: { $sum: "$amount" },
                            }

                            conditionPopulate = {
                                path: '_id.buyerInfo',
                                select: '_id name sign',
                                model: 'contact'
                            }

                            sortBy = {
                                "_id.buyerInfo": 1,
                            }
                        }

                        // Theo Người bán
                        if(!isNaN(option) && Number(option) === 3){
                            conditionGroup = {
                                _id: { sellerInfo: "$sellerInfo", month: "$month", year: "$year" },
                                amount: { $sum: "$amount" },
                            }

                            conditionPopulate = {
                                path: '_id.sellerInfo',
                                select: '_id name sign',
                                model: 'contact'
                            }

                            sortBy = {
                                "_id.sellerInfo": 1,
                            }
                        }
                        
                        // Theo Phụ trách/đơn vị
                        if(!isNaN(option) && Number(option) === 4){
                            conditionGroup = {
                                _id: { personInCharge: "$personInCharge", month: "$month", year: "$year" },
                                amount: { $sum: "$amount" },
                            }

                            conditionPopulate = {
                                path: '_id.personInCharge',
                                select: '_id name sign',
                                model: 'contact'
                            }

                            sortBy = {
                                "_id.personInCharge": 1,
                            }
                        }

                        // Theo Chủ trì
                        if(!isNaN(option) && Number(option) === 5){
                            conditionGroup = {
                                _id: { chair: "$chair", month: "$month", year: "$year" },
                                amount: { $sum: "$amount" },
                            }

                            conditionPopulate = {
                                path: '_id.chair',
                                select: '_id name sign',
                                model: 'contact'
                            }

                            sortBy = {
                                "_id.chair": 1,
                            }
                        }  
                    }else{
                        console.log('2.2==================')

                        // Tổng hợp chung, không phân loại
                        conditionGroup = {
                            _id: { },
                            amount: { $sum: "$amount" },
                        }

                        // Theo Lĩnh vực
                        if(!isNaN(option) && Number(option) === 1){
                            conditionGroup = {
                                _id: { field: "$field" },
                                amount: { $sum: "$amount" },
                            }

                            conditionPopulate = {
                                path: '_id.field',
                                select: '_id name sign',
                                model: 'doctype'
                            }

                            sortBy = {
                                "_id.field": 1,
                            }
                        }

                        // Theo Người mua
                        if(!isNaN(option) && Number(option) === 2){
                            conditionGroup = {
                                _id: { buyerInfo: "$buyerInfo" },
                                amount: { $sum: "$amount" },
                            }

                            conditionPopulate = {
                                path: '_id.buyerInfo',
                                select: '_id name sign',
                                model: 'contact'
                            }

                            sortBy = {
                                "_id.buyerInfo": 1,
                            }
                        }

                        // Theo Người bán
                        if(!isNaN(option) && Number(option) === 2){
                            conditionGroup = {
                                _id: { sellerInfo: "$sellerInfo" },
                                amount: { $sum: "$amount" },
                            }

                            conditionPopulate = {
                                path: '_id.sellerInfo',
                                select: '_id name sign',
                                model: 'contact'
                            }

                            sortBy = {
                                "_id.sellerInfo": 1,
                            }
                        }

                        // Theo Phụ trách/đơn vị
                        if(!isNaN(option) && Number(option) === 4){
                            conditionGroup = {
                                _id: { personInCharge: "$personInCharge" },
                                amount: { $sum: "$amount" },
                            }

                            conditionPopulate = {
                                path: '_id.personInCharge',
                                select: '_id name sign',
                                model: 'contact'
                            }

                            sortBy = {
                                "_id.personInCharge": 1,
                            }
                        }  

                        // Theo Chủ trì
                        if(!isNaN(option) && Number(option) === 5){
                            conditionGroup = {
                                _id: { chair: "$chair" },
                                amount: { $sum: "$amount" },
                            }

                            conditionPopulate = {
                                path: '_id.chair',
                                select: '_id name sign',
                                model: 'contact'
                            }

                            sortBy = {
                                "_id.chair": 1,
                            }
                        }
                    }
                }

                console.log(conditionObj)
                console.log(conditionObjYear)
                console.log(conditionGroup)

                let listData = await CMCS__CONTRACT_IPC_COLL.aggregate([
                    {
                        $match: conditionObj
                    }, 
                    {
                        $project : { 
                            year : {$year : "$date"},
                            month : {$month : "$date"},
                            amount: { $sum: ["$acceptance", "$vatAcceptance", "$plusAcceptance", "$vatPlusAcceptance"] },
                            type: 1,
                            outin: 1,
                            real: 1,
                            field: 1,
                            buyerInfo: 1,
                            chair: 1,
                            personInCharge: 1,
                            timeForPayment: 1,
                            remainingPayment: 1,
                        }
                    },
                    {
                        $match: conditionObjYear
                    }, 
                    {
                        $group: conditionGroup
                    }, 
                    {
                        $sort: sortBy
                    } 
                ])

                if(!isNaN(option) && Number(option) > 0){
                    await CMCS__CONTRACT_IPC_COLL.populate(listData, conditionPopulate)
                }

                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

}

exports.MODEL = new Model;