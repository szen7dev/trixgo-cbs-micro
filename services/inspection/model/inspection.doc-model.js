"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid }                        
                                        = require('../../../tools/utils/utils');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * import inter-coll, exter-coll
 */
const INSPECTION__DOC_COLL                 = require('../database/inspection.doc-coll');
const ITEM__CONTRACT_COLL                  = require('../../item/database/item.contract-coll');
const { RANGE_BASE_PAGINATION } 		   = require('../../../tools/cursor_base/playground/index');

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */

class Model extends BaseModel {
    
    constructor() {
        super(INSPECTION__DOC_COLL);
    }
    
    // Thêm mẩu tin: Depv ✅
    insert({ projectID, contractID, sign, template, assignee, members, name, expiredTime, job, areas, description, userID }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE STEP (1)
                 */
                let dataInsert = {};

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(!checkObjectIDs(template))
                    return resolve({ error: true, message: 'Request params template invalid', status: 400 });
                
                if(!checkObjectIDs(assignee))
                    return resolve({ error: true, message: 'Request params assignee invalid', status: 400 });
                
                if(!checkObjectIDs(areas))
                    return resolve({ error: true, message: 'Request params areas invalid', status: 400 });
                  
                if(!checkObjectIDs(job))
                    return resolve({ error: true, message: 'Request params job invalid', status: 400 });

                if(!checkObjectIDs(contractID))
                    return resolve({ error: true, message: 'Request params contractID invalid', status: 400 });

                if(!checkObjectIDs(projectID))
                    return resolve({ error: true, message: 'Request params projectID invalid', status: 400 });

                if(!sign)
                    return resolve({ error: true, message: 'Request params sign invalid', status: 400 });
                
                if (!expiredTime)
                    return resolve({ error: true, message: 'expiredTime_invalid', status: 400 });

                /** 
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                dataInsert = { project: projectID, contract: contractID, template, sign, assignee, members, name, areas, expiredTime, job, userCreate: userID, userUpdate: userID };
                if(description){
                    dataInsert.description = description;
                }

                let infoDataAfterInserted = await this.insertData(dataInsert);
                if(!infoDataAfterInserted)
                    return resolve({ error: true, message: "Can't create inspection doc", status: 403 });

                return resolve({ error: false, data: infoDataAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    // Cập nhât mẩu tin: Depv ✅ 
    update({ docID, contract, sign, template, assignee, members, name, expiredTime, job, areas, description, userID }) { 
        return new Promise(async (resolve) => {
            try {
                /**      
                 * DECALARTION VARIABLE STEP (1)
                 */
                let dataUpdate = {};

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(!checkObjectIDs(template))
                    return resolve({ error: true, message: 'Request params template invalid', status: 400 });
                
                if(!checkObjectIDs(assignee))
                    return resolve({ error: true, message: 'Request params assignee invalid', status: 400 });
                
                if(!checkObjectIDs(areas))
                    return resolve({ error: true, message: 'Request params areas invalid', status: 400 });
                  
                if(!checkObjectIDs(job))
                    return resolve({ error: true, message: 'Request params job invalid', status: 400 });

                if(!checkObjectIDs(contract))
                    return resolve({ error: true, message: 'Request params contract invalid', status: 400 });

                if(sign)
                    return resolve({ error: true, message: 'Request params sign invalid', status: 400 });
                
                if (expiredTime)
                    return resolve({ error: true, message: 'name_invalid', status: 400 });

                /** 
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                dataUpdate = { template, sign, assignee, members, name, areas, expiredTime, job, userUpdate: userID };
                 
                if(description){
                    dataUpdate.description = description;
                }

                let infoDataAfterInserted = await INSPECTION__DOC_COLL.findByIdAndUpdate(docID, { dataUpdate } , { new: true });
                if(!infoDataAfterInserted)
                    return resolve({ error: true, message: "Can't create inspection doc", status: 403 });

                return resolve({ error: false, data: infoDataAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    // Xóa mẩu tin: Depv ✅
    remove({ docID }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE STEP (1)
                 */

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(docID))
                    return resolve({ error: true, message: 'Request params docID invalid', status: 400 });
         
                let infoDataAfterRemove = await INSPECTION__DOC_COLL.findByIdAndUpdate(docID, { state: 2 }, { new: true });
                if(!infoDataAfterRemove)
                    return resolve({ error: true, message: "Can't update inspect area", status: 403 });

                return resolve({ error: false, data: infoDataAfterRemove, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    /** 
     * Danh sách area theo project: DePV ✅
     */
    getListDocByContract({ contractID, limit = 10, lastestIDdoc }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { contract: contractID, state: 1 };
                let conditionFind = {};
                let sortBy = { createAt: -1 };
                let objSort = {};
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                // GET CONDITION PAGINATION
				if(lastestIDdoc && checkObjectIDs(lastestIDdoc)){
					let infoMessage = await INSPECTION__DOC_COLL.findById(lastestIDdoc);
					if(!infoMessage)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

					let nextInfo = `${infoMessage.createAt}_${infoMessage._id}`;
                    // Lưu ý nêu sắp xếp tăng dần thì sửa lại ['createAt__1', '_id__1'];
					let keys	 = ['createAt__-1', '_id__-1'];
                    // console.log({ nextInfo });
					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });
					conditionFind = dataPagingAndSort.data.find;
					sortBy = dataPagingAndSort.data.sort;
				}

                let infoDataAfterGet = await INSPECTION__DOC_COLL.find({...conditionObj, ...conditionFind })
                    .limit(+limit)
                    .sort(sortBy) 
                    .lean();

                // GET TOTAL RECORD
				let totalRecord = await INSPECTION__DOC_COLL.count(conditionObj);
                let totalCurrentPage = await INSPECTION__DOC_COLL.count(conditionFind);

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get docs", status: 403 });
                
                let totalPage = Math.ceil(totalRecord/limit);
                let currentPage = getCurrentPage({ totalRecord, totalCurrentPage, limit });
                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: +limit,
                    totalRecord,
                    totalPage,
                    currentPage
                }, status: 200 });

            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
 }

exports.MODEL = new Model;