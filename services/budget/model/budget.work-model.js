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

const BUDGET_MODEL                      = require('./budget-model').MODEL;
const BUDGET__ITEM_MODEL                = require('./budget.item-model').MODEL;
const BUDGET__GROUP_MODEL               = require('./budget.group-model').MODEL;

const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { template }                      = require('lodash');
const { ResumeToken }                   = require('mongodb');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {               
    constructor() {
        super(BUDGET__WORK_COLL);
    }
    
    /**
     * Name  : Insert ✅
     * Author: Hiepnh
     * Date  : 10/4/2022 
     */
    insert({ ctx, userID, groupID, plus, reasonID, name, sign, unit, description, note, quantity, unitPrice, vatUnitPrice, amount, vatAmount, forecastQuantity, forecastUnitPrice, forecastVatUnitPrice, forecastAmount, forecastVatAmount }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * 1-Khi tạo mới/cập nhật khối lượng, đơn giá công việc-budgetWork (cả phần dự kiến còn lại):
                 * +++Cập nhật Group, Item và Budget của nó tương ứng (viết sẵn hàm Cập nhật để triệu gọi)
                 * 2-Khi có hoạch toán ngân sách: tăng, giảm (từ Accounting) => phần ngân sách đã thực hiện sẽ:
                 * +++Cập nhật cho công việc
                 * +++Cập nhật cho Group, Item và Budget
                 * 3. Không cho sửa giá trị của Item, Group và Budget => Tất cả tính theo cập nhật của BudgetWork và Accounting
                 */                 
                
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let infoGroup = await BUDGET__GROUP_COLL.findById(groupID);
                if(!infoGroup)
                    return resolve({ error: true, message: "groupID không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID });

                let dataInsert = { userCreate: userID, company: infoGroup.company, budget: infoGroup.budget, item: infoGroup.item, group: groupID };

                if(checkObjectIDs(infoGroup.project)){
                    dataInsert.project = infoGroup.project
                }
                if(checkObjectIDs(infoGroup.contract)){
                    dataInsert.contract = infoGroup.contract
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
                
                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "Không thể thêm contract ipc" ,keyError: "can't_insert_budget_work" });

                /**
                 * CẬP NHẬT GIÁ TRỊ NGÂN SÁCH, DỰ KIẾN NGÂN SÁCH
                 */
                let InfoGroupAfterUpdate         = await BUDGET__GROUP_MODEL.updateValue({ option: 1, groupID, userID })
                let InfoItemAfterUpdate          = await BUDGET__ITEM_MODEL.updateValue({ option: 1, itemID: infoGroup.item, userID })
                let InfoBudgetAfterUpdate        = await BUDGET_MODEL.updateValue({ option: 1, budgetID: infoGroup.budget, userID })

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Update ✅
     * Author: Hiepnh
     * Date  : 10/4/2022 
     */
    update({ 
        workID, plus, reasonID, name, sign, unit, description, note, quantity, unitPrice, vatUnitPrice, amount, vatAmount, forecastQuantity, forecastUnitPrice, forecastVatUnitPrice, forecastAmount, forecastVatAmount, userID, ctx
    }){ 
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * 1-Khi tạo mới/cập nhật khối lượng, đơn giá công việc-budgetWork (cả phần dự kiến còn lại):
                 * +++Cập nhật Group, Item và Budget của nó tương ứng (viết sẵn hàm Cập nhật để triệu gọi)
                 * 2-Khi có hoạch toán ngân sách: tăng, giảm (từ Accounting) => phần ngân sách đã thực hiện sẽ:
                 * +++Cập nhật cho công việc
                 * +++Cập nhật cho Group, Item và Budget
                 * 3. Không cho sửa giá trị của Item, Group và Budget => Tất cả tính theo cập nhật của BudgetWork và Accounting
                 */  

                if(!checkObjectIDs(workID))
                    return resolve({ error: true, message: "Mã không đúng", keyError: "workID_invalid" });
                
                /**
                 * DECALARTION VARIABLE (1)
                 */
                 let infoWork = await BUDGET__WORK_COLL.findById(workID);
                 if(!infoWork)
                     return resolve({ error: true, message: "workID không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID });

                let dataUpdate = { userUpdate: userID };
                
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                 if(checkObjectIDs(reasonID)){
                    dataUpdate.reason = reasonID
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
                    dataUpdate.amount       = Number(quantity)*Number(unitPrice);
                }
                if(!isNaN(vatUnitPrice) && Number(vatUnitPrice) >= 0){
                    dataUpdate.vatUnitPrice     = vatUnitPrice;
                    dataUpdate.vatAmount     = Number(quantity)*Number(vatUnitPrice);
                }
                if(!isNaN(forecastQuantity) && Number(forecastQuantity) >= 0){
                    dataUpdate.forecastQuantity     = forecastQuantity;
                }
                if(!isNaN(forecastUnitPrice) && Number(forecastUnitPrice) >= 0){
                    dataUpdate.forecastUnitPrice     = forecastUnitPrice;
                    dataUpdate.forecastAmount       = Number(forecastQuantity)*Number(forecastUnitPrice);
                }
                if(!isNaN(forecastVatUnitPrice) && Number(forecastVatUnitPrice) >= 0){
                    dataUpdate.forecastVatUnitPrice     = forecastVatUnitPrice;
                    dataUpdate.forecastVatAmount       = Number(forecastQuantity)*Number(forecastVatUnitPrice);
                }                

                let infoAterUpdate = await BUDGET__WORK_COLL.findByIdAndUpdate(workID, dataUpdate, { new: true });
                if(!infoAterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update_budget_work", status: 403 });

                /**
                 * CẬP NHẬT GIÁ TRỊ NGÂN SÁCH, DỰ KIẾN NGÂN SÁCH
                 */
                 let InfoGroupAfterUpdate         = await BUDGET__GROUP_MODEL.updateValue({ option: 1, groupID: infoWork.group, userID })
                 let InfoItemAfterUpdate          = await BUDGET__ITEM_MODEL.updateValue({ option: 1, itemID: infoWork.item, userID })
                 let InfoBudgetAfterUpdate        = await BUDGET_MODEL.updateValue({ option: 1, budgetID: infoWork.budget, userID })                  

                return resolve({ error: false, data: infoAterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Remove ✅
     * Author: Hiepnh
     * Date: 10/4/2022
     */
    
    /**
     * Name: Get info ✅
     * Author: Hiepnh
     * Date: 10/4/2022
     */
    getInfo({ workID, 
        select, populates }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(workID))
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

                let info = await BUDGET__WORK_COLL.findById(workID)
                                .select(select)
                                .populate(populates)

				if (!info) return resolve({ error: true, message: 'cannot_get' });

                return resolve({ error: false, data: info });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name  : Get list ✅
     * Author: Hiepnh
     * Date  : 10/4/2022
     */
    getList({ groupID, itemID, budgetID, userID,
        keyword, limit = 50, lastestID, select, populates= {} }) { 
        return new Promise(async (resolve) => {
            try {

                if(limit > 50){
                    limit = 50
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
                
                if(groupID && checkObjectIDs(groupID)){
                    conditionObj.group = groupID;
                }
                if(itemID && checkObjectIDs(itemID)){
                    conditionObj.item = itemID;
                }
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
					let infoData = await BUDGET__WORK_COLL.findById(lastestID);
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
                
                let infoDataAfterGet = await BUDGET__WORK_COLL.find(conditionObj)
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

                let totalRecord = await BUDGET__WORK_COLL.count(conditionObjOrg);
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
     * Name  : Cập nhật giá trị (ngân sách, thực hiện, dự báo) ✅
     * Author: Hiepnh
     * Date  : 10/4/2022 
     */
    updateValue({ 
        option, workID, userID, ctx
    }){ 
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * 1-Cập nhật giá trị ngân sách
                 * 2-Cập nhật dự báo ngân sách
                 * 3-Cập nhật thực hiện ngân sách
                 */

                if(!checkObjectIDs(workID))
                    return resolve({ error: true, message: "Mã hiệu không đúng", keyError: "workID_invalid" });
                
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
                // Cập nhật Ngân sách theo kế hoạch và dự báo ngân sách
                if(option && Number(option) === 1){
                    //
                }

                // Cập nhật Ngân sách thực hiện
                if(option && Number(option) === 2){
                    const infoImpleBudget = await ctx.call(`${CF_DOMAIN_SERVICES.ACCOUNTING}.${CF_ACTIONS_ACCOUNTING.CAL_IMPLE_BUDGET}`, {
                        workID
                    })
                    // console.log(infoImpleBudget)
                    if(infoImpleBudget){
                        dataUpdate.impleQuantity = Number(infoImpleBudget.data.quantity)
                        dataUpdate.impleAmount = Number(infoImpleBudget.data.amount)
                        dataUpdate.impleUnitPrice = Number(infoImpleBudget.data.amount)/Number(infoImpleBudget.data.quantity)
                    }
                }

                let infoAterUpdate = await BUDGET__WORK_COLL.findByIdAndUpdate(workID, dataUpdate, { new: true });
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