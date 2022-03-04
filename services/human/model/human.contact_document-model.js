"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const { KEY_ERROR }                     = require('../../../tools/keys/index');

const _isValid                          = require('mongoose').Types.ObjectId;

/**
 * DOMAIN AND ACTIONS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		    = require('../../item/helper/item.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');

/**
 * COLLECTIONS
 */
const HUMAN__CONTACT_DOCUMENT_COLL      = require('../database/human.contact_document-coll');

class Model extends BaseModel {

    constructor() {
        super(HUMAN__CONTACT_DOCUMENT_COLL);
    }

    /**
     * Name: Insert contactDocument ✅
     * Author: Depv
     * Code: 
     */
    insert({ userCreate, contactID, type, number, status, certificateGrade, fromDate, toDate, workplace, reference, item, project, client, name, place, description, sign, note, store, field2, position2, certificateType, certificateName, educationalBackground2, contract, timeMobilize, factor, ctx }) {
        return new Promise(async resolve => {
            try {
                if(!_isValid(contactID))
                    return resolve({ error: true, message: 'param_not_valid' });

                // call service item contact để lấy thông tin
                let infoContact = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTACT_GET_INFO_AND_GET_LIST}`, {
                    contactID
                })

                if(!infoContact || infoContact.error)
                    return resolve({ error: true, message: 'param_not_valid' });

                //__________Khai báo và validate dữ liệu
                let dataInsert = {
                    userCreate,
                    company: infoContact.data.company,
                    contact: contactID,
                    type: !isNaN(type) ? Number(type) : 1,
                    number: !isNaN(number) ? Number(number) : 0,
                    status: (!isNaN(status) && [1,2].includes(Number(status))) ? Number(status) : 1,
                    certificateGrade: (!isNaN(certificateGrade) && [1,2,3,4].includes(Number(certificateGrade))) ? Number(certificateGrade) : 0,
                    fromDate, 
                    toDate, 
                    workplace, 
                    reference, 
                    item, 
                    project, 
                    client, 
                    name, 
                    place, 
                    description, 
                    sign, 
                    note, 
                    store,
                    timeMobilize :!isNaN(timeMobilize) ? Number(timeMobilize) : 0,
                    factor  : !isNaN(factor) ? Number(factor) : 0
                }

                if(field2 && _isValid(field2)){
                    dataInsert.field2 = field2;
                }

                if(position2 && _isValid(position2)){
                    dataInsert.position2 = position2;
                }

                if(certificateType && _isValid(certificateType)){
                    dataInsert.certificateType = certificateType;
                }

                if(certificateName && _isValid(certificateName)){
                    dataInsert.certificateName = certificateName;
                }
                
                if(educationalBackground2 && _isValid(educationalBackground2)){
                    dataInsert.educationalBackground2 = educationalBackground2;
                }

                if(contract && _isValid(contract)){
                    dataInsert.contract = contract;
                }
                // console.log(dataInsert)

                let infoAfterInsert = await this.insertData(dataInsert);
                // console.log(infoAfterInsert)
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert", keyError: KEY_ERROR.INSERT_FAILED });

                // Cập nhật lại số lượng contact_document cho contact
                let amountWorkHistory, amountProjectHistory, amountContractHistory, amountEducationHistory, amountCertificateHistory;
                if(type == 1) {
                    amountWorkHistory =  "1"
                }

                if(type == 2) {
                    amountProjectHistory =  "1"
                }

                if(type == 3) {
                    amountContractHistory =  "1"
                }

                if(type == 4) { 
                    amountEducationHistory =  "1"
                }

                if(type == 5) {
                    amountCertificateHistory =  "1"
                }
                
                // Cập nhật lại số lượng contact_document cho contact
                await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTACT_UPDATE}`, {
                    contactID, amountWorkHistory, amountProjectHistory, amountContractHistory, amountEducationHistory, amountCertificateHistory
                })

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
    
    /**
     * Name: Update contactDocument ✅
     * Author: Depv
     * Code: 
     */
    update({ authorID, documentID, number, status, certificateGrade, fromDate, toDate, workplace, reference, item, project, client, name, place, description, sign, note, store, field2, position2, certificateType, certificateName, educationalBackground2, contract,  timeMobilize, factor,  filesID, fileRemoveID }){
        return new Promise(async (resolve) => {
            try {
                if(!_isValid(authorID) || !_isValid(documentID))
                    return resolve({ error: true, message: 'param_not_valid' });

                let dataUpdate = {
                    userUpdate: authorID,
                    modifyAt: Date.now(),
                }

                if(!isNaN(number)){
                    dataUpdate.number = number;
                }

                if(!isNaN(status)){
                    dataUpdate.status = status;
                }

                if(!isNaN(certificateGrade) && [0,1,2,3,4,5].includes(Number(certificateGrade))){
                    dataUpdate.certificateGrade = certificateGrade;
                }

                if(fromDate){
                    dataUpdate.fromDate = fromDate;
                }

                if(toDate){
                    dataUpdate.toDate = toDate;
                }
                
                if(workplace){
                    dataUpdate.workplace = workplace;
                }

                if(reference){
                    dataUpdate.reference = reference;
                }

                if(item){
                    dataUpdate.item = item;
                }

                if(project){
                    dataUpdate.project = project;
                }

                if(client){
                    dataUpdate.client = client;
                }

                if(name){
                    dataUpdate.name = name;
                }

                if(place){
                    dataUpdate.place = place;
                }

                if(description){
                    dataUpdate.description = description;
                }

                if(sign){
                    dataUpdate.sign = sign;
                }

                if(note){
                    dataUpdate.note = note;
                }

                if(store){
                    dataUpdate.store = store;
                }

                if(!isNaN(timeMobilize)){
                    dataUpdate.timeMobilize = timeMobilize;
                }

                if(checkObjectIDs(field2)){
                    dataUpdate.field2 = field2;
                }
               
                if(position2 && _isValid(position2)){
                    dataUpdate.position2 = position2;
                }

                if(certificateType && _isValid(certificateType)){
                    dataUpdate.certificateType = certificateType;
                }

                if(certificateName && _isValid(certificateName)){
                    dataUpdate.certificateName = certificateName;
                }

                if(educationalBackground2 && _isValid(educationalBackground2)){
                    dataUpdate.educationalBackground2 = educationalBackground2;
                }

                if(contract && _isValid(contract)){
                    dataUpdate.contract = contract;
                }

                if(factor){
                    dataUpdate.factor = factor;
                }

                if(checkObjectIDs(filesID)){
                    dataUpdate.$addToSet = { files: filesID };
                }   
                
                if(fileRemoveID && _isValid(fileRemoveID)){
                    dataUpdate.$pull = { files: fileRemoveID };
                }
                let infoAfterUpdate = await HUMAN__CONTACT_DOCUMENT_COLL.findByIdAndUpdate(documentID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "cannot_update", keyError: KEY_ERROR.UPDATE_FAILED });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
    * Name: Remove contactDocument ✅
    * Author: Depv
    * Code: 
    */
   remove({ contactDocumentID, ctx }) { 
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
                if(!checkObjectIDs(contactDocumentID))
                   return resolve({ error: true, message: 'Request params contactDocumentID invalid', status: 400 });
             
                /**
                * LOGIC STEP (3)
                * 3.1: Convert type + update name (ví dụ: string -> number)
                * 3.2: Operation database
                */
                let infoAterRemove = await HUMAN__CONTACT_DOCUMENT_COLL.findByIdAndDelete(contactDocumentID)

                if(!infoAterRemove)
                   return resolve({ error: true, message: "can't_remove", keyError: KEY_ERROR.DELETE_FAILED });

                let { contact, type } = infoAterRemove;
                let amountWorkHistory, amountProjectHistory, amountContractHistory, amountEducationHistory, amountCertificateHistory;
                if(type == 1) {
                    amountWorkHistory =  "-1"
                }

                if(type == 2) {
                    amountProjectHistory =  "-1"
                }

                if(type == 3) {
                    amountContractHistory =  "-1"
                }

                if(type == 4) { 
                    amountEducationHistory =  "-1"
                }

                if(type == 5) {
                    amountCertificateHistory =  "-1"
                }

                // Cập nhật lại số lượng contact_document cho contact
                await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.CONTACT_UPDATE}`, {
                    contactID: `${contact}`, amountWorkHistory, amountProjectHistory, amountContractHistory, amountEducationHistory, amountCertificateHistory
                })

                return resolve({ error: false, data: infoAterRemove, status: 200 });
            } catch (error) {
                console.log({ error });
                return resolve({ error: true, message: error.message, status: 500 });
            }
       })
   }

    /**
     * Name: get info contactDocument ✅
     * Author: Depv
     * Code: 
     */
    getInfo({ contactDocumentID, select, populates }) { 
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
                if(!checkObjectIDs(contactDocumentID))
                    return resolve({ error: true, message: 'Request params contactDocumentID invalid', status: 400 });
                
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
                let infoAterGet = await HUMAN__CONTACT_DOCUMENT_COLL.findById(contactDocumentID)
                                    .select(select)
                                    .populate(populates)
                if(!infoAterGet)
                    return resolve({ error: true, message: "can't_get_info", keyError: KEY_ERROR.GET_INFO_FAILED, status: 403 });
 
                return resolve({ error: false, data: infoAterGet, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
    /**
     * Name  : Danh sách contactDocument ✅
     * Author: Depv
     * Code  : 
     */
    getList({
        companyID, type, contactID, isDuration3Month,
        keyword, limit = 10, lastestID, select, populates= {} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {};
                let keys	 = ['createAt__-1', '_id__-1'];
                let sortBy;
               
                /** 
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */
				
                // POPULATE
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
                
                if(checkObjectIDs(companyID)){
                    conditionObj.company = companyID;
                }

                if(type){
                    conditionObj.type = type;
                }

                if(checkObjectIDs(contactID)){
                    conditionObj.contact = contactID;
                }

                if(isDuration3Month == 1){
                    let today = new Date();
                    today.setMonth(today.getMonth() +3); // + Thêm 3 tháng nữa
                    conditionObj.toDate = { $lte: today }
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                
                let conditionObjOrg = { ...conditionObj };
                console.log({ conditionObjOrg });
                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await HUMAN__CONTACT_DOCUMENT_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj = dataPagingAndSort.data.find;
					sortBy = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy       = dataPagingAndSort.data.sort;
                }
                
                let infoDataAfterGet = await HUMAN__CONTACT_DOCUMENT_COLL.find(conditionObj)
                    .select(select)
                    .limit(+limit+1)
                    .sort(sortBy)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", keyError: KEY_ERROR.GET_LIST_FAILED, status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await HUMAN__CONTACT_DOCUMENT_COLL.countDocuments(conditionObjOrg);
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
     * Name: Thống kê chứng chỉ ✅
     * Author: Depv
     * Code: 
     * SCREEN: S18-2.1
     */
    statisticsCertificate({ companyID }) { 
        return new Promise(async (resolve) => {
            try {
                let infoData = await HUMAN__CONTACT_DOCUMENT_COLL.aggregate([
                    {
                        $match: {
                            company: _isValid(companyID),
                            certificateName: { $exists: true }
                        }
                    },
                    { 
                        $group: {
                            _id: { 
                                certificateName:  "$certificateName"
                            }, 
                            amount: { $sum: 1 },
                        } 
                    },
                    {
                        $sort: { "_id.certificateName": 1 }
                    },
                    {
                        $lookup: {
                            from: "doctypes",
                            localField:"_id.certificateName",
                            foreignField: "_id",
                            as: "certificateName"
                        } 
                    },
                    {
                        $unwind: "$certificateName"
                    },
                    {
                        "$project": {
                          "_id": 0,
                          "certificateName.name": 1,
                          "amount": 1
                        }
                    }
                ]);
                if(!infoData)
                    return resolve({ error: true, message: "can't_get", status: 403 });
                
                return resolve({ error: false, data: infoData, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

     /**
     * Name: Thống kê khu vực làm việc ✅
     * Author: Depv
     * Code: 
     * SCREEN: S18-2.4.1
     */
    statistics({ companyID }) { 
        return new Promise(async (resolve) => {
            try {
                let infoData = await HUMAN__CONTACT_DOCUMENT_COLL.aggregate([
                    {
                        $match: {
                            company: _isValid(companyID),
                            certificateName: { $exists: true }
                        }
                    },
                    { 
                        $group: {
                            _id: { 
                                certificateName:  "$certificateName"
                            }, 
                            amount: { $sum: 1 },
                        } 
                    },
                    {
                        $sort: { "_id.certificateName": 1 }
                    },
                    {
                        $lookup: {
                            from: "doctypes",
                            localField:"_id.certificateName",
                            foreignField: "_id",
                            as: "certificateName"
                        } 
                    },
                    {
                        $unwind: "$certificateName"
                    },
                    {
                        "$project": {
                          "_id": 0,
                          "certificateName.name": 1,
                          "amount": 1
                        }
                    }
                ]);
                if(!infoData)
                    return resolve({ error: true, message: "can't_get", status: 403 });
                
                return resolve({ error: false, data: infoData, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;
