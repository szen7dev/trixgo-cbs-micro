"use strict";

const BaseModel                         = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString, validateParamsObjectID }  = require('../../../tools/utils/utils');
const ObjectID                          = require('mongoose').Types.ObjectId;
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');
const { CF_ACTIONS_AUTH } 		        = require('../../auth/helper/auth.actions-constant');
const moment                            = require("moment");
/**
 * import inter-coll, exter-coll
 */
const FIN__CASH_FLOW_PLAN_COLL          = require('../database/fin.cash_flow_plan-coll');
const FINANCIAL_GENERAL_JOURNAL_COLL    = require('../../accounting/database/accounting.financial_general_journal-coll')
const ITEM__ACCOUNT_COLL                = require('../../item/database/item.account-coll')

const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index')
const { KEY_ERROR }                     = require('../../../tools/keys/index')

const XlsxPopulate                      = require('xlsx-populate');
const fs                                = require('fs');
const path                              = require('path');
const { uploadFileS3 }                  = require('../../../tools/s3');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {
    constructor() {
        super(FIN__CASH_FLOW_PLAN_COLL)
    }

    /**
     * Name: Insert
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    insert({ companyID, userID, fundaID, parentID, subtypeID, name, note, revenue, expense, fromDate, toDate, status }) {
        return new Promise(async (resolve) => {
            try {
                if(!name)
                    return resolve({ error: true, message: 'param_name_not_valid' })

                if(!parentID && !checkObjectIDs(fundaID))
                    return resolve({ error: true, message: 'param_fundaID_not_valid' })

                let dataInsert = { 
                    userCreate: userID, 
                    company: companyID, 
                    name,
                }
                
                if(fromDate & toDate){
                    // 1. Đưa fromDate về 00h:00m:00s:000ms
                    const start = new Date(fromDate);
                    start.setHours(0, 0, 0, 0);

                    // 2. Đưa toDate về 23h:59m:59s:999ms
                    const end = new Date(toDate);
                    end.setHours(23, 59, 59, 999);

                    dataInsert.fromDate = start
                    dataInsert.toDate = end
                }

                if(checkObjectIDs(fundaID)){
                    dataInsert.funda = fundaID
                }

                if(checkObjectIDs(subtypeID)){
                    dataInsert.subtype = subtypeID;
                }

                if(checkObjectIDs(parentID)){
                    dataInsert.parent = parentID
                }

                if(status){
                    dataInsert.status = Number(status);
                }

                if(note){
                    dataInsert.note = note;
                }

                if(!isNaN(revenue) && Number(revenue) >= 0){
                    dataInsert.revenue = revenue;
                }

                if(!isNaN(expense) && Number(expense) >= 0){
                    dataInsert.expense = expense;
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if(!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 });

                // Cập nhật lại phần tử cha
                if(checkObjectIDs(parentID)){
                    await this.updateValue({cashFlowID: parentID, userID})
                }

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Cập nhật giá trị khi chi tiết thay đổi
     * Author: Hiepnh
     * Date  : 14/2/2026
     */
    updateValue({ cashFlowID, userID }){
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(cashFlowID))
                    return resolve({ error: true, message: "Mã hiệu không đúng", keyError: "cashFlowID_invalid" });

                let dataUpdate = { 
                    userUpdate: userID,
                    modifyAt: Date.now(),
                }

                let listData = await FIN__CASH_FLOW_PLAN_COLL.aggregate([
                    {
                        $match: {
                            parent: ObjectID(cashFlowID),
                        }
                    },
                    {
                        $group: {
                            _id: { },
                            revenue: { $sum: "$revenue" },
                            expense: { $sum: "$expense" },
                            actualRevenue: { $sum: "$actualRevenue" },
                            actualExpense: { $sum: "$actualExpense" },
                        }
                    }
                ])

                if(listData && listData.length){
                    dataUpdate.revenue = Number(listData[0].revenue)
                    dataUpdate.expense = Number(listData[0].expense)
                    dataUpdate.actualRevenue = Number(listData[0].actualRevenue)
                    dataUpdate.actualExpense = Number(listData[0].actualExpense)
                }

                await FIN__CASH_FLOW_PLAN_COLL.findByIdAndUpdate(cashFlowID, dataUpdate, { new: true });

                return resolve({ error: false, message: 'Cập nhật thành công', status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Update
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    update({
        cashFlowID, fundaID, subtypeID, name, note, revenue, expense, fromDate, toDate, status, userID
    }){
        return new Promise(async (resolve) => {
            try {
                let dataUpdate = { 
                    userUpdate: userID,
                    modifyAt: Date.now(),
                }

                if(fromDate & toDate){
                    // 1. Đưa fromDate về 00h:00m:00s:000ms
                    const start = new Date(fromDate);
                    start.setHours(0, 0, 0, 0);

                    // 2. Đưa toDate về 23h:59m:59s:999ms
                    const end = new Date(toDate);
                    end.setHours(23, 59, 59, 999);

                    dataUpdate.fromDate = start
                    dataUpdate.toDate = end
                }

                if(name && name != '') {
                    dataUpdate.name = name;
                }

                if(note && note != ''){
                    dataUpdate.note = note;
                }

                if(!isNaN(revenue) && Number(revenue) >= 0){
                    dataUpdate.revenue = revenue;
                }

                if(!isNaN(expense) && Number(expense) >= 0){
                    dataUpdate.expense = expense;
                }

                if(status){
                    dataUpdate.status = Number(status);
                }

                if(checkObjectIDs(fundaID)){
                    dataUpdate.funda = fundaID;
                }

                if(checkObjectIDs(subtypeID)){
                    dataUpdate.subtype = subtypeID;
                }

                let infoAfterUpdate = await FIN__CASH_FLOW_PLAN_COLL.findByIdAndUpdate(cashFlowID, dataUpdate, { new: true })
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 })

                if(checkObjectIDs(infoAfterUpdate.parent)){
                    await this.updateValue({cashFlowID: infoAfterUpdate.parent, userID})
                }

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
    syncData({ userID, companyID, option, cashFlowID }){
        const that = this
        return new Promise(async (resolve) => {
            try {
                if(option == 1){
                    /**
                     * BA
                     * - Cần cập nhật theo Đơn vị cơ sở của Kế hoạch
                     */
                    let infoCash = await FIN__CASH_FLOW_PLAN_COLL.findById(cashFlowID)

                    let conditionProject = {}, conditionMatch = {}, conditionGroupDebit = {}, conditionGroupCredit = {}
                    let conditionDebitObj1 = {funda: ObjectID(infoCash.funda)}
                    let conditionDebitObj2 = {funda: ObjectID(infoCash.funda)}
                    let conditionCreditObj1 = {funda: ObjectID(infoCash.funda)}
                    let conditionCreditObj2 = {funda: ObjectID(infoCash.funda)}

                    // let conditionPopulate = {
                    //     path: '_id.subtype',
                    //     select: '_id name',
                    //     model: 'doctype'
                    // }

                    let arrRevenueID = [], arrExpenseID = []

                    let listAcc1 = await ITEM__ACCOUNT_COLL.find({ company: companyID, "name": { $regex: "^[57]" } }) // Doanh thu
                    .select('_id')
                    let listAcc2 = await ITEM__ACCOUNT_COLL.find({ company: companyID, "name": { $regex: "^[68]" } }) // Chi phí
                    .select('_id')
                    if(listAcc1){
                        arrRevenueID = listAcc1.map(item=>ObjectID(item._id))
                    }
                    if(listAcc2){
                        arrExpenseID = listAcc2.map(item=>ObjectID(item._id))
                    }

                    conditionDebitObj1.debit = {
                        $in: arrRevenueID
                    }
                    conditionCreditObj1.credit = {
                        $in: arrRevenueID
                    }

                    conditionDebitObj2.debit = {
                        $in: arrExpenseID
                    }
                    conditionCreditObj2.credit = {
                        $in: arrExpenseID
                    }
                    
                    conditionProject = {
                        forward: '$forward',
                        cancel: '$cancel',
                        funda: 1,
                        date: 1,
                        amount: 1,
                        customerDebit: 1,
                        customerCredit: 1,
                        subtype: 1,
                        credit: 1,
                        subtype: 1,
                        parentSubtype: 1,
                    }

                    conditionMatch = {
                        "forward": 0,
                        "cancel": 0,
                        "date": {
                            $gte: moment(infoCash.fromDate).toDate(),
                            $lte: moment(infoCash.toDate).toDate(),
                        }
                    }

                    conditionGroupDebit = {
                        _id: { subtype: "$subtype" },
                        amount: { $sum: "$amount" }
                    }
                    conditionGroupCredit = {
                        _id: { subtype: "$subtype" },
                        amount: { $sum: "$amount" }
                    }

                    let listData1 = await FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                        {
                            $facet: {
                                _debit:[
                                    {
                                        $match: conditionDebitObj1
                                    },
                                    {
                                        $project: conditionProject
                                    },
                                    {
                                        $match: conditionMatch
                                    },
                                    {
                                        $group: conditionGroupDebit
                                    },
                                ],
                                _credit:[
                                    {
                                        $match: conditionCreditObj1
                                    },
                                    {
                                        $project: conditionProject
                                    },
                                    {
                                        $match: conditionMatch
                                    },
                                    {
                                        $group: conditionGroupCredit
                                    },
                                ],

                            }
                        }
                    ])

                    let listData2 = await FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                        {
                            $facet: {
                                _debit:[
                                    {
                                        $match: conditionDebitObj2
                                    },
                                    {
                                        $project: conditionProject
                                    },
                                    {
                                        $match: conditionMatch
                                    },
                                    {
                                        $group: conditionGroupDebit
                                    },
                                ],
                                _credit:[
                                    {
                                        $match: conditionCreditObj2
                                    },
                                    {
                                        $project: conditionProject
                                    },
                                    {
                                        $match: conditionMatch
                                    },
                                    {
                                        $group: conditionGroupCredit
                                    },
                                ],

                            }
                        }
                    ])

                    // await FINANCIAL_GENERAL_JOURNAL_COLL.populate(listData1[0]._debit, conditionPopulate)
                    // await FINANCIAL_GENERAL_JOURNAL_COLL.populate(listData1[0]._credit, conditionPopulate)
                    // await FINANCIAL_GENERAL_JOURNAL_COLL.populate(listData2[0]._debit, conditionPopulate)
                    // await FINANCIAL_GENERAL_JOURNAL_COLL.populate(listData2[0]._credit, conditionPopulate)

                    // console.log(listData1[0]._debit)
                    // console.log(listData1[0]._credit)
                    // console.log(listData2[0]._debit)
                    // console.log(listData2[0]._credit)

                    let listData = await FIN__CASH_FLOW_PLAN_COLL.find({parent: cashFlowID}).select('name subtype parentSubtype')
                    // console.log(listData)

                    const revenueMap = {};
                    // 1. Cộng các khoản doanh thu từ _credit
                    listData1[0]?._credit?.forEach(item => {
                        if (item._id?.subtype) {
                            const subID = item._id.subtype.toString();
                            revenueMap[subID] = (revenueMap[subID] || 0) + item.amount;
                        }
                    });

                    // 2. TRỪ đi các khoản giảm trừ doanh thu từ _debit
                    listData1[0]?._debit?.forEach(item => {
                        if (item._id?.subtype) {
                            const subID = item._id.subtype.toString();
                            // Trừ trực tiếp vào giá trị đã có trong Map
                            revenueMap[subID] = (revenueMap[subID] || 0) - item.amount;
                        }
                    });

                    const expenseMap = {};
                    // 1. Cộng các khoản chi phí phát sinh từ _debit
                    listData2[0]?._debit?.forEach(item => {
                        if (item._id?.subtype) {
                            const subID = item._id.subtype.toString();
                            expenseMap[subID] = (expenseMap[subID] || 0) + item.amount;
                        }
                    });

                    // 2. TRỪ đi các khoản giảm chi phí (bút toán ngược) từ _credit
                    listData2[0]?._credit?.forEach(item => {
                        if (item._id?.subtype) {
                            const subID = item._id.subtype.toString();
                            // Trừ trực tiếp để có con số chi phí thuần
                            expenseMap[subID] = (expenseMap[subID] || 0) - item.amount;
                        }
                    })

                    for (const item of listData) {
                        // QUAN TRỌNG: Phải dùng item.subtype để lấy giá trị từ Map
                        const subID = item.subtype?.toString();
                        
                        let revenue = revenueMap[subID] || 0;
                        let expense = expenseMap[subID] || 0;

                        // console.log(`Checking Subtype: ${subID} -> Revenue: ${revenue}, Expense: ${expense}`);

                        await FIN__CASH_FLOW_PLAN_COLL.findByIdAndUpdate(item._id, {
                            actualRevenue: revenue, 
                            actualExpense: expense,
                        }, { new: true });
                    }

                    await this.updateValue({cashFlowID: cashFlowID, userID})

                    return resolve({ error: false, message: 'Đồng bộ thành công' })
                }else if(option == 2){
                    return resolve({ error: false, message: 'Copy thành công' })
                }
                
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 })
            }
        })
    }

    /**
     * Name: Get info
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getInfo({ cashFlowID,
        select, populates }){
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(cashFlowID))
                    return resolve({ error: true, message: 'param_invalid' });

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

                let info = await FIN__CASH_FLOW_PLAN_COLL.findById(cashFlowID)
                    .select(select)
                    .populate(populates)
                    .lean();

				if (!info) return resolve({ error: true, message: 'cannot_get' });

                return resolve({ error: false, data: info });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name  : Get list
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getList({ userID, companyID, parentID,
        keyword, limit = 50, lastestID, select, populates= {}, sortKey }) {
        return new Promise(async (resolve) => {
            try {
                 let sortBy;
                 let conditionObj = {};
                 let keys = ['createAt__-1', '_id__-1'];

                if(limit > 20){
                    limit = 20
                } else{
                    limit = +limit;
                }

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

                if (sortKey && typeof sortKey === 'string') {
                    if (!IsJsonString(sortKey))
                        return resolve({ error: true, message: 'Request params sortKey invalid', status: 400 });

                    keys = JSON.parse(sortKey);
                }

                if(checkObjectIDs(parentID)){
                    conditionObj.parent = parentID
                } else{
                    conditionObj.company = companyID
                    conditionObj.parent = { $exists: false }
                }

                if(keyword){
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = RegExp(keyword, 'i');
                }

                // console.log(conditionObj)
                let conditionObjOrg = { ...conditionObj };

                if(lastestID && checkObjectIDs(lastestID)){
					let infoData = await FIN__CASH_FLOW_PLAN_COLL.findById(lastestID);
					if(!infoData)
						return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
					if(!dataPagingAndSort || dataPagingAndSort.error)
						return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
					sortBy       = dataPagingAndSort.data.sort;
				} else{
                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy       = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await FIN__CASH_FLOW_PLAN_COLL.find(conditionObj)
                    .limit(limit+1)
                    .sort(sortBy)
                    .select(select)
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

                let totalRecord = await FIN__CASH_FLOW_PLAN_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit,
                    totalRecord,
                    totalPage,
                    nextCursor,
                }, status: 200 });

            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /*
     * Name: Gom nhóm theo thuộc tính
     * Author: Hiepnh
     * Date: 17/04/2022
     */
    getAmountByProperty({ companyID, parentID, projectID, contractID, outin, year, type, property, option, real, ctx }){
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * Tham số của option:
                 * 1-Tổng hợp các công ty mà user được quyền truy cập báo cáo quản trị
                 * 2-Tổng hợp của công ty user
                 * 3-Tổng hợp theo kế hoạch cụ thể
                 * 4-Tổng hợp theo dự án
                 * 5-Tổng hợp theo hợp đồng
                 */
                let conditionObj = {parent: { $exists: true, $ne: null }}
                let conditionGroup = {}, conditionObjYear = {}, conditionPopulate = {}, sortBy = {"_id.realValue": -1}

                let conditionProject = {
                    year : {$year : "$date"},
                    month : {$month : "$date"},
                    parent: 1,
                    company: 1,
                    value: 1,
                    realValue: 1,
                    type: 1,
                    property: 1,
                    outin: 1,
                }

                if(outin && !isNaN(outin)){
                    conditionObj.outin = Number(outin)
                }

                if(real && Number(real) === 1){
                    conditionProject = {
                        year : {$year : "$realDate"},
                        month : {$month : "$realDate"},
                        parent: 1,
                        company: 1,
                        value: 1,
                        realValue: 1,
                        type: 1,
                        property: 1,
                        outin: 1,
                    }
                }

                if (isNaN(type) || isNaN(property) || isNaN(Number(option)) || ![1,2,3,4,5].includes(Number(option)))
                    return resolve({ error: true, message: "Tham số type|property|option không hợp lệ", keyError: "option_invalid" })

                // Cấu hình gom nhóm mặc định
                conditionGroup = {
                    _id: { outin: "$outin" },
                    value: { $sum: "$value" },
                    realValue: { $sum: "$realValue" }
                }

                // 1-Tổng hợp các công ty mà user được quyền truy cập báo cáo quản trị
                if(Number(option) === 1){
                    console.log('1-Tổng hợp các công ty mà user được quyền truy cập báo cáo quản trị')
                    let listCompany = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.APP_MENU_GET_LIST_COMPANY}`, {
                        appID: "5dfe4bc751dc622100bb9d8a", menuID: "623f2465e998e94feda0cdaa", type: "1"
                    })

                    console.log(listCompany)

                    if(listCompany){
                        let listActiveParent = await FIN__CASH_FLOW_PLAN_COLL.find({
                            type: Number(type),
                            property: Number(property),
                            parent: {$exists: false}, // Không lấy các phần tử cha-Kế hoạch tổng
                            company: {$in: listCompany.data.map(item=>item._id.company._id)}
                        })

                        conditionObj.parent = {$in: listActiveParent.map(item=>item._id)}

                        conditionGroup = {
                            _id: { outin: "$outin", company: "$company" },
                            value: { $sum: "$value" },
                            realValue: { $sum: "$realValue" }
                        }
                    }
                }

                // 2-Tổng hợp của công ty user
                if(Number(option) === 2){
                    console.log('2-Tổng hợp của công ty user')
                    let listActiveParent = await FIN__CASH_FLOW_PLAN_COLL.find({
                        type: Number(type),
                        property: Number(property),
                        parent: {$exists: false},// Không lấy các phần tử cha-Kế hoạch tổng
                        company: companyID
                    })
                    // console.log(listActiveParent)

                    conditionObj.parent = {$in: listActiveParent.map(item=>item._id)}
                }

                // 3-Tổng hợp theo kế hoạch cụ thể
                if(Number(option) === 3 && parentID && checkObjectIDs(parentID)){
                    console.log('3-Tổng hợp theo kế hoạch cụ thể')
                    conditionObj.parent = ObjectID(parentID)
                }

                // 4-Tổng hợp theo dự án
                if(Number(option) === 4 && projectID && checkObjectIDs(projectID)){
                    console.log('4-Tổng hợp theo dự án')
                    conditionObj.project = ObjectID(projectID)
                }

                // 5-Tổng hợp theo hợp đồng
                if(Number(option) === 5 && contractID && checkObjectIDs(contractID)){
                    console.log('5-Tổng hợp theo hợp đồng')
                    conditionObj.contract = ObjectID(contractID)
                }

                // Thống kê theo biểu đồ (tháng/năm)
                if(!isNaN(year) && Number(year) > 0){
                    conditionObjYear = {
                        "year": Number(year),
                    }

                    conditionGroup = {
                        _id: {outin: "$outin", month: "$month", year: "$year" },
                        value: { $sum: "$value" },
                        realValue: { $sum: "$realValue" }
                    }
                }else{
                    conditionGroup = {
                        _id: {outin: "$outin", month: "$month", year: "$year" },
                        value: { $sum: "$value" },
                        realValue: { $sum: "$realValue" }
                    }
                }

                // console.log(conditionObj)
                // console.log(conditionProject)
                // console.log(conditionGroup)

                let listData = await FIN__CASH_FLOW_PLAN_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $project : conditionProject
                    },
                    {
                        $match: conditionObjYear
                    },
                    {
                        $group: conditionGroup
                    },
                    {
                        $sort: sortBy
                    }
                ])

                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Dev: HiepNH
     * Func: Tải excel
     * Date: 14/2/2026
     */
    exportExcel({ option, companyID, parentID }) {
        return new Promise(async resolve => {
            try {
                if(!option){
                   // Modify the workbook.
                    XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/accounting_cashflow_report.xlsx')))
                    .then(async workbook => {
                        // workbook.sheet("BaoCao1").row(2).cell(1).value(infoParent.name);
                        // workbook.sheet("BaoCao2").row(2).cell(1).value(infoParent.name);

                        // workbook.sheet("BaoCao1").row(2).cell(1).value(`Từ: ${moment(infoParent.fromDate).format('DD/MM/YYYY')}-Đến: ${moment(infoParent.toDate).format('DD/MM/YYYY')}`);
                        // workbook.sheet("BaoCao2").row(2).cell(1).value(`Từ: ${moment(infoParent.fromDate).format('DD/MM/YYYY')}-Đến: ${moment(infoParent.toDate).format('DD/MM/YYYY')}`);

                        // var i = 4;
                        // listData?.forEach((item, index) => {
                        //     workbook.sheet("BaoCao1").row(i).cell(2).value(item?.funda?.name);
                        //     workbook.sheet("BaoCao1").row(i).cell(3).value(Number(item.revenue))
                        //     workbook.sheet("BaoCao1").row(i).cell(4).value(Number(item.expense))
                        //     workbook.sheet("BaoCao1").row(i).cell(5).value(Number(item.profit))
                        //     workbook.sheet("BaoCao1").row(i).cell(6).value(item.note)

                        //     workbook.sheet("BaoCao2").row(2).cell(i+2).value(`${item?.funda?._id}`);
                        //     workbook.sheet("BaoCao2").row(3).cell(i+2).value(item?.funda?.name)

                        //     i++
                        // })

                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `BaoCaoKeHoach_${now.getTime()}.xlsx`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                        await workbook.toFileAsync(pathWriteFile);
                        const result = await uploadFileS3(pathWriteFile, fileName);

                        fs.unlinkSync(pathWriteFile);
                        return resolve({ error: false, data: result?.Location, status: 200 });
                    })
                }else{
                    return resolve({ error: true, message: 'Bạn không có quyền', status: 500 })
                }
            } catch (error) {
                // console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;