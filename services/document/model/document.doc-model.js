"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID                                  	= require('mongoose').Types.ObjectId;
const XlsxPopulate                                  = require('xlsx-populate');
const fs                                            = require('fs');
const path                                          = require('path');
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
const timeUtils									    = require('../../../tools/utils/time_utils');
const { RANGE_BASE_PAGINATION_V2 } 					= require('../../../tools/cursor_base/playground/index');
const { DOC_DIRECTION_TYPE, DOC_TYPE }              = require('../helper/document.keys-constant');
const {
    checkObjectIDs,
    IsJsonString,
    checkNumberIsValidWithRange,
    validateParamsObjectID
} = require('../../../tools/utils/utils');
const { uploadFileS3 } = require('../../../tools/s3');

/**
 * COLLECTIONS
 */
const DOCUMENT__DOC_COLL               				= require('../database/document.doc-coll');
const DOCUMENT__FILE_COLL           				= require('../database/document.doc_file-coll');
const DOCUMENT__PACKAGE_COLL           				= require('../database/document.package-coll');
const DOCUMENT__USER_COLL           				= require('../database/document.user_related-coll');

class Model extends BaseModel {

    constructor() {
        super(DOCUMENT__DOC_COLL);
    }

	/**
	 * Dev: Depv
	 * Func: Tạo mới văn bản
	 * Date: 26/10/2021
	 */
	insert({
        parentID, departmentID, userID, packageID, direction, senderID, receiverID, propertyID, type, contractID, storageID, amount, amountDelivery,
        requestResponse, expiredResponse, sign, storeSign, approver, style, status, date, receivedDate, otherID, datahubContactID,
        name, description, note, fieldID, value, completeStatus, ctx
	}) {
        // console.log({
        //     parentID, departmentID, userID, packageID, direction, senderID, receiverID, propertyID, type, contractID, storageID, amount, amountDelivery,
        //     requestResponse, expiredResponse, sign, storeSign, approver, style, status, date, receivedDate, otherID, datahubContactID,
        //     name, description, note, fieldID, value, completeStatus
        // })
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs(departmentID)) {
					return resolve({
                        error: true,
                        message: 'Request params departmentID invalid',
                        keyError: 'params_invalid',
                    });
                }

                if (!checkObjectIDs(packageID)) {
					return resolve({
                        error: true,
                        message: 'Request params packageID invalid',
                        keyError: 'params_invalid',
                    });
                }

                if (!checkObjectIDs(datahubContactID)) {
					return resolve({
                        error: true,
                        message: 'Request params datahubContactID invalid',
                        keyError: 'params_invalid',
                    });
                }

                if (!checkNumberIsValidWithRange({ arrValid: DOC_DIRECTION_TYPE, val: direction })) {
                    return resolve({
                        error: true,
                        message: 'Request params direction invalid',
                        keyError: 'params_direction_invalid',
                    });
                }

                if (!checkNumberIsValidWithRange({ arrValid: DOC_TYPE, val: type })) {
                    return resolve({
                        error: true,
                        message: 'Request params type invalid',
                        keyError: 'params_type_invalid',
                    });
                }

                // if (!sign) {
                //     return resolve({
                //         error: true,
                //         message: 'Request params sign invalid',
                //         keyError: 'params_type_invalid',
                //     });
                // }

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

