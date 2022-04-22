"use strict";

/**
 * EXTERNAL PACKAGE
 */
const stringUtils						 = require('../../../tools/utils/string_utils');
const ObjectID                           = require('mongoose').Types.ObjectId;
const { KEY_ERROR }                      = require('../../../tools/keys/index');

/**
 * CONSTANTS
 */

/**
 * TOOLS
 */
const BaseModel                                 	= require('../../../tools/db/base_model');
const { RANGE_BASE_PAGINATION_V2 } 					= require('../../../tools/cursor_base/playground/index');
const { checkObjectIDs, IsJsonString  }             = require('../../../tools/utils/utils');
const { CF_DOMAIN_SERVICES } 		                = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		                    = require('../../item/helper/item.actions-constant');

/**
 * COLLECTIONS
 */
const DOCUMENT__PACKAGE_COLL           				= require('../database/document.package-coll');

class Model extends BaseModel {

    constructor() {
        super(DOCUMENT__PACKAGE_COLL);
    }

    /**
	 * Name: insert document package 
	 * Author: Depv
	 * Code:
	 */
    insert({ name, sign, userID, projectID, parentID, ctx }) {
        return new Promise(async resolve => {
            try {
                /**
                 * Business Analyst (BA)
                 * 1. Kiểm tra tính hợp lệ của tham biến
                 * 2. Tạo gói thầu trong dự án
                 * 3. Cập nhật thông dự án
                 */
                if (!name|| !checkObjectIDs(projectID))
                    return resolve({ error: true, message: 'params_invalid' });

                // call service department để lấy thông tin
                let infoProject = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST}`, {
                    departmentID: projectID
                })

                const companyID = infoProject?.data?.company;
                //__________Khai báo dữ liệu
                let suid = await stringUtils.randomAndCheckExists( DOCUMENT__PACKAGE_COLL, 'suid');
                let dataInsert = {
                    suid,
                    author: userID,
                    company: companyID,
                    project: projectID,
                    name,
                    sign,
                    members: [ObjectID(userID)],
                    userCreate: userID
                }

                //__________Kiểm tra xem có parent hay không
                if(parentID && checkObjectIDs(parentID)){
                    dataInsert.parent = parentID;
                    let infoParent = await DOCUMENT__PACKAGE_COLL.findById(parentID);
                    dataInsert.level = infoParent.level + 1;
                }
                //__________Tạo gói thầu
                let infoAfterInsert = await this.insertData(dataInsert);
                if (!infoAfterInsert)
                    return resolve({ error: true, message: "Tạo mới thất bại", keyError: 'cannot_update' });

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
	 * Name: update document package 
	 * Author: Depv
	 * Code:
	 */
    update({ packageID, name, sign, members, membersRemove, admins, adminsRemove, userID }) {
        return new Promise(async resolve => {
            try {
                let dataUpdate = { userUpdate: userID, modifyAt: new Date() };

                if(name){
                    dataUpdate.name = name;
                }

                if(sign){
                    dataUpdate.sign = sign;
                }

                if(checkObjectIDs(members)){
                    dataUpdate.$addToSet = { members }
                }

                if(checkObjectIDs(membersRemove)){
                    dataUpdate.$pullAll = { members: membersRemove }
                }

                if(checkObjectIDs(admins)){
                    dataUpdate.$addToSet = { admins }
                }

                if(checkObjectIDs(adminsRemove)){
                    dataUpdate.$pullAll = { admins: adminsRemove }
                }

                let infoAfterUpdate = await DOCUMENT__PACKAGE_COLL.findByIdAndUpdate(packageID, dataUpdate, { new: true });
                if (!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
	 * Name: Remove document package 
	 * Author: Depv
	 * Code:
	 */
	remove({ packageID }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(packageID))
                    return resolve({ error: true, message: 'Mã gói thầu không hợp lệ', keyError: "packageID_invalid", status: 400 });

                let infoAterRemove = await DOCUMENT__PACKAGE_COLL.findByIdAndDelete(packageID)
                if(!infoAterRemove)
                    return resolve({ error: true, message: "Xoá thất bại", keyError: "remove_failed", status: 403 });

                return resolve({ error: false, data: infoAterRemove, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * Name: Remove document package many 
	 * Author: Depv
	 * Code:
	 */
	removeMany({ packagesID }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(packagesID))
                    return resolve({ error: true, message: 'Mã gói thầu không hợp lệ', keyError: "packagesID_invalid", status: 400 });
                // Cần kiểm tra bạn phải lại admins của dự án thì mới cho xoá.
                let infoAterRemove = await DOCUMENT__PACKAGE_COLL.deleteMany({ _id: { $in: packagesID } });
                if(!infoAterRemove)
                    return resolve({ error: true, message: "Xoá thất bại", keyError: KEY_ERROR.DELETE_FAILED, status: 403 });

                return resolve({ error: false, data: infoAterRemove, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

	/**
	 * Name: get info document package 
	 * Author: Depv
	 * Code:
	 */
	getInfo({ packageID, select, populates }) {
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
                if(!checkObjectIDs(packageID))
                    return resolve({ error: true, message: 'Request params packageID invalid', status: 400 });

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
                let infoAterGet = await DOCUMENT__PACKAGE_COLL.findById(packageID)
                    .select(select)
                    .populate(populates)
                    .lean();

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
    getListPackage({ departmentID, parentID, userID, lastestID, isShowAll, keyword, limit = 10, select, populates = {}}){
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(departmentID))
                    return resolve({ error: true, message: 'Request params departmentID invalid', status: 400 });

                let conditionObj = { members: { $in: [userID] }, project: departmentID };
                let sortBy;
                let keys	     = ['createAt__-1', '_id__-1'];

                // Nếu có trường này thì lấy tất cả group trong dự án mà mình có thể không là members
                if(isShowAll == "1"){
                    delete conditionObj.members;
                }

                if(limit > 20){
                    limit = 20;
                }else{
                    limit = +limit;
                }

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

                if(parentID && checkObjectIDs(parentID)) {
                    conditionObj.parent = parentID;
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
						limit,
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
