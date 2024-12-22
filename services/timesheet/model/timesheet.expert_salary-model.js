"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const ObjectID                          = require('mongoose').Types.ObjectId;
const XlsxPopulate                      = require('xlsx-populate')
const fs                                = require('fs')
const path                              = require('path')
const { uploadFileS3 }                  = require('../../../tools/s3')

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
}  = require('../../../tools/utils/utils');
const stringUtils					    = require('../../../tools/utils/string_utils')
const { SALARY_RESET_PERMISSION, SALARY_DOWNLOAD_ALL_PERMISSION } = require('../helper/timesheet.keys-constant')


/**
 * COLLECTIONS
 */
// const AUTH__COMPANY_COLL                = require('../../auth/database/auth.company-coll')
const TIMESHEET__EXPERT_SALARY_COLL     = require('../database/timesheet.expert_salary-coll')
const TIMESHEET__EXPERT_TIMESHEET_COLL  = require('../database/timesheet.expert_timesheet-coll')
const AUTH__USER_COLL                   = require('../../auth/database/auth.user-coll')
const FNB_MISTAKE_COLL                  = require('../../fnb/database/fnb.mistake-coll')
const ITEM__FUNDA_COLL                  = require('../../item/database/item.funda-coll')
const ITEM__DEPARTMENT_COLL             = require('../../item/database/item.department-coll')
const FNB_SHIFT_COLL                    = require('../../fnb/database/fnb.shift-coll');
const FNB_ORDER_COLL                    = require('../../fnb/database/fnb.order-coll');

const STORE_ORDER_COLL                  = require("../../store/database/store.order-coll");
const STORE_ORDER_PRODUCT_COLL          = require('../../store/database/store.order_product-coll');

const AUTH__APP_USER = require('../../auth/model/auth.app_users').MODEL

const STORE_ORDER_MODEL = require('../../store/model/store.order-model.js').MODEL;
const STORE_ORDER_PRODUCT_MODEL = require('../../store/model/store.order_product-model.js').MODEL;

// let dataTF = {
//     appID: "61e049cffdebf77b072d1b14", // TIMESHEET
//     menuID: "623f1ecae998e94feda0cd70", //
//     type: 1,
//     action: 1,
// }

class Model extends BaseModel {

