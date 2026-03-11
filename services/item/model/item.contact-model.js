"use strict";

const XlsxPopulate = require('xlsx-populate');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const ObjectID = require('mongoose').Types.ObjectId;
const BaseModel = require('../../../tools/db/base_model');

/**
 * TOOLS
 */
const { checkObjectIDs, IsJsonString, validateParamsObjectID, regexPhoneNumber } = require('../../../tools/utils/utils')
const { getTimeBetween } = require('../../../tools/utils/time_utils')
const { RANGE_BASE_PAGINATION_V2 } = require('../../../tools/cursor_base/playground/index')
const { uploadFileS3 } = require('../../../tools/s3')
const { isValidDate } = require('../../../tools/utils/time_utils')
const { KEY_ERROR }                     = require('../../../tools/keys')

const {
    CONTACT_CLASSIFY,
    HUMAN_CLASSIFY,
    CONTACT_GENDER,
    PERSONAL_STATUS,
    INSURANCE_STATUS,
    CONTACT_POLICY,
    CONTACT_NEW,
    PAYMENT_STATUS,
} = require('../helper/item.keys-constant')
const stringUtils = require('../../../tools/utils/string_utils')

// const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
// const { CF_ACTIONS_ANALYSIS }           = require('../../analysis/helper/analysis.actions-constant');

/**
 * COLLECTIONS
 */
const COMPANY_COLL                              = require('../../auth/database/auth.company-coll')
const USER_COLL                                 = require('../../auth/database/auth.user-coll')
const ITEM__FUNDA_COLL                          = require('../database/item.funda-coll')
const ITEM__DEPARTMENT_COLL                     = require('../database/item.department-coll')
const ITEM__POSITION_COLL                       = require('../database/item.position-coll')
const ITEM__DOCTYPE_COLL                        = require('../database/item.doctype-coll')
const ITEM__CONTRACT_COLL                       = require('../database/item.contract-coll')
const ITEM__CONTACT_COLL                        = require('../database/item.contact-coll')
const ITEM__AREA_COLL                           = require('../database/item.area-coll')
const STORE_VOUCHER_COLL                        = require('../../store/database/store.voucher-coll')
const FNB_VOUCHER_COLL                          = require('../../fnb/database/fnb.voucher-coll')
const FNB_ORDER_COLL                            = require('../../fnb/database/fnb.order-coll')
const HUMAN__CONTACT_DOCUMENT_COLL              = require('../../human/database/human.contact_document-coll')
const TIMESHEET__EXPERT_TIMESHEET_COLL          = require('../../timesheet/database/timesheet.expert_timesheet-coll')
const CRM_HABIT_COLL                            = require('../../crm/database/crm.habit-coll')
const CRM_HABIT_TRACK_COLL                      = require('../../crm/database/crm.habit_track-coll')

// const AUTH__USER = require('../../auth/model/auth.user-model').MODEL // Gọi ở đây -> không chạy được bên user-model
const AUTH__APP_USER                            = require('../.../../../auth/model/auth.app_users').MODEL
// const FNB_ORDER_VOUCHER_MODEL                   = require('../../fnb/model/fnb.voucher-model').MODEL
const CONTACT_DOCUMENT_MODEL                    = require('../../human/model/human.contact_document-model').MODEL
const ANALYSIS__HISTORY_DATA_MODEL              = require('../.../../../analysis/model/analysis.history_data').MODEL;

// PCM, Chấm công, Kế toán, Quỹ, Nhân sự, Hồ sơ, CRM
const appArr = ['5eabfdc72171391e5f6a0468','61e049cffdebf77b072d1b14','61e049aefdebf77b072d1b12','5dfe4bf251dc622100bb9d8c','61e049c9fdebf77b072d1b13','5e47867080019357cce04746','61e049f6fdebf77b072d1b16'];
const appIDCheck = appArr[4]

class Model extends BaseModel {
    constructor() {
        super(ITEM__CONTACT_COLL);
    }

