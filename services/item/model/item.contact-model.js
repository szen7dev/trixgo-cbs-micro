"use strict";

const XlsxPopulate                      = require('xlsx-populate');
const fs                                = require('fs');
const path                              = require('path');
const moment                            = require('moment');
const _isValid                          = require('mongoose').Types.ObjectId;

const BaseModel                         = require('../../../tools/db/base_model');
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 		        = require('../../auth/helper/auth.actions-constant');

/**
 * TOOLS
 */
const { checkObjectIDs, IsJsonString, validateParamsObjectID } = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const { uploadFileS3 }                  = require('../../../tools/s3');
const { INSURANCE_STATUS }              = require('../../../tools/constants');

/**
 * COLLECTIONS
 */
const ITEM__FUNDA_COLL            				    = require('../database/item.funda-coll');
const ITEM__DEPARTMENT_COLL            				= require('../database/item.department-coll');
const ITEM__CONTRACT_COLL            				= require('../database/item.contract-coll');
const ITEM__CONTACT_COLL            				= require('../database/item.contact-coll');
const CONTACT_DOCUMENT_COLL                         = require('../../human/database/human.contact_document-coll')

class Model extends BaseModel {

    constructor() {
        super(ITEM__CONTACT_COLL);
    }

    /**
     * Name: Thêm danh bạ, nhân sự
     * Author: Depv
     * Code:
     */
    insert({ authorID, parent, type, name, description, note, sign, address, taxid, birthday, province, gender, phone, email, department, position, linkUser, status, field, property, linkSale, workingStatus, realStatus,
        insuranceStatus, familyPolicy, contractType, contractSign, family, identity, dateProvice, place, area, area1, area2, insuranceSign, insuranceDate, sallaryFactor, sallarySubFactor, sallaryBasic, signerIn,
        signerOut, workStartDate, dayOff, appointDate, changeSallaryDate, contractDate, contractValid, contractExpire, fundaID 
    }) {
        // console.log({ authorID, parent, type, name, description, note, sign, address, taxid, birthday, province, gender, phone, email, department, position, linkUser, status, field, property, linkSale, workingStatus, realStatus,
        //     insuranceStatus, familyPolicy, contractType, contractSign, family, identity, dateProvice, place, area, area1, area2, insuranceSign, insuranceDate, sallaryFactor, sallarySubFactor, sallaryBasic, signerIn,
        //     signerOut, workStartDate, dayOff, appointDate, changeSallaryDate, contractDate, contractValid, contractExpire, fundaID 
        // })
        return new Promise(async resolve => {
            try {
                /**
                 * BA-Quy trình khởi tạo và quản lý khách hàng
                 * 1-Khi tạo lần đầu/Mua hàng lần đầu => Khách hàng mới
                 * 2-Khi mua hàng lần 2 trở đi => Khách hàng cũ => Đơn hàng cũ
                 */
                if(!name || !checkObjectIDs(fundaID) || !checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'name|fundaID|authorID_param_not_valid' });

                let infoFunda = await ITEM__FUNDA_COLL.findById(fundaID)
                if(!infoFunda)
                    return resolve({ error: true, message: 'can_not_get_funda_info' });
                // console.log(infoFunda)

                //___________Kiểm tra việc trùng mã hiệu
                let conditionObj = {
                    company: infoFunda.company
                };

                if((sign && sign != "") || (taxid && taxid != "") || (phone && phone != "")){
                    conditionObj.$or = []
                }
                if((sign && sign != "")){
                    conditionObj.$or.push({sign: sign})
                }
                if((taxid && taxid != "")){
                    conditionObj.$or.push({taxid: taxid})
                }
                if((phone && phone != "")){
                    conditionObj.$or.push({phone: phone})
                }

                let infoContact = await ITEM__CONTACT_COLL.findOne(conditionObj);
                if(conditionObj.$or && conditionObj.$or.length > 0 && infoContact)
                    return resolve({ error: true, message: 'Mã hiệu/Mã số thuế/Điện thoại đã tồn tại' });

                let dataInsert = {
                    company: infoFunda.company,
                    funda: fundaID,
                    inCRM: 1,
                    inHuman: 0,
                    inTimesheet: 0,
                    inFinancial: 1,
                    inDocument: 1,
                    type: (!isNaN(type) && Number(type) > 0) ? Number(type) : 1,
                    province: (!isNaN(province) && Number(province) > 0) ? Number(province) : 1,
                    name,
                    description,
                    note,
                    sign,
                    address,
                    taxid,
                    birthday,
                    phone,
                    email,
                    status: status ? Number(status) : Number(1)
                }

                if(infoFunda.area1){
                    dataInsert.sector1 = infoFunda.area1
                }

                if(infoFunda.area2){
                    dataInsert.sector2 = infoFunda.area2
                }

                if(infoFunda.area3){
                    dataInsert.sector3 = infoFunda.area3
                }

                if(gender && !isNaN(gender)){
                    dataInsert.gender = gender;
                }
                if(department && checkObjectIDs(department)){
                    dataInsert.department = department;
                }
                if(position && checkObjectIDs(position)){
                    dataInsert.position = position;
                }
                if(linkUser && checkObjectIDs(linkUser)){
                    dataInsert.linkUser = linkUser;
                }
                if(linkSale && checkObjectIDs(linkSale)){
                    dataInsert.linkSale = linkSale;
                }
                if(field && checkObjectIDs(field)){
                    dataInsert.field = field;
                }
                if(property && checkObjectIDs(property)){
                    dataInsert.property = property;
                }

                if(parent && checkObjectIDs(parent)){
                    dataInsert.parent = parent;
                    let infoMenuParent = await ITEM__CONTACT_COLL.findById(parent);
                    dataInsert.level = infoMenuParent.level + 1;
                }

                if(workingStatus && checkObjectIDs(workingStatus)){
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

                if(contractType && checkObjectIDs(contractType)){
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
                        $addToSet: { childs: infoAfterInsert._id },
                        $inc: { amountChilds: 1 }
                    }, { new: true });
                }

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: update danh bạ, nhân sự
     * Author: Depv
     * Code:
     */
    update({
        contactID, company, authorID, parent, type, name, description, note, sign, address, taxid, birthday, province, gender, phone, email, department, position, linkUser, status, field, property, linkSale, workingStatus, realStatus,
        insuranceStatus, familyPolicy, contractType, contractSign, family, identity, dateProvice, place, area, area1, area2, insuranceSign, insuranceDate, sallaryFactor, sallarySubFactor, sallaryBasic, signerIn,
        signerOut, workStartDate, dayOff, appointDate, changeSallaryDate, contractDate, contractValid, contractExpire, image, documents, documentsRemove,
        amountWorkHistory, amountProjectHistory, amountContractHistory, amountEducationHistory, amountCertificateHistory, fundaID
    }){
        return new Promise(async (resolve) => {
            try {
                //___________Kiểm tra việc trùng mã hiệu
                let conditionObj = {
                    company: company,
                    _id: { $ne: contactID }
                };

                if((sign && sign != "") || (taxid && taxid != "") || (phone && phone != "")){
                    conditionObj.$or = []
                }
                if((sign && sign != "")){
                    conditionObj.$or.push({sign: sign})
                }
                if((taxid && taxid != "")){
                    conditionObj.$or.push({taxid: taxid})
                }
                if((phone && phone != "")){
                    conditionObj.$or.push({phone: phone})
                }

                let infoContact = await ITEM__CONTACT_COLL.findOne(conditionObj);
                if(conditionObj.$or && conditionObj.$or.length > 0 && infoContact)
                    return resolve({ error: true, message: 'Mã hiệu/Mã số thuế/Điện thoại đã tồn tại' });

                let dataUpdate = {
                    inCRM: 1,
                    inHuman: 0,
                    inTimesheet: 0,
                    inFinancial: 1,
                    inDocument: 1,
                    modifyAt: new Date(),
                    userUpdate: authorID
                }

                if(type){
                    dataUpdate.type = type;
                }

                if(province){
                    dataUpdate.province = province;
                }

                if(name){
                    dataUpdate.name = name;
                }

                if(company){
                    dataUpdate.company = company;
                }

                if(description){
                    dataUpdate.description = description;
                }

                if(note){
                    dataUpdate.note = note;
                }

                if(sign){
                    dataUpdate.sign = sign;
                }

                if(address){
                    dataUpdate.address = address;
                }

                if(taxid){
                    dataUpdate.taxid = taxid;
                }

                if(birthday){
                    dataUpdate.birthday = birthday;
                }

                if(phone){
                    dataUpdate.phone = phone;
                }

                if(email){
                    dataUpdate.email = email;
                }

                if(status){
                    dataUpdate.status = status;
                }

                if(image){
                    dataUpdate.image = image;
                }

                if(gender && !isNaN(gender)){
                    dataUpdate.gender = gender;
                }
                if(department && checkObjectIDs(department)){
                    dataUpdate.department = department;
                }
                if(position && checkObjectIDs(position)){
                    dataUpdate.position = position;
                }
                if(linkUser && checkObjectIDs(linkUser)){
                    dataUpdate.linkUser = linkUser;
                }
                if(linkSale && checkObjectIDs(linkSale)){
                    dataUpdate.linkSale = linkSale;
                }
                if(field && checkObjectIDs(field)){
                    dataUpdate.field = field;
                }
                if(property && checkObjectIDs(property)){
                    dataUpdate.property = property;
                }

                if(parent && checkObjectIDs(parent)){
                    dataUpdate.parent = parent;
                    let infoMenuParent = await ITEM__CONTACT_COLL.findById(parent);
                    dataUpdate.level = infoMenuParent.level + 1;
                }

                if(workingStatus && checkObjectIDs(workingStatus)){
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

                if(contractType && checkObjectIDs(contractType)){
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
                // Tăng giảm số lượng contact_document khi xoá contact_document
                let dataINC = {};
                if(amountWorkHistory){
                    dataINC.amountWorkHistory = amountWorkHistory
                }

                if(amountProjectHistory){
                    dataINC.amountProjectHistory = amountProjectHistory
                }

                if(amountContractHistory){
                    dataINC.amountContractHistory = amountContractHistory
                }

                if(amountEducationHistory){
                    dataINC.amountEducationHistory = amountEducationHistory
                }

                if(amountCertificateHistory){
                    dataINC.amountCertificateHistory = amountCertificateHistory
                }

                if(dataINC){
                    dataUpdate.$inc = dataINC
                }

                if(checkObjectIDs(documents)){
                    dataUpdate.$addToSet = { documents }
                }

                if(checkObjectIDs(documentsRemove)){
                    dataUpdate.$pull = { documents: documentsRemove }
                }

                if(fundaID){
                    let infoFunda = await ITEM__FUNDA_COLL.findById(fundaID)
                    dataUpdate.funda = fundaID;

                    if(infoFunda.area1){
                        dataUpdate.sector1 = infoFunda.area1
                    }
    
                    if(infoFunda.area2){
                        dataUpdate.sector2 = infoFunda.area2
                    }
    
                    if(infoFunda.area3){
                        dataUpdate.sector3 = infoFunda.area3
                    }

                    if(infoFunda.company){
                        dataUpdate.company = infoFunda.company
                    }
                }
                let infoAfterInsert = await ITEM__CONTACT_COLL.findByIdAndUpdate(contactID, dataUpdate, { new: true })
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "Cập nhật thất bại" });

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Thông tin nhân sự
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
     * Name  : Danh sách nhân sự
     * Author: Depv
     * Code  :
     */
    getList({
        userID, companyID, type, departmentID, positionID, contractTypeID, workingStatusID, gender,
        insuranceStatus, parentID, isBirthday, isLinkUser, isListParentOrListChilds, isMember, realStatus, familyPolicy,
        isExportExcel, educationalBackground2, field2, typeCertificate, certificateName, certificateGrade, isPartner, isContractExpire4month,
        keyword, limit = 10, lastestID, select, populates = {} }) {
        return new Promise(async (resolve) => {
            try {
                if(limit > 50){
                    limit = 50
                } else{
                    limit = +limit
                }

                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { };
                let keys	     = ['createAt__-1', '_id__-1'];
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

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */

                // Lấy tất cả
                if(isMember){
                    // Lấy nhân sự thuộc Deparment mà user là members của Deparment đó
                    let listDepartment = await ITEM__DEPARTMENT_COLL.find({members: { $in: [userID] }}).select('_id name sign')
                    conditionObj.$or = [
                        { company: companyID },
                        { department: {$in: listDepartment.map(item=>item._id) } },
                    ]
                }else{
                    if(isPartner == 1){
                        // Lấy nhân sự theo đối tác
                        let listDepartment = await ITEM__DEPARTMENT_COLL.find({members: { $in: [userID] }}).select('_id name sign')
                        conditionObj.department = { $in: listDepartment.map(item=>item._id) };
                        conditionObj.company = { $ne: companyID }
                    }else{
                        // Lấy nhân sự theo công ty
                        if(checkObjectIDs(companyID)){
                            conditionObj.company = companyID
                        }

                        if(checkObjectIDs(departmentID)){
                            conditionObj.department = departmentID
                        }
                    }
                }

                if(type){
                    conditionObj.type = type
                }

                if(checkObjectIDs(departmentID)){
                    conditionObj.department = departmentID,
                    delete conditionObj.company;
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

                if(realStatus) {
                    conditionObj.realStatus = realStatus
                }

                if(familyPolicy) {
                    conditionObj.familyPolicy = familyPolicy
                }

                // Lấy những danh bạ có sinh nhật vào hôm nay
                if(isBirthday == 1){
                    const day = (new Date()).getDate();
                    const month = (new Date()).getMonth();
                    conditionObj.$where = `return this.birthday && this.birthday.getDate() === ${day} && this.birthday.getMonth() === ${month}`
                }

                // Lấy những tài khoản có trường linkUser
                if(isLinkUser == 1){
                    conditionObj.linkUser = { $exists: true }
                }

                // Lấy danh sách danh bạ cha hoặc danh bạ con
                if(isListParentOrListChilds == 1){
                    if(checkObjectIDs(parentID)){
                        conditionObj.parent = parentID;
                    }else{
                        conditionObj.parent = { $exists: false };
                    }
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regSearch = new RegExp(keyword, 'i');   
                    let listDepartment = await ITEM__DEPARTMENT_COLL.find({members: { $in: [userID] }}).select('_id name sign')
                    conditionObj.$and = [
                        {
                            $or: [
                                { name: regSearch },
                                { sign: regSearch },
                                { taxid: regSearch },
                                { phone: regSearch },
                            ]
                        },
                        {
                            $or: [
                                { company: companyID },
                                { department: {$in: listDepartment.map(item=>item._id) } },
                            ]
                        }
                    ]
                }

                // Trình độ học vấn
                if(educationalBackground2){
                    // Call service sau
                    let arrContact = await CONTACT_DOCUMENT_COLL.find({ company: companyID, educationalBackground2 });
                    let arrContactIDForEducationBG2 = arrContact.map(item => {
                        return item._id.toString()
                    })
                    conditionObj.documents = { $in : arrContactIDForEducationBG2 }
                }

                let arrContactID = [];
                // Chuyên ngành
                if(field2 && field2 != 0){
                    // Call service sau
                    let arrContact = await CONTACT_DOCUMENT_COLL.find({ company: companyID, field2 }, { contact: 1 , _id: 0});
                    let arrContactIDForField2 = arrContact.map(item => {
                        return item.contact.toString()
                    })
                    let dataUnique = [...new Set(arrContactIDForField2)];
                    if(!arrContactID.length){
                        arrContactID = dataUnique;
                    }else{
                        arrContactID = arrContactID.filter(item => dataUnique.includes(item));
                    }
                }

                // Loại chứng chỉ
                if(typeCertificate){
                    // conditionObj.educationalBackground = educationalBackground
                    let arrContact = await CONTACT_DOCUMENT_COLL.find({ company: companyID, certificateType: typeCertificate });

                    let arrContactIDForTypeCertificate = arrContact.map(item => {
                        return item.contact.toString();
                    })

                    let dataUnique = [...new Set(arrContactIDForTypeCertificate)];

                    if(!arrContactID.length){
                        arrContactID = dataUnique;
                    }else{
                        arrContactID = arrContactID.filter(item => dataUnique.includes(item));
                    }
                }

                // lĩnh vực chính chỉ
                if(certificateName){
                    // conditionObj.educationalBackground = educationalBackground
                    let arrContact = await CONTACT_DOCUMENT_COLL.find({ company: companyID, certificateName }, { contact: 1 , _id: 0});
                    let arrContactIDForCertificateName = arrContact.map(item => {
                        return item.contact.toString()
                    })
                    let dataUnique = [...new Set([...arrContactIDForCertificateName])];

                    if(!arrContactID.length){
                        arrContactID = dataUnique;
                    }else{
                        arrContactID = arrContactID.filter(item => arrContactIDForCertificateName.includes(item));
                    }
                }

                // Hạng chứng chỉ (1/2/3/4-Nếu)
                if(certificateGrade){
                    // conditionObj.educationalBackground = educationalBackground
                    let arrContact = await CONTACT_DOCUMENT_COLL.find({ company: companyID, certificateGrade: Number(certificateGrade) }, { contact: 1, _id: 0});
                    let arrContactIDForCertificateGrade = arrContact.map(item => {
                        return item.contact.toString();
                    })
                    let dataUnique = [...new Set([...arrContactIDForCertificateGrade])];

                    if(!arrContactID.length){
                        arrContactID = dataUnique;
                    }else{
                        arrContactID = arrContactID.filter(item => arrContactIDForCertificateGrade.includes(item));
                    }
                }

                //  Check thời hạng hợp đồng còn 4 tháng là hết hạn
                if(isContractExpire4month == 1){
                    var monthAdd4 = new Date();
                    monthAdd4.setMonth(monthAdd4.getMonth() + 4);   
     
                    conditionObj.contractExpire = {
                        $gte: new Date(),
                        $lte: monthAdd4
                    }
                }

                if(arrContactID.length){
                    conditionObj._id = { $in: [...new Set([...arrContactID])] }
                }
                /**
                 * Purpose: Sử dụng trong export excel nhân sự (theo bộ lọc)
                 * Function: (model)
                 */
                if(isExportExcel) {
                    return resolve({ data: conditionObj, error: false });
                }

                let conditionObjOrg = { ...conditionObj };

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
					sortBy                = dataPagingAndSort.data.sort;
                }
                let infoDataAfterGet = await ITEM__CONTACT_COLL
                    .find(conditionObj)
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
                    limit,
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
     * Name  : Danh sách danh bạ của hệ thống
     * Author: HiepNH/DePV-update
     * Code  :
     */
    getListOfSystem({
        keyword, limit = 10, lastestID, select, populates= {} }) {
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let conditionObj = { };
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
                    sortBy                = dataPagingAndSort.data.sort;
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

    /**
     * Dev: MinhVH
     * Func: Download Excel Contact
     * Date: 21/06/2022
     */
    exportExcel({ companyID, userID, filterParams, ctx }) {
        return new Promise(async resolve => {
            try {
                const validation = validateParamsObjectID({ userID, companyID });
                if(validation.error) return resolve(validation);
                // console.log({ filterParams })

                let conditionObj = {};
                const { data, error } = await this.getList({
                    ...filterParams,
                    userID,
                    companyID,
                    type: 1,
                    // isMember: 1,
                    isExportExcel: true
                });

                if(!error) {
                    conditionObj = { ...data };
                }
                // console.log({ conditionObj, companyID })

                const listHuman = await ITEM__CONTACT_COLL
                    .find(conditionObj)
                    .populate({
                        path: 'position workingStatus educationalBackground contractType department documents'
                    })
                    .lean();

                if(!listHuman) {
                    return resolve({
                        error: true,
                        message: 'Không tìm thấy nhân sự trong công ty',
                        keyError: 'humans_not_exists',
                        status: 400
                    });
                }

                await ITEM__CONTACT_COLL.populate(listHuman, {
                    path: 'documents.certificateName'
                })

                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/human_1_HumanInCompany.xlsm')))
                    .then(async workbook => {

                        const { data: infoCompany, error } = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.GET_INFO_AND_GET_LIST_COMPANY}`, {
                            companyID,
                            select: '_id name'
                        });

                        if(error) {
                            return resolve({
                                error: true,
                                message: 'Không tìm thấy công ty',
                                keyError: 'company_not_exists',
                                status: 400
                            });
                        }

                        let indexExcel = 4;
                        const DATE_FORMAT = 'DD/MM/YYYY';
                        const currentYear = new Date().getFullYear();

                        workbook.sheet("DanhSachNhanSu").row(1).cell(1).value(`DANH SÁCH CÁN BỘ ${infoCompany?.name}`);

                        listHuman.map((human, index) => {
                            const {
                                name, position, department, workingStatus, birthday, workStartDate,
                                contractType, contractExpire, documents,
                                insuranceNumber, taxid, phone, identity, dateProvice, place, note,
                            } = human;

                            let graduationYear = 0;
                            let trainingPlace = '';
                            let certificateGrade = '';
                            let certificateName = '';
                            let certificatePeriod = '';

                            if(human.graduationYear) {
                                graduationYear = new Date(human.graduationYear).getFullYear();
                            }

                            if(documents && documents.length) {
                                documents.map(doc => {
                                    // Trình độ học vấn
                                    if(doc.type === 4) {
                                        trainingPlace = doc.workplace;
                                    }

                                    // Bằng cấp chứng chỉ
                                    if(doc.type === 5) {
                                        certificateGrade = doc.certificateGrade;
                                        certificateName = doc.certificateName?.name;
                                        certificatePeriod = doc.toDate;
                                    }
                                })
                            }

                            const educationalBackground = human.educationalBackground?.map(item => item.name).join(', ');

                            let humanInsuranceStatus = human.insuranceStatus || 1;
                            const insuranceStatus = `${INSURANCE_STATUS[--humanInsuranceStatus].text}`;

                            const currRow = workbook.sheet("DanhSachNhanSu").row(indexExcel);

                            currRow.cell(1).value(index+1);
                            // Họ và tên
                            currRow.cell(2).value(name);
                            // Chức vụ
                            currRow.cell(3).value(position?.name);
                            // Phòng ban
                            currRow.cell(4).value(department?.name);
                            // Tình trạng làm việc
                            currRow.cell(5).value(workingStatus?.name);
                            // Ngày tháng năm sinh
                            if(birthday) {
                                currRow.cell(6).value(moment(birthday).format(DATE_FORMAT));
                            }
                            // Thời gian tuyển dụng
                            if(workStartDate) {
                                currRow.cell(7).value(moment(workStartDate).format(DATE_FORMAT));
                            }
                            // Chuyên môn/Trình độ học vấn
                            currRow.cell(8).value(educationalBackground);
                            // Nơi đào tạo
                            trainingPlace && currRow.cell(9).value(trainingPlace);

                            if(graduationYear) {
                                // Năm tốt nghiệp
                                currRow.cell(10).value(graduationYear);
                                // Năm kinh nghiệm
                                currRow.cell(11).value(currentYear - graduationYear);
                            }

                            // Lĩnh vực chứng chỉ
                            certificateName && currRow.cell(12).value(certificateName);
                            // Hạng chứng chỉ
                            certificateGrade && currRow.cell(13).value(`Hạng ${certificateGrade}`);

                            // Ngày hết hạn chứng chỉ
                            if(certificatePeriod) {
                                currRow.cell(14).value(moment(certificatePeriod).format(DATE_FORMAT));
                            }

                            // Loại hợp đồng
                            if(contractType?.name) {
                                currRow.cell(15).value(contractType.name);
                            }
                            // Thời hạn hợp đồng
                            if(contractExpire) {
                                currRow.cell(16).value(moment(contractExpire).format(DATE_FORMAT));
                            }

                            // Số sổ BHXH
                            insuranceNumber && currRow.cell(17).value(insuranceNumber);
                            // Mã số thuế
                            taxid && currRow.cell(18).value(taxid);
                            // Số điện thoại
                            phone && currRow.cell(19).value(phone);
                            // Số CCCD
                            identity && currRow.cell(20).value(identity);
                            // Ngày cấp CCCD
                            if(dateProvice) {
                                currRow.cell(21).value(moment(dateProvice).format(DATE_FORMAT));
                            }
                            // Nơi cấp CCCD
                            place && currRow.cell(22).value(place);
                            // Tình trạng sổ BHXH
                            insuranceStatus && currRow.cell(23).value(insuranceStatus);
                            // Ghi chú
                            note && currRow.cell(24).value(note);

                            indexExcel++;
                        })

                        // const rangeUsed = workbook.sheet("DanhSachNhanSu").usedRange();
                        const range = workbook.sheet('DanhSachNhanSu').range(`A4:X${listHuman.length + 3}`);

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
                        const fileName = `human_1_HumanInCompany${now.getTime()}.xlsm`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                        await workbook.toFileAsync(pathWriteFile);
                        const result = await uploadFileS3(pathWriteFile, fileName);
                        fs.unlinkSync(pathWriteFile);

                        return resolve({ error: false, data: result?.Location, status: 200 });
                    });
            } catch (error) {
                console.error(error)
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Danh bạ (bên mua, bên bán) mà user được quyền truy cập theo hợp đồng
     * Author: HiepNH
     * Code  : 7/9/2022
     */
    getListAccessByContract({
        userID, option,
        keyword, limit = 10, lastestID, select, populates = {} }) {
            console.log({option,keyword,populates})
        return new Promise(async (resolve) => {
            try {
                if(limit > 20){
                    limit = 20
                } else{
                    limit = +limit
                }

                // Danh sách hợp đồng mà user là members
                let listContractAccess = await ITEM__CONTRACT_COLL.find({members: {$in: [userID]}}).select('name sign buyerInfo sellerInfo')
                // console.log(listContractAccess)

                /**
                 * DECALARTION VARIABLE
                 */
                let conditionObj = { };
                let keys	     = ['createAt__-1', '_id__-1'];
                let sortBy;

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

                if(option && option == 1){
                    console.log('===========Bên bán================')
                    conditionObj._id = {$in: listContractAccess.map(item=>item.sellerInfo)}
                }

                if(option && option == 2){
                    console.log('===========Bên mua================')
                    conditionObj._id = {$in: listContractAccess.map(item=>item.buyerInfo)}
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
                // console.log(conditionObj)
                
                let conditionObjOrg = { ...conditionObj };

                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await ITEM__CONTACT_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastestID", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

					conditionObj = dataPagingAndSort?.data?.find;
					sortBy       = dataPagingAndSort?.data?.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy                = dataPagingAndSort?.data?.sort;
                }

                let infoDataAfterGet = await ITEM__CONTACT_COLL.find(conditionObj)
                    .limit(+limit+1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	    = null;
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
                    nextCursor
                }, status: 200 });

            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Báo cáo biến động nhân sự
     * Author: Depv
     * Code  :
     */
    // dashboardContactchange({}) {
    //     return new Promise(async (resolve) => {
    //         try {
    //             // Cần hỏi lại nghiệp vụ chỗ 12 tháng
    //             // Block 1
    //             let infoDataAfterGet = await ITEM__CONTACT_COLL.find(conditionObj)

    //             if(!infoDataAfterGet)
    //                 return resolve({ error: true, message: "Can't get data", status: 403 });

    //             return resolve({ error: false, data: {

    //             }, status: 200 });

    //         } catch (error) {
    //             return resolve({ error: true, message: error.message, status: 500 });
    //         }
    //     })
    // }

    /**
     * Dev: HiepNH
     * Func: Download Template Excel
     * Date: 8/12/2022
     */
     downloadTemplateImportExcel({ companyID, userID }) {
        return new Promise(async resolve => {
            try {
                let listData  = await ITEM__CONTACT_COLL.find({ company: companyID })
                // console.log(listData)

                // Modify the workbook.
                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/contact_import_template.xlsx')))
                .then(async workbook => {

                    var i = 3;
                    listData?.forEach((item, index) => {
                        workbook.sheet("Export").row(i).cell(1).value(Number(index+1));
                        workbook.sheet("Export").row(i).cell(2).value(item.name);
                        workbook.sheet("Export").row(i).cell(3).value(item.phone);
                        workbook.sheet("Export").row(i).cell(4).value(item.address);
                        // workbook.sheet("Export").row(i).cell(5).value(item.description);
                        workbook.sheet("Export").row(i).cell(5).value(item.note);
                        i++
                    });

                    const now = new Date();
                    const filePath = '../../../files/temporary_uploads/';
                    const fileName = `Template_import_contact_${now.getTime()}.xlsx`;
                    const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                    await workbook.toFileAsync(pathWriteFile);
                    const result = await uploadFileS3(pathWriteFile, fileName);

                    fs.unlinkSync(pathWriteFile);
                    // console.log({ result })
                    return resolve({ error: false, data: result?.Location, status: 200 });
                });

            } catch (error) {
                console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Dev: HiepNH
     * Func: importFromExcel
     * Date: 8/12/2022
     */
    importFromExcel({ companyID, dataImport, userID, ctx }) {
        return new Promise(async resolve => {
            try {
                const dataImportJSON = JSON.parse(dataImport);
                // console.log('=============Log data===================');
                // return console.log({ dataImportJSON });
                let index = 0;
                let errorNumber = 0;
                // let parentID;
                for (const data of dataImportJSON) {
                    // Chỉ lấy dữ liệu từ mẩu tin thứ 2 trở đi
                    if(index > 0){
                        let dataInsert = {
                            company: companyID,
                            authorID: userID,
                            name: data?.__EMPTY,
                            phone: data?.__EMPTY_1,
                            address: data?.__EMPTY_2,
                            note: data?.__EMPTY_3,
                            type: 2
                        }

                        // console.log(dataInsert);
                    
                        let infoAfterInsert = await this.insert(dataInsert);
                        if(infoAfterInsert.error){
                            errorNumber++;
                        }

                    }
                    index ++;
                }
                if(errorNumber != 0)
                    return resolve({ error: true, message: "Import failed" });

                return resolve({ error: false, message: "Import successfull" });
            } catch (error) {
                console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

}

exports.MODEL = new Model;