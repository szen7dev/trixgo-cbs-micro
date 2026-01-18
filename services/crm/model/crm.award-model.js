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
const CRM_AWARD_COLL                    = require('../database/crm.award-coll')
const ITEM__CONTACT_COLL                = require('../../item/database/item.contact-coll')
const CRM_HABIT_TRACK_COLL              = require('../../crm/database/crm.habit_track-coll')

class Model extends BaseModel {

    constructor() {
        super(CRM_AWARD_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 19/12/2025
     */
    insert({ userID, companyID, parentID, contactID, awardType, periodType, score, date }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(contactID))
                    return resolve({ error: true, message: "Dữ liệu không hợp lệ", keyError: "Request params name invalid" })

                let dataInsert = {
                    userCreate: userID,
                    company: companyID,
                    contact: contactID,
                }

                if(checkObjectIDs(parentID)){
                    dataInsert.parent = parentID
                }

                if (!isNaN(awardType)) {
                    dataInsert.awardType = Number(awardType)
                }

                if (!isNaN(periodType)) {
                    dataInsert.periodType = Number(periodType)
                }

                if (!isNaN(score)) {
                    dataInsert.score = Number(score)
                }

                if(date && date != ""){
                    dataInsert.date = date
                }

                let infoAfterInsert = await this.insertData(dataInsert)
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert" })

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: capture
     * Author: HiepNH
     * Code: 19/12/2025
     */
    capture({ userID, companyID, date, periodType }) {
        const that = this
        return new Promise(async resolve => {
            try {
                let startDate, endDate;
                const mDate = moment(date); // Ngày người dùng truyền vào

                // Xác định khoảng thời gian dựa trên periodType
                if (periodType == 1) { // Tuần
                    startDate = mDate.clone().startOf('isoWeek').toDate(); 
                    // CHỈNH TẠI ĐÂY: Lấy Chủ Nhật nhưng đưa về đầu ngày (00:00:00)
                    endDate = mDate.clone().endOf('isoWeek').toDate()
                } else if (periodType == 2) { // Tháng
                    startDate = mDate.clone().startOf('month').toDate();
                    // CHỈNH TẠI ĐÂY: Lấy ngày cuối tháng nhưng đưa về đầu ngày
                    endDate = mDate.clone().endOf('month').toDate()
                } else if (periodType == 3) { // Năm
                    startDate = mDate.clone().startOf('year').toDate();
                    endDate = mDate.clone().endOf('year').toDate()
                }

                let endDateCheck = moment(endDate).format("YYYY-MM-DD")

                // 3. Kiểm tra xem đã tồn tại bản ghi trong ngày đó chưa
                let checkCondition = {
                    company: ObjectID(companyID),
                    periodType: Number(periodType),
                    date: new Date(endDateCheck),
                };

                // console.log({startDate,endDate})
                // console.log(checkCondition)

                let existingAward = await CRM_AWARD_COLL.findOne(checkCondition);
                // console.log(existingAward)

                // 2. Thực hiện truy vấn tìm bản ghi đã tồn tại trong collection CRM_AWARD
                
                if (existingAward) 
                    return resolve({ 
                        error: true, 
                        message: `Đã tồn tại dữ liệu trao giải cho kỳ này (ngày kết thúc: ${moment(endDate).format('DD/MM/YYYY')})` 
                    })

                let conditionObj = {
                    company: ObjectID(companyID),
                    status: 2, // Hoàn thành
                    date: {
                        $gte: startDate,
                        $lte: endDate
                    }
                };

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
                    { $sort: { totalXP: -1 } }, // Sắp xếp XP giảm dần
                    { $limit: 3 } // Lấy 3 người cao nhất
                ])
                
                // console.log(listData)
                await CRM_HABIT_TRACK_COLL.populate(listData, {  
                    path: '_id',
                    select: 'name parent',
                    model: 'contact',
                })
                // console.log(listData)

                let i = 3
                for(const item of listData){
                    await that.insert({ 
                        userID, 
                        companyID, 
                        parentID: item._id.parent, 
                        contactID: item._id._id, 
                        awardType: i, 
                        periodType, 
                        score: item.totalXP,
                        date: endDateCheck //
                    })

                    i--
                }

                return resolve({ error: false, message: 'Ghi nhận thành công' });
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
    update({ userID, awardID, parentID, contactID, awardType, periodType, score }){
        return new Promise(async (resolve) => {
            try {
                let dataUpdate = {
                    userUpdate: userID,
                    modifyAt: Date.now(),
                }

                if(checkObjectIDs(contactID)){
                    dataUpdate.contact = contactID
                }

                if(checkObjectIDs(parentID)){
                    dataUpdate.parent = parentID
                }

                if (!isNaN(awardType)) {
                    dataUpdate.awardType = Number(awardType)
                }

                if (!isNaN(periodType)) {
                    dataUpdate.periodType = Number(periodType)
                }

                if (!isNaN(score)) {
                    dataUpdate.score = Number(score)
                }

                let infoAfterUpdate = await CRM_AWARD_COLL.findByIdAndUpdate(awardID, dataUpdate, { new: true })
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
     * Name: get info
     * Author: HiepNH
     * Code: 19/12/2025
     */
    getInfo({ awardID, select, populates }) {
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

                let infoAterGet = await CRM_AWARD_COLL.findById(awardID)
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
    getList({ companyID, parentID, contactID, keyword, limit = 10, lastestID, select, populates= {} }) {
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

                if(checkObjectIDs(contactID)){
                    conditionObj.contact = contactID
                }else{
                    if(checkObjectIDs(parentID)){
                        conditionObj.parent = parentID
                    }else{
                        conditionObj.company = companyID
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
					let infoData = await CRM_AWARD_COLL.findById(lastestID);
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

                let infoDataAfterGet = await CRM_AWARD_COLL.find(conditionObj)
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

                let totalRecord = await CRM_AWARD_COLL.count(conditionObjOrg);
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
    getListByProperty({ option, userID, companyID, parentID, contactID }){
        return new Promise(async resolve => {
            try {
                // let yearFilter
                // let currentYear = new Date().getFullYear()
                // if(year && !isNaN(year)){
                //     yearFilter = Number(year)
                // }else{
                //     yearFilter = Number(currentYear)
                // }

                let conditionObj = {
                    company: ObjectID(companyID),
                    
                }

                if(checkObjectIDs(parentID)){
                    conditionObj.$or = [
                        { parent: ObjectID(parentID) },
                        { contact: ObjectID(parentID) }
                    ]
                }

                if(checkObjectIDs(contactID)){
                    conditionObj.contact = ObjectID(contactID)
                }

                let listData = await CRM_AWARD_COLL.aggregate([
                    {
                        $match: conditionObj // Điều kiện lọc của bạn
                    },
                    {
                        // Bước 1: Gom theo bộ ba: Contact + Kỳ (periodType) + Loại giải (awardType)
                        $group: {
                        _id: {
                            contact: '$contact',
                            period: '$periodType',
                            award: '$awardType'
                        },
                            count: { $sum: 1 }
                        }
                    },
                    {
                        // Bước 2: Gom theo Contact và Kỳ (để nhóm các giải thưởng vào mảng awards)
                        $group: {
                        _id: {
                            contact: '$_id.contact',
                            period: '$_id.period'
                        },
                        awards: {
                            $push: {
                            awardType: '$_id.award',
                            count: '$count'
                            }
                        }
                        }
                    },
                    {
                        // Bước 3: Gom theo Contact (để nhóm các kỳ vào mảng periods)
                        $group: {
                            _id: '$_id.contact',
                            detailsByPeriod: {
                                $push: {
                                periodType: '$_id.period',
                                awards: '$awards'
                                }
                            }
                        }
                    },
                    {
                        // Bước 4: Làm đẹp output
                        $project: {
                            _id: 0,
                            contact: '$_id',
                            detailsByPeriod: 1
                        }
                    }
                ]);

                await ITEM__CONTACT_COLL.populate(listData, {  
                    path: 'contact',
                    select: 'name image gender birthday address',
                    model: 'contact',
                })

                return resolve({ error: false, data: listData })
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