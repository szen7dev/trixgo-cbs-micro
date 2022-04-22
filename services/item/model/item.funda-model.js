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

class Model extends BaseModel {
    
    constructor() {
        super(ITEM__FUNDA_COLL);
    }

     /**
	 * Dev : Depv
	 * Func: Tạo account
	 * Date: 13/12/2021
	 */
	insert({ companyID, parentID, name, description, userID }){
        return new Promise(async resolve => {
            try {
                if(!name)
                    return resolve({ error: true, message: "Tên không hợp lệ", keyError: "Request params name invalid" });

                let dataInsert = {
                    userCreate: userID,
                    company: companyID,
                    name, 
                }    

                if(checkObjectIDs(parentID)){
                    dataInsert.parent = parentID;
                }

                if(description){
                    dataInsert.description = description;
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
	update({ fundaID, name, description, userID }){
        return new Promise(async resolve => { 
            try {
                if(!checkObjectIDs(fundaID))
                    return resolve({ error: true, message: "fundaID không hợp lệ", keyError: "Request params fundaID invalid" });

                if(!name)
                    return resolve({ error: true, message: "Tên không hợp lệ", keyError: "Request params name invalid" });
                
                let dataUpdate = {
                    name, userUpdate: userID, modifyAt: new Date()
                }

                if(description){
                    dataUpdate.description = description;
                }

                let infoAfterUpdate = await ITEM__FUNDA_COLL.findByIdAndUpdate(fundaID, dataUpdate, { new: true });
                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: get info funda ✅
     * Author: Depv
     * Code: 
     */
    getInfo({ fundaID, select, populates }) { 
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
                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
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
     * Name  : Danh sách funda ✅
     * Author: Depv
     * Code  : 
     */
    getList({
        companyID, parentID, isListParentOfListChilds,
        keyword, limit = 10, lastestID, select, populates= {} }) { 
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
    
    getListFundaOfCompany({ companyID }){
        return new Promise(async (resolve) => {
            try {
                if(!ObjectID(companyID))
                    return resolve({ error: true, message: 'param_not_valid' });
                let fundas = await ITEM__FUNDA_COLL.find({ company: companyID }).sort({_id: 'asc'});
                if(!fundas)
                    return resolve({ error: true, message: "cannot_get_list" });
                return resolve({ error: false, data: fundas });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}

exports.MODEL = new Model;
