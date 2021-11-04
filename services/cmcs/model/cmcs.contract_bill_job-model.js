"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * import inter-coll, exter-coll
 */
const CMCS__CONTRACT_BILL_JOB_COLL           = require('../database/cmcs.contract_bill_job-coll');
const { RANGE_BASE_PAGINATION } 		     = require('../../../tools/cursor_base/playground/index');

/**
 * import inter-model, exter-model
 */

/**
 * import util files
 */

class Model extends BaseModel {

    constructor() {
        super(CMCS__CONTRACT_BILL_JOB_COLL);
    }

    /**
     * Name: Lấy thông tin contract bill job ✅
     * Author: Depv 
     */
    getInfo({ contractBillJobID, select }) { 
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
                if(!checkObjectIDs(contractBillJobID))
                    return resolve({ error: true, message: 'Request params contractBillJobID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */

                let infoContractBillJobID = await CMCS__CONTRACT_BILL_JOB_COLL.findById(contractBillJobID).select(select)

                if(!infoContractBillJobID)
                    return resolve({ error: true, message: "Can't get infoContractBillJob", status: 403 });

                return resolve({ error: false, data: infoContractBillJobID, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Danh sách contract bill job
     * Author: Depv 
     */
    getList({ keyword, limit = 10, lastestID, contractID, filter = {}, select = {} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {};
                if(checkObjectIDs(contractID)){
                    conditionObj.contract = contractID;
                }

                let conditionFind = {};
                let sortBy = { createAt: -1 };
				let objSort 	 	= {};

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
					let infoContractBillJob = await CMCS__CONTRACT_BILL_JOB_COLL.findById(lastestID);
					if(!infoContractBillJob)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

					let nextInfo = `${infoContractBillJob.createAt}_${infoContractBillJob._id}`;
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
				if(keyword){
					conditionObj.$text = { $search: keyword };
					objSort.score = { $meta: "textScore" };
					sortBy.score  = { $meta: "textScore" };
				}

                let infoDataAfterGet = await CMCS__CONTRACT_BILL_JOB_COLL.find({...conditionObj, ...conditionFind }, { ...filter, ...objSort })
                    .populate({
                        path: "contract",
                        select: select.contract
                    })
                    .limit(+limit+1)
                    .sort(sortBy) 
                    .lean(); 

                // GET TOTAL RECORD
				// let totalRecord = await CMCS__CONTRACT_BILL_JOB_COLL.count(conditionObj);
                let totalCurrentPage = await CMCS__CONTRACT_BILL_JOB_COLL.count(conditionFind);
                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get template docs", status: 403 });
                

                let totalRecord = await CMCS__CONTRACT_BILL_JOB_COLL.countDocuments(conditionObj);
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
                    currentPage =  1
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