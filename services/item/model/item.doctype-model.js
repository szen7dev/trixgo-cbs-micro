"use strict";



// const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
// const ObjectID                          = require('mongoose').Types.ObjectId;

// const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
// const { CF_ACTIONS_ITEM } 		        = require('../helper/item.actions-constant');

/**
 * TOOLS
 */
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { DOCTYPE_TYPE }                  = require('../helper/item.keys-constant');

/**
 * COLLECTIONS
 */
const ITEM__DOCTYPE_COLL                = require('../database/item.doctype-coll');

class Model extends BaseModel {

    constructor() {
        super(ITEM__DOCTYPE_COLL);
    }

	/**
	 * Dev: Depv
	 * Func: Tạo hợp đồng
	 * Date: 13/12/2021
	 */
	// insert({ projectID, parentID, admins, members, draft, outin, status, real, subType, type, field, chairID, personInChargeID, debtStatusID, warehouseID,
    //     name, sign, storeSign, description, note, note1, date, startTime, endTime, buyerInfoID, buyerBank, sellerInfoID, sellerBank, packageName, lock,
    //     value, plus, vatValue, advancePayment, produce, plusProduce, vatProduce, acceptance, plusAcceptance, vatAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, advancePaymentPaid, amountPaid, remainingPayment, advancePaymentOverage, finalValue,
    //     budget, budgetVAT, forecastBudget, forecastBudgetVAT, managementFee, subcontractFee, expenses, profit, 
    //     cgValue, expiredCg, agValue, expiredAg, userID, ctx
    //      }){
    //     return new Promise(async resolve => { 
    //         try {
    //             let dataInsert = {
    //                 project: projectID, name, sign, date, userCreate: userID
    //             }

    //             let infoProject = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST}`, {
    //                 departmentID: projectID
    //             })

    //             if(infoProject.error)
    //                 return resolve({ error: true, message: "Request params project invalid" });
                
    //             dataInsert.company = infoProject.data.company;

    //             // company lấy theo product
    //             if(checkObjectIDs(parentID)){
    //                 dataInsert.parent = parentID;
    //                 let infoContractParent = await ITEM__DOCTYPE_COLL.findById(parentID);
    //                 if(infoContractParent){
    //                     dataInsert.level = infoContractParent.level + 1;
    //                 }
    //             }

    //             if(checkObjectIDs(admins)){
    //                 dataInsert.admins = admins;
    //             }

    //             if(checkObjectIDs(members)){
    //                 dataInsert.members = members;
    //             }

    //             if(draft){
    //                 dataInsert.draft = draft;
    //             }

    //             if(outin){
    //                 dataInsert.outin = outin;
    //             }

    //             if(status){
    //                 dataInsert.status = status;
    //             }

    //             if(real){
    //                 dataInsert.real = real;
    //             }

    //             if(subType){
    //                 dataInsert.subType = subType;
    //             }

    //             if(type){
    //                 dataInsert.type = type;
    //             }

    //             if(field){
    //                 dataInsert.field = field;
    //             }

    //             if(chairID){
    //                 dataInsert.chair = chairID;
    //             }

    //             if(personInChargeID){
    //                 dataInsert.personInCharge = personInChargeID;
    //             }

    //             if(debtStatusID){
    //                 dataInsert.debtStatus = debtStatusID;
    //             }

    //             if(warehouseID){
    //                 dataInsert.warehouse = warehouseID;
    //             }

    //             if(name){
    //                 dataInsert.name = name;
    //             }

    //             if(sign){
    //                 dataInsert.sign = sign;
    //             }

    //             if(storeSign){
    //                 dataInsert.storeSign = storeSign;
    //             }

    //             if(description){
    //                 dataInsert.description = description;
    //             }

    //             if(note){
    //                 dataInsert.note = note;
    //             }

    //             if(note1){
    //                 dataInsert.note1 = note1;
    //             }

    //             if(date){
    //                 dataInsert.date = date;
    //             }

    //             if(startTime){
    //                 dataInsert.startTime = startTime;
    //             }

    //             if(endTime){
    //                 dataInsert.endTime = endTime;
    //             }

    //             if(checkObjectIDs(buyerInfoID)){
    //                 dataInsert.buyerInfo = buyerInfoID;
    //             }

    //             if(buyerBank){
    //                 dataInsert.buyerBank = buyerBank;
    //             }

    //             if(checkObjectIDs(sellerInfoID)){
    //                 dataInsert.sellerInfo = sellerInfoID;
    //             }
                
    //             if(buyerBank){
    //                 dataInsert.buyerBank = buyerBank;
    //             }

