"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid }                        
                                        = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION } 		= require('../../../tools/cursor_base/playground/index');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * import inter-coll, exter-coll
 */
const INSPECTION__TEMPLATE_DOC_COLL          = require('../database/inspection.template_doc-coll');
const INSPECTION__TEMPLATE_CHECKLIST_COLL    = require('../database/inspection.template_checklist-coll');

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */
 
class Model extends BaseModel {

    constructor() {
        super(INSPECTION__TEMPLATE_CHECKLIST_COLL);
    }

    
    /**
     * Thêm mẩu tin: DePV ✅
     * F0215
     */
    insert({ inspection, name, description, authorID }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataInsert = { };

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params authorID invalid', status: 400 });

                if(!checkObjectIDs(inspection))
                    return resolve({ error: true, message: 'Request params inspection invalid', status: 400 });
                    
                if (!name || name == '')
                    return resolve({ error: true, message: 'name_invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  

                dataInsert = {
                    inspection,  name, userCreate: authorID, userUpdate: authorID
                };

                if(description){
                    dataInsert.description = description;
                }

                let infoDataAfterInserted = await this.insertData(dataInsert);

                if(!infoDataAfterInserted)
                    return resolve({ error: true, message: "Can't create template checklist", status: 403 });

                return resolve({ error: false, data: infoDataAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Cập nhật template docs: DePV ✅
     * F0216
     */
    update({ checklistID, name, description, authorID }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = {};

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(authorID, checklistID))
                    return resolve({ error: true, message: 'Request params authorID or checklistID invalid', status: 400 });

                if (!name || name == '')
                    return resolve({ error: true, message: 'name_invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                dataUpdate = {
                    name, userCreate: authorID, userUpdate: authorID
                };

                if(description){
                    dataUpdate.description = description;
                }

                let infoDataAfterUpdate = await INSPECTION__TEMPLATE_CHECKLIST_COLL.findByIdAndUpdate(checklistID, dataUpdate, { new: true });
                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't update template doc", status: 403 });

                return resolve({ error: false, data: infoDataAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Xóa template docs: DePV ✅
     * F0217
     */
    remove({ checklistID }) { 
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
                if(!checkObjectIDs(checklistID))
                    return resolve({ error: true, message: 'Request params checklistID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                let infoDataAfterUpdate = await INSPECTION__TEMPLATE_CHECKLIST_COLL.findByIdAndUpdate(checklistID, { state: 2 }, { new: true });

                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't remove template checklist", status: 403 });

                return resolve({ error: false, data: "Remove Success", status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Xóa template docs: DePV ✅
     * F0218
     * problem: Bị hạn chế không thể sort createAt = 1
     */
    getListByTemplateDocsWithPaging({ limit = 10, lastestIDChecklist, templateID  }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { inspection: templateID, state: 1 };
                let conditionFind = {};
                let sortBy  = { createAt: -1 };

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(templateID))
                    return resolve({ error: true, message: "'Request params templateDocID invalid" });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                // GET CONDITION PAGINATION
				if(lastestIDChecklist && checkObjectIDs(lastestIDChecklist)){
					let infoMessage = await INSPECTION__TEMPLATE_CHECKLIST_COLL.findById(lastestIDChecklist);
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

                let infoDataAfterGet = await INSPECTION__TEMPLATE_CHECKLIST_COLL.find({...conditionObj, ...conditionFind })
                    .select("name userUpdate modifyAt description")
                    .populate({
                        path: "userUpdate",
                        select: "fullname"
                    })
                    .limit(+limit)
                    .sort(sortBy) 
                    .lean();

                // GET TOTAL RECORD
				let totalRecord = await INSPECTION__TEMPLATE_CHECKLIST_COLL.count(conditionObj);
                let totalCurrentPage = await INSPECTION__TEMPLATE_CHECKLIST_COLL.count(conditionFind);

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get template docs", status: 403 });
                
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