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
const { CF_DOMAIN_SERVICES } 		            = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_REMINDER }                   = require('../../reminder/helper/reminder.actions-constant');
// const { CF_ACTIONS_ANALYSIS }                   = require('../../analysis/helper/analysis.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');
const {
  checkObjectIDs,
  IsJsonString,
}  = require('../../../tools/utils/utils.js');
const stringUtils					    = require('../../../tools/utils/string_utils.js')
// const { CRM_PERMISSION }                = require('../helper/crm.keys-constant.js')

const { TEMPLATE_NOTIFICATION } = require('../../../tools/constants/index.js');

/**
 * COLLECTIONS
 */
const AUTH__USER_COLL                   = require('../../auth/database/auth.user-coll.js')
const CRM_HABIT_COLL                    = require('../database/crm.habit-coll')
const CRM_HABIT_TRACK_COLL              = require('../database/crm.habit_track-coll');
const ITEM__CONTACT_COLL                = require('../../item/database/item.contact-coll')

class Model extends BaseModel {

    constructor() {
        super(CRM_HABIT_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 19/12/2025
     */
    insert({
        userID, companyID, parentID, contactID, habitCateID, type, status, duration, name, note,
        startTime, dayOfChallenge, finishDate, color, resultType, startDate, condition1, total1, bonus1, condition2, total2, bonus2, condition3, total3, bonus3, ctx
    }) {
        return new Promise(async resolve => {
            try {
                if(!name)
                    return resolve({ error: true, message: "Dữ liệu không hợp lệ", keyError: "Request params name invalid" })

                let dataInsert = {
                    userCreate: userID,
                    company: companyID,
                }

                if(checkObjectIDs(contactID)){
                    dataInsert.contact = contactID

                    let infoContact = await ITEM__CONTACT_COLL.findById(contactID)
                    if(infoContact){
                        dataInsert.support = infoContact.support
                    }
                    
                }
                
                if(checkObjectIDs(habitCateID)){
                    dataInsert.habitCate = habitCateID
                }

                if(checkObjectIDs(parentID)){
                    dataInsert.parent = parentID

                    let infoParent = await CRM_HABIT_COLL.findById(parentID);
                    dataInsert.parent = parentID;
                    dataInsert.level = Number(infoParent.level) + 1;
                }

                if (!isNaN(status)) {
                    dataInsert.status = Number(status)
                }
    
                if (!isNaN(type)) {
                    dataInsert.type = Number(type)
                }

                if (!isNaN(resultType)) {
                    dataInsert.resultType = Number(resultType)
                }

                if (!isNaN(dayOfChallenge)) {
                    dataInsert.dayOfChallenge = Number(dayOfChallenge)
                }

                if (!isNaN(duration)) {
                    dataInsert.duration = Number(duration)
                }

                if (!isNaN(condition1)) {
                    dataInsert.condition1 = Number(condition1)
                }
                if (!isNaN(total1)) {
                    dataInsert.total1 = Number(total1)
                }
                if (!isNaN(bonus1)) {
                    dataInsert.bonus1 = Number(bonus1)
                }
                if (!isNaN(condition2)) {
                    dataInsert.condition2 = Number(condition2)
                }
                if (!isNaN(total2)) {
                    dataInsert.total2 = Number(total2)
                }
                if (!isNaN(bonus2)) {
                    dataInsert.bonus2 = Number(bonus2)
                }
                if (!isNaN(condition3)) {
                    dataInsert.condition3 = Number(condition3)
                }
                if (!isNaN(total3)) {
                    dataInsert.total3 = Number(total3)
                }
                if (!isNaN(bonus3)) {
                    dataInsert.bonus3 = Number(bonus3)
                }

                if(name && name != ""){
                    dataInsert.name = name;
                }
    
                if(note && note != ""){
                    dataInsert.note = note;
                }

                if(startTime && startTime != ""){
                    dataInsert.startTime = startTime;
                }

                if(startDate && startDate != ""){
                    dataInsert.startDate = startDate;
                }

                if(finishDate && finishDate != ""){
                    dataInsert.finishDate = finishDate;
                }

                if(color && color != ""){
                    dataInsert.color = color;
                }

                let infoAfterInsert = await this.insertData(dataInsert)
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert" })

                if (startTime) {
                    const template = TEMPLATE_NOTIFICATION.find(item => item.key === 'sleep_reminder');

                    if (template) {
                        const { messages } = template;
                        const { title, description } = messages.vi;

                        ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.ADD_JOB_REMINDER_HABIT}`, {
                            title,
                            description: description.replace('{minute}', duration),
                            startTime,
                            receiverID: userID,
                            habitID: infoAfterInsert._id?.toString(),
                        })
                    }
                }

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Update
     * Author: HiepNH
     * Code: 19/12/2025
     */
    update({ userID, habitID, status, duration, name, note, startTime, dayOfChallenge, finishDate, color, resultType, imagesID, startDate, condition1, total1, bonus1, condition2, total2, bonus2, condition3, total3, bonus3 }){
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
                
                if (!isNaN(duration)) {
                    dataUpdate.duration = Number(duration)
                }

                if(name && name != ""){
                    dataUpdate.name = name;
                }
    
                if(note && note != ""){
                    dataUpdate.note = note;
                }
                
                if(startTime && startTime != ""){
                    dataUpdate.startTime = startTime;
                }

                if(dayOfChallenge && dayOfChallenge != ""){
                    dataUpdate.dayOfChallenge = dayOfChallenge;
                }

                if(startDate && startDate != ""){
                    dataUpdate.startDate = startDate;
                }

                if(finishDate && finishDate != ""){
                    dataUpdate.finishDate = finishDate;
                }

                if(color && color != ""){
                    dataUpdate.color = color;
                }

                if (!isNaN(resultType)) {
                    dataUpdate.resultType = Number(resultType)
                }

                if (!isNaN(condition1)) {
                    dataUpdate.condition1 = Number(condition1)
                }
                if (!isNaN(total1)) {
                    dataUpdate.total1 = Number(total1)
                }
                if (!isNaN(bonus1)) {
                    dataUpdate.bonus1 = Number(bonus1)
                }
                if (!isNaN(condition2)) {
                    dataUpdate.condition2 = Number(condition2)
                }
                if (!isNaN(total2)) {
                    dataUpdate.total2 = Number(total2)
                }
                if (!isNaN(bonus2)) {
                    dataUpdate.bonus2 = Number(bonus2)
                }
                if (!isNaN(condition3)) {
                    dataUpdate.condition3 = Number(condition3)
                }
                if (!isNaN(total3)) {
                    dataUpdate.total3 = Number(total3)
                }
                if (!isNaN(bonus3)) {
                    dataUpdate.bonus3 = Number(bonus3)
                }

                let infoAfterUpdate = await CRM_HABIT_COLL.findByIdAndUpdate(habitID, dataUpdate, { new: true })
                if(!infoAfterUpdate) {
                    return resolve({
                        error: true,
                        message: "Cannot update",
                        keyError: "cannot_update",
                    })
                }

                if (startTime) {
                    // // Xóa tất cả job reminder cũ (đã setup trước đó đi)
                    // await ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.DELETE_JOB_REMINDER_HABIT}`, {
                    //     habitID
                    // })

                    // // Setup con crontab mới
                    // ctx.call(`${CF_DOMAIN_SERVICES.REMINDER}.${CF_ACTIONS_REMINDER.ADD_JOB_REMINDER_HABIT}`, {
                    //     alert,
                    //     senderMail,
                    //     status: infoTask.status,
                    //     taskID: infoTask._id?.toString(),
                    //     userID: infoTask.author?.toString(),
                    //     actualFinishTime: infoTask.actualFinishTime?.toString(),
                    // })
                }

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: get info
     * Author: HiepNH
     * Code: 19/12/2025
     */
    getInfo({ habitID, select, populates }) {
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

                let infoAterGet = await CRM_HABIT_COLL.findById(habitID)
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
     * Name  : Danh sách
     * Author: HiepNH
     * Code  : 19/12/2025
     */
    getList({ companyID, option, contactID, status, userCreateID, keyword, limit = 10, lastestID, select, populates= {} }) {
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = { };
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

                if(!option){
                    if(checkObjectIDs(contactID)){
                        conditionObj.contact = contactID
                    }else{
                        conditionObj.company = companyID
                    }
                }else{
                    conditionObj.company = companyID
                    conditionObj.parent = { $exists: true, $ne: null }
                }

                if (checkObjectIDs(userCreateID)) {
                    conditionObj.userCreate = userCreateID
                }
                
                if(!isNaN(status) && [1,2].includes(Number(status))){
                    conditionObj.status = status;
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
					let infoData = await CRM_HABIT_COLL.findById(lastestID);
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

                let infoDataAfterGet = await CRM_HABIT_COLL.find(conditionObj)
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

                let totalRecord = await CRM_HABIT_COLL.count(conditionObjOrg);
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
     * Name  : Danh sách Habit kèm theo trạng thái từ ngày tới ngày
     * Author: HiepNH
     * Code  : 19/12/2025
     */
    getListWithTrack({ companyID, contactID, userCreateID, startDate, endDate, limit = 10, lastestID, select, populates= {} }) {
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * Phục vụ cho việc cập nhật trạng thái Habbit mỗi ngày
                 */
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = { company: companyID };
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

                // Màn hình Habit chung (các Habit do user tạo ra)
                if (checkObjectIDs(userCreateID)) {
                    conditionObj.userCreate = userCreateID
                }     
                
                // Màn hình Habit của 1 contactID cụ thể
                if(checkObjectIDs(contactID)){
                    conditionObj.contact = contactID
                }

                let conditionObjOrg = { ...conditionObj }

				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await CRM_HABIT_COLL.findById(lastestID);
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

                let infoDataAfterGet = await CRM_HABIT_COLL.find(conditionObj)
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

                let totalRecord = await CRM_HABIT_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

                let objTrack = {
                    habit: {$in: infoDataAfterGet.map(item => item._id)}
                }

                if(startDate && startDate != undefined && endDate && endDate != undefined){
                    // console.log('=========================12343566666')
                    startDate   = moment(startDate).startOf('day').format();// <=== fix ISODate here
                    endDate     = moment(endDate).endOf('day').format();// <=== fix ISODate here

                    objTrack.date = { 
                        $gte: moment(startDate).toDate(),
                        $lte: moment(endDate).toDate() 
                    }
                    // console.log(objTrack)
                }  

                // console.log(objTrack)
                let listTrack = await CRM_HABIT_TRACK_COLL.find(objTrack).select('habit status date resultType percentage ')
                // console.log(listTrack)

                // Tạo Map chỉ lấy bản ghi đầu tiên theo habit._id
                const trackMap = {};
                listTrack.forEach(track => {
                const habitId = track.habit.toString()
                    if (!trackMap[habitId]) {
                        trackMap[habitId] = {
                            status: track.status,
                            resultType: track.resultType,
                            date: track.date,
                            percentage : track.percentage ,
                        }
                    }
                })

                // Gắn vào từng habit item
                infoDataAfterGet = infoDataAfterGet.map(item => {
                    const track = trackMap[item._id.toString()] || {};
                    return {
                        ...item,
                        status: track.status || null,
                        resultType: track.resultType || null,
                        date: track.date || null,
                        percentage : track.percentage  || null
                    }
                })
                // console.log(infoDataAfterGet)

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