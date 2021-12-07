"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * import inter-coll, exter-coll
 */
const ITEM__DEPARTMENT_COLL                 = require('../database/item.department-coll');
const { RANGE_BASE_PAGINATION } 		    = require('../../../tools/cursor_base/playground/index');

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */

class Model extends BaseModel {

    constructor() {
        super(ITEM__DEPARTMENT_COLL);
    }

    /**
     * Name: Lấy thông tin department ✅
     * Author: Depv
     * Code: F00401
     */
    getInfo({ departmentID, select, populates={}, populates1= {}, populates2={}, populates3 = {} }) {
        return new Promise(async (resolve) => {
            try {

                /**
                 * DECALARTION VARIABLE (1)
                 */

                // populate
                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				}
                // populate cấp 1
                if(populates1 && typeof populates1 === 'string'){
					if(!IsJsonString(populates1))
						return resolve({ error: true, message: 'Request params populates1 invalid', status: 400 });

					populates1 = JSON.parse(populates1);
				}

                // populate cấp 2
                if(populates2 && typeof populates2 === 'string'){
					if(!IsJsonString(populates2))
						return resolve({ error: true, message: 'Request params populates2 invalid', status: 400 });

					populates2 = JSON.parse(populates2);
				}

                // populate cấp 3
                if(populates3 && typeof populates3 === 'string'){
					if(!IsJsonString(populates3))
						return resolve({ error: true, message: 'Request params populates3 invalid', status: 400 });

					populates3 = JSON.parse(populates3);
				}

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(departmentID))
                    return resolve({ error: true, message: 'Request params departmentID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */

                let infoDepartment = await ITEM__DEPARTMENT_COLL.findById(departmentID).select(select)
                .populate({
                    path: populates.value || "",
                    select: populates.select || "",
                    populate: {
                        path: populates1.value || "",
                        select: populates1.select || "",
                        populate: {
                            path: populates2.value || "",
                            select: populates2.select || "",
                            populate: {
                                path: populates3.value || "",
                                select: populates3.select || "",
                            }
                        }
                    }
                })

                if(!infoDepartment)
                    return resolve({ error: true, message: "Can't get department", status: 403 });

                return resolve({ error: false, data: infoDepartment, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Danh sách dự án mà user được quyền truy cập (là member)
     * Author: DePV ✅
     * Code  : F00402
     */
    getList({ companyID, keyword, type, userID, limit = 10, lastestID, filter = {}, select = {}, populates={}, populates1= {}, populates2={}, populates3 = {} }) { 
        return new Promise(async (resolve) => {
            try {
                if(companyID && !checkObjectIDs(companyID))
                    return resolve({ error: true, message: 'Request params companyID invalid', status: 400 });

                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                // populate
                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				}
                // populate cấp 1
                if(populates1 && typeof populates1 === 'string'){
					if(!IsJsonString(populates1))
						return resolve({ error: true, message: 'Request params populates1 invalid', status: 400 });

					populates1 = JSON.parse(populates1);
				}

                // populate cấp 2
                if(populates2 && typeof populates2 === 'string'){
					if(!IsJsonString(populates2))
						return resolve({ error: true, message: 'Request params populates2 invalid', status: 400 });

					populates2 = JSON.parse(populates2);
				}

                // populate cấp 3
                if(populates3 && typeof populates3 === 'string'){
					if(!IsJsonString(populates3))
						return resolve({ error: true, message: 'Request params populates3 invalid', status: 400 });

					populates3 = JSON.parse(populates3);
				}


                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { 
                    members: { $in: [userID]}, 
                };

                companyID && (conditionObj.company = companyID);
 
                if(type){
                    conditionObj.type = type;
                }

                let conditionFind = {};
                let sortBy        = { createAt: -1 };
				let objSort 	  = {};

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
					let infoData = await ITEM__DEPARTMENT_COLL.findById(lastestID);
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
				}

                // SEARCH TEXT
				// if(keyword){
				// 	conditionObj.$text = { $search: keyword };
				// 	objSort.score = { $meta: "textScore" };
				// 	sortBy.score  = { $meta: "textScore" };
				// }  

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }

                let infoDataAfterGet = await ITEM__DEPARTMENT_COLL
                    .find({ ...conditionObj, ...conditionFind }, { ...filter, ...objSort })
                    .limit(+limit+1)
                    .sort(sortBy) 
                    .populate({
                        path: populates.value || "",
                        select: populates.select || "",
                        populate: {
                            path: populates1.value || "",
                            select: populates1.select || "",
                            populate: {
                                path: populates2.value || "",
                                select: populates2.select || "",
                                populate: {
                                    path: populates3.value || "",
                                    select: populates3.select || "",
                                }
                            }
                        }
                    })
                    .lean(); 

                // GET TOTAL RECORD
                let totalCurrentPage = await ITEM__DEPARTMENT_COLL.countDocuments(conditionFind);
                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get department", status: 403 });
                
                let totalRecord = await ITEM__DEPARTMENT_COLL.countDocuments(conditionObj);
				let nextCursor	= null;
                let totalPage = Math.ceil(totalRecord/limit);

				if(infoDataAfterGet && infoDataAfterGet.length){
					if(infoDataAfterGet.length > limit){
						nextCursor = infoDataAfterGet[limit - 1]._id;
						infoDataAfterGet.length = limit;
					}
				}

                let currentPage = getCurrentPage({ totalRecord, totalCurrentPage, limit }) + 1;
                if(!lastestID){
                    currentPage = 1;
                }

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: +limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                    currentPage
                }, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
 }

exports.MODEL = new Model;
