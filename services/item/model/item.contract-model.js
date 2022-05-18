"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const ObjectID                          = require('mongoose').Types.ObjectId;

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../helper/item.actions-constant');
const { CF_ACTIONS_CMCS } 		        = require('../../cmcs/helper/cmcs.actions-constant');

/**
 * TOOLS
 */

/**
 * COLLECTIONS
 */
const ITEM__CONTRACT_COLL            				= require('../database/item.contract-coll');

/**
 * SAU BỎ ĐI, CALL QUA SERVICE
 */
const CMCS__CONTRACT_PRODUCTION_COLL            	= require('../../cmcs/database/cmcs.contract_production-coll');
const CMCS__CONTRACT_IPC_COLL            			= require('../../cmcs/database/cmcs.contract_ipc-coll');
const CMCS__CONTRACT_PAYMENT_COLL            		= require('../../cmcs/database/cmcs.contract_payment-coll');
const CMCS__CONTRACT_EXPENSE_COLL            		= require('../../cmcs/database/cmcs.contract_expense-coll');

class Model extends BaseModel {

    constructor() {
        super(ITEM__CONTRACT_COLL);
    }

	/**
	 * Dev: Depv
	 * Func: Tạo hợp đồng
	 * Date: 13/12/2021
	 */
	insert({ projectID, parentID, admins, members, draft, outin, status, real, subType, type, field, dependentUnit, chair, personInCharge, debtStatus, warehouse, 
        name, sign, storeSign, description, note, note1, date, startTime, endTime, buyerInfo, buyerBank, sellerInfo, sellerBank, packageName, lock,
        value, plus, vatValue, advancePayment, produce, plusProduce, vatProduce, acceptance, plusAcceptance, vatAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, advancePaymentPaid, amountPaid, remainingPayment, advancePaymentOverage, finalValue,
        budget, budgetVAT, forecastBudget, forecastBudgetVAT, managementFee, subcontractFee, expenses, profit,
        cgValue, expiredCg, agValue, expiredAg, userID, ctx, remainingProduce, ontime, onbudget
         }){
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(projectID) || !checkObjectIDs(buyerInfo) || !checkObjectIDs(sellerInfo)|| !checkObjectIDs(dependentUnit) || !checkObjectIDs(chair) || !checkObjectIDs(personInCharge) || !checkObjectIDs(field))
                    return resolve({ error: true, message: 'Request params projectID|buyerInfo|sellerInfo|dependentUnit|chair|personInCharge|field invalid', status: 400 });
                
