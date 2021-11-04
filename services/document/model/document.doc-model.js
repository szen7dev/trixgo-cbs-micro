"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                                  	= require('mongoose').Types.ObjectId;

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 						= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 							= require('../../file/helper/file.actions-constant');
const { CF_ACTIONS_AUTH } 							= require('../../auth/helper/auth.actions-constant');
const { CF_ACTIONS_ITEM } 							= require('../../item/helper/item.actions-constant');

/**
 * TOOLS
 */
const BaseModel                                 	= require('../../../tools/db/base_model');
const stringUtils									= require('../../../tools/utils/string_utils');
const { RANGE_BASE_PAGINATION } 					= require('../../../tools/cursor_base/playground/index');
const { DOC_DIRECTION_TYPE, DOC_TYPE }              = require('../helper/document.keys-constant');
const {
    checkObjectIDs,
    IsJsonString,
    checkNumberIsValidWithRange
} = require('../../../tools/utils/utils');

/**
 * COLLECTIONS
 */
const DOCUMENT__DOC_COLL               				= require('../database/document.doc-coll');
const DOCUMENT__DOCTYPE_COLL           				= require('../database/document.doctype-coll');
const DOCUMENT__PACKAGE_COLL           				= require('../database/document.package-coll');
const DOCUMENT__STORAGE_COLL           				= require('../database/document.storage-coll');


class Model extends BaseModel {

    constructor() {
        super(DOCUMENT__DOC_COLL);
    }

