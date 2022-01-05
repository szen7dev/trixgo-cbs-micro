"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION } 		= require('../../../tools/cursor_base/playground/index');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * import inter-coll, exter-coll
 */
const INSPECTION__CHECKLIST_COLL    = require('../database/inspection.checklist-coll');

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */
 
class Model extends BaseModel {

    constructor() {
        super(INSPECTION__CHECKLIST_COLL);
    }
     
    /**
     * Name: Thêm checklist  ✅
     * Author: DePV
     * Code: F02401
     */
    insert({ inspection, template, name, authorID }) { 
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

                if(!checkObjectIDs(template))
                    return resolve({ error: true, message: 'Request params template invalid', status: 400 });
                    
                if (!name || name == '')
                    return resolve({ error: true, message: 'Request params name invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                dataInsert = {
                    inspection, template, name, userCreate: authorID, userUpdate: authorID
                };

                let infoDataAfterInserted = await this.insertData(dataInsert);

                if(!infoDataAfterInserted)
                    return resolve({ error: true, message: "Can't create checklist", status: 403 });

                return resolve({ error: false, data: infoDataAfterInserted, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

     /**
     * Name: Cập nhật trạng thái checklist  ✅
     * Author: DePV
     * Code: F02402
     */
    update({ checklistID, status, authorID }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { };

                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                if(!checkObjectIDs(checklistID))
                    return resolve({ error: true, message: 'Request params checklistID invalid', status: 400 });

                if(!checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'Request params authorID invalid', status: 400 });

                if(![0, 1].includes(status))
                    return resolve({ error: true, message: 'Request params status invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                dataUpdate = {
                    status, approver: authorID, userUpdate: authorID, timeApproved: new Date()
                };

                let infoDataAfterUpdate = await INSPECTION__CHECKLIST_COLL.findByIdAndUpdate(checklistID, dataUpdate, { new: true })

                if(!infoDataAfterUpdate)
                    return resolve({ error: true, message: "Can't create checklist", status: 403 });

                return resolve({ error: false, data: infoDataAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Lấy thông tin checklist  ✅
     * Author: DePV
     * Code: F02403
     */
    getInfo({ checklistID }) { 
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
                let infoChecklist = await INSPECTION__CHECKLIST_COLL.findById(checklistID);
                if(!infoChecklist)
                    return resolve({ error: true, message: "Can't create checklist", status: 403 });

                return resolve({ error: false, data: infoChecklist, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

     /**
     * Name: Lấy danh sách checklist ✅
     * Author: DePV
     * Code: F02404
     */
    getList({limit = 10, lastestID, filter, select, inspectionID }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { inspection: inspectionID, state: 1 };
                let conditionFind = {};
                let sortBy = { createAt: -1 };
                let objSort = {};

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
				if(lastestID && checkObjectIDs(lastestID)){
					let infoChecklist = await INSPECTION__CHECKLIST_COLL.findById(lastestID);
					if(!infoChecklist)
						return resolve({ error: true, message: "Can't get info last checklist", status: 400 });

					let nextInfo = `${infoChecklist.createAt}_${infoChecklist._id}`;
                    // Lưu ý nêu sắp xếp tăng dần thì sửa lại ['createAt__1', '_id__1'];
					let keys	 = ['createAt__-1', '_id__-1'];
                    // console.log({ nextInfo });
					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });
					conditionFind = dataPagingAndSort.data.find;
					sortBy = dataPagingAndSort.data.sort;
				}

                let infoDataAfterGet = await INSPECTION__CHECKLIST_COLL.find({...conditionObj, ...conditionFind }, { ...filter })
                    .limit(+limit+1) // Cộng thêm 1 để kiểm tra có nextCursor hay không
                    .sort(sortBy) 
                    .lean();

                // GET TOTAL RECORD
				let totalRecord = await INSPECTION__CHECKLIST_COLL.count(conditionObj);

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get checklists", status: 403 });
                
                let totalPage = Math.ceil(totalRecord/limit);

				let nextCursor	= null;
				if(infoDataAfterGet && infoDataAfterGet.length){
					if(infoDataAfterGet.length > limit){
						nextCursor = infoDataAfterGet[limit - 1]._id;
						infoDataAfterGet.length = limit;
					}
				}

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