"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString }  = require('../../../tools/utils/utils');
const _isValid                          = require('mongoose').Types.ObjectId;
const ObjectID                          = require('mongoose').Types.ObjectId;

/**
 * DOMAIN AND ACTIONS
 */
// const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
// const { CF_ACTIONS_ITEM } 		    = require('../../item/helper/item.actions-constant');

/**
 * TOOLS
 */
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');

/**
 * COLLECTIONS
 */
const TIMESHEET__EXPERT_SALARY_COLL     = require('../database/timesheet.expert_salary-coll')
const TIMESHEET__EXPERT_TIMESHEET_COLL  = require('../database/timesheet.expert_timesheet-coll')
const AUTH__USER_COLL                   = require('../../auth/database/auth.user-coll');
// const { forInRight } = require('lodash');

class Model extends BaseModel {

    constructor() {
        super(TIMESHEET__EXPERT_SALARY_COLL);
    }

    /**
     * Name: Insert expert timesheet
     * Author: HiepNH
     * Code: 22/11/2023
     */
    insert({ userCreate, companyID, projectID, humanID, name, date, type, note, salary, reward, punishment, advance, remaining, paid }) {
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

                if(note){
                    dataInsert.note = note;
                }

                if(salary){
                    dataInsert.salary = Number(salary);
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
                if(remaining){
                    dataInsert.remaining = Number(remaining);
                }
                if(paid){
                    dataInsert.paid = Number(paid);
                }
                // console.log(dataInsert)

                let infoAfterInsert = await this.insertData(dataInsert)
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert" })
                    // console.log(infoAfterInsert)

                /**
                 * TẠO CHI TIẾT BẢNG LƯƠNG
                 * - Company
                 * - Project
                 * - Parent
                 */
                let listHuman = await AUTH__USER_COLL.find({company: companyID}).select('fullname')
                // console.log(listHuman)
                for(const item of listHuman){
                    let dataInsertDetail = {
                        userCreate,
                        name: 'Default',
                        admins: [userCreate],
                        members: [userCreate],
                        human: item._id,
                        parent: infoAfterInsert._id,
                        company: infoAfterInsert.company,
                        project: infoAfterInsert.project,
                        date: infoAfterInsert.date,
                        type: infoAfterInsert.type,
                    }

                    await this.insertData(dataInsertDetail)
                }

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Update expert timesheet
     * Author: HiepNH
     * Code: 22/11/2023
     */
    update({ expertSalaryID, admins, members, userID, status, projectID, humanID, name, date, type, note, salary, reward, punishment, advance, remaining, paid, companyID  }){
        // console.log({ expertSalaryID, admins, members, userID, status, projectID, humanID, name, date, type, note, salary, reward, punishment, advance, remaining, paid })
        return new Promise(async (resolve) => {
            const that = this
            try {
                let infoSalaryID = await TIMESHEET__EXPERT_SALARY_COLL.findById(expertSalaryID);
                // console.log(infoSalaryID)
                if(!infoSalaryID) {
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

                if(checkObjectIDs(projectID)){
                    dataUpdate.project = projectID;
                }

                if(checkObjectIDs(humanID)){
                    dataUpdate.human = humanID;
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

                if(status){
                    dataUpdate.status = status;
                }

                if(note){
                    dataUpdate.note = note;
                }

                if(!isNaN(salary) && Number(infoSalaryID.salary) != Number(salary)){
                    dataUpdate.salary = salary;
                }
                if(!isNaN(reward) && Number(infoSalaryID.reward) != Number(reward)){
                    dataUpdate.reward = reward;
                }
                if(!isNaN(punishment) && Number(infoSalaryID.punishment) != Number(punishment)){
                    dataUpdate.punishment = punishment;
                }
                if(!isNaN(advance) && Number(infoSalaryID.advance) != Number(advance)){
                    dataUpdate.advance = advance;
                }
                if(!isNaN(salary) || !isNaN(reward) || !isNaN(punishment) || !isNaN(advance)){
                    dataUpdate.remaining = Number(salary) + Number(reward) - Number(punishment) - Number(advance)
                }

                if(!isNaN(paid) && Number(infoSalaryID.paid) != Number(paid)){
                    dataUpdate.paid = paid;
                }
                // console.log(dataUpdate)

                const adminsID = [...infoSalaryID.admins?.map(item => item?.toString()), infoSalaryID.userCreate?.toString()];

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

                let infoAfterUpdate = await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndUpdate(expertSalaryID, dataUpdate, { new: true })
                // console.log(infoAfterUpdate)

                if(!infoAfterUpdate) {
                    return resolve({
                        error: true,
                        message: "Cannot update",
                        keyError: "cannot_update",
                    });
                }

                // Cập nhật giá trị vào Bảng lương
                if(infoAfterUpdate.parent){
                    await that.updateValue( {expertSalaryID: infoAfterUpdate.parent, userID })
                }else{
                    // Cập nhật bảng chấm công vào bảng lương
                    await that.updateValueTimesheet( {expertSalaryID, userID, companyID })

                    // Cập nhật bảng lương
                    await that.updateValue( {expertSalaryID, userID })
                }

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    // Cập nhật chi tiết lương vào bảng lương
    updateValue({ 
        expertSalaryID, userID
    }){ 
        return new Promise(async (resolve) => {
            try {
                let dataUpdate = { userUpdate: userID, modifyAt: new Date() }

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
                            reward: { $sum:"$reward" },
                            punishment: { $sum:"$punishment" },
                            advance: { $sum:"$advance" },
                            remaining: { $sum:"$remaining" },
                            paid: { $sum:"$paid" },
                        }
                    },
                ])
                
                if(listData[0]){
                    dataUpdate.salary = Number(listData[0].salary)
                    dataUpdate.reward = Number(listData[0].reward)
                    dataUpdate.punishment = Number(listData[0].punishment)
                    dataUpdate.advance = Number(listData[0].advance)
                    dataUpdate.remaining = Number(listData[0].remaining)
                    dataUpdate.paid = Number(listData[0].paid)
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

    // Cập nhật bảng chấm công vào bảng lương theo từng tháng
    updateValueTimesheet({ 
        expertSalaryID, userID, companyID
    }){ 
        return new Promise(async (resolve) => {
            try {
                let infoSalary = await TIMESHEET__EXPERT_SALARY_COLL.findById(expertSalaryID)
                if(!infoSalary)
                    return resolve({ error: true, message: "can't_get_info", status: 403 });

                let month = Number(infoSalary.date.getMonth()) + 1
                let year = infoSalary.date.getFullYear()
                // console.log({month,year})

                // Tổng hợp từ Bảng chấm công
                let listData1 = await TIMESHEET__EXPERT_TIMESHEET_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            parent: { $exists: true, $ne: null },
                            assignee: { $exists: true, $ne: null }
                        }
                    },
                    {
                        $project: {
                            year : {$year : "$date"},
                            month : {$month : "$date"},
                            assignee: 1,
                            hours: 1,
                            amount: 1
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

                for(const item of listData1){
                    // let infoUserInSalary =  await TIMESHEET__EXPERT_SALARY_COLL.findOne({
                    let infoUserInSalary =  await TIMESHEET__EXPERT_SALARY_COLL.findOneAndUpdate({
                        company: companyID, 
                        human: item._id.assignee,
                        $where: `return this.date.getMonth() === ${Number(month - 1)} && this.date.getFullYear() === ${Number(year)}`

                    }, 
                        {
                            salary: Number(item.amount)
                        }, { new: true }
                    );

                    // console.log(infoUserInSalary)
                }

                return resolve({ error: false, status: 200 });
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
                if(!checkObjectIDs(expertSalaryID))
                    return resolve({ error: true, message: 'Request params expertSalaryID invalid', status: 400 });

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

                let infoAterGet = await TIMESHEET__EXPERT_SALARY_COLL.findOne({
                    _id: expertSalaryID,
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
     * Author: Depv
     * Code  :
     */
    getList({
        parentID, userID,
        keyword, limit = 10, lastestID, select, populates= {} }) {
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

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
					let infoData = await TIMESHEET__EXPERT_SALARY_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

					let keys	 = ['createAt__1', '_id__1'];
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });

					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}

                // console.log({ limit, sortBy, select })
                let infoDataAfterGet = await TIMESHEET__EXPERT_SALARY_COLL.find(conditionObj)
                    .select(select)
                    .limit(+limit+1)
                    .sort(sortBy)
                    .populate(populates)
                    .lean();

                    // console.log(infoDataAfterGet)

                if(!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor	= null;
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
        // console.log({ userID, option, year, companyID, assigneeID })
        return new Promise(async resolve => {
            try {
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
                                reward: 1,
                                punishment: 1,
                                advance: 1,
                                remaining: 1,
                                paid: 1,
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
                                salary: { $sum: { $subtract: [ { $add: [ "$salary", "$reward" ] }, "$punishment" ] } },
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
                                reward: 1,
                                punishment: 1,
                                advance: 1,
                                remaining: 1,
                                paid: 1,
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
                                // examTotal: { $sum:"$examTotal" },
                                // totalAmount: { $sum: { $multiply: [ "$salary", "$reward" ] } },
                                // totalAmount2: { $sum: { $add: [ "$salary", "$reward" ] } },
                                salary: { $sum: { $subtract: [ { $add: [ "$salary", "$reward" ] }, "$punishment" ] } },
                                // advance: { $sum: "$advance" },
                                // salary: { $sum:"$salary" },
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
                                reward: 1,
                                punishment: 1,
                                advance: 1,
                                remaining: 1,
                                paid: 1,
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
                                reward: { $sum:"$reward" },
                                punishment: { $sum:"$punishment" },
                                advance: { $sum:"$advance" },
                                remaining: { $sum:"$remaining" },
                                paid: { $sum:"$paid" },
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
                                reward: 1,
                                punishment: 1,
                                advance: 1,
                                remaining: 1,
                                paid: 1,
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
                                salary: { $sum: { $subtract: [ { $add: [ "$salary", "$reward" ] }, "$punishment" ] } },
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
                                reward: 1,
                                punishment: 1,
                                advance: 1,
                                remaining: 1,
                                paid: 1,
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
                                salary: { $sum: { $subtract: [ { $add: [ "$salary", "$reward" ] }, "$punishment" ] } },
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
                                reward: 1,
                                punishment: 1,
                                advance: 1,
                                remaining: 1,
                                paid: 1,
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
                                salary: { $sum: { $subtract: [ { $add: [ "$salary", "$reward" ] }, "$punishment" ] } },
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
                                reward: 1,
                                punishment: 1,
                                advance: 1,
                                remaining: 1,
                                paid: 1,
                            }
                        },
                        {
                            $group: {
                                _id: { },
                                salary: { $sum:"$salary" },
                                reward: { $sum:"$reward" },
                                punishment: { $sum:"$punishment" },
                                advance: { $sum:"$advance" },
                                remaining: { $sum:"$remaining" },
                                paid: { $sum:"$paid" },
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