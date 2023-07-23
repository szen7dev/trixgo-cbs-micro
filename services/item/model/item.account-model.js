"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString, _isValid, checkNumberIsValidWithRange, checkNumberValid, _getLevelMaxInRecursive, _constructForAny, _getLevelMaxInRecursiveByCompany } = require('../../../tools/utils/utils');
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
     * Name: Insert ✅
	 * Author : Hiepnh
	 * Date: 03/5/2022
	 */
	insert({ companyID, parentID, name, description, userID }){
        return new Promise(async resolve => {
            try {
                if(!name || !checkObjectIDs(companyID) || !checkObjectIDs(userID))
                    return resolve({ error: true, message: "companyID|name|userID không hợp lệ", keyError: "Request params name invalid" });

                // Kiểm tra tên tồn tại trong công ty hay chưa
                let checkName = await ITEM__ACCOUNT_COLL.findOne({ company: companyID, name });
                if(checkName)
                    return resolve({ error: true, message: "name_existed" });

                let dataInsert = {
                    userCreate: userID,
                    company: companyID,
                    name: name.trim(),
                }

                /**
                 * PHẦN TỬ CHA
                 */
                let infoParent
                if(checkObjectIDs(parentID)){
                    dataInsert.parent = parentID
                    dataInsert.nestedParents = [parentID]

                    // Cập nhật Level để phục vụ việc tính toán, đệ quy
                    infoParent = await ITEM__ACCOUNT_COLL.findById(parentID)
                    dataInsert.level = infoParent.level + 1
                }

                if(description){
                    dataInsert.description = description;
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert" });

                // Cập nhật amountChilds cho phần tử cha
                if(checkObjectIDs(parentID)){

                    await ITEM__ACCOUNT_COLL.findByIdAndUpdate(parentID,
                        {
                            $addToSet: { 
                                childs: infoAfterInsert._id,
                                nestedChilds: infoAfterInsert._id, // Mảng các phần tử con/cháu...
                             },
                            $inc: { amountChilds: 1 }
                        },
                        { new: true })
                }

                /**
                 * CẬP NHẬT CÁC PHẦN TỬ CHA CẤP TRÊN
                 */
                if(checkObjectIDs(parentID)){
                    for(const item of infoParent?.nestedParents){
                        // Cập nhật cho các phần tử cha
                        await ITEM__ACCOUNT_COLL.findByIdAndUpdate(item,
                            {
                                $addToSet: { nestedChilds: infoAfterInsert._id },
                            },
                            { new: true })

                        // Cập nhật các cha cho chính phần tử này
                        await ITEM__ACCOUNT_COLL.findByIdAndUpdate(infoAfterInsert._id ,
                            {
                                $addToSet: { nestedParents: item },
                            },
                            { new: true })
                    }
                }


                return resolve({ error: false, data: infoAfterInsert });

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Update ✅
	 * Author : Hiepnh
	 * Date: 03/5/2022
	 */
	update({ accountID, name, description, userID }){
        return new Promise(async resolve => {
            try {
                if(!name || !checkObjectIDs(accountID))
                    return resolve({ error: true, message: "accountID|name không hợp lệ", keyError: "Request params accountID invalid" });

                // Kiểm tra xem tên có bị trùng hay không
                let info = await ITEM__ACCOUNT_COLL.findById(accountID);

                let checkName = await ITEM__ACCOUNT_COLL.findOne({
                    company: info.company,
                    name: name.trim(),
                    _id: {
                        $ne: accountID
                    }
                 });
                if(checkName)
                    return resolve({ error: true, message: "name_existed" });

                // Cập nhật thông tin nếu không trùng
                let dataUpdate = {
                    name: name.trim(),
                    userUpdate: userID,
                    modifyAt: new Date()
                }

                if(description){
                    dataUpdate.description = description;
                }

                let infoAfterUpdate = await ITEM__ACCOUNT_COLL.findByIdAndUpdate(accountID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "cannot_update" });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Get info ✅
	 * Author : Hiepnh
	 * Date: 03/5/2022
	 */
    getInfo({ accountID, select, populates }) {
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(accountID))
                    return resolve({ error: true, message: 'param_invalid' });

                if (populates && typeof populates === 'string') {
                    if (!IsJsonString(populates))
                        return resolve({ error: true, message: 'Request params populates invalid', status: 400 });
                    populates = JSON.parse(populates);
                } else {
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                let info = await ITEM__ACCOUNT_COLL.findById(accountID)
                    .select(select)
                    .populate(populates)

                if (!info) return resolve({ error: true, message: 'cannot_get' });

                return resolve({ error: false, data: info });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name  : Danh sách account
     * Author: Hiepnh
     * Code  : 24/7/2023
     */
    getList({
        companyID, parentID, isListParentOfListChilds,
        keyword, limit = 10, lastestID, select, populates= {},
        status, type, level, isAccountingService
    }) {
        return new Promise(async (resolve) => {
            try {
                if(limit > 20){
                    limit = 20
                }else{
                    limit = +limit;
                }
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

                    conditionObj.$or = [
                        { name: new RegExp(keyword, 'i') },
                        { description: new RegExp(keyword, 'i') }
                    ]
                }

                if(status){
                    conditionObj.status = status;
                }

                if(type){
                    conditionObj.type = type;
                }

                if(level){
                    conditionObj.level = level;
                }

                // Chỉ lấy danh sách cha hoặc con
                if(isListParentOfListChilds == 1){
                    if(parentID){
                        conditionObj.parent = parentID;
                    }else{
                        conditionObj.parent = { $exists: false };
                    }
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
                let infoDataAfterGet;
                // Accounting service : 1 số báo cáo cần  lấy hết account ra để tính toán
                // nên không limit
                if(isAccountingService){
                    infoDataAfterGet = await ITEM__ACCOUNT_COLL.find(conditionObj)
                    return resolve({ error: false, data: {
                        listRecords: infoDataAfterGet
                    }, status: 200 });
                }else{
                    infoDataAfterGet = await ITEM__ACCOUNT_COLL.find(conditionObj)
                        .select(select)
                        .limit(+limit+1)
                        .sort(sortBy)
                        .populate(populates)
                        .lean();
                }

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await ITEM__ACCOUNT_COLL.count(conditionObjOrg);
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
     * Name  : Lấy thông tin tài khoản theo tên
     * Author: Hiepnh
     * Code  : 24/7/2023
     */
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

    /**
     * Tìm kiếm ???
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

    // ???
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

    /**
     * Name : Danh sách tài khoản + con cháu của 1 tài khoản ✅
	 * Author : Hiepnh
	 * Date: 03/5/2022
	 */
    getListNestedItem({ accountID }) {
        return new Promise(async resolve => {
            try {
                let { company } = await ITEM__ACCOUNT_COLL.findById(accountID);

                //__________Lấy levelMax của các phần tử
                let levelForRecursive = await _getLevelMaxInRecursiveByCompany(ITEM__ACCOUNT_COLL , company);

                //__________Khai báo mảng chứa phần tử cha và các con
                let arrObjectID = [];
                let getListIDRecursiveForAny = (arr) => {
                    for(const item of arr) {
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
     * Name : Danh sách tài khoản + con cháu của công ty
	 * Author : Hiepnh
	 * Date: 03/5/2022
	 */
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
                let listParent = await ITEM__ACCOUNT_COLL.find(ObjectQuery)
                .populate(
                    constructPopulateConfigObj(Number(levelMax[0].maxLevel), 'childs')
                )
                .sort({name: 1})

                return resolve({ error: false, data: listParent, maxLevel: Number(levelMax[0].maxLevel) });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }
}


exports.MODEL = new Model;