	/**
	 * Dev: MinhVH
	 * Func: Tạo mới văn bản
	 * Date: 26/10/2021
	 */
	insertDocument({
		parentID, name, sign, storeSign, description, approver, date, receivedDate, type, style, status,
        amount, amountDelivery, requestResponse, expiredResponse, direction, packageID, senderID, receiverID,
        fieldID, propertyID, otherID, storageID, note, departmentID, companyID, userID, ctx
	}) {
        return new Promise(async (resolve) => {
            try {
				if (!checkObjectIDs([userID, companyID, departmentID, packageID]))
					return resolve({ error: true, message: 'Request params invalid', status: 400 });

                if (!checkNumberIsValidWithRange({ arrValid: DOC_DIRECTION_TYPE, val: direction }))
                    return resolve({ error: true, message: 'Request params direction invalid', status: 400 });

                if (!checkNumberIsValidWithRange({ arrValid: [0,1], val: requestResponse }))
                    return resolve({ error: true, message: 'Request params requestResponse invalid', status: 400 });

                let suid = await stringUtils.randomAndCheckExists(DOCUMENT__DOC_COLL, 'suid');
                let dataInsert = {
                    suid,
                    author: userID,
                    company: companyID,
                    project: departmentID,
                    direction,
                    name,
                    sign,
                    storeSign,
                    approver,
                    date,
                    receivedDate,
                    style,
                    status,
                    requestResponse,
                    expiredResponse,
                    note,
                    description
                }

                amount          && (dataInsert.amount           = +amount || 1);
                amountDelivery  && (dataInsert.amountDelivery   = +amountDelivery || 0);

                // Nếu văn bản là hợp đồng => Lưu vào contract
                if(type && !isNaN(type) && +type === 2){
                    dataInsert.type = +type;
                }

                (packageID  && checkObjectIDs(packageID))   && (dataInsert.package  = packageID);
                (senderID   && checkObjectIDs(senderID))    && (dataInsert.sender   = senderID);
                (receiverID && checkObjectIDs(receiverID))  && (dataInsert.receiver = receiverID);
                (fieldID    && checkObjectIDs(fieldID))     && (dataInsert.field    = fieldID);
                (propertyID && checkObjectIDs(propertyID))  && (dataInsert.property = otherID);
                (otherID    && checkObjectIDs(otherID))     && (dataInsert.other    = otherID);
                (storageID  && checkObjectIDs(storageID))   && (dataInsert.storage  = storageID);

                if(parentID && checkObjectIDs(parentID)){
                    let infoParent = await DOCUMENT__DOC_COLL.findById(parentID).select('level');
                    dataInsert.parent = parentID;
                    dataInsert.level = infoParent.level + 1;
                }

				let infoAfterInsert = await this.insertData(dataInsert);

				if (!infoAfterInsert)
                    return resolve({ error: true, message: "Can't create document", status: 403 });

                if(parentID) {
                    await DOCUMENT__DOC_COLL.findByIdAndUpdate(parentID, {
                        $addToSet: { childs: infoAfterInsert._id }
                    });
                }

                // Update document for contract
                if(type && !isNaN(type) && +type === 2){
                    let infoPackage = await DOCUMENT__PACKAGE_COLL
                        .findById(packageID)
                        .select('_id contract');

                    if(infoPackage){
                        await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.UPDATE_CONTRACT_BY_CONDITION}`, {
                            condition: { _id: infoPackage.contract },
                            update: {
                                $addToSet: {
                                    documents: infoAfterInsert._id
                                }
                            }
                        });
                    }
                }

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: Cập nhật văn bản
	 * Date: 28/10/2021
	 */
    updateDocument({
		documentID, name, sign, storeSign, description, approver, date, receivedDate, type, style, status,
        amount, amountDelivery, requestResponse, expiredResponse, direction, packageID, senderID, receiverID,
        fieldID, propertyID, otherID, storageID, note, userUpdate, ctx
	}) {
        return new Promise(async (resolve) => {
            try {
				if (!checkObjectIDs([documentID, userUpdate]))
					return resolve({ error: true, message: 'Request params invalid', status: 400 });

                if (direction && !checkNumberIsValidWithRange({ arrValid: DOC_DIRECTION_TYPE, val: direction }))
                    return resolve({ error: true, message: 'Request params direction invalid', status: 400 });

                if (requestResponse && !checkNumberIsValidWithRange({ arrValid: [0,1], val: requestResponse }))
                    return resolve({ error: true, message: 'Request params requestResponse invalid', status: 400 });

                let dataUpdate = {
                    name,
                    sign,
                    storeSign,
                    approver,
                    date,
                    receivedDate,
                    style,
                    status,
                    expiredResponse,
                    note,
                    description,
                    userUpdate
                }

                direction       && (dataUpdate.direction        = +direction || 1);
                requestResponse && (dataUpdate.requestResponse  = +requestResponse || 0);
                amount          && (dataUpdate.amount           = +amount || 1);
                amountDelivery  && (dataUpdate.amountDelivery   = +amountDelivery || 0);

                if(type && checkNumberIsValidWithRange({ arrValid: DOC_TYPE, val: type })){
                    dataUpdate.type = +type;
                }

                (packageID  && checkObjectIDs(packageID))   && (dataUpdate.package  = packageID);
                (senderID   && checkObjectIDs(senderID))    && (dataUpdate.sender   = senderID);
                (receiverID && checkObjectIDs(receiverID))  && (dataUpdate.receiver = receiverID);
                (fieldID    && checkObjectIDs(fieldID))     && (dataUpdate.field    = fieldID);
                (otherID    && checkObjectIDs(otherID))     && (dataUpdate.other    = otherID);
                (propertyID && checkObjectIDs(propertyID))  && (dataUpdate.property = otherID);
                (storageID  && checkObjectIDs(storageID))   && (dataUpdate.storage  = storageID);

                // Lấy thông tin hợp đồng
                let infoPackage = null;

                if(packageID){
                    infoPackage = await DOCUMENT__PACKAGE_COLL
                        .findById(packageID)
                        .select('_id contract');
                }

                if(infoPackage && infoPackage.contract && type && !isNaN(type)){
                    // Update document cho contract
                    if(+type === 2){
                        await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.UPDATE_CONTRACT_BY_CONDITION}`, {
                            condition: { _id: infoPackage.contract },
                            update: {
                                $addToSet: {
                                    documents: documentID
                                }
                            }
                        });
                    } else{
                        await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.UPDATE_CONTRACT_BY_CONDITION}`, {
                            condition: { _id: infoPackage.contract },
                            update: {
                                $pull: {
                                    documents: documentID
                                }
                            }
                        });
                    }
                }

				let infoAfterUpdate = await this.updateWhereClause({ _id: documentID }, dataUpdate);

				if (!infoAfterUpdate)
                    return resolve({ error: true, message: "Can't update document", status: 403 });

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: Xóa văn bản
	 * Date: 30/10/2021
	 */
    deleteDocument({ documentID, userID }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs([documentID, userID]))
					return resolve({ error: true, message: 'Request params documentID or userID invalid', status: 400 });

                const infoAfterDelete = await DOCUMENT__DOC_COLL.findByIdAndDelete(documentID);

                if(!infoAfterDelete)
                    return resolve({ error: true, message: "Can't delete document", status: 422 });
                
                return resolve({ error: false, data: infoAfterDelete, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
	 * Dev: MinhVH
	 * Func: Lấy danh sách hồ sơ văn bản
	 * Date: 26/10/2021
	 */
    getListDocument({ companyID, departmentID, packageID, doctypeID, userID, lastestID, marked, keyword, limit = 20, filter = {}, select = {} }){
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(companyID && !checkObjectIDs(companyID))
                    return resolve({ error: true, message: 'Request params companyID invalid', status: 400 });

                if(departmentID && !checkObjectIDs(departmentID))
                    return resolve({ error: true, message: 'Request params departmentID invalid', status: 400 });

                if(packageID && !checkObjectIDs(packageID))
                    return resolve({ error: true, message: 'Request params packageID invalid', status: 400 });

                if(doctypeID && !checkObjectIDs(doctypeID))
                    return resolve({ error: true, message: 'Request params doctypeID invalid', status: 400 });

				if(isNaN(limit)) {
					limit = 20;
				} else{
					limit = +limit;
				}

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

				let conditionObj 	= {};
				let conditionFind 	= {};
                let listPackage     = [];
				let objSort 	 	= {};
                let sortBy = {
                    modifyAt: -1,
					createAt: -1,
                }

				// GET CONDITION PAGINATION
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoConversation = await DOCUMENT__DOC_COLL.findById(lastestID);
                    if(!infoConversation)
                        return resolve({ error: true, message: "Can't get info last document", status: 403 });

                    let nextInfo = `${infoConversation.modifyAt}_${infoConversation._id}`;
                    let keys 	 = ['modifyAt__-1', '_id__-1'];

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 403 });

					conditionFind = dataPagingAndSort.data.find;
                }

                companyID       && (conditionObj.company = companyID);
                departmentID    && (conditionObj.project = departmentID);
                
                if(companyID || departmentID){
                    listPackage = await DOCUMENT__PACKAGE_COLL.find({
                        ...conditionObj,
                        members: { $in: [userID] }
                    }).select('_id').lean();

                    if(!listPackage.length)
                        return resolve({ error: true, message: "Permission denined", status: 403 });

                    conditionObj.package = { $in: listPackage.map(item => item._id) };
                }

                packageID && (conditionObj.package = packageID);

                if(marked && [1,2].includes(marked)){
                    conditionObj["mark.status"] = marked;
                    sortBy = { "mark.updated": -1, ...sortBy };
                }

				// SEARCH TEXT
				if(keyword){
					conditionObj.$text = { $search: keyword };
					objSort.score = { $meta: "textScore" };
					sortBy.score  = { $meta: "textScore" };
				}

                let listDocuments = await DOCUMENT__DOC_COLL
					.find({ ...conditionObj, ...conditionFind }, { ...objSort, ...filter })
                    .populate('company', select.company)
                    .populate('project', select.project)
                    .populate('contract', select.contract)
                    .populate('package', select.package)
                    .populate('field', select.field)
                    .populate('property', select.property)
                    .populate('other', select.other)
                    .populate('storage', select.storage)
                    .populate('sender', select.sender)
                    .populate('receiver', select.receiver)
                    .populate('author', select.author)
					.limit(limit + 1)
					.sort(sortBy)
					.lean();

				// GET TOTAL RECORD
                let totalRecord = await DOCUMENT__DOC_COLL.count(conditionObj);
				let nextCursor	= null;

				if(listDocuments && listDocuments.length){
					if(listDocuments.length > limit){
						nextCursor = listDocuments[limit - 1]._id;
						listDocuments.length = limit;
					}
				}

                return resolve({
					error: false,
					status: 200,
					data: {
						listRecords: listDocuments,
						limit: +limit,
						totalRecord,
						nextCursor
					}
				});
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
 	 * Dev: MinhVH
 	 * Func: Danh sách tính chất văn bản
 	 * Date: 27/10/2021
 	 */
 	getListDoctype({ lastestID, userID, companyID, departmentID, keyword, limit = 10, filter = {}, select = {} }) {
 		return new Promise(async (resolve) => {
 			try {
 				if(!checkObjectIDs([userID]))
 					return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(companyID && !checkObjectIDs([companyID]))
 					return resolve({ error: true, message: 'Request params companyID invalid', status: 400 });

                if(departmentID && !checkObjectIDs([departmentID]))
 					return resolve({ error: true, message: 'Request params departmentID invalid', status: 400 });

 				if(isNaN(limit)){
 					limit = 10;
 				} else{
 					limit = +limit;
 				}

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

 				let conditionFind = {};
 				let conditionObj  = {};
                let objSort = {};
 				let sortBy = {
 					modifyAt: -1,
 					createAt: -1,
 					updateAt: -1
 				}

 				if(lastestID && checkObjectIDs(lastestID)){
 					let infoDoctype = await DOCUMENT__DOCTYPE_COLL.findById(lastestID);
 					if(!infoDoctype)
 						return resolve({ error: true, message: "Can't get info last doctype", status: 403 });

 					let nextInfo = `${infoDoctype.modifyAt}_${infoDoctype._id}`;
 					let keys	 = ['modifyAt__-1', '_id__-1'];  

 					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
 					if(!dataPagingAndSort || dataPagingAndSort.error)
 						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

 					conditionFind = dataPagingAndSort.data.find;
 				}

                companyID       && (conditionObj.company = companyID);
                departmentID    && (conditionObj.department = departmentID);

                 // SEARCH TEXT
 				if(keyword){
 					conditionObj.$text = { $search: keyword };
 					objSort.score = { $meta: "textScore" };
 					sortBy.score  = { $meta: "textScore" };
 				}

 				let	listDoctype = await DOCUMENT__DOCTYPE_COLL
 					.find({ ...conditionObj, ...conditionFind }, { ...objSort, ...filter })
                    .populate('project', select.project)
                    .populate('company', select.company)
 					.limit(limit + 1)
 					.sort(sortBy)
 					.lean();

 				if(!listDoctype)
 					return resolve({ error: true, message: "Can't get list doctype", status: 403 });

 				// GET TOTAL RECORD
 				let totalRecord = await DOCUMENT__DOCTYPE_COLL.countDocuments(conditionObj);
 				let nextCursor	= null;

 				if(listDoctype && listDoctype.length){
 					if(listDoctype.length > limit){
 						nextCursor = listDoctype[limit - 1]._id;
 						listDoctype.length = limit;
 					}
 				}

 				return resolve({
 					error: false,
 					status: 200,
 					data: {
 						listRecords: listDoctype,
 						limit: +limit,
 						totalRecord,
 						nextCursor
 					}
 				});
 			} catch (error) {
 				return resolve({ error: true, message: error.message, status: 500 })
 			}
 		})
 	}

     /**
 	 * Dev: MinhVH
 	 * Func: Danh sách phân loại hồ sơ trong gói thầu
 	 * Date: 27/10/2021
 	 */
    getListDoctypeByPackage({ userID, companyID, departmentID, packageID, type }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs([userID]))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

               if(companyID && !checkObjectIDs([companyID]))
                    return resolve({ error: true, message: 'Request params companyID invalid', status: 400 });

               if(departmentID && !checkObjectIDs([departmentID]))
                    return resolve({ error: true, message: 'Request params departmentID invalid', status: 400 });

                if(!checkObjectIDs([packageID]))
                    return resolve({ error: true, message: 'Request params packageID invalid', status: 400 });

                let conditionObj  = { package: ObjectID(packageID) };
                companyID       && (conditionObj.company = ObjectID(companyID));
                departmentID    && (conditionObj.department = ObjectID(departmentID));
                type            && (conditionObj['property.type'] = +type);

                let	listDoctype = await DOCUMENT__DOC_COLL.aggregate([
                    {
                        $group: {
                            _id: "$property",
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $lookup: {
                            from: "document_doctypes",
                            localField: "property",
                            foreignField: "_id",
                            as: "property"
                        }
                    },
                    {
                        $match: conditionObj
                    }
                ])

                if(!listDoctype)
                    return resolve({ error: true, message: "Can't get list doctype", status: 403 });

                return resolve({
                    error: false,
                    status: 200,
                    data: {
                        listRecords: listDoctype
                    }
                });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 })
            }
        })
    }

    /**
 	 * Dev: MinhVH
 	 * Func: Danh sách lưu trữ hồ sơ văn bản
 	 * Date: 27/10/2021
 	 */
 	getListStorage({ userID, companyID, lastestID, keyword, limit = 10, filter = {}, select = {} }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs([userID]))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

               if(!checkObjectIDs([companyID]))
                    return resolve({ error: true, message: 'Request params companyID invalid', status: 400 });

                if(isNaN(limit)){
                    limit = 10;
                } else{
                    limit = +limit;
                }

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

                let conditionFind = {};
                let conditionObj  = { company: companyID };
                let objSort = {};
                let sortBy = {
                    modifyAt: -1,
                    createAt: -1,
                    updateAt: -1
                }

                if(lastestID && checkObjectIDs(lastestID)){
                    let infoStorage = await DOCUMENT__STORAGE_COLL.findById(lastestID);
                    if(!infoStorage)
                        return resolve({ error: true, message: "Can't get info last storage", status: 403 });

                    let nextInfo = `${infoStorage.modifyAt}_${infoStorage._id}`;
                    let keys	 = ['modifyAt__-1', '_id__-1'];  

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionFind = dataPagingAndSort.data.find;
                }

                // SEARCH TEXT
                if(keyword){
                    conditionObj.$text = { $search: keyword };
                    objSort.score = { $meta: "textScore" };
                    sortBy.score  = { $meta: "textScore" };
                }

                let	listStorage = await DOCUMENT__STORAGE_COLL
                    .find({ ...conditionObj, ...conditionFind }, { ...objSort, ...filter })
                    .limit(limit + 1)
                    .sort(sortBy)
                    .lean();

                if(!listStorage)
                    return resolve({ error: true, message: "Can't get list storage", status: 403 });

                // GET TOTAL RECORD
                let totalRecord = await DOCUMENT__STORAGE_COLL.countDocuments(conditionObj);
                let nextCursor	= null;

                if(listStorage && listStorage.length){
                    if(listStorage.length > limit){
                        nextCursor = listStorage[limit - 1]._id;
                        listStorage.length = limit;
                    }
                }

                return resolve({
                    error: false,
                    status: 200,
                    data: {
                        listRecords: listStorage,
                        limit: +limit,
                        totalRecord,
                        nextCursor
                    }
                });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 })
            }
        })
    }

}

exports.MODEL = new Model;
