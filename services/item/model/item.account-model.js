"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString, _getLevelMaxInRecursive, _constructForAny, _getLevelMaxInRecursiveByCompany }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const ObjectID                          = require('mongoose').Types.ObjectId;

/**
 * DOMAIN AND ACTIONS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../helper/item.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * COLLECTIONS
 */
const ITEM__ACCOUNT_COLL            				= require('../database/item.account-coll');

class Model extends BaseModel {

    constructor() {
        super(ITEM__ACCOUNT_COLL);
    }

    /**
     * Name: get info account ✅
     * Author: vinh
     * Xoá nhớ báo Vinh vì có thể liên quan đến accouting
     * Code: 
     */
    getInfo({ accountID, select, populates }) { 
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
                if(!checkObjectIDs(accountID))
                    return resolve({ error: true, message: 'Request params accountID invalid', status: 400 });
                
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
                let infoAterGet = await ITEM__ACCOUNT_COLL.findById(accountID)
                                    .select(select)
                                    .populate(populates)
                if(!infoAterGet)
                    return resolve({ error: true, message: "can't_get_info", status: 403 });
 
                return resolve({ error: false, data: infoAterGet, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    
    /**
     * Name  : Danh sách account ✅
     * Author: Depv
     * Code  : 
     */
    getList({
        companyID,
        keyword, limit = 10, lastestID, select, populates= {} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let sortBy;
                let conditionObj = { };
                let keys	 = ['createAt__-1', '_id__-1'];

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

                if(companyID && checkObjectIDs(companyID)){
                    conditionObj.company = companyID;
                }
                
                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }
                
                let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await ITEM__ACCOUNT_COLL.findById(lastestID);
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
                
                let infoDataAfterGet = await ITEM__ACCOUNT_COLL.find(conditionObj)
                    .select(select)
                    .limit(+limit+1)
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

                let totalRecord = await ITEM__ACCOUNT_COLL.countDocuments(conditionObjOrg);
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
     * Name: get info account ✅
     * Author: vinh
     * Xoá nhớ báo Vinh vì có thể liên quan đến accouting
     * Code: 
     */

    //_________Danh sách đệ quy
    getListByCompany({ companyID, status, showInReportMonth }){
        return new Promise(async (resolve) => {
            try {
                if( !ObjectID.isValid(companyID))
                       return resolve({ error: true, message: 'param_not_valid' });

                let pathOrigin;
                let constructPopulateConfigObj = (level, path) => {
                    pathOrigin  = `${path}`;
                    const oneLevel = () => ({ 
                        path: pathOrigin, options: { sort: { 'name': 1 } }, 
                    });
                    let obj = oneLevel();

                    while (level) {
                        if (level !== 1) {
                            obj.populate = Object.assign({}, obj);
                        }
                        obj = Object.assign({}, obj);
                        --level;
                    }
                    
                    return obj;
                };

                let levelMax = await ITEM__ACCOUNT_COLL.aggregate(
                    [
                        {
                            $match: {
                                company: ObjectID(companyID)
                            }
                        },
                        {
                            $group:
                            {
                                _id: null,
                                maxLevel: { $max: "$level" }
                            }
                        }
                    ]
                );
                let ObjectQuery = { 
                    company: companyID,   
                    $or: [
                        {
                            parent: {
                                $exists: false
                            }  
                        },
                        {
                            parent: null
                        }
                    ]
                }
                
                if(status){
                    ObjectQuery.status  = 1
                }

                if(showInReportMonth){
                    ObjectQuery.showInReportMonth  = 1
                }
                // Lấy các tài khoản cha (có parent = null hoặc không tồn tại)
                let listAppMenuParent = await ITEM__ACCOUNT_COLL.find(ObjectQuery)
                .populate(
                    constructPopulateConfigObj(Number(levelMax[0].maxLevel), 'childs')
                )
                .sort({name: 1})

                return resolve({ error: false, data: listAppMenuParent, maxLevel: Number(levelMax[0].maxLevel) });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

        /**
     * Tìm kiếm
     * Hiepnh [x]
     */
    getListWithKey({ companyID, key, limit = PERPAGE_CORE, lastestID }) {
        return new Promise(async resolve => {
            try {
                if(!limit){
                    limit = PERPAGE_CORE;
                }
                if(limit > PERPAGE_CORE){
                    limit = PERPAGE_CORE
                }

                if( !ObjectID.isValid(companyID))
                    return resolve({ error: true, message: 'param_not_valid' });
         
                let keyword;
                let conditionObj ={}
                if(key && key.length > 0){
                    keyword = key.split(" ");

                    conditionObj ={ 
                        $or: [
                            {name: new RegExp(keyword, 'i')},
                            {description: new RegExp(keyword, 'i')},
                        ]
                    }
                }
                conditionObj.company = companyID
                let latestRecord = null;
                if(lastestID && ObjectID(lastestID)){
                    const checkExitLastRecord = await ITEM__ACCOUNT_COLL.findById(lastestID);
                    if(!checkExitLastRecord)
                        return resolve({ error: true, message: "Can't get info lastestID", status: 400 });
                    
                    latestRecord = checkExitLastRecord;
                }
                const keys = ['createAt__-1', '_id__-1'];
                const resultPagination = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord, objectQuery: conditionObj })
                if(resultPagination.eror)
                    return resolve({ error: true, message: "cant_get_list_vat", status: 400 });
            
                const listAccount = await ITEM__ACCOUNT_COLL.find(resultPagination.data.find)
                .select('_id name description')
                .sort({_id: 'asc'})
                .limit(limit+1)
                .sort(resultPagination.data.sort);
    
                if (!listAccount)
                    return resolve({ error: true, message: 'cannot_get_data', status: 400 });

                const totalRecord = await ITEM__ACCOUNT_COLL.countDocuments(conditionObj);
                let nextCursor	= null;
                if(listAccount && listAccount.length){
                    if(listAccount.length > limit){
                        nextCursor = listAccount[limit - 1]._id;
                        listAccount.length = limit;
                    }

                }

                const totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ 
                    error: false,
                    data: {
                        listAccount,
                        nextCursor, 
                        limit: +limit || 0 ,      
                        totalRecord,
                        totalPage,
                    } 
                });
            } catch (error) {
                console.log(`[ITEM][ACCOUNT-MODEL][getListWithKey]${error.message}`);
                return resolve({ error: true, message: error.message, status: 400 });
            }
        });
    }   

    getInfoAccountWithName({ companyID, name }) {
        return new Promise(async resolve => {
            try {
                let infoAccount = await ITEM__ACCOUNT_COLL.findOne({ company: companyID, name }).lean();

                if (!infoAccount) return resolve({ error: true, message: 'cannot_get_info_account' });

                return resolve({ error: false, data: infoAccount });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
    //_________DANH SÁCH TÀI KHOẢN VÀ CON CHÁU CỦA NÓ
    // Author: HiepNH
    getListNestedItem({ accountID }) {
        return new Promise(async resolve => {
            try {
                let { company } = await ITEM__ACCOUNT_COLL.findById(accountID);
                //__________Lấy levelMax của các phần tử
                // let levelForRecursive = await _getLevelMaxInRecursive(ITEM__ACCOUNT_COLL);
                let levelForRecursive = await _getLevelMaxInRecursiveByCompany(ITEM__ACCOUNT_COLL , company);

                //__________Khai báo mảng chứa phần tử cha và các con
                let arrObjectID = [];
                let getListIDRecursiveForAny = (arr) => {
                    for(const item of arr){
                        arrObjectID.push(item._id)

                        if (Array.isArray(item.childs) && item.childs.length) {
                            getListIDRecursiveForAny(item.childs)
                        }
                    }
                }

                //__________Lấy thông tin phần tử kèm theo populate vào bên trong các phần tử con
                let infoItemOrigin = await ITEM__ACCOUNT_COLL.findById(accountID)
                    .populate(
                        _constructForAny(levelForRecursive, 'childs') 
                    )
                
                //__________Gọi hàm đệ quy để lấy mảng nestedArray
                getListIDRecursiveForAny([infoItemOrigin], levelForRecursive);

                if (!arrObjectID) 
                    return resolve({ error: true, message: 'cannot_get_list' });
                    
                return resolve({ error: false, data: arrObjectID });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    } 

    getInfoAccount({ accountID }) {
        return new Promise(async resolve => {
            try {
                let infoAccount = await ITEM__ACCOUNT_COLL.findById(accountID)

                if (!infoAccount) return resolve({ error: true, message: 'cannot_get_info_account' });

                return resolve({ error: false, data: infoAccount });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}
    

exports.MODEL = new Model;
