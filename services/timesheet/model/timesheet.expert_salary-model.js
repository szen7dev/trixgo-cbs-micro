"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const ObjectID                          = require('mongoose').Types.ObjectId;

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
const { SALARY_RESET_PERMISSION }       = require('../helper/timesheet.keys-constant')

/**
 * COLLECTIONS
 */
const TIMESHEET__EXPERT_SALARY_COLL     = require('../database/timesheet.expert_salary-coll')
const TIMESHEET__EXPERT_TIMESHEET_COLL  = require('../database/timesheet.expert_timesheet-coll')
const AUTH__USER_COLL                   = require('../../auth/database/auth.user-coll')
const FNB_MISTAKE_COLL                  = require('../../fnb/database/fnb.mistake-coll')
const ITEM__DEPARTMENT_COLL             = require('../../item/database/item.department-coll');
const e = require('express');
// const AUTH__COMPANY_COLL                = require('../../auth/database/auth.company-coll')

const AUTH__APP_USER = require('../../auth/model/auth.app_users').MODEL

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
        // console.log({ userCreate, companyID, projectID, humanID, name, date, type, note, salary, onLeaveSalary, overtimeSalary, reward, punishment, advance, convertFactor, paid })
        return new Promise(async resolve => {
            try {
                if(!name){
                    return resolve({
                        error: true,
                        message: "Name invalid",
                        keyError: "name_invalid",
                    });
                }

                // let year = new Date(date).getFullYear()
                // let month = new Date(date).getMonth()
                // let checkExists = await TIMESHEET__EXPERT_SALARY_COLL.findOne({
                //     company: companyID,
                //     parent: { $exists: false },
                //     $where:
                //     `return this.date.getMonth() === ${Number(month)} && this.date.getFullYear() === ${Number(year)}`
                // })
                // if(checkExists)
                //     return resolve({ error: true, message: `Bảng lương tháng ${month + 1} năm ${year} đã tồn tại - ${checkExists.name}` })

                //__________Khai báo và validate dữ liệu
                let dataInsert = {
                    company: companyID,
                    userCreate,
                    name,
                    admins: [userCreate],
                    members: [userCreate]
                }

                if(humanID){
                    dataInsert.human = humanID;
                }

                if(projectID){
                    dataInsert.project = projectID;
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
                            if(contact.company.toString() === companyID.toString()){
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
    update({ expertSalaryID, admins, members, userID, status, projectID, humanID, name, date, note, salary, onLeaveSalary, overtimeSalary, reward, punishment, advance, convertFactor, paid, revenueBonus, mealAllowance, insurance, pitax, union, share, other, kpiFactor, subAllowance1, subAllowance2, subAllowance3, subAllowance4, subAllowance5, subAllowance6, subAllowance7, subAllowance8, subAllowance9, subAllowance10, subAllowance11, subAllowance12, subAllowance13, subAllowance14, subAllowance15, subAllowance16, subAllowance17, subAllowance18, subAllowance19, subAllowance20, subAllowance21, subAllowance22 }){
        // console.log({ expertSalaryID, admins, members, userID, status, projectID, humanID, name, date, note, salary, onLeaveSalary, overtimeSalary, reward, punishment, advance, convertFactor, paid, revenueBonus, mealAllowance, insurance, pitax, union, share, other, kpiFactor, subAllowance1, subAllowance2, subAllowance3, subAllowance4, subAllowance5, subAllowance6, subAllowance7, subAllowance8, subAllowance9, subAllowance10, subAllowance11, subAllowance12, subAllowance13, subAllowance14, subAllowance15, subAllowance16, subAllowance17, subAllowance18, subAllowance19, subAllowance20, subAllowance21, subAllowance22 })
        return new Promise(async (resolve) => {
            const that = this
            try {
                let infoSalary = await TIMESHEET__EXPERT_SALARY_COLL.findById(expertSalaryID)
                if(!infoSalary) {
                    return resolve({
                        error: true,
                        message: 'Timesheet không tồn tại',
                        keyError: "timesheet_not_exists",
                        status: 400
                    })
                }

                let dataUpdate = {
                    userUpdate: userID,
                    modifyAt: Date.now(),
                }

                if(checkObjectIDs(projectID)){
                    dataUpdate.project = projectID;
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
                    dataUpdate.status = status;
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

                if(subAllowance1){
                    dataUpdate.subAllowance1 = Number(subAllowance1);
                }
                if(subAllowance2){
                    dataUpdate.subAllowance2 = Number(subAllowance2);
                }
                if(subAllowance3){
                    dataUpdate.subAllowance3 = Number(subAllowance3);
                }
                if(subAllowance4){
                    dataUpdate.subAllowance4 = Number(subAllowance4);
                }
                if(subAllowance5){
                    dataUpdate.subAllowance5 = Number(subAllowance5);
                }
                if(subAllowance6){
                    dataUpdate.subAllowance6 = Number(subAllowance6);
                }
                if(subAllowance7){
                    dataUpdate.subAllowance7 = Number(subAllowance7);
                }
                if(subAllowance8){
                    dataUpdate.subAllowance8 = Number(subAllowance8);
                }
                if(subAllowance9){
                    dataUpdate.subAllowance9 = Number(subAllowance9);
                }
                if(subAllowance10){
                    dataUpdate.subAllowance10 = Number(subAllowance10);
                }
                if(subAllowance11){
                    dataUpdate.subAllowance11 = Number(subAllowance11);
                }
                if(subAllowance12){
                    dataUpdate.subAllowance12 = Number(subAllowance12);
                }
                if(subAllowance13){
                    dataUpdate.subAllowance13 = Number(subAllowance13);
                }
                if(subAllowance14){
                    dataUpdate.subAllowance14 = Number(subAllowance14);
                }
                if(subAllowance15){
                    dataUpdate.subAllowance15 = Number(subAllowance15);
                }
                if(subAllowance16){
                    dataUpdate.subAllowance16 = Number(subAllowance16);
                }
                if(subAllowance17){
                    dataUpdate.subAllowance17 = Number(subAllowance17);
                }
                if(subAllowance18){
                    dataUpdate.subAllowance18 = Number(subAllowance18);
                }
                if(subAllowance19){
                    dataUpdate.subAllowance19 = Number(subAllowance19);
                }
                if(subAllowance20){
                    dataUpdate.subAllowance20 = Number(subAllowance20);
                }
                if(subAllowance21){
                    dataUpdate.subAllowance21 = Number(subAllowance21);
                }
                if(subAllowance22){
                    dataUpdate.subAllowance22 = Number(subAllowance22);
                }

                if(!isNaN(salary) && Number(infoSalary.salary) != Number(salary)){
                    dataUpdate.salary = salary;
                }
                if(!isNaN(onLeaveSalary) && Number(infoSalary.onLeaveSalary) != Number(onLeaveSalary)){
                    dataUpdate.onLeaveSalary = onLeaveSalary;
                }
                if(!isNaN(overtimeSalary) && Number(infoSalary.overtimeSalary) != Number(overtimeSalary)){
                    dataUpdate.overtimeSalary = overtimeSalary;
                }

                if(!isNaN(reward) && Number(infoSalary.reward) != Number(reward)){
                    dataUpdate.reward = reward;
                }
                if(!isNaN(revenueBonus) && Number(infoSalary.revenueBonus) != Number(revenueBonus)){
                    dataUpdate.revenueBonus = revenueBonus;
                }
                if(!isNaN(punishment) && Number(infoSalary.punishment) != Number(punishment)){
                    dataUpdate.punishment = punishment;
                }
                if(!isNaN(mealAllowance) && Number(infoSalary.mealAllowance) != Number(mealAllowance)){
                    dataUpdate.mealAllowance = mealAllowance;
                }
                if(!isNaN(insurance) && Number(infoSalary.insurance) != Number(insurance)){
                    dataUpdate.insurance = insurance;
                }
                if(!isNaN(pitax) && Number(infoSalary.pitax) != Number(pitax)){
                    dataUpdate.pitax = pitax;
                }
                if(!isNaN(union) && Number(infoSalary.union) != Number(union)){
                    dataUpdate.union = union;
                }
                if(!isNaN(share) && Number(infoSalary.share) != Number(share)){
                    dataUpdate.share = share;
                }
                if(!isNaN(other) && Number(infoSalary.other) != Number(other)){
                    dataUpdate.other = other;
                }
                if(!isNaN(advance) && Number(infoSalary.advance) != Number(advance)){
                    dataUpdate.advance = advance;
                }
                if(!isNaN(paid) && Number(infoSalary.paid) != Number(paid)){
                    dataUpdate.paid = paid;
                }

                // Tính toán giá trị còn lại
                if(!isNaN(salary) || !isNaN(onLeaveSalary) || !isNaN(overtimeSalary) || !isNaN(reward) || !isNaN(revenueBonus) || !isNaN(mealAllowance) || !isNaN(punishment) || !isNaN(insurance) || !isNaN(pitax) || !isNaN(advance) || !isNaN(paid)){
                    dataUpdate.remaining = Number(Number(salary * kpiFactor) + Number(onLeaveSalary) + Number(overtimeSalary) + Number(reward) + Number(revenueBonus) + Number(mealAllowance) - Number(punishment) - Number(insurance) - Number(pitax) - Number(union) - Number(share) - Number(other) - Number(advance) - Number(paid)).toFixed(0)
                }
                // console.log(dataUpdate)

                // Kiểm tra quyền cập nhật
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
                    // console.log('555555555555555555555555555')
                    // console.log( {date: infoAfterUpdate.date})

                    // Cập nhật số nhân sự bảng lương
                    let numberOfHuman = await TIMESHEET__EXPERT_SALARY_COLL.count({parent: expertSalaryID})
                    if(numberOfHuman){
                        await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndUpdate(expertSalaryID, {
                            userUpdate: userID,
                            modifyAt: Date.now(),
                            numberOfHuman
                        }, { new: true })
                    }

                    // // Cập nhật hệ số chuyển đổi vào Chi tiết lương
                    // if(convertFactor){
                    //     await TIMESHEET__EXPERT_SALARY_COLL.updateMany({parent: expertSalaryID},{$set: {convertFactor: convertFactor}})
                    // }

                    // Cập nhật ngày tháng
                    await TIMESHEET__EXPERT_SALARY_COLL.updateMany({parent: expertSalaryID},{$set: {
                        date: infoAfterUpdate.date,
                        userUpdate: userID,
                        modifyAt: Date.now()
                    }})
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
        return new Promise(async (resolve) => {
            try {
                let infoSalary = await TIMESHEET__EXPERT_SALARY_COLL.findById(expertSalaryID)
                if(!infoSalary)
                    return resolve({ error: true, message: "can't_get_info", status: 403 });

                let month = Number(infoSalary.date.getMonth()) + 1
                let year = infoSalary.date.getFullYear()

                // console.log({month,year})

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
                            // year : {$year : "$date"},
                            // month : {$month : "$date"},
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
                            // year : {$year : "$date"},
                            // month : {$month : "$date"},
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
                            // year : {$year : "$date"},
                            // month : {$month : "$date"},
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
                // console.log(listData3)

                let arr1 = [], arr2 = [], arr3 = []
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

                // console.log(arr1)
                // console.log(arr2)
                // console.log(arr3)

                for(const item of dataUser){
                    let hours1 = 0, hours2 = 0, hours3 = 0, salary = 0, onLeaveSalary = 0, overtimeSalary = 0, reward = 0, revenueBonus = 0, mealAllowance = 0, punishment = 0, insurance = 0, pitax = 0, union = 0, share = 0, other = 0, advance  = 0, paid = 0, remaining = 0, kpiFactor = 1
                    
                    let info = await TIMESHEET__EXPERT_SALARY_COLL.findOne({
                        parent: expertSalaryID,
                        human: item,
                    })

                    if(info){
                        if(arr1[item]){
                            hours1 = Number(arr1[item][0].quantity).toFixed(2)
                            salary = Number(arr1[item][0].amount).toFixed(0)
                        }

                        if(arr2[item]){
                            hours2 = Number(arr2[item][0].quantity).toFixed(2)
                            onLeaveSalary = Number(arr2[item][0].amount).toFixed(0)
                        }

                        if(arr3[item]){
                            hours3 = Number(arr3[item][0].quantity).toFixed(2)
                            overtimeSalary = Number(arr3[item][0].amount).toFixed(0)
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
              
                return resolve({ error: false, status: 200 });
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
    updateValueKpi({ dataUser, expertSalaryID, userID, companyID }){
        return new Promise(async (resolve) => {
            try {
                let infoSalary = await TIMESHEET__EXPERT_SALARY_COLL.findById(expertSalaryID)
                if(!infoSalary)
                    return resolve({ error: true, message: "can't_get_info", status: 403 })

                let month = Number(infoSalary.date.getMonth()) + 1
                let year = infoSalary.date.getFullYear()

                // Danh sách phân loại lỗi theo nhân sự
                let listData = await FNB_MISTAKE_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            executor: { $exists: true, $ne: null }
                        }
                    },
                    {
                        $project: {
                            // year : {$year : "$createAt"},
                            // month : {$month : "$createAt"},
                            year : {$year: { date: "$createAt", timezone: "Asia/Ho_Chi_Minh" }},
                            month : {$month: { date: "$createAt", timezone: "Asia/Ho_Chi_Minh" }},
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
                            reward = Number(arr[item][0].bonus) * info.convertFactor
                            punishment = Number(arr[item][0].amount) * info.convertFactor
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
                // console.log(listData[0])

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
    syncData({
        companyID, userID, email, option, salaryID, arrUser
    }){
        // console.log({companyID, userID, email, option, salaryID})
        const that = this
        return new Promise(async (resolve) => {
            try {
                //___________Quyền truy cập ứng dụng
                let infoAppUser = await AUTH__APP_USER.checkPermissionsAccessApp({
                    appID: "61e049cffdebf77b072d1b14",
                    userID
                })

                if(!infoAppUser.error && infoAppUser.data.level == 0){

                    /**
                     * CẬP NHẬT NHÂN SỰ
                     */
                    if(option == 1){
                        if(SALARY_RESET_PERMISSION.includes(email)){
                            
                            let infoSalary = await TIMESHEET__EXPERT_SALARY_COLL.findById(salaryID)

                            // let yearFilter = new Date(infoSalary.date).getFullYear()
                            // let monthFilter = new Date(infoSalary.date).getMonth() + 1

                            // let listData = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                            //     {
                            //         $match: {
                            //             company: ObjectID(companyID),
                            //             parent: {$exists: true, $ne: null},
                            //             assignee: {$exists: true, $ne: null},
                            //             amount: {$gt: 0},
                            //         }
                            //     },
                            //     {
                            //         $project: {
                            //             year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            //             month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            //             amount: 1,
                            //             date: 1,
                            //             assignee: 1
                            //         }
                            //     },
                            //     {
                            //         $match: {
                            //             year: Number(yearFilter),
                            //             month: Number(monthFilter),
                            //         }
                            //     },
                            //     {
                            //         $group: {
                            //             _id: { assignee: '$assignee' },
                            //         }
                            //     },
                            // ])

                            let listData2 = await TIMESHEET__EXPERT_SALARY_COLL.find({parent: salaryID}).select('human')
                            // console.log(yearFilter)
                            // console.log(monthFilter)

                            let A = [] 
                            if(arrUser && arrUser.length){
                                A = arrUser.map(item=>item.toString())
                            }
                            
                            // else{
                            //     A = listData.map(item=>item._id.assignee.toString())
                            // }

                            let B = listData2.map(item=>item.human.toString())
                            // console.log(A)
                            // console.log(B )

                            // Lấy các phần tử trong A nhưng không có trong B
                            const result = A.filter(item => !B.includes(item));
                            // console.log(result);

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
                        }else{
                            return resolve({ error: true, message: 'Bạn không có quyền cập nhật' })
                        }
                    }
                    
                    /**
                     * ĐỒNG BỘ BẢNG LƯƠNG
                     */
                    else if(option == 2){
                        // Danh sách userID trong bảng lương
                        let listData = await TIMESHEET__EXPERT_SALARY_COLL.find({ parent: salaryID }).select('human')
                        let dataUser = listData.map(item=>item.human.toString())

                        // console.log(listData)
                        // console.log(dataUser)

                        // Cập nhật chấm công vào các Chi tiết của Bảng lương: OK
                        await that.updateValueTimesheet({ dataUser, expertSalaryID: salaryID, userID, companyID })

                        // Cập nhật KPI vào các chi tiết của Bảng lương
                        await that.updateValueKpi( { dataUser, expertSalaryID: salaryID, userID, companyID })

                        // Tổng hợp các chi tiết lương vào Bảng lương: 
                        await that.updateValue( { dataUser, expertSalaryID: salaryID, userID })

                        return resolve({ error: false, message: 'Đồng bộ thành công', status: 200 })
                    }
                    
                    /**
                     * XÓA BẢNG LƯƠNG: TẠM KHÓA CHỨC NĂNG NÀY
                     */
                    // else if(option == 3){
                    //     // Chỉ admin ứng dụng mới được thêm phần tử cha con
                    //     if(SALARY_RESET_PERMISSION.includes(email)){
                    //         await TIMESHEET__EXPERT_SALARY_COLL.deleteMany({parent: salaryID})
                    //         await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndDelete(salaryID);
                    //         return resolve({ error: false, data: 'Reset thành công' })
                    //     }else{
                    //         return resolve({ error: true, message: 'Bạn không có quyền Reset' })
                    //     }
                    // }

                    /* COPY BẢNG LƯƠNG SANG BẢNG LƯƠNG MỚI
                    */
                    else if(option == 4){
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
                            name: 'New of copy from ...',
                            namecv: 'New of copy from ...',
                            admins: [userID],
                            members: [userID]
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
                       }
                   }

                }else{
                    return resolve({ error: false, data: 'Bạn không có quyền thực hiện' })
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
                // Record Traffic
                // await ctx.call(`${CF_DOMAIN_SERVICES.ANALYSIS}.${CF_ACTIONS_ANALYSIS.HISTORY_TRAFFIC_INSERT}`, dataTF)

                // let getInfoUserApp = await AUTH__APP_USER.checkPermissionsAccessApp({
                //     appID: "61e049cffdebf77b072d1b14",
                //     userID
                // })
                
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
        keyword, limit = 10, lastestID, select, populates= {}, companyID, positionsID, departmentsID }) {
        // console.log({option, sortOption, parentID, userID, keyword, limit, lastestID, select, populates, companyID, positionsID, departmentsID })
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
                }
                // console.log(conditionObj)

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
                // sortBy      = { project: 1 };
                // console.log({sortBy})

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
    getListByProperty({ userID, option, year, month, companyID, projectID, assigneeID, ctx }){
        // console.log({ userID, option, year, companyID, assigneeID })
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
                        parent: { $exists: true, $ne: null }
                    }

                    let listData = await TIMESHEET__EXPERT_SALARY_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project: {
                                year : {$year : "$date"},
                                month : {$month : "$date"},
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
                                remaining: 1
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
                                year : {$year : "$date"},
                                month : {$month : "$date"},
                                // examTotal: { $sum: [ "$salary","$reward","-$punishment" ] },
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
                                remaining: 1
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
                                year : {$year : "$date"},
                                month : {$month : "$date"},
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
                                remaining: 1
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
                                year : {$year : "$date"},
                                month : {$month : "$date"},
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
                                remaining: 1
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
                                year : {$year : "$date"},
                                month : {$month : "$date"},
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
                                remaining: 1
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
                                year : {$year : "$date"},
                                month : {$month : "$date"},
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
                                remaining: 1
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
                                year : {$year : "$date"},
                                month : {$month : "$date"},
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
                                remaining: 1
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
}

exports.MODEL = new Model