    //             if(sellerBank){
    //                 dataInsert.sellerBank = sellerBank;
    //             }

    //             if(packageName){
    //                 dataInsert.packageName = packageName;
    //             }

    //             if(lock){
    //                 dataInsert.lock = lock;
    //             }

    //             if(value){
    //                 dataInsert.value = value;
    //             }

    //             if(plus){
    //                 dataInsert.plus = plus;
    //             }

    //             if(vatValue){
    //                 dataInsert.vatValue = vatValue;
    //             }

    //             if(advancePayment){
    //                 dataInsert.advancePayment = advancePayment;
    //             }

    //             if(produce){
    //                 dataInsert.produce = produce;
    //             }

    //             if(plusProduce){
    //                 dataInsert.plusProduce = plusProduce;
    //             }

    //             if(vatProduce){
    //                 dataInsert.vatProduce = vatProduce;
    //             }

    //             if(acceptance){
    //                 dataInsert.acceptance = acceptance;
    //             }

    //             if(plusAcceptance){
    //                 dataInsert.plusAcceptance = plusAcceptance;
    //             }

    //             if(vatAcceptance){
    //                 dataInsert.vatAcceptance = vatAcceptance;
    //             }

    //             if(retainedValue){
    //                 dataInsert.retainedValue = retainedValue;
    //             }

    //             if(advancePaymentDeduction){
    //                 dataInsert.advancePaymentDeduction = advancePaymentDeduction;
    //             }

    //             if(otherDeduction){
    //                 dataInsert.otherDeduction = otherDeduction;
    //             }

    //             if(recommendedPayment){
    //                 dataInsert.recommendedPayment = recommendedPayment;
    //             }

    //             if(advancePaymentPaid){
    //                 dataInsert.advancePaymentPaid = advancePaymentPaid;
    //             }

    //             if(amountPaid){
    //                 dataInsert.amountPaid = amountPaid;
    //             }

    //             if(remainingPayment){
    //                 dataInsert.remainingPayment = remainingPayment;
    //             }

    //             if(advancePaymentOverage){
    //                 dataInsert.advancePaymentOverage = advancePaymentOverage;
    //             }

    //             if(finalValue){
    //                 dataInsert.finalValue = finalValue;
    //             }

    //             if(budget){
    //                 dataInsert.budget = budget;
    //             }

    //             if(budgetVAT){
    //                 dataInsert.budgetVAT = budgetVAT;
    //             }

    //             if(forecastBudget){
    //                 dataInsert.forecastBudget = forecastBudget;
    //             }

    //             if(forecastBudgetVAT){
    //                 dataInsert.forecastBudgetVAT = forecastBudgetVAT;
    //             }

    //             if(managementFee){
    //                 dataInsert.managementFee = managementFee;
    //             }

    //             if(subcontractFee){
    //                 dataInsert.subcontractFee = subcontractFee;
    //             }

    //             if(expenses){
    //                 dataInsert.expenses = expenses;
    //             }

    //             if(profit){
    //                 dataInsert.profit = profit;
    //             }

    //             if(cgValue){
    //                 dataInsert.cgValue = cgValue;
    //             }

    //             if(expiredCg){
    //                 dataInsert.expiredCg = expiredCg;
    //             }

    //             if(agValue){
    //                 dataInsert.agValue = agValue;
    //             }

    //             if(expiredAg){
    //                 dataInsert.expiredAg = expiredAg;
    //             }

    //             let infoAfterInsert = await this.insertData(dataInsert);
    //             return resolve({ error: false, data: infoAfterInsert });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     })
    // }

    /**
	 * Dev: Depv
	 * Func: Cập nhật hợp đồng
	 * Date: 13/12/2021
	 */
	// update({ doctypeID, projectID, parentID, admins, adminIDRemove, members, memberIDRemove, draft, outin, status, real, subType, type, field, chairID, personInChargeID, debtStatusID, warehouseID,
    //     name, sign, storeSign, description, note, note1, date, startTime, endTime, buyerInfoID, buyerBank, sellerInfoID, sellerBank, packageName, lock,
    //     value, plus, vatValue, advancePayment, produce, plusProduce, vatProduce, acceptance, plusAcceptance, vatAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, advancePaymentPaid, amountPaid, remainingPayment, advancePaymentOverage, finalValue,
    //     budget, budgetVAT, forecastBudget, forecastBudgetVAT, managementFee, subcontractFee, expenses, profit, 
    //     cgValue, expiredCg, agValue, expiredAg
    //      }){
    //     return new Promise(async resolve => { 
    //         try {
    //             if(!checkObjectIDs(doctypeID))
    //                 return resolve({ error: true, message: "Request params doctypeID invalid" });
    //                 name, sign, storeSign, description, note, note1, date, startTime, endTime, buyerInfoID, buyerBank, sellerInfoID, sellerBank, packageName, lock,
    //                 value, plus, vatValue, advancePayment, produce, plusProduce, vatProduce, acceptance, plusAcceptance, vatAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, advancePaymentPaid, amountPaid, remainingPayment, advancePaymentOverage, finalValue,
    //                 budget, budgetVAT, forecastBudget, forecastBudgetVAT, managementFee, subcontractFee, expenses, profit, 
    //                 cgValue, expiredCg, agValue, expiredAg });
    //             let dataUpdate = {
    //                 project: projectID, name, sign, date
    //             }

