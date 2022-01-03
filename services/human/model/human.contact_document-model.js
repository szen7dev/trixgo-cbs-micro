"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const _isValid                          = require('mongoose').Types.ObjectId;

/**
 * DOMAIN AND ACTIONS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		    = require('../../item/helper/item.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION } 	    = require('../../../tools/cursor_base/playground/index');
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
                    return resolve({ error: true, message: "cannot_insert" });

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
    update({ authorID, documentID, number, status, certificateGrade, fromDate, toDate, workplace, reference, item, project, client, name, place, description, sign, note, store, field2, position2, certificateType, certificateName, educationalBackground2, contract,  timeMobilize, factor }){
        return new Promise(async (resolve) => {
            try {
                if(!_isValid(authorID) || !_isValid(documentID))
                    return resolve({ error: true, message: 'param_not_valid' });

                let dataUpdate = {
                    userUpdate: authorID,
                    modifyAt: Date.now(),
                    number: !isNaN(number) ? Number(number) : 0,
                    status: (!isNaN(status) && [1,2].includes(Number(status))) ? Number(status) : 1,
                    certificateGrade: (!isNaN(certificateGrade) && [0,1,2,3,4,5].includes(Number(certificateGrade))) ? Number(certificateGrade) : 0,
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
                    timeMobilize : !isNaN(timeMobilize) ? Number(timeMobilize) : 0,
                    factor: !isNaN(factor) ? Number(factor) : 0,
                }

                if(field2 && _isValid(field2)){
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

                let infoAfterUpdate = await HUMAN__CONTACT_DOCUMENT_COLL.findByIdAndUpdate(documentID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "cannot_update" });

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
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
                    return resolve({ error: true, message: "can't_get_info", status: 403 });
 
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
        companyID, type, contactID,
        keyword, limit = 10, lastestID, select, populates= {} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { 
                    // company: companyID
                };

                let conditionFind = { };
                let sortBy   = { createAt: -1 };
				let objSort  = {};

                let start = new Date();
                start.setHours(0,0,0,0);

                let end = new Date();
                end.setHours(23,59,59,999);

                function addDate(days) {
                    let date = new Date();
                    date.setDate(date.getDate() + days);
                    return date;
                }
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

                if(!checkObjectIDs(companyID))
                    return resolve({ error: true, message: 'Request params companyID invalid', status: 400 });

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                

                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await HUMAN__CONTACT_DOCUMENT_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

					let nextInfo = `${infoData.createAt}_${infoData._id}`;
                    // Lưu ý nêu sắp xếp tăng dần thì sửa lại ['createAt__1', '_id__1'];
					let keys	 = ['createAt__-1', '_id__-1'];
                    // console.log({ nextInfo });
					let dataPagingAndSort = await RANGE_BASE_PAGINATION({ nextInfo, keys });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });
					conditionFind = dataPagingAndSort.data.find;
					sortBy = dataPagingAndSort.data.sort;
				}
                
				if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }

				if(type){
					conditionObj.type = type;
				}

				if(checkObjectIDs(contactID)){
					conditionObj.contact = contactID;
				}
                
                let infoDataAfterGet = await HUMAN__CONTACT_DOCUMENT_COLL.find({...conditionObj, ...conditionFind }, { ...objSort })
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

                let totalRecord = await HUMAN__CONTACT_DOCUMENT_COLL.countDocuments(conditionObj);
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
