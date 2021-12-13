"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                                  	= require('mongoose').Types.ObjectId;

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 						= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 							= require('../../file/helper/file.actions-constant');

/**
 * TOOLS
 */
const BaseModel                                 	= require('../../../tools/db/base_model');

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
	insert({ outin, field, type, subType, status, packageName, name, sign, storeSign, note, note1, description, buyerInfo, buyerBank, sellerInfo, sellerBank, date, startTime, endTime, packagePrice, value, plus, advancePayment, finalValue, valueNetOrg, valueNet, backupBudget, cgValue, expiredCg, agValue, expiredAg, project, linkCrm, chair, personInCharge, debtStatus, fcuExRate, fcuValue, fcuPlus, fcuAdvancePayment, fcuFinalValue, fcuCgValue, fcuAgValue, fcuPackagePrice, managementFee, subcontractFee, vat, warehouse, company, authorID, parent }) {
        return new Promise(async resolve => {
            try {
                if(!name || !_isValid(company) || !_isValid(authorID))
                    return resolve({ error: true, message: 'param_not_valid' });
				
                let dataInsert = {
                    company,
                    userCreate: authorID,
                    outin: outin ? Number(outin) : 1, 
                    type: type ? Number(type) : 1, 
                    status: status ? Number(status) : 1,
                    subType: subType ? Number(subType) : 1,
                    packageName, 
                    name, 
                    sign, 
                    storeSign, 
                    note, 
                    buyerBank, 
                    sellerBank, 
                    note1,
                    description, 
                    date, 
                    startTime, 
                    endTime, 
                    packagePrice: packagePrice ? Number(packagePrice) : 0,
                    value: value ? Number(value) : 0,
                    plus: plus ? Number(plus) : 0,
                    advancePayment: advancePayment ? Number(advancePayment) : 0,
                    finalValue: finalValue ? Number(finalValue) : 0,
                    valueNetOrg: valueNetOrg ? Number(valueNetOrg) : 0, 
                    valueNet: valueNet ? Number(valueNet) : 0, 
                    backupBudget: backupBudget ? Number(backupBudget) : 0, 
                    cgValue: cgValue ? Number(cgValue) : 0, 
                    expiredCg, 
                    agValue: agValue ? Number(agValue) : 0, 
                    expiredAg,
                    fcuExRate: fcuExRate ? fcuExRate : 0, 
                    fcuValue: fcuValue ? fcuValue : 0, 
                    fcuPlus: fcuPlus ? fcuPlus : 0, 
                    fcuAdvancePayment: fcuAdvancePayment ? fcuAdvancePayment : 0, 
                    fcuFinalValue: fcuFinalValue ? fcuFinalValue : 0, 
                    fcuCgValue: fcuCgValue ? fcuCgValue : 0, 
                    fcuAgValue: fcuAgValue ? fcuAgValue : 0, 
                    fcuPackagePrice: fcuPackagePrice ? fcuPackagePrice : 0, 
                    managementFee: managementFee ? managementFee : 0, 
                    subcontractFee: subcontractFee ? subcontractFee : 0, 
                    vat: vat ? vat : 10, 
                }

                if(field && _isValid(field)){
                    dataInsert.field = field;
                }   
                if(project && _isValid(project)){
                    dataInsert.project = project;
                }  
                if(buyerInfo && _isValid(buyerInfo)){
                    dataInsert.buyerInfo = buyerInfo;
                }    
                if(sellerInfo && _isValid(sellerInfo)){
                    dataInsert.sellerInfo = sellerInfo;
                }    
                if(linkCrm && _isValid(linkCrm)){
                    dataInsert.linkCrm = linkCrm;
                }     
                if(chair && _isValid(chair)){
                    dataInsert.chair = chair;
                }   
                if(personInCharge && _isValid(personInCharge)){
                    dataInsert.personInCharge = personInCharge;
                }    
                if(debtStatus && _isValid(debtStatus)){
                    dataInsert.debtStatus = debtStatus;
                }    
                if(warehouse && _isValid(warehouse)){
                    dataInsert.warehouse = warehouse;
                }    

                if(parent && _isValid(parent)){
                    dataInsert.parent = parent;
                    let infoMenuParent = await CONTRACT_COLL.findById(parent);
                    dataInsert.level = infoMenuParent.level + 1;
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if(parent) {
                    await CONTRACT_COLL.findByIdAndUpdate(parent, {
                            $addToSet: { childs: infoAfterInsert._id } 
                    }, { new: true });
                }

                if(project) {
                    await DEPARTMENT_COLL.findByIdAndUpdate(project, {
                        $addToSet: { contracts: infoAfterInsert._id } 
                    }, { new: true });
                }
                
                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}

exports.MODEL = new Model;