    //             let dataAddToSet = {};
    //             let dataPull     = {};

    //             if(projectID){
    //                 let infoProject = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST}`, {
    //                     departmentID: projectID
    //                 })

    //                 if(!infoProject.error)
    //                     return resolve({ error: true, message: "Request params project invalid" });
    //                 //________company được lấy theo dự án
    //                 dataUpdate.company = infoProject.data.company;
    //             }
                
    //             if(checkObjectIDs(parentID)){
    //                 dataUpdate.parent = parentID;
    //                 let infoContractParent = await ITEM__DOCTYPE_COLL.findById(parentID);
    //                 if(infoContractParent){
    //                     dataUpdate.level = infoContractParent.level + 1;
    //                 }
    //             }

    //             if(checkObjectIDs(admins)){
    //                 dataAddToSet.admins = admins;
    //             }

    //             if(checkObjectIDs(members)){
    //                 dataAddToSet.members = members;
    //             }

    //             if(checkObjectIDs(adminIDRemove)){
    //                 dataPull.admins = adminIDRemove;
    //             }

    //             if(checkObjectIDs(memberIDRemove)){
    //                 dataPull.members = memberIDRemove;
    //             }

    //             if(draft){
    //                 dataUpdate.draft = draft;
    //             }

    //             if(outin){
    //                 dataUpdate.outin = outin;
    //             }

    //             if(status){
    //                 dataUpdate.status = status;
    //             }

    //             if(real){
    //                 dataUpdate.real = real;
    //             }

    //             if(subType){
    //                 dataUpdate.subType = subType;
    //             }

    //             if(type){
    //                 dataUpdate.type = type;
    //             }

    //             if(field){
    //                 dataUpdate.field = field;
    //             }

    //             if(chairID){
    //                 dataUpdate.chair = chairID;
    //             }

    //             if(personInChargeID){
    //                 dataUpdate.personInCharge = personInChargeID;
    //             }

    //             if(debtStatusID){
    //                 dataUpdate.debtStatus = debtStatusID;
    //             }

    //             if(warehouseID){
    //                 dataUpdate.warehouse = warehouseID;
    //             }

    //             if(name){
    //                 dataUpdate.name = name;
    //             }

    //             if(sign){
    //                 dataUpdate.sign = sign;
    //             }

    //             if(storeSign){
    //                 dataUpdate.storeSign = storeSign;
    //             }

    //             if(description){
    //                 dataUpdate.description = description;
    //             }

    //             if(note){
    //                 dataUpdate.note = note;
    //             }

    //             if(note1){
    //                 dataUpdate.note1 = note1;
    //             }

    //             if(date){
    //                 dataUpdate.date = date;
    //             }

    //             if(startTime){
    //                 dataUpdate.startTime = startTime;
    //             }

    //             if(endTime){
    //                 dataUpdate.endTime = endTime;
    //             }

    //             if(checkObjectIDs(buyerInfoID)){
    //                 dataUpdate.buyerInfo = buyerInfoID;
    //             }

    //             if(buyerBank){
    //                 dataUpdate.buyerBank = buyerBank;
    //             }

    //             if(checkObjectIDs(sellerInfoID)){
    //                 dataUpdate.sellerInfo = sellerInfoID;
    //             }
                
    //             if(buyerBank){
    //                 dataUpdate.buyerBank = buyerBank;
    //             }

    //             if(sellerBank){
    //                 dataUpdate.sellerBank = sellerBank;
    //             }

    //             if(packageName){
    //                 dataUpdate.packageName = packageName;
    //             }

    //             if(lock){
    //                 dataUpdate.lock = lock;
    //             }

    //             if(value){
    //                 dataUpdate.value = value;
    //             }

