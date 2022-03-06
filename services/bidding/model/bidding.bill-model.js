"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                                  	= require('mongoose').Types.ObjectId;
const moment                                  	    = require('moment');
const ISOdate                                  	    = require('isodate');

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
const { RANGE_BASE_PAGINATION_V2 } 					= require('../../../tools/cursor_base/playground/index');
// const { DOC_DIRECTION_TYPE, DOC_TYPE }              = require('../helper/bidding.keys-constant');
const {
    checkObjectIDs,
    IsJsonString,
    checkNumberIsValidWithRange
} = require('../../../tools/utils/utils');

/**
 * COLLECTIONS
 */
const BIDDING__DOC_COLL               				        = require('../database/bidding.plan-coll');
const BIDDING__DOCUMENT_REQUEST_COLL           				= require('../database/bidding.document_request-coll');
const BIDDING__DOCUMENT_APPLY_COLL           				= require('../database/bidding.document_apply-coll');
const BIDDING__BILL_COLL           				            = require('../database/bidding.bill-coll');
const BIDDING__QUOTATION_COLL           				    = require('../database/bidding.quotation-coll');

class Model extends BaseModel {

    constructor() {
        super(BIDDING__BILL_COLL);
    }
    
	/**
	 * Dev: Depv
	 * Func: Tạo mới văn bản
	 * Date: 26/10/2021
	 */
	insert({
        parentID, departmentID, userID, packageID, direction, senderID, receiverID, propertyID, type, contractID, storageID, amount, amountDelivery,
        requestResponse, expiredResponse, sign, storeSign, approver, style, status, date, receivedDate, otherID,
        name, description, note, fieldID, value, completeStatus, ctx
	}) {
        return new Promise(async (resolve) => {
            try {
				if (!checkObjectIDs(departmentID, packageID, senderID, propertyID, userID)) {
					return resolve({ 
                        error: true, 
                        message: 'Request params departmentID|packageID|senderID|propertyID invalid', 
                        keyError: 'params_invalid',
                        status: 400 
                    });
                }

                if (!checkNumberIsValidWithRange({ arrValid: DOC_DIRECTION_TYPE, val: direction })) {
                    return resolve({
                        error: true, 
                        message: 'Request params direction invalid', 
                        keyError: 'params_direction_invalid',
                        status: 400 
                    });
                }

                if (!checkNumberIsValidWithRange({ arrValid: DOC_TYPE, val: type })) {
                    return resolve({
                        error: true, 
                        message: 'Request params type invalid', 
                        keyError: 'params_type_invalid',
                        status: 400 
                    });
                }

                let infoDepartment = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST}`, {
                    departmentID
                })
                let companyID = infoDepartment.data.company;
                if(!companyID)
                    return res.json({ error: true, message: "company_invalid" }); 

                let dataInsert = {
                    type,
                    author: userID,
                    company: companyID,
                    project: departmentID,
                    contract: contractID,
                    package: packageID,
                    sender : senderID,
                    property: propertyID,
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
                    value,
                    completeStatus
                }

                amount          && (dataInsert.amount           = +amount || 1);
                amountDelivery  && (dataInsert.amountDelivery   = +amountDelivery || 0);

                (receiverID && checkObjectIDs(receiverID))  && (dataInsert.receiver = receiverID);
                (fieldID    && checkObjectIDs(fieldID))     && (dataInsert.field    = fieldID);
                (otherID    && checkObjectIDs(otherID))     && (dataInsert.other    = otherID);
                (storageID  && checkObjectIDs(storageID))   && (dataInsert.storage  = storageID);

                if(parentID && checkObjectIDs(parentID)){
                    let infoParent = await DOCUMENT__DOC_COLL.findById(parentID).select('level');
                    if(!infoParent)
                    return resolve({
                        error: true, 
                        message: "parentID invalid",
                        keyError: "parentID_invalid",
                        status: 422
                    });
                    dataInsert.parent = parentID;
                    dataInsert.level = +infoParent.level + 1;
                }

				let infoAfterInsert = await this.insertData(dataInsert);

				if (!infoAfterInsert) {
                    return resolve({ 
                        error: true, 
                        message: "Can't create document",
                        keyError: "create_document_failed",
                        status: 422
                    });
                }

                // Call model create document__user
                await DOCUMENT__USER_COLL.create({
                    document: infoAfterInsert._id,
                    user: userID,
                    permission: 1,
                    createAt: timeUtils.getCurrentTime(),
                    modifyAt: timeUtils.getCurrentTime()
                });

                // Chỉ cập nhật numberOfDocs khi tạo văn bản cha
                if(!parentID){
                    // Cập nhật số lượng document cho dự án
                    await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_UPDATE}`, {
                        departmentID, numberOfDocs: 1
                    })
                    
                    // Cập nhật số lượng document cho gói thầu
                    if(packageID && checkObjectIDs(packageID)){
                        await DOCUMENT__PACKAGE_COLL.findByIdAndUpdate(packageID, {
                            $inc: {
                                numberOfDocs: 1
                            }
                        });
                    }
                }

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, keyError: 'server_error', status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;
