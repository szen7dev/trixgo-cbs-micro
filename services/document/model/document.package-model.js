"use strict";

/**
 * EXTERNAL PACKAGE
 */
const stringUtils						 = require('../../../tools/utils/string_utils');
const ObjectID                           = require('mongoose').Types.ObjectId;

/**
 * CONSTANTS
 */

/**
 * TOOLS
 */
const BaseModel                                 	= require('../../../tools/db/base_model');
const { RANGE_BASE_PAGINATION_V2 } 					= require('../../../tools/cursor_base/playground/index');
const {
    checkObjectIDs,
    IsJsonString,
} = require('../../../tools/utils/utils');

/**
 * COLLECTIONS
 */
const DOCUMENT__PACKAGE_COLL           				= require('../database/document.package-coll');

class Model extends BaseModel {

    constructor() {
        super(DOCUMENT__PACKAGE_COLL);
    }

    /**
	 * Name: insert document package ✅
	 * Author: Depv
	 * Code: 
	 */
    insert({ name, sign, contractID, authorID, projectID, companyID, parentID }) {
        return new Promise(async resolve => {
            try {
                /**
                 * Business Analyst (BA)
                 * 1. Kiểm tra tính hợp lệ của tham biến
                 * 2. Tạo gói thầu trong dự án
                 * 3. Cập nhật thông dự án
                 */
                if (!name|| !checkObjectIDs(authorID, companyID, projectID))
                    return resolve({ error: true, message: 'params_invalid' });

                //__________Khai báo dữ liệu
                let suid = await stringUtils.randomAndCheckExists( DOCUMENT__PACKAGE_COLL, 'suid');
                let dataInsert = {
                    suid,
                    author: authorID, 
                    company: companyID, 
                    project: projectID,
                    name,
                    sign,
                    members: [ObjectID(authorID)]
                }

                if(contractID && checkObjectIDs(contractID)){
                    dataInsert.contract = contractID;
                }

                //__________Kiểm tra xem có parent hay không
                if(parentID && checkObjectIDs(parentID)){
                    dataInsert.parent = parentID;
                    let infoParent = await DOCUMENT__PACKAGE_COLL.findById(parentID);
                    dataInsert.level = infoParent.level + 1;
                }
                console.log({ dataInsert });
                //__________Tạo gói thầu
                let infoAfterInsert = await this.insertData(dataInsert);
                if (!infoAfterInsert) 
                    return resolve({ error: true, message: 'cannot_insert' });
                
                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

      /**
	 * Name: update document package ✅
	 * Author: Depv
	 * Code: 
	 */
    update({ name, membersAddID, membersRemoveID }) {
        return new Promise(async resolve => {
            try {
                
                let dataUpdate = {};
                if(name){
                    dataUpdate.name = name;
                }

                if(membersAddID.length){
                    dataUpdate
                }


             
                let infoAfterInsert = await this.insertData(dataInsert);
                if (!infoAfterInsert) 
                    return resolve({ error: true, message: 'cannot_insert' });
                
                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

	/**
	 * Name: get info document package ✅
	 * Author: Depv
	 * Code: 
	 */
	getInfo({ documentPackageID, select, populates }) { 
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
                if(!checkObjectIDs(documentPackageID))
                    return resolve({ error: true, message: 'Request params documentPackageID invalid', status: 400 });
                
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
                let infoAterGet = await DOCUMENT__PACKAGE_COLL.findById(documentPackageID)
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
	 * Dev: MinhVH
	 * Func: Lấy danh sách gói thầu
	 * Date: 26/10/2021
	 */
    getListPackage({ departmentID, userID, lastestID, keyword, limit = 10, select, populates = {} }){
        return new Promise(async resolve => {
            try {
                let conditionObj = { members: { $in: [userID] } };
                let sortBy;
                let keys	     = ['createAt__-1', '_id__-1'];

                if(limit > 20){
                    limit = 20;
                }

				if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(departmentID && !checkObjectIDs(departmentID))
                    return resolve({ error: true, message: 'Request params departmentID invalid', status: 400 });
                    
                conditionObj.project = departmentID

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

                // SEARCH TEXT
                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regSearch = new RegExp(keyword, 'i');
                    conditionObj.$or = [
                        { name: regSearch },
                        { sign: regSearch },
                    ]
                }

                let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await DOCUMENT__PACKAGE_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj  = dataPagingAndSort.data.find;
                    sortBy        = dataPagingAndSort.data.sort;
                }else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy        = dataPagingAndSort.data.sort;
                }

                let listPackages = await DOCUMENT__PACKAGE_COLL
					.find(conditionObj)
					.limit(limit + 1)
					.select(select)
					.populate(populates)
                    .sort(sortBy)
					.lean();

				// GET TOTAL RECORD
                let totalRecord = await DOCUMENT__PACKAGE_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);
				let nextCursor	= null;

				if(listPackages && listPackages.length){
					if(listPackages.length > limit){
						nextCursor = listPackages[limit - 1]._id;
						listPackages.length = limit;
					}
				}

                return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listPackages,
						limit: +limit,
						totalRecord,
                        totalPage,
						nextCursor
					}
				});
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;