                let dataInsert = {
                    project: projectID, 
                    buyerInfo: buyerInfo, 
                    sellerInfo: sellerInfo, 
                    dependentUnit: dependentUnit,
                    personInCharge: personInCharge, 
                    chair: chair, 
                    field: field, 
                    userCreate: userID, 
                    members: [userID], 
                    admins: [userID],
                    name, 
                    sign, 
                    date
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

                if(buyerBank){
                    dataInsert.buyerBank = buyerBank;
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

                if(expiredCg != ""){      
                    dataInsert.expiredCg = expiredCg;
                }

                if(agValue){
                    dataInsert.agValue = agValue;
                }

                if(expiredAg != ""){      
                    dataInsert.expiredAg = expiredAg;
                }

                if(remainingProduce){
                    dataInsert.remainingProduce = remainingProduce;
                }

                if(ontime){
                    dataInsert.ontime = ontime;
                }

                if(onbudget){
                    dataInsert.onbudget = onbudget;
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
	update({ contractID, projectID, parentID, admins, adminsRemove, members, membersRemove, draft, outin, status, real, subType, type, field, dependentUnit, chair, personInCharge, debtStatus, warehouse,
        name, sign, storeSign, description, note, note1, date, startTime, endTime, buyerInfo, buyerBank, sellerInfo, sellerBank, packageName, lock,
        value, plus, vatValue, advancePayment, produce, plusProduce, vatProduce, acceptance, plusAcceptance, vatAcceptance, retainedValue, advancePaymentDeduction, otherDeduction, recommendedPayment, advancePaymentPaid, amountPaid, remainingPayment, advancePaymentOverage, finalValue,
        budget, budgetVAT, forecastBudget, forecastBudgetVAT, managementFee, subcontractFee, expenses, profit,
        cgValue, expiredCg, agValue, expiredAg, dataInc, photos, ctx, remainingProduce,  ontime, onbudget
        }){
        return new Promise(async resolve => {
            try {
                 /**
                * BA
                 * CẬP NHẬT LẠI CÁC THUỘC TÍNH CHO SẢN LƯỢNG, NGHIỆM THU, TIỀN VỀ
                 * - outin,...
                 * - projectID
                 * - field
                 * - chair
                 * - personInCharge
                 * - buyerInfo
                 * - sellerInfo
                 */

                // if(!checkObjectIDs(contractID) || !checkObjectIDs(projectID) || !checkObjectIDs(buyerInfo) || !checkObjectIDs(sellerInfo) || !checkObjectIDs(dependentUnit) || !checkObjectIDs(chair) || !checkObjectIDs(personInCharge) || !checkObjectIDs(field))
                //     return resolve({ error: true, message: 'Request params projectID|buyerInfo|sellerInfo|dependentUnit|chair|personInCharge|field invalid', status: 400 });
                let dataUpdate    = {}
                let dataAddToSet  = {};
                let dataPull      = {};

                const infoContract = await ITEM__CONTRACT_COLL.findById(contractID).lean();

                if(!infoContract) {
                    return resolve({
                        error: true,
                        message: "Hợp đồng không tồn tại",
                        keyError: "contract_not_exists",
                        status: 400
                    });
                }

                if(checkObjectIDs(parentID)){
                    dataUpdate.parent = parentID;
                    let infoContractParent = await ITEM__CONTRACT_COLL.findById(parentID);
                    if(infoContractParent){
                        dataUpdate.level = infoContractParent.level + 1;
                    }
                }

                if(checkObjectIDs(projectID)){
                    dataUpdate.projectID = projectID;
                }

                if(name){
                    dataUpdate.name = name;
                }

                if(sign){
                    dataUpdate.sign = sign;
                }

                if(date){
                    dataUpdate.date = date;
                }

                if(checkObjectIDs(admins)){
                    dataAddToSet.admins = admins;
                }

                if(checkObjectIDs(members)){
                    dataAddToSet.members = members;
                }

                if(checkObjectIDs(adminsRemove)){
                    dataPull.admins = adminsRemove;
                }

                if(checkObjectIDs(membersRemove)){
                    dataPull.members = membersRemove;
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

                if(checkObjectIDs(field)){
                    dataUpdate.field = field;
                }

                if(checkObjectIDs(dependentUnit)){
                    dataUpdate.dependentUnit = dependentUnit;
                }

                if(checkObjectIDs(personInCharge)){
                    dataUpdate.personInCharge = personInCharge;
                }

                if(checkObjectIDs(chair)){
                    dataUpdate.chair = chair;
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

                if(!isNaN(value) && Number(value) >= 0){  
                    dataUpdate.value = value;
                }

                if(!isNaN(plus) && Number(plus) >= 0){      
                    dataUpdate.plus = plus;
                }

                if(!isNaN(vatValue) && Number(vatValue) >= 0){      
                    dataUpdate.vatValue = vatValue;
                }

                if(!isNaN(advancePayment) && Number(advancePayment) >= 0){      
                    dataUpdate.advancePayment = advancePayment;
                }

                if(!isNaN(produce) && Number(produce) >= 0){      
                    dataUpdate.produce = produce;
                }

                if(!isNaN(plusProduce) && Number(plusProduce) >= 0){      
                    dataUpdate.plusProduce = plusProduce;
                }

                if(!isNaN(vatProduce) && Number(vatProduce) >= 0){      
                    dataUpdate.vatProduce = vatProduce;
                }

                if(!isNaN(acceptance) && Number(acceptance) >= 0){      
                    dataUpdate.acceptance = acceptance;
                }

                if(!isNaN(vatAcceptance) && Number(vatAcceptance) >= 0){      
                    dataUpdate.vatAcceptance = vatAcceptance;
                }

                if(!isNaN(plusAcceptance) && Number(plusAcceptance) >= 0){    
                    dataUpdate.plusAcceptance = plusAcceptance;
                }

                // if(!isNaN(vatPlusAcceptance) && Number(vatPlusAcceptance) >= 0){    
                //     dataUpdate.vatPlusAcceptance = vatPlusAcceptance;
                // }

                if(!isNaN(retainedValue) && Number(retainedValue) >= 0){      
                    dataUpdate.retainedValue = retainedValue;
                }

                if(!isNaN(advancePaymentDeduction) && Number(advancePaymentDeduction) >= 0){      
                    dataUpdate.advancePaymentDeduction = advancePaymentDeduction;
                }

                if(!isNaN(otherDeduction) && Number(otherDeduction) >= 0){      
                    dataUpdate.otherDeduction = otherDeduction;
                }

                if(!isNaN(recommendedPayment) && Number(recommendedPayment) >= 0){      
                    dataUpdate.recommendedPayment = recommendedPayment;
                }

                if(!isNaN(advancePaymentPaid) && Number(advancePaymentPaid) >= 0){      
                    dataUpdate.advancePaymentPaid = advancePaymentPaid;
                }

                if(!isNaN(amountPaid) && Number(amountPaid) >= 0){      
                    dataUpdate.amountPaid = amountPaid;
                }

                if(!isNaN(remainingPayment) && Number(remainingPayment) >= 0){      
                    dataUpdate.remainingPayment = remainingPayment;
                }

                if(!isNaN(advancePaymentOverage) && Number(advancePaymentOverage) >= 0){      
                    dataUpdate.advancePaymentOverage = advancePaymentOverage;
                }

                if(!isNaN(finalValue) && Number(finalValue) >= 0){      
                    dataUpdate.finalValue = finalValue;
                }

                if(!isNaN(budget) && Number(budget) >= 0){      
                    dataUpdate.budget = budget;
                }

                if(!isNaN(budgetVAT) && Number(budgetVAT) >= 0){      
                    dataUpdate.budgetVAT = budgetVAT;
                }

                if(!isNaN(forecastBudget) && Number(forecastBudget) >= 0){      
                    dataUpdate.forecastBudget = forecastBudget;
                }

                if(!isNaN(forecastBudgetVAT) && Number(forecastBudgetVAT) >= 0){      
                    dataUpdate.forecastBudgetVAT = forecastBudgetVAT;
                }

                if(!isNaN(managementFee) && Number(managementFee) >= 0){      
                    dataUpdate.managementFee = managementFee;
                }

                if(!isNaN(subcontractFee) && Number(subcontractFee) >= 0){      
                    dataUpdate.subcontractFee = subcontractFee;
                }

                if(!isNaN(expenses) && Number(expenses) >= 0){      
                    dataUpdate.expenses = expenses;
                }

                if(!isNaN(profit) && Number(profit) >= 0){      
                    dataUpdate.profit = profit;
                }

                if(!isNaN(cgValue) && Number(cgValue) >= 0){      
                    dataUpdate.cgValue = cgValue;
                }

                if(expiredCg != ""){      
                    dataUpdate.expiredCg = expiredCg;
                }else{
                    dataUpdate.expiredCg = null
                }

                if(!isNaN(agValue) && Number(agValue) >= 0){      
                    dataUpdate.agValue = agValue;
                }

                if(expiredAg != ""){      
                    dataUpdate.expiredAg = expiredAg;
                }else{
                    dataUpdate.expiredAg = null
                }

                if(dataAddToSet){
                    dataUpdate.$addToSet = dataAddToSet;
                }

                if(dataPull){
                    dataUpdate.$pullAll = dataPull;
                }

                if(dataInc){
                    dataUpdate.$inc = dataInc;
                }

                if(photos && photos.length) {
                    if(infoContract.photos.length >= 10){
						await ITEM__CONTRACT_COLL.findByIdAndUpdate(contractID, {
							$push: {
								photos: {
									$each: photos,
									$position: 0,
									$slice: 10
								}
							}
						});
					} else{
						await ITEM__CONTRACT_COLL.findByIdAndUpdate(contractID, {
							$push: {
								photos: {
									$each: photos,
									$position: 0
								}
							}
						});
					}
                }

                if(remainingProduce){
                    dataUpdate.remainingProduce = remainingProduce;
                }

                if(ontime){
                    dataUpdate.ontime = ontime;
                }

                if(onbudget){
                    dataUpdate.onbudget = onbudget;
                }
                
                let infoAfterInsert = await ITEM__CONTRACT_COLL.findByIdAndUpdate(contractID, dataUpdate, { new: true });
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "Cannot update contract", status: 422 });

                /**
                 * CẬP NHẬT LẠI CÁC THUỘC TÍNH CHO SẢN LƯỢNG, NGHIỆM THU, TIỀN VỀ
                 * 24/4/2022: Hiepnh => Đệ viết giúp anh API bên các service của CMCS để call sang, thay vì anh đang call trực tiếp theo Collection nhé
                 * - projectID
                 * - field
                 * - dependentUnit
                 * - personInCharge
                 * - chair
                 * - buyerInfo
                 * - sellerInfo
                 */
                let { 
                    project: projectAfterUpdate , 
                    field: fieldAfterUpdate, 
                    dependentUnit: dependentUnitAfterUpdate,
                    personInCharge: personInChargeAfterUpdate, 
                    chair: chairAfterUpdate, 
                    buyerInfo: buyerInfoAfterUpdate, 
                    sellerInfo: sellerInfoAfterUpdate, 
                    type: typeAfterUpdate, 
                    outin: outinAfterUpdate, 
                    real: realAfterUpdate } = infoAfterInsert;
                
                let fieldUpdate = {
                    "project" : ObjectID(projectAfterUpdate),
                    "field" : ObjectID(fieldAfterUpdate),
                    "dependentUnit" : ObjectID(dependentUnitAfterUpdate),
                    "personInCharge" : ObjectID(personInChargeAfterUpdate),
                    "chair" : ObjectID(chairAfterUpdate),
                    "buyerInfo" : ObjectID(buyerInfoAfterUpdate),
                    "sellerInfo" : ObjectID(sellerInfoAfterUpdate),
                    "type" : Number(typeAfterUpdate),
                    "outin": Number(outinAfterUpdate),
                    "real" : Number(realAfterUpdate)
                }
                
                // HiepNH: Dùng tạm theo cách này, sau bổ theo call Service
                await CMCS__CONTRACT_PRODUCTION_COLL.updateMany(
                    { contract: ObjectID(contractID) },
                    { $set: fieldUpdate }
                );

                await CMCS__CONTRACT_IPC_COLL.updateMany(
                    { contract: ObjectID(contractID) },
                    { $set: fieldUpdate }
                 );

                await CMCS__CONTRACT_PAYMENT_COLL.updateMany(
                    { contract: ObjectID(contractID) },
                    { $set: fieldUpdate }
                 );
                
                await CMCS__CONTRACT_EXPENSE_COLL.updateMany(
                    { contract: ObjectID(contractID) },
                    { $set: fieldUpdate }
                 );

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Remove Hợp đồng KHÔNG CHO PHÉP XÓA CÁC DANH MỤC
     * Author: Depv
     * Code:
     */

    /**
     * Name: get Hợp đồng 
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
     * Name  : Danh sách hợp đồng 
     * Author: Depv
     * Code  :
     */
    getList({
        companyID, projectID, parentID, draft, outin, status, real, subType, type, field, dependentUnit, chair, personInCharge, debtStatus, warehouse,
        date, startTime, endTime, buyerInfo, buyerBank, sellerInfo, sellerBank, lock, userID, isExpiredAg, isExpiredCg, isMember,
        keyword, limit = 10, lastestID, select, populates= {} }) {
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {};
                let keys	     = ['date__-1', '_id__-1'];
                let sortBy;

                if(limit > 20){
                    limit = 20
                }else{
                    limit = +limit
                }
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

                if(!checkObjectIDs(companyID) && !checkObjectIDs(projectID))
                    return resolve({ error: true, message: 'Bắt buộc phải truyền companyID hoặc projectID', keyError: "params_invalid" });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                if (checkObjectIDs(projectID)) {
                    conditionObj.project = projectID
                } else {
                    if (checkObjectIDs(companyID)) {
                        conditionObj.company = companyID
                    }
                }

                if(parentID){
                    conditionObj.parent = parentID
                }

                if(draft && Number(draft) > 0){
                    conditionObj.draft = Number(draft)
                }

                if(outin && Number(outin) > 0){
                    conditionObj.outin = Number(outin)
                }

                if(status && Number(status) > 0){
                    conditionObj.status = Number(status)
                }

                if(real && Number(real) > 0){
                    conditionObj.real = Number(real)
                }

                if(subType && Number(subType) > 0){
                    conditionObj.subType = Number(subType)
                }

                if(type && Number(type) > 0){
                    conditionObj.type = Number(type)
                }

                if(field && checkObjectIDs(field)){
                    conditionObj.field = ObjectID(field)
                }

                if(chair && checkObjectIDs(chair)){
                    conditionObj.chair = ObjectID(chair)
                }

                if(dependentUnit && checkObjectIDs(dependentUnit)){
                    conditionObj.dependentUnit = ObjectID(dependentUnit)
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

                if(debtStatus && checkObjectIDs(debtStatus)){
                    conditionObj.debtStatus = ObjectID(debtStatus)
                }

                if(warehouse && checkObjectIDs(warehouse)){
                    conditionObj.warehouse = ObjectID(warehouse)
                }

                if(startTime){
                    conditionObj.startTime = startTime
                }

                if(endTime){
                    conditionObj.endTime = endTime
                }

                if(lock){
                    conditionObj.lock = lock
                }

                // Theo dõi bảo lãnh tạm ứng
                if(isExpiredAg == 1){
                    keys = ['expiredAg__1', '_id__-1'];

                    conditionObj.expiredAg = { $exists: true, $ne: null }
                    conditionObj.status = { $ne: 3 } // Chỉ lấy các hợp đồng chưa hoàn thành
                }

                // Theo dõi bảo lãnh thực hiện hợp đồng
                if(isExpiredCg == 1){
                    keys = ['expiredCg__1', '_id__-1']

                    conditionObj.expiredCg = { $exists: true, $ne: null }
                    conditionObj.status = { $ne: 3 } // Chỉ lấy các hợp đồng chưa hoàn thành
                }

                if(isMember == 1){
                    conditionObj.members = { $in: [userID] }
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regSearch = new RegExp(keyword, 'i');
                    conditionObj.$or = [
                        { name: regSearch },
                        { sign: regSearch },
                        { storeSign: regSearch },
                    ]
                }

                let conditionObjOrg = { ...conditionObj };

                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await ITEM__CONTRACT_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionObj = dataPagingAndSort?.data?.find;
					sortBy       = dataPagingAndSort?.data?.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy                = dataPagingAndSort?.data?.sort;
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

    /**
     * Name  : Danh sách hợp đồng mà user là members 
     * Author: Depv
     * Code  :
     */
    getListIsMembers({
        companyID, projectID, parentID, draft, outin, status, real, subType, type, field, dependentUnit, chair, personInCharge, debtStatus, warehouse, isMember,
        date, startTime, endTime, buyerInfo, buyerBank, sellerInfo, sellerBank, lock, userID, isExpiredAg, isExpiredCg,
        keyword, limit = 10, lastestID, select, populates= {} }) {
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { members: { $in: [userID] } };
                let keys	     = ['date__-1', '_id__-1'];
                let sortBy;

                if(limit > 20){
                    limit = 20
                }
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
                if (checkObjectIDs(projectID)) {
                    conditionObj.project = projectID
                }else{
                    if(companyID){
                        conditionObj.company = companyID
                    }
                }

                if(checkObjectIDs(parentID)){
                    conditionObj.parent = parentID
                }

                if(draft && Number(draft) > 0){
                    conditionObj.draft = Number(draft)
                }

                if(outin && Number(outin) > 0){
                    conditionObj.outin = Number(outin)
                }

                if(status && Number(status) > 0){
                    conditionObj.status = Number(status)
                }

                if(real && Number(real) > 0){
                    conditionObj.real = Number(real)
                }

                if(subType && Number(subType) > 0){
                    conditionObj.subType = Number(subType)
                }

                if(type && Number(type) > 0){
                    conditionObj.type = Number(type)
                }

                if(field && checkObjectIDs(field)){
                    conditionObj.field = ObjectID(field)
                }

                if(chair && checkObjectIDs(chair)){
                    conditionObj.chair = ObjectID(chair)
                }

                if(dependentUnit && checkObjectIDs(dependentUnit)){
                    conditionObj.dependentUnit = ObjectID(dependentUnit)
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

                if(debtStatus && checkObjectIDs(debtStatus)){
                    conditionObj.debtStatus = ObjectID(debtStatus)
                }

                if(warehouse && checkObjectIDs(warehouse)){
                    conditionObj.warehouse = ObjectID(warehouse)
                }

                if(startTime){
                    conditionObj.startTime = startTime
                }

                if(endTime){
                    conditionObj.endTime = endTime
                }

                if(lock){
                    conditionObj.lock = lock
                }

                // Theo dõi bảo lãnh tạm ứng
                if(isExpiredAg == 1){
                    keys = ['expiredAg__1', '_id__-1'];

                    conditionObj.expiredAg = { $exists: true, $ne: null }
                    conditionObj.status = { $ne: 3 } // Chỉ lấy các hợp đồng chưa hoàn thành
                }

                // Theo dõi bảo lãnh thực hiện hợp đồng
                if(isExpiredCg == 1){
                    keys = ['expiredCg__1', '_id__-1'];

                    conditionObj.expiredCg = { $exists: true, $ne: null }
                    conditionObj.status = { $ne: 3 } // Chỉ lấy các hợp đồng chưa hoàn thành
                }

                if(isMember == 1){
                    conditionObj.members = { $in: [userID] }
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regSearch = new RegExp(keyword, 'i');
                    conditionObj.$or = [
                        { name: regSearch },
                        { sign: regSearch },
                        { storeSign: regSearch },
                    ]
                }

                let conditionObjOrg = { ...conditionObj };

                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await ITEM__CONTRACT_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionObj = dataPagingAndSort?.data?.find;
					sortBy       = dataPagingAndSort?.data?.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy                = dataPagingAndSort?.data?.sort;
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

    /**
     * Name: Gom nhóm theo tháng trong năm
     * Author: Hiepnh
     * Date: 05/04/2022
     */
    getAmountByMonth({ userID, type, outin, real, companyID, projectID, contractID, year, ctx }){
        return new Promise(async resolve => {
            try {
                let conditionObj = {}, conditionGroup = {}, conditionObjYear = {}

                if(type && Number(type) > 0){
                    conditionObj.type = Number(type)
                }

                if(outin && Number(outin) > 0){
                    conditionObj.outin = Number(outin)
                }

                if(real && Number(real) > 0){
                    conditionObj.real = Number(real)
                }

                conditionGroup = {
                    _id: { month: "$month", year: "$year" },
                    amount: { $sum: "$amount" },
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

                if(!isNaN(year) && Number(year) >= 0){
                    conditionObjYear = {
                        "year": Number(year),
                    }
                }
                
                let listData = await ITEM__CONTRACT_COLL.aggregate([
                    {
                        $match: conditionObj
                    }, 
                    {
                        $project : { 
                            year : {$year : "$date"},
                            month : {$month : "$date"},
                            amount: { $sum: ["$value", "$vatValue", "$plus", "$vatPlus"] },
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
     * Name: Gom nhóm theo thuộc tính 
     * Author: Hiepnh
     * Date: 17/04/2022
     */
    getAmountByProperty({ userID, type, outin, real, companyID, projectID, contractID, year, optionTime, optionProperty, ctx }){
        console.log({ userID, type, outin, real, companyID, projectID, contractID, year, optionTime, optionProperty })
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * optionTime: Báo cáo theo trục thời gian
                 * optionProperty: Báo cáo theo tính chất/phân loại
                 * 1-Báo cáo theo phân loại: Giá trị ký, Sản lượng, Doanh thu, Tiền về
                 * 2.1-Tính tổng Tất cả-Theo năm (1)/Theo tháng (2)
                 * 2.2-Tính tổng theo thuộc tính: Lĩnh vực (1)/Khách hàng (2)/Đơn vị (3)/Phụ trách (4)
                 * 2.3-Tính tổng kết hợp
                 */
                let conditionObj = {}, conditionGroup = {}, conditionObjYear = {}, conditionPopulate = {}, sortBy = {"amount": 1}

                if(type && Number(type) > 0){
                    conditionObj.type = Number(type)
                }

                if(outin && Number(outin) > 0){
                    conditionObj.outin = Number(outin)
                }

                if(real && Number(real) > 0){
                    conditionObj.real = Number(real)
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

                // TÍNH TỔNG THEO TẤT CẢ/THEO NĂM
                if(Number(optionTime) === 1){
                    conditionGroup = {
                        _id: { },
                        amount: { $sum: "$amount" },
                    }

                    if(!isNaN(year) && Number(year) >= 0){
                        conditionObjYear = {
                            "year": Number(year),
                        }
                    }

                    // Theo Lĩnh vực
                    if(Number(optionProperty) === 1){
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
                    if(Number(optionProperty) === 2){
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
                    if(Number(optionProperty) === 3){
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

                    // Theo Phụ trách
                    if(Number(optionProperty) === 4){
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
                    if(Number(optionProperty) === 5){
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

                    // Theo Đơn vị
                    if(Number(optionProperty) === 6){
                        conditionGroup = {
                            _id: { dependentUnit: "$dependentUnit" },
                            amount: { $sum: "$amount" },
                        }

                        conditionPopulate = {
                            path: '_id.dependentUnit',
                            select: '_id name sign',
                            model: 'contact'
                        }

                        sortBy = {
                            "_id.dependentUnit": 1,
                        }
                    }
                }

                // TÍNH TỔNG THEO THÁNG
                if(Number(optionTime) === 2){
                    conditionGroup = {
                        _id: { month: "$month", year: "$year" },
                        amount: { $sum: "$amount" },
                    }

                    // Theo tháng trong một năm cụ thể
                    if(!isNaN(year) && Number(year) >= 0){
                        conditionObjYear = {
                            "year": Number(year),
                        }
                    }

                    // Theo Lĩnh vực
                    if(Number(optionProperty) === 1){
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
                    if(Number(optionProperty) === 2){
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
                    if(Number(optionProperty) === 3){
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

                    // Theo Phụ trách
                    if(Number(optionProperty) === 4){
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
                    if(Number(optionProperty) === 5){
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

                    // Theo Đơn vị
                    if(Number(optionProperty) === 6){
                        conditionGroup = {
                            _id: { dependentUnit: "$dependentUnit", month: "$month", year: "$year" },
                            amount: { $sum: "$amount" },
                        }

                        conditionPopulate = {
                            path: '_id.dependentUnit',
                            select: '_id name sign',
                            model: 'contact'
                        }

                        sortBy = {
                            "_id.dependentUnit": 1,
                        }
                    }
                }
                
                console.log('===================>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
                console.log(conditionObj)
                console.log(conditionObjYear)
                console.log(conditionGroup)

                let listData = await ITEM__CONTRACT_COLL.aggregate([
                    {
                        $match: conditionObj
                    }, 
                    {
                        $project : { 
                            year : {$year : "$date"},
                            month : {$month : "$date"},
                            amount: { $sum: ["$value", "$vatValue", "$plus", "$vatPlus"] },
                            type: 1,
                            outin: 1,
                            real: 1,
                            field: 1,
                            buyerInfo: 1,
                            chair: 1,
                            personInCharge: 1,
                            dependentUnit: 1,
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

                if(!isNaN(optionProperty) && Number(optionProperty) > 0){
                    await ITEM__CONTRACT_COLL.populate(listData, conditionPopulate)
                }

                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Danh sách theo tháng trong năm
     * Author: Hiepnh
     * Date: 05/04/2022
     */
    getListByMonth({ userID, companyID, projectID, contractID, month, year, type, outin, real, field, dependentUnit, chair, personInCharge, buyerInfo, sellerInfo, keyword, limit = 20, lastestID, select, populates= {} }){
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

                // Điều kiện để Aggregate
                let conditionObjAgg = {}, conditionObjYear = {}

                if(month && Number(month) > 0){
                    conditionObjYear.month = Number(month)
                    conditionObjYear.year = Number(year)
                }else{
                    conditionObjYear.year = Number(year)
                }

                if(type && Number(type) > 0){
                    conditionObjAgg.type = Number(type)
                }

                if(outin && Number(outin) > 0){
                    conditionObjAgg.outin = Number(outin)
                }

                if(real && Number(real) > 0){
                    conditionObjAgg.real = Number(real)
                }

                if(field && checkObjectIDs(field)){
                    conditionObjAgg.field = ObjectID(field)
                }

                if(dependentUnit && checkObjectIDs(dependentUnit)){
                    conditionObjAgg.dependentUnit = ObjectID(dependentUnit)
                }

                if(chair && checkObjectIDs(chair)){
                    conditionObjAgg.chair = ObjectID(chair)
                }

                if(personInCharge && checkObjectIDs(personInCharge)){
                    conditionObjAgg.personInCharge = ObjectID(personInCharge)
                }

                if(buyerInfo && checkObjectIDs(buyerInfo)){
                    conditionObjAgg.buyerInfo = ObjectID(buyerInfo)
                }

                if(sellerInfo && checkObjectIDs(sellerInfo)){
                    conditionObjAgg.sellerInfo = ObjectID(sellerInfo)
                }

                if(contractID && checkObjectIDs(contractID)){
                    conditionObjAgg.contract = ObjectID(contractID)
                }else{
                    if(projectID && checkObjectIDs(projectID)){
                        conditionObjAgg.project = ObjectID(projectID)
                    }else{
                        if(companyID && checkObjectIDs(companyID)){
                            conditionObjAgg.company = ObjectID(companyID)
                        }
                    }
                }

                console.log(conditionObjAgg)
                console.log(conditionObjYear)
                // console.log(conditionGroup)

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
                let listData = await ITEM__CONTRACT_COLL.aggregate([
                    {
                        $match: conditionObjAgg
                    },
                    {
                        $project : {
                            year : {$year : "$date"},
                            month : {$month : "$date"},
                        }
                    },
                    {
                        $match: conditionObjYear
                    },
                    {$sort: {"date": 1}}
                ])

                console.log(conditionObjAgg)
                console.log(listData)

                conditionObj._id = {$in: listData.map(item=>item._id)}

                // Trả về danh sách mẩu tin
                let conditionObjOrg = { ...conditionObj };

                if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await ITEM__CONTRACT_COLL.findById(lastestID);
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

                let infoDataAfterGet = await ITEM__CONTRACT_COLL.find(conditionObj)
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

                let totalRecord = await ITEM__CONTRACT_COLL.count(conditionObjOrg);
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
     * Name  : Cập nhật giá trị 
     * Author: Hiepnh
     * Date  : 16/4/2022 
     */
    updateValue({ 
        contractID, userID, option, ctx
    }){ 
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * 1-Cập nhật giá trị ngân sách
                 * 2-Cập nhật dự báo ngân sách
                 * 3-Cập nhật thực hiện ngân sách
                 */

                if(!checkObjectIDs(contractID))
                    return resolve({ error: true, message: "Mã hiệu không đúng", keyError: "contractID_invalid" });
                
                let infoContract = await ITEM__CONTRACT_COLL.findById(contractID)
                // console.log({infoContract})
                
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
                if(option && Number(option) === 1){
                    console.log('1-Cập nhật Sản lượng')
                    let infoIpcContract = await ctx.call(`${CF_DOMAIN_SERVICES.CMCS}.${CF_ACTIONS_CMCS.CONTRACT_PRODUCTION_GET_AMOUNT_BY_OBJECT}`, {
                        userID, contractID
                    })

                    // Sản lượng còn lại chưa thực hiện
                    let totalValue = 0, remainingProduce = 0
                    totalValue = Number(infoContract.value | 0)+Number(infoContract.vatValue | 0)+Number(infoContract.plus | 0)+Number(infoContract.vatPlus | 0)

                    remainingProduce = Number(totalValue)-Number(infoIpcContract.data.produce)-Number(infoIpcContract.data.vatProduce)-Number(infoIpcContract.data.plusProduce)-Number(infoIpcContract.data.vatPlusProduce)
                    // console.log({totalValue})
                    // console.log({remainingProduce})

                    // console.log(infoIpcContract)
                    if(infoIpcContract){
                        dataUpdate.produce = Number(infoIpcContract.data.produce)
                        dataUpdate.vatProduce = Number(infoIpcContract.data.vatProduce)
                        dataUpdate.plusProduce = Number(infoIpcContract.data.plusProduce)
                        dataUpdate.vatPlusProduce = Number(infoIpcContract.data.vatPlusProduce)
                        dataUpdate.remainingProduce = Number(remainingProduce)
                    }
                }

                //2-Cập nhật Doanh thu, tiền về
                if(option && Number(option) === 2){
                    console.log('2-Cập nhật Doanh thu, tiền về')
                    let infoIpcContract = await ctx.call(`${CF_DOMAIN_SERVICES.CMCS}.${CF_ACTIONS_CMCS.CONTRACT_IPC_GET_AMOUNT_BY_OBJECT}`, {
                        userID, contractID
                    })
                    // console.log(infoIpcContract)
                    if(infoIpcContract){
                        dataUpdate.acceptance = Number(infoIpcContract.data.acceptance);
                        dataUpdate.vatAcceptance = Number(infoIpcContract.data.vatAcceptance);
                        dataUpdate.plusAcceptance = Number(infoIpcContract.data.plusAcceptance);
                        dataUpdate.vatPlusAcceptance = Number(infoIpcContract.data.vatPlusAcceptance);
                        dataUpdate.retainedValue = Number(infoIpcContract.data.retainedValue);
                        dataUpdate.advancePaymentDeduction = Number(infoIpcContract.data.advancePaymentDeduction);
                        dataUpdate.otherDeduction = Number(infoIpcContract.data.otherDeduction);
                        dataUpdate.recommendedPayment = Number(infoIpcContract.data.recommendedPayment);
                        dataUpdate.advancePaymentPaid = Number(infoIpcContract.data.advancePaymentPaid);
                        dataUpdate.amountPaid = Number(infoIpcContract.data.amountPaid);
                        dataUpdate.remainingPayment = Number(infoIpcContract.data.recommendedPayment) - Number(infoIpcContract.data.advancePaymentPaid) - Number(infoIpcContract.data.amountPaid)
                    }
                }

                //3-Cập nhật Chi phí
                if(option && Number(option) === 3){
                    console.log('3-Cập nhật Chi phí')
                    let infoExpenseContract = await ctx.call(`${CF_DOMAIN_SERVICES.CMCS}.${CF_ACTIONS_CMCS.CONTRACT_EXPENSE_GET_AMOUNT_BY_OBJECT}`, {
                        userID, contractID
                    })
                    // console.log(infoExpenseContract)
                    if(infoExpenseContract){
                        dataUpdate.expense = Number(infoExpenseContract.data.value);
                    }
                }

                //4-Cập nhật Ngân sách

                let infoAfterUpdate = await ITEM__CONTRACT_COLL.findByIdAndUpdate(contractID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update_contract_ipc", status: 403 });
                
                console.log(infoAfterUpdate)

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Tính sản lượng còn lại chưa thực hiện
     * Author: Hiepnh
     * Date: 05/04/2022
     */
    getRetainProduce({ userID, outin, companyID, projectID, contractID, ctx }){
        // console.log({ userID, outin, companyID, projectID, contractID })
        return new Promise(async resolve => {
            try {
                let remainingProduce = 0
                let conditionObj = {}, conditionGroup = {}

                if(outin && Number(outin) > 0){
                    conditionObj.outin = Number(outin)
                }

                conditionGroup = {
                    _id: { },
                    remainingProduce: { $sum: "$remainingProduce" },
                    // value: { $sum: "$value" },
                    // produce: { $sum: "$produce" },
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
                
                let listData = await ITEM__CONTRACT_COLL.aggregate([
                    {
                        $match: conditionObj
                    }, 
                    {
                        $project : { 
                            year : {$year : "$date"},
                            month : {$month : "$date"},
                            remainingProduce : "$remainingProduce",
                            // value: { $sum: ["$value", "$vatValue", "$plus", "$vatPlus"] },
                            // produce: { $sum: ["$produce", "$vatProduce", "$plusProduce", "$vatPlusProduce"] },
                        }
                    },
                    {
                        $group: conditionGroup
                    }
                ])

                if(listData && listData.length){
                    remainingProduce = Number(listData[0].remainingProduce)
                }

                return resolve({ error: false, data: remainingProduce });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Thống kê trạng thái hợp đồng theo(ontime, onbudget)
     * Author: Hiepnh
     * Date: 16/5/2022
     */
    statisticalStatusByOntimeOnbudget({  projectID }){
        return new Promise(async resolve => {
            try {
                let conditionObj = { ontime: {$exists: true}, onbudget: {$exists: true} };

                if(!checkObjectIDs(projectID)){
                    return resolve({ error: true, message: "projectID không hợp lệ" });
                }else{
                    conditionObj.project = ObjectID(projectID)
                }

                let listData = await ITEM__CONTRACT_COLL.aggregate([
                    {
                        $match: conditionObj
                    }, 
                    {
                        $group: {
                            _id: { ontime: "$ontime" , onbudget: "$onbudget" }, // Phân loại trạng thái
                            amount: { $sum: 1},
                        }
                    },
                    {
                        $sort: {"_id.ontime": 1 }
                    }
                ])

                return resolve({ error: false, data: listData })
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

}

exports.MODEL = new Model;
