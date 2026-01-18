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
// const AUTH__USER_COLL                   = require('../../auth/database/auth.user-coll.js')
const ITEM__CONTACT_COLL                = require('../../item/database/item.contact-coll')
const CRM_HABIT_COLL                    = require('../database/crm.habit-coll')
const CRM_HABIT_TRACK_COLL              = require('../database/crm.habit_track-coll')

const { CRM_XP }                        = require("../helper/crm.keys-constant");

const AUTH__APP_USER                    = require('../.../../../auth/model/auth.app_users').MODEL

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
                        support: infoHabit.support,
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
     * Name: Update (hàm quan trọng nhất và hay dùng) ***
     * Author: HiepNH
     * Code: 22/11/2023
     */
    updateByDay({ companyID, userID, habitID, date, status, resultType }){
        // console.log({ companyID, userID, habitID, date, status, resultType })
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * 1. Hoàn thành tối thiểu: XP = 1
                 * 2. Hoàn thành tối Ưu: XP = 2
                 * 3. Hoàn thành tối thượng: XP = 3
                 * Cần lưu ý: khi chuyển tối thiểu -> ưu -> thượng và ngược lại
                 * Về membershipLevel:
                 * - Tăng khi mua hàng
                 * - Tăng khi tham gia game hàng ngày
                 */
                let infoHabit = await CRM_HABIT_COLL.findById(habitID)
                if(!infoHabit)
                    return resolve({ error: true, message: "Habit không hợp lệ", keyError: "Request params name invalid" })

                if(!infoHabit.support)
                    return resolve({ error: true, message: "Danh bạ chưa có người Support", keyError: "Request params name invalid" })

                let xp = 0 // Track
                let xpHabit = infoHabit.xp || 0 // Habit

                let condition1 = infoHabit.condition1 || 0
                let bonus1 = infoHabit.bonus1 || 0

                let condition2 = infoHabit.condition2 || 0
                let bonus2 = infoHabit.bonus2 || 0

                let condition3 = infoHabit.condition3 || 0
                let bonus3 = infoHabit.bonus3 || 0

                let realityBonus1 = infoHabit.realityBonus1 || 0
                let realityBonus2 = infoHabit.realityBonus2 || 0
                let realityBonus3 = infoHabit.realityBonus3 || 0

                /**
                 * Thông tin về Habit Track
                 */
                const formattedDate = new Date(date);
                let condition = {
                    habit: habitID,
                    contact: infoHabit.contact,
                    date: formattedDate,
                }
                // console.log(condition)

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
                        support: infoHabit.support,
                        date: formattedDate,
                        resultType, 
                        duration: infoHabit.duration,
                        habitCate: infoHabit.habitCate
                    }
                    // console.log(dataInsert)

                    if(resultType == 1){
                        xp = Number(xp) + CRM_XP[0].xp
                    }else if(resultType == 2){
                        xp = Number(xp) + CRM_XP[1].xp
                    }else{
                        xp = Number(xp) + CRM_XP[2].xp
                    }

                    dataInsert.status = 2
                    dataInsert.percentage = 100
                    dataInsert.xp = xp

                    let infoAfterInsert = await this.insertData(dataInsert)
                    if(!infoAfterInsert)
                        return resolve({ error: true, message: "cannot_insert" })

                    let listData1 = await CRM_HABIT_TRACK_COLL.aggregate([
                        {
                          $match: {
                            habit: ObjectID(habitID)
                          }
                        },
                        {
                            $group: {
                                _id: '$habit',
                                total: { $sum: "$xp" },
                            },
                        },
                    ])
                    // console.log(listData1)
                    if(listData1 && listData1.length){
                        xpHabit = Number(listData1[0].total)
                    }

                    //Tính tối thiểu, tối ưu, tối thượng
                    let listData = await CRM_HABIT_TRACK_COLL.aggregate([
                        {
                          $match: {
                            habit: ObjectID(habitID),
                            status: 2,
                          }
                        },
                        {
                            $group: {
                                _id: '$resultType',
                                total: { $sum: 1 },
                            },
                        },
                    ])
                    // console.log(listData)

                    // Khởi tạo các giá trị mặc định là 0
                    let t1 = 0, t2 = 0, t3 = 0;

                    // Duyệt qua mảng kết quả từ aggregate
                    listData.forEach(item => {
                        const id = parseInt(item._id);
                        const val = item.total || 0;

                        // Total1 = tổng của _id 1, 2, 3
                        if ([1, 2, 3].includes(id)) {
                            t1 += val;
                        }
                        // Total2 = tổng của _id 2, 3
                        if ([2, 3].includes(id)) {
                            t2 += val;
                        }
                        // Total3 = giá trị của _id 3
                        if (id === 3) {
                            t3 = val;
                        }
                    });

                    // Gán lại vào biến bạn cần
                    const total1 = t1;
                    const total2 = t2;
                    const total3 = t3;

                    if(total1 == condition1){
                        realityBonus1 = bonus1
                    }else{
                        realityBonus1 = 0
                    }
                    if(total2 == condition2){
                        realityBonus2 = bonus2
                    }else{
                        realityBonus2 = 0
                    }
                    if(total3 == condition3){
                        realityBonus3 = bonus3
                    }else{
                        realityBonus3 = 0
                    }

                    // Cập nhật vào Habit
                    await CRM_HABIT_COLL.findByIdAndUpdate(habitID, {
                        xp: xpHabit,
                        total1,
                        total2,
                        total3,
                        realityBonus1,
                        realityBonus2,
                        realityBonus3,
                    }, { new: true })

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
                        if(resultType == 1){
                            xp = Number(xp) + Number(CRM_XP[0].xp)
                        }else if(resultType == 2){
                            xp = Number(xp) + Number(CRM_XP[1].xp)
                        }else{
                            xp = Number(xp) + Number(CRM_XP[2].xp)
                        }

                        dataUpdate.status = 2
                        dataUpdate.percentage = 100
                        dataUpdate.xp = xp
                    }else{
                        if(resultType == 1){
                            xpHabit = Number(xpHabit) - CRM_XP[0].xp
                        }else if(resultType == 2){
                            xpHabit = Number(xpHabit) - CRM_XP[1].xp
                        }else{
                            xpHabit = Number(xpHabit) - CRM_XP[2].xp
                        }

                        dataUpdate.status = 0
                        dataUpdate.percentage = 0
                        dataUpdate.xp = 0
                    }

                    let infoAfterUpdate = await CRM_HABIT_TRACK_COLL.findByIdAndUpdate(infoTrack._id, dataUpdate, { new: true })
                    if(!infoAfterUpdate) {
                        return resolve({
                            error: true,
                            message: "Cannot update",
                            keyError: "cannot_update",
                        })
                    }

                    let listData1 = await CRM_HABIT_TRACK_COLL.aggregate([
                        {
                          $match: {
                            habit: ObjectID(habitID)
                          }
                        },
                        {
                            $group: {
                                _id: '$habit',
                                total: { $sum: "$xp" },
                            },
                        },
                    ])
                    // console.log(listData1)
                    if(listData1 && listData1.length){
                        xpHabit = Number(listData1[0].total)
                    }

                    //Tính tối thiểu, tối ưu, tối thượng
                    let listData = await CRM_HABIT_TRACK_COLL.aggregate([
                        {
                          $match: {
                            habit: ObjectID(habitID),
                            status: 2,
                          }
                        },
                        {
                            $group: {
                                _id: '$resultType',
                                total: { $sum: 1 },
                            },
                        },
                    ])
                    // console.log(listData)
                    
                    // Khởi tạo các giá trị mặc định là 0
                    let t1 = 0, t2 = 0, t3 = 0;

                    // Duyệt qua mảng kết quả từ aggregate
                    listData.forEach(item => {
                        const id = parseInt(item._id);
                        const val = item.total || 0;

                        // Total1 = tổng của _id 1, 2, 3
                        if ([1, 2, 3].includes(id)) {
                            t1 += val;
                        }
                        // Total2 = tổng của _id 2, 3
                        if ([2, 3].includes(id)) {
                            t2 += val;
                        }
                        // Total3 = giá trị của _id 3
                        if (id === 3) {
                            t3 = val;
                        }
                    });

                    // Gán lại vào biến bạn cần
                    const total1 = t1;
                    const total2 = t2;
                    const total3 = t3;

                    if(total1 == condition1){
                        realityBonus1 = bonus1
                    }else{
                        realityBonus1 = 0
                    }
                    if(total2 == condition2){
                        realityBonus2 = bonus2
                    }else{
                        realityBonus2 = 0
                    }
                    if(total3 == condition3){
                        realityBonus3 = bonus3
                    }else{
                        realityBonus3 = 0
                    }

                    // Cập nhật vào Habit
                    await CRM_HABIT_COLL.findByIdAndUpdate(habitID, {
                        xp: xpHabit,
                        total1,
                        total2,
                        total3,
                        realityBonus1,
                        realityBonus2,
                        realityBonus3,
                    }, { new: true })

                    return resolve({ error: false, data: infoAfterUpdate })
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
    getList({ option, companyID, habitID, contactID, status, date, startDate, endDate, keyword, limit = 10, lastestID, select, populates= {} }) {
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
    getListByProperty({ option, tab, companyID, userID, contactID, habitID, startDate, endDate, supportID, year }){
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
                        let endDateCheck = moment(endDate).format("YYYY-MM-DD")

                        conditionObj.date =  { 
                            $gte: moment(startDate).toDate(),
                            // $lte: moment(endDate).toDate(),
                            $lte: new Date(endDateCheck), // Chuẩn hóa với giờ được Record trong DB
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
                              resultType: 1,
                              status: 1,
                              percentage: 1,
                            }
                        },
                    ])

                    // console.log(listData)

                    return resolve({ error: false, data: listData })
                }

                /**
                 * getDailyStreakProgress: Show streak
                 * https://chatgpt.com/c/685f1a72-0b14-8001-b530-65d1acebc25b
                 */
                else if(option == 2){
                    // 1. Chuyển về start-of-day & end-of-day để truy vấn chính xác 
                    const start = moment(startDate).startOf('day').toDate();
                    const end   = moment(endDate).endOf('day').toDate();

                    // 2. Lấy tất cả bản ghi track trong khoảng thời gian
                    //    – chỉ cần field date & status để giảm bandwidth
                    const tracks = await CRM_HABIT_TRACK_COLL.find(
                        { habit: habitID, date: { $gte: start, $lte: end } },
                        { date: 1, status: 1, _id: 0 }
                    ).lean()

                    // 3. Chuyển track thành map theo ngày YYYY-MM-DD
                    const statusByDate = new Map();
                    tracks.forEach(t => {
                        const key = moment(t.date).format('YYYY-MM-DD');
                        statusByDate.set(key, t.status);  // 1 = không hoàn thành, 2 = hoàn thành
                    });                    

                    // 4. Tính streak từng ngày
                    const result = [];
                    let streak = 0;

                    const current = moment(start);
                    const endMoment = moment(end);

                    while (current.isSameOrBefore(endMoment, 'day')) {
                        const key = current.format('YYYY-MM-DD');
                        const status = statusByDate.get(key);

                        if (status === 2) {
                            streak += 1;
                        } else {
                            streak = 0;
                        }

                        result.push({ date: key, streak });
                        current.add(1, 'day');
                    }

                    // return result;
                    return resolve({ error: false, data: result })
                }

                // // Báo cáo Xếp hạng theo tuần
                // else if(option == 3){
                //     let conditionObj = {
                //         company: ObjectID(companyID),
                //         status: 2, // Hoàn thành
                //     }

                //     if(startDate && endDate){
                //         conditionObj.date =  { 
                //             $gte: moment(startDate).toDate(),
                //             $lte: moment(endDate).toDate() 
                //         }
                //     }

                //     // console.log(conditionObj)

                //     let listData = await CRM_HABIT_TRACK_COLL.aggregate([
                //         {
                //           $match: conditionObj
                //         },
                //         {
                //             $group: {
                //                 _id: '$contact',
                //                 // score:       { $sum: 1 },           // số lần hoàn thành
                //                 totalXP:     { $sum: '$xp' },       // tổng điểm XP
                //                 totalStreak: { $sum: '$streak' },   // tổng streak
                //             },
                //         },
                //         { 
                //             $sort: { totalXP: -1 } 
                //         }
                //     ])

                //     // console.log(listData)

                //     await ITEM__CONTACT_COLL.populate(listData, {  
                //         path: '_id',
                //         select: 'name image parent createAt',
                //         model: 'contact',
                //         populate: {
                //             path: 'parent',
                //             select: 'name address',
                //             model: 'contact',
                //         }
                //     })

                //     return resolve({ error: false, data: listData })
                // }

                // // Báo cáo thực hiện Habit: cho việc quản trị
                // else if(option == 4){
                //     let conditionObj = {
                //         company: ObjectID(companyID),
                //         // status: 2, // Hoàn thành
                //     }

                //     if(startDate && endDate){
                //         conditionObj.date =  { 
                //             $gte: moment(startDate).toDate(),
                //             $lte: moment(endDate).toDate() 
                //         }
                //     }
                //     // console.log(conditionObj)

                //     let listData = await ITEM__CONTACT_COLL.aggregate([
                //         {
                //           $match: {
                //             company: ObjectID(companyID)
                //           }
                //         },
                //         {
                //             $group: {
                //                 _id: '$_id',
                //             },
                //         },
                //         {
                //             $count: 'total',
                //         },
                //     ])

                //     let listData1 = await CRM_HABIT_TRACK_COLL.aggregate([
                //         {
                //           $match: conditionObj
                //         },
                //         {
                //             $group: {
                //                 _id: '$contact',
                //             },
                //         },
                //         {
                //             $count: 'total',
                //         },
                //     ])

                //     let total = 0, active = 0
                //     if(listData && listData.length){
                //         total = listData[0].total
                //     }

                //     if(listData1 && listData1.length){
                //         active = listData1[0].total
                //     }

                //     return resolve({ error: false, data: {total, active } })
                // }

                // // Chi tiết Nhân sự cập nhật dữ liệu
                // else if(option == 5){
                //     let conditionObj = {
                //         company: ObjectID(companyID),
                //         // status: 2, // Hoàn thành
                //     }

                //     if(startDate && endDate){
                //         conditionObj.date =  { 
                //             $gte: moment(startDate).toDate(),
                //             $lte: moment(endDate).toDate() 
                //         }
                //     }

                //     // console.log(conditionObj)

                //     let listData = await CRM_HABIT_TRACK_COLL.aggregate([
                //         {
                //           $match: conditionObj
                //         },
                //         {
                //             $group: {
                //                 _id: '$contact',
                //             },
                //         },
                //     ])

                //     // console.log(listData)

                //     await ITEM__CONTACT_COLL.populate(listData, {  
                //         path: '_id',
                //         select: 'name birthday image userCreate createAt',
                //         model: 'contact',
                //         populate: {
                //             path: 'userCreate',
                //             select: 'fullname address',
                //             model: 'user',
                //         }
                //     })

                //     return resolve({ error: false, data: listData })
                // }

                // else if(option == 6){
                //     let conditionObj = {
                //         company: ObjectID(companyID),
                //         // status: 2, // Hoàn thành
                //     }

                //     if(startDate && endDate){
                //         conditionObj.date =  { 
                //             $gte: moment(startDate).toDate(),
                //             $lte: moment(endDate).toDate() 
                //         }
                //     }

                //     // console.log(conditionObj)

                //     let listData = await CRM_HABIT_TRACK_COLL.aggregate([
                //         {
                //           $match: conditionObj
                //         },
                //         {
                //             $group: {
                //                 _id: '$contact',
                //             },
                //         },
                //     ])

                //     let listData1 = await ITEM__CONTACT_COLL.find({
                //             company: ObjectID(companyID),
                //             _id: {$nin: listData.map(item => item._id)}
                //     }).select('name phone')

                //     return resolve({ error: false, data: listData1 })
                // }

                /**
                 * DÀNH CHO PHẦN GAME MỚI
                 */
                // Tổng hợp Kết quả game theo người chơi
                else if(option == 7){
                    let conditionObj = {}
                    if(!tab){
                        conditionObj = {
                            company: ObjectID(companyID),
                            userCreate: ObjectID(userID),
                            status: 2, // Hoàn thành
                        }
                    }else{
                        conditionObj = {
                            company: ObjectID(companyID),
                            status: 2, // Hoàn thành
                        }
                    }

                    let endDateCheck = moment(endDate).format("YYYY-MM-DD")
                    // console.log(endDateCheck)

                    if(startDate && endDate){
                        conditionObj.date =  { 
                            $gte: moment(startDate).toDate(),
                            // $lte: moment(endDate).toDate(), 
                            $lte: new Date(endDateCheck), // Chuẩn hóa với giờ được Record trong DB
                        }
                    }
                    // console.log(conditionObj)

                    let listData = await CRM_HABIT_TRACK_COLL.aggregate([
                        {
                          $match: conditionObj
                        },
                        {
                            $group: {
                                _id: '$contact',
                                totalXP: { $sum: '$xp' },
                            },
                        },
                        { 
                            $sort: { totalXP: -1 } 
                        }
                    ])
                    // console.log(listData)

                    await ITEM__CONTACT_COLL.populate(listData, {  
                        path: '_id',
                        select: 'name image parent createAt birthday address gender',
                        model: 'contact',
                    })

                    return resolve({ error: false, data: listData })
                }

                // Tổng hợp theo Người support/CSKH
                else if(option == 8){
                    let conditionObj = { company: ObjectID(companyID) }

                    let conditionContactObj = {
                        company: ObjectID(companyID),
                        status: 1
                    }

                    if(startDate && endDate){
                        conditionObj.date =  { 
                            $gte: moment(startDate).toDate(),
                            $lte: moment(endDate).toDate() 
                        }
                    }

                    let infoAppUser = await AUTH__APP_USER.checkPermissionsAccessApp({
                        appID: "61e04a0dfdebf77b072d1b18", // App Habit
                        userID
                    })

                    if((infoAppUser && !infoAppUser.error && infoAppUser.data.level == 0)){
                        // console.log('1111111111')
                        conditionObj.company = ObjectID(companyID)
                        conditionContactObj.support = { $exists: true, $ne: null }
                    }else{
                        let infoContact = await ITEM__CONTACT_COLL.findOne({
                            company: ObjectID(companyID), 
                            linkUser: userID
                        }).select('name linkUser support')
                        // console.log(infoContact)

                        if(infoContact){
                            // console.log('222222222222')
                            conditionObj.support = infoContact._id
                            conditionContactObj.support = infoContact._id
                        }else{
                            // console.log('333333333333333')
                            conditionObj.support = { $exists: false }
                            conditionContactObj.support = { $exists: false }
                        }
                    }                    
                    // console.log(conditionObj)
                    // console.log(conditionContactObj)

                    // // Danh sách Gom nhóm khách hàng theo support
                    // let listData = await ITEM__CONTACT_COLL.aggregate([
                    //     {
                    //       $match: {
                    //         company: ObjectID(companyID),
                    //         support: { $exists: true, $ne: null },
                    //       }
                    //     },
                    //     {
                    //         $group: {
                    //             _id: '$support',
                    //             total: { $sum: 1 },
                    //         },
                    //     },
                    // ])
                    // // console.log(listData)

                    // let listData1 = await CRM_HABIT_TRACK_COLL.aggregate([
                    //     {
                    //         $match: conditionObj
                    //     },
                    //     {
                    //         $group: {
                    //             _id: '$support',
                    //             // Tạo một mảng chứa các contact duy nhất, sau đó đếm kích thước mảng đó
                    //             uniqueContacts: { $addToSet: '$contact' } 
                    //         }
                    //     },
                    //     {
                    //         $project: {
                    //             _id: 1,
                    //             active: { $size: '$uniqueContacts' }
                    //         }
                    //     }
                    // ]);
                    // console.log(listData1)

                    // Cách tối ưu nhưng không dùng $facet
                    // // Tạo một lookup object
                    // let activeLookup = {};
                    // listData1.forEach(item => {
                    //     activeLookup[item._id.toString()] = item.active;
                    // });

                    // // Gộp mảng
                    // let result = listData.map(item => ({
                    //     _id: item._id,
                    //     total: item.total,
                    //     active: activeLookup[item._id.toString()] || 0
                    // }));
                    // // console.log(result)

                    // Cách tối ưu dùng $facet
                    let listData = await ITEM__CONTACT_COLL.aggregate([
                        {
                            $match: conditionContactObj
                        },
                        {
                            $group: {
                                _id: '$support',
                                total: { $sum: 1 }
                            }
                        },
                        // Lookup sang bảng habit track để đếm số contact active
                        {
                            $lookup: {
                                from: 'crm_habit_tracks', // Tên collection trong DB của CRM_HABIT_TRACK_COLL
                                let: { supportId: '$_id' }, // Khai báo biến để khác với biến support bên bảng Contact
                                pipeline: [
                                    { 
                                        $match: { 
                                            $expr: { $eq: ['$support', '$$supportId'] },
                                            ...conditionObj // Thêm các điều kiện từ conditionObj của bạn vào đây
                                        } 
                                    },
                                    { $group: { _id: '$contact' } }, // Gom nhóm contact để đếm duy nhất
                                    { $count: 'count' }
                                ],
                                as: 'activeStatus'
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                total: 1,
                                // Lấy kết quả count từ mảng lookup, nếu không có thì mặc định 0
                                active: { $ifNull: [{ $arrayElemAt: ['$activeStatus.count', 0] }, 0] }
                            }
                        }
                    ]);

                    await ITEM__CONTACT_COLL.populate(listData, {  
                        path: '_id',
                        select: 'name phone area address',
                        model: 'contact',
                    })

                    return resolve({ error: false, data: listData })
                }

                // Chi tiết theo contact của Support
                else if(option == 9){
                    let conditionObj = {
                        company: ObjectID(companyID),
                        status: 2,
                    }

                    if(supportID){
                        conditionObj.support = ObjectID(supportID)
                    }
                    
                    if(startDate && endDate){
                        conditionObj.date =  { 
                            $gte: moment(startDate).toDate(),
                            $lte: moment(endDate).toDate() 
                        }
                    }
                    
                    let listData = await CRM_HABIT_TRACK_COLL.aggregate([
                        {
                            $match: conditionObj // Bao gồm lọc theo date nếu có
                        },
                        {
                            // Bước 1: Gom nhóm theo bộ đôi Contact và HabitCate để đếm
                            $group: {
                                _id: {
                                    contact: '$contact',
                                    habitCate: '$habitCate'
                                },
                                count: { $sum: 1 }
                            }
                        },
                        {
                            // Bước 2: Gom tất cả các HabitCate về lại một Contact duy nhất
                            $group: {
                                _id: '$_id.contact',
                                details: {
                                    $push: {
                                        habitCate: '$_id.habitCate',
                                        total: '$count'
                                    }
                                }
                            }
                        }
                    ]);

                    await ITEM__CONTACT_COLL.populate(listData, {  
                        path: '_id',
                        select: '_id name phone image support parent birthday gender address',
                        model: 'contact',
                    })

                    await ITEM__CONTACT_COLL.populate(listData, {  
                        path: '_id.support',
                        select: 'name phone',
                        model: 'contact',
                    })

                    await ITEM__CONTACT_COLL.populate(listData, {  
                        path: '_id.parent',
                        select: 'name phone',
                        model: 'contact',
                    })

                    return resolve({ error: false, data: listData })
                }

                // Tổng hợp thành viên mới theo tháng
                else if(option == 10){
                    const targetYear = parseInt(year); 
                    const startOfYear = moment().year(targetYear).startOf('year').toDate();
                    const endOfYear = moment().year(targetYear).endOf('year').toDate();

                    let listData = await ITEM__CONTACT_COLL.aggregate([
                        {
                            $match: {
                                company: ObjectID(companyID),
                                type: 6, // Các bé
                                status: 1, // Chỉ các danh bạ còn đang hoạt động
                                joinedDate: { $gte: startOfYear, $lte: endOfYear } // Lọc trực tiếp trên Index
                            }
                        },
                        {
                            $group: {
                                _id: { $month: { date: "$joinedDate", timezone: "Asia/Ho_Chi_Minh" } }, // Trích xuất tháng tại đây
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $sort: { "_id": 1 } // Sắp xếp từ tháng 1 đến tháng 12
                        }
                    ]);

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

           } catch (error) {
               return resolve({ error: true, message: error.message, status: 500 });
           }
       })
    }
}

exports.MODEL = new Model