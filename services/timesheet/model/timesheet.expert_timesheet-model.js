"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');
const _isValid                          = require('mongoose').Types.ObjectId;
const ObjectID                          = require('mongoose').Types.ObjectId;

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');

/**
 * COLLECTIONS
 */
const TIMESHEET__EXPERT_TIMESHEET_COLL  = require('../database/timesheet.expert_timesheet-coll');
const BUDGET__WORK_COLL                 = require('../../budget/database/budget.work-coll');

class Model extends BaseModel {

    constructor() {
        super(TIMESHEET__EXPERT_TIMESHEET_COLL);
    }

    /**
     * Name: Insert expert timesheet
     * Author: Depv
     * Code:
     */
    insert({ userCreate, companyID, parentID, name, date, type, note, projectID, assigneeID }) {
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
                    userCreate, name, admins: [userCreate], members: [userCreate]
                }

                if(companyID){
                    dataInsert.company = companyID;
                }

                if(checkObjectIDs(parentID)){
                    let infoParent = await TIMESHEET__EXPERT_TIMESHEET_COLL.findById(parentID);

                    dataInsert.company = infoParent.company;
                    dataInsert.parent = parentID
                    dataInsert.assignee = infoParent.assignee
                }

                if(assigneeID){
                    dataInsert.assignee = assigneeID;
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

                if(note){
                    dataInsert.note = note;
                }
                // console.log(dataInsert)

                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert" });

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Update expert timesheet
     * Author: Depv
     * Code:
     */
    update({ expertTimesheetID, projectID, name, type, assigneeID, hours, unitprice, status, approver, note, date,
        dateIn1, dateOut1, dateIn2, dateOut2, dateIn3, dateOut3, admins, members, userID, workID }){
            console.log({ expertTimesheetID, projectID, name, type, assigneeID, hours, unitprice, status, approver, note, date,
                dateIn1, dateOut1, dateIn2, dateOut2, dateIn3, dateOut3, admins, members, userID, workID })
        return new Promise(async (resolve) => {
            const that = this
            try {
                let infoTimeSheetID = await TIMESHEET__EXPERT_TIMESHEET_COLL.findById(expertTimesheetID);
                if(!infoTimeSheetID) {
                    return resolve({
                        error: true,
                        message: 'Timesheet không tồn tại',
                        keyError: "timesheet_not_exists",
                        status: 400
                    });
                }

                let dataUpdate = {
                    userUpdate: userID,
                    modifyAt: Date.now(),
                }

                if(projectID){
                    dataUpdate.project = projectID;
                }

                if(checkObjectIDs(assigneeID)){
                    dataUpdate.assignee = assigneeID;
                }

                if(name){
                    dataUpdate.name = name;
                }

                if(date){
                    dataUpdate.date = date;
                }

                if(type){
                    dataUpdate.type = type;
                }

                if(hours){
                    dataUpdate.hours = hours;
                }

                let unitprice2 = 0
                if(unitprice){
                    unitprice2 = Number(unitprice)
                }
                if(checkObjectIDs(workID)){
                    dataUpdate.work = workID;

                    let infoWork = await BUDGET__WORK_COLL.findById(workID).select('unitPrice')
                    if(infoWork){
                        unitprice2 = Number(infoWork.unitPrice)
                    }
                }

                if(unitprice2 != 0){
                    let amount  = hours * unitprice2

                    dataUpdate.unitprice = unitprice2
                    dataUpdate.amount = amount
                }

                if(status){
                    dataUpdate.status = status;
                }

                if(approver){
                    dataUpdate.approver = approver;
                    dataUpdate.timeApprover =  Date.now();
                }

                if(note){
                    dataUpdate.note = note;
                }

                if(dateIn1){
                    dataUpdate.dateIn1 = dateIn1;
                }

                if(dateOut1){
                    dataUpdate.dateOut1 = dateOut1;
                }

                if(dateIn2){
                    dataUpdate.dateIn2 = dateIn2;
                }

                if(dateOut2){
                    dataUpdate.dateOut2 = dateOut2;
                }

                if(dateIn3){
                    dataUpdate.dateIn3 = dateIn3;
                }

                if(dateOut3){
                    dataUpdate.dateOut3 = dateOut3;
                }

                const adminsID = [...infoTimeSheetID.admins?.map(item => item?.toString()), infoTimeSheetID.userCreate?.toString()];
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
                } else{
                    if(checkObjectIDs(admins)) {
                        return resolve({
                            error: true,
                            message: 'Bạn không có quyền chia sẻ',
                            keyError: "permission_denined",
                            status: 403
                        });
                    }

                    if(checkObjectIDs(members)) {
                        return resolve({
                            error: true,
                            message: 'Bạn không có quyền chia sẻ',
                            keyError: "permission_denined",
                            status: 403
                        });
                    }
                }

                let infoAfterUpdate = await TIMESHEET__EXPERT_TIMESHEET_COLL.findByIdAndUpdate(expertTimesheetID, dataUpdate, { new: true });
                if(!infoAfterUpdate) {
                    return resolve({
                        error: true,
                        message: "Cannot update",
                        keyError: "cannot_update",
                    });
                }

                // Cập nhật cho mẩu tin cha
                if(infoAfterUpdate.parent){
                    await that.updateValue({ parentID: infoAfterUpdate.parent, userID })
                }

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    updateValue({ parentID, userID }){
        return new Promise(async (resolve) => {
            try {
                let listData = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                    {
                        $match: {
                            parent: ObjectID(parentID)
                        }
                    },
                    {
                        $group: {
                            _id: { },
                            hours: { $sum: "$hours" },
                            amount: { $sum: "$amount" },
                        }
                    },
                ])
                // console.log(listData)

                let dataUpdate = {
                    userUpdate: userID,
                    modifyAt: Date.now(),
                    hours: listData[0].hours,
                    amount: listData[0].amount,
                    unitprice: Number(listData[0].amount / listData[0].hours),
                }

                let infoAfterUpdate = await TIMESHEET__EXPERT_TIMESHEET_COLL.findByIdAndUpdate(parentID, dataUpdate, { new: true });
                if(!infoAfterUpdate) {
                    return resolve({
                        error: true,
                        message: "Cannot update",
                        keyError: "cannot_update",
                    });
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
    getInfo({ expertTimesheetID, userID, select, populates }) {
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(expertTimesheetID))
                    return resolve({ error: true, message: 'Request params expertTimesheetID invalid', status: 400 });

                 // populates
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

                let infoAterGet = await TIMESHEET__EXPERT_TIMESHEET_COLL.findOne({
                    _id: expertTimesheetID,
                    $or: [
                        {userCreate: userID},
                        {admins: { $in: [userID] }},
                        {members: { $in: [userID] }}
                    ]
                })
                .select(select)
                .populate(populates)

                if(!infoAterGet)
                    return resolve({ error: true, message: "can't_get_info", status: 403 });

                return resolve({ error: false, data: infoAterGet, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Danh sách expert timesheet
     * Author: HiepNH
     */
    getList({
        parentID, userID,
        keyword, limit = 10, lastestID, select, populates= {} }) {
        return new Promise(async (resolve) => {
            try {
                let conditionObj = {};
                let sortBy   = { date: 1, _id: 1 };

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
					conditionObj.parent = parentID;
				}else{
                    conditionObj.$or = [
                        {userCreate: userID},
                        {admins: { $in: [userID] }},
                        {members: { $in: [userID] }}
                    ]
					conditionObj.parent = { $exists: false };
                }

				if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = new RegExp(keyword, 'i');
                }
                let conditionObjOrg = { ...conditionObj };

                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await TIMESHEET__EXPERT_TIMESHEET_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

					let keys = ['createAt__1', '_id__1'];
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });

					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}

                let infoDataAfterGet = await TIMESHEET__EXPERT_TIMESHEET_COLL.find(conditionObj)
                    .select(select)
                    .limit(+limit + 1)
                    .sort(sortBy)
                    .populate(populates)
                    .lean();

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
                if(infoDataAfterGet && infoDataAfterGet.length){
                    if(infoDataAfterGet.length > limit){
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await TIMESHEET__EXPERT_TIMESHEET_COLL.count(conditionObjOrg);
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
    getListByProperty({ userID, option, year, companyID }){
        // console.log({ userID, option, year, companyID })
        return new Promise(async resolve => {
            try {
                let conditionObj = {company: ObjectID(companyID)}
                if(!option){
                    let listData = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $project: {
                                year : {$year : "$date"},
                                month : {$month : "$date"},
                                hours: 1,
                                amount: 1
                            }
                        },
                        {
                            $match: {
                                year: Number(year)
                            }
                        },
                        {
                            $group: {
                                _id: { month: '$month' },
                                quantity: { $sum: "$hours" },
                                amount: { $sum: "$amount" },
                            }
                        },
                    ])

                    return resolve({ error: false, data: listData })
                }

            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
}

exports.MODEL = new Model