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
     * Name: Thêm checklist  
     * Author: DePV
     * Code: F02401
     */
    insert({ inspectionID, name, description, userID }) { 
        return new Promise(async (resolve) => {
            try {
                let dataInsert = { };

                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(!checkObjectIDs(inspectionID))
                    return resolve({ error: true, message: 'Request params inspectionID invalid', status: 400 });
                    
                if (!name || name == '')
                    return resolve({ error: true, message: 'Request params name invalid', status: 400 });

                dataInsert = {
                    inspection: inspectionID, name, userCreate: userID, userUpdate: userID
                };

                if (!description || description == ''){
                    dataInsert.description = description
                }

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
     * Name: Cập nhật trạng thái checklist  
     * Author: DePV
     * Code: F02402
     */
    update({ checklistID, name, description, status, userID }) { 
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

                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                dataUpdate = {
                    userUpdate: userID, modifyAt: new Date()
                };

                if (!name || name == ''){
                    dataUpdate.name = name
                }

                if (!description || description == ''){
                    dataUpdate.description = description
                }

                if(!isNaN(status) && status == 2){
                    dataUpdate.status = status
                    dataUpdate.approver = userID
                    dataUpdate.timeApproved = new Date()
                }

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
     * Name: Lấy thông tin checklist  
     * Author: DePV
     * Code: F02403
     */
    getInfo({ checklistID }) { 
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(checklistID))
                    return resolve({ error: true, message: 'Request params checklistID invalid', status: 400 });

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
     * Name: Lấy danh sách checklist 
     * Author: DePV
     * Code: F02404
     */
    getList({ inspectionID, keyword, limit = 10, lastestID, select, populates, sortKey, userID }) { 
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = {inspection: inspectionID}
                let sortBy;
                let keys	 = ['modifyAt__-1'];

                // Làm rõ mục đích để làm gì?
                if (sortKey && typeof sortKey === 'string') {
                    if (!IsJsonString(sortKey))
                        return resolve({ error: true, message: 'Request params sortKey invalid', status: 400 });

                    keys = JSON.parse(sortKey);
                }
                console.log(conditionObj)

                /**
                 * ĐIỀU KIỆN KHÁC
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

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    const regSearch = new RegExp(keyword, 'i');

                    conditionObj.$or = [
                        { name: regSearch },
                        { sign: regSearch },
                    ]
                }

                if(select && typeof select === 'string'){
                    if(!IsJsonString(select))
                        return resolve({ error: true, message: 'Request params select invalid', status: 400 });

                    select = JSON.parse(select);
                }
 
                let conditionObjOrg = { ...conditionObj };
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoData = await INSPECTION__CHECKLIST_COLL.findById(lastestID);
                    if(!infoData)
                        return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj  = dataPagingAndSort.data.find;
                    sortBy        = dataPagingAndSort.data.sort;
                }else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy                = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await INSPECTION__CHECKLIST_COLL.find(conditionObj)
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
                        nextCursor = infoDataAfterGet[limit - 1]?._id;
                        infoDataAfterGet.length = limit;
                    }
                }
                let totalRecord = await INSPECTION__CHECKLIST_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: limit,
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