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

/**
 * import inter-coll, exter-coll
 */
const BUDGET__ITEM_COLL                 = require('../database/budget.item-coll');
const BUDGET_COLL                       = require('../database/budget-coll');
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { template }                      = require('lodash');
const { ResumeToken }                   = require('mongodb');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {               
    constructor() {
        super(BUDGET__ITEM_COLL);
    }
    
    /**
     * Name: insert ✅
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    insert({ ctx, userID, budgetID, plus, reasonID, name, sign, unit, description, note, quantity, unitPrice, vatUnitPrice, amount, vatAmount, forecastQuantity, forecastUnitPrice, forecastVatUnitPrice, forecastAmount, forecastVatAmount }) { 
        return new Promise(async (resolve) => {
            try {
                    
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let infoBudget = await BUDGET_COLL.findById(budgetID);
                if(!infoBudget)
                    return resolve({ error: true, message: "Budget không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID });

                let dataInsert = { userCreate: userID, company: infoBudget.company, budget: budgetID };

                // Company lấy theo budgetID

                if(checkObjectIDs(infoBudget.project)){
                    dataInsert.project = infoBudget.project
                }

                if(checkObjectIDs(infoBudget.contract)){
                    dataInsert.contract = infoBudget.contract
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
     * Name: update ✅
     * Author: Hiepnh
     * Date: 9/4/2022
     */
     update({ 
        itemID, plus, reasonID, name, sign, unit, description, note, quantity, unitPrice, vatUnitPrice, amount, vatAmount, forecastQuantity, forecastUnitPrice, forecastVatUnitPrice, forecastAmount, forecastVatAmount, userID, ctx
    }){ 
        return new Promise(async (resolve) => {
            try {

                if(!checkObjectIDs(itemID))
                    return resolve({ error: true, message: "Mã hiệu không đúng", keyError: "itemID_invalid" });
                
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID };
                
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
                    dataUpdate.plus = plus;
                }

                if(name){
                    dataUpdate.name = name;
                }

                if(sign){
                    dataUpdate.sign = sign;
                }

                if(unit){
                    dataUpdate.unit = unit;
                }

                if(description){
                    dataUpdate.description = description;
                }

                if(note){
                    dataUpdate.note = note;
                }

                //______Giá trị
                if(!isNaN(quantity) && Number(quantity) >= 0){
                    dataUpdate.quantity     = quantity;
                }
                if(!isNaN(unitPrice) && Number(unitPrice) >= 0){
                    dataUpdate.unitPrice     = unitPrice;
                }
                if(!isNaN(vatUnitPrice) && Number(vatUnitPrice) >= 0){
                    dataUpdate.vatUnitPrice     = vatUnitPrice;
                }
                if(!isNaN(amount) && Number(amount) >= 0){
                    dataUpdate.amount     = amount;
                }
                if(!isNaN(vatAmount) && Number(vatAmount) >= 0){
                    dataUpdate.vatAmount     = vatAmount;
                }
                if(!isNaN(forecastQuantity) && Number(forecastQuantity) >= 0){
                    dataUpdate.forecastQuantity     = forecastQuantity;
                }
                if(!isNaN(forecastUnitPrice) && Number(forecastUnitPrice) >= 0){
                    dataUpdate.forecastUnitPrice     = forecastUnitPrice;
                }
                if(!isNaN(forecastVatUnitPrice) && Number(forecastVatUnitPrice) >= 0){
                    dataUpdate.forecastVatUnitPrice     = forecastVatUnitPrice;
                }
                if(!isNaN(forecastAmount) && Number(forecastAmount) >= 0){
                    dataUpdate.forecastAmount     = forecastAmount;
                }
                if(!isNaN(forecastVatAmount) && Number(forecastVatAmount) >= 0){
                    dataUpdate.forecastVatAmount     = forecastVatAmount;
                }

                let infoAterUpdate = await BUDGET__ITEM_COLL.findByIdAndUpdate(itemID, dataUpdate, { new: true });
                if(!infoAterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update_contract_ipc", status: 403 });

                return resolve({ error: false, data: infoAterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Remove ✅
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    
    /**
     * Name: Get info ✅
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getInfo({ itemID, 
        select, populates }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(itemID))
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

                let infoContractIPC = await BUDGET__ITEM_COLL.findById(itemID)
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
     * Name  : Get list ✅
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getList({ budgetID, userID,
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
                if(budgetID && checkObjectIDs(budgetID)){
                    conditionObj.budget = budgetID;
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
					let infoData = await BUDGET__ITEM_COLL.findById(lastestID);
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
                
                let infoDataAfterGet = await BUDGET__ITEM_COLL.find(conditionObj)
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

                let totalRecord = await BUDGET__ITEM_COLL.count(conditionObjOrg);
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