    //             if(plus){
    //                 dataUpdate.plus = plus;
    //             }

    //             if(vatValue){
    //                 dataUpdate.vatValue = vatValue;
    //             }

    //             if(advancePayment){
    //                 dataUpdate.advancePayment = advancePayment;
    //             }

    //             if(produce){
    //                 dataUpdate.produce = produce;
    //             }

    //             if(plusProduce){
    //                 dataUpdate.plusProduce = plusProduce;
    //             }

    //             if(vatProduce){
    //                 dataUpdate.vatProduce = vatProduce;
    //             }

    //             if(acceptance){
    //                 dataUpdate.acceptance = acceptance;
    //             }

    //             if(plusAcceptance){
    //                 dataUpdate.plusAcceptance = plusAcceptance;
    //             }

    //             if(vatAcceptance){
    //                 dataUpdate.vatAcceptance = vatAcceptance;
    //             }

    //             if(retainedValue){
    //                 dataUpdate.retainedValue = retainedValue;
    //             }

    //             if(advancePaymentDeduction){
    //                 dataUpdate.advancePaymentDeduction = advancePaymentDeduction;
    //             }

    //             if(otherDeduction){
    //                 dataUpdate.otherDeduction = otherDeduction;
    //             }

    //             if(recommendedPayment){
    //                 dataUpdate.recommendedPayment = recommendedPayment;
    //             }

    //             if(advancePaymentPaid){
    //                 dataUpdate.advancePaymentPaid = advancePaymentPaid;
    //             }

    //             if(amountPaid){
    //                 dataUpdate.amountPaid = amountPaid;
    //             }

    //             if(remainingPayment){
    //                 dataUpdate.remainingPayment = remainingPayment;
    //             }

    //             if(advancePaymentOverage){
    //                 dataUpdate.advancePaymentOverage = advancePaymentOverage;
    //             }

    //             if(finalValue){
    //                 dataUpdate.finalValue = finalValue;
    //             }

    //             if(budget){
    //                 dataUpdate.budget = budget;
    //             }

    //             if(budgetVAT){
    //                 dataUpdate.budgetVAT = budgetVAT;
    //             }

    //             if(forecastBudget){
    //                 dataUpdate.forecastBudget = forecastBudget;
    //             }

    //             if(forecastBudgetVAT){
    //                 dataUpdate.forecastBudgetVAT = forecastBudgetVAT;
    //             }

    //             if(managementFee){
    //                 dataUpdate.managementFee = managementFee;
    //             }

    //             if(subcontractFee){
    //                 dataUpdate.subcontractFee = subcontractFee;
    //             }

    //             if(expenses){
    //                 dataUpdate.expenses = expenses;
    //             }

    //             if(profit){
    //                 dataUpdate.profit = profit;
    //             }

    //             if(cgValue){
    //                 dataUpdate.cgValue = cgValue;
    //             }

    //             if(expiredCg){
    //                 dataUpdate.expiredCg = expiredCg;
    //             }

    //             if(agValue){
    //                 dataUpdate.agValue = agValue;
    //             }

    //             if(expiredAg){
    //                 dataUpdate.expiredAg = expiredAg;
    //             }

    //             if(dataAddToSet){
    //                 dataUpdate.$addToSet = dataAddToSet;
    //             }

    //             if(dataPull){
    //                 dataUpdate.$pull = dataPull;
    //             }

    //             let infoAfterInsert = await ITEM__DOCTYPE_COLL.findByIdAndUpdate(doctypeID, dataUpdate, { new: true });
    //             return resolve({ error: false, data: infoAfterInsert });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message });
    //         }
    //     })
    // }