                (senderID            && checkObjectIDs(senderID))           && (dataInsert.sender            = senderID);
                (propertyID          && checkObjectIDs(propertyID))         && (dataInsert.property          = propertyID);
                (receiverID          && checkObjectIDs(receiverID))         && (dataInsert.receiver          = receiverID);
                (fieldID             && checkObjectIDs(fieldID))            && (dataInsert.field             = fieldID);
                (datahubContactID    && checkObjectIDs(datahubContactID))   && (dataInsert.datahubContact    = datahubContactID);
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
                }else{
                    if(checkObjectIDs(parentID)){
                        await DOCUMENT__DOC_COLL.findByIdAndUpdate(parentID, { $inc: { amountDocumentChild: 1 }, new: true })
                    }
                }

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, keyError: 'server_error', status: 500 });
            }
        })
    }

    /**
	 * Dev: Depv
	 * Func: Cập nhật văn bản
	 * Date: 28/10/2021
	 */
    update({
		documentID, userID, packageID, direction, senderID, receiverID, propertyID, type, contractID, storageID, amount, amountDelivery,
        requestResponse, expiredResponse, sign, storeSign, approver, style, status, date, receivedDate, datahubContactID,
        name, description, note, fieldID, value, completeStatus, otherID, ctx
	}) {
        // console.log({
        //     documentID, userID, packageID, direction, senderID, receiverID, propertyID, type, contractID, storageID, amount, amountDelivery,
        //     requestResponse, expiredResponse, sign, storeSign, approver, style, status, date, receivedDate, datahubContactID,
        //     name, description, note, fieldID, value, completeStatus, otherID
        // })
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs(documentID, packageID, datahubContactID, userID)) {
					return resolve({
                        error: true,
                        message: 'Request params departmentID|packageID|datahubContactID invalid',
                        keyError: 'params_invalid',
                        status: 400
                    });
                }

                if (direction && !checkNumberIsValidWithRange({ arrValid: DOC_DIRECTION_TYPE, val: direction })) {
                    return resolve({
                        error: true,
                        message: 'Request params direction invalid',
                        keyError: 'params_direction_invalid',
                        status: 400
                    });
                }

                if (requestResponse && !checkNumberIsValidWithRange({ arrValid: [0,1], val: requestResponse })) {
                    return resolve({
                        error: true,
                        message: 'Request params requestResponse invalid',
                        keyError: 'paramas_requestResponse_invalid',
                        status: 400
                    });
                }

                let dataUpdate = {
                    userUpdate: userID,
                    modifyAt: Date.now()
                }

                if(name){
                    dataUpdate.name = name;
                }

                if(sign){
                    dataUpdate.sign = sign;
                }

                if(storeSign){
                    dataUpdate.storeSign = storeSign;
                }

                if(approver){
                    dataUpdate.approver = approver;
                }

                if(date){
                    dataUpdate.date = date;
                }

                if(receivedDate){
                    dataUpdate.receivedDate = receivedDate;
                }

                if(style){
                    dataUpdate.style = style;
                }

                if(status){
                    dataUpdate.status = status;
                }

                if(expiredResponse){
                    dataUpdate.expiredResponse = expiredResponse;
                }

                if(contractID){
                    dataUpdate.contract = contractID;
                }

                if(note){
                    dataUpdate.note = note;
                }

                if(description){
                    dataUpdate.description = description;
                }

                if(!isNaN(value)){
                    dataUpdate.value = value;
                }

                if(!isNaN(completeStatus)){
                    dataUpdate.completeStatus = completeStatus;
                }

                direction       && (dataUpdate.direction        = +direction || 1);
                requestResponse && (dataUpdate.requestResponse  = +requestResponse || 0);
                amount          && (dataUpdate.amount           = +amount || 1);
                amountDelivery  && (dataUpdate.amountDelivery   = +amountDelivery || 0);

                if(type && checkNumberIsValidWithRange({ arrValid: DOC_TYPE, val: type })){
                    dataUpdate.type = +type;
                }

                (packageID           && checkObjectIDs(packageID))          && (dataUpdate.package  = packageID);
                (senderID            && checkObjectIDs(senderID))           && (dataUpdate.sender   = senderID);
                (receiverID          && checkObjectIDs(receiverID))         && (dataUpdate.receiver = receiverID);
                (fieldID             && checkObjectIDs(fieldID))            && (dataUpdate.field    = fieldID);
                (datahubContactID    && checkObjectIDs(datahubContactID))   && (dataUpdate.datahubContact    = datahubContactID);
                (otherID    && checkObjectIDs(otherID))     && (dataUpdate.other    = otherID);
                (propertyID && checkObjectIDs(propertyID))  && (dataUpdate.property = propertyID);
                (storageID  && checkObjectIDs(storageID))   && (dataUpdate.storage  = storageID);

				let infoAfterUpdate = await this.updateWhereClause({ _id: documentID }, dataUpdate);

				if (!infoAfterUpdate) {
                    return resolve({
                        error: true,
                        message: "Can't update document",
                        keyError: "update_document_failed",
                        status: 422
                    });
                }

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, keyError: 'server_error', status: 500 });
            }
        })
    }

    /**
	 * Dev: Depv
	 * Func: Xóa văn bản
	 * Date: 30/10/2021
	 */
    // remove({ documentID, userID }){
    //     return new Promise(async resolve => {
    //         try {
    //             if (!checkObjectIDs([documentID, userID])) {
    //                 return resolve({
    //                     error: true,
    //                     message: 'Request params documentID or userID invalid',
    //                     keyError: 'params_documentID_or_userID_invalid',
    //                     status: 400
    //                 });
    //             }

    //             let checkPermission = await DOCUMENT__USER_COLL.findOne({
    //                 document: documentID,
    //                 user: userID,
    //                 permission: 1
    //             }).lean()

    //             if(!checkPermission) {
    //                 return resolve({
    //                     error: true,
    //                     message: "Permission denined",
    //                     keyError: "permission_denined_document",
    //                     status: 403
    //                 });
    //             }

    //             const infoAfterDelete = await DOCUMENT__DOC_COLL.findByIdAndDelete(documentID);

    //             if(!infoAfterDelete) {
    //                 return resolve({
    //                     error: true,
    //                     message: "Can't delete document",
    //                     keyError: "delete_document_failed",
    //                     status: 422
    //                 });
    //             }

    //             return resolve({ error: false, message: "Remove Success", status: 200 });
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message, keyError: "server_error", status: 500 });
    //         }
    //     })
    // }

     /**
     * Name: get văn bản
     * Author: Depv
     * Code:
     */
    getInfo({ documentID, select, populates }) {
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
                if(!checkObjectIDs(documentID))
                    return resolve({ error: true, message: 'Request params documentID invalid', status: 400 });

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
                let infoAterGet = await DOCUMENT__DOC_COLL.findById(documentID)
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
     * Name  : Danh sách văn bản + Tìm kiếm văn bản
     * Author: Depv
     * Update: HiepNH
     * Code  : 25/8/2022
     */
    getList({
        parentID, companyID, packageID, direction, senderID, receiverID, propertyID, type, contractID, storageID, datahubContactID, isExportExcel = false,
        requestResponse, fieldID, fromDate, toDate, marked, userID, departmentID, receivedDate = {},
        keyword, limit = 30, lastestID, select, populates= {} }) {
            // console.log('========12345========================>>>>>>>>>>>>')
            // console.log({parentID, companyID, packageID, direction, senderID, receiverID, propertyID, type, contractID, storageID, datahubContactID, isExportExcel,
            //     requestResponse, fieldID, fromDate, toDate, marked, userID, departmentID, receivedDate,
            //     keyword, limit})
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {};
                let sortBy;
                let keys	     = ['createAt__-1', '_id__-1'];

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
                if(limit > 30){
                    limit = 30;
                } else{
                    limit = +limit;
                }

                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				} else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                // Ngày nhận văn bản
                if(receivedDate && typeof receivedDate === 'string'){
					if(!IsJsonString(receivedDate))
						return resolve({ error: true, message: 'Request params receivedDate invalid', status: 400 });

					receivedDate = JSON.parse(receivedDate);
				}

                if(receivedDate){
                    let fromDate = receivedDate.from;
                    let toDate   = receivedDate.to;
                    // Lấy những văn bản từ ngày đến ngày
                    if(fromDate && toDate){
                        conditionObj.receivedDate = { $gte: new Date(fromDate), $lte: moment(new Date(toDate)).endOf('day')._d }
                    }
                }

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                // User phải nằm trong member của gói thầu.
                let listPackageAccess = await DOCUMENT__PACKAGE_COLL.find({ members: { $in: [userID]} })?.select("_id");
                if(listPackageAccess.length){
                    conditionObj.package = { $in: listPackageAccess.map(item => item._id )}
                } else{
                    return resolve({ error: true, message: "Bạn chưa nằm trong gói thầu nào", keyError: "user_not_members_in_package" });
                }

                if(companyID){
                    conditionObj.company = companyID
                }

                if(datahubContactID){
                    conditionObj.datahubContact = datahubContactID
                }

                if(type){
                    conditionObj.type = type
                }

                if(fromDate && toDate){
                    conditionObj.date = { $gte: new Date(fromDate), $lt: moment(toDate, 'YYYY-MM-DD').endOf('day')._d }
                }

                if(packageID){
                    conditionObj.package = packageID
                }

                if(direction){
                    conditionObj.direction = direction
                }

                if(checkObjectIDs(senderID)){
                    conditionObj.sender = senderID
                }

                if(checkObjectIDs(receiverID)){
                    conditionObj.receiver = receiverID
                }

                if(checkObjectIDs(propertyID)){
                    conditionObj.property = propertyID
                }

                if(checkObjectIDs(contractID)){
                    conditionObj.contract = contractID
                }

                if(checkObjectIDs(storageID)){
                    conditionObj.storage = storageID
                }

                if(requestResponse){
                    conditionObj.requestResponse = requestResponse
                }

                if(checkObjectIDs(fieldID)){
                    conditionObj.field = fieldID
                }

                if(checkObjectIDs(departmentID)){
                    conditionObj.project = departmentID
                }

                if(checkObjectIDs(parentID)){
                    conditionObj.parent = parentID
                } else{
                    conditionObj.parent = { $exists: false }
                }

                if(marked){
                    conditionObj.usersMarked = { $in: [userID] }
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    const regSearch = new RegExp(keyword, 'i');

                    conditionObj.$or = [
                        { name: regSearch },
                        { sign: regSearch },
                    ]
                }

                /**
                 * Purpose: Sử dụng trong export excel document (hoặc theo bộ lọc)
                 * Function: exportDocument (model)
                 */
                if(isExportExcel) {
                    return resolve({ data: conditionObj, error: false });
                }

                let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await DOCUMENT__DOC_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj  = dataPagingAndSort.data.find;
					sortBy        = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy                = dataPagingAndSort.data.sort;
                }

                console.log(conditionObj.type);

                let infoDataAfterGet = await DOCUMENT__DOC_COLL.find(conditionObj)
                    .limit(limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]?._id;
                        infoDataAfterGet.length = limit;
                    }
                }
                let totalRecord = await DOCUMENT__DOC_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: limit,
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
     * Name  : Tìm kiếm văn bản
     * Author: HiepNH
     * Code  : 29/8/2022
     */
    getListByFilter({
        parentID, companyID, packagesID, directions, sendersID, receiverID, propertysID, types, contractsID, storagesID, datahubContactsID, isExportExcel = false,
        requestResponse, fieldsID, fromDate, toDate, marked, userID, departmentsID,
        keyword, limit = 20, lastestID, select, populates= {} }) {
            // console.log({
            //     parentID, companyID, packagesID, directions, sendersID, receiverID, propertysID, types, contractsID, storagesID, datahubContactsID, isExportExcel,
            //     requestResponse, fieldsID, fromDate, toDate, marked, userID, departmentsID,
            //     keyword, limit, lastestID, select, populates })
        return new Promise(async (resolve) => {
            try {
                /**
                 * VALIDATION (1)
                 */
                const validation = validateParamsObjectID({
                    packagesID              : { value: packagesID, isRequire: false },
                    sendersID               : { value: sendersID, isRequire: false },
                    propertysID             : { value: propertysID, isRequire: false },
                    fieldsID                : { value: fieldsID, isRequire: false },
                    contractsID             : { value: contractsID, isRequire: false },
                    datahubContactsID       : { value: datahubContactsID, isRequire: false },
                    departmentsID           : { value: departmentsID, isRequire: false },
                    storagesID              : { value: storagesID, isRequire: false },
                });
                if(validation.error) return resolve(validation);

                if(populates && typeof populates === 'string'){
					if(!IsJsonString(populates))
						return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

					populates = JSON.parse(populates);
				} else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                /**
                 * DECALARTION VARIABLE (2)
                 */
                let conditionObj = {};
                let sortBy;
                let keys	     = ['createAt__-1', '_id__-1'];

                /**
                 * LOGIC CODE (3)
                 */
                if(limit > 50){
                    limit = 50;
                } else{
                    limit = +limit;
                }

                /**
                * User phải nằm trong member của gói thầu
                */
                let listPackageAccess = await DOCUMENT__PACKAGE_COLL.find({ members: { $in: [userID]} })?.select("_id");
                if(listPackageAccess.length){
                    conditionObj.package = { $in: listPackageAccess.map(item => item._id )}
                } else{
                    return resolve({ error: true, message: "Bạn chưa nằm trong gói thầu nào", keyError: "user_not_members_in_package" });
                }

                /**
                 * Bộ lọc với nhiều lựa chọn
                 */
                directions && directions.length                 && (conditionObj.direction = { $in: directions });
                types && types.length                           && (conditionObj.type = { $in: types });
                propertysID && propertysID.length               && (conditionObj.property = { $in: propertysID });
                fieldsID && fieldsID.length                     && (conditionObj.field = { $in: fieldsID });
                packagesID && packagesID.length                 && (conditionObj.package = { $in: packagesID });
                sendersID && sendersID.length                   && (conditionObj.sender = { $in: sendersID });
                contractsID && contractsID.length               && (conditionObj.contract = { $in: contractsID });
                datahubContactsID && datahubContactsID.length   && (conditionObj.datahubContact = { $in: datahubContactsID });
                departmentsID && departmentsID.length           && (conditionObj.project = { $in: departmentsID });
                storagesID && storagesID.length                 && (conditionObj.storage = { $in: storagesID });

                // Ngày nhận văn bản
                if(fromDate && toDate){
                    conditionObj.receivedDate = { $gte: new Date(fromDate), $lt: moment(toDate, 'YYYY-MM-DD').endOf('day')._d }
                }

                if(companyID){
                    conditionObj.company = companyID
                }

                if(checkObjectIDs(receiverID)){
                    conditionObj.receiver = receiverID
                }

                if(requestResponse){
                    conditionObj.requestResponse = requestResponse
                }

                if(checkObjectIDs(parentID)){
                    conditionObj.parent = parentID
                } else{
                    conditionObj.parent = { $exists: false }
                }

                if(marked){
                    conditionObj.usersMarked = { $in: [userID] }
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    const regSearch = new RegExp(keyword, 'i');

                    conditionObj.$or = [
                        { name: regSearch },
                        { sign: regSearch },
                        { storeSign: regSearch },
                    ]
                }

                /**
                 * Purpose: Sử dụng trong export excel document (hoặc theo bộ lọc)
                 * Function: exportDocument (model)
                 */
                if(isExportExcel) {
                    return resolve({ data: conditionObj, error: false });
                }

                let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await DOCUMENT__DOC_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj  = dataPagingAndSort.data.find;
					sortBy        = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy                = dataPagingAndSort.data.sort;
                }

                // console.log({ conditionObj });

                let infoDataAfterGet = await DOCUMENT__DOC_COLL.find(conditionObj)
                    .limit(limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]?._id;
                        infoDataAfterGet.length = limit;
                    }
                }
                let totalRecord = await DOCUMENT__DOC_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: limit,
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
     * Dev: MinhVH
     * Func: Thông kê số lượng văn bản theo type
     * Date: 27/10/2021
     */
    statisticalByType({ userID, companyID, departmentID, packageID }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs([userID])) {
                    return resolve({
                        error: true,
                        message: 'Request params userID invalid',
                        keyError: 'params_userID_invalid',
                        status: 400
                    });
                }

                if(departmentID && !checkObjectIDs([departmentID])) {
                    return resolve({
                        error: true,
                        message: 'Request params departmentID invalid',
                        keyError: 'params_departmentID_invalid',
                        status: 400
                    });
                }

                if(packageID && !checkObjectIDs([packageID])) {
                    return resolve({
                        error: true,
                        message: 'Request params packageID invalid',
                        keyError: 'params_packageID_invalid',
                        status: 400
                    });
                }

                let conditionObj = {};
                let listDoctype = [];
                // companyID       && (conditionObj.company = ObjectID(companyID));
                departmentID    && (conditionObj.project = ObjectID(departmentID));

                // User phải nằm trong members của gói thầu.
                let listPackageAccess = await DOCUMENT__PACKAGE_COLL.find({ members: { $in: [userID]} }).select("_id");
                // if(listPackageAccess.length){
                //     conditionObj.package = { $in: listPackageAccess.map(item => item._id )}
                // }
                packageID       && (conditionObj.package = ObjectID(packageID));
                let	listDoctypeGroupByType = await DOCUMENT__DOC_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $group: {
                            _id: "$type",
                            totalDocument: { $sum: 1 }
                        }
                    },
                    {
                        $sort: { _id: 1 }
                    }
                ])

                let	listDoctypeGroupByWeek = await DOCUMENT__DOC_COLL.aggregate([
                    {
                        $match: {
                            ...conditionObj,
                            createAt: {
                                $gte: ISOdate(moment().startOf('month').format()),
                                $lte: ISOdate(moment().endOf('month').format()),
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$type",
                            totalDocument: { $sum: 1 }
                        }
                    },
                    {
                        $sort: { _id: 1 }
                    }
                ])

                if(listDoctypeGroupByType.length){
                    listDoctypeGroupByType.map(doctype => {
                        const doctypeHaveNewDocumentInWeek = listDoctypeGroupByWeek.find(newDoc => newDoc._id === doctype._id)
                        listDoctype[listDoctype.length] = {
                            type: doctype._id,
                            totalDocument: doctype.totalDocument,
                            totalDocumentNew: doctypeHaveNewDocumentInWeek ? doctypeHaveNewDocumentInWeek.totalDocument : 0
                        }
                    })
                }

                if(!listDoctype) {
                    return resolve({
                        error: true,
                        message: "Can't get list doctype",
                        keyError: "get_list_doctype_failed",
                        status: 403
                    });
                }

                return resolve({
                    error: false,
                    status: 200,
                    data: {
                        listRecords: listDoctype
                    }
                });
            } catch (error) {
                return resolve({ error: true, message: error.message, keyError: 'server_error', status: 500 })
            }
        })
    }

    /**
     * Dev: MinhVH
     * Func: Thông kê số lượng văn bản theo datahubContact
     * Date: 27/10/2021
     */
    statisticalByDatahubContact({ userID, companyID, departmentID, packageID }) {
        return new Promise(async (resolve) => {
            try {
                if(departmentID && !checkObjectIDs([departmentID])) {
                    return resolve({
                        error: true,
                        message: 'Request params departmentID invalid',
                        keyError: 'params_departmentID_invalid',
                        status: 400
                    });
                }

                if(packageID && !checkObjectIDs([packageID])) {
                    return resolve({
                        error: true,
                        message: 'Request params packageID invalid',
                        keyError: 'params_packageID_invalid',
                        status: 400
                    });
                }

                let conditionObj = {};
                let listDoctype = [];
                departmentID    && (conditionObj.project = ObjectID(departmentID));
                // Nếu không có dự án thì lấy theo công ty
                if(!departmentID){
                    companyID && (conditionObj.company = ObjectID(companyID));
                }

                // User phải nằm trong members của gói thầu.
                // let listPackageAccess = await DOCUMENT__PACKAGE_COLL.find({ members: { $in: [userID]} }).select("_id");
                // if(listPackageAccess.length){
                //     conditionObj.package = { $in: listPackageAccess.map(item => item._id )}
                // }
                packageID       && (conditionObj.package = ObjectID(packageID));
                conditionObj.datahubContact = { $exists: true }
                let	listDoctypeGroupByType = await DOCUMENT__DOC_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $group: {
                            _id: "$datahubContact",
                            totalDocument: { $sum: 1 }
                        }
                    },
                    {
                        $sort: { _id: 1 }
                    }
                ])

                let	listDoctypeGroupByWeek = await DOCUMENT__DOC_COLL.aggregate([
                    {
                        $match: {
                            ...conditionObj,
                            createAt: {
                                $gte: ISOdate(moment().startOf('month').format()),
                                $lte: ISOdate(moment().endOf('month').format()),
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$datahubContact",
                            totalDocument: { $sum: 1 }
                        }
                    },
                    {
                        $sort: { _id: 1 }
                    }
                ]);

                if(listDoctypeGroupByType.length){
                    listDoctypeGroupByType.map(doctype => {
                        const doctypeHaveNewDocumentInWeek = listDoctypeGroupByWeek.find(newDoc => newDoc._id.toString() == doctype._id.toString())
                        listDoctype[listDoctype.length] = {
                            datahubContact: doctype._id,
                            totalDocument: doctype.totalDocument,
                            totalDocumentNew: doctypeHaveNewDocumentInWeek ? doctypeHaveNewDocumentInWeek.totalDocument : 0
                        }
                    })
                }

                await DOCUMENT__DOC_COLL.populate(listDoctype, {
                    path: "datahubContact",
                    select: "name",
                    model: "datahub_contact"
                })

                if(!listDoctype) {
                    return resolve({
                        error: true,
                        message: "Can't get list doctype",
                        keyError: "get_list_doctype_failed",
                        status: 403
                    });
                }

                return resolve({
                    error: false,
                    status: 200,
                    data: {
                        listRecords: listDoctype
                    }
                });
            } catch (error) {
                return resolve({ error: true, message: error.message, keyError: 'server_error', status: 500 })
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

                let checkPermission = await DOCUMENT__USER_COLL.findOne({
                    document: documentID,
                    user: authorID,
                    permission: 1
                }).lean()

                if(!checkPermission)
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

                let checkPermission = await DOCUMENT__USER_COLL.findOne({
                    document: documentID,
                    user: authorID,
                    permission: 1
                }).lean();

                if(!checkPermission)
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

                let conditionObj  = { document: documentID };
                let sortBy;
                let keys	 = ['modifyAt__-1', '_id__-1'];


                let conditionObjOrg = { ...conditionObj };
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await DOCUMENT__DOC_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy       = dataPagingAndSort.data.sort;
                }

                let	listUserShared = await DOCUMENT__USER_COLL
                    .find(conditionObj)
                    .populate('document', select.document)
                    .populate('user', select.user)
                    .limit(limit + 1)
                    .sort(sortBy)
                    .lean();

                if(!listUserShared)
                    return resolve({ error: true, message: "Can't get list user shared", status: 400 });

                // GET TOTAL RECORD
                let totalRecord = await DOCUMENT__USER_COLL.count(conditionObjOrg);
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
                    return resolve({ error: true, message: 'Request params authorID invalid' });

                if(!checkObjectIDs([documentID]))
                    return resolve({ error: true, message: 'Request params documentID invalid' });

                if(!filesID || !filesID.length || !checkObjectIDs(filesID))
                    return resolve({ error: true, message: 'Request params filesID invalid' });

                const listFilesInsert = filesID.map(file => ({
                    document: documentID,
                    user: authorID,
                    file,
                    createAt: timeUtils.getCurrentTime(),
                    modifyAt: timeUtils.getCurrentTime()
                }))

                let infoAfterInsert = await DOCUMENT__FILE_COLL.insertMany(listFilesInsert);

                if(!infoAfterInsert)
                    return resolve({ error: true, message: 'Add files attachment failed' });
                const infoAfterInsertTemp = [...infoAfterInsert];
                //Cập nhật trường lastFile vào trong document
                const infoLastFile = infoAfterInsertTemp.pop();
                await DOCUMENT__DOC_COLL.findByIdAndUpdate(documentID, { lastFile: infoLastFile.file }, { new: true });
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

    /**
	 * Dev: MinhVH
	 * Func: Đánh dấu hồ sơ
	 * Date: 30/12/2021
	 */
    updateMarkDocument({ userID, documentID, isMark }) {
        return new Promise(async (resolve) => {
            try {

                if(!checkObjectIDs(documentID)) {
                    return resolve({
                        error: true,
                        message: 'Request params documentID invalid',
                        keyError: 'params_documentID_invalid',
                        status: 400
                    });
                }

                // let checkPermission = await DOCUMENT__USER_COLL.findOne({
                //     document: documentID,
                //     user: userID,
                // }).lean()

                // if(!checkPermission) {
                //     return resolve({
                //         error: true,
                //         message: 'Permission denined document',
                //         keyError: 'permission_denined_document',
                //         status: 403
                //     });
                // }

                let infoAfterUpdate = null;

                if(isMark) {
                    infoAfterUpdate = await DOCUMENT__DOC_COLL.findByIdAndUpdate(documentID, {
                        $addToSet: {
                            usersMarked: userID
                        }
                    }, { new: true });
                } else{
                    infoAfterUpdate = await DOCUMENT__DOC_COLL.findByIdAndUpdate(documentID, {
                        $pull: {
                            usersMarked: userID
                        }
                    }, { new: true });
                }

                if(!infoAfterUpdate) {
                    return resolve({
                        error: true,
                        message: "Can't highlight document",
                        keyError: 'highlight_document_failed',
                        status: 422
                    });
                }

                return resolve({
                    error: false,
                    status: 200,
                    data: infoAfterUpdate
                });
            } catch (error) {
                return resolve({ error: true, message: error.message, keyError: 'server_error', status: 500 });
            }
        })
    }

    /**
     * Name: Lấy số lượng công việc của tất cả project mà user là members
     * Author: Depv
     */
    getAmountDocumentByProjects({ userID, fromDate, toDate, ctx }){
        return new Promise(async resolve => {
            try {
                // Call service list project
                let listProject = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.DEPARTMENT_GET_LIST_IS_MEMBERS}`, {
                    unLimit: true, select: "sign name"
                });
                listProject       = listProject?.data|| [];

                let listProjectID = listProject.map(project => ObjectID(project._id));
                let conditionObj = { project: { $in: listProjectID } };

                if(fromDate && toDate){
                    conditionObj.createAt = { $gte: new Date(fromDate), $lt: moment(toDate, 'YYYY-MM-DD').endOf('day')._d }
                }

                // Số lượng công việc trong mỗi dự án
                let listAmountDocument = await DOCUMENT__DOC_COLL.aggregate([
                    { $match: conditionObj },
                    { $group: {
                        _id: "$project",
                        amount: { $sum: 1 }
                    }},
                    { $sort: { _id: -1} }
                ]);

                return resolve({ error: false, data: { listProject, listAmountDocument } });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Dev: MinhVH
     * Func: Download Excel Document
     * Date: 27/06/2022
     */
    exportDocument({ userID, filterParams = {} }) {
        return new Promise(async resolve => {
            try {
                const validation = validateParamsObjectID({ userID });
                if(validation.error) return resolve(validation);
                let conditionObj = {};
                let sortBy;
                let keys	     = ['createAt__-1', '_id__-1'];

                const { data, error } = await this.getListByFilter({
                    ...filterParams,
                    userID,
                    isExportExcel: true
                });

                if(!error) {
                    conditionObj = { ...data };
                }

                let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObj });
                sortBy                = dataPagingAndSort.data.sort;

                const listDocument = await DOCUMENT__DOC_COLL
                    .find(conditionObj)
                    .populate({
                        path: 'author package sender receiver datahubContact field property storage',
                        select: '_id bizfullname name',
                    })
                    .sort(sortBy)
                    .lean();

                if(!listDocument) {
                    return resolve({
                        error: true,
                        message: 'Không tìm thấy hồ sơ văn bản',
                        keyError: 'documents_not_exists',
                        status: 400
                    });
                }

                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/document_2_ListDocument.xlsm')))
                    .then(async workbook => {

                        let indexExcel = 3;
                        const DATE_FORMAT = 'DD/MM/YYYY';

                        listDocument.map((document, index) => {
                            const {
                                name, sign, storeSign, date, receivedDate, style, author,
                                amountDelivery, status, amount, modifyAt, note, direction,
                                sender, receiver, datahubContact, field, property, storage, package: packageInfo
                            } = document;

                            const currRow = workbook.sheet("Data").row(indexExcel);

                            currRow.cell(1).value(index+1);

                            // Người tạo văn bản
                            currRow.cell(2).value(author?.bizfullname);

                            // Ngày chỉnh sửa
                            if(modifyAt) {
                                currRow.cell(3).value(moment(modifyAt).format(DATE_FORMAT));
                            }

                            // Tiêu đề hồ sơ
                            name && currRow.cell(4).value(name);

                            // Mã hiệu
                            sign && currRow.cell(5).value(sign);

                            // Mã hiệu hồ sơ lưu
                            storeSign && currRow.cell(6).value(storeSign);

                            // Ngày văn bản
                            if(date) {
                                currRow.cell(7).value(moment(date).format(DATE_FORMAT));
                            }

                            // Ngày nhận thực tế
                            if(receivedDate) {
                                currRow.cell(8).value(moment(receivedDate).format(DATE_FORMAT));
                            }

                            // Định dạng văn bản (nhận dạng)
                            style && currRow.cell(9).value(style);

                            // Tình trạng
                            status && currRow.cell(10).value(status);

                            // SL nhận
                            amount && currRow.cell(11).value(amount);

                            // SL giao
                            amountDelivery && currRow.cell(12).value(amountDelivery);

                            // Ghi chú
                            note && currRow.cell(13).value(note);

                            // Hướng hồ sơ
                            switch (direction) {
                                case 1:
                                    currRow.cell(14).value('Đến');
                                    break;
                                case 2:
                                    currRow.cell(14).value('Đi');
                                    break;
                                case 3:
                                    currRow.cell(14).value('Nội bộ');
                                    break;
                                default:
                                    break;
                            }

                            // Gói thầu
                            if(packageInfo) {
                                currRow.cell(15).value(packageInfo.name);
                            }

                            // Chủ thế ban hành
                            if(sender) {
                                currRow.cell(16).value(sender.name);
                            }

                            // Chủ thể nhận
                            if(receiver) {
                                currRow.cell(17).value(receiver.name);
                            }

                            // Cơ quan tổ chức
                            if(datahubContact) {
                                currRow.cell(18).value(datahubContact.name);
                            }

                            // Lĩnh vực
                            if(field) {
                                currRow.cell(19).value(field.name);
                            }

                            // Tính chất
                            if(property) {
                                currRow.cell(20).value(property.name);
                            }

                            // Lưu trữ
                            if(storage) {
                                currRow.cell(21).value(storage.name);
                            }

                            indexExcel++;
                        })

                        // const rangeUsed = workbook.sheet("Data").usedRange();
                        const range = workbook.sheet('Data').range(`A3:U${listDocument.length + 2}`);

                        range.style({
                            fontFamily: 'Times New Roman',
                            fontColor: 'black',
                            fontSize: 13,
                            bold: false,
                            horizontalAlignment: 'center',
                            border: true,
                            borderColor: 'black',
                            wrapText: true,
                        })

                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `document_2_ListDocument${now.getTime()}.xlsm`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                        await workbook.toFileAsync(pathWriteFile);

                        const result = await uploadFileS3(pathWriteFile, fileName);
                        fs.unlinkSync(pathWriteFile);

                        return resolve({ error: false, data: result?.Location, status: 200 });
                    });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;