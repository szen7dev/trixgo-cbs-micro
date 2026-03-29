"use strict";

const BaseModel                         = require('../../../tools/db/base_model.js');
const ObjectID                          = require('mongoose').Types.ObjectId;
const XlsxPopulate                      = require('xlsx-populate')
const fs                                = require('fs')
const path                              = require('path')
const { uploadFileS3 }                  = require('../../../tools/s3/index.js')
const moment                            = require('moment');

/**
 * DOMAIN AND ACTIONS
 */

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index')
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils.js')
const { isValidDate }                   = require('../../../tools/utils/time_utils.js')
const stringUtils					    = require('../../../tools/utils/string_utils.js')

/**
 * COLLECTIONS
 */
const AUTH__USER_COLL                   = require('../../auth/database/auth.user-coll.js')
const ITEM__CONTACT_COLL                = require('../../item/database/item.contact-coll.js')
const ITEM__DOCTYPE_COLL                = require('../../item/database/item.doctype-coll.js')
const CRM__GROW_TRACK_COLL              = require('../database/crm.grow_track-coll')
const CRM__VNG_EVENT_COLL               = require('../database/crm.vng_event-coll')

const AUTH__USER                        = require('../.../../../auth/model/auth.user-model').MODEL
const AUTH__APP_USER                    = require('../.../../../auth/model/auth.app_users').MODEL
const AUTH__APP_ROLE_MENU               = require('../.../../../auth/model/auth.app_role_menu').MODEL
const ITEM__CONTACT_MODEL               = require('../../item/model/item.contact-model').MODEL
const CRM_HABIT_MODEL                   = require('../model/crm.habit-model').MODEL

class Model extends BaseModel {

