"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                                  	= require('mongoose').Types.ObjectId;
const moment										= require('moment');

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 						= require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_FILE } 							= require('../../file/helper/file.actions-constant');
const { CF_ACTIONS_AUTH } 							= require('../../auth/helper/auth.actions-constant');

/**
 * TOOLS
 */
const BaseModel                                 	= require('../../../tools/db/base_model');
const stringUtils									= require('../../../tools/utils/string_utils');
const { RANGE_BASE_PAGINATION } 					= require('../../../tools/cursor_base/playground/index');
const { DOC_DIRECTION_TYPE }                        = require('../helper/document.keys-constant');
const { 
    checkObjectIDs,
    IsJsonString,
    checkNumberIsValidWithRange
} = require('../../../tools/utils/utils');

/**
 * COLLECTIONS
 */
const DOCUMENT__DOC_COLL               				= require('../database/document.doc-coll');


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
		parentID, name, sign, storeSign, description, approver, date, receivedDate, style, status,
        amount, amountDelivery, requestResponse, expiredResponse, direction, packageID, senderID, receiverID, 
        fieldID, propertyID, otherID, storageID, note, departmentID, companyID, userID
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
                amountDelivery  && (dataInsert.amountDelivery   = +amountDelivery || 1);

                (packageID  && checkObjectIDs(packageID))   && (dataInsert.package  = packageID);
                (senderID   && checkObjectIDs(senderID))    && (dataInsert.sender   = senderID);
                (receiverID && checkObjectIDs(receiverID))  && (dataInsert.receiver = receiverID);
                (fieldID    && checkObjectIDs(fieldID))     && (dataInsert.field    = fieldID);
                (otherID    && checkObjectIDs(otherID))     && (dataInsert.other    = otherID);
                (propertyID && checkObjectIDs(propertyID))  && (dataInsert.property = otherID);
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

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
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
    getListDocument({ userID, lastestID, keyword, limit = 20, filter = {}, select = {} }){
        return new Promise(async resolve => {
            try {
				if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'Request params userID invalid', status: 400 });

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

				// SEARCH TEXT
				if(keyword){
					conditionObj.$text = { $search: keyword };
					objSort.score = { $meta: "textScore" };
					sortBy.score  = { $meta: "textScore" };
				}

                let listDocuments = await DOCUMENT__DOC_COLL
					.find({ ...conditionObj, ...conditionFind }, { ...objSort, ...filter })
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

}

exports.MODEL = new Model;