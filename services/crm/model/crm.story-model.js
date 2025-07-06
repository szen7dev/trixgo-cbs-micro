"use strict";

const BaseModel                         = require('../../../tools/db/base_model.js');
const ObjectID                          = require('mongoose').Types.ObjectId;
const XlsxPopulate                      = require('xlsx-populate')
const fs                                = require('fs')
const path                              = require('path')
const { uploadFileS3 }                  = require('../../../tools/s3/index.js')
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const {
  checkObjectIDs,
  IsJsonString
}  = require('../../../tools/utils/utils.js');
const stringUtils					    = require('../../../tools/utils/string_utils.js')
const { CRM_PERMISSION }                = require('../helper/crm.keys-constant.js')

/**
 * COLLECTIONS
 */
// const AUTH__COMPANY_COLL                = require('../../auth/database/auth.company-coll')
const AUTH__USER_COLL                   = require('../../auth/database/auth.user-coll.js')
const CRM_SURVEY_STORY_COLL                   = require('../database/crm.story-coll')

class Model extends BaseModel {

    constructor() {
        super(CRM_SURVEY_STORY_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 22/11/2023
     */
    insert({ userID, companyID, phone, contactID, status, birthday, gender, height, weight, name, note, filesID }) {
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
                    if(!checkObjectIDs(contactID) || !name)
                        return resolve({ error: true, message: "Danh bạ không hợp lệ. Hãy vui lòng thử lại" })
                }

                //__________Khai báo và validate dữ liệu
                let dataInsert = {
                    company: companyID,
                    userCreate: userID,
                }

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

                if(checkObjectIDs(contactID)){
                    dataInsert.contact = contactID;
                }

                if(phone && phone != ""){
                    dataInsert.phone = phone;
                }

                if(name && name != ""){
                    dataInsert.name = name;
                }

                if(birthday && birthday != ""){
                    dataInsert.birthday = birthday;
                }

                if(name && name != ""){
                    dataInsert.name = name;
                }

                if(note && note != ""){
                    dataInsert.note = note;
                }

                let convertStr = ''
                if(name && name != ""){
                    convertStr = stringUtils.removeAccents(name)
                }
                if(note && note != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(note)
                }
                dataInsert.namecv = convertStr

                let infoAfterInsert = await this.insertData(dataInsert)
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert" })

                /**
                 * TÍNH TOÁN KẾT QUẢ TRẢ VỀ BIỂU ĐỒ ĐO CAO
                 */
                let ageHeight = [
                    {age: 1, height: 90},
                    {age: 2, height: 91},
                    {age: 3, height: 93},
                    {age: 4, height: 94},
                    {age: 5, height: 95},
                    {age: 6, height: 96},
                    {age: 7, height: 97},
                    {age: 8, height: 98},
                    {age: 9, height: 99},
                    {age: 10, height: 100},
                    {age: 11, height: 101},
                    {age: 12, height: 102},
                    {age: 13, height: 103},
                    {age: 14, height: 104},
                    {age: 15, height: 105},
                    {age: 16, height: 106},
                    {age: 17, height: 107},
                    {age: 18, height: 108},
                    {age: 19, height: 109},
                    {age: 20, height: 110},
                ]

                return resolve({ error: false, data: infoAfterInsert, ageHeight });
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
    update({ surveyID, userID, phone, contactID, status, birthday, gender, height, weight, name, note, filesID }){
        return new Promise(async (resolve) => {
            const that = this
            try {
                let dataUpdate = {
                    userUpdate: userID,
                    modifyAt: Date.now(),
                }

                let dataAddToset = {};

                if (checkObjectIDs(filesID)) {
                    dataAddToset = { files: filesID };
                }

                if(dataAddToset){
                    dataUpdate.$addToSet = dataAddToset;
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

                if(phone && phone != ""){
                    dataUpdate.phone = phone;
                }

                if(birthday && birthday != ""){
                    dataUpdate.birthday = birthday;
                }

                if(name && name != ""){
                    dataUpdate.name = name;
                }

                if(note && note != ""){
                    dataUpdate.note = note;
                }

                let convertStr = ''
                if(name && name != ""){
                    convertStr = stringUtils.removeAccents(name)
                }
                if(note && note != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(note)
                }
                dataUpdate.namecv = convertStr

                // console.log(dataUpdate)

                let infoAfterUpdate = await CRM_SURVEY_STORY_COLL.findByIdAndUpdate(surveyID, dataUpdate, { new: true })
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
                    let info = await CRM_SURVEY_STORY_COLL.findById(arraysRemove[0])

                    const result = await CRM_SURVEY_STORY_COLL.deleteMany({
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
                        let numberOfHuman = await CRM_SURVEY_STORY_COLL.count({parent: info?.parent})
                        if(numberOfHuman){
                            await CRM_SURVEY_STORY_COLL.findByIdAndUpdate(info?.parent, {
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
    getInfo({ surveyID, userID, select, populates }) {
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

                let infoAterGet = await CRM_SURVEY_STORY_COLL.findById(surveyID)
                .select(select)
                .populate(populates)

                if(!infoAterGet)
                    return resolve({ error: true, message: "can't_get_info", status: 403 })

                return resolve({ error: false, data: infoAterGet, status: 200 })
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
    getList({ companyID, contactID, month, year, keyword, limit = 10, lastestID, select, populates= {} }) {
        return new Promise(async (resolve) => {
            try {
                // Record Traffic
                // await ctx.call(`${CF_DOMAIN_SERVICES.ANALYSIS}.${CF_ACTIONS_ANALYSIS.HISTORY_TRAFFIC_INSERT}`, dataTF)

                // let getInfoUserApp = await AUTH__APP_USER.checkPermissionsAccessApp({
                //     appID: "61e049cffdebf77b072d1b14",
                //     userID
                // })

                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = {};
                let nextCursor	= null;
                let sortBy      = null;
                let keys	 = ['createAt__1', '_id__1'];

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

                // Bảng lương theo tháng, năm
                if(month && year){
                    conditionObj.$where = `return this.createAt.getMonth() === ${Number(month - 1)} && this.createAt.getFullYear() === ${Number(year)}`
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
					let infoData = await CRM_SURVEY_STORY_COLL.findById(lastestID);
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

                let infoDataAfterGet = await CRM_SURVEY_STORY_COLL.find(conditionObj)
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

                let totalRecord = await CRM_SURVEY_STORY_COLL.count(conditionObjOrg);
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

                    let listData = await CRM_SURVEY_STORY_COLL.aggregate([
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

                    let listData = await CRM_SURVEY_STORY_COLL.aggregate([
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

                    let listData = await CRM_SURVEY_STORY_COLL.aggregate([
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

                    let listData1 = await CRM_SURVEY_STORY_COLL.aggregate([
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
                        await CRM_SURVEY_STORY_COLL.populate(listData1, conditionPopulate1)
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

                    let listData1 = await CRM_SURVEY_STORY_COLL.aggregate([
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
                        await CRM_SURVEY_STORY_COLL.populate(listData1, conditionPopulate1)
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

                    let listData1 = await CRM_SURVEY_STORY_COLL.aggregate([
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
                        await CRM_SURVEY_STORY_COLL.populate(listData1, conditionPopulate1)
                    }

                    return resolve({ error: false, data: listData1 })
                }

                // Tổng hợp toàn bộ của 1 nhân sự
                else if(option == 6){

                    let conditionObj = {
                        human: ObjectID(assigneeID),
                        parent: { $exists: true, $ne: null }
                    }

                    let listData = await CRM_SURVEY_STORY_COLL.aggregate([
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

                    let rawData = await CRM_SURVEY_STORY_COLL.aggregate([
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
                        await CRM_SURVEY_STORY_COLL.populate(rawData, conditionPopulate1)
                    }

                    let rawData2 = await CRM_SURVEY_STORY_COLL.aggregate([
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
                        await CRM_SURVEY_STORY_COLL.populate(rawData2, conditionPopulate2)

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
                let listData2 = await CRM_SURVEY_STORY_COLL.aggregate([
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

                let rawData = await CRM_SURVEY_STORY_COLL.aggregate([
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
                    await CRM_SURVEY_STORY_COLL.populate(rawData, conditionPopulate1)
                }

                let rawData2 = await CRM_SURVEY_STORY_COLL.aggregate([
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
                    await CRM_SURVEY_STORY_COLL.populate(rawData2, conditionPopulate2)

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