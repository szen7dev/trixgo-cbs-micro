"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');

const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const ObjectID                          = require('mongoose').Types.ObjectId;
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_BUDGET } 		    = require('../../budget/helper/budget.actions-constant');
const { CF_ACTIONS_ACCOUNTING } 		= require('../../accounting/helper/accounting.actions-constant');

/**
 * import inter-coll, exter-coll
 */
 const BUDGET_COLL                       = require('../database/budget-coll');
 const BUDGET__ITEM_COLL                 = require('../database/budget.item-coll');
 const BUDGET__GROUP_COLL                = require('../database/budget.group-coll');
 const BUDGET__WORK_COLL                 = require('../database/budget.work-coll');

const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { template }                      = require('lodash');
const { ResumeToken }                   = require('mongodb');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {               
    constructor() {
        super(BUDGET__GROUP_COLL);
    }
    
    /**
     * Name: insert contract ipc ✅
     * Author: Depv
     * Code: 
     */
    insert({ ctx, userID, itemID, plus, reasonID, name, sign, unit, description, note, quantity, unitPrice, vatUnitPrice, amount, vatAmount, forecastQuantity, forecastUnitPrice, forecastVatUnitPrice, forecastAmount, forecastVatAmount }) { 
        return new Promise(async (resolve) => {
            try {
                    
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let infoItem = await BUDGET__ITEM_COLL.findById(itemID);
                if(!infoItem)
                    return resolve({ error: true, message: "Item không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID });

                let dataInsert = { userCreate: userID, company: infoItem.company, budget: infoItem.budget, item: itemID };

                // Company lấy theo itemID

                if(checkObjectIDs(infoItem.project)){
                    dataInsert.project = infoItem.project
                }

                if(checkObjectIDs(infoItem.contract)){
                    dataInsert.contract = infoItem.contract
                }

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(checkObjectIDs(reasonID)){
                    dataInsert.reason = reasonID
                }

                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                if(plus && [0,1,2].includes(Number(plus))){
                    dataInsert.plus = plus;
                }

                if(name){
                    dataInsert.name = name;
                }

                if(sign){
                    dataInsert.sign = sign;
                }

                if(unit){
                    dataInsert.unit = unit;
                }

                if(description){
                    dataInsert.description = description;
                }

                if(note){
                    dataInsert.note = note;
                }

                //______Giá trị
                if(!isNaN(quantity) && Number(quantity) >= 0){
                    dataInsert.quantity     = quantity;
                }
                if(!isNaN(unitPrice) && Number(unitPrice) >= 0){
                    dataInsert.unitPrice     = unitPrice;
                    dataInsert.amount       = Number(quantity)*Number(unitPrice);
                }
                if(!isNaN(vatUnitPrice) && Number(vatUnitPrice) >= 0){
                    dataInsert.vatUnitPrice     = vatUnitPrice;
                    dataInsert.vatAmount     = Number(quantity)*Number(vatUnitPrice);
                }
                // if(!isNaN(amount) && Number(amount) >= 0){
                //     dataInsert.amount     = amount;
                // }
                // if(!isNaN(vatAmount) && Number(vatAmount) >= 0){
                //     dataInsert.vatAmount     = vatAmount;
                // }
                if(!isNaN(forecastQuantity) && Number(forecastQuantity) >= 0){
                    dataInsert.forecastQuantity     = forecastQuantity;
                }
                if(!isNaN(forecastUnitPrice) && Number(forecastUnitPrice) >= 0){
                    dataInsert.forecastUnitPrice     = forecastUnitPrice;
                    dataInsert.forecastAmount       = Number(forecastQuantity)*Number(forecastUnitPrice);
                }
                if(!isNaN(forecastVatUnitPrice) && Number(forecastVatUnitPrice) >= 0){
                    dataInsert.forecastVatUnitPrice     = forecastVatUnitPrice;
                    dataInsert.forecastVatAmount       = Number(forecastQuantity)*Number(forecastVatUnitPrice);
                }
                // if(!isNaN(forecastAmount) && Number(forecastAmount) >= 0){
                //     dataInsert.forecastAmount     = forecastAmount;
                // }
                // if(!isNaN(forecastVatAmount) && Number(forecastVatAmount) >= 0){
                //     dataInsert.forecastVatAmount     = forecastVatAmount;
                // }
                
                let infoAterInsert = await this.insertData(dataInsert);
                if(!infoAterInsert)
                    return resolve({ error: true, message: "Không thể thêm contract ipc" ,keyError: "can't_insert_contract_ipc " });

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
        contractProductionID, name, sign, description, date, produce, vatProduce, plusProduce, vatPlusProduce, userID, ctx
    }){ 
        return new Promise(async (resolve) => {
            try {

                if(!checkObjectIDs(contractProductionID))
                    return resolve({ error: true, message: "Mã sản lượng hợp đồng không đúng", keyError: "contractProductionID_invalid" });
                
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID };

                // Object update contract ($inc)
                let updateContract = {};
                let infoContractProduction = await BUDGET_COLL.findById(contractProductionID);
                let contractID = infoContractProduction.contract;
                
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

                if(produce){
                    dataUpdate.produce = produce;
                    // Giá trị produce hiện tại lúc chưa thay đổi
                    let produceCurrent = infoContractProduction.produce;
            
                    // Giá trị chênh lệch khi thay đổi
                    let produceAfter   = produce - produceCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.produce = produceAfter;
                }

                if(vatProduce){
                    dataUpdate.vatProduce = vatProduce;

                    // Giá trị vatProduce hiện tại lúc chưa thay đổi
                    let vatProduceCurrent = infoContractProduction.vatProduce;
        
                    // Giá trị chênh lệch khi thay đổi
                    let vatProduceAfter   = vatProduce - vatProduceCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.vatProduce = vatProduceAfter;
                }

                if(plusProduce){
                    dataUpdate.plusProduce = plusProduce;

                    // Giá trị plusProduce hiện tại lúc chưa thay đổi
                    let plusProduceCurrent = infoContractProduction.plusProduce;
    
                    // Giá trị chênh lệch khi thay đổi
                    let plusProduceAfter   = plusProduce - plusProduceCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.plusProduce = plusProduceAfter;
                }
                
                if(vatPlusProduce){
                    dataUpdate.vatPlusProduce = vatPlusProduce;

                    // Giá trị vatPlusProduce hiện tại lúc chưa thay đổi
                    let vatPlusProduceCurrent = infoContractProduction.vatPlusProduce;

                    // Giá trị chênh lệch khi thay đổi
                    let vatPlusProduceAfter   = vatPlusProduce - vatPlusProduceCurrent;

                    // Gán giá trị chênh lệch cho hợp đồng
                    updateContract.vatPlusProduce = vatPlusProduceAfter;
                }

                let infoAterUpdate = await BUDGET_COLL.findByIdAndUpdate(contractProductionID, dataUpdate, { new: true });
                if(!infoAterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update_contract_ipc", status: 403 });

                // Cập nhật Hợp đồng (Precaculate)
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
     * Name  : Danh sách ✅
     * Author: Hiepnh
     * Date  : 10/4/2022 
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
     * Name  : Cập nhật giá trị theo công việc ✅
     * Author: Hiepnh
     * Date  : 10/4/2022 
     */
    updateValue({ 
        option, groupID, userID, ctx
    }){ 
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * 1-Cập nhật giá trị ngân sách
                 * 2-Cập nhật dự báo ngân sách
                 * 3-Cập nhật thực hiện ngân sách
                 */

                if(!checkObjectIDs(groupID))
                    return resolve({ error: true, message: "Mã hiệu không đúng", keyError: "groupID_invalid" });
                
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
                // Cập nhật ngân sách
                let listDataWork = await BUDGET__WORK_COLL.aggregate([
                    {
                        $match: {
                            group: ObjectID(groupID),
                        }
                    }, 
                    {
                        $group: {
                            _id: { },
                            amount: { $sum: "$amount" },
                            vatAmount: { $sum: "$vatAmount" },
                            forecastAmount: { $sum: "$forecastAmount" },
                            forecastVatAmount: { $sum: "$forecastVatAmount" },
                        }
                    }, 
                ])
                if(listDataWork && listDataWork.length){
                    dataUpdate.amount = Number(listDataWork[0].amount)
                    dataUpdate.vatAmount = Number(listDataWork[0].vatAmount)
                    dataUpdate.forecastAmount = Number(listDataWork[0].forecastAmount)
                    dataUpdate.forecastVatAmount = Number(listDataWork[0].forecastVatAmount)
                }

                let infoAterUpdate = await BUDGET__GROUP_COLL.findByIdAndUpdate(groupID, dataUpdate, { new: true });
                if(!infoAterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update_contract_ipc", status: 403 });

                return resolve({ error: false, data: infoAterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Cập nhật ngân sách thực hiện ✅
     * Author: Hiepnh
     * Date  : 10/4/2022 
     */
    updateBudget({ 
        option, groupID, userID, ctx
    }){ 
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * 1-Cập nhật giá trị ngân sách
                 * 2-Cập nhật dự báo ngân sách
                 * 3-Cập nhật thực hiện ngân sách
                 */

                if(!checkObjectIDs(groupID))
                    return resolve({ error: true, message: "Mã hiệu không đúng", keyError: "groupID_invalid" });
                
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
                const infoJournal = await ctx.call(`${CF_DOMAIN_SERVICES.ACCOUNTING}.${CF_ACTIONS_ACCOUNTING.GET_INFO_AND_GET_LIST}`, {
                    contractID
                })

                // Cập nhật ngân sách
                let listDataWork = await BUDGET__WORK_COLL.aggregate([
                    {
                        $match: {
                            group: ObjectID(groupID),
                        }
                    }, 
                    {
                        $group: {
                            _id: { },
                            amount: { $sum: "$amount" },
                            vatAmount: { $sum: "$vatAmount" },
                            forecastAmount: { $sum: "$forecastAmount" },
                            forecastVatAmount: { $sum: "$forecastVatAmount" },
                        }
                    }, 
                ])
                if(listDataWork && listDataWork.length){
                    dataUpdate.amount = Number(listDataWork[0].amount)
                    dataUpdate.vatAmount = Number(listDataWork[0].vatAmount)
                    dataUpdate.forecastAmount = Number(listDataWork[0].forecastAmount)
                    dataUpdate.forecastVatAmount = Number(listDataWork[0].forecastVatAmount)
                }

                let infoAterUpdate = await BUDGET__GROUP_COLL.findByIdAndUpdate(groupID, dataUpdate, { new: true });
                if(!infoAterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update_contract_ipc", status: 403 });

                return resolve({ error: false, data: infoAterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}

exports.MODEL = new Model;