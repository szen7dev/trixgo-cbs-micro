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
// const { CF_DOMAIN_SERVICES } 		            = require('../../gateway/helper/domain.constant');
// const { CF_ACTIONS_ANALYSIS }                   = require('../../analysis/helper/analysis.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const {
  checkObjectIDs,
  IsJsonString,
  validateParamsObjectID
}  = require('../../../tools/utils/utils.js');
const stringUtils					    = require('../../../tools/utils/string_utils.js')
const { CRM_PERMISSION }                = require('../helper/crm.keys-constant.js')


/**
 * COLLECTIONS
 */
// const AUTH__COMPANY_COLL                = require('../../auth/database/auth.company-coll')
const AUTH__USER_COLL                   = require('../../auth/database/auth.user-coll.js')
const ITEM__CONTACT_COLL                = require('../../item/database/item.contact-coll.js')
const CRM__GROW_TRACK_COLL              = require('../database/crm.grow_track-coll')

// let dataTF = {
//     appID: "61e049cffdebf77b072d1b14", // TIMESHEET
//     menuID: "623f1ecae998e94feda0cd70", //
//     type: 1,
//     action: 1,
// }

class Model extends BaseModel {

    constructor() {
        super(CRM__GROW_TRACK_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 22/11/2023
     */
    insert({ userID, companyID, phone, contactID, status, birthday, date, gender, height, weight, name, note, facebook, tiktok }) {
        return new Promise(async resolve => {
            try {
                if(phone){
                    // Hàm kiểm tra Phone
                    const strValid = phone.toLowerCase().trim();
                    // console.log(strValid)

                    function isValidVietnamPhoneNumber(str) {
                        const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
                        return phoneRegex.test(str);
                    }
                    // console.log(isValidVietnamPhoneNumber(strValid))
                    if(!isValidVietnamPhoneNumber(strValid))
                        return resolve({ error: true, message: "Số điện thoại không hợp lệ. Hãy vui lòng thử lại" })
                }else{
                    if(!checkObjectIDs(contactID) || !name || !birthday || !height || !weight)
                        return resolve({ error: true, message: "Danh bạ không hợp lệ. Hãy vui lòng thử lại" })
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

                if(birthday && birthday != ""){
                    dataInsert.birthday = birthday;
                }

                if(date && date != ""){
                    dataInsert.date = date;
                }

                if(checkObjectIDs(contactID)){
                    dataInsert.contact = contactID;

                    let infoContact = await ITEM__CONTACT_COLL.findById(contactID)

                    if(infoContact){
                        dataInsert.phone = infoContact?.phone;
                        convertStr = convertStr + " " + stringUtils.removeAccents(infoContact?.phone)
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
                dataInsert.namecv = convertStr

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
                dataUpdate.namecv = convertStr

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
     * Name: Remove
     * Author: HiepNH
     * Code: 22/3/2024
     */
    remove({ arraysRemove, userID }) {
        const that = this
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(arraysRemove)) {
                    return resolve({ error: true, message: 'Yêu cầu không hợp lệ', status: 200 });
                }

                let infoAppUser = await AUTH__APP_USER.checkPermissionsAccessApp({
                    appID: "61e049cffdebf77b072d1b14",
                    userID
                })

                if(!infoAppUser.error && infoAppUser.data.level == 0){
                    let info = await CRM__GROW_TRACK_COLL.findById(arraysRemove[0])

                    const result = await CRM__GROW_TRACK_COLL.deleteMany({
                        _id: { $in: arraysRemove },
                        // userCreate: userID,
                        // $or: [
                        //     { userCreate: userID },
                        //     { admins: { $in: [userID] } }
                        // ]
                    })

                    if(result.deletedCount !== arraysRemove.length) {
                        return resolve({
                            error: true,
                            message: "Dữ liệu có thể chưa xóa hết vì không đủ quyền",
                            status: 200
                        });
                    }

                    // Cập nhật số nhân sự bảng lương
                    if(info && info.parent){
                        let numberOfHuman = await CRM__GROW_TRACK_COLL.count({parent: info?.parent})
                        if(numberOfHuman){
                            await CRM__GROW_TRACK_COLL.findByIdAndUpdate(info?.parent, {
                                userUpdate: userID,
                                modifyAt: Date.now(),
                                numberOfHuman
                            }, { new: true })
                        }
                    }

                    /**
                     * CẬP NHẬT VÀO BẢNG LƯƠNG CHA
                     */
                    if(info.parent && checkObjectIDs(info.parent)){
                        await that.updateValue({ expertSalaryID: info.parent, userID })
                    }

                    return resolve({ error: false, message: "Xóa dữ liệu thành công", status: 200 });
                }else{
                    return resolve({
                        error: true,
                        message: "Dữ liệu có thể chưa xóa hết vì không đủ quyền",
                        status: 200
                    });
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
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

                let date1 = infoAterGet.birthday, date2 = infoAterGet.createAt, X = infoAterGet.height, W = infoAterGet.weight, gender, genderHWho, genderWWho;
                if(infoAterGet.gender == 1){
                    gender = "Male";
                    genderHWho = "MaleHWho";
                    genderWWho = "MaleWWho";
                }else{
                    gender = "Female";
                    genderHWho = "FemaleHWho";
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

                // Hàm tính chuẩn theo WHO
                function evaluateHeightW({H, SD2neg, SD1neg, SD1, SD2}) {
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

                function evaluateWBmi({H, SD2neg, SD1neg, SD1, SD2}) {
                    let conclusion = '';
                
                    if (H < SD2neg) {
                        conclusion = 'Dưới chuẩn BMI cấp độ 2';
                    } else if (H >= SD2neg && H < SD1neg) {
                        conclusion = 'Dưới chuẩn BMI cấp độ 1';
                    } else if (H >= SD1neg && H <= SD1) {
                        conclusion = 'Đạt chuẩn BMI';
                    } else if (H > SD1 && H <= SD2) {
                        conclusion = 'Trên chuẩn BMI cấp độ 1';
                    } else if (H > SD2) {
                        conclusion = 'Trên chuẩn BMI cấp độ 2';
                    } else {
                        conclusion = 'Không xác định'; // fallback an toàn
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
                    const lastRow = sheet.usedRange().endCell().rowNumber(); // Tìm số dòng cuối cùng có dữ liệu
                    const lastRow1 = sheet1.usedRange().endCell().rowNumber(); // Tìm số dòng cuối cùng có dữ liệu
                    const lastRow2 = sheet2.usedRange().endCell().rowNumber(); // Tìm số dòng cuối cùng có dữ liệu

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
                    for (let i = 2; i <= lastRow1; i++) {
                        const agemosCheck = sheet1.cell(`A${i}`).value();

                        if (agemosCheck >= ageInMonths) {
                            whoHS = sheet1.cell(`K${i}`).value();

                            let SD2neg = sheet1.cell(`I${i}`).value();
                            let SD1neg = sheet1.cell(`J${i}`).value();
                            let SD1 = sheet1.cell(`L${i}`).value();
                            let SD2 = sheet1.cell(`M${i}`).value();

                            noticeH =  evaluateHeightW({H: X, SD2neg, SD1neg, SD1, SD2})

                            hdfs = Number(Number(X - whoHS).toFixed(2))

                            // ✅ Ngắt vòng lặp sau khi tìm thấy
                            break;
                        }
                    }

                    // Kiểm tra cân nặng so với chuẩn WHO, BMI
                    let noticeW = ''
                    // Dưới 10 tuổi theo WHO
                    if(ageInMonths <= 120){
                        for (let i = 2; i <= 122; i++) {
                            const agemosCheck = sheet2.cell(`A${i}`).value();
    
                            if (agemosCheck >= ageInMonths) {
                                whoWS = sheet2.cell(`I${i}`).value();
    
                                let SD2neg = sheet2.cell(`G${i}`).value();
                                let SD1neg = sheet2.cell(`H${i}`).value();
                                let SD1 = sheet2.cell(`J${i}`).value();
                                let SD2 = sheet2.cell(`K${i}`).value();
    
                                noticeW =  evaluateHeightW({H: W, SD2neg, SD1neg, SD1, SD2})
    
                                wdfs = Number(Number(W - whoWS).toFixed(2))
    
                                // ✅ Ngắt vòng lặp sau khi tìm thấy
                                break;
                            }
                        }
                    }

                    // Trên 10 tuổi theo BMI: cân nặng (kg)/Bình phương chiều cao (m)
                    else{
                        for (let i = 123; i <= lastRow2; i++) {
                            const agemosCheck = sheet2.cell(`A${i}`).value();
    
                            if (agemosCheck >= ageInMonths) {
                                whoWS = sheet2.cell(`I${i}`).value();

                                let BIM = W*10000/(X * X)
    
                                let SD2neg = sheet2.cell(`G${i}`).value();
                                let SD1neg = sheet2.cell(`H${i}`).value();
                                let SD1 = sheet2.cell(`J${i}`).value();
                                let SD2 = sheet2.cell(`K${i}`).value();
    
                                noticeW =  evaluateWBmi({H: BIM, SD2neg, SD1neg, SD1, SD2})
    
                                wdfs = Number(Number(W - whoWS).toFixed(2))
    
                                // ✅ Ngắt vòng lặp sau khi tìm thấy
                                break;
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
                            hdfs,
                            whoHS,
                            wdfs,
                            whoWS,
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
    getList({ companyID, contactID, phone, keyword, limit = 10, lastestID, select, populates= {} }) {
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
                // Record Traffic
                //await ctx.call(`${CF_DOMAIN_SERVICES.ANALYSIS}.${CF_ACTIONS_ANALYSIS.HISTORY_TRAFFIC_INSERT}`, dataTF)

                let yearFilter
                let currentYear = new Date().getFullYear()
                if(year && !isNaN(year)){
                    yearFilter = Number(year)
                }else{
                    yearFilter = Number(currentYear)
                }

                // Tổng hợp Lương của công ty theo tháng
                if(!option){
                    let conditionObj = {
                        company: ObjectID(companyID),
                        parent: { $exists: true, $ne: null },
                        project: { $exists: true, $ne: null },
                    }

                    let listData = await CRM__GROW_TRACK_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project: {
                                year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                salary: 1,
                                onLeaveSalary: 1,
                                overtimeSalary: 1,
                                revenueBonus: 1,
                                reward: 1,
                                mealAllowance: 1,
                                punishment: 1,
                                insurance: 1,
                                pitax: 1,
                                union: 1,
                                share: 1,
                                other: 1,
                                advance: 1,
                                paid: 1,
                                remaining: 1,
                                // subAllowance1: 1,
                                // subAllowance2: 1,
                                // subAllowance3: 1,
                                // subAllowance4: 1,
                                // subAllowance5: 1,
                                // subAllowance6: 1,
                                // subAllowance7: 1,
                                // subAllowance8: 1,
                                // subAllowance9: 1,
                                // subAllowance10: 1,
                                // subAllowance11: 1,
                                // subAllowance12: 1,
                                // subAllowance13: 1,
                                // subAllowance14: 1,
                                // subAllowance15: 1,
                                // subAllowance16: 1,
                                // subAllowance17: 1,
                                // subAllowance18: 1,
                                // subAllowance19: 1,
                                // subAllowance20: 1,
                                // subAllowance21: 1,
                                // subAllowance22: 1,
                            }
                        },
                        {
                            $match: {
                                year: Number(yearFilter)
                            }
                        },
                        {
                            $group: {
                                _id: { month: '$month' },
                                salary: { $sum: { $subtract: [ { $add: ["$salary","$onLeaveSalary","$overtimeSalary","$revenueBonus","$reward","$mealAllowance"] }, {$add: ["$punishment","$insurance","$pitax","$union","$share","$other"]} ] } },
                                paid: { $sum: {$add: [ "$paid", "$advance" ]} },
                            }
                        },
                        {
                            $sort: {
                                "_id.month": 1
                            }
                        }
                    ])

                    return resolve({ error: false, data: listData })
                }

                // Bảng lương của assigneeID theo tháng
                else if(option == 1){

                    let conditionObj = {
                        human: ObjectID(assigneeID),
                        parent: { $exists: true, $ne: null }
                    }

                    let listData = await CRM__GROW_TRACK_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project: {
                                year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                salary: 1,
                                onLeaveSalary: 1,
                                overtimeSalary: 1,
                                revenueBonus: 1,
                                reward: 1,
                                mealAllowance: 1,
                                punishment: 1,
                                insurance: 1,
                                pitax: 1,
                                union: 1,
                                share: 1,
                                other: 1,
                                advance: 1,
                                paid: 1,
                                remaining: 1,
                                subAllowance1: 1,
                                subAllowance2: 1,
                                subAllowance3: 1,
                                subAllowance4: 1,
                                subAllowance5: 1,
                                subAllowance6: 1,
                                subAllowance7: 1,
                                subAllowance8: 1,
                                subAllowance9: 1,
                                subAllowance10: 1,
                                subAllowance11: 1,
                                subAllowance12: 1,
                                subAllowance13: 1,
                                subAllowance14: 1,
                                subAllowance15: 1,
                                subAllowance16: 1,
                                subAllowance17: 1,
                                subAllowance18: 1,
                                subAllowance19: 1,
                                subAllowance20: 1,
                                subAllowance21: 1,
                                subAllowance22: 1,
                            }
                        },
                        {
                            $match: {
                                year: Number(yearFilter)
                            }
                        },
                        {
                            $group: {
                                _id: { month: '$month' },
                                salary: { $sum: { $subtract: [ { $add: ["$salary","$onLeaveSalary","$overtimeSalary","$revenueBonus","$reward","$mealAllowance"] }, {$add: ["$punishment","$insurance","$pitax","$union","$share","$other"]} ] } },
                                paid: { $sum: {$add: [ "$paid", "$advance" ]} },
                            }
                        },
                    ])
                    // console.log(listData)

                    return resolve({ error: false, data: listData })
                }

                // Bảng lương của assigneeID 1 tháng
                else if(option == 2){

                    let conditionObj = {
                        human: ObjectID(assigneeID),
                        parent: { $exists: true, $ne: null }
                    }

                    let listData = await CRM__GROW_TRACK_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project: {
                                year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                salary: 1,
                                onLeaveSalary: 1,
                                overtimeSalary: 1,
                                revenueBonus: 1,
                                reward: 1,
                                mealAllowance: 1,
                                punishment: 1,
                                insurance: 1,
                                pitax: 1,
                                union: 1,
                                share: 1,
                                other: 1,
                                advance: 1,
                                paid: 1,
                                remaining: 1,
                                subAllowance1: 1,
                                subAllowance2: 1,
                                subAllowance3: 1,
                                subAllowance4: 1,
                                subAllowance5: 1,
                                subAllowance6: 1,
                                subAllowance7: 1,
                                subAllowance8: 1,
                                subAllowance9: 1,
                                subAllowance10: 1,
                                subAllowance11: 1,
                                subAllowance12: 1,
                                subAllowance13: 1,
                                subAllowance14: 1,
                                subAllowance15: 1,
                                subAllowance16: 1,
                                subAllowance17: 1,
                                subAllowance18: 1,
                                subAllowance19: 1,
                                subAllowance20: 1,
                                subAllowance21: 1,
                                subAllowance22: 1,
                            }
                        },
                        {
                            $match: {
                                year: Number(yearFilter),
                                month: Number(month),
                            }
                        },
                        {
                            $group: {
                                _id: { },
                                salary: { $sum:"$salary" },
                                onLeaveSalary: { $sum:"$onLeaveSalary" },
                                overtimeSalary: { $sum:"$overtimeSalary" },
                                revenueBonus: { $sum:"$revenueBonus" },
                                reward: { $sum:"$reward" },
                                mealAllowance: { $sum:"$mealAllowance" },
                                punishment: { $sum:"$punishment" },
                                insurance: { $sum:"$insurance" },
                                pitax: { $sum:"$pitax" },
                                union: { $sum:"$union" },
                                share: { $sum:"$share" },
                                other: { $sum:"$other" },
                                advance: { $sum:"$advance" },
                                paid: { $sum:"$paid" },
                                remaining: { $sum:"$remaining" },
                                subAllowance1: { $sum:"$subAllowance1" },
                                subAllowance2: { $sum:"$subAllowance2" },
                                subAllowance3: { $sum:"$subAllowance3" },
                                subAllowance4: { $sum:"$subAllowance4" },
                                subAllowance5: { $sum:"$subAllowance5" },
                                subAllowance6: { $sum:"$subAllowance6" },
                                subAllowance7: { $sum:"$subAllowance7" },
                                subAllowance8: { $sum:"$subAllowance8" },
                                subAllowance9: { $sum:"$subAllowance9" },
                                subAllowance10: { $sum:"$subAllowance10" },
                                subAllowance11: { $sum:"$subAllowance11" },
                                subAllowance12: { $sum:"$subAllowance12" },
                                subAllowance13: { $sum:"$subAllowance13" },
                                subAllowance14: { $sum:"$subAllowance14" },
                                subAllowance15: { $sum:"$subAllowance15" },
                                subAllowance16: { $sum:"$subAllowance16" },
                                subAllowance17: { $sum:"$subAllowance17" },
                                subAllowance18: { $sum:"$subAllowance18" },
                                subAllowance19: { $sum:"$subAllowance19" },
                                subAllowance20: { $sum:"$subAllowance20" },
                                subAllowance21: { $sum:"$subAllowance21" },
                                subAllowance22: { $sum:"$subAllowance22" },
                            }
                        },
                    ])
                    // console.log(listData)

                    return resolve({ error: false, data: listData })
                }

                // Gom nhóm theo Dự án/Bộ phận
                else if(option == 3){
                    let sortBy = { "_id.project": 1 }

                    let conditionPopulate1 = {
                        path: '_id.project',
                        select: '_id name',
                        model: 'department',
                    }

                    let conditionObj = {
                        company: ObjectID(companyID),
                        parent: { $exists: true, $ne: null },
                    }

                    let listData1 = await CRM__GROW_TRACK_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project: {
                                year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                project: 1,
                                position: 1,
                                human: 1,
                                salary: 1,
                                onLeaveSalary: 1,
                                overtimeSalary: 1,
                                revenueBonus: 1,
                                reward: 1,
                                mealAllowance: 1,
                                punishment: 1,
                                insurance: 1,
                                pitax: 1,
                                union: 1,
                                share: 1,
                                other: 1,
                                advance: 1,
                                paid: 1,
                                remaining: 1,
                                subAllowance1: 1,
                                subAllowance2: 1,
                                subAllowance3: 1,
                                subAllowance4: 1,
                                subAllowance5: 1,
                                subAllowance6: 1,
                                subAllowance7: 1,
                                subAllowance8: 1,
                                subAllowance9: 1,
                                subAllowance10: 1,
                                subAllowance11: 1,
                                subAllowance12: 1,
                                subAllowance13: 1,
                                subAllowance14: 1,
                                subAllowance15: 1,
                                subAllowance16: 1,
                                subAllowance17: 1,
                                subAllowance18: 1,
                                subAllowance19: 1,
                                subAllowance20: 1,
                                subAllowance21: 1,
                                subAllowance22: 1,
                            }
                        },
                        {
                            $match: {
                                year: Number(yearFilter),
                                month: Number(month),
                            }
                        },
                        {
                            $group: {
                                _id: { project: '$project' },
                                salary: { $sum: { $subtract: [ { $add: ["$salary","$onLeaveSalary","$overtimeSalary","$revenueBonus","$reward","$mealAllowance"] }, {$add: ["$punishment","$insurance","$pitax","$union","$share","$other"]} ] } },
                                paid: { $sum: {$add: [ "$paid", "$advance" ]} },
                            }
                        },
                        {
                            $sort: sortBy
                        },
                    ])

                    if(listData1.length){
                        await CRM__GROW_TRACK_COLL.populate(listData1, conditionPopulate1)
                    }

                    return resolve({ error: false, data: listData1 })
                }

                // Gom nhóm theo Nhân sự trong bộ phận
                else if(option == 4){
                    let sortBy = { "_id.human": 1 }

                    let conditionPopulate1 = {
                        path: '_id.human',
                        select: '_id fullname image',
                        model: 'user',
                    }

                    let conditionObj = {
                        project: ObjectID(projectID),
                        parent: { $exists: true, $ne: null },
                    }

                    let listData1 = await CRM__GROW_TRACK_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project: {
                                year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                project: 1,
                                human: 1,
                                salary: 1,
                                onLeaveSalary: 1,
                                overtimeSalary: 1,
                                revenueBonus: 1,
                                reward: 1,
                                mealAllowance: 1,
                                punishment: 1,
                                insurance: 1,
                                pitax: 1,
                                union: 1,
                                share: 1,
                                other: 1,
                                advance: 1,
                                paid: 1,
                                remaining: 1,
                                subAllowance1: 1,
                                subAllowance2: 1,
                                subAllowance3: 1,
                                subAllowance4: 1,
                                subAllowance5: 1,
                                subAllowance6: 1,
                                subAllowance7: 1,
                                subAllowance8: 1,
                                subAllowance9: 1,
                                subAllowance10: 1,
                                subAllowance11: 1,
                                subAllowance12: 1,
                                subAllowance13: 1,
                                subAllowance14: 1,
                                subAllowance15: 1,
                                subAllowance16: 1,
                                subAllowance17: 1,
                                subAllowance18: 1,
                                subAllowance19: 1,
                                subAllowance20: 1,
                                subAllowance21: 1,
                                subAllowance22: 1,
                            }
                        },
                        {
                            $match: {
                                year: Number(yearFilter),
                                month: Number(month),
                            }
                        },
                        {
                            $group: {
                                _id: { human: '$human' },
                                salary: { $sum: { $subtract: [ { $add: ["$salary","$onLeaveSalary","$overtimeSalary","$revenueBonus","$reward","$mealAllowance"] }, {$add: ["$punishment","$insurance","$pitax","$union","$share","$other"]} ] } },
                                paid: { $sum: {$add: [ "$paid", "$advance" ]} },
                            }
                        },
                        {
                            $sort: sortBy
                        },
                    ])

                    if(listData1.length){
                        await CRM__GROW_TRACK_COLL.populate(listData1, conditionPopulate1)
                    }

                    return resolve({ error: false, data: listData1 })
                }

                // Gom nhóm theo Nhân sự trong 1 tháng/
                else if(option == 5){
                    let sortBy = { "_id.human": 1 }

                    let conditionPopulate1 = {
                        path: '_id.human',
                        select: '_id fullname',
                        model: 'user',
                    }

                    let conditionObj = {
                        company: ObjectID(companyID),
                        parent: { $exists: true, $ne: null },
                    }

                    let listData1 = await CRM__GROW_TRACK_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project: {
                                year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                human: 1,
                                salary: 1,
                                onLeaveSalary: 1,
                                overtimeSalary: 1,
                                revenueBonus: 1,
                                reward: 1,
                                mealAllowance: 1,
                                punishment: 1,
                                insurance: 1,
                                pitax: 1,
                                union: 1,
                                share: 1,
                                other: 1,
                                advance: 1,
                                paid: 1,
                                remaining: 1,
                                subAllowance1: 1,
                                subAllowance2: 1,
                                subAllowance3: 1,
                                subAllowance4: 1,
                                subAllowance5: 1,
                                subAllowance6: 1,
                                subAllowance7: 1,
                                subAllowance8: 1,
                                subAllowance9: 1,
                                subAllowance10: 1,
                                subAllowance11: 1,
                                subAllowance12: 1,
                                subAllowance13: 1,
                                subAllowance14: 1,
                                subAllowance15: 1,
                                subAllowance16: 1,
                                subAllowance17: 1,
                                subAllowance18: 1,
                                subAllowance19: 1,
                                subAllowance20: 1,
                                subAllowance21: 1,
                                subAllowance22: 1,
                            }
                        },
                        {
                            $match: {
                                year: Number(yearFilter),
                                month: Number(month),
                            }
                        },
                        {
                            $group: {
                                _id: { human: '$human' },
                                salary: { $sum: { $subtract: [ { $add: ["$salary","$onLeaveSalary","$overtimeSalary","$revenueBonus","$reward","$mealAllowance"] }, {$add: ["$punishment","$insurance","$pitax","$union","$share","$other"]} ] } },
                                paid: { $sum: {$add: [ "$paid", "$advance" ]} },
                            }
                        },
                        {
                            $sort: sortBy
                        },
                    ])

                    if(listData1.length){
                        await CRM__GROW_TRACK_COLL.populate(listData1, conditionPopulate1)
                    }

                    return resolve({ error: false, data: listData1 })
                }

