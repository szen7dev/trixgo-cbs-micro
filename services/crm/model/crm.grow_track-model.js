"use strict";

const BaseModel                         = require('../../../tools/db/base_model.js');
const ObjectID                          = require('mongoose').Types.ObjectId;
const XlsxPopulate                      = require('xlsx-populate')
const fs                                = require('fs')
const path                              = require('path')
const { uploadFileS3 }                  = require('../../../tools/s3/index.js')

/**
 * DOMAIN AND ACTIONS
 */

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index')
const { checkObjectIDs, IsJsonString}   = require('../../../tools/utils/utils.js')
const stringUtils					    = require('../../../tools/utils/string_utils.js')

/**
 * COLLECTIONS
 */
const AUTH__USER_COLL                   = require('../../auth/database/auth.user-coll.js')
const ITEM__CONTACT_COLL                = require('../../item/database/item.contact-coll.js')
const CRM__GROW_TRACK_COLL              = require('../database/crm.grow_track-coll')

const AUTH__APP_USER                    = require('../.../../../auth/model/auth.app_users').MODEL
class Model extends BaseModel {

    constructor() {
        super(CRM__GROW_TRACK_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 22/11/2023
     */
    insert({ userID, companyID, phone, contactID, status, birthday, gender, height, weight, name, note, facebook, tiktok, parentName, email, fatherHeight, motherHeight, date, desiredHeight, routine }) {
        return new Promise(async resolve => {
            try {
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

                let convertStr = ''

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
                }

                if(date && date != ""){
                    dataInsert.date = date;
                }

                if(checkObjectIDs(contactID)){
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

                        dataInsert.birthday = infoContact?.birthday;
                        dataInsert.gender = infoContact?.gender;
                        dataInsert.parentName = infoContact?.parent?.name;
                    }
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
                
                if(convertStr != ""){
                    dataInsert.namecv = convertStr
                }

                let infoAfterInsert = await this.insertData(dataInsert)
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert" })

                /**
                 * TÍNH TOÁN ĐƯỜNG PHÂN VỊ
                 */
                let ageHeightNow = []
                let date1 = infoAfterInsert.birthday, date2 = infoAfterInsert.date, X = infoAfterInsert.height, genderName;
                if(infoAfterInsert.gender == 1){
                    genderName = "Male";
                }else{
                    genderName = "Female";
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

                let ageInMonths = getMonthDifference(date1, date2)

                // Hàm tính Zscore theo: X, L, M, S
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

                let L, M, S, Z, P, endAge = 20

                // Đường dẫn tới file cdc_grow.xlsx
                const filePath = path.join(__dirname, '../../../files/templates/excels/cdc_grow.xlsx')

                // Đọc file
                XlsxPopulate.fromFileAsync(filePath)
                .then(async (workbook) => {
                    const sheet = workbook.sheet(genderName);
                    const lastRow = sheet.usedRange().endCell().rowNumber();

                    // Lặp qua từng dòng để tìm Agemos >= ageInMonths
                    for (let i = 2; i <= lastRow; i++) {
                        const agemosCheck = sheet.cell(`B${i}`).value();

                        if (agemosCheck >= ageInMonths) {

                            L = sheet.cell(`C${i}`).value();
                            M = sheet.cell(`D${i}`).value();
                            S = sheet.cell(`E${i}`).value();
                            Z = calculateZScore(X, L, M, S);
                            P = Number(getPercentileFromZ(Z).toFixed(2));

                            // ✅ Ngắt vòng lặp sau khi tìm thấy
                            break;
                        }
                    }
        
                    // Lấy các giá trị ứng với từng độ tuổi
                    for (let age = endAge; age <= endAge; age++) {
                        const L = sheet.cell(`C243`).value();
                        const M = sheet.cell(`D243`).value();
                        const S = sheet.cell(`E243`).value();
        
                        ageHeightNow.push({
                            age,
                            height: Number(calculateHeightFromZ(Z, L, M, S).toFixed(1)).toFixed(2)
                        })
                    }    
                    
                    await CRM__GROW_TRACK_COLL.findByIdAndUpdate(infoAfterInsert._id, {
                        percentile: P,
                        predictedAdultHeight: Number(ageHeightNow[0].height)
                    }, { new: true })
                })   

                return resolve({ error: false, data: infoAfterInsert });
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
    update({ trackID, userID, phone, contactID, status, birthday, date, gender, height, weight, name, note, facebook, tiktok, thumbnailID, imagesID }){
        return new Promise(async (resolve) => {
            try {
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

                if(checkObjectIDs(contactID)){
                    dataUpdate.contact = contactID;
                }

                if(birthday && birthday != ""){
                    dataUpdate.birthday = birthday;
                }

                if(date && date != ""){
                    dataUpdate.date = date;
                }

                let convertStr = ''
                if(name && name != ""){
                    dataUpdate.name = name;
                    convertStr = stringUtils.removeAccents(name)
                }
                if(phone && phone != ""){
                    dataUpdate.phone = phone;
                    convertStr = convertStr + " " + stringUtils.removeAccents(phone)
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

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: get info expert timesheet
     * Author: Depv
     * Code:
     */
    getInfo({ trackID, userID, select, populates }) {
        return new Promise(async (resolve) => {
            try { 
                /**
                 * CHIỀU CAO
                 * 0-5 tuổi thì WHO theo từng ngày
                 * Trên 5 tuổi thì theo WHO và theo tháng
                 */      
                
                /**
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

                let date1 = infoAterGet.birthday, date2 = infoAterGet.createAt, X = infoAterGet.height, Xm = infoAterGet.height/100, W = infoAterGet.weight
                let gender, genderHWho5, genderHWho, genderWWho5, genderWWho;

                if(infoAterGet.gender == 1){
                    console.log('=====Nam=====')
                    gender = "Male";
                    genderHWho5 = "LFA_boys_z_exp";
                    genderHWho = "MaleHWho";
                    genderWWho5 = "WFA_boys_z_exp";
                    genderWWho = "MaleWWho";
                }else{
                    console.log('=====Nữ=====')
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

                function getDayDifference(date1, date2) {
                    const d1 = new Date(date1);
                    const d2 = new Date(date2);

                    // Tính số mili-giây giữa 2 mốc thời gian
                    const diffTime = Math.abs(d2 - d1);

                    // Chia cho số mili-giây trong 1 ngày
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                    return diffDays;
                }

                let ageInMonths = getMonthDifference(date1, date2)
                let ageInDays = getDayDifference(date1, date2)

                console.log({ageInMonths})
                console.log({ageInDays})

                // Hàm tính Zscore theo: X, L, M, S
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
                        conclusion = `Đạt chuẩn. Chuẩn WHO: ${Number(SD0).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2})}kg`;
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

                    const lastRow = sheet.usedRange().endCell().rowNumber(); // Tìm số dòng cuối cùng có dữ liệu
                    const lastRow1 = sheet1.usedRange().endCell().rowNumber(); // Tìm số dòng cuối cùng có dữ liệu
                    const lastRow2 = sheet2.usedRange().endCell().rowNumber(); // Tìm số dòng cuối cùng có dữ liệu
                    const lastRow3 = sheet3.usedRange().endCell().rowNumber(); // Tìm số dòng cuối cùng có dữ liệu
                    const lastRow4 = sheet4.usedRange().endCell().rowNumber(); // Tìm số dòng cuối cùng có dữ liệu

                    // Lặp qua từng dòng để tìm Agemos >= ageInMonths
                    for (let i = 2; i <= lastRow; i++) {
                        const agemosCheck = sheet.cell(`B${i}`).value();

                        if (agemosCheck >= ageInMonths) {

                            L = sheet.cell(`C${i}`).value();
                            M = sheet.cell(`D${i}`).value();
                            S = sheet.cell(`E${i}`).value();
                            Z = calculateZScore(X, L, M, S);
                            P = Number(getPercentileFromZ(Z).toFixed(2));

                            startAge = Math.ceil(agemosCheck / 12);

                            // Lấy các giá trị của điểm bắt đầu
                            ageHeightNow.push({
                                age: Number(Number(agemosCheck / 12).toFixed(2)),
                                // agemos: agemosCheck,
                                // L,
                                // M,
                                // S,
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
        
                    // Lấy các giá trị ứng với từng độ tuổi
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
                                    // agemos,
                                    // L,
                                    // M,
                                    // S,
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

                    // Kiểm tra cao so với chuẩn WHO
                    let noticeH = ''
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

                                console.log('======Chiều cao=======')
                                console.log({SD0})
                                console.log({noticeH})

                                hdfs = Number(Number(X - whoHS).toFixed(2))

                                // ✅ Ngắt vòng lặp sau khi tìm thấy
                                break;
                            }
                        }

                        // console.log({noticeH})
                        // console.log({SD0})
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

                                console.log('======Chiều cao=======')
                                console.log({SD0})
                                console.log({noticeH})

                                hdfs = Number(Number(X - whoHS).toFixed(2))

                                // ✅ Ngắt vòng lặp sau khi tìm thấy
                                break;
                            }
                        }
                    }

                    // Kiểm tra cân nặng so với chuẩn WHO, BMI
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

                                console.log('======Cân nặng=======')
                                console.log({SD0})
                                console.log({noticeW})
    
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
                                    console.log({agemosCheck})
                                    whoWS = sheet2.cell(`I${i}`).value(); // Không sử dụng cho cân nặng
        
                                    let SD2neg = sheet2.cell(`G${i}`).value();
                                    let SD1neg = sheet2.cell(`H${i}`).value();
                                    let SD0 = sheet2.cell(`I${i}`).value();
                                    let SD1 = sheet2.cell(`J${i}`).value();
                                    let SD2 = sheet2.cell(`K${i}`).value();

                                    let minQuantity = SD1neg, maxQuantity = SD1
        
                                    noticeW =  evaluateWWHO({WIndex: W, SD2neg, SD1neg, SD0, SD1, SD2, W, minQuantity, maxQuantity})

                                    console.log('======Cân nặng=======')
                                    console.log({SD0})
                                    console.log({noticeW})
            
                                    wdfs = Number(Number(W - whoWS).toFixed(2)) // Không sử dụng cho cân nặng
        
                                    // ✅ Ngắt vòng lặp sau khi tìm thấy
                                    break;
                                }
                            }
                        }else{ // Trên 10 tuổi theo BMI: cân nặng (kg)/Bình phương chiều cao (m)
                            for (let i = 123; i <= lastRow2; i++) {
                                const agemosCheck = sheet2.cell(`A${i}`).value();
        
                                if (agemosCheck >= ageInMonths) {
                                    console.log({agemosCheck})
                                    whoWS = sheet2.cell(`I${i}`).value(); // Công thức sai, không sử dụng
                                    
                                    let BIM = W/(Xm * Xm)
                                    console.log({Xm})
                                    console.log({BIM})
        
                                    let SD2neg = sheet2.cell(`G${i}`).value();
                                    let SD1neg = sheet2.cell(`H${i}`).value();
                                    let SD0 = sheet2.cell(`I${i}`).value();
                                    let SD1 = sheet2.cell(`J${i}`).value();
                                    let SD2 = sheet2.cell(`K${i}`).value();

                                    let minQuantity = SD1neg*Xm*Xm, maxQuantity = SD1*Xm*Xm
        
                                    noticeW =  evaluateWBmi({ WIndex: BIM, SD2neg, SD1neg, SD1, SD2, W, minQuantity, maxQuantity })

                                    console.log('======Cân nặng=======')
                                    console.log({SD0})
                                    console.log({noticeW})
        
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
                        predictedAdultHeight: Number(Number(ageHeightNow[ageHeightNow.length - 1].height)),
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
     * Name  : Danh sách expert timesheet
     * Author: Depv
     * Code  :
     */
    getList({ companyID, userID, contactID, phone, keyword, limit = 10, lastestID, select, populates= {} }) {
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
                }

                if(phone && phone != ""){
                    conditionObj.phone = phone
                }else{
                    let getInfoUserApp = await AUTH__APP_USER.checkPermissionsAccessApp({
                        appID: "61e049f6fdebf77b072d1b16",
                        userID
                    })

                    if(getInfoUserApp.error || Number(getInfoUserApp.data.level) == 1){
                       conditionObj.userCreate = userID
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
    exportExcel({ option, companyID, userID }) {
       return new Promise(async resolve => {
           try {
            // Tải mẫu Template
            if(!option){

                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/cdc_grow_track.xlsm')))
                    .then(async workbook => {
            
                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `cdc_grow_track_${now.getTime()}.xlsm`;
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