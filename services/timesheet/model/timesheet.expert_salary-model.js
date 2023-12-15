"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString, validateParamsObjectID }  = require('../../../tools/utils/utils');
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
const AUTH__COMPANY_COLL                = require('../../auth/database/auth.company-coll')
const AUTH__USER_COLL                   = require('../../auth/database/auth.user-coll')
const FNB_MISTAKE_COLL                  = require('../../fnb/database/fnb.mistake-coll')
const ITEM__DEPARTMENT_COLL             = require('../../item/database/item.department-coll')

const AUTH__APP_USER = require('../../auth/model/auth.app_users').MODEL

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

                let infoCompany = await AUTH__COMPANY_COLL.findById(companyID)

                //__________Khai báo và validate dữ liệu
                let dataInsert = {
                    company: companyID,
                    convertFactor: infoCompany.convertFactor,
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

                let infoAfterInsert = await this.insertData(dataInsert)
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "cannot_insert" })

                /**
                 * TẠO CHI TIẾT BẢNG LƯƠNG (cho user đang hoạt động)
                 */
                let listHuman = await AUTH__USER_COLL.find({ company: companyID, status: 1 }).select('fullname department')
                for(const item of listHuman){
                    let dataInsertDetail = {
                        userCreate,
                        name: 'Default',
                        admins: [userCreate],
                        members: [userCreate],
                        human: item._id,
                        parent: infoAfterInsert._id,
                        company: infoAfterInsert.company,
                        convertFactor: infoAfterInsert.convertFactor,
                        project: item.department,
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
    update({ expertSalaryID, admins, members, userID, status, projectID, humanID, name, date, type, note, salary, reward, punishment, advance, remaining, paid, revenueBonus, mealAllowance, insurance, pitax, companyID  }){
        // console.log({ expertSalaryID, admins, members, userID, status, projectID, humanID, name, date, type, note, salary, reward, punishment, advance, remaining, paid, revenueBonus, mealAllowance, insurance, pitax })
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

                if(name){
                    dataUpdate.name = name;
                }

                if(date){
                    dataUpdate.date = date;
                }

                if(status){
                    dataUpdate.status = status;
                }

                if(note){
                    dataUpdate.note = note;
                }

                if(!isNaN(salary) && Number(infoSalary.salary) != Number(salary)){
                    dataUpdate.salary = salary;
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
                if(!isNaN(advance) && Number(infoSalary.advance) != Number(advance)){
                    dataUpdate.advance = advance;
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

                if(!isNaN(salary) || !isNaN(reward) || !isNaN(revenueBonus) || !isNaN(mealAllowance) || !isNaN(punishment) || !isNaN(insurance) || !isNaN(pitax) || !isNaN(advance)){
                    dataUpdate.remaining = Number(salary) + Number(reward * infoSalary.convertFactor) + Number(revenueBonus) + Number(mealAllowance) - Number(punishment * infoSalary.convertFactor) - Number(insurance) - Number(pitax) - Number(advance)
                }

                if(!isNaN(paid) && Number(infoSalary.paid) != Number(paid)){
                    dataUpdate.paid = paid;
                }
                // console.log(dataUpdate)

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
                if(!infoAfterUpdate) {
                    return resolve({
                        error: true,
                        message: "Cannot update",
                        keyError: "cannot_update",
                    });
                }

                // Cập nhật giá trị vào Bảng lương
                if(infoAfterUpdate.parent){
                    /**
                     * CẬP NHẬT CHI TIẾT LƯƠNG
                     */
                    await that.updateValue( {expertSalaryID: infoAfterUpdate.parent, userID })
                }else{
                    /**
                     * CẬP NHẬT BẢNG LƯƠNG CHA
                     */
                    // Cập nhật hệ số chuyển đổi KPI sang giá trị
                    let infoCompany = await AUTH__COMPANY_COLL.findById(companyID)
                    await TIMESHEET__EXPERT_SALARY_COLL.updateMany({ parent: expertSalaryID }, { $set: { convertFactor: infoCompany.convertFactor, }})

                    // Cập nhật bảng chấm công vào bảng lương
                    await that.updateValueTimesheet({ expertSalaryID, userID, companyID })

                    // Cập nhật KPI vào bảng lương
                    await that.updateValueKpi( { expertSalaryID, userID, companyID })

                    // Cập nhật chi tiết lương vào bảng lương
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
                            revenueBonus: { $sum:"$revenueBonus" },
                            mealAllowance: { $sum:"$mealAllowance" },
                            insurance: { $sum:"$insurance" },
                            pitax: { $sum:"$pitax" },
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
                    dataUpdate.revenueBonus = Number(listData[0].revenueBonus)
                    dataUpdate.mealAllowance = Number(listData[0].mealAllowance)
                    dataUpdate.insurance = Number(listData[0].insurance)
                    dataUpdate.pitax = Number(listData[0].pitax)
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

    // Cập nhật Bảng chấm công => Bảng lương
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

                for(const item of listData1){
                    await TIMESHEET__EXPERT_SALARY_COLL.findOneAndUpdate({
                        company: companyID, 
                        parent: { $exists: true, $ne: null },
                        human: item._id.assignee,
                        $where: `return this.date.getMonth() === ${Number(month - 1)} && this.date.getFullYear() === ${Number(year)}`

                    }, 
                        {
                            salary: Number(item.amount)
                        }, { new: true }
                    )
                }

                return resolve({ error: false, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

     // Cập nhật KPI => Bảng lương
     updateValueKpi({ 
        expertSalaryID, userID, companyID
    }){ 
        return new Promise(async (resolve) => {
            try {
                let infoSalary = await TIMESHEET__EXPERT_SALARY_COLL.findById(expertSalaryID)
                if(!infoSalary)
                    return resolve({ error: true, message: "can't_get_info", status: 403 })

                let month = Number(infoSalary.date.getMonth()) + 1
                let year = infoSalary.date.getFullYear()

                let listData1 = await FNB_MISTAKE_COLL.aggregate([
                    {
                        $match: {
                            company: ObjectID(companyID),
                            executor: { $exists: true, $ne: null }
                        }
                    },
                    {
                        $project: {
                            year : {$year : "$createAt"},
                            month : {$month : "$createAt"},
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
                // console.log({listData1})

                for(const item of listData1){
                    // await TIMESHEET__EXPERT_SALARY_COLL.findOneAndUpdate({
                    //     company: companyID, 
                    //     parent: { $exists: true, $ne: null },
                    //     human: item._id.executor,
                    //     $where: `return this.date.getMonth() === ${Number(month - 1)} && this.date.getFullYear() === ${Number(year)}`
                    // }, 
                    //     {
                    //         reward: Number(item.bonus),
                    //         punishment: Number(item.amount),
                    //     }, { new: true }
                    // )

                    let info = await TIMESHEET__EXPERT_SALARY_COLL.findOne({
                        company: companyID, 
                        parent: { $exists: true, $ne: null },
                        human: item._id.executor,
                        $where: `return this.date.getMonth() === ${Number(month - 1)} && this.date.getFullYear() === ${Number(year)}`
                    }) 
                    // console.log(info) 
                    
                    let dataUpdate =  {
                        reward: Number(item.bonus),
                        punishment: Number(item.amount),
                    }

                    dataUpdate.remaining = Number(info.salary) + Number(info.reward * info.convertFactor) + Number(info.revenueBonus) + Number(info.mealAllowance) - Number(info.punishment * info.convertFactor) - Number(info.insurance) - Number(info.pitax) - Number(info.advance)

                    let infoAfterUpdate = await TIMESHEET__EXPERT_SALARY_COLL.findByIdAndUpdate(info._id, dataUpdate, { new: true })
                    // console.log(infoAfterUpdate) 
                }

                return resolve({ error: false, status: 200 })
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 })
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

                let infoAterGet = await TIMESHEET__EXPERT_SALARY_COLL.findById(expertSalaryID)
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
        sortOption, parentID, userID,
        keyword, limit = 10, lastestID, select, populates= {}, companyID, departmentsID }) {
        // console.log({sortOption, parentID, userID,
        //     keyword, limit, lastestID, select, populates, companyID, departmentsID})
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
                let keys	 = ['createAt__1', '_id__1'];

                if(sortOption == 1){
                    keys	 = ['date__-1', '_id__-1'];
                }

                const validation = validateParamsObjectID({
                    departmentsID           : { value: departmentsID, isRequire: false },
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
                    // Danh sách các phòng ban mà user được quyền truy cập
                    let listDepartment = await ITEM__DEPARTMENT_COLL.find({company:companyID, members: { $in: [userID] }}).select('_id name')

					conditionObj.parent = parentID
					conditionObj.project = { $in: listDepartment.map(item=>item.id) }

                    if(departmentsID && departmentsID.length){
                        conditionObj.project = { $in: departmentsID }
                    }

                    if(keyword){
                        keyword = keyword.split(" ");
                        keyword = '.*' + keyword.join(".*") + '.*';

                        let listUser = await AUTH__USER_COLL.find({fullname: new RegExp(keyword, 'i')})
                        .select('_id')
                        .limit(20)
                        conditionObj.human = {$in: listUser.map(item=>item._id)}
                    }
				}else{
                    let getInfoUserApp = await AUTH__APP_USER.checkPermissionsAccessApp({ 
                        appID: "61e049cffdebf77b072d1b14", 
                        userID
                     })
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
                        keyword = keyword.split(" ");
                        keyword = '.*' + keyword.join(".*") + '.*';
                        conditionObj.name =  new RegExp(keyword, 'i')
                    }
                }
                // console.log(conditionObj)

                let conditionObjOrg = { ...conditionObj }

                // PHÂN TRANG KIỂU MỚI
				if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await TIMESHEET__EXPERT_SALARY_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });

					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				}else{
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
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
                                revenueBonus: 1,
                                mealAllowance: 1,
                                insurance: 1,
                                pitax: 1,
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
                                salary: { $sum: { $subtract: [ { $add: ["$salary","$revenueBonus","$reward","$mealAllowance"] }, {$add: ["$punishment","$insurance","$pitax"]} ] } },
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
                                revenueBonus: 1,
                                mealAllowance: 1,
                                insurance: 1,
                                pitax: 1,
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
                                // salary: { $sum: { $subtract: [ { $add: [ "$salary", "$reward" ] }, "$punishment" ] } },
                                salary: { $sum: { $subtract: [ { $add: ["$salary","$revenueBonus","$reward","$mealAllowance"] }, {$add: ["$punishment","$insurance","$pitax"]} ] } },
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
                                revenueBonus: 1,
                                mealAllowance: 1,
                                insurance: 1,
                                pitax: 1,
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
                                revenueBonus: { $sum:"$revenueBonus" },
                                mealAllowance: { $sum:"$mealAllowance" },
                                insurance: { $sum:"$insurance" },
                                pitax: { $sum:"$pitax" },
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
                                revenueBonus: 1,
                                mealAllowance: 1,
                                insurance: 1,
                                pitax: 1,
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
                                // salary: { $sum: { $subtract: [ { $add: [ "$salary", "$reward" ] }, "$punishment" ] } },
                                salary: { $sum: { $subtract: [ { $add: ["$salary","$revenueBonus","$reward","$mealAllowance"] }, {$add: ["$punishment","$insurance","$pitax"]} ] } },
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
                                revenueBonus: 1,
                                mealAllowance: 1,
                                insurance: 1,
                                pitax: 1,
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
                                // salary: { $sum: { $subtract: [ { $add: [ "$salary", "$reward" ] }, "$punishment" ] } },
                                salary: { $sum: { $subtract: [ { $add: ["$salary","$revenueBonus","$reward","$mealAllowance"] }, {$add: ["$punishment","$insurance","$pitax"]} ] } },
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
                                revenueBonus: 1,
                                mealAllowance: 1,
                                insurance: 1,
                                pitax: 1,
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
                                // salary: { $sum: { $subtract: [ { $add: [ "$salary", "$reward" ] }, "$punishment" ] } },
                                salary: { $sum: { $subtract: [ { $add: ["$salary","$revenueBonus","$reward","$mealAllowance"] }, {$add: ["$punishment","$insurance","$pitax"]} ] } },
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
                                revenueBonus: 1,
                                mealAllowance: 1,
                                insurance: 1,
                                pitax: 1,
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
                                revenueBonus: { $sum:"$revenueBonus" },
                                mealAllowance: { $sum:"$mealAllowance" },
                                insurance: { $sum:"$insurance" },
                                pitax: { $sum:"$pitax" },
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