"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, checkNumberIsValidWithRange, checkNumberValid, IsJsonString }                        
                                        = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const { RANGE_BASE_PAGINATION, RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');


const { getCurrentPage }			    = require('../../../tools/utils/calculate_current_page');
const _isValid                          = require('mongoose').Types.ObjectId;

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../helper/item.actions-constant');

/**
 * TOOLS
 */

/**
 * COLLECTIONS
 */
const ITEM__CONTACT_COLL            				= require('../database/item.contact-coll');

class Model extends BaseModel {

    constructor() {
        super(ITEM__CONTACT_COLL);
    }

    /**
     * Name: Thêm danh bạ, nhân sự ✅
     * Author: Depv
     * Code: 
     */
    insert({ company, authorID, parent, type, name, description, sign, address, taxid, birthday, province, gender, phone, email, department, position, linkUser, status, field, property, linkSale, workingStatus, realStatus, 
        insuranceStatus, familyPolicy, contractType, contractSign, family, identity, dateProvice, place, area, area1, area2, insuranceSign, insuranceDate, sallaryFactor, sallarySubFactor, sallaryBasic, signerIn,
        signerOut, workStartDate, dayOff, appointDate, changeSallaryDate, contractDate, contractValid, contractExpire
    }) {
        return new Promise(async resolve => {
            try {
                if(!name || !_isValid(company) || !_isValid(authorID))
                    return resolve({ error: true, message: 'param_not_valid' });

                //___________Kiểm tra việc trùng mã hiệu
                let conditionObj = {
                    company: company
                };
                if((sign && sign != "") || (taxid && taxid != "")){
                    conditionObj.$or = []
                }
                if((sign && sign != "")){
                    conditionObj.$or.push({sign: sign})
                }
                if((taxid && taxid != "")){
                    conditionObj.$or.push({taxid: taxid})
                }
                let infoContact = await ITEM__CONTACT_COLL.findOne(conditionObj);
                if(conditionObj.$or && conditionObj.$or.length > 0 && infoContact)
                    return resolve({ error: true, message: 'Mã hiệu/Mã số thuế đã tồn tại' });

                let dataInsert = {
                    company,
                    inCRM: 1,
                    inHuman: 0,
                    inTimesheet: 0,
                    inFinancial: 1,
                    inDocument: 1,
                    type: (!isNaN(type) && Number(type) > 0) ? Number(type) : 1,
                    province: (!isNaN(province) && Number(province) > 0) ? Number(province) : 1,
                    name, 
                    description,
                    sign, 
                    address, 
                    taxid,
                    birthday,
                    phone,
                    email,
                    status: status ? Number(status) : Number(1)
                }

                if(gender && !isNaN(gender)){
                    dataInsert.gender = gender;
                }
                if(department && _isValid(department)){
                    dataInsert.department = department;
                }
                if(position && _isValid(position)){
                    dataInsert.position = position;
                }
                if(linkUser && _isValid(linkUser)){
                    dataInsert.linkUser = linkUser;
                }
                if(linkSale && _isValid(linkSale)){
                    dataInsert.linkSale = linkSale;
                }
                if(field && _isValid(field)){
                    dataInsert.field = field;
                }
                if(property && _isValid(property)){
                    dataInsert.property = property;
                }

                if(parent && _isValid(parent)){
                    dataInsert.parent = parent;
                    let infoMenuParent = await ITEM__CONTACT_COLL.findById(parent);
                    dataInsert.level = infoMenuParent.level + 1;
                }

                if(workingStatus && _isValid(workingStatus)){
                    dataInsert.workingStatus = workingStatus;
                }

                if(realStatus){
                    dataInsert.realStatus = realStatus;
                }

                if(insuranceStatus){
                    dataInsert.insuranceStatus = insuranceStatus;
                }

                if(familyPolicy){
                    dataInsert.familyPolicy = familyPolicy;
                }

                if(contractType && _isValid(contractType)){
                    dataInsert.contractType = contractType;
                }

                if(contractSign){
                    dataInsert.contractSign = contractSign;
                }

                if(family){
                    dataInsert.family = family;
                }

                if(identity){
                    dataInsert.identity = identity;
                }

                if(dateProvice){
                    dataInsert.dateProvice = dateProvice;
                }

                if(place){
                    dataInsert.place = place;
                }

                if(area){
                    dataInsert.area = area;
                }

                if(area1){
                    dataInsert.area1 = area1;
                }

                if(area2){
                    dataInsert.area2 = area2;
                }

                if(insuranceSign){
                    dataInsert.insuranceSign = insuranceSign;
                }
                
                if(insuranceDate){
                    dataInsert.insuranceDate = insuranceDate;
                }

                if(sallaryFactor){
                    dataInsert.sallaryFactor = sallaryFactor;
                }

                if(sallarySubFactor){
                    dataInsert.sallarySubFactor = sallarySubFactor;
                }

                if(sallaryBasic){
                    dataInsert.sallaryBasic = sallaryBasic;
                }

                if(signerIn){
                    dataInsert.signerIn = signerIn;
                }

                if(signerOut){
                    dataInsert.signerOut = signerOut;
                }

                if(workStartDate){
                    dataInsert.workStartDate = workStartDate;
                }

                if(dayOff){
                    dataInsert.dayOff = dayOff;
                }

                if(appointDate){
                    dataInsert.appointDate = appointDate;
                }

                if(changeSallaryDate){
                    dataInsert.changeSallaryDate = changeSallaryDate;
                }

                if(contractDate){
                    dataInsert.contractDate = contractDate;
                }

                if(contractValid){
                    dataInsert.contractValid = contractValid;
                }

                if(contractExpire){
                    dataInsert.contractExpire = contractExpire;
                }

                let infoAfterInsert = await this.insertData(dataInsert, authorID);
                if(parent) {
                    await ITEM__CONTACT_COLL.findByIdAndUpdate(parent, {
                        $addToSet: { childs: infoAfterInsert._id } 
                    }, { new: true });
                }
                
                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
    
    /**
     * Name: update danh bạ, nhân sự ✅
     * Author: Depv
     * Code: 
     */
    update({ contactID, company, authorID, parent, type, name, description, sign, address, taxid, birthday, province, gender, phone, email, department, position, linkUser, status, field, property, linkSale, workingStatus, realStatus, 
        insuranceStatus, familyPolicy, contractType, contractSign, family, identity, dateProvice, place, area, area1, area2, insuranceSign, insuranceDate, sallaryFactor, sallarySubFactor, sallaryBasic, signerIn,
        signerOut, workStartDate, dayOff, appointDate, changeSallaryDate, contractDate, contractValid, contractExpire }){
        return new Promise(async (resolve) => {
            try {
                if(!name || !_isValid(company) || !_isValid(authorID))
                    return resolve({ error: true, message: 'param_not_valid' });

                //___________Kiểm tra việc trùng mã hiệu
                let conditionObj = {
                    company: company,
                    _id: { $ne: contactID } 
                };
                if((sign && sign != "") || (taxid && taxid != "")){
                    conditionObj.$or = []
                }
                if((sign && sign != "")){
                    conditionObj.$or.push({sign: sign})
                }
                if((taxid && taxid != "")){
                    conditionObj.$or.push({taxid: taxid})
                }
                
                let infoContact = await ITEM__CONTACT_COLL.findOne(conditionObj);
                if(conditionObj.$or && conditionObj.$or.length > 0 && infoContact)
                    return resolve({ error: true, message: 'Mã hiệu/Mã số thuế đã tồn tại' });

                let dataUpdate = {
                    company,
                    inCRM: 1,
                    inHuman: 0,
                    inTimesheet: 0,
                    inFinancial: 1,
                    inDocument: 1,
                    type: (!isNaN(type) && Number(type) > 0) ? Number(type) : 1,
                    province: (!isNaN(province) && Number(province) > 0) ? Number(province) : 1,
                    name, 
                    description,
                    sign, 
                    address, 
                    taxid,
                    birthday,
                    phone,
                    email,
                    status: status ? Number(status) : Number(1)
                }

                if(gender && !isNaN(gender)){
                    dataUpdate.gender = gender;
                }
                if(department && _isValid(department)){
                    dataUpdate.department = department;
                }
                if(position && _isValid(position)){
                    dataUpdate.position = position;
                }
                if(linkUser && _isValid(linkUser)){
                    dataUpdate.linkUser = linkUser;
                }
                if(linkSale && _isValid(linkSale)){
                    dataUpdate.linkSale = linkSale;
                }
                if(field && _isValid(field)){
                    dataUpdate.field = field;
                }
                if(property && _isValid(property)){
                    dataUpdate.property = property;
                }

                if(parent && _isValid(parent)){
                    dataUpdate.parent = parent;
                    let infoMenuParent = await ITEM__CONTACT_COLL.findById(parent);
                    dataUpdate.level = infoMenuParent.level + 1;
                }

                if(workingStatus && _isValid(workingStatus)){
                    dataUpdate.workingStatus = workingStatus;
                }

                if(realStatus){
                    dataUpdate.realStatus = realStatus;
                }

                if(insuranceStatus){
                    dataUpdate.insuranceStatus = insuranceStatus;
                }

                if(familyPolicy){
                    dataUpdate.familyPolicy = familyPolicy;
                }

                if(contractType && _isValid(contractType)){
                    dataUpdate.contractType = contractType;
                }

                if(contractSign){
                    dataUpdate.contractSign = contractSign;
                }

                if(family){
                    dataUpdate.family = family;
                }

                if(identity){
                    dataUpdate.identity = identity;
                }

                if(dateProvice){
                    dataUpdate.dateProvice = dateProvice;
                }

                if(place){
                    dataUpdate.place = place;
                }

                if(area){
                    dataUpdate.area = area;
                }

                if(area1){
                    dataUpdate.area1 = area1;
                }

                if(area2){
                    dataUpdate.area2 = area2;
                }

                if(insuranceSign){
                    dataUpdate.insuranceSign = insuranceSign;
                }
                
                if(insuranceDate){
                    dataUpdate.insuranceDate = insuranceDate;
                }

                if(sallaryFactor){
                    dataUpdate.sallaryFactor = sallaryFactor;
                }

                if(sallarySubFactor){
                    dataUpdate.sallarySubFactor = sallarySubFactor;
                }

                if(sallaryBasic){
                    dataUpdate.sallaryBasic = sallaryBasic;
                }

                if(signerIn){
                    dataUpdate.signerIn = signerIn;
                }

                if(signerOut){
                    dataUpdate.signerOut = signerOut;
                }

                if(workStartDate){
                    dataUpdate.workStartDate = workStartDate;
                }

                if(dayOff){
                    dataUpdate.dayOff = dayOff;
                }

                if(appointDate){
                    dataUpdate.appointDate = appointDate;
                }

                if(changeSallaryDate){
                    dataUpdate.changeSallaryDate = changeSallaryDate;
                }

                if(contractDate){
                    dataUpdate.contractDate = contractDate;
                }

                if(contractValid){
                    dataUpdate.contractValid = contractValid;
                }

                if(contractExpire){
                    dataUpdate.contractExpire = contractExpire;
                }

                let infoAfterInsert = await ITEM__CONTACT_COLL.findByIdAndUpdate(contactID, dataUpdate, { new: true })
                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Thông tin nhân sự ✅
     * Author: Depv
     * Code: 
     */
    getInfo({ contactID, select, populates }) { 
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
                if(!checkObjectIDs(contactID))
                    return resolve({ error: true, message: 'Request params contactID invalid', status: 400 });
                
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
                let infoAterGet = await ITEM__CONTACT_COLL.findById(contactID)
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
     * Name  : Danh sách nhân sự ✅
     * Author: Depv
     * Code  : 
     */
    getList({
        companyID, type, departmentID, positionID, contractTypeID, workingStatusID, gender, insuranceStatus,
        keyword, limit = 10, lastestID, select, populates= {} }) { 
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = {  company: companyID };
                let keys	     = ['createAt__-1', '_id__-1'];
                let sortBy;

                if(limit > 20){
                    limit = 20
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
               
                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */  
                
                // TRẠNG THÁI CÔNG VIỆC
                //____________Công ty
                if(companyID){
                    conditionObj.company = companyID
                }

                if(type){
                    conditionObj.type = type
                }

                if(checkObjectIDs(departmentID)){
                    conditionObj.department = departmentID
                }

                if(checkObjectIDs(positionID)){
                    conditionObj.position = positionID
                }
                
                if(checkObjectIDs(contractTypeID)){
                    conditionObj.contractType = contractTypeID
                }

                if(checkObjectIDs(workingStatusID)){
                    conditionObj.workingStatus = workingStatusID
                }

                if(gender){
                    conditionObj.gender = gender
                }

                if(insuranceStatus){
                    conditionObj.insuranceStatus = insuranceStatus
                }

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

                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await ITEM__CONTACT_COLL.findById(lastestID);
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
                
                let infoDataAfterGet = await ITEM__CONTACT_COLL.find(conditionObj)
                    .limit(+limit+1)
                    .sort(sortBy)
                    .select(select)
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

                let totalRecord = await ITEM__CONTACT_COLL.count(conditionObjOrg);
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
