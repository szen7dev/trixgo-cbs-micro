"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString, objectID }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const moment                            = require("moment");

const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const ObjectID                          = require('mongoose').Types.ObjectId;


/**s
 * import inter-coll, exter-coll
 */
const AUTH__REGISTER_TRIAL_COLL             = require('../database/auth.register_trial-coll');
const { RANGE_BASE_PAGINATION } 	        = require('../../../tools/cursor_base/playground/index');
const { template }                          = require('lodash');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {               

    constructor() {
        super(AUTH__REGISTER_TRIAL_COLL);
    }

    /**
     * Name: insert register trial ✅
     * Author: Depv
     * Code: 
     */
    insert({ fullname, organization, type , email, phone, note }) { 
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
                if(!fullname)
                    return resolve({ error: true, message: 'Request params fullname invalid', status: 400 });

                if(!checkObjectIDs(organization))
                    return resolve({ error: true, message: 'Request params organization invalid', status: 400 });

                if(!type)
                    return resolve({ error: true, message: 'Request params type invalid', status: 400 });

                if(!email)
                    return resolve({ error: true, message: 'Request params email invalid', status: 400 });

                if(!phone)
                    return resolve({ error: true, message: 'Request params email invalid', status: 400 });
                
                let checkExist = await AUTH__REGISTER_TRIAL_COLL.findOne({
                    $or: [
                        { email }, 
                        { phone }
                    ]
                });
                if(checkExist)
                    return resolve({ error: true, message: 'phone_or_email_existed', status: 400 });

                dataInsert = { fullname, organization, type, email, phone, note }
                    
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                
                let infoAterInsert = await this.insertData(dataInsert);
                if(!infoAterInsert)
                    return resolve({ error: true, message: "can't_insert", status: 403 });
 
                return resolve({ error: false, data: infoAterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: update register trial ✅
     * Author: Depv
     * Code: 
     */
    update({ registerTrialID, fullname, organization, type , email, phone, note, userID }) { 
        return new Promise(async (resolve) => {
            try {
                
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID };
                
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(!checkObjectIDs(registerTrialID))
                    return resolve({ error: true, message: 'Request params registerTrialID invalid', status: 400 });

                if(fullname){
                    dataUpdate.fullname = fullname;
                }

                if(organization){
                    dataUpdate.organization = organization;
                }

                if(type){
                    dataUpdate.type = type;
                }

                if(email){
                    dataUpdate.email = email;
                }

                if(phone){
                    dataUpdate.phone = phone;
                }

                if(note){
                    dataUpdate.note = note;
                }

                let checkExist = await AUTH__REGISTER_TRIAL_COLL.findOne({
                    $or: [
                        { email }, 
                        { phone }
                    ],
                    _id: { $ne: registerTrialID }
                });
                if(checkExist)
                    return resolve({ error: true, message: 'phone_or_email_existed', status: 400 });
                    
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                
                let infoAterUpdate = await AUTH__REGISTER_TRIAL_COLL.findByIdAndUpdate(registerTrialID, dataUpdate, { new: true });
                if(!infoAterUpdate)
                    return resolve({ error: true, message: "can't_insert", status: 403 });
 
                return resolve({ error: false, data: infoAterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Remove register trial ✅
     * Author: Depv
     * Code: 
     */
    remove({ registerTrialID }) { 
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
                if(!checkObjectIDs(registerTrialID))
                    return resolve({ error: true, message: 'Request params registerTrialID invalid', status: 400 });
                    
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                let infoAterRemove = await AUTH__REGISTER_TRIAL_COLL.findByIdAndDelete(registerTrialID);
                if(!infoAterRemove)
                    return resolve({ error: true, message: "can't_remove", status: 403 });
 
                return resolve({ error: false, data: infoAterRemove, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: get register trial ✅
     * Author: Depv
     * Code: 
     */
    getInfo({ registerTrialID, select }) { 
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
                if(!checkObjectIDs(registerTrialID))
                    return resolve({ error: true, message: 'Request params registerTrialID invalid', status: 400 });
                    
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                let infoAterRemove = await AUTH__REGISTER_TRIAL_COLL.findById(registerTrialID).select(select);
                if(!infoAterRemove)
                    return resolve({ error: true, message: "can't_remove", status: 403 });
 
                return resolve({ error: false, data: infoAterRemove, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Danh sách register trial✅
     * Author: Depv
     * Code  : 
     */
    getList({ type,
        keyword, limit = 10, lastestID, filter = {} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { 
                    // state: 1,
                };

                let conditionFind = { };
                let sortBy   = { createAt: -1 };
				let objSort  = {};
              
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                if(type){
                    conditionObj.type = type;
                }

                // LẤY NHỮNG TRƯỜNG CẦN THIẾT
                if(filter && typeof filter === 'string'){
					if(!IsJsonString(filter))
						return resolve({ error: true, message: 'Request params filter invalid', status: 400 });

					filter = JSON.parse(filter);
				}
               
                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  

                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await AUTH__REGISTER_TRIAL_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

					let nextInfo = `${infoData.createAt}_${infoData._id}`;
                    // Lưu ý nêu sắp xếp tăng dần thì sửa lại ['createAt__1', '_id__1'];
					let keys	 = ['createAt__-1', '_id__-1'];
					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });
					conditionFind = dataPagingAndSort.data.find;
					sortBy = dataPagingAndSort.data.sort;
				}

				if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.$or = [
                        { fullname : new RegExp(keyword, 'i') },
                        { phone: new RegExp(keyword, 'i') },
                        { email: new RegExp(keyword, 'i') },
                    ];
                }
                
                let infoDataAfterGet = await AUTH__REGISTER_TRIAL_COLL.find({...conditionObj, ...conditionFind }, { ...filter, ...objSort })
                    .limit(+limit+1)
                    .sort(sortBy)
                    .lean(); 

                  // GET TOTAL RECORD
                let totalCurrentPage = await AUTH__REGISTER_TRIAL_COLL.count(conditionFind);
                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });
                    
                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await AUTH__REGISTER_TRIAL_COLL.countDocuments(conditionObj);
                let totalPage = Math.ceil(totalRecord/limit);

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

    /**
     * Name  : Thống kê theo type
     * Author: Depv
     * Code  :
     */
    statisticsByType({ fromDate, toDate }){
        return new Promise(async resolve => { 
            try {
                if(!fromDate || !toDate)
                    return resolve({ error: true, message: "Request params fromDate or toDate invalid" });

                let infoData = await AUTH__REGISTER_TRIAL_COLL.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: new Date(fromDate), $lt: moment(toDate, 'YYYY-MM-DD').endOf('day')._d }
                        }
                    },
                    {
                        $group: {
                            _id: { 
                                type:  "$type"
                            }, 
                            amount: { $sum: 1 },
                        } 
                    },
                    {
                        $sort: {
                            "_id.type": 1
                        } 
                    },
                ])
                return resolve({ error: false, data: infoData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
	 * Dev: Depv
	 * Func: Thống kê theo năm
	 * Date: 13/12/2021
	 */
    statisticsByYear({ year }){
        return new Promise(async resolve => { 
            try {
                if(!year || isNaN(year))
                    return resolve({ error: true, message: "Request params year invalid" });

                let infoData = await AUTH__REGISTER_TRIAL_COLL.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year}-12-31`) }
                        }
                    },
                    { 
                        $group: {
                            _id: { 
                                month: { $month: "$createdAt" },
                            }, 
                            amount: { $sum: 1 },
                        } 
                    },
                    {
                        $sort: {
                            "_id.month": 1
                        } 
                    },
                ])

            return resolve({ error: false, data: infoData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
	 * Dev: Depv
	 * Func: Thống kê theo công ty
	 * Date: 13/12/2021
	 */
    statisticsByCompany({ fromDate, toDate }){
        return new Promise(async resolve => { 
            try {
                if(!fromDate || !toDate)
                    return resolve({ error: true, message: "Request params fromDate or toDate invalid" });

                let infoData = await AUTH__REGISTER_TRIAL_COLL.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: new Date(fromDate), $lt: moment(toDate, 'YYYY-MM-DD').endOf('day')._d }
                        }
                    },
                    { 
                        $group: {
                            _id: { 
                                company:  "$organization",
                            }, 
                            amount: { $sum: 1 },
                          } 
                    },
                    { 
                        $lookup: {
                            from: "companies",
                            localField:"_id.company",
                            foreignField: "_id",
                            as: "company"
                        } 
                    },
                    {
                        $unwind: "$company"
                    },
                    {
                        $project: {
                            "company.name": 1,
                            "amount": 1,
                            _id: 0
                            
                        }
                    }
                ])
            return resolve({ error: false, data: infoData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

}

exports.MODEL = new Model;