"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
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
const ITEM__FUNDA_COLL            				= require('../database/item.funda-coll');
const ITEM__AREA_COLL            				= require('../database/item.area-coll');

class Model extends BaseModel {
    
    constructor() {
        super(ITEM__FUNDA_COLL);
    }

     /**
	 * Dev : Depv
	 * Func: Tạo account
	 * Date: 13/12/2021
	 */
	insert({ companyID, parentID, name, sign, description, internal, area, materialExpenseRate, materialExpense, planExpense, utilityExpense, humanExpense, otherExpense, userID }){
        return new Promise(async resolve => {
            try {
                if(!name)
                    return resolve({ error: true, message: "Tên không hợp lệ", keyError: "Request params name invalid" });

                let dataInsert = {
                    userCreate: userID,
                    company: companyID,
                    name, 
                    admins: [userID],
                    members: [userID],
                }    

                if(checkObjectIDs(parentID)){
                    dataInsert.parent = parentID;
                }

                if(sign && sign != ""){
                    dataInsert.sign = sign;
                }

                if(description && description != ""){
                    dataInsert.description = description;
                }
                
                //_________Phân loại trong hệ thống hoặc nhượng quyền
                if(internal && !isNaN(internal) && [1, 2].includes(internal)){
                    dataInsert.internal = +internal;
                }

                //_________Khu vực (phường/xã)
                if(checkObjectIDs(area)){
                    let infoArea = await ITEM__AREA_COLL.findById(area).populate({
                        path: 'parent',
                        select: "_id name",
                        populate: {
                            path: 'parent',
                            select: "_id name",
                        }
                    })
                    // console.log(infoArea)

                    dataInsert.area3 = area
                    dataInsert.area2 = infoArea.parent._id
                    dataInsert.area1 = infoArea.parent.parent._id
                }

                 /**
                 * Chi phí vận hành
                 */
                if(!isNaN(materialExpenseRate)){
                    dataInsert.materialExpenseRate = Number(materialExpenseRate);
                }

                if(!isNaN(materialExpense)){
                    dataInsert.materialExpense = Number(materialExpense);
                }

                if(!isNaN(planExpense)){
                    dataInsert.planExpense = Number(planExpense);
                }

                if(!isNaN(utilityExpense)){
                    dataInsert.utilityExpense = Number(utilityExpense);
                }

                if(!isNaN(humanExpense)){
                    dataInsert.humanExpense = Number(humanExpense);
                }

                if(!isNaN(otherExpense)){
                    dataInsert.otherExpense = Number(otherExpense);
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert" });

                // Cập nhật amountChilds cho phần tử cha
                if(checkObjectIDs(parentID)){
                    await ITEM__FUNDA_COLL.findByIdAndUpdate(parentID, { $inc: { amountChilds: 1 }}, { new: true });
                }

                return resolve({ error: false, data: infoAfterInsert });

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
	 * Dev : Depv
	 * Func: update account
	 * Date: 13/12/2021
	 */
	update({ fundaID, name, sign, description, members, admins, membersRemove, adminsRemove, internal, area, materialExpenseRate, materialExpense, planExpense, utilityExpense, humanExpense, otherExpense, userID }){
        return new Promise(async resolve => { 
            try {
                if(!checkObjectIDs(fundaID))
                    return resolve({ error: true, message: "fundaID không hợp lệ", keyError: "Request params fundaID invalid" });

                if(!name)
                    return resolve({ error: true, message: "Tên không hợp lệ", keyError: "Request params name invalid" });
                
                let dataUpdate = {
                    name, userUpdate: userID, modifyAt: new Date()
                }

                let dataAddToset = {};
                let dataPullAll  = {};

                if(description && description != ""){
                    dataUpdate.description = description;
                }

                if(sign && sign != ""){
                    dataUpdate.sign = sign;
                }

                //_________Thêm thành viên
                if(checkObjectIDs(members)){
                    dataAddToset = {
                        ...dataAddToset,
                        members
                    }
                }

                if(checkObjectIDs(admins)){
                    dataAddToset = {
                        ...dataAddToset,
                        admins
                    }
                }

                //_________Xoá thành viên
                if(checkObjectIDs(membersRemove)){
                    dataPullAll = {
                        ...dataPullAll,
                        members: membersRemove
                    }
                }

                if(checkObjectIDs(adminsRemove)){
                    dataPullAll = {
                        ...dataPullAll,
                        admins: adminsRemove
                    }
                }

                //_________Phân loại trong hệ thống hoặc nhượng quyền
                if(internal && !isNaN(internal) && [1, 2].includes(internal)){
                    dataUpdate.internal = +internal;
                }

                //_________Khu vực (phường/xã)
                if(checkObjectIDs(area)){
                    let infoArea = await ITEM__AREA_COLL.findById(area).populate({
                        path: 'parent',
                        select: "_id name",
                        populate: {
                            path: 'parent',
                            select: "_id name",
                        }
                    })
                    // console.log(infoArea)

                    dataUpdate.area3 = area
                    dataUpdate.area2 = infoArea.parent._id
                    dataUpdate.area1 = infoArea.parent.parent._id
                }

                /**
                 * Chi phí vận hành
                 */
                if(!isNaN(materialExpenseRate)){
                    dataUpdate.materialExpenseRate = Number(materialExpenseRate);
                }

                if(!isNaN(materialExpense)){
                    dataUpdate.materialExpense = Number(materialExpense);
                }

                if(!isNaN(planExpense)){
                    dataUpdate.planExpense = Number(planExpense);
                }

                if(!isNaN(utilityExpense)){
                    dataUpdate.utilityExpense = Number(utilityExpense);
                }

                if(!isNaN(humanExpense)){
                    dataUpdate.humanExpense = Number(humanExpense);
                }

                if(!isNaN(otherExpense)){
                    dataUpdate.otherExpense = Number(otherExpense);
                }

                /**
                 * Cập nhật nhiều dữ liệu addToSet cùng 1 lúc
                 */
                if(dataAddToset){
                    dataUpdate.$addToSet = dataAddToset;
                }

                /**
                 * Xóa nhiều dữ liệu cùng 1 lúc
                 */
                if(dataPullAll){
                    dataUpdate.$pullAll = dataPullAll;
                }

                let infoAfterUpdate = await ITEM__FUNDA_COLL.findByIdAndUpdate(fundaID, dataUpdate, { new: true });
                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: get info funda 
     * Author: Depv
     * Code: 
     */
    getInfo({ fundaID, select, populates }) { 
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(fundaID))
                    return resolve({ error: true, message: 'Request params fundaID invalid', status: 400 });
                
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

                let infoAterGet = await ITEM__FUNDA_COLL.findById(fundaID)
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
     * Name  : Danh sách funda 
     * Author: Depv
     * Code  : 
     */
    getList({
        companyID, parentID, isListParentOfListChilds, isMember,
        keyword, limit = 10, lastestID, select, populates= {}, userID } ) { 
        console.log({companyID, parentID, isListParentOfListChilds, isMember,
            keyword, limit, lastestID, select, populates, userID})  
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

                if(isMember == 1){
                    conditionObj.members = { $in: [userID] }
                }

                if(companyID && checkObjectIDs(companyID)){
                    conditionObj.company = companyID;
                }

                // Chỉ lấy danh sách cha hoặc con
                if(isListParentOfListChilds == 1){
                    if(parentID){
                        conditionObj.parent = parentID;
                    }else{
                        conditionObj.parent = { $exists: false };
                    }
                }
                
                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }

                console.log(conditionObj)
                
                let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await ITEM__FUNDA_COLL.findById(lastestID);
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
                
                let infoDataAfterGet = await ITEM__FUNDA_COLL.find(conditionObj)
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

                let totalRecord = await ITEM__FUNDA_COLL.countDocuments(conditionObjOrg);
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
}

exports.MODEL = new Model;