    constructor() {
        super(CRM__GROW_TRACK_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 22/11/2023
     */
    insert({ userID, emailUser, companyID, phone, contactID, status, birthday, gender, height, weight, name, note, facebook, tiktok, parentName, email, fatherHeight, motherHeight, date, desiredHeight, routine, pubertyOnsetDate, boneAge, motherName, motherPhone, motherEmail, supportID, secialistID, sourceID, productID, quantity, unitPrice, eventID }) {
        const that = this;
        return new Promise(async resolve => {
            try {
                if(emailUser.toString() == 'guest.lamin@gmail.com')
                    return resolve({ error: true, message: "Bạn không có quyền" })

                // Kiểm tra quyền được đo cao
                let infoPer = await AUTH__APP_ROLE_MENU.getPermissionToAccessOneMenuOfApp({ 
                    type: 1, 
                    menu: '67cd26c32f3dbd0012e41555', // Màn hình đo cao
                    user: userID, 
                    app: '61e049f6fdebf77b072d1b16', // App Habit
                    company: companyID
                })

                if(infoPer && infoPer.data && infoPer.data.create >= 1){
                    if(phone){
                        // Hàm kiểm tra Phone
                        const strValid = phone.toLowerCase().trim();

                        function isValidVietnamPhoneNumber(str) {
                            const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
                            return phoneRegex.test(str);
                        }

                        if(!isValidVietnamPhoneNumber(strValid))
                            return resolve({ error: true, message: "Số điện thoại không hợp lệ. Hãy vui lòng thử lại" })
                    }else{
                        if(checkObjectIDs(contactID)){
                            if(!height || !weight)
                                return resolve({ error: true, message: "Ngày sinh, chiều cao, cân nặng không hợp lệ" })
                        }else{
                            if(!name || !birthday || !height || !weight)
                            return resolve({ error: true, message: "Tên, ngày sinh, chiều cao, cân nặng không hợp lệ" })
                        }
                    }

                    //__________Khai báo và validate dữ liệu
                    let dataInsert = {
                        company: companyID,
                        userCreate: userID,
                    }

                    if(checkObjectIDs(eventID)){
                        dataInsert.event = eventID;
                    }

                    if(checkObjectIDs(supportID)){
                        dataInsert.support = supportID;
                    }

                    let convertStr = '';

                    if(!isNaN(status) && [1,2].includes(Number(status))){
                        dataInsert.status = status;
                    }

                    if(!isNaN(gender) && [1,2,3].includes(Number(gender))){
                        dataInsert.gender = gender;
                    }

                    if(!isNaN(height)){
                        dataInsert.height = height;
                    }

                    if(!isNaN(weight)){
                        dataInsert.weight = weight;
                    }

                    if(!isNaN(fatherHeight)){
                        dataInsert.fatherHeight = fatherHeight;
                    }

                    if(!isNaN(motherHeight)){
                        dataInsert.motherHeight = motherHeight;
                    }

                    if(!isNaN(desiredHeight)){
                        dataInsert.desiredHeight = desiredHeight;
                    }

                    if(birthday && birthday != ""){
                        dataInsert.birthday = birthday;

                        let check = new Date().getFullYear() - new Date(birthday).getFullYear()
                        if(check >= 20)
                            return resolve({ error: true, message: "Chỉ đo cao cho người dưới 20 tuổi" })
                    }

                    if(pubertyOnsetDate && pubertyOnsetDate != ""){
                        dataInsert.pubertyOnsetDate = pubertyOnsetDate;
                    }
                    if(!isNaN(boneAge)){
                        dataInsert.boneAge = boneAge;
                    }
                    if(date && date != ""){
                        dataInsert.date = date;
                    }
                    if(name && name != ""){
                        dataInsert.name = name;
                        convertStr = stringUtils.removeAccents(name)
                    }
                    if(phone && phone != ""){
                        dataInsert.phone = phone;
                        convertStr = convertStr + " " + stringUtils.removeAccents(phone)
                    }
                    if(email && email != ""){
                        dataInsert.email = email;
                        convertStr = convertStr + " " + stringUtils.removeAccents(email)
                    }
                    if(routine && routine != ""){
                        dataInsert.routine = routine;
                    }
                    if(note && note != ""){
                        dataInsert.note = note;
                        convertStr = convertStr + " " + stringUtils.removeAccents(note)
                    }
                    if(facebook && facebook != ""){
                        dataInsert.facebook = facebook;
                        convertStr = convertStr + " " + stringUtils.removeAccents(facebook)
                    }
                    if(tiktok && tiktok != ""){
                        dataInsert.tiktok = tiktok;
                        convertStr = convertStr + " " + stringUtils.removeAccents(tiktok)
                    }
                    if(parentName && parentName != ""){
                        dataInsert.parentName = parentName;
                        convertStr = convertStr + " " + stringUtils.removeAccents(parentName)
                    }

                    if(motherName && motherName != ""){
                        dataInsert.motherName = motherName;
                        convertStr = convertStr + " " + stringUtils.removeAccents(motherName)
                    }

                    if(motherPhone && motherPhone != ""){
                        dataInsert.motherPhone = motherPhone;
                        convertStr = convertStr + " " + stringUtils.removeAccents(motherPhone)
                    }

                    if(motherEmail && motherEmail != ""){
                        dataInsert.motherEmail = motherEmail;
                        convertStr = convertStr + " " + stringUtils.removeAccents(motherEmail)
                    }

                    if(contactID && checkObjectIDs(contactID)){
                        dataInsert.contact = contactID;

                        let infoContact = await ITEM__CONTACT_COLL.findById(contactID).populate({
                            path: 'parent',
                            select: 'phone name'
                        })

                        if(infoContact){
                            dataInsert.name = infoContact?.name;
                            convertStr = convertStr + " " + stringUtils.removeAccents(infoContact?.name)

                            if(infoContact.phone){
                                dataInsert.phone = infoContact?.phone;
                                convertStr = convertStr + " " + stringUtils.removeAccents(infoContact?.phone)
                            }else{
                                dataInsert.phone = infoContact?.parent?.phone;
                                convertStr = convertStr + " " + stringUtils.removeAccents(infoContact?.parent?.phone)
                            }

                            if(infoContact?.birthday && infoContact?.birthday != null){
                                dataInsert.birthday = infoContact?.birthday;
                                
                                // let check = new Date().getFullYear() - new Date(infoContact?.birthday).getFullYear()
                                // if(check >= 20)
                                // return resolve({ error: true, message: "Chỉ đo cao cho người dưới 20 tuổi" })
                            }

                            if(infoContact?.pubertyOnsetDate && infoContact?.pubertyOnsetDate != null){
                                dataInsert.pubertyOnsetDate = infoContact?.pubertyOnsetDate;
                            }

                            if(infoContact?.boneAge && !isNaN(infoContact?.boneAge)){
                                dataInsert.boneAge = infoContact?.boneAge;
                            }else{
                                dataInsert.boneAge = null
                            }
                            
                            dataInsert.gender = infoContact?.gender;
                            dataInsert.parentName = infoContact?.parent?.name;
                        }
                    }

                    if(checkObjectIDs(secialistID)){
                        dataInsert.secialist = secialistID;
                    }

                    if(checkObjectIDs(sourceID)){
                        dataInsert.source = sourceID;
                    }

                    if(checkObjectIDs(productID)){
                        dataInsert.product = productID;
                    }

                    if(!isNaN(quantity) && !isNaN(unitPrice)){
                        dataInsert.quantity = quantity;
                        dataInsert.unitPrice = unitPrice;
                        dataInsert.amount = Number(quantity * unitPrice);
                    }
                    
                    if(convertStr != ""){
                        dataInsert.namecv = convertStr
                    }
                    // console.log(dataInsert)

                    let infoAfterInsert = await this.insertData(dataInsert)
                    if(!infoAfterInsert)
                        return resolve({ error: true, message: "cannot_insert" })

                    // Tính toán đường phân vị và cập nhật
                    let infoNew = await that.getInfo({ trackID: infoAfterInsert._id, userID })
                    if(infoNew){
                        await CRM__GROW_TRACK_COLL.findByIdAndUpdate(infoAfterInsert._id, {
                            percentile: Number(infoNew.P),
                            predictedAdultHeight: Number(infoNew.predictedAdultHeight)
                        }, { new: true })
                    }

                    return resolve({ error: false, data: infoAfterInsert });

                }else{
                    return resolve({ error: true, message: "Bạn không có quyền" })
                }
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Update
     * Author: HiepNH
     * Code: 22/11/2023
     */
    update({ trackID, userID, phone, contactID, status, birthday, date, gender, height, weight, name, note, facebook, tiktok, thumbnailID, imagesID, parentName, email, fatherHeight, motherHeight, desiredHeight, routine, pubertyOnsetDate, boneAge, motherName, motherPhone, motherEmail, supportID, secialistID, sourceID, productID, quantity, unitPrice, eventID }){
        const that = this;
        return new Promise(async (resolve) => {
            try {
                // Dữ liệu kết quả đo ban đầu
                let infoOrg = await CRM__GROW_TRACK_COLL.findById(trackID)

                let dataUpdate = {
                    userUpdate: userID,
                    modifyAt: Date.now(),
                }

                if(imagesID && imagesID.length) {
                    dataUpdate.$addToSet = {
                        images: imagesID,
                    }
    
                    if(!checkObjectIDs(thumbnailID)){
                        dataUpdate.thumbnail = imagesID[0];
                    }
                }

                if(checkObjectIDs(eventID)){
                    dataUpdate.event = eventID;
                }

                if(checkObjectIDs(supportID)){
                    dataUpdate.support = supportID;
                }

                if(!isNaN(status) && [1,2].includes(Number(status))){
                    dataUpdate.status = status;
                }

                if(!isNaN(gender) && [1,2,3].includes(Number(gender))){
                    dataUpdate.gender = gender;
                }

                if(!isNaN(height)){
                    dataUpdate.height = height;
                }

                if(!isNaN(weight)){
                    dataUpdate.weight = weight;
                }

                if(!isNaN(boneAge)){
                    dataUpdate.boneAge = boneAge;
                }
                if(!isNaN(fatherHeight)){
                    dataUpdate.fatherHeight = fatherHeight;
                }

                if(!isNaN(motherHeight)){
                    dataUpdate.motherHeight = motherHeight;
                }

                if(!isNaN(desiredHeight)){
                    dataUpdate.desiredHeight = desiredHeight;
                }

                if(checkObjectIDs(contactID)){
                    dataUpdate.contact = contactID;
                }

                if(checkObjectIDs(secialistID)){
                    dataUpdate.secialist = secialistID;
                }

                if(checkObjectIDs(sourceID)){
                    dataUpdate.source = sourceID;
                }

                if(checkObjectIDs(productID)){
                    dataUpdate.product = productID;
                }

                if(!isNaN(quantity) && !isNaN(unitPrice)){
                    dataUpdate.quantity = quantity;
                    dataUpdate.unitPrice = unitPrice;
                    dataUpdate.amount = Number(quantity * unitPrice);
                }

                if(birthday && birthday != ""){
                    dataUpdate.birthday = birthday;
                }
                if(pubertyOnsetDate && pubertyOnsetDate != ""){
                    dataUpdate.pubertyOnsetDate = pubertyOnsetDate;
                }else{
                    dataUpdate.pubertyOnsetDate = null;
                }
                if(date && date != ""){
                    dataUpdate.date = date;
                }

                let convertStr = ''
                if(name && name != ""){
                    dataUpdate.name = name;
                    convertStr = stringUtils.removeAccents(name)
                }
                if(parentName && parentName != ""){
                    dataUpdate.parentName = parentName;
                    convertStr = convertStr + " " + stringUtils.removeAccents(parentName)
                }
                if(phone && phone != ""){
                    dataUpdate.phone = phone;
                    convertStr = convertStr + " " + stringUtils.removeAccents(phone)
                }
                if(email && email != ""){
                    dataUpdate.email = email;
                    convertStr = convertStr + " " + stringUtils.removeAccents(email)
                }
                if(routine && routine != ""){
                    dataUpdate.routine = routine;
                }
                if(note && note != ""){
                    dataUpdate.note = note;
                    convertStr = convertStr + " " + stringUtils.removeAccents(note)
                }
                if(facebook && facebook != ""){
                    dataUpdate.facebook = facebook;
                    convertStr = convertStr + " " + stringUtils.removeAccents(facebook)
                }
                if(tiktok && tiktok != ""){
                    dataUpdate.tiktok = tiktok;
                    convertStr = convertStr + " " + stringUtils.removeAccents(tiktok)
                }

                if(motherName && motherName != ""){
                    dataUpdate.motherName = motherName;
                    convertStr = convertStr + " " + stringUtils.removeAccents(motherName)
                }

                if(motherPhone && motherPhone != ""){
                    dataUpdate.motherPhone = motherPhone;
                    convertStr = convertStr + " " + stringUtils.removeAccents(motherPhone)
                }

                if(motherEmail && motherEmail != ""){
                    dataUpdate.motherEmail = motherEmail;
                    convertStr = convertStr + " " + stringUtils.removeAccents(motherEmail)
                }

                if(contactID && checkObjectIDs(contactID)){
                    dataUpdate.contact = contactID;

                    let infoContact = await ITEM__CONTACT_COLL.findById(contactID).populate({
                        path: 'parent',
                        select: 'phone name'
                    })

                    if(infoContact){
                        dataUpdate.name = infoContact?.name;
                        convertStr = convertStr + " " + stringUtils.removeAccents(infoContact?.name)

                        if(infoContact.phone){
                            dataUpdate.phone = infoContact?.phone;
                            convertStr = convertStr + " " + stringUtils.removeAccents(infoContact?.phone)
                        }else{
                            dataUpdate.phone = infoContact?.parent?.phone;
                            convertStr = convertStr + " " + stringUtils.removeAccents(infoContact?.parent?.phone)
                        }

                        if(infoContact?.birthday && infoContact?.birthday != null){
                            dataUpdate.birthday = infoContact?.birthday;
                            
                            // let check = new Date().getFullYear() - new Date(infoContact?.birthday).getFullYear()
                            // if(check >= 20)
                            // return resolve({ error: true, message: "Chỉ đo cao cho người dưới 20 tuổi" })
                        }

                        if(infoContact?.pubertyOnsetDate && infoContact?.pubertyOnsetDate != null){
                            dataUpdate.pubertyOnsetDate = infoContact?.pubertyOnsetDate;
                        }

                        if(infoContact?.boneAge && !isNaN(infoContact?.boneAge)){
                            dataUpdate.boneAge = infoContact?.boneAge;
                        }else{
                            dataUpdate.boneAge = null
                        }
                        
                        dataUpdate.gender = infoContact?.gender;
                        dataUpdate.parentName = infoContact?.parent?.name;
                    }
                }

                if(convertStr != ""){
                    dataUpdate.namecv = convertStr
                }

                let infoAfterUpdate = await CRM__GROW_TRACK_COLL.findByIdAndUpdate(trackID, dataUpdate, { new: true })
                if(!infoAfterUpdate) {
                    return resolve({
                        error: true,
                        message: "Cannot update",
                        keyError: "cannot_update",
                    })
                }

                // Tính toán đường phân vị và cập nhật
                const date1 = new Date(infoAfterUpdate.birthday);
                const date2 = new Date(infoOrg.birthday);
                const date3 = new Date(infoAfterUpdate.pubertyOnsetDate);
                const date4 = new Date(infoOrg.pubertyOnsetDate);

                // Tạo bản sao để tránh làm thay đổi biến gốc nếu cần
                const d1 = new Date(date1).setHours(0, 0, 0, 0);
                const d2 = new Date(date2).setHours(0, 0, 0, 0);
                const d3 = new Date(date3).setHours(0, 0, 0, 0);
                const d4 = new Date(date4).setHours(0, 0, 0, 0);

                // console.log({____1:infoAfterUpdate?.contact})
                // console.log({____2: infoOrg?.contact})

                if(infoAfterUpdate.gender != infoOrg.gender || d1 != d2 || infoAfterUpdate.height != infoOrg.height || infoAfterUpdate.weight != infoOrg.weight || infoAfterUpdate.boneAge != infoOrg.boneAge || d3 != d4 || infoAfterUpdate?.contact?.toString() != infoOrg?.contact?.toString()){
                    // console.log('111===============Cập nhật kết quả đo cao CDC===============')
                    let infoNew = await that.getInfo({ trackID: infoAfterUpdate._id, userID })
                    if(infoNew){
                        await CRM__GROW_TRACK_COLL.findByIdAndUpdate(infoAfterUpdate._id, {
                            percentile: Number(infoNew.P),
                            predictedAdultHeight: Number(infoNew.predictedAdultHeight)
                        }, { new: true })
                    }
                }
                // else{
                //     console.log('22222222222222222222222222222')
                // }

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: getInfo
     * Author: HiepNH
     * Code: 28/10/2025
     */
    getInfo({ option, trackID, userID, select, populates }) {
        return new Promise(async (resolve) => {
            try { 
                /**
                 * CHIỀU CAO
                 * 0-5 tuổi thì WHO theo từng ngày
                 * Trên 5 tuổi thì theo WHO và theo tháng
                 * ---------------
                 * CÂN NẶNG
                 * 0-5 tuổi thì WHO theo từng ngày
                 * 5-10 tuổi thì theo WHO và theo từng tháng
                 * Trên 10 tuổi thì theo BMI và theo từng tháng
                 */  
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

                let infoAterGet = await CRM__GROW_TRACK_COLL.findById(trackID)
                .select(select)
                .populate(populates)

                if(!infoAterGet)
                    return resolve({ error: true, message: "can't_get_info", status: 403 })

                let ageHeightNow = [], ageHeightP3 = [], ageHeightP5 = [], ageHeightP10 = [], ageHeightP25 = [], ageHeightP50 = [], ageHeightP75 = [], ageHeightP90 = [], ageHeightP95 = [], ageHeightP97 = []

                let L, M, S, Z, P, startAge, endAge = 20, hdfs, whoHS, wdfs, whoWS

                let date1 = infoAterGet.birthday, date2 = infoAterGet.date
                let X = infoAterGet.height, Xm = infoAterGet.height/100, W = infoAterGet.weight
                let gender, genderHWho5, genderHWho, genderWWho5, genderWWho;

                /**
                 * Tính toán tuổi xương dựa vào tuổi dậy thì
                 * 1. Nếu ngày dậy thì có giá trị -> tính theo ngày dậy thì
                 * 2. Nếu ngày tuổi xương thực có giá trị -> tính theo ngày tuổi xương thực
                 * 3. Nếu cả 2 trông -> tính theo ngày sinh
                 */
                const DAY_MS = 1000 * 60 * 60 * 24;
                function diffDays(date1, date2) {
                    const d1 = new Date(date1);
                    const d2 = new Date(date2);
                    return Math.round((d2 - d1) / DAY_MS);
                }
                function subtractYearsAsDays(A1, A2) {
                    const base = new Date(A1);
                    if (isNaN(base)) throw new Error("A1 không hợp lệ");
                    if (typeof A2 !== "number" || isNaN(A2)) throw new Error("A2 phải là số");

                    const days = A2 * 365.25;
                    const result = new Date(base.getTime() - days * DAY_MS);
                    return result;
                }

                const ngayDo = new Date(date2)
                const dayDo = ngayDo.getDate();
                const monthDo = ngayDo.getMonth() + 1;
                const yearDo = ngayDo.getFullYear();

                // Áp dụng có tuổi dậy thì
                if(infoAterGet.pubertyOnsetDate && infoAterGet.pubertyOnsetDate != ''){
                    const ngayDayThi = infoAterGet.pubertyOnsetDate
                    const date = new Date(Number(yearDo - 13), monthDo - 1, Number(dayDo - diffDays(ngayDayThi, date2)));
                    if(isValidDate(date)){
                        date1 = new Date(Number(yearDo - 13), monthDo - 1, Number(dayDo - diffDays(ngayDayThi, date2)));
                        // console.log(date); 
                    }
                }
                // Áp dụng có tuổi thực xương
                else{
                    if(infoAterGet.boneAge && !isNaN(infoAterGet.boneAge)){
                        const tuoiThucXuong = infoAterGet.boneAge
                        const result = subtractYearsAsDays(date2, tuoiThucXuong);
                        if(isValidDate(result)){
                            date1 = result
                            // console.log(result); 
                        }
                    }
                }

                if(infoAterGet.gender == 1){
                    // console.log('=====Nam=====')
                    gender = "Male"; // Đường phân vị chiều cao với Nam
                    genderHWho5 = "LFA_boys_z_exp"; // Chuẩn chiều cao cho Nam 5 tuổi trở xuống
                    genderHWho = "MaleHWho"; // Chuẩn chiều cao cho Nam 5 tuổi trở lên
                    genderWWho5 = "WFA_boys_z_exp"; // Chuẩn cân nặng cho Nam 5 tuổi trở xuống
                    genderWWho = "MaleWWho"; // Chuẩn cân nặng cho Nam 5 tuổi trở lên
                }else{
                    // console.log('=====Nữ=====')
                    gender = "Female";
                    genderHWho5 = "LFA_girls_z_exp";
                    genderHWho = "FemaleHWho";
                    genderWWho5 = "WFA_girls_z_exp";
                    genderWWho = "FemaleWWho";
                }

                // Hàm tính số tháng tuổi của trẻ
                function getMonthDifference(date1, date2) {
                    const d1 = new Date(date1);
                    const d2 = new Date(date2);
                  
                    let months = (d2.getFullYear() - d1.getFullYear()) * 12;
                    months += d2.getMonth() - d1.getMonth();
                  
                    // Nếu ngày của date2 nhỏ hơn ngày của date1 => chưa đủ 1 tháng
                    if (d2.getDate() < d1.getDate()) {
                      months -= 1;
                    }
                  
                    return months;
                }

                // Hàm tính số ngày tuổi của trẻ
                function getDayDifference(date1, date2) {
                    const d1 = new Date(date1);
                    const d2 = new Date(date2);

                    // Tính số mili-giây giữa 2 mốc thời gian
                    const diffTime = Math.abs(d2 - d1);

                    // Chia cho số mili-giây trong 1 ngày
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                    return diffDays;
                }

                // Tính tuổi theo số ngày, theo tháng
                let ageInMonths             = getMonthDifference(date1, date2)
                let ageInMonthsByBirthday   = getMonthDifference(infoAterGet.birthday, date2)

                let ageInDays               = getDayDifference(date1, date2)
                let ageInDaysByBirthday     = getDayDifference(infoAterGet.birthday, date2)

                // console.log({date1})
                // console.log({ageInMonths})
                // console.log({ageInMonthsByBirthday})
                // console.log('========================================')
                // console.log({ageInDays})
                // console.log({ageInDaysByBirthday})

                // Hàm tính Zscore theo: X, L, M, S (X là chiều cao của trẻ)
                function calculateZScore(X, L, M, S) {
                    if (L === 0) {
                      return Math.log(X / M) / S;
                    } else {
                      return (Math.pow(X / M, L) - 1) / (L * S);
                    }
                }

                // Hàm tính chiều cao theo: Z, L, M, S
                function calculateHeightFromZ(Z, L, M, S) {
                    if (L === 0) {
                        return M * Math.exp(S * Z);
                    } else {
                        return M * Math.pow(1 + L * S * Z, 1 / L);
                    }
                }

                // Hàm tính P theo Z
                function getPercentileFromZ(z) {
                    const t = 1 / (1 + 0.2316419 * Math.abs(z));
                    const d = 0.3989423 * Math.exp(-z * z / 2);
                    let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
                    prob = z > 0 ? 1 - prob : prob;
                    return prob * 100;
                }

                // Hàm tính chiều cao theo chuẩn theo WHO
                function evaluateHeightW({H, SD2neg, SD1neg, SD0, SD1, SD2}) {
                    let conclusion = '';
                    // console.log({H, SD2neg, SD1neg, SD0, SD1, SD2})
                
                    if (H < SD2neg) {
                        conclusion = 'Dưới chuẩn cấp độ 2';
                    } else if (H >= SD2neg && H < SD1neg) {
                        conclusion = 'Dưới chuẩn cấp độ 1';
                    } else if (H >= SD1neg && H <= SD1) {
                        conclusion = 'Đạt chuẩn';
                    } else if (H > SD1 && H <= SD2) {
                        conclusion = 'Trên chuẩn cấp độ 1';
                    } else if (H > SD2) {
                        conclusion = 'Trên chuẩn cấp độ 2';
                    } else {
                        conclusion = 'Không xác định'; // fallback an toàn
                    }
                
                    return conclusion;
                }

                // Tính chuẩn cân nặng theo WHO
                function evaluateWWHO({ WIndex, SD2neg, SD1neg, SD0, SD1, SD2, W, minQuantity, maxQuantity }) {
                    let conclusion = '';
                    if (WIndex < SD2neg) {
                        conclusion = `Dưới chuẩn cấp độ 2. Bé nhẹ hơn so với cân nặng trung bình là ${Number(SD0 - W).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg. Chuẩn WHO: ${Number(SD0).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg`;
                    } else if (WIndex >= SD2neg && WIndex < SD1neg) {
                        conclusion = `Dưới chuẩn cấp độ 1. Bé nhẹ hơn so với cân nặng trung bình là ${Number(SD0 - W).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg. Chuẩn WHO: ${Number(SD0).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg`;
                    } else if (WIndex >= SD1neg && WIndex <= SD1) {
                        if(W > SD0){
                            conclusion = `Đạt chuẩn. Bé nặng hơn so với cân nặng trung bình là ${Number(W - SD0).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg. Chuẩn WHO: ${Number(SD0).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg`;
                        }else{
                            conclusion = `Đạt chuẩn. Bé nhẹ hơn so với cân nặng trung bình là ${Number(SD0 - W).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg. Chuẩn WHO: ${Number(SD0).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg`;
                        }
                    } else if (WIndex > SD1) {
                        conclusion = `Trên chuẩn cấp độ 1. Bé nặng hơn so với cân nặng trung bình là ${Number(W - SD0).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg. Chuẩn WHO: ${Number(SD0).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg`;
                    } else if (WIndex > SD2) {
                        conclusion = `Trên chuẩn cấp độ 2. Bé nặng hơn so với cân nặng trung bình là ${Number(W - SD0).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg. Chuẩn WHO: ${Number(SD0).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg`;
                    } else {
                        conclusion = `Không xác định`; // fallback an toàn
                    }
                
                    return conclusion;
                }

                // Tính chuẩn cân nặng theo BMI
                function evaluateWBmi({ WIndex, SD2neg, SD1neg, SD1, SD2, W, minQuantity, maxQuantity }) {
                    let conclusion = '';
                
                    if (WIndex < SD2neg) {
                        conclusion = `Gầy. Bé cần tăng tối thiểu ${Number(minQuantity - W).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg. Cân nặng chuẩn từ ${Number(minQuantity).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg đến ${Number(maxQuantity).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg`;
                    } else if (WIndex >= SD2neg && WIndex < SD1neg) {
                        conclusion = `Thiếu cân. Bé cần tăng tối thiểu ${Number(minQuantity - W).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg. Cân nặng chuẩn từ ${Number(minQuantity).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg đến ${Number(maxQuantity).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg`;
                    } else if (WIndex >= SD1neg && WIndex <= SD1) {
                        conclusion = `Đủ cân. Cân nặng chuẩn từ ${Number(minQuantity).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg đến ${Number(maxQuantity).toLocaleString('vi-VN',{minimumFractionDigits: 2,maximumFractionDigits: 2})}kg`;
                    } else if (WIndex > SD1) {
                        conclusion = `Thừa cân. Bé cần giảm tối thiểu ${Number(maxQuantity - W).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg. Cân nặng chuẩn từ ${Number(minQuantity).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg đến ${Number(maxQuantity).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg`;
                    } else if (WIndex > SD2) {
                        conclusion = `Béo phí. Bé cần giảm tối thiểu ${Number(maxQuantity - W).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg. Cân nặng chuẩn từ ${Number(minQuantity).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg đến ${Number(maxQuantity).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg`;
                    } else {
                        conclusion = `Không xác định`; // fallback an toàn
                    }
                
                    return conclusion;
                }

                // Đường dẫn tới file cdc_grow.xlsx
                const filePath = path.join(__dirname, '../../../files/templates/excels/cdc_grow.xlsx');

                // Đọc file
                XlsxPopulate.fromFileAsync(filePath)
                .then(workbook => {
                    const sheet = workbook.sheet(gender);
                    const sheet1 = workbook.sheet(genderHWho);
                    const sheet2 = workbook.sheet(genderWWho);
                    const sheet3 = workbook.sheet(genderHWho5);
                    const sheet4 = workbook.sheet(genderWWho5);

                    const lastRow = sheet.usedRange().endCell().rowNumber();
                    const lastRow1 = sheet1.usedRange().endCell().rowNumber();
                    const lastRow2 = sheet2.usedRange().endCell().rowNumber();
                    const lastRow3 = sheet3.usedRange().endCell().rowNumber();
                    const lastRow4 = sheet4.usedRange().endCell().rowNumber();

                    // Lặp qua từng dòng để tìm Agemos >= ageInMonths
                    if((infoAterGet.pubertyOnsetDate && infoAterGet.pubertyOnsetDate != '') || (infoAterGet.boneAge && infoAterGet.boneAge > 0)){
                        // Tính tháng theo theo tuổi dậy thì/tuổi xương thực (i1) | theo ngày sinh (i2) 
                        // i1 dùng để tính P
                        // i2 dùng để hiển thị dữ liệu biểu đồ bắt đầu từ ngày sinh

                        let i1, i2
                        for (let i = 2; i <= lastRow; i++) {
                            const monthCheck = sheet.cell(`B${i}`).value();
                            if (monthCheck >= ageInMonths) {
                                i1 = i
                                break;
                            }
                        }

                        for (let i = 2; i <= lastRow; i++) {
                            const monthCheck = sheet.cell(`B${i}`).value();
                            if (monthCheck >= ageInMonthsByBirthday) {
                                i2 = i
                                break;
                            }
                        }
                        // console.log({i1, i2})                    

                        // Tính đường phân vị
                        L = sheet.cell(`C${i1}`).value();
                        M = sheet.cell(`D${i1}`).value();
                        S = sheet.cell(`E${i1}`).value();
                        Z = calculateZScore(X, L, M, S);
                        P = Number(getPercentileFromZ(Z).toFixed(2));
                        // console.log({L:L,M:M,S:S,Z:Z,X:X})
                        // console.log({P})

                        let i = i2
                        const agemosCheckNew = sheet.cell(`B${i}`).value();

                        // console.log('==================Theo tuổi dậy thì 11111111111111')
                        // console.log({agemosCheckNew, ageNew: Number(agemosCheckNew/12).toFixed(2)})

                        startAge = Math.ceil(agemosCheckNew / 12);
                        // console.log({startAge})

                        // Lấy các giá trị của điểm bắt đầu
                        ageHeightNow.push({
                            age: Number(Number(agemosCheckNew / 12).toFixed(2)),
                            height: Number(calculateHeightFromZ(Z, L, M, S).toFixed(1)).toFixed(2)
                        })

                        ageHeightP3.push({
                            age: Number(Number(agemosCheckNew / 12).toFixed(2)),
                            height: Number(sheet.cell(`F${i}`).value()).toFixed(2)
                        })

                        ageHeightP5.push({
                            age: Number(Number(agemosCheckNew / 12).toFixed(2)),
                            height: Number(sheet.cell(`G${i}`).value()).toFixed(2)
                        })

                        ageHeightP10.push({
                            age: Number(Number(agemosCheckNew / 12).toFixed(2)),
                            height: Number(sheet.cell(`H${i}`).value()).toFixed(2)
                        })

                        ageHeightP25.push({
                            age: Number(Number(agemosCheckNew / 12).toFixed(2)),
                            height: Number(sheet.cell(`I${i}`).value()).toFixed(2)
                        })

                        ageHeightP50.push({
                            age: Number(Number(agemosCheckNew / 12).toFixed(2)),
                            height: Number(sheet.cell(`J${i}`).value()).toFixed(2)
                        })

                        ageHeightP75.push({
                            age: Number(Number(agemosCheckNew / 12).toFixed(2)),
                            height: Number(sheet.cell(`K${i}`).value()).toFixed(2)
                        })

                        ageHeightP90.push({
                            age: Number(Number(agemosCheckNew / 12).toFixed(2)),
                            height: Number(sheet.cell(`L${i}`).value()).toFixed(2)
                        })

                        ageHeightP95.push({
                            age: Number(Number(agemosCheckNew / 12).toFixed(2)),
                            height: Number(sheet.cell(`M${i}`).value()).toFixed(2)
                        })

                        ageHeightP97.push({
                            age: Number(Number(agemosCheckNew / 12).toFixed(2)),
                            height: Number(sheet.cell(`N${i}`).value()).toFixed(2)
                        })

                        // Lấy các giá trị ứng với từng độ tuổi theo các mốc Tiêu chuẩn để so sánh
                        for (let age = startAge; age <= endAge; age++) {
                            let targetAgemos, targetAgemosNew

                            if(age < 20){
                                targetAgemos = +(age * 12 + 0.5).toFixed(1); // ví dụ 8 tuổi -> 96.5 tháng

                                targetAgemosNew = +((i1 - i2) + age * 12 + 0.5).toFixed(1); // Tính toán cho phần chênh
                                if(targetAgemosNew > 240){
                                    targetAgemosNew = 240
                                }
                            }else{
                                targetAgemos = 240 // Tuổi 20 chỉ có dữ liệu với 240 tháng
                                targetAgemosNew = 240
                            }

                            // console.log({targetAgemos})
                            // console.log({targetAgemosNew})

                            // Lấy dữ liệu của Pnow
                            for (let i = 2; i <= lastRow; i++) {
                                const agemos = sheet.cell(`B${i}`).value();

                                if (agemos >= targetAgemosNew) {
                                    // console.log('================................')
                                    // console.log({age})

                                    const L = sheet.cell(`C${i}`).value();
                                    const M = sheet.cell(`D${i}`).value();
                                    const S = sheet.cell(`E${i}`).value();
                                    // console.log({L:L,M:M,S:S,Z:Z,X:X})
                    
                                    ageHeightNow.push({
                                        age,
                                        height: Number(calculateHeightFromZ(Z, L, M, S).toFixed(1)).toFixed(2)
                                    });

                                    break;
                                }
                            }
                    
                            // Lấy dữ liệu theo các P chuẩn
                            let found = false;
                            for (let i = 2; i <= lastRow; i++) {
                                const agemos = sheet.cell(`B${i}`).value();

                                if (agemos >= targetAgemos) {

                                    ageHeightP3.push({
                                        age,
                                        height: Number(sheet.cell(`F${i}`).value()).toFixed(2)
                                    })
        
                                    ageHeightP5.push({
                                        age,
                                        height: Number(sheet.cell(`G${i}`).value()).toFixed(2)
                                    })
        
                                    ageHeightP10.push({
                                        age,
                                        height: Number(sheet.cell(`H${i}`).value()).toFixed(2)
                                    })
        
                                    ageHeightP25.push({
                                        age,
                                        height: Number(sheet.cell(`I${i}`).value()).toFixed(2)
                                    })
        
                                    ageHeightP50.push({
                                        age,
                                        height: Number(sheet.cell(`J${i}`).value()).toFixed(2)
                                    })
        
                                    ageHeightP75.push({
                                        age,
                                        height: Number(sheet.cell(`K${i}`).value()).toFixed(2)
                                    })
        
                                    ageHeightP90.push({
                                        age,
                                        height: Number(sheet.cell(`L${i}`).value()).toFixed(2)
                                    })
        
                                    ageHeightP95.push({
                                        age,
                                        height: Number(sheet.cell(`M${i}`).value()).toFixed(2)
                                    })
        
                                    ageHeightP97.push({
                                        age,
                                        height: Number(sheet.cell(`N${i}`).value()).toFixed(2)
                                    })

                                    found = true;

                                    break;
                                }
                            }
                    
                            if (!found) {
                                console.warn(`Không tìm thấy dòng phù hợp cho tuổi ${age} (Agemos ~ ${targetAgemos})`);
                            }
                        }
                    }else{
                        for (let i = 2; i <= lastRow; i++) {
                            const agemosCheck = sheet.cell(`B${i}`).value();

                            if (agemosCheck >= ageInMonths) {
                                // console.log('==================Theo ngày sinh 22222222222')
                                // console.log({i})
                                // console.log({agemosCheck, age: Number(agemosCheck/12).toFixed(2)})

                                // Tính đường phân vị
                                L = sheet.cell(`C${i}`).value();
                                M = sheet.cell(`D${i}`).value();
                                S = sheet.cell(`E${i}`).value();
                                Z = calculateZScore(X, L, M, S);
                                P = Number(getPercentileFromZ(Z).toFixed(2));
                                // console.log({L:L,M:M,S:S,Z:Z,X:X})
                                // console.log({P})

                                startAge = Math.ceil(agemosCheck / 12);

                                // Lấy các giá trị của điểm bắt đầu
                                ageHeightNow.push({
                                    age: Number(Number(agemosCheck / 12).toFixed(2)),
                                    height: Number(calculateHeightFromZ(Z, L, M, S).toFixed(1)).toFixed(2)
                                })

                                ageHeightP3.push({
                                    age: Number(Number(agemosCheck / 12).toFixed(2)),
                                    height: Number(sheet.cell(`F${i}`).value()).toFixed(2)
                                })

                                ageHeightP5.push({
                                    age: Number(Number(agemosCheck / 12).toFixed(2)),
                                    height: Number(sheet.cell(`G${i}`).value()).toFixed(2)
                                })

                                ageHeightP10.push({
                                    age: Number(Number(agemosCheck / 12).toFixed(2)),
                                    height: Number(sheet.cell(`H${i}`).value()).toFixed(2)
                                })

                                ageHeightP25.push({
                                    age: Number(Number(agemosCheck / 12).toFixed(2)),
                                    height: Number(sheet.cell(`I${i}`).value()).toFixed(2)
                                })

                                ageHeightP50.push({
                                    age: Number(Number(agemosCheck / 12).toFixed(2)),
                                    height: Number(sheet.cell(`J${i}`).value()).toFixed(2)
                                })

                                ageHeightP75.push({
                                    age: Number(Number(agemosCheck / 12).toFixed(2)),
                                    height: Number(sheet.cell(`K${i}`).value()).toFixed(2)
                                })

                                ageHeightP90.push({
                                    age: Number(Number(agemosCheck / 12).toFixed(2)),
                                    height: Number(sheet.cell(`L${i}`).value()).toFixed(2)
                                })

                                ageHeightP95.push({
                                    age: Number(Number(agemosCheck / 12).toFixed(2)),
                                    height: Number(sheet.cell(`M${i}`).value()).toFixed(2)
                                })

                                ageHeightP97.push({
                                    age: Number(Number(agemosCheck / 12).toFixed(2)),
                                    height: Number(sheet.cell(`N${i}`).value()).toFixed(2)
                                })

                                // ✅ Ngắt vòng lặp sau khi tìm thấy
                                break;
                            }
                        }  
            
                        // Lấy các giá trị ứng với từng độ tuổi theo các mốc Tiêu chuẩn để so sánh
                        for (let age = startAge; age <= endAge; age++) {
                            let targetAgemos

                            if(age < 20){
                                targetAgemos = +(age * 12 + 0.5).toFixed(1); // ví dụ 8 tuổi -> 96.5 tháng
                            }else{
                                targetAgemos = 240 // Tuổi 20 chỉ có dữ liệu với 240 tháng
                            }
                    
                            let found = false;

                            for (let i = 2; i <= lastRow; i++) {
                                const agemos = sheet.cell(`B${i}`).value();

                                if (agemos >= targetAgemos) {
                                    const L = sheet.cell(`C${i}`).value();
                                    const M = sheet.cell(`D${i}`).value();
                                    const S = sheet.cell(`E${i}`).value();
                    
                                    ageHeightNow.push({
                                        age,
                                        height: Number(calculateHeightFromZ(Z, L, M, S).toFixed(1)).toFixed(2)
                                    });

                                    ageHeightP3.push({
                                        age,
                                        height: Number(sheet.cell(`F${i}`).value()).toFixed(2)
                                    })
        
                                    ageHeightP5.push({
                                        age,
                                        height: Number(sheet.cell(`G${i}`).value()).toFixed(2)
                                    })
        
                                    ageHeightP10.push({
                                        age,
                                        height: Number(sheet.cell(`H${i}`).value()).toFixed(2)
                                    })
        
                                    ageHeightP25.push({
                                        age,
                                        height: Number(sheet.cell(`I${i}`).value()).toFixed(2)
                                    })
        
                                    ageHeightP50.push({
                                        age,
                                        height: Number(sheet.cell(`J${i}`).value()).toFixed(2)
                                    })
        
                                    ageHeightP75.push({
                                        age,
                                        height: Number(sheet.cell(`K${i}`).value()).toFixed(2)
                                    })
        
                                    ageHeightP90.push({
                                        age,
                                        height: Number(sheet.cell(`L${i}`).value()).toFixed(2)
                                    })
        
                                    ageHeightP95.push({
                                        age,
                                        height: Number(sheet.cell(`M${i}`).value()).toFixed(2)
                                    })
        
                                    ageHeightP97.push({
                                        age,
                                        height: Number(sheet.cell(`N${i}`).value()).toFixed(2)
                                    })

                                    found = true;

                                    break;
                                }
                            }
                    
                            if (!found) {
                                console.warn(`Không tìm thấy dòng phù hợp cho tuổi ${age} (Agemos ~ ${targetAgemos})`);
                            }
                        }
                    }

                    // Kết thúc đo và in ra thời gian (ví dụ: 'loop_time: 15.234ms')
                    // console.timeEnd(label);

                    /**
                     * KIỂM TRA CHIỀU CAO SO VỚI CHUẨN WHO
                     */
                    let noticeH = ''
                    if((infoAterGet.pubertyOnsetDate && infoAterGet.pubertyOnsetDate != '') || (infoAterGet.boneAge && infoAterGet.boneAge > 0)){
                        // console.log('======Chiều caoxxxxxxxxxxxxxxxxx=======')
                        if(ageInDaysByBirthday <= 1856){
                            for (let i = 2; i <= lastRow3; i++) {
                                const agedaysCheck = sheet3.cell(`A${i}`).value();

                                if (agedaysCheck >= ageInDaysByBirthday) {
                                    whoHS = sheet3.cell(`K${i}`).value();

                                    let SD2neg = sheet3.cell(`I${i}`).value();
                                    let SD1neg = sheet3.cell(`J${i}`).value();
                                    let SD0 = sheet3.cell(`K${i}`).value();
                                    let SD1 = sheet3.cell(`L${i}`).value();
                                    let SD2 = sheet3.cell(`M${i}`).value();

                                    noticeH =  evaluateHeightW({H: X, SD2neg, SD1neg, SD0, SD1, SD2})

                                    // console.log('======Chiều cao 1111111111=======')
                                    // console.log({whoHS})
                                    // console.log({SD0})
                                    // console.log({noticeH})

                                    hdfs = Number(Number(X - whoHS).toFixed(2))

                                    // ✅ Ngắt vòng lặp sau khi tìm thấy
                                    break;
                                }
                            }
                        }else{
                            for (let i = 2; i <= lastRow1; i++) {
                                const agemosCheck = sheet1.cell(`A${i}`).value();

                                if (agemosCheck >= ageInMonthsByBirthday) {
                                    whoHS = sheet1.cell(`K${i}`).value();

                                    let SD2neg = sheet1.cell(`I${i}`).value();
                                    let SD1neg = sheet1.cell(`J${i}`).value();
                                    let SD0 = sheet1.cell(`K${i}`).value();
                                    let SD1 = sheet1.cell(`L${i}`).value();
                                    let SD2 = sheet1.cell(`M${i}`).value();

                                    noticeH =  evaluateHeightW({H: X, SD2neg, SD1neg, SD0, SD1, SD2})

                                    // console.log('======Chiều cao 22222222222=======')
                                    // console.log({whoHS})
                                    // console.log({SD0})
                                    // console.log({noticeH})

                                    hdfs = Number(Number(X - whoHS).toFixed(2))

                                    // ✅ Ngắt vòng lặp sau khi tìm thấy
                                    break;
                                }
                            }
                        }
                    }else{
                        // console.log('======Chiều cao uyyyyyyyyyyyyyyyyyyyyyyyyyyyy=======')
                        if(ageInDays <= 1856){
                            for (let i = 2; i <= lastRow3; i++) {
                                const agedaysCheck = sheet3.cell(`A${i}`).value();

                                if (agedaysCheck >= ageInDays) {
                                    whoHS = sheet3.cell(`K${i}`).value();

                                    let SD2neg = sheet3.cell(`I${i}`).value();
                                    let SD1neg = sheet3.cell(`J${i}`).value();
                                    let SD0 = sheet3.cell(`K${i}`).value();
                                    let SD1 = sheet3.cell(`L${i}`).value();
                                    let SD2 = sheet3.cell(`M${i}`).value();

                                    noticeH =  evaluateHeightW({H: X, SD2neg, SD1neg, SD0, SD1, SD2})

                                    // console.log('======Chiều cao=======')
                                    // console.log({SD0})
                                    // console.log({noticeH})

                                    hdfs = Number(Number(X - whoHS).toFixed(2))

                                    // ✅ Ngắt vòng lặp sau khi tìm thấy
                                    break;
                                }
                            }
                        }else{
                            for (let i = 2; i <= lastRow1; i++) {
                                const agemosCheck = sheet1.cell(`A${i}`).value();

                                if (agemosCheck >= ageInMonths) {
                                    whoHS = sheet1.cell(`K${i}`).value();

                                    let SD2neg = sheet1.cell(`I${i}`).value();
                                    let SD1neg = sheet1.cell(`J${i}`).value();
                                    let SD0 = sheet1.cell(`K${i}`).value();
                                    let SD1 = sheet1.cell(`L${i}`).value();
                                    let SD2 = sheet1.cell(`M${i}`).value();

                                    noticeH =  evaluateHeightW({H: X, SD2neg, SD1neg, SD0, SD1, SD2})

                                    // console.log('======Chiều cao=======')
                                    // console.log({SD0})
                                    // console.log({noticeH})

                                    hdfs = Number(Number(X - whoHS).toFixed(2))

                                    // ✅ Ngắt vòng lặp sau khi tìm thấy
                                    break;
                                }
                            }
                        }
                    }

                    /**
                     * KIỂM TRA CÂN NẶNG SO VỚI CHUẨN WHO, BMI
                     */
                    let noticeW = ''
                    // Dưới 10 tuổi theo WHO
                    if(ageInDays <= 1856){
                        for (let i = 2; i <= lastRow4; i++) {
                            const agedaysCheck = sheet4.cell(`A${i}`).value();
    
                            if (agedaysCheck >= ageInDays) {
                                whoWS = sheet4.cell(`I${i}`).value(); // Không sử dụng cho cân nặng
    
                                let SD2neg = sheet4.cell(`G${i}`).value();
                                let SD1neg = sheet4.cell(`H${i}`).value();
                                let SD0 = sheet4.cell(`I${i}`).value();
                                let SD1 = sheet4.cell(`J${i}`).value();
                                let SD2 = sheet4.cell(`K${i}`).value();

                                let minQuantity = SD1neg, maxQuantity = SD1
    
                                noticeW =  evaluateWWHO({WIndex: W, SD2neg, SD1neg, SD0, SD1, SD2, W, minQuantity, maxQuantity})

                                // console.log('======Cân nặng=======')
                                // console.log({SD0})
                                // console.log({noticeW})
    
                                wdfs = Number(Number(W - whoWS).toFixed(2)) // Không sử dụng cho cân nặng
    
                                // ✅ Ngắt vòng lặp sau khi tìm thấy
                                break;
                            }
                        }
                    }else{
                        if(ageInMonths <= 120){
                            for (let i = 2; i <= 122; i++) {
                                const agemosCheck = sheet2.cell(`A${i}`).value();
        
                                if (agemosCheck >= ageInMonths) {
                                    // console.log({agemosCheck})
                                    whoWS = sheet2.cell(`I${i}`).value(); // Không sử dụng cho cân nặng
        
                                    let SD2neg = sheet2.cell(`G${i}`).value();
                                    let SD1neg = sheet2.cell(`H${i}`).value();
                                    let SD0 = sheet2.cell(`I${i}`).value();
                                    let SD1 = sheet2.cell(`J${i}`).value();
                                    let SD2 = sheet2.cell(`K${i}`).value();

                                    let minQuantity = SD1neg, maxQuantity = SD1
        
                                    noticeW =  evaluateWWHO({WIndex: W, SD2neg, SD1neg, SD0, SD1, SD2, W, minQuantity, maxQuantity})

                                    // console.log('======Cân nặng=======')
                                    // console.log({SD0})
                                    // console.log({noticeW})
            
                                    wdfs = Number(Number(W - whoWS).toFixed(2)) // Không sử dụng cho cân nặng
        
                                    // ✅ Ngắt vòng lặp sau khi tìm thấy
                                    break;
                                }
                            }
                        }else{ // Trên 10 tuổi theo BMI: cân nặng (kg)/Bình phương chiều cao (m)
                            for (let i = 123; i <= lastRow2; i++) {
                                const agemosCheck = sheet2.cell(`A${i}`).value();
        
                                if (agemosCheck >= ageInMonths) {
                                    // console.log({agemosCheck})
                                    whoWS = sheet2.cell(`I${i}`).value(); // Công thức sai, không sử dụng
                                    
                                    let BIM = W/(Xm * Xm)
                                    // console.log({Xm})
                                    // console.log({BIM})
        
                                    let SD2neg = sheet2.cell(`G${i}`).value();
                                    let SD1neg = sheet2.cell(`H${i}`).value();
                                    let SD0 = sheet2.cell(`I${i}`).value();
                                    let SD1 = sheet2.cell(`J${i}`).value();
                                    let SD2 = sheet2.cell(`K${i}`).value();

                                    let minQuantity = SD1neg*Xm*Xm, maxQuantity = SD1*Xm*Xm
        
                                    noticeW =  evaluateWBmi({ WIndex: BIM, SD2neg, SD1neg, SD1, SD2, W, minQuantity, maxQuantity })

                                    // console.log('======Cân nặng=======')
                                    // console.log({SD0})
                                    // console.log({noticeW})
        
                                    wdfs = Number(Number(W - whoWS).toFixed(2)) // Công thức sai, không sử dụng
        
                                    // ✅ Ngắt vòng lặp sau khi tìm thấy
                                    break;
                                }
                            }
                        }
                    }

                    return resolve({ error: false, 
                        data: infoAterGet,
                        ageInMonths,
                        Z,
                        P,
                        hdfs,
                        whoHS,
                        noticeH,
                        wdfs,
                        whoWS,
                        noticeW,
                        predictedAdultHeight: Number(Number(ageHeightNow[ageHeightNow.length - 1].height)), //
                        growTrack: {
                            ageHeightNow, 
                            ageHeightP3,
                            ageHeightP5,
                            ageHeightP10,
                            ageHeightP25,
                            ageHeightP50,
                            ageHeightP75,
                            ageHeightP90,
                            ageHeightP95,
                            ageHeightP97,
                        },
                        status: 200 
                    })
                })      
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Đồng bộ data
     * Author: HiepNH
     * Code: 16/3/2026
     */
    syncData({
        option, companyID, userID, trackID, ctx
    }){
        const that = this
        return new Promise(async (resolve) => {
            try {
                //___________Quyền truy cập ứng dụng
                let infoAppUser = await AUTH__APP_USER.checkPermissionsAccessApp({
                    appID: "61e049f6fdebf77b072d1b16", // CRM
                    userID
                })

                if((infoAppUser && !infoAppUser.error && infoAppUser.data.level == 0)){
                    let info = await CRM__GROW_TRACK_COLL.findById(trackID)
                    // console.log(info)

                    if(info && info?.phone && info?.phone != ""){
                        let infoUser = await AUTH__USER_COLL.findOne({ phone: info.phone, company: companyID })
                        // console.log(infoUser)

                        // Chỉ xử lý khi chưa tồn tại User, nếu đã tồn tại rồi thực hiện trình tự thủ công
                        if(!infoUser){
                            // Tạo user và danh bạ cha mẹ
                            let newInfoUser = await AUTH__USER.insert({ 
                                email: info?.email || `${info.phone}.temp.trx@gmail.com`, 
                                fullname: info?.parentName, 
                                companyID, 
                                phone: info.phone, 
                                userID,
                                supportID: info?.support,
                                type: 5,
                            })
                            // console.log(newInfoUser)
                            
                            if(newInfoUser && !newInfoUser.error){
                                // Tạo danh bạ cho con
                                let infoChild = await ITEM__CONTACT_MODEL.insert({ 
                                    companyID, 
                                    authorID: userID, 
                                    parent: newInfoUser?.data?.contacts[0], 
                                    name: info?.name, 
                                    birthday: info?.birthday, 
                                    gender: info?.gender, 
                                    pubertyOnsetDate: info?.pubertyOnsetDate, 
                                    support: '682f3f4bc478290036623665', // Công ty Lamin (fix cứng)
                                    note: 'Tạo từ Hồ sơ đo cao',
                                    support: info?.support,
                                    type: 6
                                })

                                // Link đo cao vào Profile
                                if(infoChild){
                                    let check = await that.update({ 
                                        trackID, 
                                        userID,
                                        contactID: infoChild?.data?._id
                                    })

                                    // console.log('11111111111111111')
                                    // console.log(check)
                                }

                                // Tạo game Habit cho các con của ba mẹ
                                await CRM_HABIT_MODEL.addMany({
                                    companyID, 
                                    contactID: newInfoUser?.data?.contacts[0], 
                                    ctx
                                })

                                // Cấp quyền truy cập ứng dụng Habit
                                await AUTH__APP_USER.insert({ 
                                    appID: '61e04a0dfdebf77b072d1b18', // Habit
                                    companyID,
                                    users: [ newInfoUser?.data?._id ],
                                    userID 
                                })

                                return resolve({ error: false, message: "Update successfull" })
                            }
                        }else{
                            // Kiểm tra xem tên bé đã tồn tại chưa
                            let checkContact = await ITEM__CONTACT_COLL.findOne({
                                company: companyID,
                                parent: infoUser?.contacts[0],
                                name: info?.name, 
                                gender: info?.gender, 
                            })
                            // console.log({checkContact})

                            if(!checkContact){
                                // Tạo danh bạ cho con
                                let infoChild = await ITEM__CONTACT_MODEL.insert({ 
                                    companyID, 
                                    authorID: userID, 
                                    parent: infoUser?.contacts[0], 
                                    name: info?.name, 
                                    birthday: info?.birthday, 
                                    gender: info?.gender, 
                                    pubertyOnsetDate: info?.pubertyOnsetDate, 
                                    support: '682f3f4bc478290036623665', // Công ty Lamin (fix cứng)
                                    note: 'Tạo từ Hồ sơ đo cao',
                                    support: info?.support,
                                    type: 6
                                })

                                // Link đo cao vào Profile
                                if(infoChild){
                                    let check = await that.update({ 
                                        trackID, 
                                        userID,
                                        contactID: infoChild?.data?._id
                                    })
                                    
                                    // console.log('22222222222222')
                                    // console.log(check)
                                }
                            }else{
                                let check = await that.update({ 
                                    trackID, 
                                    userID,
                                    contactID: checkContact?._id
                                })

                                // console.log('333333333333333')
                                // console.log(check)
                            }

                            // Tạo game Habit cho các con của ba mẹ
                            await CRM_HABIT_MODEL.addMany({
                                companyID, 
                                contactID: infoUser?.contacts[0], 
                                ctx
                            })

                            // Cấp quyền truy cập ứng dụng Habit
                            await AUTH__APP_USER.insert({ 
                                appID: '61e04a0dfdebf77b072d1b18', // Habit
                                companyID,
                                users: [ infoUser?._id ],
                                userID 
                            })

                            return resolve({ error: false, message: "Update successfull" })
                        }
                    }else{
                        return resolve({ error: true, message: "Dữ liệu đo cao không hợp lệ" })
                    }
                }else{
                    return resolve({ error: true, message: "Bạn không có quyền Đồng bộ" })
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 })
            }
        })
    }

    /**
     * Name  : Danh sách expert timesheet
     * Author: Depv
     * Code  :
     */
    getList({ companyID, userID, eventID, contactID, supportID, phone, keyword, limit = 10, lastestID, select, populates= {} }) {
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = {};
                let nextCursor	= null;
                let sortBy      = null;
                let keys	 = ['createAt__-1', '_id__-1'];

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

				if(checkObjectIDs(contactID)){                    
                    conditionObj.contact = contactID
				}else{
                    conditionObj.company = companyID

                    let getInfoUserApp = await AUTH__APP_USER.checkPermissionsAccessApp({
                        appID: "61e049f6fdebf77b072d1b16",
                        userID
                    })

                    // Dành cho người không phải là Admin dự án
                    if(getInfoUserApp.error || Number(getInfoUserApp.data.level) == 1){
                        let infoUser = await AUTH__USER_COLL.findById(userID).select('contacts')
                        if(infoUser){
                            conditionObj.$or = [
                                {userCreate: userID},
                                {support: infoUser.contacts[0]},
                            ]
                        }else{
                            conditionObj.userCreate = userID
                        }
                    }else{

                        // Lọc theo chủ Trạm
                        if(checkObjectIDs(supportID)){                    
                            conditionObj.support = supportID
                        }

                        if(checkObjectIDs(eventID)){                    
                            conditionObj.event = eventID
                        }
                    }
                }

                if(keyword){
                    keyword = stringUtils.removeAccents(keyword)
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    const regSearch = new RegExp(keyword, 'i');
                    conditionObj.namecv = regSearch
                }
                // console.log(conditionObj)

                let conditionObjOrg = { ...conditionObj }

				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await CRM__GROW_TRACK_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });

					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
					sortBy        = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await CRM__GROW_TRACK_COLL.find(conditionObj)
                    .select(select)
                    .limit(+limit+1)
                    .sort(sortBy)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await CRM__GROW_TRACK_COLL.count(conditionObjOrg);
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
     * Name: Gom nhóm theo thuộc tính
     * Author: Hiepnh
     * Date: 21/9/2022
     */
    getListByProperty({ userID, option, year, month, companyID, projectID, assigneeID }){
        return new Promise(async resolve => {
            try {
                
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: importFromExcel
     * Code: HiepNH
     * Date: 8/12/2022
     */
    importFromExcel({ companyID, dataImport, userID }) {
        // console.log({ companyID, dataImport, userID })
        const that = this
        return new Promise(async resolve => {
            try {
                const dataImportJSON = JSON.parse(dataImport);
                let index = 0;
                let errorNumber = 0;

                // console.log(dataImportJSON)

                for (const data of dataImportJSON) {
                    
                    // Chỉ lấy dữ liệu từ mẩu tin thứ 2 trở đi
                    if (index > 0 && index < 100) {
                        // console.log(data);

                        let prepareData = {
                            userID, 
                            companyID, 
                            name: data?.__EMPTY,
                            height: data?.__EMPTY_3, 
                            weight: data?.__EMPTY_4,
                            gender: data?.__EMPTY_5,
                            birthday: data?.__EMPTY_6, 
                        }
                        // console.log(prepareData);

                        let infoAfterInsert = await that.insert(prepareData);
                        // console.log(infoAfterInsert)

                        if (infoAfterInsert.error) {
                            errorNumber++;
                        }
                    }

                    index++;
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
    
    /**
     * Dev: HiepNH
     * Name: Download Template Excel
     * Date: 25/11/2024
     */
    exportExcel({ option, companyID, userID, supportID, eventID, keyword }) {
       return new Promise(async resolve => {
           try {
            // Tải mẫu Template
            if(!option){
                let infoAppUser = await AUTH__APP_USER.checkPermissionsAccessApp({
                    appID: "61e049f6fdebf77b072d1b16", 
                    userID
                })

                let conditionObj = {
                    company: companyID,
                    status: 1, // Chỉ lấy mẩu tin Hoàn thành
                }

                if(keyword){
                    keyword = stringUtils.removeAccents(keyword)
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    const regSearch = new RegExp(keyword, 'i');
                    conditionObj.namecv = regSearch
                }

                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/cdc_grow_track.xlsx')))
                    .then(async workbook => {
                        let listData = [], listUser = [], infoEvent;

                        // Nếu là Admin ứng dụng
                        if((infoAppUser && !infoAppUser.error && infoAppUser.data.level == 0)){

                            if(checkObjectIDs(supportID)){                    
                                conditionObj.support = supportID
                            }

                            if(checkObjectIDs(eventID)){                    
                                conditionObj.event = eventID
                                infoEvent = await CRM__VNG_EVENT_COLL.findById(eventID)
                            }

                            listData = await CRM__GROW_TRACK_COLL.find(conditionObj)
                            .populate({
                                path: 'userCreate source secialist product',
                                select:'fullname name unit'
                            })
                            .sort({_id: -1})
                            .limit(5000)

                            // listUser = await AUTH__USER_COLL.find({_id: {$in: listData.map(item=>item.userCreate._id)}}).select('fullname')
                        }

                        // Nếu không phải admin: người support, người tạo
                        else{
                            let infoUser = await AUTH__USER_COLL.findById(userID).select('contacts')
                            if(infoUser){
                                conditionObj.$or = [
                                    {userCreate: userID},
                                    {support: infoUser.contacts[0]},
                                ]
                            }else{
                                conditionObj.userCreate = userID
                            }

                            listData = await CRM__GROW_TRACK_COLL.find(conditionObj)
                            .populate({
                                path: 'userCreate source secialist product',
                                select:'fullname name unit'
                            })
                            .sort({_id: -1})

                            // listUser = await AUTH__USER_COLL.find({_id: {$in: listData.map(item=>item.userCreate._id)}}).select('fullname')
                        }

                        let listSpecialist = await ITEM__CONTACT_COLL.find({_id: {$in: listData.map(item => item?.secialist?._id)}}).select('name')
                        let listSource = await ITEM__DOCTYPE_COLL.find({_id: {$in: listData.map(item => item?.source?._id)}}).select('name')

                        var i = 4
                        listData?.forEach((item, index) => {
                            const birthDate = new Date(item?.birthday);
                            const today = new Date();

                            if(checkObjectIDs(eventID)){                    
                               workbook.sheet("ChiTietHoSo").row(2).cell(1).value(
                                `${infoEvent.name} - Ngày: ${moment(infoEvent.date).format('DD/MM/YYYY')}`
                               );
                            }

                            workbook.sheet("ChiTietHoSo").row(i).cell(1).value(Number(index+1));
                            workbook.sheet("ChiTietHoSo").row(i).cell(2).value(item?.date);
                            workbook.sheet("ChiTietHoSo").row(i).cell(3).value(item?.parentName);
                            workbook.sheet("ChiTietHoSo").row(i).cell(4).value(item?.phone);
                            workbook.sheet("ChiTietHoSo").row(i).cell(5).value(item?.name);
                            workbook.sheet("ChiTietHoSo").row(i).cell(6).value(item?.birthday);
                            workbook.sheet("ChiTietHoSo").row(i).cell(7).value(Number(today.getFullYear() - birthDate.getFullYear()));
                            workbook.sheet("ChiTietHoSo").row(i).cell(8).value(item?.gender == 1 ? "Nam" : "Nữ");
                            workbook.sheet("ChiTietHoSo").row(i).cell(9).value(item?.email);
                            workbook.sheet("ChiTietHoSo").row(i).cell(10).value(item?.source?.name);
                            workbook.sheet("ChiTietHoSo").row(i).cell(11).value(item?.height);
                            workbook.sheet("ChiTietHoSo").row(i).cell(12).value(item?.weight);
                            workbook.sheet("ChiTietHoSo").row(i).cell(13).value(item?.pubertyOnsetDate);
                            workbook.sheet("ChiTietHoSo").row(i).cell(14).value(item?.percentile);
                            workbook.sheet("ChiTietHoSo").row(i).cell(15).value(item?.predictedAdultHeight);
                            workbook.sheet("ChiTietHoSo").row(i).cell(16).value(item?.secialist?.name);
                            workbook.sheet("ChiTietHoSo").row(i).cell(17).value(item?.product?.name);
                            workbook.sheet("ChiTietHoSo").row(i).cell(18).value(item?.product?.unit);
                            
                            workbook.sheet("ChiTietHoSo").row(i).cell(19).value((item?.quantity && Number(item?.quantity) > 0) ? Number(item?.quantity) : '');
                            workbook.sheet("ChiTietHoSo").row(i).cell(20).value((item?.unitPrice && Number(item?.unitPrice) > 0) ? Number(item?.unitPrice) : '');
                            workbook.sheet("ChiTietHoSo").row(i).cell(21).value((item?.amount && Number(item?.amount) > 0) ? Number(item?.amount) : '');

                            workbook.sheet("ChiTietHoSo").row(i).cell(22).value(item?.note);
                            
                            // workbook.sheet("ChiTietHoSo").row(i).cell(24).value(item?.userCreate.fullname);

                            i++
                        })

                        // var i = 2
                        // listUser?.forEach((item, index) => {
                        //     workbook.sheet("BaoCao2").row(i).cell(2).value(item?.fullname);

                        //     i++
                        // })

                        var i = 4
                        listSource?.forEach((item, index) => {
                            if(i <= 13){
                                workbook.sheet("BaoCao").row(i).cell(2).value(item.name)
                            }
                            i++
                        })
                        
                        var i = 17
                        listSpecialist?.forEach((item, index) => {
                            if(i <= 26){
                                workbook.sheet("BaoCao").row(i).cell(2).value(item.name)
                            }
                            i++
                        })
            
                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `cdc_grow_track_${now.getTime()}.xlsx`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName)

                        await workbook.toFileAsync(pathWriteFile)
                        const result = await uploadFileS3(pathWriteFile, fileName)

                        fs.unlinkSync(pathWriteFile);
                        return resolve({ error: false, data: result?.Location, status: 200 })
                })
            }

           } catch (error) {
               return resolve({ error: true, message: error.message, status: 500 });
           }
       })
    }
}

exports.MODEL = new Model