                // Tổng hợp toàn bộ của 1 nhân sự
                else if(option == 6){

                    let conditionObj = {
                        human: ObjectID(assigneeID),
                        parent: { $exists: true, $ne: null }
                    }

                    let listData = await CRM__GROW_TRACK_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project: {
                                year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                salary: 1,
                                onLeaveSalary: 1,
                                overtimeSalary: 1,
                                revenueBonus: 1,
                                reward: 1,
                                mealAllowance: 1,
                                punishment: 1,
                                insurance: 1,
                                pitax: 1,
                                union: 1,
                                share: 1,
                                other: 1,
                                advance: 1,
                                paid: 1,
                                remaining: 1,
                                subAllowance1: 1,
                                subAllowance2: 1,
                                subAllowance3: 1,
                                subAllowance4: 1,
                                subAllowance5: 1,
                                subAllowance6: 1,
                                subAllowance7: 1,
                                subAllowance8: 1,
                                subAllowance9: 1,
                                subAllowance10: 1,
                                subAllowance11: 1,
                                subAllowance12: 1,
                                subAllowance13: 1,
                                subAllowance14: 1,
                                subAllowance15: 1,
                                subAllowance16: 1,
                                subAllowance17: 1,
                                subAllowance18: 1,
                                subAllowance19: 1,
                                subAllowance20: 1,
                                subAllowance21: 1,
                                subAllowance22: 1,
                            }
                        },
                        {
                            $group: {
                                _id: { },
                                salary: { $sum: { $subtract: [ { $add: ["$salary","$onLeaveSalary","$overtimeSalary","$revenueBonus","$reward","$mealAllowance"] }, {$add: ["$punishment","$insurance","$pitax","$union","$share","$other"]} ] } },
                                paid: { $sum: {$add: [ "$paid", "$advance" ]} },
                            }
                        },
                    ])
                    // console.log(listData)

                    return resolve({ error: false, data: listData })
                }
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Dev: HiepNH
     * Name: Download Template Excel
     * Date: 25/11/2024
     */
    exportExcel({ option, companyID, year, month, email, userID }) {
       return new Promise(async resolve => {
           try {
            // let getInfoUserApp = await AUTH__APP_USER.checkPermissionsAccessApp({
            //     appID: "61e049cffdebf77b072d1b14",
            //     userID
            // })

            // if(!getInfoUserApp.error && Number(getInfoUserApp.data.level) == 0){
                
            // }else{
            //     return resolve({ error: true, message: "Can't get data", status: 403 });
            // }

            // TỔNG HỢP LƯƠNG TOÀN BỘ CÔNG TY
            if(option == 1){
                if(SALARY_DOWNLOAD_ALL_PERMISSION.includes(email)){
                    let conditionMatchObj = {}
                    if(year && !isNaN(year)){
                        conditionMatchObj.year = Number(year)
                    }

                    if(month && !isNaN(month)){
                        conditionMatchObj.month = Number(month)
                    }

                    let conditionPopulate1 = {
                        path: '_id.project',
                        select: '_id name',
                        model: 'department'
                    }

                    let conditionPopulate2 = {
                        path: '_id.human',
                        select: '_id fullname department position',
                        model: 'user',
                        populate: {
                            path: 'department',
                            select: '_id name',
                            model: 'department',
                        },
                    }

                    let rawData = await CRM__GROW_TRACK_COLL.aggregate([
                        {
                            $match: {
                                company: ObjectID(companyID),
                                parent: { $exists: true, $ne: null },
                                project: { $exists: true, $ne: null },
                            }
                        },
                        {
                            $project : {
                                year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                project: 1,
                                position: 1,
                                date: 1,
                                salary: 1,
                                onLeaveSalary: 1,
                                overtimeSalary: 1,
                                revenueBonus: 1,
                                reward: 1,
                                mealAllowance: 1,
                                punishment: 1,
                                insurance: 1,
                                pitax: 1,
                                union: 1,
                                share: 1,
                                other: 1,
                                paid: 1,
                                advance: 1
                            }
                        },
                        {
                            $match: conditionMatchObj
                        },
                        {
                            $group: {
                                _id: { project: "$project" },
                                human: { $sum: 1 },
                                salary: { $sum: "$salary" },
                                onLeaveSalary: { $sum: "$onLeaveSalary" },
                                overtimeSalary: { $sum: "$overtimeSalary" },
                                revenueBonus: { $sum: "$revenueBonus" },
                                reward: { $sum: "$reward" },
                                mealAllowance: { $sum: "$mealAllowance" },
                                punishment: { $sum: "$punishment" },
                                insurance: { $sum: "$insurance" },
                                pitax: { $sum: "$pitax" },
                                union: { $sum: "$union" },
                                share: { $sum: "$share" },
                                other: { $sum: "$other" },
                                paid: { $sum: "$paid" },
                                advance: { $sum: "$advance" }
                            }
                        },
                    ])

                    if(rawData.length){
                        await CRM__GROW_TRACK_COLL.populate(rawData, conditionPopulate1)
                    }

                    let rawData2 = await CRM__GROW_TRACK_COLL.aggregate([
                        {
                            $match: {
                                company: ObjectID(companyID),
                                parent: { $exists: true, $ne: null },
                                human: { $exists: true, $ne: null },
                            }
                        },
                        {
                            $project : {
                                year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                human: 1,
                                project: 1,
                                position: 1,
                                date: 1,
                                salary: 1,
                                onLeaveSalary: 1,
                                overtimeSalary: 1,
                                revenueBonus: 1,
                                reward: 1,
                                mealAllowance: 1,
                                punishment: 1,
                                insurance: 1,
                                pitax: 1,
                                union: 1,
                                share: 1,
                                other: 1,
                                paid: 1,
                                advance: 1
                            }
                        },
                        {
                            $match: conditionMatchObj
                        },
                        {
                            $group: {
                                _id: { human: "$human" },
                                salary: { $sum: "$salary" },
                                onLeaveSalary: { $sum: "$onLeaveSalary" },
                                overtimeSalary: { $sum: "$overtimeSalary" },
                                revenueBonus: { $sum: "$revenueBonus" },
                                reward: { $sum: "$reward" },
                                mealAllowance: { $sum: "$mealAllowance" },
                                punishment: { $sum: "$punishment" },
                                insurance: { $sum: "$insurance" },
                                pitax: { $sum: "$pitax" },
                                union: { $sum: "$union" },
                                share: { $sum: "$share" },
                                other: { $sum: "$other" },
                                paid: { $sum: "$paid" },
                                advance: { $sum: "$advance" }
                            }
                        },
                    ])

                    if(rawData2.length){
                        await CRM__GROW_TRACK_COLL.populate(rawData2, conditionPopulate2)

                        // Sắp xếp dữ liệu
                        rawData2.sort((a, b) => {
                            const departmentA = a._id.human.department?.name || ""; // Lấy tên department
                            const departmentB = b._id.human.department?.name || "";
                            const fullnameA = a._id.human.fullname || ""; // Lấy tên người
                            const fullnameB = b._id.human.fullname || "";
                        
                            // Ưu tiên sắp xếp theo department.name, sau đó fullname
                            if (departmentA < departmentB) return -1;
                            if (departmentA > departmentB) return 1;
                            return fullnameA.localeCompare(fullnameB);
                        });
                    }

                    XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/salary_combine.xlsx')))
                        .then(async workbook => {

                            var i = 4
                            rawData.forEach((item, index) =>{
                                workbook.sheet('TongHop').row(2).cell(i).value(`${item._id.project.name}`)
                                workbook.sheet('TongHop').row(3).cell(i).value(Number(item?.human))

                                workbook.sheet('TongHop').row(5).cell(i).value(Number(item?.salary))
                                workbook.sheet('TongHop').row(6).cell(i).value(Number(item?.onLeaveSalary))
                                workbook.sheet('TongHop').row(7).cell(i).value(Number(item?.overtimeSalary))
                                workbook.sheet('TongHop').row(8).cell(i).value(Number(item?.revenueBonus))
                                workbook.sheet('TongHop').row(9).cell(i).value(Number(item?.reward))
                                workbook.sheet('TongHop').row(10).cell(i).value(Number(item?.mealAllowance))

                                workbook.sheet('TongHop').row(12).cell(i).value(Number(item?.punishment))
                                workbook.sheet('TongHop').row(13).cell(i).value(Number(item?.insurance))
                                workbook.sheet('TongHop').row(14).cell(i).value(Number(item?.pitax))
                                workbook.sheet('TongHop').row(15).cell(i).value(Number(item?.union))
                                workbook.sheet('TongHop').row(16).cell(i).value(Number(item?.share))
                                workbook.sheet('TongHop').row(17).cell(i).value(Number(item?.other))

                                workbook.sheet('TongHop').row(20).cell(i).value(Number(item?.paid))
                                workbook.sheet('TongHop').row(21).cell(i).value(Number(item?.advance))

                                i++
                            })

                            var i = 3
                            rawData2.forEach((item, index) =>{
                                workbook.sheet('TongHop2').row(i).cell(1).value(index + 1)
                                workbook.sheet('TongHop2').row(i).cell(2).value(item?._id?.human?.fullname)
                                workbook.sheet('TongHop2').row(i).cell(3).value(item?._id?.human?.department?.name)

                                workbook.sheet('TongHop2').row(i).cell(5).value(Number(item?.salary))
                                workbook.sheet('TongHop2').row(i).cell(6).value(Number(item?.onLeaveSalary))
                                workbook.sheet('TongHop2').row(i).cell(7).value(Number(item?.overtimeSalary))
                                workbook.sheet('TongHop2').row(i).cell(8).value(Number(item?.revenueBonus))
                                workbook.sheet('TongHop2').row(i).cell(9).value(Number(item?.reward))
                                workbook.sheet('TongHop2').row(i).cell(10).value(Number(item?.mealAllowance))

                                workbook.sheet('TongHop2').row(i).cell(11).formula(`=SUM(E${i}:J${i})`)

                                workbook.sheet('TongHop2').row(i).cell(12).value(Number(item?.punishment))
                                workbook.sheet('TongHop2').row(i).cell(13).value(Number(item?.insurance))
                                workbook.sheet('TongHop2').row(i).cell(14).value(Number(item?.pitax))
                                workbook.sheet('TongHop2').row(i).cell(15).value(Number(item?.union))
                                workbook.sheet('TongHop2').row(i).cell(16).value(Number(item?.share))
                                workbook.sheet('TongHop2').row(i).cell(17).value(Number(item?.other))

                                workbook.sheet('TongHop2').row(i).cell(18).formula(`=SUM(L${i}:Q${i})`)
                                workbook.sheet('TongHop2').row(i).cell(19).formula(`=K${i}-R${i}`)

                                workbook.sheet('TongHop2').row(i).cell(20).value(Number(item?.paid))
                                workbook.sheet('TongHop2').row(i).cell(21).value(Number(item?.advance))
                                workbook.sheet('TongHop2').row(i).cell(22).formula(`=S${i}-T${i}-U${i}`)

                                i++
                            })
                
                            const now = new Date();
                            const filePath = '../../../files/temporary_uploads/';
                            const fileName = `salary_combine${now.getTime()}.xlsx`;
                            const pathWriteFile = path.resolve(__dirname, filePath, fileName)

                            await workbook.toFileAsync(pathWriteFile)
                            const result = await uploadFileS3(pathWriteFile, fileName)

                            fs.unlinkSync(pathWriteFile);
                            return resolve({ error: false, data: result?.Location, status: 200 })
                    })
                }else{
                    return resolve({ error: true, message: 'Bạn không có quyền' })
                }
            }

            // TỔNG HỢP KPI TOÀN BỘ CÔNG TY (không gồm nhượng quyền)
            else if(option == 2 || option == 3){
                let listFunda
                if(option == 2 ){
                    listFunda = await ITEM__FUNDA_COLL.find({company: ObjectID(companyID), internal: 1}).select('name manager')
                }else{
                    listFunda = await ITEM__FUNDA_COLL.find({company: ObjectID(companyID), internal: 2}).select('name manager')
                }
                // console.log(listFunda)
                // console.log(listFunda.length)

                // Danh sách lỗi nhân viên: Không bao gồm các lỗi do Quản lý gán
                let listMistake = await FNB_MISTAKE_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            funda: {$in: listFunda.map(item=>ObjectID(item._id))},
                            userCreate: {$nin: listFunda.map(item=>ObjectID(item.manager))}, // Không lấy các lỗi do các Quản lý tự gán
                            status: 1, // Chỉ lấy hoàn thành
                        }
                    },
                    {
                        $project: {
                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            date: 1,
                            funda: 1,
                            amount: 1,
                            total: 1,
                        }
                    },
                    {
                        $match: {
                            year: Number(year),
                            month: Number(month),
                        }
                    },
                    {
                        $group: {
                            _id: { funda: "$funda" },
                            amount: { $sum: "$amount" },
                        }
                    },
                ])
                
                let conditionPopulate1 = {
                    path: '_id.funda',
                    select: '_id name',
                    model: 'funda',
                    populate: {
                        path: 'manager',
                        select: '_id fullname',
                        model: 'user',
                    },
                }

                // Doanh số cơ sở
                let listData = await FNB_ORDER_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            funda: {$in: listFunda.map(item=>ObjectID(item._id))},
                            status: 5, // Chỉ lấy đơn hoàn thành
                        }
                    },
                    {
                        $project: {
                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            date: 1,
                            funda: 1,
                            amount: 1,
                            total: 1,
                        }
                    },
                    {
                        $match: {
                            year: Number(year),
                            month: Number(month),
                        }
                    },
                    {
                        $group: {
                            _id: { funda: "$funda" },
                            total: { $sum: "$total" },
                        }
                    },
                    {
                        $sort: {"_id.funda": 1}
                    },
                ])
                if(listData.length){
                    await FNB_ORDER_COLL.populate(listData, conditionPopulate1)
                }
                // console.log(listData)

                // Lương cơ sở
                let listData2 = await CRM__GROW_TRACK_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            funda: {$in: listFunda.map(item=>ObjectID(item._id))},
                            parent: { $exists: true, $ne: null },
                            type: 2, // Sản xuất
                        }
                    },
                    {
                        $project : {
                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            funda: 1,
                            date: 1,
                            salary: 1,
                            subAllowance13: 1,
                        }
                    },
                    {
                        $match: {
                            year: Number(year),
                            month: Number(month),
                        }
                    },
                    {
                        $group: {
                            _id: { funda: "$funda" },
                            salary: { $sum: "$salary" },
                            subAllowance13: { $sum: "$subAllowance13" },
                        }
                    },
                ])

                let arr1 = [], arr2 = [], arr3 = []
                listMistake.forEach(item=>{
                    let key = item._id.funda;
                    if (!Array.isArray(arr1[key])) {
                        arr1[key] = [];
                    }
                    arr1[key].push(item)
                })

                listData2.forEach(item=>{
                    let key = item._id.funda;
                    if (!Array.isArray(arr2[key])) {
                        arr2[key] = [];
                    }
                    arr2[key].push(item)
                })

                let arrHuman = listData.map(item => item?._id?.funda?.manager?.fullname)
                let arrNew = Array.from(
                    arrHuman.reduce((acc, name) => {
                      acc.set(name, (acc.get(name) || 0) + 1);
                      return acc;
                    }, new Map())
                  ).map(([name, number]) => ({ name, number }));
                //   console.log(arrNew)

                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/kpi_combine.xlsx')))
                    .then(async workbook => {

                        var i = 4
                        arrNew.forEach((item, index) =>{
                            workbook.sheet('TongHop').row(i).cell(1).value(index + 1)
                            workbook.sheet('TongHop').row(i).cell(2).value(item.name)
                            workbook.sheet('TongHop').row(i).cell(3).value(`T${month}_${year}`)
                            workbook.sheet('TongHop').row(i).cell(4).value(Number(item.number))
                          
                            i++
                        })

                        var i = 4
                        listData.forEach((item, index) =>{
                            workbook.sheet('KPI').row(i).cell(1).value(index + 1)
                            workbook.sheet('KPI').row(i).cell(2).value(item?._id?.funda?.name)
                            workbook.sheet('KPI').row(i).cell(3).value(item?._id?.funda?.manager?.fullname)
                            workbook.sheet('KPI').row(i).cell(4).value(`T${month}_${year}`)
                            workbook.sheet('KPI').row(i).cell(8).value(Number(500000)) // Tạm tính KPI nguyên liệu

                            if(arr1[item?._id?.funda?._id]){
                                workbook.sheet('KPI').row(i).cell(15).value(Number(arr1[item?._id?.funda?._id][0].amount))
                            }

                            workbook.sheet('1.DoanhSo').row(i).cell(1).value(index + 1)
                            workbook.sheet('1.DoanhSo').row(i).cell(2).value(item?._id?.funda?.name)
                            workbook.sheet('1.DoanhSo').row(i).cell(3).value(item?._id?.funda?.manager?.fullname)
                            workbook.sheet('1.DoanhSo').row(i).cell(4).value(`T${month}_${year}`)
                            workbook.sheet('1.DoanhSo').row(i).cell(5).value(Number(item?.total))

                            workbook.sheet('2.NhanSu').row(i).cell(1).value(index + 1)
                            workbook.sheet('2.NhanSu').row(i).cell(2).value(item?._id?.funda?.name)
                            workbook.sheet('2.NhanSu').row(i).cell(3).value(item?._id?.funda?.manager?.fullname)
                            workbook.sheet('2.NhanSu').row(i).cell(4).value(`T${month}_${year}`)
                            workbook.sheet('2.NhanSu').row(i).cell(5).value(Number(item?.total))

                            if(arr2[item?._id?.funda?._id]){
                                workbook.sheet('2.NhanSu').row(i).cell(8).value(Number(arr2[item?._id?.funda?._id][0].subAllowance13))
                                workbook.sheet('2.NhanSu').row(i).cell(9).value(Number(arr2[item?._id?.funda?._id][0].salary))
                            }
                          
                            i++
                        })
            
                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `kpi_combine${now.getTime()}.xlsx`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName)

                        await workbook.toFileAsync(pathWriteFile)
                        const result = await uploadFileS3(pathWriteFile, fileName)

                        fs.unlinkSync(pathWriteFile);
                        return resolve({ error: false, data: result?.Location, status: 200 })
                })

                // return resolve({ error: false, message: "Hoàn thành", data: listData, status: 200 });
            }

            // TỔNG HỢP ĐÁNH GIÁ NHÂN VIÊN
            else if(option == 4){
                let listData1 = await FNB_MISTAKE_COLL.aggregate([
                    {
                      $match: {
                        company: ObjectID(companyID),
                        status: 1, // Chỉ lấy hoàn thành
                      },
                    },
                    {
                      $project: {
                        year: { $year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" } },
                        month: { $month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" } },
                        date: 1,
                        funda: 1,
                        executor: 1,
                        grade: 1,
                        amount: 1,
                        total: 1,
                      },
                    },
                    {
                      $match: {
                        year: Number(year),
                        month: Number(month),
                      },
                    },
                    {
                      $group: {
                        _id: { executor: "$executor", grade: "$grade" }, // Gom nhóm theo executor và grade
                        count: { $sum: 1 }, // Đếm số tài liệu trong từng nhóm
                        amount: { $sum: "$amount" }, // Tính tổng amount nếu cần
                      },
                    },
                    {
                      $addFields: {
                        multiplier: {
                          $switch: {
                            branches: [
                              { case: { $eq: ["$_id.grade", 1] }, then: 0.3 },
                              { case: { $eq: ["$_id.grade", 2] }, then: 0.5 },
                              { case: { $eq: ["$_id.grade", 3] }, then: 1 },
                              { case: { $eq: ["$_id.grade", 4] }, then: 2 },
                            ],
                            default: 0,
                          },
                        },
                      },
                    },
                    {
                      $group: {
                        // _id: null, // Tổng hợp toàn bộ
                        _id: { human: "$_id.executor" }, 
                        factorSum: { $sum: { $multiply: ["$count", "$multiplier"] } }, // Tính tổng factor sum
                      },
                    },
                    // {
                    //     $sort: {"factorSum": -1}
                    // }
                ])
                
                let listData2 = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            parent: { $exists: true, $ne: null },
                            hours: {$gt: 0},
                            type: 2, // Sản xuất
                        }
                    },
                    {
                        $project : {
                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            funda: 1,
                            date: 1,
                            assignee: 1,
                            hours: 1,
                        }
                    },
                    {
                        $match: {
                            year: Number(year),
                            month: Number(month),
                        }
                    },
                    {
                        $group: {
                            _id: { human: "$assignee" },
                            hours: { $sum: "$hours" },
                        }
                    },
                    {
                        $sort: {"hours": -1}
                    }
                ])
                // console.log(listData1)
                // console.log(listData2)

                let listUser = await AUTH__USER_COLL.find({
                    _id: {
                      $in: [
                        ...listData1.map(item => item._id.human), 
                        ...listData2.map(item => item._id.human)
                      ]
                    }
                })
                .select('fullname department position')
                .populate(
                    {
                        path: 'department',
                        select: '_id name',
                    }
                ) 

                let arr1 = [], arr2 = [], arr3 = []
                listData1.forEach(item=>{
                    let key = item._id.human;
                    if (!Array.isArray(arr1[key])) {
                        arr1[key] = [];
                    }
                    arr1[key].push(item)
                })

                listData2.forEach(item=>{
                    let key = item._id.human;
                    if (!Array.isArray(arr2[key])) {
                        arr2[key] = [];
                    }
                    arr2[key].push(item)
                })

                // return resolve({ error: false, message: "Hoàn thành", data: listData2, status: 200 });

                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/export_achievement_points.xlsm')))
                    .then(async workbook => {

                        var i = 3
                        listUser.forEach((item, index) =>{
                            workbook.sheet('TongHop').row(i).cell(1).value(index + 1)
                            workbook.sheet('TongHop').row(i).cell(2).value(item?.fullname)
                            workbook.sheet('TongHop').row(i).cell(3).value(item?.department?.name)
                            workbook.sheet('TongHop').row(i).cell(4).value(`T${month}_${year}`)

                            let factor = 0, hour = 0
                            if(arr1[item?._id]){
                                factor = Number(arr1[item?._id][0].factorSum)
                                workbook.sheet('TongHop').row(i).cell(5).value(Number(arr1[item?._id][0].factorSum))
                            }

                            if(arr2[item?._id]){
                                hour = Number(arr2[item?._id][0].hours)

                                workbook.sheet('TongHop').row(i).cell(6).value(Number(arr2[item?._id][0].hours))
                            }

                            workbook.sheet('TongHop').row(i).cell(5).value(Number(factor))
                            workbook.sheet('TongHop').row(i).cell(6).value(Number(hour))

                            if(hour != 0){
                                workbook.sheet('TongHop').row(i).cell(7).formula(`=E${i}/F${i}`)
                            }else{
                                workbook.sheet('TongHop').row(i).cell(7).value(0)
                            }

                            // workbook.sheet('TongHop').row(i).cell(7).formula(`=E${i}/F${i}`)
                            // workbook.sheet('TongHop').row(i).cell(7).formula(`=IF(F${i}<>0;E${i}/F${i};0)`)
                          
                            i++
                        })

                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `achievement_points${now.getTime()}.xlsm`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName)

                        await workbook.toFileAsync(pathWriteFile)
                        const result = await uploadFileS3(pathWriteFile, fileName)

                        fs.unlinkSync(pathWriteFile);
                        return resolve({ error: false, data: result?.Location, status: 200 })
                })
            }

            // TỔNG HỢP LƯƠNG NHÂN VIÊN ĐIỂM BÁN
            else if(option == 5){
                let conditionMatchObj = {}
                if(year && !isNaN(year)){
                    conditionMatchObj.year = Number(year)
                }

                if(month && !isNaN(month)){
                    conditionMatchObj.month = Number(month)
                }

                let conditionPopulate1 = {
                    path: '_id.funda',
                    select: '_id name',
                    model: 'funda'
                }

                let conditionPopulate2 = {
                    path: '_id.human',
                    select: '_id fullname department position',
                    model: 'user',
                    populate: {
                        path: 'department',
                        select: '_id name',
                        model: 'department',
                    },
                }

                let rawData = await CRM__GROW_TRACK_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            parent: { $exists: true, $ne: null },
                            type: 2,
                        }
                    },
                    {
                        $project : {
                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            funda: 1,
                            project: 1,
                            position: 1,
                            type: 1,
                            date: 1,
                            salary: 1,
                            onLeaveSalary: 1,
                            overtimeSalary: 1,
                            revenueBonus: 1,
                            reward: 1,
                            mealAllowance: 1,
                            punishment: 1,
                            insurance: 1,
                            pitax: 1,
                            union: 1,
                            share: 1,
                            other: 1,
                            paid: 1,
                            advance: 1
                        }
                    },
                    {
                        $match: conditionMatchObj
                    },
                    {
                        $group: {
                            _id: { funda: "$funda" },
                            human: { $sum: 1 },
                            salary: { $sum: "$salary" },
                            onLeaveSalary: { $sum: "$onLeaveSalary" },
                            overtimeSalary: { $sum: "$overtimeSalary" },
                            revenueBonus: { $sum: "$revenueBonus" },
                            reward: { $sum: "$reward" },
                            mealAllowance: { $sum: "$mealAllowance" },
                            punishment: { $sum: "$punishment" },
                            insurance: { $sum: "$insurance" },
                            pitax: { $sum: "$pitax" },
                            union: { $sum: "$union" },
                            share: { $sum: "$share" },
                            other: { $sum: "$other" },
                            paid: { $sum: "$paid" },
                            advance: { $sum: "$advance" }
                        }
                    },
                ])

                if(rawData.length){
                    await CRM__GROW_TRACK_COLL.populate(rawData, conditionPopulate1)
                }

                let rawData2 = await CRM__GROW_TRACK_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            parent: { $exists: true, $ne: null },
                            type: 2,
                        }
                    },
                    {
                        $project : {
                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            human: 1,
                            type: 1,
                            project: 1,
                            position: 1,
                            date: 1,
                            salary: 1,
                            onLeaveSalary: 1,
                            overtimeSalary: 1,
                            revenueBonus: 1,
                            reward: 1,
                            mealAllowance: 1,
                            punishment: 1,
                            insurance: 1,
                            pitax: 1,
                            union: 1,
                            share: 1,
                            other: 1,
                            paid: 1,
                            advance: 1
                        }
                    },
                    {
                        $match: conditionMatchObj
                    },
                    {
                        $group: {
                            _id: { human: "$human" },
                            salary: { $sum: "$salary" },
                            onLeaveSalary: { $sum: "$onLeaveSalary" },
                            overtimeSalary: { $sum: "$overtimeSalary" },
                            revenueBonus: { $sum: "$revenueBonus" },
                            reward: { $sum: "$reward" },
                            mealAllowance: { $sum: "$mealAllowance" },
                            punishment: { $sum: "$punishment" },
                            insurance: { $sum: "$insurance" },
                            pitax: { $sum: "$pitax" },
                            union: { $sum: "$union" },
                            share: { $sum: "$share" },
                            other: { $sum: "$other" },
                            paid: { $sum: "$paid" },
                            advance: { $sum: "$advance" }
                        }
                    },
                ])

                if(rawData2.length){
                    await CRM__GROW_TRACK_COLL.populate(rawData2, conditionPopulate2)

                    // Sắp xếp dữ liệu
                    rawData2.sort((a, b) => {
                        const departmentA = a._id.human.department?.name || ""; // Lấy tên department
                        const departmentB = b._id.human.department?.name || "";
                        const fullnameA = a._id.human.fullname || ""; // Lấy tên người
                        const fullnameB = b._id.human.fullname || "";
                    
                        // Ưu tiên sắp xếp theo department.name, sau đó fullname
                        if (departmentA < departmentB) return -1;
                        if (departmentA > departmentB) return 1;
                        return fullnameA.localeCompare(fullnameB);
                    });
                }

                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/salary_combine.xlsx')))
                    .then(async workbook => {

                        var i = 4
                        rawData.forEach((item, index) =>{
                            workbook.sheet('TongHop').row(2).cell(i).value(`${item?._id?.funda?.name}`)
                            workbook.sheet('TongHop').row(3).cell(i).value(Number(item?.human))

                            workbook.sheet('TongHop').row(5).cell(i).value(Number(item?.salary))
                            workbook.sheet('TongHop').row(6).cell(i).value(Number(item?.onLeaveSalary))
                            workbook.sheet('TongHop').row(7).cell(i).value(Number(item?.overtimeSalary))
                            workbook.sheet('TongHop').row(8).cell(i).value(Number(item?.revenueBonus))
                            workbook.sheet('TongHop').row(9).cell(i).value(Number(item?.reward))
                            workbook.sheet('TongHop').row(10).cell(i).value(Number(item?.mealAllowance))

                            workbook.sheet('TongHop').row(12).cell(i).value(Number(item?.punishment))
                            workbook.sheet('TongHop').row(13).cell(i).value(Number(item?.insurance))
                            workbook.sheet('TongHop').row(14).cell(i).value(Number(item?.pitax))
                            workbook.sheet('TongHop').row(15).cell(i).value(Number(item?.union))
                            workbook.sheet('TongHop').row(16).cell(i).value(Number(item?.share))
                            workbook.sheet('TongHop').row(17).cell(i).value(Number(item?.other))

                            workbook.sheet('TongHop').row(20).cell(i).value(Number(item?.paid))
                            workbook.sheet('TongHop').row(21).cell(i).value(Number(item?.advance))

                            i++
                        })

                        var i = 3
                        rawData2.forEach((item, index) =>{
                            workbook.sheet('TongHop2').row(i).cell(1).value(index + 1)
                            workbook.sheet('TongHop2').row(i).cell(2).value(item?._id?.human?.fullname)
                            workbook.sheet('TongHop2').row(i).cell(3).value(item?._id?.human?.department?.name)

                            workbook.sheet('TongHop2').row(i).cell(5).value(Number(item?.salary))
                            workbook.sheet('TongHop2').row(i).cell(6).value(Number(item?.onLeaveSalary))
                            workbook.sheet('TongHop2').row(i).cell(7).value(Number(item?.overtimeSalary))
                            workbook.sheet('TongHop2').row(i).cell(8).value(Number(item?.revenueBonus))
                            workbook.sheet('TongHop2').row(i).cell(9).value(Number(item?.reward))
                            workbook.sheet('TongHop2').row(i).cell(10).value(Number(item?.mealAllowance))

                            workbook.sheet('TongHop2').row(i).cell(11).formula(`=SUM(E${i}:J${i})`)

                            workbook.sheet('TongHop2').row(i).cell(12).value(Number(item?.punishment))
                            workbook.sheet('TongHop2').row(i).cell(13).value(Number(item?.insurance))
                            workbook.sheet('TongHop2').row(i).cell(14).value(Number(item?.pitax))
                            workbook.sheet('TongHop2').row(i).cell(15).value(Number(item?.union))
                            workbook.sheet('TongHop2').row(i).cell(16).value(Number(item?.share))
                            workbook.sheet('TongHop2').row(i).cell(17).value(Number(item?.other))

                            workbook.sheet('TongHop2').row(i).cell(18).formula(`=SUM(L${i}:Q${i})`)
                            workbook.sheet('TongHop2').row(i).cell(19).formula(`=K${i}-R${i}`)

                            workbook.sheet('TongHop2').row(i).cell(20).value(Number(item?.paid))
                            workbook.sheet('TongHop2').row(i).cell(21).value(Number(item?.advance))
                            workbook.sheet('TongHop2').row(i).cell(22).formula(`=S${i}-T${i}-U${i}`)

                            i++
                        })
            
                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `salary_combine${now.getTime()}.xlsx`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName)

                        await workbook.toFileAsync(pathWriteFile)
                        const result = await uploadFileS3(pathWriteFile, fileName)

                        fs.unlinkSync(pathWriteFile);
                        return resolve({ error: false, data: result?.Location, status: 200 })
                })
            }

            // BÁO CÁO NHANH LÃI LỖ
            else if(option == 6){
                if(SALARY_DOWNLOAD_ALL_PERMISSION.includes(email)){

                    // Doanh số cơ sở
                    let listData = await FNB_ORDER_COLL.aggregate([
                        {
                            $facet: {
                                data1:[
                                    {
                                        $match: {
                                            company: ObjectID(companyID),
                                            status: 5, // Chỉ lấy đơn hoàn thành
                                            salesChannel: 1, // DS off
                                        }
                                    },
                                    {
                                        $project: {
                                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                            month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                            date: 1,
                                            funda: 1,
                                            total: 1,
                                        }
                                    },
                                    {
                                        $match: {
                                            year: Number(year),
                                            month: Number(month),
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: { funda: "$funda" },
                                            total: { $sum: "$total" },
                                        }
                                    },
                                ],
                                data2:[
                                    {
                                        $match: {
                                            company: ObjectID(companyID),
                                            status: 5, // Chỉ lấy đơn hoàn thành
                                            salesChannel: {$in: [2,3,4,5,6,7,8,9,10,11]}, // DS off
                                        }
                                    },
                                    {
                                        $project: {
                                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                            month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                            date: 1,
                                            funda: 1,
                                            total: 1,
                                        }
                                    },
                                    {
                                        $match: {
                                            year: Number(year),
                                            month: Number(month),
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: { funda: "$funda" },
                                            total: { $sum: "$total" },
                                        }
                                    },
                                ],
                            }
                        }
                    ])

                    let arr1 = [], arr2 = [], arr3 = []
                    listData[0].data1.forEach(item=>{
                        let key = item._id.funda;
                        if (!Array.isArray(arr1[key])) {
                            arr1[key] = [];
                        }
                        arr1[key].push(item)
                    })

                    listData[0].data2.forEach(item=>{
                        let key = item._id.funda;
                        if (!Array.isArray(arr2[key])) {
                            arr2[key] = [];
                        }
                        arr2[key].push(item)
                    })

                    let arr = [...listData[0].data1.map(item=>ObjectID(item._id.funda)), ...listData[0].data2.map(item=>ObjectID(item._id.funda))]

                    let listFunda = await ITEM__FUNDA_COLL.find({_id: {$in: arr}})
                    .select('_id name sign manager planExpense utilityExpense humanExpense sellingExpenseRate materialExpenseRate otherExpenseRate')
                    .populate({
                        path: 'manager',
                        select: 'fullname'
                    })

                    XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/quick_report.xlsx')))
                        .then(async workbook => {

                        var i = 4
                        listFunda.forEach((item, index) =>{
                            workbook.sheet('BaoCao').row(i).cell(1).value(index + 1)
                            workbook.sheet('BaoCao').row(i).cell(2).value(item?.name)
                            workbook.sheet('BaoCao').row(i).cell(3).value(item?.manager?.fullname)
                            workbook.sheet('BaoCao').row(i).cell(4).value(`T${month}_${year}`)
                            workbook.sheet('BaoCao').row(i).cell(8).value(Number(3500000))
                            workbook.sheet('BaoCao').row(i).cell(9).value(Number(item?.planExpense))
                            workbook.sheet('BaoCao').row(i).cell(10).value(Number(item?.utilityExpense))
                            workbook.sheet('BaoCao').row(i).cell(11).value(Number(item?.humanExpense))
                            workbook.sheet('BaoCao').row(i).cell(12).value(Number(item?.sellingExpenseRate))
                            workbook.sheet('BaoCao').row(i).cell(13).value(Number(item?.materialExpenseRate))
                            workbook.sheet('BaoCao').row(i).cell(14).value(Number(item?.otherExpenseRate))

                            if(arr1[item?._id]){
                                workbook.sheet('BaoCao').row(i).cell(5).value(Number(arr1[item?._id][0].total))
                            }

                            if(arr2[item?._id]){
                                workbook.sheet('BaoCao').row(i).cell(6).value(Number(arr2[item?._id][0].total))
                            }
                            
                            i++
                        })
            
                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `quick_report${now.getTime()}.xlsx`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName)

                        await workbook.toFileAsync(pathWriteFile)
                        const result = await uploadFileS3(pathWriteFile, fileName)

                        fs.unlinkSync(pathWriteFile);
                        return resolve({ error: false, data: result?.Location, status: 200 })                    
                    })
                }else{
                    return resolve({ error: true, message: 'Bạn không có quyền' })
                }
            }

           } catch (error) {
               return resolve({ error: true, message: error.message, status: 500 });
           }
       })
    }
}

exports.MODEL = new Model