    /**
     * Name: Thêm danh bạ, nhân sự
     * Author: Depv
     * Code:
     */
    insert({ companyID, fundaID, authorID, parent, type, name, description, note, sign, address, taxid, birthday, gender, phone, email, department, position, linkUser, status, field, property, saleID, workingStatus, realStatus, insuranceStatus, familyPolicy, contractType, contractSign, family, identity, dateProvice, place, area, area1, area2, insuranceSign, insuranceDate, sallaryFactor, sallarySubFactor, sallaryBasic, numberOnLeave, numberOnLeavePlus, signerIn, signerOut, workStartDate, dayOff, appointDate, changeSallaryDate, contractDate, contractValid, contractExpire, nonResident, referrerID, bankAccount, bank, dataSource, insuranceFee, annualWorkingHours, pubertyOnsetDate, boneAge, support
    }) {
        return new Promise(async resolve => {
            try {
                // Không cho show dữ liệu với các phân vùng chưa thanh toán
                // let checkPer = await AUTH__APP_USER.checkPermissionsAccessApp({appID: appIDCheck, userID: authorID })
                // if(!checkPer || checkPer.error)
                //     return resolve({ error: true, message: "Bạn không có quyền | Công ty bạn chưa thanh toán ứng dụng", keyError: KEY_ERROR.INSERT_FAILED, status: 403 })

                /**
                 * BA-Quy trình khởi tạo và quản lý khách hàng
                 * 1-Khi tạo lần đầu/Mua hàng lần đầu => Khách hàng mới
                 * 2-Khi mua hàng lần 2 trở đi => Khách hàng cũ => Đơn hàng cũ
                 * 3-Concat name, note, description -> namecv
                 */
                if (!name || !checkObjectIDs(authorID))
                    return resolve({ error: true, message: 'name|phone|authorID_param_not_valid' })

                //___________Quyền truy cập ứng dụng Nhân sự
                let infoAppUser = await AUTH__APP_USER.checkPermissionsAccessApp({
                    appID: "61e049c9fdebf77b072d1b13",
                    userID: authorID
                })

                //___________Xác thực số điện thoại
                if (phone && phone != ""){
                    if(!regexPhoneNumber(phone)){
                        return resolve({ error: true, message: 'Số điện thoại không hợp lệ' })
                    }

                    let checkPhone = phone.replace(/\s/g, "").length
                    if (Number(checkPhone) < 10)
                        return resolve({ error: true, message: 'Số điện thoại phải đúng 10 ký tự' })
                }

                //___________Kiểm tra việc trùng mã hiệu
                let conditionObj = {
                    company: companyID
                }

                if ((sign && sign != "") || (taxid && taxid != "") || (phone && phone != "")) {
                    conditionObj.$or = []
                }
                if ((sign && sign != "")) {
                    conditionObj.$or.push({ sign: sign })
                }
                if ((taxid && taxid != "")) {
                    conditionObj.$or.push({ taxid: taxid })
                }
                if ((phone && phone != "")) {
                    conditionObj.$or.push({ phone: phone.replace(/\s/g, "") })
                }
                // console.log(conditionObj)

                let infoContact = await ITEM__CONTACT_COLL.findOne(conditionObj);
                if (conditionObj.$or && conditionObj.$or.length > 0 && infoContact) {
                    return resolve({ error: true, message: `Mã hiệu/Mã số thuế/Điện thoại đã tồn tại - ${infoContact.name} - ${infoContact.phone}` })
                }

                let suid = await stringUtils.randomAndCheckExists(ITEM__CONTACT_COLL, 'suid')

                let dataInsert = {
                    userCreate: authorID,
                    company: companyID,
                    funda: fundaID,
                    type: (!isNaN(type) && Number(type) > 0) ? Number(type) : 2, // Khách hàng
                    name,
                    description,
                    note,
                    sign,
                    address,
                    taxid,
                    birthday,
                    status: status ? Number(status) : Number(1),
                    suid
                }

                if (phone && phone != ""){
                    dataInsert.phone = phone.replace(/\s/g, "")
                }

                if (email && email != ""){
                    dataInsert.email = email
                }

                let convertStr = ''
                if (name && name != "") {
                    convertStr = stringUtils.removeAccents(name)
                }
                if (description && description != "") {
                    convertStr = convertStr + " " + stringUtils.removeAccents(description)
                }
                if (sign && sign != "") {
                    convertStr = convertStr + " " + stringUtils.removeAccents(sign)
                }
                if (note && note != "") {
                    convertStr = convertStr + " " + stringUtils.removeAccents(note)
                }
                if (phone && phone != "") {
                    convertStr = convertStr + " " + stringUtils.removeAccents(phone.replace(/\s/g, ""))
                }
                if (taxid && taxid != "") {
                    convertStr = convertStr + " " + stringUtils.removeAccents(taxid)
                }
                if (email && email != "") {
                    convertStr = convertStr + " " + stringUtils.removeAccents(email)
                }
                if (identity && identity != "") {
                    convertStr = convertStr + " " + stringUtils.removeAccents(identity)
                }
                if (bankAccount && bankAccount != "") {
                    convertStr = convertStr + " " + stringUtils.removeAccents(bankAccount)
                }
                if(convertStr != ""){
                    dataInsert.namecv = convertStr
                }

                // Người giới thiệu
                if (referrerID && checkObjectIDs(referrerID)) {
                    dataInsert.referrer = referrerID;
                }

                if (gender && !isNaN(gender)) {
                    dataInsert.gender = gender;
                }

                if (department && checkObjectIDs(department)) {
                    dataInsert.department = department;
                }
                if (position && checkObjectIDs(position)) {
                    dataInsert.position = position;
                }

                if (support && checkObjectIDs(support)) {
                    dataInsert.support = support;
                }

                if (linkUser && checkObjectIDs(linkUser)) {
                    // Kiểm tra xem đã tồn tại hay chưa, nếu tồn tại rồi thì không cho link nữa
                    let checkExist = await ITEM__CONTACT_COLL.findOne({ linkUser: linkUser, company: companyID })
                    if (!checkExist) {
                        dataInsert.linkUser = linkUser;
                    }
                }
                if (saleID && checkObjectIDs(saleID)) {
                    dataInsert.sale = saleID;
                }
                if (field && checkObjectIDs(field)) {
                    dataInsert.field = field;
                }
                if (property && checkObjectIDs(property)) {
                    dataInsert.property = property;
                }

                /**
                 * PHẦN TỬ CHA
                 */
                let infoParent
                if (parent && checkObjectIDs(parent)) {
                    dataInsert.parent = parent
                    dataInsert.nestedParents = [parent] // Cha cấp 1

                    // Cập nhật Level để phục vụ việc tính toán, đệ quy
                    infoParent = await ITEM__CONTACT_COLL.findById(parent)
                    dataInsert.level = infoParent.level + 1

                    // Lấy nguồn theo phần tử cha
                    if (infoParent.dataSource && checkObjectIDs(infoParent.dataSource)) {
                        dataInsert.dataSource = infoParent.dataSource
                    }
                }

                if (dataSource && checkObjectIDs(dataSource)) {
                    dataInsert.dataSource = dataSource;
                }

                if (workingStatus && checkObjectIDs(workingStatus)) {
                    dataInsert.workingStatus = workingStatus;
                }

                if (pubertyOnsetDate) {
                    dataInsert.pubertyOnsetDate = pubertyOnsetDate;
                }

                if (boneAge) {
                    dataInsert.boneAge = boneAge;
                }

                if (realStatus) {
                    dataInsert.realStatus = realStatus;
                }

                if (insuranceStatus) {
                    dataInsert.insuranceStatus = insuranceStatus;
                }

                if (bankAccount) {
                    dataInsert.bankAccount = bankAccount;
                }

                if (bank) {
                    dataInsert.bank = bank;
                }

                if (family) {
                    dataInsert.family = family;
                }

                if (familyPolicy) {
                    dataInsert.familyPolicy = familyPolicy;
                }

                if (contractType && checkObjectIDs(contractType)) {
                    dataInsert.contractType = contractType;
                }

                if (contractSign) {
                    dataInsert.contractSign = contractSign;
                }

                if (identity) {
                    dataInsert.identity = identity;
                }

                if (dateProvice) {
                    dataInsert.dateProvice = dateProvice;
                }

                if (place) {
                    dataInsert.place = place;
                }

                if (area) {
                    dataInsert.area = area;
                }

                if (area1) {
                    dataInsert.area1 = area1;
                }

                if (area2) {
                    dataInsert.area2 = area2;
                }

                if (insuranceSign) {
                    dataInsert.insuranceSign = insuranceSign;
                }

                if (insuranceDate) {
                    dataInsert.insuranceDate = insuranceDate;
                }

                if (sallaryFactor) {
                    dataInsert.sallaryFactor = sallaryFactor;
                }

                if (sallarySubFactor) {
                    dataInsert.sallarySubFactor = sallarySubFactor;
                }

                if (sallaryBasic) {
                    dataInsert.sallaryBasic = sallaryBasic;
                }

                if (numberOnLeave) {
                    dataInsert.numberOnLeave = numberOnLeave;
                }

                if (numberOnLeavePlus) {
                    dataInsert.numberOnLeavePlus = numberOnLeavePlus;
                }

                if (insuranceFee) {
                    dataInsert.insuranceFee = insuranceFee;
                }

                if (annualWorkingHours) {
                    dataInsert.annualWorkingHours = annualWorkingHours;
                }

                if (signerIn) {
                    dataInsert.signerIn = signerIn;
                }

                if (signerOut) {
                    dataInsert.signerOut = signerOut;
                }

                if (workStartDate) {
                    dataInsert.workStartDate = workStartDate;
                }

                if (dayOff) {
                    dataInsert.dayOff = dayOff;
                }

                if (appointDate) {
                    dataInsert.appointDate = appointDate;
                }

                if (changeSallaryDate) {
                    dataInsert.changeSallaryDate = changeSallaryDate;
                }

                if (contractDate) {
                    dataInsert.contractDate = contractDate;
                }

                if (contractValid) {
                    dataInsert.contractValid = contractValid;
                }

                if (contractExpire) {
                    dataInsert.contractExpire = contractExpire;
                }

                if (nonResident) {
                    dataInsert.nonResident = Number(nonResident);
                }
                // console.log(dataInsert)

                let infoAfterInsert = await this.insertData(dataInsert, authorID)
                // console.log(infoAfterInsert)

                /**
                 * PHẦN TỬ CHA-CON => PHỤC VỤ XỬ LÝ ĐỆ QUY
                 */
                if (parent && checkObjectIDs(parent)) {
                    // Chỉ admin ứng dụng mới được thêm phần tử cha con
                    if (!infoAppUser.error && infoAppUser.data.level == 0) {

                        /**
                         * Phần tử cha cấp 1
                         */
                        await ITEM__CONTACT_COLL.findByIdAndUpdate(parent,
                            {
                                $addToSet: {
                                    childs: infoAfterInsert._id,
                                    nestedChilds: infoAfterInsert._id,
                                },
                            },
                            { new: true })

                        /**
                         * Phần tử cha cấp 2 trở lên
                         */
                        for (const item of infoParent?.nestedParents) {
                            // Thêm phần tử con/cháu
                            await ITEM__CONTACT_COLL.findByIdAndUpdate(item,
                                {
                                    $addToSet: { nestedChilds: infoAfterInsert._id },
                                },
                                { new: true })

                            // Thêm các phần tử cha
                            await ITEM__CONTACT_COLL.findByIdAndUpdate(infoAfterInsert._id,
                                {
                                    $addToSet: { nestedParents: item },
                                },
                                { new: true })
                        }
                    }
                }

                // Cập nhật linkUser với tài khoản
                if (linkUser && checkObjectIDs(linkUser)) {
                    await USER_COLL.findByIdAndUpdate(linkUser,
                        {
                            contacts: [infoAfterInsert._id] // Mỗi user cũng chỉ chứa 1 danh bạ thôi
                        },
                        { new: true })
                }

                return resolve({ error: false, data: infoAfterInsert })
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    /**
     * Name: update danh bạ, nhân sự
     * Author: Depv
     * Code:
     */
    update({ contactID, company, authorID, parent, type, name, description, note, sign, address, taxid, birthday, gender, phone, email, department, position, linkUser, status, field, property, saleID, workingStatus, realStatus, insuranceStatus, familyPolicy, contractType, contractSign, family, identity, dateProvice, place, area, area1, area2, insuranceSign, insuranceDate, sallaryFactor, sallary, nods, sallarySubFactor, sallaryBasic, numberOnLeave, numberOnLeavePlus, signerIn, signerOut, workStartDate, dayOff, appointDate, changeSallaryDate, contractDate, contractValid, contractExpire, nonResident, fundaID, bankAccount, bank, dataSource, insuranceFee, union, share, image, documents, documentsRemove, purchasedValue, totalLoyaltyPoints, usedLoyaltyPoints, remainLoyaltyPoints, getVouchers, usedVouchers, annualWorkingHours, pubertyOnsetDate, boneAge, support, joinedDate, memberAddID, memberRemoveID }) {
        return new Promise(async (resolve) => {
            try {
                // Không cho show dữ liệu với các phân vùng chưa thanh toán
                // let checkPer = await AUTH__APP_USER.checkPermissionsAccessApp({appID: appIDCheck, userID: authorID })
                // if(!checkPer || checkPer.error)
                //     return resolve({ error: true, message: "Bạn không có quyền | Công ty bạn chưa thanh toán ứng dụng", keyError: KEY_ERROR.INSERT_FAILED, status: 403 })

                //___________Xác thực số điện thoại
                if (phone) {
                    if (!regexPhoneNumber(phone))
                        return resolve({ error: true, message: 'Số điện thoại không hợp lệ' })

                    let checkPhone = phone.replace(/\s/g, "").length
                    if (Number(checkPhone) < 10)
                        return resolve({ error: true, message: 'Số điện thoại phải đúng 10 ký tự' })
                }

                //___________Kiểm tra việc trùng mã hiệu
                let conditionObj = {
                    company: company,
                    _id: { $ne: contactID }
                };

                if ((sign && sign != "") || (taxid && taxid != "") || (phone && phone != "")) {
                    conditionObj.$or = []
                }
                if ((sign && sign != "")) {
                    conditionObj.$or.push({ sign: sign })
                }
                if ((taxid && taxid != "")) {
                    conditionObj.$or.push({ taxid: taxid })
                }
                if ((phone && phone != "")) {
                    conditionObj.$or.push({ phone: phone.replace(/\s/g, "") })
                }

                let infoContact = await ITEM__CONTACT_COLL.findOne(conditionObj);
                if (conditionObj.$or && conditionObj.$or.length > 0 && infoContact)
                    return resolve({ error: true, message: `Mã hiệu/Mã số thuế/Điện thoại đã tồn tại - ${infoContact.name} - ${infoContact.phone}` });

                let dataUpdate = {
                    modifyAt: new Date(),
                    userUpdate: authorID
                }
                let dataAddToset = {};

                if(memberAddID && checkObjectIDs(memberAddID)){
                    dataUpdate.$addToSet = {
                        members: memberAddID,
                    }
                }

                if(memberRemoveID && checkObjectIDs(memberRemoveID)){
                    dataUpdate.$pull = {
                        members: memberRemoveID,
                    }
                }

                if (type) {
                    dataUpdate.type = type;
                }

                if (name) {
                    dataUpdate.name = name;
                }

                if (company) {
                    dataUpdate.company = company;
                }

                if (description) {
                    dataUpdate.description = description;
                }

                if (note) {
                    dataUpdate.note = note;
                }

                if (sign) {
                    dataUpdate.sign = sign;
                }

                if (bankAccount) {
                    dataUpdate.bankAccount = bankAccount;
                }

                if (bank) {
                    dataUpdate.bank = bank;
                }

                if (address) {
                    dataUpdate.address = address;
                }

                if (taxid) {
                    dataUpdate.taxid = taxid;
                }

                if (joinedDate) {
                    dataUpdate.joinedDate = joinedDate;
                }

                if (birthday) {
                    dataUpdate.birthday = birthday;
                }

                if (pubertyOnsetDate) {
                    dataUpdate.pubertyOnsetDate = pubertyOnsetDate;
                }

                if (boneAge) {
                    dataUpdate.boneAge = boneAge;
                }

                if (phone) {
                    dataUpdate.phone = phone.replace(/\s/g, "")
                }

                if (email) {
                    dataUpdate.email = email;
                }

                // NameCV
                let convertStr = ''
                if (name && name != "") {
                    convertStr = stringUtils.removeAccents(name)
                }
                if (description && description != "") {
                    convertStr = convertStr + " " + stringUtils.removeAccents(description)
                }
                if (sign && sign != "") {
                    convertStr = convertStr + " " + stringUtils.removeAccents(sign)
                }
                if (note && note != "") {
                    convertStr = convertStr + " " + stringUtils.removeAccents(note)
                }
                if (phone && phone != "") {
                    convertStr = convertStr + " " + stringUtils.removeAccents(phone.replace(/\s/g, ""))
                }
                if (taxid && taxid != "") {
                    convertStr = convertStr + " " + stringUtils.removeAccents(taxid)
                }
                if (email && email != "") {
                    convertStr = convertStr + " " + stringUtils.removeAccents(email)
                }
                if (identity && identity != "") {
                    convertStr = convertStr + " " + stringUtils.removeAccents(identity)
                }
                if (bankAccount && bankAccount != "") {
                    convertStr = convertStr + " " + stringUtils.removeAccents(bankAccount)
                }

                if(convertStr != ""){
                    dataUpdate.namecv = convertStr
                }

                if (status) {
                    dataUpdate.status = status;
                }

                if (image) {
                    dataUpdate.image = image;
                }

                if (gender && !isNaN(gender)) {
                    dataUpdate.gender = gender;
                }
                if (department && checkObjectIDs(department)) {
                    dataUpdate.department = department;
                }
                if (position && checkObjectIDs(position)) {
                    dataUpdate.position = position;
                }
                if (saleID && checkObjectIDs(saleID)) {
                    dataUpdate.sale = saleID;
                }

                if (support && checkObjectIDs(support)) {
                    dataUpdate.support = support;
                }

                if (linkUser && checkObjectIDs(linkUser)) {
                    // Kiểm tra xem đã tồn tại hay chưa, nếu tồn tại rồi thì không cho link nữa
                    let checkExist = await ITEM__CONTACT_COLL.findOne({ linkUser: linkUser, company: company })
                    if (!checkExist) {
                        dataUpdate.linkUser = linkUser;
                    }
                }

                if (field && checkObjectIDs(field)) {
                    dataUpdate.field = field;
                }
                if (property && checkObjectIDs(property)) {
                    dataUpdate.property = property;
                }

                if (dataSource && checkObjectIDs(dataSource)) {
                    dataUpdate.dataSource = dataSource;
                }

                if (workingStatus && checkObjectIDs(workingStatus)) {
                    dataUpdate.workingStatus = workingStatus;
                }

                if (realStatus) {
                    dataUpdate.realStatus = realStatus;
                }

                if (insuranceStatus) {
                    dataUpdate.insuranceStatus = insuranceStatus;
                }

                if (familyPolicy) {
                    dataUpdate.familyPolicy = familyPolicy;
                }

                if (contractType && checkObjectIDs(contractType)) {
                    dataUpdate.contractType = contractType;
                }

                if (contractSign) {
                    dataUpdate.contractSign = contractSign;
                }

                if (family) {
                    dataUpdate.family = family;
                }

                if (identity) {
                    dataUpdate.identity = identity;
                }

                if (dateProvice) {
                    dataUpdate.dateProvice = dateProvice;
                }

                if (place) {
                    dataUpdate.place = place;
                }

                if (area) {
                    dataUpdate.area = area;
                }

                if (area1) {
                    dataUpdate.area1 = area1;
                }

                if (area2) {
                    dataUpdate.area2 = area2;
                }

                if (insuranceSign) {
                    dataUpdate.insuranceSign = insuranceSign;
                }

                if (insuranceDate) {
                    dataUpdate.insuranceDate = insuranceDate;
                }
                
                if (nods) {
                    dataUpdate.nods = nods;
                }

                if (sallary) {
                    dataUpdate.sallary = sallary;
                }

                if (sallaryFactor) {
                    dataUpdate.sallaryFactor = sallaryFactor;
                }

                if (sallarySubFactor) {
                    dataUpdate.sallarySubFactor = sallarySubFactor;
                }

                if (sallaryBasic) {
                    dataUpdate.sallaryBasic = sallaryBasic;
                }

                if (numberOnLeave) {
                    dataUpdate.numberOnLeave = numberOnLeave;
                }

                if (numberOnLeavePlus) {
                    dataUpdate.numberOnLeavePlus = numberOnLeavePlus;
                }

                if (insuranceFee) {
                    dataUpdate.insuranceFee = insuranceFee;
                }

                if (annualWorkingHours) {
                    dataUpdate.annualWorkingHours = annualWorkingHours;
                }

                if (union) {
                    dataUpdate.union = union;
                }

                if (share) {
                    dataUpdate.share = share;
                }

                if (signerIn) {
                    dataUpdate.signerIn = signerIn;
                }

                if (signerOut) {
                    dataUpdate.signerOut = signerOut;
                }

                if (workStartDate) {
                    dataUpdate.workStartDate = workStartDate;
                }

                if (dayOff) {
                    dataUpdate.dayOff = dayOff;
                }

                if (appointDate) {
                    dataUpdate.appointDate = appointDate;
                }

                if (changeSallaryDate) {
                    dataUpdate.changeSallaryDate = changeSallaryDate;
                }

                if (contractDate) {
                    dataUpdate.contractDate = contractDate;
                }

                if (contractValid) {
                    dataUpdate.contractValid = contractValid;
                }

                if (contractExpire) {
                    dataUpdate.contractExpire = contractExpire;
                }

                if (checkObjectIDs(documents)) {
                    dataUpdate.$addToSet = { documents }
                }

                if (checkObjectIDs(documentsRemove)) {
                    dataUpdate.$pull = { documents: documentsRemove }
                }

                if (fundaID) {
                    dataUpdate.funda = fundaID;
                }

                if (purchasedValue && !isNaN(purchasedValue)) {
                    dataUpdate.purchasedValue = Number(purchasedValue);
                }
                if (totalLoyaltyPoints && !isNaN(totalLoyaltyPoints)) {
                    dataUpdate.totalLoyaltyPoints = Number(totalLoyaltyPoints);
                }
                if (usedLoyaltyPoints && !isNaN(usedLoyaltyPoints)) {
                    dataUpdate.usedLoyaltyPoints = Number(usedLoyaltyPoints);
                }
                if (remainLoyaltyPoints && !isNaN(remainLoyaltyPoints)) {
                    dataUpdate.remainLoyaltyPoints = Number(remainLoyaltyPoints);
                }

                if (nonResident) {
                    dataUpdate.nonResident = Number(nonResident);
                }

                /**
                 * QUẢN LÝ VOUCHER
                 */
                //_________Thêm voucher
                if (checkObjectIDs(getVouchers)) {
                    dataAddToset = {
                        ...dataAddToset,
                        getVouchers
                    }
                }

                //_________Sử dụng voucher
                if (checkObjectIDs(usedVouchers)) {
                    dataAddToset = {
                        ...dataAddToset,
                        usedVouchers
                    }
                }
                // console.log(dataUpdate)

                let infoAfterUpdate = await ITEM__CONTACT_COLL.findByIdAndUpdate(contactID, dataUpdate, { new: true })
                if (!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại" })

                // Cập nhật phần tử cha
                if (parent && checkObjectIDs(parent) && contactID.toString() != parent.toString()) {
                    //___________Quyền truy cập ứng dụng Nhân sự
                    let infoAppUser = await AUTH__APP_USER.checkPermissionsAccessApp({
                        appID: "61e049c9fdebf77b072d1b13",
                        userID: authorID
                    })

                    // Chỉ admin ứng dụng mới được thêm phần tử cha con
                    if (!infoAppUser.error && infoAppUser.data.level == 0) {
                        // Sẽ có lúc bị lỗi vì gọi nhiều Model bên ANALYSIS__HISTORY_DATA_MODEL
                        await ANALYSIS__HISTORY_DATA_MODEL.convertData({
                            option: 8,
                            companyID: company,
                            userID: authorID,
                            docID: contactID,
                            parentID: parent
                        })
                    }
                }

                // Cập nhật cho Habit và Track
                if(support && checkObjectIDs(support)){
                    await CRM_HABIT_COLL.updateMany(
                        { contact: ObjectID(contactID)},
                        { $set: {
                            support: support
                        } }
                    )
                    await CRM_HABIT_TRACK_COLL.updateMany(
                        { contact: ObjectID(contactID)},
                        { $set: {
                            support: support
                        } }
                    )
                }

                /**
                 * Cập nhật linkUser với tài khoản: chỉ cho phép 1 user link với 1 danh bạ trong 1 phân vùng
                 * Xử lý lại BA cho chuẩn????
                 */
                if (linkUser && checkObjectIDs(linkUser)) {
                    await USER_COLL.findByIdAndUpdate(linkUser,
                        {
                            contacts: [contactID] // Mỗi user cũng chỉ chứa 1 danh bạ thôi
                        },
                        { new: true })
                }

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Author: HiepNH
     * Func: Lấy ID theo số điện thoại
     * Date: 26/3/2025
     */
    getIdByPhone({ phone, companyID, fundaID }) {
        const that = this
        return new Promise(async resolve => {
            try {
                // Hàm kiểm tra Phone
                const strValid = phone.toLowerCase().trim();      
                function isValidVietnamPhoneNumber(str) {
                    const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
                    return phoneRegex.test(str);
                }
                // console.log(isValidVietnamPhoneNumber(strValid))

                if(!isValidVietnamPhoneNumber(strValid))
                    return resolve({ error: true, message: "Số điện thoại không hợp lệ. Hãy vui lòng thử lại" })

                let authorID = "6046c63b2c1dc33996dd97e7" // Trợ lý viên sàn ECOM: FIX

                if(checkObjectIDs(companyID)){
                    let infoFunda = await ITEM__FUNDA_COLL.findOne({company: companyID})
                    if(infoFunda){
                        fundaID = infoFunda._id
                    }
                }else{
                    companyID = "6046c63a2c1dc33996dd9762" // Phân vùng set làm Sàn TMĐT (Medgo): FIX
                    fundaID = "670c4e1de5851300129f80c5" // Cơ sở sàn Ecom: FIX
                }

                let infoCompany = await COMPANY_COLL.findById(companyID)
                if(infoCompany){
                    // Kiểm tra Danh bạ xem tồn tại hay chưa
                    let infoContact = await ITEM__CONTACT_COLL.findOne({
                        company: companyID, 
                        phone: strValid
                    })
                    .select('_id name phone')

                    if(infoContact){
                        return resolve({
                            error: false,
                            contactID: infoContact._id,
                            status: 200
                        })
                    }else{
                        let infoNewContact = await that.insert({
                            authorID, 
                            fundaID,
                            type: 2, 
                            name: `fullname ${strValid}-${infoCompany.sign}`,
                            phone: strValid, 
                            email: `${strValid}.${infoCompany.sign.toLowerCase()}@gmail.com`
                        })

                        if(infoNewContact){
                            return resolve({
                                error: false,
                                contactID: infoNewContact.data._id,
                                status: 200
                            })
                        }else{
                            return resolve({ error: true, message: "Không lấy được dữ liệu" })
                        }
                    }
                }else{
                    return resolve({ error: true, message: "Không lấy được dữ liệu" })
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Tổng hợp các hồ sơ của danh bạ
     * Author: HiepNH
     * Code: 21/1/2024
     */
    updateValue({
        contactID, userID
    }) {
        return new Promise(async (resolve) => {
            try {
                let dataUpdate = { userUpdate: userID, modifyAt: new Date() }

                let amountWorkHistory = 0, amountProjectHistory = 0, amountContractHistory = 0, amountEducationHistory = 0, amountCertificateHistory = 0

                // console.log({ contactID, dataUpdate })
                let listData = await HUMAN__CONTACT_DOCUMENT_COLL.aggregate([
                    {
                        $match: {
                            contact: ObjectID(contactID)
                        }
                    },
                    {
                        $group: {
                            _id: { type: "$type" },
                            count: { $sum: 1 },
                        }
                    },
                ])
                // console.log(listData)

                for (const item of listData) {
                    if (item._id.type == 1) {
                        amountWorkHistory = Number(amountWorkHistory) + Number(item.count)
                    }
                    if (item._id.type == 2) {
                        amountProjectHistory = Number(amountProjectHistory) + Number(item.count)
                    }
                    if (item._id.type == 3) {
                        amountContractHistory = Number(amountContractHistory) + Number(item.count)
                    }
                    if (item._id.type == 4) {
                        amountEducationHistory = Number(amountEducationHistory) + Number(item.count)
                    }
                    if (item._id.type == 5) {
                        amountCertificateHistory = Number(amountCertificateHistory) + Number(item.count)
                    }
                }

                dataUpdate.amountWorkHistory = Number(amountWorkHistory)
                dataUpdate.amountProjectHistory = Number(amountProjectHistory)
                dataUpdate.amountContractHistory = Number(amountContractHistory)
                dataUpdate.amountEducationHistory = Number(amountEducationHistory)
                dataUpdate.amountCertificateHistory = Number(amountCertificateHistory)

                let infoAfterUpdate = await ITEM__CONTACT_COLL.findByIdAndUpdate(contactID, dataUpdate, { new: true })
                if (!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update_task", status: 403 })

                return resolve({ error: false, data: infoAfterUpdate, status: 200 })
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Thông tin nhân sự
     * Author: Depv
     * Code:
     */
    getInfo({ userID, contactID, linkUserID, select, populates }) {
        return new Promise(async (resolve) => {
            try {
                // // Không cho show dữ liệu với các phân vùng chưa thanh toán
                // let checkPer = await AUTH__APP_USER.checkPermissionsAccessApp({appID: appIDCheck, userID })
                // if(!checkPer || checkPer.error)
                //     return resolve({ error: false, data: {}, status: 200 })

                if (contactID) {
                    if (!checkObjectIDs(contactID))
                        return resolve({ error: true, message: 'Request params contactID invalid', status: 400 })

                    if (populates && typeof populates === 'string') {
                        if (!IsJsonString(populates))
                            return resolve({ error: true, message: 'Request params populates invalid', status: 400 })

                        populates = JSON.parse(populates)
                    } else {
                        populates = {
                            path: "",
                            select: ""
                        }
                    }
                    let infoAterGet = await ITEM__CONTACT_COLL.findById(contactID)
                        .select(select)
                        .populate(populates)
                    if (!infoAterGet)
                        return resolve({ error: true, message: "can't_get_info", status: 403 })

                    return resolve({ error: false, data: infoAterGet, status: 200 })
                } else {
                    if (!checkObjectIDs(linkUserID))
                        return resolve({ error: true, message: 'Request params linkUserID invalid', status: 400 })

                    let info = await ITEM__CONTACT_COLL.findOne({ linkUser: linkUserID })
                    if (info) {
                        if (populates && typeof populates === 'string') {
                            if (!IsJsonString(populates))
                                return resolve({ error: true, message: 'Request params populates invalid', status: 400 })

                            populates = JSON.parse(populates)
                        } else {
                            populates = {
                                path: "",
                                select: ""
                            }
                        }
                        let infoAterGet = await ITEM__CONTACT_COLL.findById(info._id)
                            .select(select)
                            .populate(populates)
                        if (!infoAterGet)
                            return resolve({ error: true, message: "can't_get_info", status: 403 })

                        return resolve({ error: false, data: infoAterGet, status: 200 })
                    } else {
                        return resolve({ error: true, message: "can't_get_info", status: 403 })
                    }
                }

            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Danh sách nhân sự
     * Author: HiepNH
     * Code  : 30/7/2023
     */
    getList({ option, companyID, userID, genders, statuss, departmentsID, supportsID, voucherID, parentID, type, fromDate, toDate, userCreateID, isFamily, keyword, limit = 5, lastestID, select, populates }) {
        return new Promise(async (resolve) => {
            try {
                // // Không cho show dữ liệu với các phân vùng chưa thanh toán
                // let checkPer = await AUTH__APP_USER.checkPermissionsAccessApp({appID: appIDCheck, userID })
                // console.log(checkPer)
                // if(!checkPer || checkPer.error)
                //     return resolve({ error: false, data: {listRecords: []}, status: 200 })

                // console.log('========================')
                // console.log({userID, companyID})

                if (Number(limit) > 10) {
                    limit = 10;
                } else {
                    limit = +Number(limit);
                }

                let sortBy
                let conditionObj = { company: companyID }
                let keys = ['createAt__-1', '_id__-1']

                genders && genders.length && (conditionObj.gender = { $in: genders });
                statuss && statuss.length && (conditionObj.status = { $in: statuss });
                departmentsID && departmentsID.length && (conditionObj.department = { $in: departmentsID });
                supportsID && supportsID.length && (conditionObj.support = { $in: supportsID });

                // Theo phân loại
                if (type && [1, 2, 3, 4, 5, 6].includes(Number(type))) {
                    conditionObj.type = type
                } else {
                    delete conditionObj.type
                }
                
                // Lấy theo người tạo danh bạ
                if (checkObjectIDs(userCreateID)) {
                    conditionObj.userCreate = userCreateID
                }

                // Lấy theo contact cha
                if (parentID && checkObjectIDs(parentID)) {
                    if(!isFamily){
                        conditionObj.parent = parentID
                    }else{

                        // Thành viên gia đình
                        conditionObj.$or = [
                            { parent: parentID },
                            { _id: parentID },
                            { members: { $in: [userID] } },
                        ]
                    }
                }

                // Lấy theo Voucher
                if (checkObjectIDs(voucherID)) {
                    if(!option){
                        let infoVoucher = await FNB_VOUCHER_COLL.findById(voucherID)
                        if (infoVoucher) {
                            conditionObj._id = { $in: infoVoucher.receivers }
                        }
                    }else{
                        let infoVoucher = await STORE_VOUCHER_COLL.findById(voucherID)
                        if (infoVoucher) {
                            conditionObj._id = { $in: infoVoucher.receivers }
                        }
                    } 
                }

                // Phân loại theo thời khoảng
                if(!option){
                    if (isValidDate(fromDate) && isValidDate(toDate)) {
                        conditionObj.joinedDate = {
                            $gte: new Date(fromDate),
                            $lte: new Date(toDate),
                        }
                    }
                }

                if (populates && typeof populates === 'string') {
                    if (!IsJsonString(populates))
                        return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

                    populates = JSON.parse(populates);
                } else {
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                if (keyword) {
                    keyword = stringUtils.removeAccents(keyword)
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    const regSearch = new RegExp(keyword, 'i');

                    conditionObj.namecv = regSearch
                }
                // console.log(conditionObj)

                let conditionObjOrg = {
                    ...conditionObj
                };

                if (lastestID && checkObjectIDs(lastestID)) {
                    let infoData = await ITEM__CONTACT_COLL.findById(lastestID);
                    if (!infoData)
                        return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg })
                    if (!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj = dataPagingAndSort.data.find;
                    sortBy = dataPagingAndSort.data.sort;
                } else {
                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await ITEM__CONTACT_COLL.find(conditionObj)
                    .limit(limit + 1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if (!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor = null;
                if (infoDataAfterGet && infoDataAfterGet.length) {
                    if (infoDataAfterGet.length > limit) {
                        nextCursor = infoDataAfterGet[limit - 1]?._id;
                        infoDataAfterGet.length = limit;
                    }
                }
                let totalRecord = await ITEM__CONTACT_COLL.count(conditionObjOrg);
                let totalPage = Math.ceil(totalRecord / limit);

                return resolve({
                    error: false, data: {
                        listRecords: infoDataAfterGet,
                        limit: limit,
                        totalRecord,
                        totalPage,
                        nextCursor,
                    }, status: 200
                });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Tìm kiếm nhân sự
     * Author: HiepNH
     * Code  : 29/8/2022
     */
    getListByFilter({
        parentID, companyID, receiverID, types, isExportExcel = false,
        requestResponse, fromDate, toDate, marked, userID, departmentsID,
        keyword, limit = 5, lastestID, select, populates = {}, isParent, type, genders }) {
        return new Promise(async (resolve) => {
            try {
                // // Không cho show dữ liệu với các phân vùng chưa thanh toán
                // let checkPer = await AUTH__APP_USER.checkPermissionsAccessApp({appID: appIDCheck, userID })
                // if(!checkPer || checkPer.error)
                //     return resolve({ error: false, data: {listRecords: []}, status: 200 })

                if (limit > 5) {
                    limit = 5;
                }else {
                    limit = +limit;
                }

                let conditionObj = {};
                let sortBy;
                let keys = ['createAt__-1', '_id__-1'];

                const validation = validateParamsObjectID({
                    departmentsID: { value: departmentsID, isRequire: false },
                });
                if (validation.error) return resolve(validation);

                if (populates && typeof populates === 'string') {
                    if (!IsJsonString(populates))
                        return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

                    populates = JSON.parse(populates);
                } else {
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                // Chỉ lấy các mẩu tin cha
                if (isParent) {
                    conditionObj.parent = { $exists: false }
                }

                if (type && [1, 2].includes(Number(type))) {
                    conditionObj.type = Number(type)
                } else {
                    delete conditionObj.type
                }

                // Bộ lọc với nhiều lựa chọn
                genders && genders.length && (conditionObj.gender = { $in: genders });
                departmentsID && departmentsID.length && (conditionObj.department = { $in: departmentsID });
                types && types.length && (conditionObj.type = { $in: types });

                // Ngày làm việc
                if (fromDate && toDate) {
                    conditionObj.workStartDate = { $gte: new Date(fromDate), $lt: moment(toDate, 'YYYY-MM-DD').endOf('day')._d }
                }

                if (companyID) {
                    conditionObj.company = companyID
                }

                if (checkObjectIDs(receiverID)) {
                    conditionObj.receiver = receiverID
                }

                if (requestResponse) {
                    conditionObj.requestResponse = requestResponse
                }

                if (checkObjectIDs(parentID)) {
                    conditionObj.parent = parentID
                }

                if (marked) {
                    conditionObj.usersMarked = { $in: [userID] }
                }

                if (keyword) {
                    keyword = stringUtils.removeAccents(keyword)
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    const regSearch = new RegExp(keyword, 'i');

                    conditionObj.namecv = regSearch
                }

                /**
                 * Sử dụng trong export excel document (hoặc theo bộ lọc)
                 * Trả về điều kiện tra cứu
                 */
                if (isExportExcel) {
                    return resolve({ data: conditionObj, error: false });
                }
                // console.log(conditionObj)

                let conditionObjOrg = { ...conditionObj };
                if (lastestID && checkObjectIDs(lastestID)) {
                    let infoData = await ITEM__CONTACT_COLL.findById(lastestID);
                    if (!infoData)
                        return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
                    if (!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj = dataPagingAndSort.data.find;
                    sortBy = dataPagingAndSort.data.sort;
                } else {
                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await ITEM__CONTACT_COLL.find(conditionObj)
                    .limit(limit + 1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if (!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor = null;
                if (infoDataAfterGet && infoDataAfterGet.length) {
                    if (infoDataAfterGet.length > limit) {
                        nextCursor = infoDataAfterGet[limit - 1]?._id;
                        infoDataAfterGet.length = limit;
                    }
                }
                let totalRecord = await ITEM__CONTACT_COLL.count(conditionObjOrg);
                let totalPage = Math.ceil(totalRecord / limit);

                return resolve({
                    error: false, data: {
                        listRecords: infoDataAfterGet,
                        limit: limit,
                        totalRecord,
                        totalPage,
                        nextCursor,
                        lastestID,
                    }, status: 200
                });

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
        keyword, limit = 5, lastestID, select, populates = {}, ctx }) {
        return new Promise(async (resolve) => {
            try {
                let conditionObj = {};
                let keys = ['createAt__-1', '_id__-1'];
                let sortBy;

                if (limit > 5) {
                    limit = 5
                }

                // POPULATE
                if (populates && typeof populates === 'string') {
                    if (!IsJsonString(populates))
                        return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

                    populates = JSON.parse(populates);
                } else {
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                if (keyword) {
                    keyword = stringUtils.removeAccents(keyword)
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regSearch = new RegExp(keyword, 'i');

                    conditionObj.namecv = regSearch
                }

                let conditionObjOrg = { ...conditionObj };

                if (lastestID && checkObjectIDs(lastestID)) {
                    let infoData = await ITEM__CONTACT_COLL.findById(lastestID);
                    if (!infoData)
                        return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
                    if (!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
                    sortBy = dataPagingAndSort.data.sort;
                } else {
                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await ITEM__CONTACT_COLL.find(conditionObj)
                    .limit(+limit + 1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                if (!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor = null;
                if (infoDataAfterGet && infoDataAfterGet.length) {
                    if (infoDataAfterGet.length > limit) {
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await ITEM__CONTACT_COLL.count(conditionObjOrg);
                let totalPage = Math.ceil(totalRecord / limit);

                // Record Traffic
                //await ctx.call(`${CF_DOMAIN_SERVICES.ANALYSIS}.${CF_ACTIONS_ANALYSIS.HISTORY_TRAFFIC_INSERT}`, dataTF)

                return resolve({
                    error: false, data: {
                        listRecords: infoDataAfterGet,
                        limit: +limit,
                        totalRecord,
                        totalPage,
                        nextCursor,
                    }, status: 200
                });

            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Dev: HiepNH
     * Func: Download Template Excel
     * Date: 8/12/2022
     */
    downloadTemplateImportExcel({ companyID, userID, ctx }) {
        return new Promise(async resolve => {
            try {
                let listDepartment = await ITEM__DEPARTMENT_COLL.find({ company: companyID }).select('name').limit(500)
                let listPosition = await ITEM__POSITION_COLL.find({ company: companyID }).select('name').limit(500)
                let listDoctype = await ITEM__DOCTYPE_COLL.find({ company: companyID }).select('name').limit(500)
                let listUser = await USER_COLL.find({ company: companyID })
                .populate({
                    path: 'department position',
                    select: '_id  name',
                })
                .select('fullname createAt').limit(500)
                let listFunda = await ITEM__FUNDA_COLL.find({ company: companyID }).select('name').limit(500)
                let listContract = await ITEM__CONTRACT_COLL.find({ company: companyID }).select('name sign').limit(500)
                let listArea = await ITEM__AREA_COLL.find({ level: 3 }).select('name parent')
                    .populate({
                        path: 'parent',
                        select: '_id  name',
                        populate: {
                            path: 'parent',
                            select: '_id  name',
                        }
                    })

                let listContact = await ITEM__CONTACT_COLL.find({ company: companyID, type: 1 }).limit(1000)
                    .populate({
                        path: 'funda department position field property contractType workingStatus area area1 area2 sale linkUser',
                        select: '_id name fullname parent',
                        populate: {
                            path: 'parent',
                            select: '_id  name',
                            populate: {
                                path: 'parent',
                                select: '_id  name',
                            }
                        }
                    })
                    .sort({ '_id': -1 })

                // Modify the workbook.
                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/contact_import_template.xlsm')))
                    .then(async workbook => {

                        var i = 3;
                        listContact?.forEach((item, index) => {
                            workbook.sheet("Export").row(i).cell(1).value(`${item._id}`)
                            workbook.sheet("Export").row(i).cell(2).value((item.type && Number(item.type) >= 1) ? CONTACT_CLASSIFY[Number(item.type - 1)].text : '')
                            workbook.sheet("Export").row(i).cell(3).value((item.subtype && Number(item.subtype) >= 1) ? HUMAN_CLASSIFY[Number(item.type - 1)].text : '')
                            workbook.sheet("Export").row(i).cell(4).value(item.name)
                            workbook.sheet("Export").row(i).cell(5).value(item?.sign)
                            workbook.sheet("Export").row(i).cell(6).value(item?.description)
                            workbook.sheet("Export").row(i).cell(7).value(item?.note)
                            workbook.sheet("Export").row(i).cell(8).value(item?.birthday)
                            workbook.sheet("Export").row(i).cell(9).value((item.gender && Number(item.gender) >= 1) ? CONTACT_GENDER[Number(item.gender - 1)].text : '')
                            workbook.sheet("Export").row(i).cell(10).value(item?.phone)
                            workbook.sheet("Export").row(i).cell(11).value(item?.email)
                            workbook.sheet("Export").row(i).cell(12).value(item?.funda?.name)
                            workbook.sheet("Export").row(i).cell(13).value(item?.department?.name)
                            workbook.sheet("Export").row(i).cell(14).value(item?.position?.name)
                            workbook.sheet("Export").row(i).cell(15).value(item?.field?.name)
                            workbook.sheet("Export").row(i).cell(16).value(item?.property?.name)
                            workbook.sheet("Export").row(i).cell(17).value((item.status && Number(item.status) >= 1) ? PAYMENT_STATUS[Number(item.status - 1)].text : '')
                            workbook.sheet("Export").row(i).cell(18).value(item?.identity)
                            workbook.sheet("Export").row(i).cell(19).value(item?.dateProvice)
                            workbook.sheet("Export").row(i).cell(20).value(item?.place)
                            workbook.sheet("Export").row(i).cell(21).value(item?.taxid)
                            workbook.sheet("Export").row(i).cell(22).value(item?.insuranceNumber)
                            workbook.sheet("Export").row(i).cell(23).value(item?.insuranceSign)
                            workbook.sheet("Export").row(i).cell(24).value(item?.insuranceDate)
                            workbook.sheet("Export").row(i).cell(25).value(item?.sallaryBasic)
                            workbook.sheet("Export").row(i).cell(26).value(item?.insuranceFee)
                            workbook.sheet("Export").row(i).cell(27).value((item.insuranceStatus && Number(item.insuranceStatus) >= 1) ? INSURANCE_STATUS[Number(item.insuranceStatus - 1)].text : '')
                            workbook.sheet("Export").row(i).cell(28).value(item?.bankAccount)
                            workbook.sheet("Export").row(i).cell(29).value(item?.signerIn)
                            workbook.sheet("Export").row(i).cell(30).value(item?.workStartDate)
                            workbook.sheet("Export").row(i).cell(31).value(item?.contractDate)
                            workbook.sheet("Export").row(i).cell(32).value(item?.contractValid)
                            workbook.sheet("Export").row(i).cell(33).value(item?.contractExpire)
                            workbook.sheet("Export").row(i).cell(34).value(item?.contractType?.name)
                            workbook.sheet("Export").row(i).cell(35).value(item?.contractSign)
                            workbook.sheet("Export").row(i).cell(36).value(item?.workingStatus?.name)
                            workbook.sheet("Export").row(i).cell(37).value(item?.dayOff)
                            workbook.sheet("Export").row(i).cell(38).value(item?.signerOut)
                            workbook.sheet("Export").row(i).cell(39).value(item?.appointDate)
                            workbook.sheet("Export").row(i).cell(40).value(item?.changeSallaryDate)
                            workbook.sheet("Export").row(i).cell(41).value()
                            workbook.sheet("Export").row(i).cell(42).value(item?.graduationYear)
                            workbook.sheet("Export").row(i).cell(43).value(item?.address)
                            workbook.sheet("Export").row(i).cell(44).value(item?.area ? `${item?.area?.name},${item?.area?.parent?.name},${item?.area?.parent?.parent?.name}` : '')
                            workbook.sheet("Export").row(i).cell(45).value(item?.area1 ? `${item?.area1?.name},${item?.area1?.parent?.name},${item?.area1?.parent?.parent?.name}` : '')
                            workbook.sheet("Export").row(i).cell(46).value(item?.area2 ? `${item?.area2?.name},${item?.area2?.parent?.name},${item?.area2?.parent?.parent?.name}` : '')
                            workbook.sheet("Export").row(i).cell(47).value(item?.sale?.fullname)
                            workbook.sheet("Export").row(i).cell(48).value(item?.linkUser?.fullname)
                            workbook.sheet("Export").row(i).cell(49).value(item?.family)
                            workbook.sheet("Export").row(i).cell(50).value((item.familyPolicy && Number(item.familyPolicy) >= 1) ? CONTACT_POLICY[Number(item.familyPolicy - 1)].text : '')
                            workbook.sheet("Export").row(i).cell(51).value((item.realStatus && Number(item.realStatus) >= 1) ? PERSONAL_STATUS[Number(item.realStatus - 1)].text : '')
                            workbook.sheet("Export").row(i).cell(52).value((item.new && Number(item.new) >= 1) ? CONTACT_NEW[Number(item.new - 1)].text : '')
                            workbook.sheet("Export").row(i).cell(53).value(item?.joinedDate)
                            workbook.sheet("Export").row(i).cell(54).value(item?.dataSource)
                            workbook.sheet("Export").row(i).cell(55).value(item?.bank)

                            i++
                        });

                        var i = 2
                        listFunda?.forEach((item, index) => {
                            workbook.sheet("DanhMuc").row(i).cell(17).value(`${item._id}`);
                            workbook.sheet("DanhMuc").row(i).cell(18).value(`${item.name}`)
                            i++
                        })

                        var i = 2
                        listDepartment?.forEach((item, index) => {
                            workbook.sheet("DanhMuc").row(i).cell(19).value(`${item._id}`);
                            workbook.sheet("DanhMuc").row(i).cell(20).value(`${item.name}`)
                            i++
                        })

                        var i = 2
                        listPosition?.forEach((item, index) => {
                            workbook.sheet("DanhMuc").row(i).cell(21).value(`${item._id}`);
                            workbook.sheet("DanhMuc").row(i).cell(22).value(`${item.name}`)
                            i++
                        })

                        var i = 2
                        listDoctype?.forEach((item, index) => {
                            workbook.sheet("DanhMuc").row(i).cell(23).value(`${item._id}`);
                            workbook.sheet("DanhMuc").row(i).cell(24).value(`${item.name}`)
                            i++
                        })

                        var i = 2
                        listArea?.forEach((item, index) => {
                            workbook.sheet("DanhMuc").row(i).cell(25).value(`${item._id}`);
                            workbook.sheet("DanhMuc").row(i).cell(26).value(`${item.name},${item?.parent.name},${item?.parent?.parent.name}`)
                            i++
                        })

                        var i = 2
                        listUser?.forEach((item, index) => {
                            workbook.sheet("DanhMuc").row(i).cell(27).value(`${item._id}`);
                            workbook.sheet("DanhMuc").row(i).cell(28).value(`${item.fullname}`)

                            workbook.sheet("Temp").row(i).cell(2).value(`${item._id}`);
                            workbook.sheet("Temp").row(i).cell(3).value(`${item.fullname}`)
                            workbook.sheet("Temp").row(i).cell(4).value(`${item?.department?.name}`)
                            workbook.sheet("Temp").row(i).cell(5).value(`${item?.position?.name}`)
                            workbook.sheet("Temp").row(i).cell(6).value(item.createAt)

                            i++
                        })

                        var i = 2
                        listContract?.forEach((item, index) => {
                            workbook.sheet("DanhMuc").row(i).cell(29).value(`${item._id}`);
                            workbook.sheet("DanhMuc").row(i).cell(30).value(`${item.name}`)
                            i++
                        })

                        var i = 2
                        listContact?.forEach((item, index) => {
                            workbook.sheet("DanhMuc").row(i).cell(37).value(`${item._id}`);
                            workbook.sheet("DanhMuc").row(i).cell(38).value(`${item.name}`)
                            i++
                        })

                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `template_import_contact_${now.getTime()}.xlsm`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                        await workbook.toFileAsync(pathWriteFile);
                        const result = await uploadFileS3(pathWriteFile, fileName);

                        fs.unlinkSync(pathWriteFile);
                        return resolve({ error: false, data: result?.Location, status: 200 });
                    });

            } catch (error) {
                console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: importFromExcel
     * Code: HiepNH
     * Date: 8/12/2022
     */
    importFromExcel({ option, companyID, dataImport, userID }) {
        return new Promise(async resolve => {
            try {
                const dataImportJSON = JSON.parse(dataImport);
                let index = 0;
                let errorNumber = 0;

                // console.log({_______________:dataImportJSON.length})
                // console.log(dataImportJSON)

                // IMPORT DANH BẠ
                if (option == 1) {
                    // let arrPhone = []
                    // for (const data of dataImportJSON) {
                    //     arrPhone.push(data?.__EMPTY_9)
                    // }
                    // let listErr =  await ITEM__CONTACT_COLL.find({company: companyID, phone: {$in: arrPhone}}).select('name phone')

                    // // Tải báo cáo lỗi
                    // if(listErr && listErr.length > 0){
                    //     return resolve({ error: false, data: listErr, status: 200 });
                    // }else{

                    // }

                    for (const data of dataImportJSON) {
                        // Chỉ lấy dữ liệu từ mẩu tin thứ 2 trở đi
                        if (index > 0 && index < 51) {
                            let prepareData = {
                                authorID: userID,
                                contactID: data?.__EMPTY,
                                type: data?.__EMPTY_83, //
                                subtype: data?.__EMPTY_84, //
                                name: data?.__EMPTY_3,
                                sign: data?.__EMPTY_4,
                                description: data?.__EMPTY_5,
                                note: data?.__EMPTY_6,
                                birthday: data?.__EMPTY_89, //
                                gender: data?.__EMPTY_87, //
                                phone: data?.__EMPTY_9,
                                email: data?.__EMPTY_10,
                                fundaID: data?.__EMPTY_101, //
                                department: data?.__EMPTY_102,
                                position: data?.__EMPTY_103,
                                field: data?.__EMPTY_104,
                                property: data?.__EMPTY_105,
                                status: data?.__EMPTY_88, //
                                identity: data?.__EMPTY_17,
                                dateProvice: data?.__EMPTY_90, //
                                place: data?.__EMPTY_19,
                                taxid: data?.__EMPTY_20,
                                insuranceNumber: data?.__EMPTY_21,
                                insuranceSign: data?.__EMPTY_22,
                                insuranceDate: data?.__EMPTY_91, //
                                sallaryBasic: data?.__EMPTY_24,
                                insuranceFee: data?.__EMPTY_25,
                                insuranceStatus: data?.__EMPTY_81, //
                                bankAccount: data?.__EMPTY_27,
                                signerIn: data?.__EMPTY_28,
                                workStartDate: data?.__EMPTY_92, //
                                contractDate: data?.__EMPTY_93, //
                                contractValid: data?.__EMPTY_94, //
                                contractExpire: data?.__EMPTY_95, //
                                contractType: data?.__EMPTY_106, //
                                contractSign: data?.__EMPTY_34,
                                workingStatus: data?.__EMPTY_107, //
                                dayOff: data?.__EMPTY_96, //
                                signerOut: data?.__EMPTY_37,
                                appointDate: data?.__EMPTY_97, //
                                changeSallaryDate: data?.__EMPTY_98, //
                                graduationYear: data?.__EMPTY_99, //
                                address: data?.__EMPTY_42,
                                area: data?.__EMPTY_108, //
                                area1: data?.__EMPTY_109, //
                                area2: data?.__EMPTY_110, //
                                saleID: data?.__EMPTY_111, //
                                linkUser: data?.__EMPTY_112, //
                                family: data?.__EMPTY_48,
                                familyPolicy: data?.__EMPTY_82, //
                                realStatus: data?.__EMPTY_85, //
                                new: data?.__EMPTY_86, //
                                joinedDate: data?.__EMPTY_100, //
                                dataSource: data?.__EMPTY_53,
                                bank: data?.__EMPTY_54,
                            }
                            // console.log(prepareData);

                            if (data?.__EMPTY && checkObjectIDs(data?.__EMPTY)) {
                                let infoAfterInsert = await this.update(prepareData);
                                if (infoAfterInsert.error) {
                                    errorNumber++;
                                }
                            } else {
                                let infoAfterInsert = await this.insert(prepareData);
                                if (infoAfterInsert.error) {
                                    errorNumber++;
                                }
                            }
                        }
                        index++;
                    }
                }

                // IMPORT HỒ SƠ NHÂN SỰ
                else if (option == 2) {
                    for (const data of dataImportJSON) {
                        // Chỉ lấy dữ liệu từ mẩu tin thứ 2 trở đi
                        if (index > 0 && index <= 100) {
                            let dataInsert = {
                                userCreate: userID,
                                contactID: data?.__EMPTY_56,
                                type: data?.__EMPTY_43,
                                fromDate: data?.__EMPTY_46,
                                toDate: data?.__EMPTY_47,
                                workplace: data?.__EMPTY_6,
                                reference: data?.__EMPTY_7,
                                currentArea3: data?.__EMPTY_49,
                                item: data?.__EMPTY_9,
                                project: data?.__EMPTY_10,
                                client: data?.__EMPTY_11,
                                position2: data?.__EMPTY_50,
                                contract: data?.__EMPTY_51,
                                name: data?.__EMPTY_14,
                                sign: data?.__EMPTY_15,
                                place: data?.__EMPTY_16,
                                note: data?.__EMPTY_19,
                                description: data?.__EMPTY_18,
                                number: data?.__EMPTY_26,
                                store: data?.__EMPTY_28,
                                status: data?.__EMPTY_45,
                                field2: data?.__EMPTY_52,
                                educationalBackground2: data?.__EMPTY_53,
                                certificateType: data?.__EMPTY_54,
                                certificateName: data?.__EMPTY_55,
                                certificateGrade: data?.__EMPTY_44
                            }
                            // console.log(dataInsert);

                            let infoAfterInsert = await CONTACT_DOCUMENT_MODEL.insert(dataInsert);
                            if (infoAfterInsert.error) {
                                errorNumber++;
                            }

                        }
                        index++;
                    }
                }

                // IMPORT NHANH DANH BẠ
                else if(option == 3){
                    for (const data of dataImportJSON) {
                        // Chỉ lấy dữ liệu từ mẩu tin thứ 2 trở đi
                        if (index > 0 && index < 51) {

                            let prepareData = {
                                companyID,
                                authorID: userID,
                                name: data?.__EMPTY,
                                phone: data?.__EMPTY_1,
                                fundaID: data?.__EMPTY_2,
                                note: 'Import nhanh từ excel',
                                parent: data?.__EMPTY_3,
                                support: data?.__EMPTY_4,
                                gender: data?.__EMPTY_5, 
                                address: data?.__EMPTY_6,
                                type: data?.__EMPTY_7,
                                linkUser: data?.__EMPTY_8,
                                birthday: data?.__EMPTY_10,
                            }

                            let infoAfterInsert = await this.insert(prepareData);
                            if (infoAfterInsert.error) {
                                errorNumber++;
                            }
                        }

                        index++;
                    }
                }

                if (errorNumber != 0)
                    return resolve({ error: true, message: "Import failed" });

                return resolve({ error: false, message: "Import successfull" });
            } catch (error) {
                console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    exportExcel({ userID, companyID, type, filterParams, ctx, queue }) {
        return new Promise(async resolve => {
            try {
                let conditionObj = {};
                let resultGetList = { error: true };

                switch (type) {
                    case '1':
                        resultGetList = await this.getListByFilter({
                            ...filterParams,
                            type: 1,
                            userID,
                            companyID,
                            isExportExcel: true
                        });
                        break;
                    case '2':
                        resultGetList = await this.getList({
                            ...filterParams,
                            type: 1,
                            userID,
                            companyID,
                            isExportExcel: true
                        });
                        break;
                    default:
                        resultGetList = await this.getListByFilter({
                            ...filterParams,
                            type: 1,
                            userID,
                            companyID,
                            isExportExcel: true
                        });
                        break;
                }

                if (!resultGetList.error) {
                    conditionObj = resultGetList.data;
                }

                await queue.add("export_excel", {
                    filterCondition: conditionObj,
                    userID,
                }, {
                    backoff: 3,
                    attempts: 3
                })

                return resolve({ error: false })

            } catch (error) {
                console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    exportExcelByFilter({ option, year, userID, companyID, filterParams, fromDate, toDate, page, unit, validatePhone, validateMail, ctx }) {
        return new Promise(async resolve => {
            try {
                // Tải danh sách theo điều kiện lọc
                if (!option) {
                    const populates = JSON.stringify({
                        path: 'department position field property area area1 area2 linkUser workingStatus contractType documents',
                        select: 'name sign fullname type educationalBackground2 field2 certificateType certificateName fromDate toDate workplace reference numberOnLeave note',
                        populate: {
                            path: 'parent educationalBackground2 field2 certificateType certificateName',
                            select: 'name',
                            populate: {
                                path: 'parent',
                                select: 'name',
                            }
                        }
                    })

                    const { data, error } = await this.getListByFilter({
                        ...filterParams,
                        populates,
                        type: 1,
                        userID,
                        companyID,
                        isExportExcel: false,
                        ctx
                    });

                    // console.log(data?.listRecords)

                    if (error || !data?.listRecords?.length) {
                        return resolve({ data, error })
                    }

                    const result = await this.downloadExcelFile({data: data.listRecords, year: year})
                    return resolve(result);
                }

                else if (Number(option) === 1) {
                    // Khách mới
                    let listDataNew = await FNB_ORDER_COLL.aggregate([
                        {
                            $match: {
                                company: ObjectID(companyID),
                                new: 1,
                                date: {
                                    $gte: moment(fromDate).toDate(),
                                    $lte: moment(toDate).toDate()
                                }
                            }
                        },
                        {
                            $group: {
                                // _id: { customer: "$customer" },
                                // _id: { customer: "$customer", salesChannel: "$salesChannel" },
                                _id: { salesChannel: "$salesChannel" },
                                quantity: { $sum: 1 },
                                // numberOfProducts: { $sum: "$numberOfProducts" },
                                // total: { $sum: "$total" },
                                // discount: { $sum: "$discount" },
                                // salesoff: { $sum: "$salesoff" },
                                // amount: { $sum: "$amount" },
                            }
                        },
                        {
                            $sort: { "quantity": 1 }
                        }
                    ])

                    return resolve({ error: false, data: listDataNew, status: 200 });
                }

                else if (Number(option) === 2) {
                    // console.log('222222222222222223333')

                    let conditionObj = {
                        company: ObjectID(companyID)
                    }

                    if (Number(validatePhone) === 1) {
                        conditionObj.phone = { $exists: true, $ne: null }
                    }

                    if (Number(validateMail) === 1) {
                        conditionObj.email = { $exists: true, $ne: null }
                    }

                    // let totalCustomer = 0, newCustomer = 0

                    let limit = Number(page * unit)
                    let listData = await ITEM__CONTACT_COLL.find(conditionObj)
                        .select('_id name phone email birthday purchasedValue type note getVouchers modifyAt')
                        .sort({ modifyAt: -1 })
                        // .sort({purchasedValue: -1})
                        .limit(limit)

                    // Modify the workbook.
                    XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/contact_ads.xlsx')))
                        .then(async workbook => {

                            var i = 3;
                            listData?.forEach((item, index) => {

                                workbook.sheet("Export").row(i).cell(1).value(Number(index + 1))
                                workbook.sheet("Export").row(i).cell(2).value(item.name)
                                workbook.sheet("Export").row(i).cell(3).value(item?.phone)
                                workbook.sheet("Export").row(i).cell(4).value(item?.email)
                                workbook.sheet("Export").row(i).cell(5).value(item?.birthday)
                                workbook.sheet("Export").row(i).cell(6).value(Number(item?.type))
                                workbook.sheet("Export").row(i).cell(7).value(item?.note)
                                workbook.sheet("Export").row(i).cell(8).value(Number(item?.purchasedValue))
                                if (item?.getVouchers.length && item?.getVouchers.includes("64378d6618c77f00128abe93")) {
                                    workbook.sheet("Export").row(i).cell(9).value('Quan tâm OA')
                                }
                                workbook.sheet("Export").row(i).cell(10).value(item.modifyAt)

                                i++
                            });

                            const now = new Date();
                            const filePath = '../../../files/temporary_uploads/';
                            const fileName = `contact_ads${now.getTime()}.xlsx`;
                            const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                            await workbook.toFileAsync(pathWriteFile);
                            const result = await uploadFileS3(pathWriteFile, fileName);

                            fs.unlinkSync(pathWriteFile);
                            return resolve({ error: false, data: result?.Location, status: 200 });
                        });

                    // return resolve({ error: false, data: listData, status: 200 });
                }

                // Tổng hợp nghỉ phép
                else if (Number(option) === 3) {
                    let yearFilter = new Date().getFullYear()
                    if(year){
                        yearFilter = year
                    }

                    let listData = await TIMESHEET__EXPERT_TIMESHEET_COLL.find({
                        company: ObjectID(companyID),
                        parent: {$exists: true, $ne: null },
                        subtype: 2, // Nghỉ phép
                        $where: `return this.date.getFullYear() === ${Number(yearFilter)}`
                    })
                    .select('date assignee hours note')
                    .populate({
                        path: 'assignee',
                        select: '_id fullname department',
                        populate:{
                            path: 'department',
                            select: '_id name',
                        }
                    })

                    let listUser = await USER_COLL.find({_id: {$in: listData.map(item=>item.assignee)}})
                    .select('fullname department')
                    .sort({"department": 1})
                    .populate({
                        path: 'department',
                        select: '_id name',
                    })
                 
                    // Modify the workbook.
                    XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/contact_export_time_off.xlsx')))
                        .then(async workbook => {
                            workbook.sheet("BieuDo").row(1).cell(3).value(Number(yearFilter))

                            var i = 3;
                            listData?.forEach((item, index) => {

                                workbook.sheet("NghiPhep").row(i).cell(1).value(Number(index + 1))
                                workbook.sheet("NghiPhep").row(i).cell(2).value(item?.assignee?.fullname)
                                workbook.sheet("NghiPhep").row(i).cell(3).value(item?.assignee?.department?.name)
                                workbook.sheet("NghiPhep").row(i).cell(4).value(item?.date)
                                workbook.sheet("NghiPhep").row(i).cell(5).value(Number(item?.hours))
                                workbook.sheet("NghiPhep").row(i).cell(6).value(item?.note)
                                workbook.sheet("NghiPhep").row(i).cell(7).formula(`="T"&MONTH(D${i})&"_"&YEAR(D${i})`)

                                i++
                            });

                            for(var m = 1; m<=12; m++){
                                workbook.sheet("BaoCaoTheoNhanSu").row(2).cell(m+3).value(`T${m}_${year}`)
                            }
        
                            var i = 3;
                            listUser?.forEach((item, index) => {                        
                                workbook.sheet("BaoCaoTheoNhanSu").row(i).cell(1).value(Number(index + 1))
                                workbook.sheet("BaoCaoTheoNhanSu").row(i).cell(2).value(item?.fullname)
                                workbook.sheet("BaoCaoTheoNhanSu").row(i).cell(3).value(item?.department?.name)
        
                                i++
                            })

                            const now = new Date();
                            const filePath = '../../../files/temporary_uploads/';
                            const fileName = `contact_export_time_off${now.getTime()}.xlsx`;
                            const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                            await workbook.toFileAsync(pathWriteFile);
                            const result = await uploadFileS3(pathWriteFile, fileName);

                            fs.unlinkSync(pathWriteFile);
                            return resolve({ error: false, data: result?.Location, status: 200 });
                        });

                    // return resolve({ error: false, data: listData, status: 200 });
                }
            } catch (error) {
                console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    downloadExcelFile({data, year}) {
        // console.log('Bạn vừa tải data về hệ thống')
        return new Promise(resolve => {
            XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/contact_export.xlsx')))
                .then(async workbook => {

                    // let currentYear = new Date().getFullYear()
                    // let currentYear = year
                    workbook.sheet("BaoCao").row(1).cell(3).value(Number(year));

                    // Hàm quy đổi số ngày sang Năm, tháng, ngày
                    function convertDaysToYearsMonthsDays(totalDays) {
                        const years = Math.floor(totalDays / 365); // Tính số năm
                        const remainingDaysAfterYears = totalDays % 365; // Số ngày còn lại sau khi trừ năm
                    
                        const months = Math.floor(remainingDaysAfterYears / 30); // Tính số tháng
                        const days = remainingDaysAfterYears % 30; // Số ngày còn lại sau khi trừ tháng
                    
                        return { years, months, days }; // Trả về một đối tượng chứa số năm, tháng, ngày
                    }

                    let i = 3;
                    data?.forEach((item, index) => {
                        // NhanSu
                        workbook.sheet("NhanSu").row(i).cell(1).value(Number(index + 1));
                        workbook.sheet("NhanSu").row(i).cell(2).value(item.name);
                        workbook.sheet("NhanSu").row(i).cell(3).value(item.sign);
                        workbook.sheet("NhanSu").row(i).cell(4).value(item.subtype >= 1 ? `${HUMAN_CLASSIFY[Number(item.subtype) - 1].text}` : "");
                        workbook.sheet("NhanSu").row(i).cell(5).value(item?.department?.name);
                        workbook.sheet("NhanSu").row(i).cell(6).value(item?.position?.name);
                        workbook.sheet("NhanSu").row(i).cell(7).value(item.gender >= 1 ? `${CONTACT_GENDER[Number(item.gender) - 1].text}` : "");
                        workbook.sheet("NhanSu").row(i).cell(8).value(item.birthday);
                        workbook.sheet("NhanSu").row(i).cell(9).value(item.phone);
                        workbook.sheet("NhanSu").row(i).cell(10).value(item.email);
                        workbook.sheet("NhanSu").row(i).cell(11).value(item?.workingStatus?.name);
                        workbook.sheet("NhanSu").row(i).cell(12).value(item.realStatus >= 1 ? `${PERSONAL_STATUS[Number(item.realStatus) - 1].text}` : "");
                        workbook.sheet("NhanSu").row(i).cell(13).value(item?.contractType?.name);
                        workbook.sheet("NhanSu").row(i).cell(14).value(item.contractSign);
                        workbook.sheet("NhanSu").row(i).cell(15).value(item.identity);
                        workbook.sheet("NhanSu").row(i).cell(16).value(item.dateProvice);
                        workbook.sheet("NhanSu").row(i).cell(17).value(item.place);
                        workbook.sheet("NhanSu").row(i).cell(18).value(item.address);
                        workbook.sheet("NhanSu").row(i).cell(19).value((item?.area != null && item?.area != undefined) ? (`${item?.area?.name}, ${item?.area?.parent?.name}, ${item?.area?.parent?.parent?.name}`) : "");
                        workbook.sheet("NhanSu").row(i).cell(20).value((item?.area1 != null && item?.area1 != undefined) ? (`${item?.area1?.name}, ${item?.area1?.parent?.name}, ${item?.area1?.parent?.parent?.name}`) : "");
                        workbook.sheet("NhanSu").row(i).cell(21).value((item?.area2 != null && item?.area2 != undefined) ? (`${item?.area2?.name}, ${item?.area2?.parent?.name}, ${item?.area2?.parent?.parent?.name}`) : "");
                        workbook.sheet("NhanSu").row(i).cell(22).value(item.taxid);
                        workbook.sheet("NhanSu").row(i).cell(23).value(item.insuranceStatus >= 1 ? `${INSURANCE_STATUS[Number(item.insuranceStatus) - 1].text}` : "");
                        workbook.sheet("NhanSu").row(i).cell(24).value(item.insuranceSign);
                        workbook.sheet("NhanSu").row(i).cell(25).value(item.insuranceDate);
                        workbook.sheet("NhanSu").row(i).cell(26).value((!isNaN(item.sallaryBasic) && item.sallaryBasic != 0) ? Number(item.sallaryBasic) : 0);
                        workbook.sheet("NhanSu").row(i).cell(27).value((!isNaN(item.insuranceFee) && item.insuranceFee != 0) ? Number(item.insuranceFee) : 0);
                        workbook.sheet("NhanSu").row(i).cell(28).value((!isNaN(item.sallaryFactor) && item.sallaryFactor != 0) ? Number(item.sallaryFactor) : 0);
                        workbook.sheet("NhanSu").row(i).cell(29).value((!isNaN(item.sallarySubFactor) && item.sallarySubFactor != 0) ? Number(item.sallarySubFactor) : 0);
                        workbook.sheet("NhanSu").row(i).cell(30).value(item.signerIn);
                        workbook.sheet("NhanSu").row(i).cell(31).value(item.workStartDate);
                        workbook.sheet("NhanSu").row(i).cell(32).value(item.contractDate);
                        workbook.sheet("NhanSu").row(i).cell(33).value(item.contractValid);
                        workbook.sheet("NhanSu").row(i).cell(34).value(item.contractExpire);
                        workbook.sheet("NhanSu").row(i).cell(35).value(item.appointDate);
                        workbook.sheet("NhanSu").row(i).cell(36).value(item.signerOut);
                        workbook.sheet("NhanSu").row(i).cell(37).value(item.dayOff);
                        workbook.sheet("NhanSu").row(i).cell(38).value(item.bankAccount);
                        workbook.sheet("NhanSu").row(i).cell(39).value(item.bank);
                        workbook.sheet("NhanSu").row(i).cell(40).value(item.familyPolicy >= 1 ? `${CONTACT_POLICY[Number(item.familyPolicy) - 1].text}` : "");
                        workbook.sheet("NhanSu").row(i).cell(41).value(item.family);
                        workbook.sheet("NhanSu").row(i).cell(42).value((!isNaN(item.union) && item.union != 0) ? Number(item.union) : 0);
                        workbook.sheet("NhanSu").row(i).cell(43).value((!isNaN(item.share) && item.share != 0) ? Number(item.share) : 0);
                        workbook.sheet("NhanSu").row(i).cell(44).value(item.description);
                        workbook.sheet("NhanSu").row(i).cell(45).value(item.note);
                        workbook.sheet("NhanSu").row(i).cell(46).value(item?.linkUser?.fullname);
                        workbook.sheet("NhanSu").row(i).cell(47).value(item?.files.length);

                        // NhanSu2
                        workbook.sheet("NhanSu2").row(i).cell(1).value(Number(index + 1))
                        workbook.sheet("NhanSu2").row(i).cell(2).value(item.name)
                        workbook.sheet("NhanSu2").row(i).cell(3).value(item?.department?.name)
                        workbook.sheet("NhanSu2").row(i).cell(4).value(item?.position?.name)
                        

                        let str1 = '', str4 = '', str6 = ''
                        if(item?.documents){
                            for(const subitem of item?.documents){
                                if(subitem.type == 1){
                                    str1 = str1 + `Từ ${moment(subitem.fromDate).format('DD/MM/YYYY')} đến ${moment(subitem.toDate).format('DD/MM/YYYY')} làm việc tại ${subitem.workplace} - ${subitem.name} - Người tham chiếu: ${subitem.reference}` + subitem.name + '\n'
                                }
    
                                if(subitem.type == 4){
                                    str4 = str4 + subitem?.educationalBackground2?.name + ' chuyên ngành ' + subitem?.field2?.name + '\n'
                                }
    
                                if(subitem.type == 6){
                                    str6 = str6 + `Ngày ${moment(subitem.fromDate).format('DD/MM/YYYY')}: ${subitem?.name} - ${subitem?.note}` + '\n'
                                }else{
                                    str6 = 'Không'
                                }
                            }
                        }

                        let duration = Number(getTimeBetween(new Date(), item?.workStartDate)/(24*60*60)).toFixed(0)
                        const result = convertDaysToYearsMonthsDays(duration);

                        workbook.sheet("NhanSu2").row(i).cell(5).value(str4)
                        workbook.sheet("NhanSu2").row(i).cell(6).value((item?.area2 != null && item?.area2 != undefined) ? (`${item?.area2?.name}, ${item?.area2?.parent?.name}, ${item?.area2?.parent?.parent?.name}`) : "")
                        workbook.sheet("NhanSu2").row(i).cell(7).value(item.phone)
                        workbook.sheet("NhanSu2").row(i).cell(8).value(item?.workStartDate)
                        workbook.sheet("NhanSu2").row(i).cell(9).value(item?.workStartDate ? `${result.years} năm, ${result.months} tháng, ${result.days} ngày` : '')
                        workbook.sheet("NhanSu2").row(i).cell(10).value(item?.sallary ? Number(item?.sallary) : 0)
                        workbook.sheet("NhanSu2").row(i).cell(11).value(item?.changeSallaryDate != null ? `Ngày ${moment(item?.changeSallaryDate).format('DD/MM/YYYY')}` : '')
                        workbook.sheet("NhanSu2").row(i).cell(12).value(str1)
                        workbook.sheet("NhanSu2").row(i).cell(13).value(str6)
                        workbook.sheet("NhanSu2").row(i).cell(14).value(str6)
                        workbook.sheet("NhanSu2").row(i).cell(15).value(item?.linkUser ? Number(item?.linkUser?.numberOnLeave) : 0)
                        // workbook.sheet("NhanSu2").row(i).cell(16).value(Number(0))
                        workbook.sheet("NhanSu2").row(i).cell(17).value(Number(duration))
                        
                        i++
                    });

                    const now = new Date();
                    const filePath = '../../../files/temporary_uploads/';
                    const fileName = `BaoCaoNhanSu_${now.getTime()}.xlsx`;
                    const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                    await workbook.toFileAsync(pathWriteFile);
                    const result = await uploadFileS3(pathWriteFile, fileName);

                    fs.unlinkSync(pathWriteFile);
                    return resolve({ error: false, data: result?.Location, status: 200 });
                });
        })
    }
}

exports.MODEL = new Model;