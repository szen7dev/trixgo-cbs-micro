"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const ObjectID                          = require('mongoose').Types.ObjectId;
const moment                            = require('moment')

/**
 * DOMAIN AND ACTIONS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
// const { CF_ACTIONS_ITEM } 		        = require('../helper/item.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * COLLECTIONS
 */
const ANALYSIS__HISTORY_TRAFFIC_COLL    = require('../database/analysis.history_traffic-coll');

class Model extends BaseModel {

    constructor() {
        super(ANALYSIS__HISTORY_TRAFFIC_COLL);
    }

	/**
	 * Dev: Depv
	 * Func: Tạo history traffic
	 * Date: 13/12/2021
	 */
	insert({ appID, menuID, type, companyOfAuthor, userCreate}){
        return new Promise(async resolve => { 
            try {
                let dataInsert = { companyOfAuthor, userCreate}; 
                
                if(!checkObjectIDs(appID))
                    return resolve({ error: true, message: "Request params appID invalid" });

                if(!checkObjectIDs(menuID))
                    return resolve({ error: true, message: "Request params menuID invalid" });

                dataInsert.app = appID;
                dataInsert.menu = menuID;

                if(type){
                    dataInsert.type = type;
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
	 * Func: Thống kê thiết bị truy cập theo năm
	 * Date: 13/12/2021
	 */
    statisticsDeviceAccessByYear({ year }){
        return new Promise(async resolve => { 
            try {
                if(!year || isNaN(year))
                    return resolve({ error: true, message: "Request params year invalid" });

                let infoData = await ANALYSIS__HISTORY_TRAFFIC_COLL.aggregate([
                    {
                        $match: {
                            createAt: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year}-12-31`) }
                        }
                    },
                    { 
                        $group: {
                            _id: { 
                                month: { $month: "$createAt" },
                                type:  "$type"
                            }, 
                            amountAccesses: { $sum: 1 },
                        } 
                    },
                    {
                        $sort: { "_id.type": 1 }
                    },
                    {
                    $group: {
                            _id: { 
                              month:  "$_id.month",
                            },
                            data: { 
                                $push:  { type: "$_id.type", amountAccesses: "$amountAccesses" },
                            },
                        }
                    },
                    {
                        $sort: { "_id.month": 1 }
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
	 * Func: Thống kê thiết bị truy cập
	 * Date: 13/12/2021
	 */
    statisticsByDeviceAccess({ fromDate, toDate }){
        return new Promise(async resolve => { 
            try {
                if(!fromDate || !toDate)
                    return resolve({ error: true, message: "Request params fromDate or toDate invalid" });

                let infoData = await ANALYSIS__HISTORY_TRAFFIC_COLL.aggregate([
                    {
                        $match: {
                            createAt: { $gte: new Date(fromDate), $lt: moment(toDate, 'YYYY-MM-DD').endOf('day')._d }
                        }
                    },
                    {
                        $group: {
                            _id: { 
                                type:  "$type"
                            }, 
                            amountAccesses: { $sum: 1 },
                        } 
                    },
                    {
                        $sort: { "_id.type": 1 }
                    }
                ])
            return resolve({ error: false, data: infoData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
	 * Dev: Depv
	 * Func: Thống kê truy cập theo app
	 * Date: 13/12/2021
	 */
    statisticsAccessByApp({ fromDate, toDate }){
        return new Promise(async resolve => { 
            try {
                if(!fromDate || !toDate)
                    return resolve({ error: true, message: "Request params fromDate or toDate invalid" });
                let infoData = await ANALYSIS__HISTORY_TRAFFIC_COLL.aggregate([
                    {
                        $match: {
                            createAt: { $gte: new Date(fromDate), $lt: moment(toDate, 'YYYY-MM-DD').endOf('day')._d }
                        }
                    },
                    { 
                        $group: {
                            _id: { 
                                app:  "$app"
                            }, 
                            amountAccesses: { $sum: 1 },
                        }
                    },
                    { 
                        $sort: {
                            "_id.app": -1
                        }
                    },
                ])

                await ANALYSIS__HISTORY_TRAFFIC_COLL.populate(infoData, {  
                    path: '_id.app',
                    select: 'name',
                    model: 'app' 
                })
                
            return resolve({ error: false, data: infoData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
	 * Dev: Depv
	 * Func: Thống kê truy cập theo app và thiết bị
	 * Date: 13/12/2021
	 */
    statisticsAccessByAppAndDeveice({ fromDate, toDate }){
        return new Promise(async resolve => { 
            try {
                if(!fromDate || !toDate)
                    return resolve({ error: true, message: "Request params fromDate or toDate invalid" });

                let infoData = await ANALYSIS__HISTORY_TRAFFIC_COLL.aggregate([
                    {
                        $match: {
                            createAt: { $gte: new Date(fromDate), $lt: moment(toDate, 'YYYY-MM-DD').endOf('day')._d }
                        }
                    },
                    { 
                        $group: {
                            _id: { 
                                app:  "$app",
                                type: "$type"
                            }, 
                            amountAccesses: { $sum: 1 },
                        } 
                    },
                    { 
                        $group: {
                            _id: { 
                                app: "$_id.app",
                            }, 
                            data: { $push:  { type: "$_id.type", amountAccesses: "$amountAccesses" } }
                        } 
                    },
                    {
                        $sort: { "_id.app": 1 }
                    },
                ])
                await ANALYSIS__HISTORY_TRAFFIC_COLL.populate(infoData, {  
                    path: '_id.app',
                    select: 'name',
                    model: 'app' 
                })
                return resolve({ error: false, data: infoData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name  : Danh sách history traffic 
     * Author: Depv
     * Code  : 
     */
    getList({
        companyID, type, app, menu, fromDate, toDate, userID,
        keyword, limit = 10, lastestID, select, populates= {} }) { 
        return new Promise(async (resolve) => {
            try {

                if(limit > 20 || isNaN(limit)){
                    limit = 20;
                } else{
                    limit = +limit;
                }

                /**
                 * DECALARTION VARIABLE (1)
                 */
                let sortBy;
                let conditionObj = { company: companyID };
                let keys	 = ['createAt__-1', '_id__-1'];
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
                
				if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }
                if(companyID){
                    conditionObj.companyOfAuthor = companyID
                }

                if(type){
                    conditionObj.type = type
                }

                if(app){
                    conditionObj.app = app
                }

                if(menu){
                    conditionObj.menu = menu
                }

                if(fromDate && toDate){
                    conditionObj.createAt = { $gte: new Date(fromDate), $lt: moment(toDate, 'YYYY-MM-DD').endOf('day')._d }
                }

                if(checkObjectIDs(userID)){
                    conditionObj.userCreate = userID;
                }

                let conditionObjOrg = { ...conditionObj };
                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await ANALYSIS__HISTORY_TRAFFIC_COLL.findById(lastestID);
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
                
                let infoDataAfterGet = await ANALYSIS__HISTORY_TRAFFIC_COLL
                    .find(conditionObj)
                    .select(select)
                    .limit(limit+1)
                    .sort(sortBy)
                    .populate(populates)
                    .lean(); 

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await ANALYSIS__HISTORY_TRAFFIC_COLL.countDocuments(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

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

    /**
	 * Dev: Depv
	 * Func: Thống kê truy cập theo công ty
	 * Date: 13/12/2021
	 */
    statisticsAccessByCompany({ fromDate, toDate }){
        return new Promise(async resolve => { 
            try {
                if(!fromDate || !toDate)
                    return resolve({ error: true, message: "Request params fromDate or toDate invalid" });

                let infoData = await ANALYSIS__HISTORY_TRAFFIC_COLL.aggregate([
                    {
                        $match: {
                            createAt: { $gte: new Date(fromDate), $lt: moment(toDate, 'YYYY-MM-DD').endOf('day')._d }
                        }
                    },
                    { 
                        $group: {
                            _id: { 
                                  company:  "$companyOfAuthor",
                            }, 
                            amountAccesses: { $sum: 1 },
                        } 
                    },
                    { 
                        $sort: {
                            "amountAccesses": -1
                        } 
                    },
                ])
                await ANALYSIS__HISTORY_TRAFFIC_COLL.populate(infoData, {  
                    path: '_id.company',
                    select: 'name',
                    model: 'company' 
                })
            return resolve({ error: false, data: infoData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}

exports.MODEL = new Model;