    constructor() {
        super(TIMESHEET__EXPERT_SALARY_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 22/11/2023
     */
    insert({ userCreate, companyID, projectID, humanID, name, date, type, note, salary, onLeaveSalary, overtimeSalary, reward, punishment, advance, convertFactor, paid }) {
        return new Promise(async resolve => {
            try {
                if(!name){
                    return resolve({
                        error: true,
                        message: "Name invalid",
                        keyError: "name_invalid",
                    });
                }

                //__________Khai báo và validate dữ liệu
                let dataInsert = {
                    company: companyID,
                    userCreate,
                    name,
                    admins: [userCreate],
                    members: [userCreate]
                }

                if(checkObjectIDs(humanID)){
                    dataInsert.human = humanID;
                }

                let infoProject;
                if(checkObjectIDs(projectID)){
                    dataInsert.project = projectID

                    infoProject = await ITEM__DEPARTMENT_COLL.findById(projectID).select('funda name')
                    if(infoProject && checkObjectIDs(infoProject.funda)){
                        dataInsert.funda = infoProject.funda
                    }
                }

                if(date){
                    dataInsert.date = date;
                }

                if(type){
                    dataInsert.type = type;
                }

                if(convertFactor){
                    dataInsert.convertFactor = Number(convertFactor);
                }

                if(note){
                    dataInsert.note = note;
                }

                if(salary){
                    dataInsert.salary = Number(salary);
                }
                if(onLeaveSalary){
                    dataInsert.onLeaveSalary = Number(onLeaveSalary);
                }
                if(overtimeSalary){
                    dataInsert.overtimeSalary = Number(overtimeSalary);
                }
                if(reward){
                    dataInsert.reward = Number(reward);
                }
                if(punishment){
                    dataInsert.punishment = Number(punishment);
                }
                if(advance){
                    dataInsert.advance = Number(advance);
                }
                if(paid){
                    dataInsert.paid = Number(paid);
                }

                /**
                 * Convert to query
                 */
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
                 * Tạo chi tiết lương cho các User đang hoạt động
                 */
                let listHuman = await AUTH__USER_COLL.find({ company: companyID, status: 1 })
                .select('fullname department position contacts')
                .populate({
                    path: 'contacts',
                    select: 'company sallaryBasic insuranceFee union share'
                })

                for(const item of listHuman){
                    let insuranceFee = 0, union = 0, share = 0
                    if(item.contacts && item.contacts.length){
                        for(const contact of item.contacts){
                            if(contact.company && contact.company.toString() === companyID.toString()){
                                insuranceFee = Number(insuranceFee) + Number(contact.insuranceFee)
                                union = Number(union) + Number(contact.union)
                                share = Number(share) + Number(contact.share)
                            }
                        }
                    }

                    let dataInsertDetail = {
                        userCreate,
                        name: 'Default',
                        admins: [userCreate],
                        members: [userCreate],
                        human: item._id,
                        parent: infoAfterInsert._id, // Bảng lương cha
                        company: infoAfterInsert.company,
                        convertFactor: infoAfterInsert.convertFactor,
                        project: item.department,
                        position: item.position,
                        date: infoAfterInsert.date,
                        type: infoAfterInsert.type,
                    }

                    if(checkObjectIDs(projectID)){
                        if(infoProject && checkObjectIDs(infoProject.funda)){
                            dataInsertDetail.funda = infoProject.funda
                        }
                    }

                    if(Number(insuranceFee) > 0){
                        dataInsertDetail.insurance = Number(insuranceFee)
                    }

                    if(Number(union) > 0){
                        dataInsertDetail.union = Number(union)
                    }

                    if(Number(share) > 0){
                        dataInsertDetail.share = Number(share)
                    }

                    await this.insertData(dataInsertDetail)
                }

                // Cập nhật số nhân sự vào Bảng lương cha
                await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndUpdate(infoAfterInsert._id, {
                    numberOfHuman: Number(listHuman.length)
                }, { new: true })

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
    update({ expertSalaryID, type, admins, members, userID, status, projectID, humanID, name, date, note, salary, onLeaveSalary, overtimeSalary, reward, punishment, advance, convertFactor, paid, revenueBonus, mealAllowance, insurance, pitax, union, share, other, kpiFactor, subAllowance1, subAllowance2, subAllowance3, subAllowance4, subAllowance5, subAllowance6, subAllowance7, subAllowance8, subAllowance9, subAllowance10, subAllowance11, subAllowance12, subAllowance13, subAllowance14, subAllowance15, subAllowance16, subAllowance17, subAllowance18, subAllowance19, subAllowance20, subAllowance21, subAllowance22}){
        return new Promise(async (resolve) => {
            const that = this
            try {
                let infoSalary = await TIMESHEET__EXPERT_SALARY_COLL.findById(expertSalaryID).
                populate({
                    path: 'parent',
                    select: 'status'
                })
                if(!infoSalary) {
                    return resolve({
                        error: true,
                        message: 'Timesheet không tồn tại',
                        keyError: "timesheet_not_exists",
                        status: 400
                    })
                }

                if(infoSalary.parent && infoSalary.parent?.status == 2 )
                    return resolve({ error: true, message: 'Bảng lương đã khóa không thể cập nhật' })

                let dataUpdate = {
                    userUpdate: userID,
                    modifyAt: Date.now(),
                }

                if(type){
                    dataUpdate.type = type;
                }

                // Bảng lương
                let infoProject;
                if(checkObjectIDs(projectID)){
                    infoProject = await ITEM__DEPARTMENT_COLL.findById(projectID).select('funda name')
                    dataUpdate.project = projectID;

                    if(infoProject && checkObjectIDs(infoProject.funda)){
                        dataUpdate.funda = infoProject.funda
                    }
                }

                if(checkObjectIDs(humanID)){
                    dataUpdate.human = humanID;
                }

                if(name && name != ""){
                    dataUpdate.name = name;
                }

                if(date){
                    dataUpdate.date = date;
                }

                if(status){
                    let checkPermission = 1 // Không có quyền
                    let getInfoUserApp = await AUTH__APP_USER.checkPermissionsAccessApp({
                        appID: "61e049cffdebf77b072d1b14",
                        userID
                    })
                    if((!getInfoUserApp.error && Number(getInfoUserApp.data.level) == 0)){
                        checkPermission = Number(checkPermission) + 1
                    }
                    if(infoSalary.userCreate.toString() === userID.toString()){
                        checkPermission = Number(checkPermission) + 1
                    }

                    if(checkPermission >= 2){
                        dataUpdate.status = +status;
                    }
                }

                if(note && note != ""){
                    dataUpdate.note = note;
                }
                
                /**
                 * Convert to query
                 */
                let convertStr = ''
                if(name && name != ""){
                    convertStr = stringUtils.removeAccents(name)
                }
                if(note && note != ""){
                    convertStr = convertStr + " " + stringUtils.removeAccents(note)
                }
                dataUpdate.namecv = convertStr

                if(convertFactor){
                    dataUpdate.convertFactor = convertFactor;
                }

                if(kpiFactor){
                    dataUpdate.kpiFactor = Number(kpiFactor);
                }

                if(!isNaN(subAllowance1)){
                    dataUpdate.subAllowance1 = Number(subAllowance1).toFixed(0);
                }
                if(!isNaN(subAllowance2)){
                    dataUpdate.subAllowance2 = Number(subAllowance2).toFixed(0);
                }
                if(!isNaN(subAllowance3)){
                    dataUpdate.subAllowance3 = Number(subAllowance3).toFixed(0);
                }
                if(!isNaN(subAllowance4)){
                    dataUpdate.subAllowance4 = Number(subAllowance4).toFixed(0);
                }
                if(!isNaN(subAllowance5)){
                    dataUpdate.subAllowance5 = Number(subAllowance5).toFixed(0);
                }
                if(!isNaN(subAllowance6)){
                    dataUpdate.subAllowance6 = Number(subAllowance6).toFixed(0);
                }
                if(!isNaN(subAllowance7)){
                    dataUpdate.subAllowance7 = Number(subAllowance7).toFixed(0);
                }
                if(!isNaN(subAllowance8)){
                    dataUpdate.subAllowance8 = Number(subAllowance8).toFixed(0);
                }
                if(!isNaN(subAllowance9)){
                    dataUpdate.subAllowance9 = Number(subAllowance9).toFixed(0);
                }
                if(!isNaN(subAllowance10)){
                    dataUpdate.subAllowance10 = Number(subAllowance10).toFixed(0);
                }
                if(!isNaN(subAllowance11)){
                    dataUpdate.subAllowance11 = Number(subAllowance11).toFixed(0);
                }
                if(!isNaN(subAllowance12)){
                    dataUpdate.subAllowance12 = Number(subAllowance12).toFixed(0);
                }
                if(!isNaN(subAllowance13)){
                    dataUpdate.subAllowance13 = Number(subAllowance13).toFixed(0);
                }
                if(!isNaN(subAllowance14)){
                    dataUpdate.subAllowance14 = Number(subAllowance14).toFixed(0);
                }
                if(!isNaN(subAllowance15)){
                    dataUpdate.subAllowance15 = Number(subAllowance15).toFixed(0);
                }
                if(!isNaN(subAllowance16)){
                    dataUpdate.subAllowance16 = Number(subAllowance16).toFixed(0);
                }
                if(!isNaN(subAllowance17)){
                    dataUpdate.subAllowance17 = Number(subAllowance17).toFixed(0);
                }
                if(!isNaN(subAllowance18)){
                    dataUpdate.subAllowance18 = Number(subAllowance18).toFixed(0);
                }
                if(!isNaN(subAllowance19)){
                    dataUpdate.subAllowance19 = Number(subAllowance19).toFixed(0);
                }
                if(!isNaN(subAllowance20)){
                    dataUpdate.subAllowance20 = Number(subAllowance20).toFixed(0);
                }
                if(!isNaN(subAllowance21)){
                    dataUpdate.subAllowance21 = Number(subAllowance21).toFixed(0);
                }
                if(!isNaN(subAllowance22)){
                    dataUpdate.subAllowance22 = Number(subAllowance22).toFixed(0);
                }

                // let mealAllowance = 0, other = 0
                // Tính toán phụ cấp và phải trả khác
                let mealAllowance = Number(Number(subAllowance1) + Number(subAllowance2) + Number(subAllowance3) + Number(subAllowance4) + Number(subAllowance5) + Number(subAllowance6) + Number(subAllowance7) + Number(subAllowance8) + Number(subAllowance9) + Number(subAllowance10) + Number(subAllowance11) + Number(subAllowance12) + Number(subAllowance13) + Number(subAllowance14) + Number(subAllowance15)).toFixed(0)

                let other = Number(Number(subAllowance16) + Number(subAllowance17) + Number(subAllowance18) + Number(subAllowance19) + Number(subAllowance20) + Number(subAllowance21) + Number(subAllowance22)).toFixed(0)

                if(!isNaN(salary) && Number(infoSalary.salary) != Number(salary)){
                    dataUpdate.salary = Number(salary).toFixed(0)
                }
                if(!isNaN(onLeaveSalary) && Number(infoSalary.onLeaveSalary) != Number(onLeaveSalary)){
                    dataUpdate.onLeaveSalary = Number(onLeaveSalary).toFixed(0)
                }
                if(!isNaN(overtimeSalary) && Number(infoSalary.overtimeSalary) != Number(overtimeSalary)){
                    dataUpdate.overtimeSalary = Number(overtimeSalary).toFixed(0)
                }

                if(!isNaN(reward) && Number(infoSalary.reward) != Number(reward)){
                    dataUpdate.reward = Number(reward).toFixed(0)
                }
                if(!isNaN(revenueBonus) && Number(infoSalary.revenueBonus) != Number(revenueBonus)){
                    dataUpdate.revenueBonus = Number(revenueBonus).toFixed(0)
                }
                if(!isNaN(punishment) && Number(infoSalary.punishment) != Number(punishment)){
                    dataUpdate.punishment = Number(punishment).toFixed(0)
                }
                if(!isNaN(mealAllowance) && Number(infoSalary.mealAllowance) != Number(mealAllowance)){
                    dataUpdate.mealAllowance = Number(mealAllowance).toFixed(0)
                }
                if(!isNaN(insurance) && Number(infoSalary.insurance) != Number(insurance)){
                    dataUpdate.insurance = Number(insurance).toFixed(0)
                }
                if(!isNaN(pitax) && Number(infoSalary.pitax) != Number(pitax)){
                    dataUpdate.pitax = Number(pitax).toFixed(0)
                }
                if(!isNaN(union) && Number(infoSalary.union) != Number(union)){
                    dataUpdate.union = Number(union).toFixed(0)
                }
                if(!isNaN(share) && Number(infoSalary.share) != Number(share)){
                    dataUpdate.share = Number(share).toFixed(0)
                }
                if(!isNaN(other) && Number(infoSalary.other) != Number(other)){
                    dataUpdate.other = Number(other).toFixed(0)
                }
                if(!isNaN(advance) && Number(infoSalary.advance) != Number(advance)){
                    dataUpdate.advance = Number(advance).toFixed(0)
                }
                if(!isNaN(paid) && Number(infoSalary.paid) != Number(paid)){
                    dataUpdate.paid = Number(paid).toFixed(0)
                }

                // Tính toán giá trị còn lại
                if(!isNaN(salary) || !isNaN(onLeaveSalary) || !isNaN(overtimeSalary) || !isNaN(reward) || !isNaN(revenueBonus) || !isNaN(mealAllowance) || !isNaN(punishment) || !isNaN(insurance) || !isNaN(pitax) || !isNaN(advance) || !isNaN(paid)){
                    dataUpdate.remaining = Number(Number(salary * kpiFactor) + Number(onLeaveSalary) + Number(overtimeSalary) + Number(reward) + Number(revenueBonus) + Number(mealAllowance) - Number(punishment) - Number(insurance) - Number(pitax) - Number(union) - Number(share) - Number(other) - Number(advance) - Number(paid)).toFixed(0)
                }
                // console.log(dataUpdate)

                // Kiểm tra quyền cập nhật: chỉ Admin mới được phân quyền cho người khác
                const adminsID = [...infoSalary.admins?.map(item => item?.toString())]
                if(adminsID.includes(userID.toString())) {
                    if(admins) {
                        if(admins.length && checkObjectIDs(admins)) {
                            admins = [...new Set(admins)];
                            dataUpdate.admins = admins;
                        } else{
                            dataUpdate.admins = [];
                        }
                    }

                    if(members) {
                        if(members.length && checkObjectIDs(members)) {
                            members = [...new Set(members)];
                            dataUpdate.members = members;
                        } else{
                            dataUpdate.members = [];
                        }
                    }
                }

                let infoAfterUpdate = await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndUpdate(expertSalaryID, dataUpdate, { new: true })
                if(!infoAfterUpdate) {
                    return resolve({
                        error: true,
                        message: "Cannot update",
                        keyError: "cannot_update",
                    })
                }

                /**
                 * CẬP NHẬT VÀO CHI TIẾT LƯƠNG CON
                 */
                if(!infoAfterUpdate.parent){
                    // Cập nhật số nhân sự bảng lương
                    let numberOfHuman = await TIMESHEET__EXPERT_SALARY_COLL.count({parent: expertSalaryID})
                    if(numberOfHuman){
                        await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndUpdate(expertSalaryID, {
                            userUpdate: userID,
                            modifyAt: Date.now(),
                            numberOfHuman
                        }, { new: true })
                    }

                    let dataUpdateNew = {
                        date: infoAfterUpdate.date,
                        userUpdate: userID,
                        modifyAt: Date.now()
                    }

                    if(checkObjectIDs(projectID)){
                        if(infoProject && infoProject.funda){
                            dataUpdateNew.funda = infoProject.funda
                        }
                    }

                    // Cập nhật ngày tháng
                    await TIMESHEET__EXPERT_SALARY_COLL.updateMany({parent: expertSalaryID},{$set: dataUpdateNew})
                }

                /**
                 * CẬP NHẬT VÀO BẢNG LƯƠNG CHA
                 */
                if(infoAfterUpdate.parent && checkObjectIDs(infoAfterUpdate.parent)){
                    await that.updateValue({ expertSalaryID: infoAfterUpdate.parent, userID })
                }

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Cập nhật chấm công vào các Chi tiết của Bảng lương
     * Author: HiepNH
     * Code: 22/11/2023
     */
    updateValueTimesheet({ dataUser, expertSalaryID, companyID }){
        // console.log({ dataUser, expertSalaryID, companyID })
        return new Promise(async (resolve) => {
            try {
                let infoSalary = await TIMESHEET__EXPERT_SALARY_COLL.findById(expertSalaryID)
                if(!infoSalary)
                    return resolve({ error: true, message: "can't_get_info", status: 403 });
                
                let year = infoSalary.date.getFullYear()
                let month = Number(infoSalary.date.getMonth()) + 1
                
                // console.log({month,year, companyID})

                /**
                 * Lương
                 * - Thông thường: 1
                 * - Công tác: 4
                 * - Du lịch, nghỉ mát: 5
                 */
                let listData = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            parent: { $exists: true, $ne: null },
                            assignee: { $exists: true, $ne: null },
                            subtype: {$in: [1,4,5]},
                        }
                    },
                    {
                        $project: {
                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            date: 1,
                            assignee: 1,
                            hours: 1,
                            amount: 1,
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
                            _id: { assignee: '$assignee' },
                            quantity: { $sum: "$hours" },
                            amount: { $sum: "$amount" },
                        }
                    },
                ])
                // console.log(listData)

                /**
                 * Lương nghỉ phép, lễ tết
                 * - Nghỉ phép: 2
                 * - Lễ tết: 3
                 */
                let listData2 = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            parent: { $exists: true, $ne: null },
                            assignee: { $exists: true, $ne: null },
                            subtype: {$in: [2,3]},
                        }
                    },
                    {
                        $project: {
                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            date: 1,
                            assignee: 1,
                            hours: 1,
                            amount: 1,
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
                            _id: { assignee: '$assignee' },
                            quantity: { $sum: "$hours" },
                            amount: { $sum: "$amount" },
                        }
                    },
                ])
                // console.log(listData2)

                /**
                 * Lương làm thêm
                 * - Làm thêm: 6
                 */
                let listData3 = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            parent: { $exists: true, $ne: null },
                            assignee: { $exists: true, $ne: null },
                            subtype: 6,
                        }
                    },
                    {
                        $project: {
                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            date: 1,
                            assignee: 1,
                            hours: 1,
                            amount: 1,
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
                            _id: { assignee: '$assignee' },
                            quantity: { $sum: "$hours" },
                            amount: { $sum: "$amount" },
                        }
                    },
                ])

                // Lấy các ngày đi làm Thông thường
                let listDataDay1 = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            parent: { $exists: true, $ne: null },
                            assignee: { $exists: true, $ne: null },
                            hours: {$gt: 0},
                            subtype: 1, // Đi làm Thông thường
                        }
                    },
                    {
                        $project: {
                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            dayOfWeek: { $dayOfWeek: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            amount: 1,
                            hours: 1,
                            subtype: 1,
                            assignee: 1,
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
                            _id: { assignee: '$assignee' },
                            quantity: { $sum: {$divide: ["$hours", 8]} }, // Chia quantity theo giờ cho 8
                            // quantity: {$sum: { $round: [{ $divide: ["$hours", 8] }, 0] } }, // Chia quantity theo giờ cho 8
                        }
                    },
                    // // Giai đoạn 1: Nhóm theo assignee và dayOfWeek
                    // {
                    //     $group: {
                    //         _id: { assignee: '$assignee', dayOfWeek: "$dayOfWeek" },
                    //         quantity: { $sum: 1 },
                    //     }
                    // },
                    // // Giai đoạn 2: Nhóm lại chỉ theo assignee, tổng hợp quantity
                    // {
                    //     $group: {
                    //         _id: { assignee: "$_id.assignee" }, // Chỉ nhóm theo assignee
                    //         quantity: { $sum: "$quantity" }, // Tổng quantity từ dayOfWeek
                    //     },
                    // },
                ])
                // console.log(listDataDay1)

                
                // Lấy các ngày đi làm Chủ nhật
                let listDataDay2 = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            parent: { $exists: true, $ne: null },
                            assignee: { $exists: true, $ne: null },
                            hours: {$gt: 0},
                            subtype: 1, // Đi làm Thông thường
                        }
                    },
                    {
                        $project: {
                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            dayOfWeek: { $dayOfWeek: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            hours: 1,
                            subtype: 1,
                            assignee: 1,
                        }
                    },
                    {
                        $match: {
                            year: Number(year),
                            month: Number(month),
                            dayOfWeek: 1,
                        }
                    },
                    // {
                    //     $group: {
                    //         _id: { assignee: '$assignee' },
                    //         quantity: { $sum: 1 },
                    //     }
                    // },
                    {
                        $group: {
                            _id: { assignee: '$assignee' },
                            quantity: { $sum: {$divide: ["$hours", 8]} }, // Chia quantity theo giờ cho 8
                            // quantity: {$sum: { $round: [{ $divide: ["$hours", 8] }, 0] } }, // Chia quantity theo giờ cho 8
                        }
                    },
                    // // Giai đoạn 1: Nhóm theo assignee và dayOfWeek
                    // {
                    //     $group: {
                    //         _id: { assignee: '$assignee', dayOfWeek: "$dayOfWeek" },
                    //         quantity: { $sum: 1 },
                    //     }
                    // },
                    // // Giai đoạn 2: Nhóm lại chỉ theo assignee, tổng hợp quantity
                    // {
                    //     $group: {
                    //         _id: { assignee: "$_id.assignee" }, // Chỉ nhóm theo assignee
                    //         quantity: { $sum: "$quantity" }, // Tổng quantity từ dayOfWeek
                    //     },
                    // },
                ])
                // console.log(listDataDay2)

                /**
                 * BA
                 * - Kiểm tra dữ liệu lương đã có ở các cơ sở/bảng lương khác để trừ đi
                 */
                let arr1 = [], arr2 = [], arr3 = [], arrDay1 = [], arrDay2 = []
                listData.forEach(item=>{
                    let key = item._id.assignee;
                    if (!Array.isArray(arr1[key])) {
                        arr1[key] = [];
                    }
                    arr1[key].push(item)
                })

                listData2.forEach(item=>{
                    let key = item._id.assignee;
                    if (!Array.isArray(arr2[key])) {
                        arr2[key] = [];
                    }
                    arr2[key].push(item)
                })

                listData3.forEach(item=>{
                    let key = item._id.assignee;
                    if (!Array.isArray(arr3[key])) {
                        arr3[key] = [];
                    }
                    arr3[key].push(item)
                })

                listDataDay1.forEach(item=>{
                    let key = item._id.assignee;
                    if (!Array.isArray(arrDay1[key])) {
                        arrDay1[key] = [];
                    }
                    arrDay1[key].push(item)
                })

                listDataDay2.forEach(item=>{
                    let key = item._id.assignee;
                    if (!Array.isArray(arrDay2[key])) {
                        arrDay2[key] = [];
                    }
                    arrDay2[key].push(item)
                })

                // console.log(arr1)
                // console.log(arr2)
                // console.log(arr3)

                // Lương của nhân sự tại các bảng lương khác để giảm trừ đi nếu ở đó đã có: parent != expertSalaryID
                let listDataSalary = await TIMESHEET__EXPERT_SALARY_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            $and: [
                                {parent: { $exists: true, $ne: null }},
                                {parent: { $ne: ObjectID(expertSalaryID)}}
                            ]
                        }
                    },
                    {
                        $project: {
                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            date: 1,
                            human: 1,
                            salary: 1,
                            onLeaveSalary: 1,
                            overtimeSalary: 1,
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
                            _id: { human: '$human' },
                            salary: { $sum: "$salary" },
                            onLeaveSalary: { $sum: "$onLeaveSalary" },
                            overtimeSalary: { $sum: "$overtimeSalary" },
                        }
                    },
                ])

                // console.log(listDataSalary)
                let arrSalary = []
                listDataSalary.forEach(item=>{
                    let key = item._id.human;
                    if (!Array.isArray(arrSalary[key])) {
                        arrSalary[key] = [];
                    }
                    arrSalary[key].push(item)
                })

                for(const item of dataUser){
                    let hours1 = 0, hours2 = 0, hours3 = 0, nowds = 0, nowdsos = 0
                    let salary = 0, onLeaveSalary = 0, overtimeSalary = 0, reward = 0, revenueBonus = 0, mealAllowance = 0, punishment = 0, insurance = 0, pitax = 0, union = 0, share = 0, other = 0, advance  = 0, paid = 0, remaining = 0, kpiFactor = 1
                    
                    let info = await TIMESHEET__EXPERT_SALARY_COLL.findOne({
                        parent: expertSalaryID,
                        human: item,
                    })

                    if(info){
                        if(arr1[item]){
                            hours1 = Number(arr1[item][0].quantity).toFixed(2)
                            // salary = Number(arr1[item][0].amount).toFixed(0)
                            salary = Math.round((Number(arr1[item][0].amount).toFixed(0))/1000) * 1000

                            if(arrSalary[item]){
                                salary = Number(salary) - Math.round((Number(arrSalary[item][0].salary).toFixed(0))/1000) * 1000
                            }
                        }

                        if(arr2[item]){
                            hours2 = Number(arr2[item][0].quantity).toFixed(2)
                            // onLeaveSalary = Number(arr2[item][0].amount).toFixed(0)
                            onLeaveSalary = Math.round((Number(arr2[item][0].amount).toFixed(0))/1000) * 1000

                            if(arrSalary[item]){
                                onLeaveSalary = Number(onLeaveSalary) - Math.round((Number(arrSalary[item][0].onLeaveSalary).toFixed(0))/1000) * 1000
                            }
                        }

                        if(arr3[item]){
                            hours3 = Number(arr3[item][0].quantity).toFixed(2)
                            // overtimeSalary = Number(arr3[item][0].amount).toFixed(0)
                            overtimeSalary = Math.round((Number(arr3[item][0].amount).toFixed(0))/1000) * 1000

                            if(arrSalary[item]){
                                overtimeSalary = Number(overtimeSalary) - Math.round((Number(arrSalary[item][0].overtimeSalary).toFixed(0))/1000) * 1000
                            }
                        }

                        if(arrDay1[item]){
                            nowds = Number(arrDay1[item][0].quantity).toFixed(2)
                        }

                        if(arrDay2[item]){
                            nowdsos = Number(arrDay2[item][0].quantity).toFixed(2)
                        }
            
                        reward = info.reward
                        revenueBonus = info.revenueBonus
                        mealAllowance = info.mealAllowance
                        punishment = info.punishment
                        insurance = info.insurance
                        pitax = info.pitax
                        union = info.union
                        share = info.share
                        other = info.other
                        advance = info.advance
                        paid = info.paid
                        kpiFactor = info.kpiFactor
                    }

                    remaining = Number(Number(salary * kpiFactor) + Number(onLeaveSalary) + Number(overtimeSalary) + Number(reward) + Number(revenueBonus) + Number(mealAllowance) - Number(punishment) - Number(insurance) - Number(pitax) - Number(union) - Number(share) - Number(other) - Number(advance) - Number(paid)).toFixed(0)

                    let dataUpdate =  {
                        hours1,
                        hours2,
                        hours3,
                        nowds,
                        nowdsos,
                        kpiFactor,
                        salary,
                        onLeaveSalary,
                        overtimeSalary,
                        reward,
                        revenueBonus,
                        mealAllowance,
                        punishment,
                        insurance,
                        pitax,
                        union,
                        share,
                        other,
                        advance,
                        paid,
                        remaining
                    }

                    if(info){
                        await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndUpdate(info._id, dataUpdate, { new: true })
                    }
                }
              
                return resolve({ error: false, status: 200 })
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Cập nhật chấm công theo Cơ sở vào các Chi tiết của Bảng lương
     * Author: HiepNH
     * Code: 1/12/2024
     */
    updateValueFundaTimesheet({ dataUser, expertSalaryID, companyID }){
        return new Promise(async (resolve) => {
            try {
                let infoSalary = await TIMESHEET__EXPERT_SALARY_COLL.findById(expertSalaryID)
                if(!infoSalary)
                    return resolve({ error: true, message: "can't_get_info", status: 403 })

                let month = Number(infoSalary.date.getMonth()) + 1
                let year = infoSalary.date.getFullYear()

                /**
                 * Lương chính thức
                 */
                let listData1 = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            funda: ObjectID(infoSalary.funda), // Theo cơ sở
                            parent: { $exists: true, $ne: null },
                            assignee: { $exists: true, $ne: null },
                            official: 1,
                        }
                    },
                    {
                        $project: {
                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            date: 1,
                            assignee: 1,
                            hours: 1,
                            amount: 1,
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
                            _id: { assignee: '$assignee' },
                            quantity: { $sum: "$hours" },
                            amount: { $sum: "$amount" },
                        }
                    },
                ])
                // console.log(listData1)

                /**
                 * Lương thử việc => Đưa về phụ cấp
                 */
                let listData2 = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            funda: ObjectID(infoSalary.funda), // Theo cơ sở
                            parent: { $exists: true, $ne: null },
                            assignee: { $exists: true, $ne: null },
                            official: 2,
                        }
                    },
                    {
                        $project: {
                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            date: 1,
                            assignee: 1,
                            hours: 1,
                            amount: 1,
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
                            _id: { assignee: '$assignee' },
                            quantity: { $sum: "$hours" },
                            amount: { $sum: "$amount" },
                        }
                    },
                ])
                // console.log(listData2)

                let arr1 = [], arr2 = []
                listData1.forEach(item=>{
                    let key = item._id.assignee;
                    if (!Array.isArray(arr1[key])) {
                        arr1[key] = [];
                    }
                    arr1[key].push(item)
                })

                listData2.forEach(item=>{
                    let key = item._id.assignee;
                    if (!Array.isArray(arr2[key])) {
                        arr2[key] = [];
                    }
                    arr2[key].push(item)
                })

                for(const item of dataUser){
                    let hours1 = 0, hours4 = 0
                    let salary = 0, onLeaveSalary = 0, overtimeSalary = 0, reward = 0, revenueBonus = 0, mealAllowance = 0, punishment = 0, insurance = 0, pitax = 0, union = 0, share = 0, other = 0, advance  = 0, paid = 0, remaining = 0, kpiFactor = 1
                    let subAllowance13 = 0 // Đặt làm phụ cấp Thử việc

                    let info = await TIMESHEET__EXPERT_SALARY_COLL.findOne({
                        parent: expertSalaryID,
                        human: item,
                        funda: ObjectID(infoSalary.funda)
                    })

                    // Lấy giá trị ban đầu
                    salary = info.salary
                    onLeaveSalary = info.onLeaveSalary
                    overtimeSalary = info.overtimeSalary
                    reward = info.reward
                    revenueBonus = info.revenueBonus
                    mealAllowance = info.mealAllowance
                    punishment = info.punishment
                    insurance = info.insurance
                    pitax = info.pitax
                    union = info.union
                    share = info.share
                    other = info.other
                    advance = info.advance
                    paid = info.paid
                    kpiFactor = info.kpiFactor
                    hours1 = info.hours1
                    hours4 = info.hours4
                    subAllowance13 = info.subAllowance13
                
                    if(info){
                        if(arr1[item]){
                            hours1 = Number(arr1[item][0].quantity).toFixed(2)
                            // salary = Number(arr1[item][0].amount).toFixed(0)
                            salary = Math.round((Number(arr1[item][0].amount).toFixed(0))/1000) * 1000
                        }

                        if(arr2[item]){
                            hours4 = Number(arr2[item][0].quantity).toFixed(2)
                            // mealAllowance = Number(arr2[item][0].amount).toFixed(0)
                            // subAllowance13 = Number(arr2[item][0].amount).toFixed(0)

                            mealAllowance = Math.round((Number(arr2[item][0].amount).toFixed(0))/1000) * 1000
                            subAllowance13 = Math.round((Number(arr2[item][0].amount).toFixed(0))/1000) * 1000
                        }
                    }

                    remaining = Number(Number(salary * kpiFactor) + Number(onLeaveSalary) + Number(overtimeSalary) + Number(reward) + Number(revenueBonus) + Number(mealAllowance) - Number(punishment) - Number(insurance) - Number(pitax) - Number(union) - Number(share) - Number(other) - Number(advance) - Number(paid)).toFixed(0)

                    let dataUpdate =  {
                        hours1,
                        hours4,
                        kpiFactor,
                        salary,
                        onLeaveSalary,
                        overtimeSalary,
                        reward,
                        revenueBonus,
                        mealAllowance,
                        punishment,
                        insurance,
                        pitax,
                        union,
                        share,
                        other,
                        advance,
                        paid,
                        remaining,
                        subAllowance13
                    }

                    if(info){
                        await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndUpdate(info._id, dataUpdate, { new: true })
                    }
                }
              
                return resolve({ error: false, status: 200 })
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Cập nhật KPI vào các chi tiết của Bảng lương
     * Author: HiepNH
     * Code: 22/11/2023
     */
    updateValueKpi({ dataUser, expertSalaryID, userID, companyID, fundaID }){
        return new Promise(async (resolve) => {
            try {
                let infoSalary = await TIMESHEET__EXPERT_SALARY_COLL.findById(expertSalaryID)
                if(!infoSalary)
                    return resolve({ error: true, message: "can't_get_info", status: 403 })

                let conditionObj = {
                    company: ObjectID(companyID),
                    executor: { $exists: true, $ne: null },
                    status: 1 // Các lỗi hoàn thành
                }

                // Cập nhật theo Cơ sở
                if(infoSalary.funda){
                    conditionObj = {
                        funda: ObjectID(infoSalary.funda),
                        executor: { $exists: true, $ne: null },
                        status: 1 // Các lỗi hoàn thành
                    }
                }

                let month = Number(infoSalary.date.getMonth()) + 1
                let year = infoSalary.date.getFullYear()

                // Danh sách phân loại lỗi theo nhân sự
                let listData = await FNB_MISTAKE_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $project: {
                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            executor: 1,
                            amount: 1,
                            bonus: 1
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
                            _id: { executor: '$executor' },
                            bonus: { $sum: "$bonus" },
                            amount: { $sum: "$amount" },
                        }
                    },
                ])
                // console.log({listData})

                let arr = []
                listData.forEach(item=>{
                    let key = item._id.executor;
                    if (!Array.isArray(arr[key])) {
                        arr[key] = [];
                    }
                    arr[key].push(item)
                })

                for(const item of dataUser){
                    let salary = 0, onLeaveSalary = 0, overtimeSalary = 0, reward = 0, revenueBonus = 0, mealAllowance = 0, punishment = 0, insurance = 0, pitax = 0, union = 0, share = 0, other = 0, advance  = 0, paid = 0, remaining = 0, kpiFactor = 1
                    
                    let info = await TIMESHEET__EXPERT_SALARY_COLL.findOne({
                        parent: expertSalaryID,
                        human: item,
                    })

                    if(info){
                        if(arr[item]){
                            // reward = Number(arr[item][0].bonus) * info.convertFactor
                            // punishment = Number(arr[item][0].amount) * info.convertFactor

                            reward = Math.round((Number(Number(arr[item][0].bonus) * info.convertFactor).toFixed(0))/1000) * 1000
                            punishment = Math.round((Number(Number(arr[item][0].amount) * info.convertFactor).toFixed(0))/1000) * 1000
                        }
                        
                        salary = info.salary
                        onLeaveSalary = info.onLeaveSalary
                        overtimeSalary = info.overtimeSalary
                        revenueBonus = info.revenueBonus
                        mealAllowance = info.mealAllowance
                        insurance = info.insurance
                        pitax = info.pitax
                        union = info.union
                        share = info.share
                        other = info.other
                        advance = info.advance
                        paid = info.paid
                        kpiFactor = info.kpiFactor
                    }

                    remaining = Number(Number(salary * kpiFactor) + Number(onLeaveSalary) + Number(overtimeSalary) + Number(reward) + Number(revenueBonus) + Number(mealAllowance) - Number(punishment) - Number(insurance) - Number(pitax) - Number(union) - Number(share) - Number(other) - Number(advance) - Number(paid)).toFixed(0)

                    let dataUpdate =  {
                        kpiFactor,
                        salary,
                        onLeaveSalary,
                        overtimeSalary,
                        reward,
                        revenueBonus,
                        mealAllowance,
                        punishment,
                        insurance,
                        pitax,
                        union,
                        share,
                        other,
                        advance,
                        paid,
                        remaining
                    }

                    if(info){
                        await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndUpdate(info._id, dataUpdate, { new: true })
                    }
                }

                return resolve({ error: false, status: 200 })
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 })
            }
        })
    }

    /**
     * Name: Cập nhật Doanh số cá nhân
     * Author: HiepNH
     * Code: 22/11/2023
     */
    updateRevenueKpi({ dataUser, expertSalaryID, userID, companyID, fundaID }){
        return new Promise(async (resolve) => {
            try {

                // Hàm tính KPI doanh số theo sản phẩm cho Nhân viên
                function calculateRevenue(totalSold, priceLevels) {
                    let revenue = 0;
                    let remaining = totalSold;
                
                    // Duyệt qua từng mức giá trong priceLevels
                    for (let i = 0; i < priceLevels.length; i++) {
                        let level = priceLevels[i];
                        
                        // Số lượng sản phẩm bán ở mức hiện tại
                        let quantityAtLevel = Math.min(remaining, level.quantity);
                        
                        // Tính doanh thu cho mức giá này
                        revenue += quantityAtLevel * level.price;
                        
                        // Giảm số lượng còn lại
                        remaining -= quantityAtLevel;
                
                        // Nếu không còn sản phẩm để bán, thoát khỏi vòng lặp
                        if (remaining <= 0) break;
                    }
                
                    return revenue;
                }
                
                // Ví dụ sử dụng hàm
                const priceLevels = [
                    { quantity: 99, price: 150 }, // 100 cốc đầu x 100
                    { quantity: 401, price: 250 }, // 200 cốc tiếp theo x 200
                    { quantity: 500, price: 300 }, // 200 cốc tiếp theo x 200
                    { quantity: 50000, price: 350 }, // 200 cốc tiếp theo x 200
                ];

                let infoSalary = await TIMESHEET__EXPERT_SALARY_COLL.findById(expertSalaryID)
                if(!infoSalary)
                    return resolve({ error: true, message: "can't_get_info", status: 403 })

                let conditionObj = {
                    company: ObjectID(companyID),
                    status: 5,
                    avgQuantityPerStaff: { $exists: true, $ne: null },
                }

                // Cập nhật theo Cơ sở
                if(infoSalary.funda){
                    conditionObj = {
                        funda: ObjectID(infoSalary.funda),
                        status: 5,
                        avgQuantityPerStaff: { $exists: true, $ne: null },
                    }
                }

                let month = Number(infoSalary.date.getMonth()) + 1
                let year = infoSalary.date.getFullYear()

                let conditionObjYear = {
                    year: Number(year),
                    month: Number(month),
                }

                let projectObj = {
                    year: { $year: "$createAt" },
                    month: { $month: "$createAt" },
                    company: 1,
                    funda: 1,
                    createAt: 1,
                    assignee: 1,
                    executor: 1,
                    total: 1,
                    amount: 1,
                    avgQuantityPerStaff: 1,
                }

                let lookupObj = {
                    from: "users",
                    localField: "assignee",
                    foreignField: "_id",
                    as: "staff",
                }

                let conditionGroup = {
                    _id: { staff: "$staff._id" },
                    avgQuantityPerStaff: { $sum: "$avgQuantityPerStaff" }
                }

                let listData = await FNB_ORDER_COLL.aggregate([
                    {
                      $match: conditionObj,
                    },
                    {
                      $project: projectObj,
                    },
                    {
                      $match: conditionObjYear,
                    },
                    {
                      $lookup: lookupObj,
                    },
                    {
                      $unwind: "$staff",
                    },
                    {
                      $group: conditionGroup,
                    },
                ])

                let arr = []
                listData.forEach(item=>{
                    let key = item._id.staff;
                    if (!Array.isArray(arr[key])) {
                        arr[key] = [];
                    }
                    arr[key].push(item)
                })

                for(const item of dataUser){
                    let salary = 0, onLeaveSalary = 0, overtimeSalary = 0, reward = 0, revenueBonus = 0, mealAllowance = 0, punishment = 0, insurance = 0, pitax = 0, union = 0, share = 0, other = 0, advance  = 0, paid = 0, remaining = 0, kpiFactor = 1
                    
                    let info = await TIMESHEET__EXPERT_SALARY_COLL.findOne({
                        parent: expertSalaryID,
                        human: item,
                    })

                    // Lấy giá trị ban đầu
                    salary = info.salary
                    onLeaveSalary = info.onLeaveSalary
                    overtimeSalary = info.overtimeSalary
                    reward = info.reward
                    revenueBonus = info.revenueBonus
                    mealAllowance = info.mealAllowance
                    punishment = info.punishment
                    insurance = info.insurance
                    pitax = info.pitax
                    union = info.union
                    share = info.share
                    other = info.other
                    advance = info.advance
                    paid = info.paid
                    kpiFactor = info.kpiFactor

                    if(info){
                        if(arr[item]){
                            revenueBonus = Math.round(calculateRevenue(Number(arr[item][0].avgQuantityPerStaff), priceLevels) / 1000) * 1000
                        }
                    }

                    remaining = Number(Number(salary * kpiFactor) + Number(onLeaveSalary) + Number(overtimeSalary) + Number(reward) + Number(revenueBonus) + Number(mealAllowance) - Number(punishment) - Number(insurance) - Number(pitax) - Number(union) - Number(share) - Number(other) - Number(advance) - Number(paid)).toFixed(0)

                    let dataUpdate =  {
                        kpiFactor,
                        salary,
                        onLeaveSalary,
                        overtimeSalary,
                        reward,
                        revenueBonus,
                        mealAllowance,
                        punishment,
                        insurance,
                        pitax,
                        union,
                        share,
                        other,
                        advance,
                        paid,
                        remaining
                    }

                    if(info){
                        await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndUpdate(info._id, dataUpdate, { new: true })
                    }
                }

                return resolve({ error: false, status: 200 })
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 })
            }
        })
    }

    /**
     * Name: Tổng hợp các chi tiết lương vào Bảng lương
     * Author: HiepNH
     * Code: 22/11/2023
     */
    updateValue({ dataUser, expertSalaryID, userID }){
        return new Promise(async (resolve) => {
            try {
                let listData = await TIMESHEET__EXPERT_SALARY_COLL.aggregate([
                    {
                        $match: {
                            parent: ObjectID(expertSalaryID)
                        }
                    },
                    {
                        $group: {
                            _id: { },
                            salary: { $sum:"$salary" },
                            salaryFactor: { $sum: { $multiply: [ "$salary", "$kpiFactor" ] } }, // Tổng hợp lương x Hệ số
                            onLeaveSalary: { $sum:"$onLeaveSalary" },
                            overtimeSalary: { $sum:"$overtimeSalary" },
                            reward: { $sum:"$reward" },
                            punishment: { $sum:"$punishment" },
                            advance: { $sum:"$advance" },
                            remaining: { $sum:"$remaining" },
                            paid: { $sum:"$paid" },
                            revenueBonus: { $sum:"$revenueBonus" },
                            mealAllowance: { $sum:"$mealAllowance" },
                            insurance: { $sum:"$insurance" },
                            pitax: { $sum:"$pitax" },
                            union: { $sum:"$union" },
                            share: { $sum:"$share" },
                            other: { $sum:"$other" },
                        }
                    },
                ])

                let salary = 0, onLeaveSalary = 0, overtimeSalary = 0, reward = 0, revenueBonus = 0, mealAllowance = 0, punishment = 0, insurance = 0, pitax = 0, union = 0, share = 0, other = 0, advance  = 0, paid = 0, remaining = 0, kpiFactor = 1, salaryFactor = 0

                if(listData[0]){
                    salary = Number(listData[0].salary)
                    onLeaveSalary = Number(listData[0].onLeaveSalary)
                    overtimeSalary = Number(listData[0].overtimeSalary)
                    reward = Number(listData[0].reward)
                    punishment = Number(listData[0].punishment)
                    advance = Number(listData[0].advance)
                    paid = Number(listData[0].paid)
                    revenueBonus = Number(listData[0].revenueBonus)
                    mealAllowance = Number(listData[0].mealAllowance)
                    insurance = Number(listData[0].insurance)
                    pitax = Number(listData[0].pitax)
                    union = Number(listData[0].union)
                    share = Number(listData[0].share)
                    other = Number(listData[0].other)
                    salaryFactor = Number(listData[0].salaryFactor)
                }

                if(salary != 0){
                    kpiFactor = salaryFactor/salary
                }

                remaining = Number(Number(salaryFactor) + Number(onLeaveSalary) + Number(overtimeSalary) + Number(reward) + Number(revenueBonus) + Number(mealAllowance) - Number(punishment) - Number(insurance) - Number(pitax) - Number(union) - Number(share) - Number(other) - Number(advance) - Number(paid)).toFixed(0)

                // remaining = Math.round((Number(Number(salaryFactor) + Number(onLeaveSalary) + Number(overtimeSalary) + Number(reward) + Number(revenueBonus) + Number(mealAllowance) - Number(punishment) - Number(insurance) - Number(pitax) - Number(union) - Number(share) - Number(other) - Number(advance) - Number(paid)))/1000) * 1000

                let dataUpdate =  {
                    userUpdate: userID, 
                    modifyAt: new Date(),
                    kpiFactor,
                    salary,
                    onLeaveSalary,
                    overtimeSalary,
                    reward,
                    revenueBonus,
                    mealAllowance,
                    punishment,
                    insurance,
                    pitax,
                    union,
                    share,
                    other,
                    advance,
                    paid,
                    remaining
                }

                let infoAfterUpdate = await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndUpdate(expertSalaryID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update_task", status: 403 });

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Đồng bộ data
     * Author: HiepNH
     * Code: 22/11/2023
     */
    syncData({ companyID, userID, email, option, salaryID, orderID, arrUser, fundaID, year, month }){
        const that = this
        return new Promise(async (resolve) => {
            try {
                //___________Quyền truy cập ứng dụng
                let infoAppUser = await AUTH__APP_USER.checkPermissionsAccessApp({
                    appID: "61e049cffdebf77b072d1b14",
                    userID
                })

                // CẬP NHẬT NHÂN SỰ CÒN THIẾU VÀO BẢNG LƯƠNG TỔNG
                if(option == 1){
                    let infoSalary = await TIMESHEET__EXPERT_SALARY_COLL.findById(salaryID)
                    if(infoSalary &&  infoSalary.status == 2)
                        return resolve({ error: true, message: 'Bảng lương đã khóa không thể cập nhật' })

                    let listData2 = await TIMESHEET__EXPERT_SALARY_COLL.find({parent: salaryID}).select('human')

                    let A = [] 
                    if(arrUser && arrUser.length){
                        A = arrUser.map(item=>item.toString())
                    }
                    let B = listData2.map(item=>item.human.toString())

                    // Lấy các phần tử trong A nhưng không có trong B
                    const result = A.filter(item => !B.includes(item));

                    /**
                     * Tạo chi tiết lương cho các User đang hoạt động
                     */
                    let listHuman = await AUTH__USER_COLL.find({ _id: {$in: result}, status: 1 })
                    .select('fullname department position contacts')
                    .populate({
                        path: 'contacts',
                        select: 'company sallaryBasic insuranceFee union share'
                    })
                    for(const item of listHuman){
                        let insuranceFee = 0, union = 0, share = 0
                        if(item.contacts && item.contacts.length){
                            for(const contact of item.contacts){
                                if(contact.company.toString() === companyID.toString()){
                                    insuranceFee = Number(insuranceFee) + Number(contact.insuranceFee)
                                    union = Number(union) + Number(contact.union)
                                    share = Number(share) + Number(contact.share)
                                }
                            }
                        }

                        let dataInsertDetail = {
                            userCreate: userID,
                            name: 'Default',
                            admins: [userID],
                            members: [userID],
                            human: item._id,
                            parent: infoSalary._id, // Bảng lương cha
                            company: infoSalary.company, // Bảng lương cha
                            convertFactor: infoSalary.convertFactor,
                            project: item.department,
                            position: item.position,
                            date: infoSalary.date, // Bảng lương cha
                            type: infoSalary.type, // Bảng lương cha
                        }

                        if(Number(insuranceFee) > 0){
                            dataInsertDetail.insurance = Number(insuranceFee)
                        }

                        if(Number(union) > 0){
                            dataInsertDetail.union = Number(union)
                        }

                        if(Number(share) > 0){
                            dataInsertDetail.share = Number(share)
                        }

                        await this.insertData(dataInsertDetail)
                    }

                    // Cập nhật số nhân sự vào Bảng lương cha
                    await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndUpdate(infoSalary._id, {
                        numberOfHuman: Number(infoSalary.numberOfHuman) + Number(listHuman.length)
                    }, { new: true })

                    return resolve({ error: false, message: 'Cập nhật thành công', status: 200 })
                }

                // COPY NHÂN BẢN BẢNG LƯƠNG
                else if(option == 2){
                    if(!infoAppUser.error && infoAppUser.data.level == 0){
                        let infoOld = await TIMESHEET__EXPERT_SALARY_COLL.findById(salaryID)
                        let listData = await TIMESHEET__EXPERT_SALARY_COLL.find({parent: salaryID}).select('human')

                        let listHuman = await AUTH__USER_COLL.find({_id: {$in: listData.map(item=>item.human)}})
                        .select('fullname department position contacts')
                        .populate({
                            path: 'contacts',
                            select: 'company sallaryBasic insuranceFee union share'
                        })

                        // Tạo bảng lương
                        let infoAfterInsert = await this.insertData({
                                company: companyID,
                                userCreate: userID,
                                name: `New of copy from ${infoOld.name}`,
                                namecv: `New of copy from ${infoOld.namecv}`,
                                admins: [userID],
                                members: [userID],
                                type: infoOld.type,
                                official: infoOld.official,
                                project: infoOld.project,
                                funda: infoOld.funda,
                        })

                        if(infoAfterInsert){
                                for(const item of listHuman){
                                    let insuranceFee = 0, union = 0, share = 0
                                    if(item.contacts && item.contacts.length){
                                        for(const contact of item.contacts){
                                            if(contact.company.toString() === companyID.toString()){
                                                insuranceFee = Number(insuranceFee) + Number(contact.insuranceFee)
                                                union = Number(union) + Number(contact.union)
                                                share = Number(share) + Number(contact.share)
                                            }
                                        }
                                    }
                
                                    let dataInsertDetail = {
                                        userCreate: userID,
                                        name: 'Default',
                                        admins: [userID],
                                        members: [userID],
                                        human: item._id,
                                        parent: infoAfterInsert._id, // Bảng lương cha
                                        company: infoAfterInsert.company,
                                        convertFactor: infoAfterInsert.convertFactor,
                                        project: item.department,
                                        position: item.position,
                                        date: infoAfterInsert.date,
                                        type: infoAfterInsert.type,
                                    }
                
                                    if(Number(insuranceFee) > 0){
                                        dataInsertDetail.insurance = Number(insuranceFee)
                                    }
                
                                    if(Number(union) > 0){
                                        dataInsertDetail.union = Number(union)
                                    }
                
                                    if(Number(share) > 0){
                                        dataInsertDetail.share = Number(share)
                                    }
                
                                    await this.insertData(dataInsertDetail)
                                }
                
                                // Cập nhật số nhân sự vào Bảng lương cha
                                await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndUpdate(infoAfterInsert._id, {
                                    numberOfHuman: Number(listHuman.length)
                                }, { new: true })

                                return resolve({ error: false, message: 'Copy thành công', status: 200 })
                        }else{
                            return resolve({ error: true, message: 'Copy thất bại' })
                        }
                    }else{
                        return resolve({ error: true, message: 'Bạn không có quyền thực hiện' })
                    }
                }
            
                // XÓA BẢNG LƯƠNG: TẠM KHÓA CHỨC NĂNG NÀY!!!!
                else if(option == 3){
                    if(!infoAppUser.error && infoAppUser.data.level == 0){
                        if(SALARY_RESET_PERMISSION.includes(email)){
                            let numberDetail = await TIMESHEET__EXPERT_SALARY_COLL.count({parent: salaryID})
                            if(numberDetail == 0){
                                await TIMESHEET__EXPERT_SALARY_COLL.deleteMany({parent: salaryID})
                                await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndDelete(salaryID);
                                return resolve({ error: false, data: 'Hành động thành công' })
                            }else{
                                return resolve({ error: true, message: 'Hành động thất bại' })
                            }
                        }else{
                            return resolve({ error: true, message: 'Hành động thất bại' })
                        }
                    }else{
                        return resolve({ error: true, message: 'Bạn không có quyền thực hiện' })
                    }
                }

                // COPY PHIẾU KHO: SAU ĐƯA VỀ PHÂN HỆ KHO
                else if(option == 4){
                    let infoOldOrder = await STORE_ORDER_COLL.findById(orderID)
                    if(infoOldOrder){
                        let infoNewOrder = await STORE_ORDER_MODEL.insert({
                            companyID, 
                            userID, 
                            outin: infoOldOrder.outin, 
                            type: infoOldOrder.type, 
                            fundaID: infoOldOrder.funda, 
                            projectID: infoOldOrder.project, 
                            packageID: infoOldOrder.package, 
                            toPackageID: infoOldOrder.toPackage,
                            warehouseID: infoOldOrder.warehouse, 
                            toWarehouseID: infoOldOrder.toWarehouse, 
                            customerID: infoOldOrder.customer, 
                            contractID: infoOldOrder.contract, 
                            name: `Copy ${infoOldOrder.name}` 
                        })
                        // console.log(infoNewOrder)

                        if(infoNewOrder){
                            let listProduct = await STORE_ORDER_PRODUCT_COLL.find({order: orderID})
                            // console.log(listProduct)

                            for(const item of listProduct){
                                await STORE_ORDER_PRODUCT_MODEL.insert({
                                    userID, 
                                    fundaID: item.funda, 
                                    orderID: infoNewOrder.data._id, //
                                    accountID: item.account, 
                                    contraID: item.contra, 
                                    customerID: item.customer, 
                                    contractID: item.contract, 
                                    goodsID: item.goods, 
                                    assetsID: item.assets, 
                                    workID: item.budgetWork, //
                                    subtypeID: item.subtype, 
                                    name: item.name, 
                                    note: item.note, 
                                    quantity: item.quantity, 
                                    weight: item.weight, 
                                    unitPrice: item.unitPrice 
                                })
                            }

                            return resolve({ error: false, message: 'Sao chép thành công' })
                        }else{
                            return resolve({ error: false, message: 'Sao chép thành công' })
                        }
                    }else{
                        return resolve({ error: true, message: 'Sao chép thất bại' })
                    }
                }

                // TẠO BẢNG LƯƠNG CÁC CƠ SỞ THEO THÁNG
                else if(option == 5){
                    if(!infoAppUser.error && infoAppUser.data.level == 0){
                        // Danh sách Admin ứng dụng
                        let listAppUser = await AUTH__APP_USER.getList({
                            appID: "61e049cffdebf77b072d1b14",
                            companyID, 
                            level: 0,
                            select: 'user level'
                        })

                        function getLastDayOfMonth(year, month) {
                            return new Date(year, month, 0)
                        }

                        let listFunda = await ITEM__FUNDA_COLL.find({company: companyID})
                        
                        for(const item of listFunda){
                            let arrPermission = [userID]
                            if(checkObjectIDs(item.manager)){
                                arrPermission.push(item.manager)
                            }

                            if(!listAppUser.error){
                                arrPermission.push(...listAppUser.data.listRecords.map(item=>item.user))
                            }

                            // Kiểm tra xem bảng đã tồn tại hay chưa, nếu chưa thì tạo mới
                            let info = await TIMESHEET__EXPERT_SALARY_COLL.findOne({
                                company: ObjectID(companyID),
                                funda: ObjectID(item._id),
                                $where: `return this.date.getMonth() === ${Number(month - 1)} && this.date.getFullYear() === ${Number(year)}`,
                                parent: { $exists: false }
                            })
                            .select('name date funda')
                            // console.log(info)

                            if(!info){
                                let infoAfterInsert = await this.insertData({
                                    userCreate: userID, 
                                    company: companyID, 
                                    admins: arrPermission,
                                    members: arrPermission,
                                    name: `Bảng lương Cơ sở ${item.name} T${month}.${year}`, 
                                    namecv: stringUtils.removeAccents(`Bảng lương Cơ sở ${item.name} T${month}.${year}`), 
                                    date: getLastDayOfMonth(year, month), 
                                    type: 2, // Sản xuất
                                    assigneeID: userID, 
                                    funda: item._id, 
                                    project: item?.project
                                })

                                // console.log(infoAfterInsert)
                            }
                        }

                        return resolve({ error: false, message: 'Cập nhật thành công' })
                    }else{
                        return resolve({ error: true, message: 'Bạn không có quyền thực hiện' })
                    }
                }

                // THÊM NHÂN SỰ VÀO BẢNG LƯƠNG CƠ SỞ
                else if(option == 6){
                    let infoSalary = await TIMESHEET__EXPERT_SALARY_COLL.findById(salaryID)
                    if(infoSalary &&  infoSalary.status == 2)
                        return resolve({ error: true, message: 'Bảng lương đã khóa không thể cập nhật' })

                    // Chỉ áp dụng cho Bảng lương Trực tiếp
                    if(infoSalary.type == 2 && checkObjectIDs(infoSalary.funda)){
                        // console.log('==========111111111111111111')

                        let month = Number(infoSalary.date.getMonth()) + 1
                        let year = infoSalary.date.getFullYear()

                        let listData = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                            {
                                $match: {
                                    company: ObjectID(companyID),
                                    funda: ObjectID(infoSalary.funda),
                                    parent: { $exists: true, $ne: null },
                                    assignee: { $exists: true, $ne: null },
                                }
                            },
                            {
                                $project: {
                                    year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                    month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                    date: 1,
                                    assignee: 1,
                                    hours: 1,
                                    amount: 1,
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
                                    _id: { assignee: '$assignee' },
                                }
                            },
                        ])

                        let conditionPopulate = {
                            path: '_id.assignee',
                            select: '_id fullname department position',
                            model: 'user',
                        }
                        await TIMESHEET__EXPERT_TIMESHEET_COLL.populate(listData, conditionPopulate)

                        for(const item of listData){

                            // Kiểm tra xem nhân sự đã tồn tại chưa, chưa thì mới tạo
                            let info = await TIMESHEET__EXPERT_SALARY_COLL.findOne({
                                parent: ObjectID(salaryID),
                                human: item._id.assignee._id
                            })
                            .select('name date funda parent')
                            // console.log(info)

                            if(!info){
                                let dataInsertDetail = {
                                    company: infoSalary.company,
                                    userCreate: userID,
                                    name: 'Default',
                                    human: item._id.assignee._id,
                                    parent: salaryID, // Bảng lương cha
                                    project: item._id.assignee.department,
                                    position: item._id.assignee.position,
                                    date: infoSalary.date,
                                    type: infoSalary.type,
                                    funda: infoSalary.funda,
                                }
            
                                await this.insertData(dataInsertDetail)
                            }
                        }

                        // Cập nhật số nhân sự vào Bảng lương cha
                        await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndUpdate(salaryID, {
                            numberOfHuman: Number(listData.length)
                        }, { new: true })

                        return resolve({ error: false, message: 'Cập nhật thành công' })
                    }else{
                        return resolve({ error: true, message: 'Loại bảng lương này không thêm được Nhân sự cơ sở' })
                    }
                }

                // ĐỒNG BỘ BẢNG LƯƠNG TỔNG HỢP
                else if(option == 7){
                    if(!infoAppUser.error && infoAppUser.data.level == 0){
                        let infoSalary = await TIMESHEET__EXPERT_SALARY_COLL.findById(salaryID)
                        if(infoSalary && infoSalary.status == 2)
                            return resolve({ error: true, message: 'Bảng lương đã khóa không thể cập nhật' })

                        // Danh sách userID trong bảng lương
                        let listData = await TIMESHEET__EXPERT_SALARY_COLL.find({ parent: salaryID }).select('human')
                        let dataUser = listData.map(item=>item.human.toString())

                        // Cập nhật chấm công vào các Chi tiết của Bảng lương: OK
                        await that.updateValueTimesheet({ dataUser, expertSalaryID: salaryID, userID, companyID })

                        // Cập nhật KPI vào các chi tiết của Bảng lương
                        await that.updateValueKpi( { dataUser, expertSalaryID: salaryID, userID, companyID })

                        // Tổng hợp các chi tiết lương vào Bảng lương: 
                        await that.updateValue( { dataUser, expertSalaryID: salaryID, userID })

                        return resolve({ error: false, message: 'Đồng bộ thành công', status: 200 })
                    }else{
                        return resolve({ error: true, message: 'Bạn không có quyền thực hiện' })
                    }
                }

                // ĐỒNG BỘ BẢNG LƯƠNG THEO CƠ SỞ: ÁP DỤNG FNB_SHIFT/STORE_SHIFT
                else if(option == 8){
                    let infoSalary = await TIMESHEET__EXPERT_SALARY_COLL.findById(salaryID)
                    if(infoSalary &&  infoSalary.status == 2)
                        return resolve({ error: true, message: 'Bảng lương đã khóa không thể cập nhật' })
                    
                    // Chỉ áp dụng cho Bảng lương Trực tiếp
                    if(infoSalary.type == 2 && checkObjectIDs(infoSalary.funda)){
                        // console.log('==========111111111111111111')

                        // Danh sách userID trong bảng lương
                        let listData = await TIMESHEET__EXPERT_SALARY_COLL.find({ parent: salaryID }).select('human')
                        let dataUser = listData.map(item=>item.human.toString())

                        /**
                         * Cập nhật chấm công vào các Chi tiết của Bảng lương:
                         * - Tách chính thức
                         * - Tách thử việc
                         */
                        await that.updateValueFundaTimesheet({ dataUser, expertSalaryID: salaryID, userID, companyID })

                        // Cập nhật KPI vào các chi tiết của Bảng lương
                        await that.updateValueKpi( { dataUser, expertSalaryID: salaryID, userID, companyID })

                        // Cập nhật Thưởng doanh số vào các chi tiết của Bảng lương
                        await that.updateRevenueKpi( { dataUser, expertSalaryID: salaryID, userID, companyID })

                        // Tổng hợp các chi tiết lương vào Bảng lương: 
                        await that.updateValue( { dataUser, expertSalaryID: salaryID, userID })

                        return resolve({ error: false, message: 'Cập nhật thành công' })
                    }else{
                        return resolve({ error: true, message: 'Loại bảng lương này không Đồng bộ được theo cơ sở' })
                    }
                }
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 })
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
                    let info = await TIMESHEET__EXPERT_SALARY_COLL.findById(arraysRemove[0])

                    const result = await TIMESHEET__EXPERT_SALARY_COLL.deleteMany({
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
                        let numberOfHuman = await TIMESHEET__EXPERT_SALARY_COLL.count({parent: info?.parent})
                        if(numberOfHuman){
                            await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndUpdate(info?.parent, {
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
    getInfo({ expertSalaryID, userID, select, populates }) {
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

                let infoAterGet = await TIMESHEET__EXPERT_SALARY_COLL.findById(expertSalaryID)
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
    getList({
        subtype, salary, onLeaveSalary, overtimeSalary, mealAllowance, punishment, option, sortOption, parentID, userID,
        keyword, limit = 10, lastestID, select, populates= {}, companyID, positionsID, departmentsID, month, year }) {
        return new Promise(async (resolve) => {
            try {
                // Record Traffic
                // await ctx.call(`${CF_DOMAIN_SERVICES.ANALYSIS}.${CF_ACTIONS_ANALYSIS.HISTORY_TRAFFIC_INSERT}`, dataTF)

                let getInfoUserApp = await AUTH__APP_USER.checkPermissionsAccessApp({
                    appID: "61e049cffdebf77b072d1b14",
                    userID
                })

                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = {};
                let nextCursor	= null;
                let sortBy      = null;
                let keys	 = ['project__1', '_id__1'];
                // let keys	 = ['createAt__1', '_id__1'];

                if(sortOption == 1){
                    keys	 = ['date__-1', '_id__-1'];
                }

                const validation = validateParamsObjectID({
                    positionsID           : { value: positionsID, isRequire: false },
                    departmentsID         : { value: departmentsID, isRequire: false },
                })
                if(validation.error) return resolve(validation);

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

				if(checkObjectIDs(parentID)){                    
                    let infoParent = await TIMESHEET__EXPERT_SALARY_COLL.findById(parentID)
                    let checkPermission = 1 // Không có quyền
                    let getInfoUserApp = await AUTH__APP_USER.checkPermissionsAccessApp({
                        appID: "61e049cffdebf77b072d1b14",
                        userID
                    })
                    if(infoParent.userCreate.toString() === userID.toString()){
                        checkPermission = Number(checkPermission) + 1
                    }
                    if(infoParent.admins.includes(userID)){
                        checkPermission = Number(checkPermission) + 1
                    }
                    if(infoParent.members.includes(userID)){
                        checkPermission = Number(checkPermission) + 1
                    }
                    if((!getInfoUserApp.error && Number(getInfoUserApp.data.level) == 0)){
                        checkPermission = Number(checkPermission) + 1
                    }

                    if(checkPermission >= 2){

                        conditionObj.parent = parentID

                        // Lọc dữ liệu
                        if(subtype && Number(subtype) > 1){
                            conditionObj.subtype = Number(subtype)
                        }

                        if(salary && Number(salary) === 1){
                            conditionObj.salary = {$gt: 0}
                        }
                        if(salary && Number(salary) === 2){
                            conditionObj.salary = 0
                        }

                        if(onLeaveSalary && Number(onLeaveSalary) === 1){
                            conditionObj.onLeaveSalary = {$gt: 0}
                        }
                        if(onLeaveSalary && Number(onLeaveSalary) === 2){
                            conditionObj.onLeaveSalary = 0
                        }

                        if(overtimeSalary && Number(overtimeSalary) === 1){
                            conditionObj.overtimeSalary = {$gt: 0}
                        }
                        if(overtimeSalary && Number(overtimeSalary) === 2){
                            conditionObj.overtimeSalary = 0
                        }

                        if(mealAllowance && Number(mealAllowance) === 1){
                            conditionObj.mealAllowance = {$gt: 0}
                        }
                        if(mealAllowance && Number(mealAllowance) === 2){
                            conditionObj.mealAllowance = 0
                        }

                        if(punishment && Number(punishment) === 1){
                            conditionObj.punishment = {$gt: 0}
                        }
                        if(punishment && Number(punishment) === 2){
                            conditionObj.punishment = 0
                        }

                        if(departmentsID && departmentsID.length){
                            conditionObj.project = { $in: departmentsID }
                        }

                        if(positionsID && positionsID.length){
                            conditionObj.position = { $in: positionsID }
                        }

                        if(keyword){
                            keyword = keyword.split(" ");
                            keyword = '.*' + keyword.join(".*") + '.*';

                            let listUser = await AUTH__USER_COLL.find({company:companyID, fullname: new RegExp(keyword, 'i')})
                            .select('_id fullname')
                            .limit(20)

                            conditionObj.human = {$in: listUser.map(item=>item._id)}
                        }
                    }else{
                        // Trả về dữ liệu rỗng (BE)
                        conditionObj.company = { $exists: false } 
                    }
				}else{
                    if(!getInfoUserApp.error && Number(getInfoUserApp.data.level) == 0){
                        conditionObj.company = companyID
                        conditionObj.parent = { $exists: false }
                    }else{
                        conditionObj.$or = [
                            {admins: { $in: [userID] }},
                            {members: { $in: [userID] }}
                        ]
                        conditionObj.company = companyID
                        conditionObj.parent = { $exists: false }
                    }

                    // Bảng lương theo tháng, năm
                    if(month && year){
                        conditionObj.$where = `return this.date.getMonth() === ${Number(month - 1)} && this.date.getFullYear() === ${Number(year)}`
                    }

                    if(keyword){
                        keyword = stringUtils.removeAccents(keyword)
                        keyword = keyword.split(" ");
                        keyword = '.*' + keyword.join(".*") + '.*';
                        const regSearch = new RegExp(keyword, 'i');
                        conditionObj.namecv = regSearch
                    }
                }

                /**
                 * Phiếu lương của userID đang truy cập
                 */
                if(option && option == 1){
                    conditionObj.human = userID
                    conditionObj.parent = { $exists: true, $ne: null }
                    delete conditionObj.$or;
                }

                let conditionObjOrg = { ...conditionObj }

				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await TIMESHEET__EXPERT_SALARY_COLL.findById(lastestID);
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

                let infoDataAfterGet = await TIMESHEET__EXPERT_SALARY_COLL.find(conditionObj)
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

                let totalRecord = await TIMESHEET__EXPERT_SALARY_COLL.count(conditionObjOrg);
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
        console.log({ userID, option, year, month, companyID, projectID, assigneeID })
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

                    let listData = await TIMESHEET__EXPERT_SALARY_COLL.aggregate([
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

                    let listData = await TIMESHEET__EXPERT_SALARY_COLL.aggregate([
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

                    let listData = await TIMESHEET__EXPERT_SALARY_COLL.aggregate([
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

                    let listData1 = await TIMESHEET__EXPERT_SALARY_COLL.aggregate([
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
                        await TIMESHEET__EXPERT_SALARY_COLL.populate(listData1, conditionPopulate1)
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

                    let listData1 = await TIMESHEET__EXPERT_SALARY_COLL.aggregate([
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
                        await TIMESHEET__EXPERT_SALARY_COLL.populate(listData1, conditionPopulate1)
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

                    let listData1 = await TIMESHEET__EXPERT_SALARY_COLL.aggregate([
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
                        await TIMESHEET__EXPERT_SALARY_COLL.populate(listData1, conditionPopulate1)
                    }

                    return resolve({ error: false, data: listData1 })
                }

                // Tổng hợp toàn bộ của 1 nhân sự
                else if(option == 6){

                    let conditionObj = {
                        human: ObjectID(assigneeID),
                        parent: { $exists: true, $ne: null }
                    }

                    let listData = await TIMESHEET__EXPERT_SALARY_COLL.aggregate([
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

                    let rawData = await TIMESHEET__EXPERT_SALARY_COLL.aggregate([
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
                        await TIMESHEET__EXPERT_SALARY_COLL.populate(rawData, conditionPopulate1)
                    }

                    let rawData2 = await TIMESHEET__EXPERT_SALARY_COLL.aggregate([
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
                        await TIMESHEET__EXPERT_SALARY_COLL.populate(rawData2, conditionPopulate2)

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
                let listData2 = await TIMESHEET__EXPERT_SALARY_COLL.aggregate([
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

                let rawData = await TIMESHEET__EXPERT_SALARY_COLL.aggregate([
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
                    await TIMESHEET__EXPERT_SALARY_COLL.populate(rawData, conditionPopulate1)
                }

                let rawData2 = await TIMESHEET__EXPERT_SALARY_COLL.aggregate([
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
                    await TIMESHEET__EXPERT_SALARY_COLL.populate(rawData2, conditionPopulate2)

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
                            workbook.sheet('TongHop').row(2).cell(i).value(`${item._id.funda.name}`)
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