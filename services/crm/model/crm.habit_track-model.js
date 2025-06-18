"use strict";

const BaseModel                         = require('../../../tools/db/base_model.js');
const ObjectID                          = require('mongoose').Types.ObjectId;
const XlsxPopulate                      = require('xlsx-populate')
const fs                                = require('fs')
const path                              = require('path')
const moment                            = require('moment');
const { uploadFileS3 }                  = require('../../../tools/s3/index.js')

/**
 * DOMAIN AND ACTIONS
 */
// const { CF_DOMAIN_SERVICES } 		            = require('../../gateway/helper/domain.constant');
// const { CF_ACTIONS_ANALYSIS }                   = require('../../analysis/helper/analysis.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index')
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils.js')
const stringUtils					    = require('../../../tools/utils/string_utils.js')

/**
 * COLLECTIONS
 */
const AUTH__USER_COLL                   = require('../../auth/database/auth.user-coll.js')
const ITEM__CONTACT_COLL                = require('../../item/database/item.contact-coll')
const CRM_HABIT_COLL                    = require('../database/crm.habit-coll')
const CRM_HABIT_TRACK_COLL              = require('../database/crm.habit_track-coll')

class Model extends BaseModel {

    constructor() {
        super(CRM_HABIT_TRACK_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 22/11/2023
     */
    insert({ userID, companyID, habitID, contactID, status, date, name, note, duration, resultType, percentage }) {
        return new Promise(async resolve => {
            try {
                let infoHabit = await CRM_HABIT_COLL.findById(habitID)
                if(!infoHabit)
                    return resolve({ error: true, message: "Habit không hợp lệ", keyError: "Request params name invalid" })

                if(!date)
                    return resolve({ error: true, message: "Ngày thực hiện không hợp lệ", keyError: "Request params name invalid" })

                const formattedDate = new Date(date);
                let condition = {
                    habit: habitID,
                    date: formattedDate,
                    contact: infoHabit.contact
                }

                if(checkObjectIDs(contactID)){
                    condition.contact = contactID
                }
                
                let infoTrack = await CRM_HABIT_TRACK_COLL.findOne(condition)
                if(!infoTrack){
                    let dataInsert = {
                        userCreate: userID, 
                        company: companyID,
                        habit: habitID,
                        type: infoHabit.type,
                        contact: infoHabit.contact,
                        habitCate: infoHabit.habitCate,
                    }

                    if(checkObjectIDs(contactID)){
                        dataInsert.contact = contactID
                    }
    
                    if(name && name != ""){
                        dataInsert.name = name;
                    }
        
                    if(note && note != ""){
                        dataInsert.note = note;
                    }
        
                    if(date && date != ""){
                        dataInsert.date = date;
                    }
    
                    if (!isNaN(status)) {
                        dataInsert.status = Number(status)
                    }

                    if (!isNaN(percentage)) {
                        dataInsert.percentage = Number(percentage)
                    }
        
                    if (!isNaN(duration)) {
                        dataInsert.duration = Number(duration)
                    }

                    if (!isNaN(resultType)) {
                        dataInsert.resultType = Number(resultType)
                    }
                    // console.log({dataInsert})
    
                    let infoAfterInsert = await this.insertData(dataInsert)
                    if(!infoAfterInsert)
                        return resolve({ error: true, message: "cannot_insert" })
    
                    return resolve({ error: false, data: infoAfterInsert })
                }else{
                    return resolve({ error: true, message: "Mẫu tin đã tồn tại" })
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
    update({ trackID, userID, status, name, note, duration, resultType, percentage, imagesID }){
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
                }

                if (!isNaN(status)) {
                    dataUpdate.status = Number(status)
                }

                if (!isNaN(percentage)) {
                    dataUpdate.percentage = Number(percentage)
                }

                if(name && name != ""){
                    dataUpdate.name = name;
                }
    
                if(note && note != ""){
                    dataUpdate.note = note;
                }

                if (!isNaN(duration)) {
                    dataUpdate.duration = Number(duration)
                }

                if (!isNaN(resultType)) {
                    dataUpdate.resultType = Number(resultType)
                }                
                // console.log({dataUpdate})

                let infoAfterUpdate = await CRM_HABIT_TRACK_COLL.findByIdAndUpdate(trackID, dataUpdate, { new: true })
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
     * Name: Update
     * Author: HiepNH
     * Code: 22/11/2023
     */
    updateByDay({ companyID, userID, habitID, date, status, resultType, percentage }){
        return new Promise(async (resolve) => {
            try {
                let infoHabit = await CRM_HABIT_COLL.findById(habitID)
                if(!infoHabit)
                    return resolve({ error: true, message: "Habit không hợp lệ", keyError: "Request params name invalid" })

                const formattedDate = new Date(date);
                let condition = {
                    habit: habitID,
                    contact: infoHabit.contact,
                    date: formattedDate,
                }

                let infoTrack = await CRM_HABIT_TRACK_COLL.findOne(condition)
                // console.log(infoTrack)

                // Tạo mới
                if(!infoTrack){
                    // console.log('Chưa tồn tại mẩu tin==============')

                    let dataInsert = {
                        userCreate: userID, 
                        company: companyID,
                        habit: habitID,
                        contact: infoHabit.contact,
                        date: formattedDate,
                        status, 
                        resultType, 
                        duration: infoHabit.duration,
                        habitCate: infoHabit.habitCate
                    }

                    if(status == 2){
                        dataInsert.percentage = 100
                    }else{
                        dataInsert.percentage = 0
                    }

                    let infoAfterInsert = await this.insertData(dataInsert)
                    // console.log(infoAfterInsert)

                    if(!infoAfterInsert)
                        return resolve({ error: true, message: "cannot_insert" })

                    return resolve({ error: false, data: infoAfterInsert })
                }
                
                // Cập nhật
                else{
                    // console.log('Đã tồn tại mẩu tin==============')

                    let dataUpdate = {
                        userUpdate: userID,
                        modifyAt: Date.now(),
                        date: formattedDate,
                        status, 
                        resultType,
                    }

                    if(status == 2){
                        dataUpdate.percentage = 100
                    }else{
                        dataUpdate.percentage = 0
                    }

                    let infoAfterUpdate = await CRM_HABIT_TRACK_COLL.findByIdAndUpdate(infoTrack._id, dataUpdate, { new: true })
                    //  console.log(infoAfterUpdate)

                    if(!infoAfterUpdate) {
                        return resolve({
                            error: true,
                            message: "Cannot update",
                            keyError: "cannot_update",
                        })
                    }

                    return resolve({ error: false, data: infoAfterUpdate })
                }
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: updateMany
     * Author: HiepNH
     * Code: 27/3/2025
     */
    updateMany({ companyID, userID, commonHabitID, date, contactID, tracks }){
        // console.log({companyID, userID, commonHabitID, date, contactID, tracks})
        const that = this
        return new Promise(async (resolve) => {
            try {
                if(tracks && tracks.length){
                    let commonHabitTrackID

                    // Tạo Track cho Parent trước: nếu chưa tồn tại
                    const formattedDate = new Date(date);
                    let condition = {
                        habit: commonHabitID,
                        date: formattedDate,
                        contact: contactID
                    }
                    // console.log(condition)
                    
                    // Tạo track cho Habit cha
                    let infoTrack = await CRM_HABIT_TRACK_COLL.findOne(condition)
                    // console.log(infoTrack)
                    if(!infoTrack){
                        let infocommonHabitTrack = await that.insert({ userID, companyID, habitID: commonHabitID, contactID, date, name: 'HABIT TỔNG HỢP' })
                        if(infocommonHabitTrack){
                            // console.log('Habit track cha chưa tồn tại')
                            commonHabitTrackID = infocommonHabitTrack.data._id
                        }
                    }else{
                        // console.log('Habit track cha đã tồn tại')
                        commonHabitTrackID = infoTrack._id
                    }
                    // console.log({commonHabitTrackID})
                    // console.log('=======================')

                    // Cập nhật cho Habit thành phần
                    let checkStatusAll = 0
                    for(const item of tracks){
                        let percentage = 0
                        
                        if(Number(item.status) === 1){
                            checkStatusAll++
                        }else{
                            percentage = 100
                        }

                        // Cập nhật
                        if(item.trackID && checkObjectIDs(item.trackID)){
                            // console.log('1111111111111111')
                            let info1 = await that.update({
                                userID,
                                trackID: item.trackID, 
                                status: item.status, 
                                name: item.name, 
                                note: item.note, 
                                duration: item.duration,
                                percentage: percentage,
                            })
                            // console.log(info1)
                        }

                        // Tạo mới
                        else{
                            // console.log('2222222222222222222')
                            let info1 = await that.insert({
                                companyID,
                                userID,
                                habitID: item.habitID,
                                contactID, 
                                date, 
                                name: item.name, 
                                note: item.note, 
                                duration: item.duration,
                                status: item.status, 
                            })
                            // console.log(info1)
                        }
                    }
                    // console.log({checkStatusAll})

                    // Cập nhật trạng thái Thực hiện Habit cha: Hoàn thành
                    if(checkStatusAll == 0){
                        // Cập nhật Habit cha
                        await CRM_HABIT_TRACK_COLL.findByIdAndUpdate(commonHabitTrackID, {
                            userUpdate: userID,
                            modifyAt: Date.now(),
                            status: 2,
                            percentage: 100,
                        }, { new: true })

                        // Cập nhật vào Contact
                        await ITEM__CONTACT_COLL.findByIdAndUpdate(contactID, {
                            $inc: {
                                xp: 15, // Mỗi ngày hoàn thành được 15 điểm, 7 ngày được 105 điểm
                                streak: 1, // Cần tính toán lại để đảm bảo đúng Streak. Nếu đứt Streak sẽ về lại từ đầu
                                energy: 1, // Tính toán đảm bảo max 5 điểm máu
                            }
                        }, { new: true })
                    }else{
                        // Cập nhật Habit cha
                        await CRM_HABIT_TRACK_COLL.findByIdAndUpdate(commonHabitTrackID, {
                            userUpdate: userID,
                            modifyAt: Date.now(),
                            status: 1,
                            percentage: Number(checkStatusAll/tracks.length).toFixed(0),
                        }, { new: true })
                    }

                    return resolve({ error: false, message: 'Cập nhật thành công' });
                }else{
                    return resolve({ error: true, message: "Không cập nhật được dữ liệu", status: 403 });
                }
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

                let infoAterGet = await CRM_HABIT_TRACK_COLL.findById(trackID)
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
    getList({ option, companyID, habitID, contactID, status, date, keyword, limit = 10, lastestID, select, populates= {} }) {
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = { company: companyID };
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

                if(checkObjectIDs(habitID)){
                    conditionObj.habit = habitID
                }
                
                // else{
                //     if(!option){
                //         if(checkObjectIDs(commonHabitID)){
                //             conditionObj.habit = commonHabitID
                //         }
                //     }else{
                //         let listSubHabit = await CRM_HABIT_COLL.find({parent: commonHabitID})
                //         if(listSubHabit && listSubHabit.length){
                //             conditionObj.habit = {$in: listSubHabit.map(item=>item._id)}
                //         }
                //     }
                // }
                
                if(checkObjectIDs(contactID)){
                    conditionObj.contact = contactID
                }

                if(!isNaN(status) && [1,2].includes(Number(status))){
                    conditionObj.status = status;
                }

                // Dữ liệu theo ngày
                if (date) {
                    const inputDate = new Date(date);
                    const nextDate = new Date(inputDate);
                    nextDate.setDate(inputDate.getDate() + 1);
                  
                    conditionObj.date = {
                      $gte: inputDate,
                      $lt: nextDate,
                    };
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
					let infoData = await CRM_HABIT_TRACK_COLL.findById(lastestID);
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

                let infoDataAfterGet = await CRM_HABIT_TRACK_COLL.find(conditionObj)
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

                let totalRecord = await CRM_HABIT_TRACK_COLL.count(conditionObjOrg);
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
    getListByProperty({ option, companyID, contactID, habitID, startDate, endDate }){
        return new Promise(async resolve => {
            try {
                // Tổng hợp theo Tuần
                if(!option){
                    /**
                     * BA:
                     * Cần tính Percentage dựa trên số Habit mà contact đang thực hiện trong tuần * 7
                     */
                    let conditionObj = {
                        company: ObjectID(companyID),
                    }

                    if(checkObjectIDs(contactID)){
                        conditionObj.contact = ObjectID(contactID)
                    }

                    if(checkObjectIDs(habitID)){
                        conditionObj.habit = ObjectID(habitID)
                    }

                    // console.log(conditionObj)

                    let listData = await CRM_HABIT_TRACK_COLL.aggregate([
                        // B1: Lọc theo contact và habit
                        {
                          $match: conditionObj
                        },
                         // B2: Thêm trường year và isoWeek
                        {
                          $addFields: {
                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            week : {$isoWeek: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                          }
                        },
                         // B3: Gom lại theo tuần
                        {
                          $group: {
                            _id: {
                              year: "$year",
                              week: "$week"
                            },
                            earliestDate: { $min: "$date" },
                            totalDays: { $sum: 1 },
                            completedDays: {
                              $sum: { $cond: [{ $eq: ["$status", 2] }, 1, 0] }
                            },
                            anyDate: { $first: "$date" } // lấy đại 1 ngày bất kỳ trong tuần để tính start/end
                          }
                        },
                        {
                            $addFields: {
                              startDate: {
                                $dateFromParts: {
                                  isoWeekYear: "$_id.year",
                                  isoWeek: "$_id.week",
                                  isoDayOfWeek: 1 // Thứ 2
                                }
                              },
                              endDate: {
                                $dateFromParts: {
                                  isoWeekYear: "$_id.year",
                                  isoWeek: "$_id.week",
                                  isoDayOfWeek: 7 // Chủ nhật
                                }
                              }
                            }
                        },
                         // B4: Sắp xếp theo thời gian để đánh số tuần
                        {
                          $project: {
                            _id: 0,
                            year: "$_id.year",
                            week: "$_id.week",
                            earliestDate: 1,
                            startDate: 1,
                            endDate: 1,
                            totalDays: 1,
                            completedDays: 1,
                            percentage: {
                              $cond: [
                                { $eq: ["$totalDays", 0] },
                                0,
                                { $round: [{ $multiply: [{ $divide: ["$completedDays", "$totalDays"] }, 100] }, 0] }
                              ]
                            }
                          }
                        },
                        // { $sort: { year: 1, week: 1 } }
                      ])

                    return resolve({ error: false, data: listData })
                }

                // Tổng hợp theo Ngày
                else if(option == 1){
                    let conditionObj = {
                        company: ObjectID(companyID),
                    }

                    if(checkObjectIDs(contactID)){
                        conditionObj.contact = ObjectID(contactID)
                    }

                    if(checkObjectIDs(habitID)){
                        conditionObj.habit = ObjectID(habitID)
                    }

                    if(startDate && endDate){
                        conditionObj.date =  { 
                            $gte: moment(startDate).toDate(),
                            $lte: moment(endDate).toDate() 
                        }
                    }

                    // console.log(conditionObj)

                    let listData = await CRM_HABIT_TRACK_COLL.aggregate([
                        {
                          $match: conditionObj
                        },
                        {
                            $project: {
                              _id: 1,
                              date: 1,
                              dayOfWeek : {$dayOfWeek: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                              status: 1,
                              percentage: 1,
                            }
                        },
                        // { 
                        //     $sort: { dayOfWeek: 1 } 
                        // }
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

                    let rawData = await CRM_HABIT_TRACK_COLL.aggregate([
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
                        await CRM_HABIT_TRACK_COLL.populate(rawData, conditionPopulate1)
                    }

                    let rawData2 = await CRM_HABIT_TRACK_COLL.aggregate([
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
                        await CRM_HABIT_TRACK_COLL.populate(rawData2, conditionPopulate2)

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
                let listData2 = await CRM_HABIT_TRACK_COLL.aggregate([
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

                let rawData = await CRM_HABIT_TRACK_COLL.aggregate([
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
                    await CRM_HABIT_TRACK_COLL.populate(rawData, conditionPopulate1)
                }

                let rawData2 = await CRM_HABIT_TRACK_COLL.aggregate([
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
                    await CRM_HABIT_TRACK_COLL.populate(rawData2, conditionPopulate2)

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