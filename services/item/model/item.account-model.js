"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const { _isValid, _getLevelMaxInRecursive, _constructForAny, _getLevelMaxInRecursiveByCompany }  = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const ObjectID                          = require('mongoose').Types.ObjectId;

/**
 * CONSTANTS
*/
const PERPAGE_CORE              = 20;

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 					= require('../../../tools/cursor_base/playground/index');


/**
 * COLLECTIONS
*/
const ITEM__ACCOUNT_COLL = require('../database/item.account-coll');

class Model extends BaseModel {

    constructor() {
        super(ITEM__ACCOUNT_COLL)
    }

    insert({ name, description, company, authorID, parent }) {
        return new Promise(async resolve => {
            try {
                if(!name || !ObjectID.isValid(company) || !ObjectID.isValid(authorID))
                    return resolve({ error: true, message: 'param_not_valid' });

                let checkName = await ITEM__ACCOUNT_COLL.findOne({ company, name });
                if(checkName)
                    return resolve({ error: true, message: "name_existed" });

                let dataInsert = {
                    name: name, description, company,
                }

                if(parent && ObjectID.isValid(parent)){
                    dataInsert.parent = parent;
                    let infoMenuParent = await ITEM__ACCOUNT_COLL.findById(parent);
                    dataInsert.level = infoMenuParent.level + 1;
                }

                let infoAfterInsert = await this.insertData(dataInsert, authorID);
                // console.log('===================heertretretre')
                if(parent) {
                    await ITEM__ACCOUNT_COLL.findByIdAndUpdate(parent, {
                            $addToSet: { childs: infoAfterInsert._id } 
                    }, { new: true });
                }
                
                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }


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
     * Name: Danh sách tài  khoản kế toán cha
     * Author: Depv(01/12/2020)
     */
    getListByCompanyParent({ companyID, page = 1 }){
        return new Promise(async (resolve) => {
            try {
                //Số lượng phần tử trong 1 page
                let limit = 50;
                if( !ObjectID.isValid(companyID))
                    return resolve({ error: true, message: 'param_not_valid' });
             
                // Lấy các tài khoản cha (có parent = null hoặc không tồn tại)
                let listAppMenuParent = await ITEM__ACCOUNT_COLL.find({ company: companyID,   
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
                })
                .sort({name: 1})
                .limit(limit * 1)
                .skip((page - 1) * limit);

                const count = await ITEM__ACCOUNT_COLL.count({ 
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
                });

                return resolve({ error: false, data: listAppMenuParent, totalPages: Math.ceil(count / limit), currentPage: +page  });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    getInfoAccount({ accountID }) {
        return new Promise(async resolve => {
            try {
                let infoAccount = await ITEM__ACCOUNT_COLL.findById(accountID)

                if (!infoAccount) return resolve({ error: true, message: 'cannot_get_info_account' });

                return resolve({ error: false, data: infoAccount });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name:   Tìm kiếm thông tin account theo tên, description 
     * Author: Sonlp(30/11/2020)
     * 
     */
    searchAccount({ key, companyID }){
        return new Promise(async (resolve) => {
            try {
                let resultSreach = await ITEM__ACCOUNT_COLL.find({
                    company: companyID, 
                    $or: [
                        { name:        new RegExp(key, 'i')  },
                        { description: new RegExp(key, 'i')  },
                    ]
                })

                return resolve({ error: false, data: resultSreach });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    /**
     * Lấy thông tin account sử dụng đệ qui
     * Author: Sonlp(27/11/2020)
     * 
     */
    getInfoAccountToChild({ accountID, companyID }) {
        return new Promise(async resolve => {
            try {
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
                    [   {
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
                )

                let infoAccount = await ITEM__ACCOUNT_COLL.find({ parent: accountID })
                .populate(
                    constructPopulateConfigObj(Number(levelMax[0].maxLevel), 'childs')
                );

                if (!infoAccount) return resolve({ error: true, message: 'cannot_get_info_account' });

                return resolve({ error: false, data: infoAccount });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
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

    remove({ accountID }) {
        return new Promise(async resolve => {
            try {
                // Lấy thông tin và các con
                let constructForAny = (level, path) => {
                    const oneLevel = () => ({ path });
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
                        $group:
                          {
                            _id: null,
                            maxLevel: { $max: "$level" }
                          }
                      }
                    ]
                );

                let levelForRecursive = Number(levelMax[0].maxLevel);

                let arrObjectID = [];
                
                let getListIDRecursiveForAny = (arr, level) => {
                    let arrForRun = arr;
                
                    arrObjectID = [...arrForRun];
                
                    while(level > 0) {
                        arrForRun.forEach(item => {
                            if (item.childs.length) {
                                arrObjectID = [...arrObjectID, ...item.childs];
                                arrForRun = item.childs;
                            }
                        })
                        --level;
                    }
                }
               
                let infoAccountOrigin = await ITEM__ACCOUNT_COLL.findById(accountID)
                    .populate(
                        constructForAny(levelForRecursive, 'childs')
                    )

                getListIDRecursiveForAny([infoAccountOrigin], levelForRecursive);

                if (!arrObjectID) return resolve({ error: true, message: 'cannot_get_list' });
                console.log(arrObjectID)

                await ITEM__ACCOUNT_COLL.deleteMany({
                    _id: {
                        $in: arrObjectID.map(item => ObjectID(item._id)),
                    }
                });

                return resolve({ error: false, message: 'successful'});
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
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
                    keyword = '.*' + keyword.join(".*") + '.*';
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


    /**
     * Tìm kiếm
     * Hiepnh [x]
     */
    getList({ companyID, key, limit = PERPAGE_CORE, lastestID }) {
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
                    keyword = '.*' + keyword.join(".*") + '.*';
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
    
}

exports.MODEL = new Model;