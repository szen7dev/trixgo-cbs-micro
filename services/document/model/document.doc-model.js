"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                                  	= require('mongoose').Types.ObjectId;

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 						= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 							= require('../../item/helper/item.actions-constant');

/**
 * TOOLS
 */
const BaseModel                                 	= require('../../../tools/db/base_model');
const stringUtils									= require('../../../tools/utils/string_utils');
const timeUtils									    = require('../../../tools/utils/time_utils');
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
const DOCUMENT__FILE_COLL           				= require('../database/document.doc_file-coll');
const DOCUMENT__DOCTYPE_COLL           				= require('../database/document.doctype-coll');
const DOCUMENT__PACKAGE_COLL           				= require('../database/document.package-coll');
const DOCUMENT__STORAGE_COLL           				= require('../database/document.storage-coll');
const DOCUMENT__USER_COLL           				= require('../database/document.user_related-coll');


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
					return resolve({ error: true, message: 'Request params companyID or departmentID or packageID invalid', status: 400 });

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
                    description,
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
                    dataInsert.level = +infoParent.level + 1;
                }

				let infoAfterInsert = await this.insertData(dataInsert);

				if (!infoAfterInsert)
                    return resolve({ error: true, message: "Can't create document", status: 422 });

                await DOCUMENT__USER_COLL.create({
                    document: infoAfterInsert._id,
                    user: userID,
                    permission: 1,
                    createAt: timeUtils.getCurrentTime(),
                    modifyAt: timeUtils.getCurrentTime()
                });

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

                let checkPermission = await DOCUMENT__USER_COLL.findOne({
                    document: documentID,
                    user: userUpdate,
                    permission: { $in: [1,3] }
                }).lean()

                if(!checkPermission)
                    return resolve({ error: true, message: "Permission denined", status: 403 });

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
                (propertyID && checkObjectIDs(propertyID))  && (dataUpdate.property = propertyID);
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
                    return resolve({ error: true, message: "Can't update document", status: 422 });

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

                let checkPermission = await DOCUMENT__USER_COLL.findOne({
                    document: documentID,
                    user: userID,
                    permission: 1
                }).lean()

                if(!checkPermission)
                    return resolve({ error: true, message: "Permission denined", status: 403 });

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
	 * Func: Chi tiết hồ sơ văn bản
	 * Date: 12/11/2021
	 */
    getInfoDocumment({ userID, documentID, select }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs([documentID, userID]))
					return resolve({ error: true, message: 'Request params documentID or userID invalid', status: 400 });

                if(select && typeof select === 'string'){
                    if(!IsJsonString(select))
                        return resolve({ error: true, message: 'Request params select invalid', status: 400 });

                    select = JSON.parse(select);
                }

                let checkPermission = await DOCUMENT__USER_COLL
                    .findOne({
                        document: documentID,
                        user: userID
                    })
                    .lean();

                if(!checkPermission)
                    return resolve({ error: true, message: "Permission denined", status: 403 });

                const infoDocument = await DOCUMENT__DOC_COLL
                    .findById(documentID)
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
                    .populate('userUpdate', select.userUpdate)
                    .populate('childs', select.childs)
                    .lean();

                if(!infoDocument)
                    return resolve({ error: true, message: "Can't get info document", status: 400 });

                const listFilesAttachment = await DOCUMENT__FILE_COLL
                    .find({ document: documentID })
                    .select('file user')
                    .populate({
                        path: 'file',
                        select: '_id name url size'
                    })
                    .populate({
                        path: 'user',
                        select: '_id bizname fullname image'
                    })
                    .sort({ createAt: -1 })
                    .lean();

                infoDocument.files = listFilesAttachment;

                return resolve({ error: false, data: infoDocument, status: 200 });
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
    getListDocument({ companyID, departmentID, packageID, doctypeID, senderID, contractID, userID, lastestID, requestResponse, marked, keyword, limit = 20, filter = {}, select = {} }){
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

                if(senderID && !checkObjectIDs(senderID))
                    return resolve({ error: true, message: 'Request params senderID invalid', status: 400 });

                if(contractID && !checkObjectIDs(contractID))
                    return resolve({ error: true, message: 'Request params contractID invalid', status: 400 });

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
                    let infoDocument = await DOCUMENT__DOC_COLL.findById(lastestID);
                    if(!infoDocument)
                        return resolve({ error: true, message: "Can't get info last document", status: 403 });

                    let nextInfo = `${infoDocument.modifyAt}_${infoDocument._id}`;
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

                packageID       && (conditionObj.package         = packageID);
                senderID        && (conditionObj.sender          = senderID);
                doctypeID       && (conditionObj.property        = doctypeID);
                requestResponse && (conditionObj.requestResponse = +requestResponse);

                // Lấy danh sách đánh dấu sao
                if(marked && [1,2].includes(+marked)){
                    conditionObj["mark.status"] = +marked;
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
                departmentID    && (conditionObj.project = departmentID);

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

                let conditionObj = { package: ObjectID(packageID) };
                companyID       && (conditionObj.company = ObjectID(companyID));
                departmentID    && (conditionObj.project = ObjectID(departmentID));
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
                            from: "doctypes",
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
                    .populate('userCreate', select.userCreate)
                    .populate('userUpdate', select.userUpdate)
                    .populate('company', select.company)
                    .populate('childs', select.childs)
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

    /**
 	 * Dev: MinhVH
 	 * Func: Chia sẻ văn bản
 	 * Date: 05/11/2021
 	 */
 	updateShareDocument({ authorID, documentID, usersID, isShare }) { 
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs([authorID]))
                    return resolve({ error: true, message: 'Request params authorID invalid', status: 400 });

                if(!checkObjectIDs([documentID]))
                    return resolve({ error: true, message: 'Request params documentID invalid', status: 400 });

                if(!usersID || !usersID.length || !checkObjectIDs(usersID))
                    return resolve({ error: true, message: 'Request params usersID invalid', status: 400 });

                let infoAuthorDocument = await DOCUMENT__USER_COLL.findOne({
                    document: documentID,
                    user: authorID,
                    permission: 1
                }).lean()

                if(!infoAuthorDocument)
                    return resolve({ error: true, message: "Permission denined", status: 403 });

                let infoAfterShare = null;

                if(isShare){
                    let listUserShared = usersID.map(user => ({
                        document: documentID,
                        user,
                        permission: 2,
                        createAt: timeUtils.getCurrentTime(),
                        modifyAt: timeUtils.getCurrentTime()
                    }))

                    infoAfterShare = await DOCUMENT__USER_COLL.insertMany(listUserShared);
                } else{
                    let listUserRemoveShare = usersID.map(user => ({
                        document: documentID,
                        user
                    }))

                    infoAfterShare = await DOCUMENT__USER_COLL.deleteMany(listUserRemoveShare);
                }

                return resolve({
                    error: false,
                    status: 200,
                    data: infoAfterShare
                });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
 	 * Dev: MinhVH
 	 * Func: Cập nhật quyền người được chia sẻ văn bản
 	 * Date: 05/11/2021
 	 */
    updatePermissionShare({ authorID, documentID, userID, permission }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs([authorID]))
                    return resolve({ error: true, message: 'Request params authorID invalid', status: 400 });

                if(!checkObjectIDs([documentID]))
                    return resolve({ error: true, message: 'Request params documentID invalid', status: 400 });

                if(!checkObjectIDs([userID]))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(![2,3].includes(permission))
                    return resolve({ error: true, message: 'Request params permission invalid', status: 400 });

                let infoAuthorDocument = await DOCUMENT__USER_COLL.findOne({
                    document: documentID,
                    user: authorID,
                    permission: 1
                }).lean();

                if(!infoAuthorDocument)
                    return resolve({ error: true, message: "Permission denined", status: 403 });

                let infoUserShared = await DOCUMENT__USER_COLL.findOne({
                    document: documentID,
                    user: userID
                }).lean()

                if(!infoUserShared)
                    return resolve({ error: true, message: 'User has not yet shared the document', status: 400 });

                let infoAfterUpdate = await DOCUMENT__USER_COLL.findByIdAndUpdate(infoUserShared._id, {
                    $set: {
                        permission
                    }
                }, { new: true })

                if(!infoAfterUpdate)
                    return resolve({ error: true, message: 'Update permission failed', status: 422 });

                return resolve({
                    error: false,
                    status: 200,
                    data: infoAfterUpdate
                });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
 	 * Dev: MinhVH
 	 * Func: Danh sách user được truy cập hồ sơ
 	 * Date: 10/11/2021
 	 */
 	getListUserShared({ userID, documentID, lastestID, limit = 10, filter = {}, select = {} }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs([userID]))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

                if(!checkObjectIDs([documentID]))
                    return resolve({ error: true, message: 'Request params documentID invalid', status: 400 });

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
                let conditionObj  = { document: documentID };
                let sortBy = {
                    modifyAt: -1,
                    createAt: -1,
                }

                if(lastestID && checkObjectIDs(lastestID)){
                    let infoUserShared = await DOCUMENT__USER_COLL.findById(lastestID);
                    if(!infoUserShared)
                        return resolve({ error: true, message: "Can't get info last user shared", status: 403 });

                    let nextInfo = `${infoUserShared.modifyAt}_${infoUserShared._id}`;
                    let keys	 = ['modifyAt__-1', '_id__-1'];  

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionFind = dataPagingAndSort.data.find;
                }

                let	listUserShared = await DOCUMENT__USER_COLL
                    .find({ ...conditionObj, ...conditionFind }, filter)
                    .populate('document', select.document)
                    .populate('user', select.user)
                    .limit(limit + 1)
                    .sort(sortBy)
                    .lean();

                if(!listUserShared)
                    return resolve({ error: true, message: "Can't get list user shared", status: 400 });

                // GET TOTAL RECORD
                let totalRecord = await DOCUMENT__USER_COLL.countDocuments(conditionObj);
                let nextCursor	= null;

                if(listUserShared && listUserShared.length){
                    if(listUserShared.length > limit){
                        nextCursor = listUserShared[limit - 1]._id;
                        listUserShared.length = limit;
                    }
                }

                return resolve({
                    error: false,
                    status: 200,
                    data: {
                        listRecords: listUserShared,
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
	 * Func: Thêm file đính kèm trong hồ sơ
	 * Date: 13/11/2021
	 */  
    addFileAttachment({ authorID, documentID, filesID }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs([authorID]))
                    return resolve({ error: true, message: 'Request params authorID invalid', status: 400 });

                if(!checkObjectIDs([documentID]))
                    return resolve({ error: true, message: 'Request params documentID invalid', status: 400 });

                if(!filesID || !filesID.length || !checkObjectIDs(filesID))
                    return resolve({ error: true, message: 'Request params filesID invalid', status: 400 });

                let infoAuthorDocument = await DOCUMENT__USER_COLL.findOne({
                    document: documentID,
                    user: authorID,
                    permission: 1
                }).lean()

                if(!infoAuthorDocument)
                    return resolve({ error: true, message: "Permission denined", status: 403 });

                const listFilesInsert = filesID.map(file => ({
                    document: documentID,
                    user: authorID,
                    file,
                    createAt: timeUtils.getCurrentTime(),
                    modifyAt: timeUtils.getCurrentTime()
                }))

                let infoAfterInsert = await DOCUMENT__FILE_COLL.insertMany(listFilesInsert);

                if(!infoAfterInsert)
                    return resolve({ error: true, message: 'Add files attachment failed', status: 422 });

                return resolve({
                    error: false,
                    status: 200,
                    data: infoAfterInsert
                });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}

exports.MODEL = new Model;
