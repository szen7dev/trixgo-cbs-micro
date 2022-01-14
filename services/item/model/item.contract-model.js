"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const { RANGE_BASE_PAGINATION } 	    = require('../../../tools/cursor_base/playground/index');


const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const ObjectID                          = require('mongoose').Types.ObjectId;

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../helper/item.actions-constant');

/**
 * TOOLS
 */

/**
 * COLLECTIONS
 */
const ITEM__CONTRACT_COLL            				= require('../database/item.contract-coll');


class Model extends BaseModel {

    constructor() {
        super(ITEM__CONTRACT_COLL);
    }

    /**
     * Dev: MinhVH
     * Func: Cập nhật hợp đồng theo điều kiện
     * Date: 29/10/2021
     */
    updateContractByCondition({ condition, update }) {
        return new Promise(async (resolve) => {
            try {
            const infoAfterUpdate = await ITEM__CONTRACT_COLL.findOneAndUpdate(condition, update, { new: true })
                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

   /**
	 * Dev: MinhVH
	 * Func: Danh sách hợp đồng 
	 * Date: 30/08/2021
	 */
	getListContract({ lastestID, userID, departmentID, keyword, limit = 10, filter = {}, select = {} }) {
		return new Promise(async (resolve) => {
			try {
				if(!checkObjectIDs([userID]))
					return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

				if(isNaN(limit)){
					limit = 10;
				} else{
					limit = +limit;
				}

				if(filter && typeof filter === 'string'){
					if(!IsJsonString(filter))
						return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

					filter = JSON.parse(filter);
				}

				if(select && typeof select === 'string'){
					if(!IsJsonString(select))
						return resolve({ error: true, message: 'Request params select invalid', status: 400 });

					select = JSON.parse(select);
				}

				let conditionFind = {};
				let conditionObj  = {};
                let objSort = {};
				let sortBy = {
					modifyAt: -1,
					createAt: -1,
					updateAt: -1
				}

				if(lastestID && checkObjectIDs(lastestID)){
					let infoContract = await ITEM__CONTRACT_COLL.findById(lastestID);
					if(!infoContract)
						return resolve({ error: true, message: "Can't get info last contract", status: 403 });

					let nextInfo = `${infoContract.modifyAt}_${infoContract._id}`;
					let keys	 = ['modifyAt__-1', '_id__-1'];  

					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionFind = dataPagingAndSort.data.find;
				}

                departmentID && (conditionObj.project = departmentID);

                // SEARCH TEXT
				if(keyword){
					conditionObj.$text = { $search: keyword };
					objSort.score = { $meta: "textScore" };
					sortBy.score  = { $meta: "textScore" };
				}

				let	listContract = await ITEM__CONTRACT_COLL
					.find({ ...conditionObj, ...conditionFind }, { ...objSort, ...filter })
                    .populate('project', select.project)
                    .populate('field', select.field)
					.limit(limit + 1)
					.sort(sortBy)
					.lean();

				if(!listContract)
					return resolve({ error: true, message: "Can't get list contract", status: 403 });

				// GET TOTAL RECORD
				let totalRecord = await ITEM__CONTRACT_COLL.countDocuments(conditionObj);
				let nextCursor	= null;

				if(listContract && listContract.length){
					if(listContract.length > limit){
						nextCursor = listContract[limit - 1]._id;
						listContract.length = limit;
					}
				}

				return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listContract,
						limit: +limit,
						totalRecord,
						nextCursor
					}
				});
			} catch (error) {
				return resolve({ error: true, message: error.message, status: 500 })
			}
		})
	}

 	/**
	 * KHU VỰC NÀY DO ĐỆ VIẾT
	 */

	/**
	 * Dev: Depv
	 * Func: Tạo hợp đồng
	 * Date: 13/12/2021
	 */
	insert({ projectID, parentID, admins, members, draft, outin, status, real, subType, type, field, chair, personInCharge, debtStatus, warehouse,
        name, sign, storeSign, description, note, note1, date, startTime, endTime, buyerInfo, buyerBank, sellerInfo, sellerBank, packageName, lock,
        value, plus, vatValue, advancePayment, produce, plusProduce, vatProduce, acceptance, plusAcceptance, vatAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, advancePaymentPaid, amountPaid, remainingPayment, advancePaymentOverage, finalValue,
        budget, budgetVAT, forecastBudget, forecastBudgetVAT, managementFee, subcontractFee, expenses, profit, 
        cgValue, expiredCg, agValue, expiredAg, userID, ctx
         }){
        return new Promise(async resolve => { 
            try {
                let dataInsert = {
                    project: projectID, name, sign, date, userCreate: userID, members: [userID], admins: [userID]
                }

                let infoProject = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST}`, {
                    departmentID: projectID
                })
                
                if(infoProject.error)
                    return resolve({ error: true, message: "Request params project invalid" });
                
                dataInsert.company = infoProject.data.company;

                // company lấy theo product
                if(checkObjectIDs(parentID)){
                    dataInsert.parent = parentID;
                    let infoContractParent = await ITEM__CONTRACT_COLL.findById(parentID);
                    if(infoContractParent){
                        dataInsert.level = infoContractParent.level + 1;
                    }
                }

                if(checkObjectIDs(admins)){
                    dataInsert.admins = admins;
                }

                if(checkObjectIDs(members)){
                    dataInsert.members = members;
                }

                if(draft){
                    dataInsert.draft = draft;
                }

                if(outin){
                    dataInsert.outin = outin;
                }

                if(status){
                    dataInsert.status = status;
                }

                if(real){
                    dataInsert.real = real;
                }

                if(subType){
                    dataInsert.subType = subType;
                }

                if(type){
                    dataInsert.type = type;
                }

                if(field){
                    dataInsert.field = field;
                }

                if(chair){
                    dataInsert.chair = chair;
                }

                if(personInCharge){
                    dataInsert.personInCharge = personInCharge;
                }

                if(debtStatus){
                    dataInsert.debtStatus = debtStatus;
                }

                if(warehouse){
                    dataInsert.warehouse = warehouse;
                }

                if(name){
                    dataInsert.name = name;
                }

                if(sign){
                    dataInsert.sign = sign;
                }

                if(storeSign){
                    dataInsert.storeSign = storeSign;
                }

                if(description){
                    dataInsert.description = description;
                }

                if(note){
                    dataInsert.note = note;
                }

                if(note1){
                    dataInsert.note1 = note1;
                }

                if(date){
                    dataInsert.date = date;
                }

                if(startTime){
                    dataInsert.startTime = startTime;
                }

                if(endTime){
                    dataInsert.endTime = endTime;
                }

                if(checkObjectIDs(buyerInfo)){
                    dataInsert.buyerInfo = buyerInfo;
                }

                if(buyerBank){
                    dataInsert.buyerBank = buyerBank;
                }

                if(checkObjectIDs(sellerInfo)){
                    dataInsert.sellerInfo = sellerInfo;
                }
                
                if(buyerBank){
                    dataInsert.buyerBank = buyerBank;
                }

                if(sellerBank){
                    dataInsert.sellerBank = sellerBank;
                }

                if(packageName){
                    dataInsert.packageName = packageName;
                }

                if(lock){
                    dataInsert.lock = lock;
                }

                if(value){
                    dataInsert.value = value;
                }

                if(plus){
                    dataInsert.plus = plus;
                }

                if(vatValue){
                    dataInsert.vatValue = vatValue;
                }

                if(advancePayment){
                    dataInsert.advancePayment = advancePayment;
                }

                if(produce){
                    dataInsert.produce = produce;
                }

                if(plusProduce){
                    dataInsert.plusProduce = plusProduce;
                }

                if(vatProduce){
                    dataInsert.vatProduce = vatProduce;
                }

                if(acceptance){
                    dataInsert.acceptance = acceptance;
                }

                if(plusAcceptance){
                    dataInsert.plusAcceptance = plusAcceptance;
                }

                if(vatAcceptance){
                    dataInsert.vatAcceptance = vatAcceptance;
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

                if(advancePaymentPaid){
                    dataInsert.advancePaymentPaid = advancePaymentPaid;
                }

                if(amountPaid){
                    dataInsert.amountPaid = amountPaid;
                }

                if(remainingPayment){
                    dataInsert.remainingPayment = remainingPayment;
                }

                if(advancePaymentOverage){
                    dataInsert.advancePaymentOverage = advancePaymentOverage;
                }

                if(finalValue){
                    dataInsert.finalValue = finalValue;
                }

                if(budget){
                    dataInsert.budget = budget;
                }

                if(budgetVAT){
                    dataInsert.budgetVAT = budgetVAT;
                }

                if(forecastBudget){
                    dataInsert.forecastBudget = forecastBudget;
                }

                if(forecastBudgetVAT){
                    dataInsert.forecastBudgetVAT = forecastBudgetVAT;
                }

                if(managementFee){
                    dataInsert.managementFee = managementFee;
                }

                if(subcontractFee){
                    dataInsert.subcontractFee = subcontractFee;
                }

                if(expenses){
                    dataInsert.expenses = expenses;
                }

                if(profit){
                    dataInsert.profit = profit;
                }

                if(cgValue){
                    dataInsert.cgValue = cgValue;
                }

                if(expiredCg){
                    dataInsert.expiredCg = expiredCg;
                }

                if(agValue){
                    dataInsert.agValue = agValue;
                }

                if(expiredAg){
                    dataInsert.expiredAg = expiredAg;
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
	 * Dev: Depv
	 * Func: Cập nhật hợp đồng
	 * Date: 13/12/2021
	 */
	update({ contractID, projectID, parentID, admins, adminIDRemove, members, memberIDRemove, draft, outin, status, real, subType, type, field, chair, personInCharge, debtStatus, warehouse,
        name, sign, storeSign, description, note, note1, date, startTime, endTime, buyerInfo, buyerBank, sellerInfo, sellerBank, packageName, lock,
        value, plus, vatValue, advancePayment, produce, plusProduce, vatProduce, acceptance, plusAcceptance, vatAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, advancePaymentPaid, amountPaid, remainingPayment, advancePaymentOverage, finalValue,
        budget, budgetVAT, forecastBudget, forecastBudgetVAT, managementFee, subcontractFee, expenses, profit, 
        cgValue, expiredCg, agValue, expiredAg, ctx
         }){
        return new Promise(async resolve => { 
            try {
                if(!checkObjectIDs(contractID))
                    return resolve({ error: true, message: "Request params contractID invalid" });
               
                let dataUpdate = {
                    name, sign, date
                }

                let dataAddToSet = {};
                let dataPull     = {};

                if(projectID){
                    let infoProject = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST}`, {
                        departmentID: projectID
                    })

                    if(infoProject.error)
                        return resolve({ error: true, message: "Request params project invalid" });
                    //________company được lấy theo dự án
                    dataUpdate.company = infoProject.data.company;
                }

                if(checkObjectIDs(projectID)){
                    dataUpdate.project = projectID;
                }
                
                if(checkObjectIDs(parentID)){
                    dataUpdate.parent = parentID;
                    let infoContractParent = await ITEM__CONTRACT_COLL.findById(parentID);
                    if(infoContractParent){
                        dataUpdate.level = infoContractParent.level + 1;
                    }
                }

                if(checkObjectIDs(admins)){
                    dataAddToSet.admins = admins;
                }

                if(checkObjectIDs(members)){
                    dataAddToSet.members = members;
                }

                if(checkObjectIDs(adminIDRemove)){
                    dataPull.admins = adminIDRemove;
                }

                if(checkObjectIDs(memberIDRemove)){
                    dataPull.members = memberIDRemove;
                }

                if(draft){
                    dataUpdate.draft = draft;
                }

                if(outin){
                    dataUpdate.outin = outin;
                }

                if(status){
                    dataUpdate.status = status;
                }

                if(real){
                    dataUpdate.real = real;
                }

                if(subType){
                    dataUpdate.subType = subType;
                }

                if(type){
                    dataUpdate.type = type;
                }

                if(field){
                    dataUpdate.field = field;
                }

                if(chair){
                    dataUpdate.chair = chair;
                }

                if(personInCharge){
                    dataUpdate.personInCharge = personInCharge;
                }

                if(debtStatus){
                    dataUpdate.debtStatus = debtStatus;
                }

                if(warehouse){
                    dataUpdate.warehouse = warehouse;
                }

                if(name){
                    dataUpdate.name = name;
                }

                if(sign){
                    dataUpdate.sign = sign;
                }

                if(storeSign){
                    dataUpdate.storeSign = storeSign;
                }

                if(description){
                    dataUpdate.description = description;
                }

                if(note){
                    dataUpdate.note = note;
                }

                if(note1){
                    dataUpdate.note1 = note1;
                }

                if(date){
                    dataUpdate.date = date;
                }

                if(startTime){
                    dataUpdate.startTime = startTime;
                }

                if(endTime){
                    dataUpdate.endTime = endTime;
                }

                if(checkObjectIDs(buyerInfo)){
                    dataUpdate.buyerInfo = buyerInfo;
                }

                if(buyerBank){
                    dataUpdate.buyerBank = buyerBank;
                }

                if(checkObjectIDs(sellerInfo)){
                    dataUpdate.sellerInfo = sellerInfo;
                }
                
                if(buyerBank){
                    dataUpdate.buyerBank = buyerBank;
                }

                if(sellerBank){
                    dataUpdate.sellerBank = sellerBank;
                }

                if(packageName){
                    dataUpdate.packageName = packageName;
                }

                if(lock){
                    dataUpdate.lock = lock;
                }

                if(value){
                    dataUpdate.value = value;
                }

                if(plus){
                    dataUpdate.plus = plus;
                }

                if(vatValue){
                    dataUpdate.vatValue = vatValue;
                }

                if(advancePayment){
                    dataUpdate.advancePayment = advancePayment;
                }

                if(produce){
                    dataUpdate.produce = produce;
                }

                if(plusProduce){
                    dataUpdate.plusProduce = plusProduce;
                }

                if(vatProduce){
                    dataUpdate.vatProduce = vatProduce;
                }

                if(acceptance){
                    dataUpdate.acceptance = acceptance;
                }

                if(plusAcceptance){
                    dataUpdate.plusAcceptance = plusAcceptance;
                }

                if(vatAcceptance){
                    dataUpdate.vatAcceptance = vatAcceptance;
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

                if(advancePaymentPaid){
                    dataUpdate.advancePaymentPaid = advancePaymentPaid;
                }

                if(amountPaid){
                    dataUpdate.amountPaid = amountPaid;
                }

                if(remainingPayment){
                    dataUpdate.remainingPayment = remainingPayment;
                }

                if(advancePaymentOverage){
                    dataUpdate.advancePaymentOverage = advancePaymentOverage;
                }

                if(finalValue){
                    dataUpdate.finalValue = finalValue;
                }

                if(budget){
                    dataUpdate.budget = budget;
                }

                if(budgetVAT){
                    dataUpdate.budgetVAT = budgetVAT;
                }

                if(forecastBudget){
                    dataUpdate.forecastBudget = forecastBudget;
                }

                if(forecastBudgetVAT){
                    dataUpdate.forecastBudgetVAT = forecastBudgetVAT;
                }

                if(managementFee){
                    dataUpdate.managementFee = managementFee;
                }

                if(subcontractFee){
                    dataUpdate.subcontractFee = subcontractFee;
                }

                if(expenses){
                    dataUpdate.expenses = expenses;
                }

                if(profit){
                    dataUpdate.profit = profit;
                }

                if(cgValue){
                    dataUpdate.cgValue = cgValue;
                }

                if(expiredCg){
                    dataUpdate.expiredCg = expiredCg;
                }

                if(agValue){
                    dataUpdate.agValue = agValue;
                }

                if(expiredAg){
                    dataUpdate.expiredAg = expiredAg;
                }

                if(dataAddToSet){
                    dataUpdate.$addToSet = dataAddToSet;
                }

                if(dataPull){
                    dataUpdate.$pull = dataPull;
                }
                let infoAfterInsert = await ITEM__CONTRACT_COLL.findByIdAndUpdate(contractID, dataUpdate, { new: true });
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "Cannot update contract" });
                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Remove Hợp đồng ✅
     * Author: Depv
     * Code: 
     */
    remove({ contractID }) { 
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
                if(!checkObjectIDs(contractID))
                    return resolve({ error: true, message: 'Request params contractID invalid', status: 400 });
                    
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                let infoAterRemove = await ITEM__CONTRACT_COLL.findByIdAndDelete(contractID);
                if(!infoAterRemove)
                    return resolve({ error: true, message: "can't_remove", status: 403 });
 
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
    getInfo({ contractID, select, populates }) { 
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
                if(!checkObjectIDs(contractID))
                    return resolve({ error: true, message: 'Request params contractID invalid', status: 400 });
                
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

                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                let infoAterRemove = await ITEM__CONTRACT_COLL.findById(contractID)
                                    .select(select)
                                    .populate(populates)
                if(!infoAterRemove)
                    return resolve({ error: true, message: "can't_get_info", status: 403 });
 
                return resolve({ error: false, data: infoAterRemove, status: 200 });
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
    getList({
        companyID,projectID, parentID, draft, outin, status, real, subType, type, field, chair, personInCharge, debtStatus, warehouse,
        date, startTime, endTime, buyerInfo, buyerBank, sellerInfo, sellerBank, lock, userID,
        keyword, limit = 10, lastestID, select, populates= {} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { 
                    $or: [
                        {
                            members: { $in: [userID] },
                        },
                        {
                            admins: { $in: [userID] },
                        }
                    ]
                };
                // Điều kiện gốc
               let conditionObjOrg = {}

                let conditionFind = { };
                let sortBy   = { createAt: -1, _id: -1 };
				let objSort  = {};
              
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
                
                if(companyID){
                    conditionObj.company = companyID
                }

                if(projectID){
                    conditionObj.project = projectID
                }

                if(parentID){
                    conditionObj.parent = parentID
                }

                if(draft){
                    conditionObj.draft = draft
                }

                if(outin){
                    conditionObj.outin = outin
                }

                if(status){
                    conditionObj.status = status
                }

                if(real){
                    conditionObj.real = real
                }

                if(subType){
                    conditionObj.subType = subType
                }

                if(type){
                    conditionObj.type = type
                }

                if(field){
                    conditionObj.field = field
                }

                if(chair){
                    conditionObj.chair = chair
                }

                if(personInCharge){
                    conditionObj.personInCharge = personInCharge
                }

                if(debtStatus){
                    conditionObj.debtStatus = debtStatus
                }

                if(warehouse){
                    conditionObj.warehouse = warehouse
                }

                if(date){
                    conditionObj.date = date
                }

                if(startTime){
                    conditionObj.startTime = startTime
                }

                if(endTime){
                    conditionObj.endTime = endTime
                }

                if(buyerInfo){
                    conditionObj.buyerInfo = buyerInfo
                }

                if(buyerBank){
                    conditionObj.buyerBank = buyerBank
                }

                if(sellerInfo){
                    conditionObj.sellerInfo = sellerInfo
                }

                if(sellerBank){
                    conditionObj.sellerBank = sellerBank
                }

                if(lock){
                    conditionObj.lock = lock
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regSearch = new RegExp(keyword, 'i');
                    conditionObj.name = regSearch
                }

                conditionObjOrg = { ...conditionObj }

                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await ITEM__CONTRACT_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

					let nextInfo = `${infoData.createAt}_${infoData._id}`;
                    // Lưu ý nêu sắp xếp tăng dần thì sửa lại ['createAt__1', '_id__1'];
					let keys	 = ['createAt__-1', '_id__-1'];
                    // console.log({ nextInfo });
					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });
					conditionFind = dataPagingAndSort.data.find;
					sortBy = dataPagingAndSort.data.sort;
                    
                    conditionObj.$and = [
                        { $or: conditionObj.$or },
                        { $or: conditionFind.$or },
                    ]
                    delete conditionObj.$or;
				}

			
                
                let infoDataAfterGet = await ITEM__CONTRACT_COLL.find(conditionObj)
                    .limit(+limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean(); 

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	    = null;

                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }
                
                let totalRecord = await ITEM__CONTRACT_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit); 

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: +limit,
                    totalRecord,
                    totalPage,
                    nextCursor
                }, status: 200 });
                
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;