    /**
     * Dev: MinhVH
     * Func: Insert doctype
     * Date: 22/02/2022
     */
    insert({ type, name, description, companyID, parent, userID }) { 
        return new Promise(async resolve => {
            try {
                const dataInsert = { name, type, description, company: companyID, userCreate: userID };

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!type || !DOCTYPE_TYPE.includes(+type)) {
                    return resolve({
						error: true,
						message: "Tham số type không hợp lệ",
						keyError: "params_type_invalid",
						status: 400
					})
                }

                if(!checkObjectIDs([userID])) {
                    return resolve({
						error: true,
						message: "Tham số userID không hợp lệ",
						keyError: "params_userID_invalid",
						status: 400
					})
                }

                if(!checkObjectIDs([companyID])) {
                    return resolve({
						error: true,
						message: "Tham số companyID không hợp lệ",
						keyError: "params_companyID_invalid",
						status: 400
					})
                }

                if(parent) {
                    if(!checkObjectIDs([parent])) {
                        return resolve({
                            error: true,
                            message: "Tham số parent không hợp lệ",
                            keyError: "params_parent_invalid",
                            status: 400
                        })
                    }

                    dataInsert.parent = parent;
                }

                let infoAterInsert = await this.insertData(dataInsert);

                if(!infoAterInsert) {
                    return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyError: "error_occurred",
						status: 422
					})
                }

                if(parent) {
                    await ITEM__DOCTYPE_COLL.findByIdAndUpdate(parent, {
                        $addToSet: {
                            childs: infoAterInsert._id
                        }
                    });
                }

                return resolve({ error: false, data: infoAterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Dev: MinhVH
     * Func: Update doctype
     * Date: 22/02/2022
     */
    update({ doctypeID, name, description, userID }) { 
        return new Promise(async resolve => {
            try {
                const dataUpdate = { userUpdate: userID };

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs([doctypeID, userID])) {
                    return resolve({
						error: true,
						message: "Tham số doctypeID hoặc userID không hợp lệ",
						keyError: "params_doctypeID_or_userID_invalid",
						status: 400
					})
                }

                name        && (dataUpdate.name = name);
                description && (dataUpdate.description = description);

                let infoAterUpdate = await ITEM__DOCTYPE_COLL.findByIdAndUpdate(doctypeID, dataUpdate, { new: true });

                if(!infoAterUpdate) {
                    return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyError: "error_occurred",
						status: 422
					})
                }

                return resolve({ error: false, data: infoAterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Dev: MinhVH
     * Func: Remove doctype
     * Date: 22/02/2022
     */
    remove({ doctypeID, userID }) { 
        return new Promise(async resolve => {
            try {
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs([doctypeID, userID])) {
                    return resolve({
						error: true,
						message: "Tham số doctypeID hoặc userID không hợp lệ",
						keyError: "params_doctypeID_or_userID_invalid",
						status: 400
					})
                }

                let infoAterRemove = await ITEM__DOCTYPE_COLL.findOneAndDelete({
                    _id: doctypeID,
                    userCreate: userID
                });

                if(!infoAterRemove) {
                    return resolve({
						error: true,
						message: "Là lỗi của chúng tôi không phải của bạn, chúng tôi đang tìm cách khắc phục",
						keyError: "error_occurred",
						status: 422
					})
                }

                if(infoAterRemove.parent) {
                    await ITEM__DOCTYPE_COLL.findByIdAndUpdate(infoAterRemove.parent, {
                        $pull: {
                            childs: infoAterRemove._id
                        }
                    });
                }

                return resolve({ error: false, data: infoAterRemove, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: get Hợp đồng ✅
     * Author: Depv
     * Code: 
     */
    getInfo({ doctypeID, select, populates }) { 
        return new Promise(async (resolve) => {
            try {
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(doctypeID))
                    return resolve({ error: true, message: 'Request params doctypeID invalid', status: 400 });
                
                 if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				} else{
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
                let infoAterGet = await ITEM__DOCTYPE_COLL
                    .findById(doctypeID)
                    .select(select)
                    .populate(populates)
                    .lean();

                if(!infoAterGet) {
                    return resolve({
                        error: true,
                        message: "Doctype không tồn tại",
                        keyError: "doctype_not_exists",
                        status: 400
                    })
                }

                return resolve({ error: false, data: infoAterGet, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Danh sách hợp đồng ✅
     * Author: Depv
     * Code  : 
     */
    getList({ companyID, projectID, type, keyword, limit = 10, lastestID, select, populates }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {};
                let sortBy = {};
                let keys = ['createAt__-1', '_id__-1'];

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				} else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                if(isNaN(limit) || +limit > 20) {
					limit = 20;
				} else{
					limit = +limit;
				}
               
                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                
                // TRẠNG THÁI CÔNG VIỆC
                //____________Công ty
                if(companyID){
                    conditionObj.company = companyID;
                }

                //____________Dự án
                if(projectID){
                    conditionObj.project = projectID;
                }

                //____________Loại doctype
                if(type){
                    conditionObj.type = type;
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regSearch = new RegExp(keyword, 'i');

                    conditionObj.$or = [
                        { name: regSearch },
                        { sign: regSearch },
                    ]
                }
                let conditionObjOrg = { ...conditionObj }
                
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await ITEM__DOCTYPE_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy                = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await ITEM__DOCTYPE_COLL
                    .find(conditionObj)
                    .limit(limit+1)
                    .sort(sortBy)
                    .select(select)
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

                let totalRecord = await ITEM__DOCTYPE_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit,
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
