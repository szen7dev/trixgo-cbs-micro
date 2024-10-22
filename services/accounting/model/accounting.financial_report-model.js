"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const ObjectID                          = require('mongoose').Types.ObjectId;
const stringUtils					    = require('../../../tools/utils/string_utils');
const { checkObjectIDs,  IsJsonString}
                                        = require('../../../tools/utils/utils');
const { setTimeZone  }                  = require('../../../tools/utils/time_utils');
const { KEY_ERROR }			            = require('../../../tools/keys');
const { template }                      = require('lodash');
const moment                            = require("moment");

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 		        = require('../../auth/helper/auth.actions-constant');
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');

const ITEM__ACCOUNT_COLL                            = require('../../item/database/item.account-coll')
const ITEM__DOCTYPE_COLL                            = require('../../item/database/item.doctype-coll')
const ITEM_FUNDA_COLL                               = require('../../item/database/item.funda-coll')
const CONTRACT_COLL                                 = require('../../item/database/item.contract-coll')
const FINANCIAL_VOUCHER_COLL            = require('../database/accounting.financial_voucher-coll')
const FINANCIAL_GENERAL_JOURNAL_COLL    = require('../database/accounting.financial_general_journal-coll')
const FINANCIAL_REPORT_COLL             = require('../database/accounting.financial_report-coll')


/**
 * import inter-model, exter-model
 */
const XlsxPopulate                      = require('xlsx-populate');
const fs                                = require('fs');
const path                              = require('path');
const { uploadFileS3 }                  = require('../../../tools/s3');

class Model extends BaseModel {

    constructor() {
        super(FINANCIAL_REPORT_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 24/11/2022
     */
    insert({ userID, companyID, name, note, fromDate, toDate }) {
        return new Promise(async resolve => {
            try {
                if (!name || name == '')
                    return resolve({error: true, message: "name invalid", keyError: KEY_ERROR.PARAMS_INVALID});

                let dataInsert = { 
                    company: companyID,
                    userCreate: userID, 
                    name
                }

                if (fromDate) {
                    dataInsert.fromDate = fromDate;
                }
                if (toDate) {
                    dataInsert.toDate = toDate;
                }
            
                if (note && note != '') {
                    dataInsert.note = note;
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if (!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 })

                let listFunda = await ITEM_FUNDA_COLL.find({company: companyID})
                for(const item of listFunda){
                    let dataInsertDetail = {
                        company: companyID,
                        userCreate: userID, 
                        parent: infoAfterInsert._id,
                        funda: item.funda,
                        name: item.name,
                        fromDate: infoAfterInsert.fromDate,
                        toDate: infoAfterInsert.toDate,
                    }

                    let infoChild = await this.insertData(dataInsertDetail)
                    if(infoChild){
                        await FINANCIAL_REPORT_COLL.findByIdAndUpdate(infoAfterInsert._id, {
                            $addToSet: {childs: infoChild._id}
                        }, { new: true });
                    }
                }

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    /**
     * Name  : Cập nhật giá trị Order
     * Code  : HiepNH
     * Date  : 15/9/2024
     */
    updateValue({ reportID, userID }){
        return new Promise(async (resolve) => {
            try {    
                let dataUpdate = { 
                    userUpdate: userID, 
                    modifyAt: new Date() 
                };

                let listData = await FINANCIAL_REPORT_COLL.aggregate([
                    {
                        $match: {
                            order: ObjectID(reportID),
                        }
                    },
                    {
                        $group: {
                            _id: { },
                            amount: { $sum: "$amount" },
                        }
                    },
                ])
                if(listData && listData.length){
                    dataUpdate.amount = Number(listData[0].amount)
                }

                let infoAfterUpdate = await FINANCIAL_REPORT_COLL.findByIdAndUpdate(reportID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update_budget", status: 403 });

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: update group
     * Author: Depv
     * Code:
     */
    update({ userID, reportID, name, note, fromDate, toDate }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(reportID))
                    return resolve({ error: true, message: 'reportID__invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                let dataUpdate = { 
                    userUpdate: userID, 
                    modifyAt: new Date() 
                };

                if (name && name != '') {
                    dataUpdate.name = name;
                }

                if (note && note != '') {
                    dataUpdate.note = note;
                }

                if (fromDate) {
                    dataUpdate.fromDate = fromDate;
                }
                if (toDate) {
                    dataUpdate.toDate = toDate;
                }

                let infoAfterUpdate = await FINANCIAL_REPORT_COLL.findByIdAndUpdate(reportID, dataUpdate, { new: true })
                if (!infoAfterUpdate)
                    return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED })

                // Cập nhật lại mẩu tin con
                await FINANCIAL_REPORT_COLL.updateMany(
                    { 
                        parent: ObjectID(reportID),
                    },
                    { $set: { 
                        "name" : infoAfterUpdate.status,
                        "note" : infoAfterUpdate.project,
                        "fromDate" : infoAfterUpdate.package,
                        "toDate" : infoAfterUpdate.toPackage
                    } }
                )

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

        /**
     * Name: Đồng bộ data
     * Author: HiepNH
     * Code: 22/11/2023
     */
    syncData({
        companyID, userID, option, reportID, arrFunda
    }){
        // const that = this
        return new Promise(async (resolve) => {
            try {
                let info = await FINANCIAL_REPORT_COLL.findById(reportID)
                // console.log(info)

                let listFunda = arrFunda.map(item=>ObjectID(item))

                let conditionDebitObj1 = {funda : {$in : listFunda }}
                let conditionCreditObj1 = {funda : {$in : listFunda }}
                let conditionDebitObj2 = {funda : {$in : listFunda }}
                let conditionCreditObj2 = {funda : {$in : listFunda }}
                let conditionProject = {}, conditionMatch = {}, conditionGroupDebit = {}, conditionGroupCredit = {}
                let arrRevenueID = [], arrExpenseID = []

                let listAcc1 = await ITEM__ACCOUNT_COLL.find({ company: companyID, "name": { $regex: "^[57]" } })
                .select('_id')
                // .sort({name: 1})

                let listAcc2 = await ITEM__ACCOUNT_COLL.find({ company: companyID, "name": { $regex: "^[68]" } })
                .select('_id')
                // .sort({name: 1})

                if(listAcc1){
                    arrRevenueID = listAcc1.map(item=>ObjectID(item._id))
                }
                if(listAcc2){
                    arrExpenseID = listAcc2.map(item=>ObjectID(item._id))
                }
                // console.log(arrRevenueID)
                // console.log(arrExpenseID)

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
                    debit: 1,
                    credit: 1
                }

                conditionMatch = {
                    "forward": 0,
                    "cancel": 0,
                    "date": {
                        $gte: moment(info.fromDate).toDate(),
                        $lte: moment(info.toDate).toDate(),
                    }
                }

                conditionGroupDebit = {
                    _id: { funda: "$funda" },
                    amount: { $sum: "$amount" }
                }
                conditionGroupCredit = {
                    _id: { funda: "$funda" },
                    amount: { $sum: "$amount" }
                }
                // console.log(conditionDebitObj)
                // console.log(conditionCreditObj)
                // console.log(conditionProject)
                // console.log(conditionMatch)

                let revenue = 0, expense = 0

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
                                }
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
                                }
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
                                }
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
                                }
                            ],

                        }
                    }
                ])

                console.log(listData1)
                console.log(listData2)

                return resolve({ error: false, data: { listData1, listData2 } })

            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 })
            }
        })
    }

    /**
     * Name: get info
     * Author: Depv
     * Code:
     */
    getInfo({ orderProductID, select, populates={} }) {
        // console.log(populates)
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(orderProductID))
                    return resolve({ error: true, message: 'param_invalid' });

                // populate
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

                let info = await FINANCIAL_REPORT_COLL.findById(orderProductID)
                                    .select(select)
                                    .populate(populates)

                if (!info) return resolve({ error: true, message: 'cannot_get', keyError: KEY_ERROR.GET_INFO_FAILED });

                return resolve({ error: false, data: info });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name  : Get list
     * Author: HiepNH
     * Code: 24/11/2022
     */
    getList({  userID, companyID, parentID, keyword, limit = 50, lastestID, select, populates = {}, sortKey }) {
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = { company: companyID }
                let sortBy;
                let keys	 = ['createAt__1', '_id__1'];

                if (checkObjectIDs(parentID)) {
                    conditionObj.parent = parentID;
                }else{
                    conditionObj.parent = { $exists: false }
                }  

                // Làm rõ mục đích để làm gì?
                if (sortKey && typeof sortKey === 'string') {
                    if (!IsJsonString(sortKey))
                        return resolve({ error: true, message: 'Request params sortKey invalid', status: 400 });

                    keys = JSON.parse(sortKey);
                }

                /**
                 * ĐIỀU KIỆN KHÁC
                 */
                if(populates && typeof populates === 'string'){
                    if(!IsJsonString(populates))
                        return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

                    populates = JSON.parse(populates);
                } else{
                    populates = {
                        path: "",
                        select: ""
                    }
                }

                if (keyword) {
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = RegExp(keyword, 'i');
                }
                // console.log(conditionObj)
                
                let conditionObjOrg = { ...conditionObj };
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoData = await FINANCIAL_REPORT_COLL.findById(lastestID);
                    if(!infoData)
                        return resolve({ error: true, message: "Can't get info last message", status: 400 });

                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
                    if(!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });
                    conditionObj  = dataPagingAndSort.data.find;
                    sortBy        = dataPagingAndSort.data.sort;
                }else{
                    let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy                = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await FINANCIAL_REPORT_COLL.find(conditionObj)
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
                        nextCursor = infoDataAfterGet[limit - 1]?._id;
                        infoDataAfterGet.length = limit;
                    }
                }
                let totalRecord = await FINANCIAL_REPORT_COLL.count(conditionObjOrg);
                let totalPage   = Math.ceil(totalRecord/limit);

                return resolve({ error: false, data: {
                    listRecords: infoDataAfterGet,
                    limit: limit,
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
     * Name  : getListByProperty
     * Author: HiepNH
     * Date: 2/9/2024
     */
    getListByProperty({ companyID, option, outin, type, projectID, warehouseID, accountID, contraID, customerID, goodsID, assetsID, workID, subtypeID, userCreateID, fromDate, toDate }) {
        // console.log({ companyID, option, outin, type, projectID, warehouseID, accountID, contraID, customerID, goodsID, assetsID, workID, subtypeID, userCreateID, fromDate, toDate })
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * 1. Ban đầu query tổng tất cả dữ liệu
                 * 2. Sau bổ sung các phiếu đầu kỳ/kết chuyển số dư
                 */
                let conditionObj1 = {
                    company: ObjectID(companyID),
                    status: 5, // Hoàn thành
                    outin: 1, // Xuất ra (Thu tiền)
                }

                let conditionObj2 = {
                    company: ObjectID(companyID),
                    status: 5, // Hoàn thành
                    outin: 2, // Nhập vào (Chi tiền)
                }

                // Thẻ kho
                if(option == 1){
                    conditionObj1.goods = { $exists: true, $ne: null }
                    conditionObj2.goods = { $exists: true, $ne: null }
                }

                // Sổ quỹ
                else if(option == 2){
                    conditionObj1.account = { $exists: true, $ne: null }
                    conditionObj2.account = { $exists: true, $ne: null }

                    conditionObj1.type = {$in: [7, 8]}
                    conditionObj2.type = {$in: [7, 8]}
                }

                // Công nợ
                else if(option == 3){
                    conditionObj1.customer = { $exists: true, $ne: null }
                    conditionObj2.customer = { $exists: true, $ne: null }
                }

                // if(fromDate && toDate){
                //     if(fromDate != 'Invalid Date' && toDate != 'Invalid Date'){
                //         let startTime   = moment(fromDate).startOf('day').format();// <=== fix ISODate here
                //         let endTime     = moment(toDate).endOf('day').format();// <=== fix ISODate here
                //         conditionObj1.date  = { 
                //             $gte: moment(startTime).toDate(),
                //             $lte: moment(endTime).toDate()
                //         }
                //         conditionObj2.date  = { 
                //             $gte: moment(startTime).toDate(),
                //             $lte: moment(endTime).toDate()
                //         }
                //     }
                // }

                if (checkObjectIDs(projectID)) {
                    conditionObj1.project = ObjectID(projectID);
                    conditionObj2.project = ObjectID(projectID);
                }

                if (checkObjectIDs(warehouseID)) {
                    conditionObj1.warehouse = ObjectID(warehouseID);
                    conditionObj2.warehouse = ObjectID(warehouseID);
                }

                if (checkObjectIDs(accountID)) {
                    conditionObj1.account = ObjectID(accountID);
                    conditionObj2.account = ObjectID(accountID);
                }

                if (checkObjectIDs(contraID)) {
                    conditionObj1.contra = ObjectID(contraID);
                    conditionObj2.contra = ObjectID(contraID);
                }

                if (checkObjectIDs(customerID)) {
                    conditionObj1.customer = ObjectID(customerID);
                    conditionObj2.customer = ObjectID(customerID);
                }

                if (checkObjectIDs(userCreateID)) {
                    conditionObj1.userCreate = ObjectID(userCreateID);
                    conditionObj2.userCreate = ObjectID(userCreateID);
                }

                if (checkObjectIDs(goodsID)) {
                    conditionObj1.goods = ObjectID(goodsID);
                    conditionObj2.goods = ObjectID(goodsID);
                }

                if (checkObjectIDs(assetsID)) {
                    conditionObj1.assets = ObjectID(assetsID);
                    conditionObj2.assets = ObjectID(assetsID);
                }

                if (checkObjectIDs(workID)) {
                    conditionObj1.budgetWork = ObjectID(workID);
                    conditionObj2.budgetWork = ObjectID(workID);
                }

                if (checkObjectIDs(subtypeID)) {
                    conditionObj1.subtype = ObjectID(subtypeID);
                    conditionObj2.subtype = ObjectID(subtypeID);
                }

                if (!isNaN(type) && Number(type) >= 1) {
                    conditionObj1.type = Number(type)
                    conditionObj2.type = Number(type)
                }

                let conditionGroup = {}, conditionPopulate = {}

                // Thẻ kho
                if(option == 1){
                    conditionGroup = {
                        _id: { goods: "$goods" },
                        quantity: { $sum: "$quantity" },
                        amount: { $sum: "$amount" }
                    }
                }

                // Sổ quỹ
                else if(option == 2){
                    conditionGroup = {
                        _id: { account: "$account" },
                        amount: { $sum: "$amount" }
                    }
                }

                // Công nợ
                else if(option == 3){
                    conditionGroup = {
                        _id: { customer: "$customer" },
                        amount: { $sum: "$amount" }
                    }
                }

                let listData1 = await FINANCIAL_REPORT_COLL.aggregate([
                    {
                        $match: conditionObj1
                    },
                    {
                        $group: conditionGroup
                    },
                ])

                let listData2 = await FINANCIAL_REPORT_COLL.aggregate([
                    {
                        $match: conditionObj2
                    },
                    {
                        $group: conditionGroup
                    }
                ])

                // console.log(listData1)
                // console.log(listData2)

                let arr = [...listData1,...listData2]
                let arrCombine = [], arr1 = [], arr2 = []

                // Thẻ kho
                if(option == 1){
                    listData1.forEach(item=>{
                        let key = item._id.goods;
                        if (!Array.isArray(arr1[key])) {
                            arr1[key] = [];
                        }
                        arr1[key].push(item)
                    })
    
                    listData2.forEach(item=>{
                        let key = item._id.goods;
                        if (!Array.isArray(arr2[key])) {
                            arr2[key] = [];
                        }
                        arr2[key].push(item)
                    })
                }

                // Sổ quỹ
                else if(option == 2){
                    listData1.forEach(item=>{
                        let key = item._id.account;
                        if (!Array.isArray(arr1[key])) {
                            arr1[key] = [];
                        }
                        arr1[key].push(item)
                    })
    
                    listData2.forEach(item=>{
                        let key = item._id.account;
                        if (!Array.isArray(arr2[key])) {
                            arr2[key] = [];
                        }
                        arr2[key].push(item)
                    })
                }

                // Công nợ
                else if(option == 3){
                    listData1.forEach(item=>{
                        let key = item._id.customer;
                        if (!Array.isArray(arr1[key])) {
                            arr1[key] = [];
                        }
                        arr1[key].push(item)
                    })
    
                    listData2.forEach(item=>{
                        let key = item._id.customer;
                        if (!Array.isArray(arr2[key])) {
                            arr2[key] = [];
                        }
                        arr2[key].push(item)
                    })
                }

                // console.log(arr1)
                // console.log(arr2)

                // Thẻ kho
                if(option == 1){
                    let listItem = await ITEM__GOODS_COLL.find({_id: {$in: arr.map(item => item._id.goods)}})
                    .select('name sign unit')

                    listItem.forEach(item =>{
                        let quantityIncome = 0, income = 0, quantityExpense = 0, expense = 0
    
                        if(arr1[item._id]){
                            quantityExpense = arr1[item._id][0].quantity
                            expense = arr1[item._id][0].amount
                        }
                        
                        if(arr2[item._id]){
                            quantityIncome = arr2[item._id][0].quantity
                            income = arr2[item._id][0].amount
                        }
    
                        arrCombine.push({
                            _id: item._id,
                            name: item.name,
                            unit: item.unit,
                            quantityIncome: Number(quantityIncome),
                            income: Number(income),
                            quantityExpense: Number(quantityExpense),
                            expense: Number(expense),
                        })
                    })

                    // console.log(arrCombine)

                    return resolve({ error: false, data: arrCombine })
                }

                // Sổ quỹ
                else if(option == 2){
                    let listItem = await ITEM__ACCOUNT_COLL.find({_id: {$in: arr.map(item => item._id.account)}})
                    .select('name description')

                    listItem.forEach(item =>{
                        let income = 0, expense = 0

                        if(arr2[item._id]){
                            expense = arr2[item._id][0].amount
                        }
                        
                        if(arr1[item._id]){
                            income = arr1[item._id][0].amount
                        }

                        arrCombine.push({
                            _id: item._id,
                            name: item.name,
                            description: item.description,
                            income: Number(income),
                            expense: Number(expense),
                        })
                    })

                    return resolve({ error: false, data: arrCombine })
                }

                // Công nợ
                else if(option == 3){
                    let listItem = await ITEM__CONTACT_COLL.find({_id: {$in: arr.map(item => item._id.customer)}})
                    .select('name phone sign')

                    listItem.forEach(item =>{
                        let income = 0, expense = 0

                        if(arr1[item._id]){
                            expense = arr1[item._id][0].amount
                        }
                        
                        if(arr2[item._id]){
                            income = arr2[item._id][0].amount
                        }

                        arrCombine.push({
                            _id: item._id,
                            name: item.name,
                            income: Number(income),
                            expense: Number(expense),
                        })
                    })

                    return resolve({ error: false, data: arrCombine })
                }
                
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    /*
     * Name: Tổng hợp
     * Code: HiepNH
     * Date: 20/9/2024
     */
    getAmountByProperty({ userID, companyID, parentID, year, month, option, outin, type, projectID, warehouseID, accountID, contraID, customerID, goodsID, assetsID, workID, subtypeID, userCreateID, fromDate, toDate, ctx }){
        // console.log({ userID, companyID, parentID, accountID, year, month, option })
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * Tham số của option:
                 * 1-Tổng hợp các công ty mà user được quyền truy cập báo cáo quản trị
                 */
                let conditionObj = {}, conditionPlanObj = {}, conditionGroup = {}, conditionObjYear = {}, conditionPopulate = {}, sortBy = {"income": -1}

                // Tổng hợp các công ty mà user được quyền truy cập báo cáo quản trị: QUỸ
                if(Number(option) === 1){
                    let listCompany = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.APP_MENU_GET_LIST_COMPANY}`, {
                        appID: "5dfe4bf251dc622100bb9d8c", // Ứng dụng Quỹ
                        menuID: "66ecc9166748e0001242a36c", // Báo cáo quản trị: 66ecc90fa002e190dc4193b4 // 66ecc9166748e0001242a36c**
                        type: "1"
                    })

                    let listDataCompany = await FINANCIAL_REPORT_COLL.aggregate([
                        {
                            $match: {
                                status: 5, // Đã hoàn thành
                                type: {$in: [7, 8]}, // Tiền mặt và Ngân hàng
                                company: {$in: listCompany.data.map(item=> ObjectID(item._id.company._id))},
                                account: { $exists: true, $ne: null }, // Sổ quỹ
                            }
                        },
                        {
                            $group: {
                                _id: { company: "$company" },
                                total1: { $sum: { $cond: [{ $eq: ["$outin", 1] }, "$amount", 0] } },
                                total2: { $sum: { $cond: [{ $eq: ["$outin", 2] }, "$amount", 0] } }
                            }
                        },
                    ])
                    // console.log(listDataCompany)
                    
                    let listDataAccount = await FINANCIAL_REPORT_COLL.aggregate([
                        {
                            $match: {
                                status: 5, // Đã hoàn thành
                                type: {$in: [7, 8]}, // Tiền mặt và Ngân hàng
                                company: ObjectID(companyID),
                                account: { $exists: true, $ne: null }, // Sổ quỹ
                            }
                        },
                        {
                            $group: {
                                _id: { account: "$account" },
                                total1: { $sum: { $cond: [{ $eq: ["$outin", 1] }, "$amount", 0] } },
                                total2: { $sum: { $cond: [{ $eq: ["$outin", 2] }, "$amount", 0] } }
                            }
                        },
                    ])
                    // console.log(listDataAccount)

                    await FINANCIAL_REPORT_COLL.populate(listDataCompany, {
                        path: '_id.company',
                        select: '_id name sign image',
                        model: 'company'
                    })

                    await FINANCIAL_REPORT_COLL.populate(listDataAccount, {
                        path: '_id.account',
                        select: '_id name description',
                        model: 'account'
                    })

                    return resolve({ error: false, data: { listDataCompany, listDataAccount } })
                }

                // Báo cáo Biểu đồ theo năm, tháng: QUỸ
                else if(Number(option) === 2){
                    let yearFilter = new Date().getFullYear()
                    let monthFilter = new Date().getMonth() + 1
                    // console.log({yearFilter})
                    // console.log({monthFilter})

                    if(!month){
                        let listData = await FINANCIAL_REPORT_COLL.aggregate([
                            {
                                $match: {
                                    status: 5, // Đã hoàn thành
                                    type: {$in: [7, 8]}, // Tiền mặt và Ngân hàng
                                    company: ObjectID(companyID),
                                    account: { $exists: true, $ne: null }, // Sổ quỹ
                                }
                            },
                            {
                                $project: {
                                    year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                    month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                    outin: 1,
                                    amount: 1,
                                }
                            },
                            {
                                $match: {
                                    year: Number(yearFilter),
                                    month: Number(monthFilter),
                                }
                            },
                            {
                                $group: {
                                    _id: { month: "$month" },
                                    total1: { $sum: { $cond: [{ $eq: ["$outin", 1] }, "$amount", 0] } },
                                    total2: { $sum: { $cond: [{ $eq: ["$outin", 2] }, "$amount", 0] } }
                                }
                            },
                        ])
    
                        return resolve({ error: false, data: listData })
                    }else{
                        let listData = await FINANCIAL_REPORT_COLL.aggregate([
                            {
                                $match: {
                                    status: 5, // Đã hoàn thành
                                    type: {$in: [7, 8]}, // Tiền mặt và Ngân hàng
                                    company: ObjectID(companyID),
                                    account: { $exists: true, $ne: null }, // Sổ quỹ
                                }
                            },
                            {
                                $project: {
                                    year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                    month : {$month: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                    day: { $dayOfMonth: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                                    amount: 1,
                                    outin: 1,
                                }
                            },
                            {
                                $match: {
                                    year: Number(yearFilter),
                                    month: Number(monthFilter),
                                }
                            },
                            {
                                $group: {
                                    _id: { day: "$day" },
                                    total1: { $sum: { $cond: [{ $eq: ["$outin", 1] }, "$amount", 0] } },
                                    total2: { $sum: { $cond: [{ $eq: ["$outin", 2] }, "$amount", 0] } }
                                }
                            },
                        ])
    
                        return resolve({ error: false, data: listData })
                    }
                }

                // Báo cáo Khoản mục phí
                else if(Number(option) === 3){
                    // Kế hoạch
                    if (checkObjectIDs(subtypeID)) {
                        conditionPlanObj = {
                            status: 5, // Đã hoàn thành
                            type: 1,
                            // company: ObjectID(companyID),
                            subtype: ObjectID(subtypeID),
                            project: { $exists: true, $ne: null },
                        }
                    }else{
                        conditionPlanObj = {
                            status: 5, // Đã hoàn thành
                            type: 1,
                            company: ObjectID(companyID),
                            project: { $exists: true, $ne: null },
                        }
                    }

                     // Thực tế
                    if (checkObjectIDs(subtypeID)) {
                        conditionObj = {
                            status: 5, // Đã hoàn thành
                            type: {$in: [7, 8]}, // Tiền mặt và Ngân hàng
                            // company: ObjectID(companyID),
                            subtype: ObjectID(subtypeID),
                            account: { $exists: true, $ne: null }, // Sổ quỹ
                            project: { $exists: true, $ne: null },
                        }
                    }else{
                        conditionObj = {
                            status: 5, // Đã hoàn thành
                            type: {$in: [7, 8]}, // Tiền mặt và Ngân hàng
                            company: ObjectID(companyID),
                            account: { $exists: true, $ne: null }, // Sổ quỹ
                            project: { $exists: true, $ne: null },
                        }
                    }

                    let listData1 = await FINANCIAL_REPORT_COLL.aggregate([
                        {
                            $match: conditionPlanObj
                        },
                        {
                            $group: {
                                _id: { project: "$project" },
                                total1: { $sum: { $cond: [{ $eq: ["$outin", 1] }, "$amount", 0] } },
                                total2: { $sum: { $cond: [{ $eq: ["$outin", 2] }, "$amount", 0] } }
                            }
                        },
                    ])

                    let listData2 = await FINANCIAL_REPORT_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $group: {
                                _id: { project: "$project" },
                                total1: { $sum: { $cond: [{ $eq: ["$outin", 1] }, "$amount", 0] } },
                                total2: { $sum: { $cond: [{ $eq: ["$outin", 2] }, "$amount", 0] } }
                            }
                        },
                    ])

                    let arr = [...listData1,...listData2]
                    let arrCombine = [], arr1 = [], arr2 = []
                    
                    listData1.forEach(item=>{
                        let key = item._id.project;
                        if (!Array.isArray(arr1[key])) {
                            arr1[key] = [];
                        }
                        arr1[key].push(item)
                    })
    
                    listData2.forEach(item=>{
                        let key = item._id.project;
                        if (!Array.isArray(arr2[key])) {
                            arr2[key] = [];
                        }
                        arr2[key].push(item)
                    })

                    let listItem = await ITEM__DEPARTMENT_COLL.find({_id: {$in: arr.map(item => item._id.project)}})
                    .select('name sign description unit')

                    listItem.forEach(item =>{
                        let planIncome = 0, planExpense = 0, realIncome = 0, realExpense = 0
    
                        if(arr1[item._id]){
                            planIncome = arr1[item._id][0].total1
                            planExpense = arr1[item._id][0].total2
                        }
                        
                        if(arr2[item._id]){
                            realIncome = arr2[item._id][0].total1
                            realExpense = arr2[item._id][0].total2
                        }
    
                        arrCombine.push({
                            _id: item._id,
                            name: item.name,
                            sign: item.sign,
                            description: item.description,
                            unit: item.unit,
                            planIncome: Number(planIncome),
                            planExpense: Number(planExpense),
                            realIncome: Number(realIncome),
                            realExpense: Number(realExpense),
                        })
                    })

                    return resolve({ error: false, data: arrCombine })
                }

                // Báo cáo Khoản mục của dự án cụ thể
                else if(Number(option) === 4){

                    // Kế hoạch
                    if (checkObjectIDs(projectID)) {
                        conditionPlanObj = {
                            status: 5, // Đã hoàn thành
                            type: 1,
                            outin: 2, // Chi phí
                            // company: ObjectID(companyID),
                            project: ObjectID(projectID),
                            subtype: { $exists: true, $ne: null },
                        }
                    }else{
                        conditionPlanObj = {
                            status: 5, // Đã hoàn thành
                            type: 1,
                            outin: 2, // Chi phí
                            company: ObjectID(companyID),
                            subtype: { $exists: true, $ne: null },
                        }
                    }

                    // Thực tế
                    if (checkObjectIDs(projectID)) {
                        conditionObj = {
                            status: 5, // Đã hoàn thành
                            type: {$in: [7, 8]}, // Tiền mặt và Ngân hàng
                            outin: 2, // Chi phí
                            // company: ObjectID(companyID),
                            project: ObjectID(projectID),
                            account: { $exists: true, $ne: null }, // Sổ quỹ
                            subtype: { $exists: true, $ne: null },
                        }
                    }else{
                        conditionObj = {
                            status: 5, // Đã hoàn thành
                            type: {$in: [7, 8]}, // Tiền mặt và Ngân hàng
                            outin: 2, // Chi phí
                            company: ObjectID(companyID),
                            account: { $exists: true, $ne: null }, // Sổ quỹ
                            subtype: { $exists: true, $ne: null },
                        }
                    }

                    let listData1 = await FINANCIAL_REPORT_COLL.aggregate([
                        {
                            $match: conditionPlanObj
                        },
                        {
                            $group: {
                                _id: { subtype: "$subtype" },
                                total1: { $sum: { $cond: [{ $eq: ["$outin", 1] }, "$amount", 0] } },
                                total2: { $sum: { $cond: [{ $eq: ["$outin", 2] }, "$amount", 0] } }
                            }
                        },
                    ])

                    let listData2 = await FINANCIAL_REPORT_COLL.aggregate([
                        {
                            $match: conditionObj
                        },
                        {
                            $group: {
                                _id: { subtype: "$subtype" },
                                total1: { $sum: { $cond: [{ $eq: ["$outin", 1] }, "$amount", 0] } },
                                total2: { $sum: { $cond: [{ $eq: ["$outin", 2] }, "$amount", 0] } }
                            }
                        },
                    ])

                    let arr = [...listData1,...listData2]
                    let arrCombine = [], arr1 = [], arr2 = []
                    
                    listData1.forEach(item=>{
                        let key = item._id.subtype;
                        if (!Array.isArray(arr1[key])) {
                            arr1[key] = [];
                        }
                        arr1[key].push(item)
                    })
    
                    listData2.forEach(item=>{
                        let key = item._id.subtype;
                        if (!Array.isArray(arr2[key])) {
                            arr2[key] = [];
                        }
                        arr2[key].push(item)
                    })

                    let listItem = await ITEM__DOCTYPE_COLL.find({_id: {$in: arr.map(item => item._id.subtype)}})
                    .select('name sign description unit')

                    listItem.forEach(item =>{
                        let planIncome = 0, planExpense = 0, realIncome = 0, realExpense = 0
    
                        if(arr1[item._id]){
                            planIncome = arr1[item._id][0].total1
                            planExpense = arr1[item._id][0].total2
                        }
                        
                        if(arr2[item._id]){
                            realIncome = arr2[item._id][0].total1
                            realExpense = arr2[item._id][0].total2
                        }
    
                        arrCombine.push({
                            _id: item._id,
                            name: item.name,
                            sign: item.sign,
                            description: item.description,
                            unit: item.unit,
                            planIncome: Number(planIncome),
                            planExpense: Number(planExpense),
                            realIncome: Number(realIncome),
                            realExpense: Number(realExpense),
                        })
                    })

                    return resolve({ error: false, data: arrCombine })
                }

            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }


    /**
     * Dev: HiepNH
     * Func: Tải excel
     * Date: 4/2/2023
     */
    exportExcel({ companyID, option, year, month, filterParams, email, userID }) {
        // console.log({ companyID, option, year, month, filterParams, userID })
        return new Promise(async resolve => {
            try {
                if(FNB_ACC.taichinh.includes(email.toString())){
                    let conditionObj = { company: companyID }

                    let obj = JSON.parse(filterParams);

                    let fundasID = obj.fundasID
                    let shiftTypes = obj.shiftTypes
                    let fromDate = obj.fromDate
                    let toDate = obj.toDate
                    let keyword = obj.keyword
                    let salesChannels = obj.salesChannels
                    let statuss = obj.statuss
                    let isMistake = obj.isMistake
                    let isDiscount = obj.isDiscount
                    let isSalesoff = obj.isSalesoff
                    let isCredit = obj.isCredit
                    let isOffer = obj.isOffer
                    let isNonResident = obj.isNonResident
                    let isCustomerType = obj.isCustomerType

                    if(fundasID && fundasID.length ){
                        let arrFun = fundasID.map(item=>ObjectID(item))

                        if(arrFun.length) {
                            conditionObj.funda = { $in: arrFun };
                        }
                    }else{
                        let listFundaIsMember = await ITEM__FUNDA_COLL.find({members: {$in: [userID]}});
                        let fundasIDIsMember = listFundaIsMember.map(item=>ObjectID(item._id));
                        if(fundasIDIsMember.length) {
                            conditionObj.funda = { $in: fundasIDIsMember };
                        }else{
                            conditionObj.funda = { $in: [] }
                        }
                    }

                    shiftTypes && shiftTypes.length             && (conditionObj.shiftType = { $in: shiftTypes });
                    salesChannels && salesChannels.length       && (conditionObj.salesChannel = { $in: salesChannels });
                    statuss && statuss.length                   && (conditionObj.status = { $in: statuss });

                    // Phân loại khác
                    if(isMistake && isMistake == 1){
                        conditionObj.numberOfMistakes = { $gt: 0 }
                    }

                    if(isNonResident && isNonResident == 1){
                        conditionObj.nonResident = 2
                    }

                    if(isDiscount && isDiscount == 1){
                        conditionObj.discount = { $gt: 0 }
                    }

                    if(isSalesoff && isSalesoff == 1){
                        conditionObj.salesoff = { $gt: 0 }
                    }

                    if(isCredit && isCredit == 1){
                        conditionObj.credit = { $gt: 0 }
                    }

                    if(isOffer && isOffer == 1){
                        conditionObj.offer = { $gt: 0 }
                    }

                    if(isCustomerType && isCustomerType == 1){
                        conditionObj.customerType = 1
                    }
                    if(isCustomerType && isCustomerType == 2){
                        conditionObj.customerType = 2
                    }
                    // console.log(conditionObj)

                    // Phân loại theo thời khoảng
                    if(fromDate && toDate){
                        conditionObj.createAt = {
                            $gte: new Date(fromDate),
                            $lte: new Date(toDate),
                        }
                    }

                    if(keyword){
                        keyword = keyword.split(" ");
                        keyword = '.*' + keyword.join(".*") + '.*';
                        const regSearch = new RegExp(keyword, 'i');

                        conditionObj.$or = [
                            { name: regSearch },
                            { sign: regSearch },
                        ]
                    }
                    // console.log(conditionObj)

                    let listData  = await FINANCIAL_REPORT_COLL.find(conditionObj)
                    .populate({
                        path: "campaignType",
                        select: "name",
                    })
                    .populate({
                        path: "referrer",
                        select: "name phone",
                    })
                    .populate({
                        path: "customer",
                        select: "name phone",
                    })
                    .populate({
                        path: "funda",
                        select: "name sign",
                    })
                    .populate({
                        path: "shift",
                        select: "name sign",
                    })
                    .limit(2000)
                    .sort({createAt: -1})
                    // console.log(listData)

                    let listData2 = await FINANCIAL_REPORT_COLL.aggregate([
                            {
                                $match: {
                                    order: {$in: listData.map(item => ObjectID(item._id))}
                                }
                            },
                            {
                                $group: {
                                    _id: { funda: '$funda', product: '$product' },
                                    quantity: { $sum: "$quantity" }
                                }
                            },
                            {
                                $sort: {
                                    '_id.product': 1
                                }
                            }
                        ])

                    let conditionPopulate1 = {
                        path: '_id.product',
                        select: '_id name',
                        model: 'fnb_product'
                    }

                    let conditionPopulate2 = {
                        path: '_id.funda',
                        select: '_id name',
                        model: 'funda'
                    }

                    await FINANCIAL_REPORT_COLL.populate(listData2, conditionPopulate1)
                    await FINANCIAL_REPORT_COLL.populate(listData2, conditionPopulate2)
                    // console.log(listData2)

                    let listData3 = await FINANCIAL_REPORT_COLL.aggregate([
                        {
                            $match: {
                                order: {$in: listData.map(item => ObjectID(item._id))}
                            }
                        },
                        {
                            $group: {
                                _id: { product: '$product' },
                                quantity: { $sum: "$quantity" }
                            }
                        },
                        {
                            $sort: {
                                '_id.product': 1
                            }
                        }
                    ])
                    await FINANCIAL_REPORT_COLL.populate(listData3, conditionPopulate1)

                    // Modify the workbook.
                    XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/fnb_export_order.xlsx')))
                    .then(async workbook => {
                        var i = 3;
                        listData?.forEach((item, index) => {
                            workbook.sheet("Order").row(i).cell(1).value(Number(index+1));
                            workbook.sheet("Order").row(i).cell(2).value(item?.funda?.name);
                            workbook.sheet("Order").row(i).cell(3).value(item.createAt);
                            workbook.sheet("Order").row(i).cell(4).value(item?.shift?.name);
                            workbook.sheet("Order").row(i).cell(5).value(`${FNB_SHIFT_TYPES[Number(item.shiftType)-1].text}`);
                            workbook.sheet("Order").row(i).cell(6).value(item.name);
                            workbook.sheet("Order").row(i).cell(7).value(item.sign);
                            workbook.sheet("Order").row(i).cell(8).value(`${FNB_SALES_CHANNEL[Number(item.salesChannel)-1].text}`);
                            workbook.sheet("Order").row(i).cell(9).value(item?.appOrderSign);
                            workbook.sheet("Order").row(i).cell(10).value(`${FNB_PAYMENT_METHOD[Number(item.paymentMethod)-1].text}`);
                            workbook.sheet("Order").row(i).cell(11).value(`${FNB_STATUS[Number(item.status)-1].text}`);
                            workbook.sheet("Order").row(i).cell(12).value(Number(item.total));
                            workbook.sheet("Order").row(i).cell(13).value(Number(item.discount));
                            workbook.sheet("Order").row(i).cell(14).value(Number(item.salesoff));
                            workbook.sheet("Order").row(i).cell(15).value(Number(item.credit));
                            workbook.sheet("Order").row(i).cell(16).value(Number(item.offer));
                            workbook.sheet("Order").row(i).cell(17).value(Number(item.amount));
                            workbook.sheet("Order").row(i).cell(18).value(Number(item?.shippingFeeTotal));
                            workbook.sheet("Order").row(i).cell(19).value(Number(item?.shippingFee));
                            workbook.sheet("Order").row(i).cell(20).value(Number(item.numberOfSizeM));
                            workbook.sheet("Order").row(i).cell(21).value(Number(item.numberOfSizeL));
                            workbook.sheet("Order").row(i).cell(22).value(Number(item.numberOfProducts));
                            workbook.sheet("Order").row(i).cell(23).value(Number(item.numberOfMistakes));
                            workbook.sheet("Order").row(i).cell(24).value(item.note);
                            workbook.sheet("Order").row(i).cell(25).value(Number(item.loyaltyPoints));
                            workbook.sheet("Order").row(i).cell(26).value(item.amount != 0 ? Number(item.loyaltyPoints)/Number(item.amount) : 0);
                            workbook.sheet("Order").row(i).cell(27).value(item.total !=0 ? Number(item.salesoff)/Number(item.total) : "");
                            if(item.customerType && Number(item.customerType) === 1 && Number(item.nonResident) === 1){
                                workbook.sheet("Order").row(i).cell(28).value('Đơn nhân viên');
                            }
                            if(Number(item.nonResident) === 2){
                                workbook.sheet("Order").row(i).cell(29).value('Khách vãng lai');
                            }
                            workbook.sheet("Order").row(i).cell(30).value(`${item?.customer?._id}`);
                            workbook.sheet("Order").row(i).cell(31).value(item?.customer?.phone);
                            workbook.sheet("Order").row(i).cell(32).value(item?.customer?.name);
                            workbook.sheet("Order").row(i).cell(33).value(item?.referrer ? `${item?.referrer?._id}` : "");
                            workbook.sheet("Order").row(i).cell(34).value(item?.referrer ? item?.referrer?.phone : "");
                            workbook.sheet("Order").row(i).cell(35).value(item?.referrer ? item?.referrer?.name : "");
                            workbook.sheet("Order").row(i).cell(36).value(item?.campaignType ? item?.campaignType?.name : "");

                            i++
                        });

                        var i = 3;
                        listData2?.forEach((item, index) => {
                            workbook.sheet("Product").row(i).cell(1).value(Number(index+1));
                            workbook.sheet("Product").row(i).cell(2).value(`${item._id.product.name}`);
                            workbook.sheet("Product").row(i).cell(3).value(`${item._id.funda.name}`);
                            workbook.sheet("Product").row(i).cell(4).value(Number(item?.quantity));

                            i++
                        });

                        var i = 3;
                        listData3?.forEach((item, index) => {
                            workbook.sheet("Report").row(i).cell(1).value(Number(index+1));
                            workbook.sheet("Report").row(i).cell(2).value(`${item._id.product.name}`);
                            workbook.sheet("Report").row(i).cell(3).value(Number(item?.quantity));

                            i++
                        });

                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `DanhSachDonHang_${now.getTime()}.xlsx`;
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

    exportExcelByFilter({ option, userID, companyID, filterParams, ctx }) {
        // console.log({ option, userID, companyID, filterParams })
        return new Promise(async resolve => {
            try {
                if (Number(option) === 1) {
                    // console.log('==========================')
                    const populates = JSON.stringify({
                        path: 'department position field property area area1 area2 linkUser workingStatus contractType',
                        select: 'name sign fullname',
                        populate: {
                            path: 'parent',
                            select: 'name',
                            populate: {
                                path: 'parent',
                                select: 'name',
                            }
                        }
                    })

                    const { data, error } = await this.getListByProperty({
                        ...filterParams,
                        // populates,
                        // type: 1,
                        userID,
                        companyID,
                        isExportExcel: false,
                        ctx
                    });
                    // console.log(data)

                    if (error || !data?.length) {
                        return resolve({ data, error })
                    }

                    const result = await this.downloadExcelFile(data)
                    return resolve(result);
                }

                else if (Number(option) === 2) {

                
                }

                else if (Number(option) === 3) {
                    // // console.log('222222222222222223333')

                    // let conditionObj = {
                    //     company: ObjectID(companyID)
                    // }

                    // if (Number(validatePhone) === 1) {
                    //     conditionObj.phone = { $exists: true, $ne: null }
                    // }

                    // if (Number(validateMail) === 1) {
                    //     conditionObj.email = { $exists: true, $ne: null }
                    // }

                    // // let totalCustomer = 0, newCustomer = 0

                    // let limit = Number(page * unit)
                    // let listData = await ITEM__CONTACT_COLL.find(conditionObj)
                    //     .select('_id name phone email birthday purchasedValue type note getVouchers modifyAt')
                    //     .sort({ modifyAt: -1 })
                    //     // .sort({purchasedValue: -1})
                    //     .limit(limit)

                    // // Modify the workbook.
                    // XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/contact_ads.xlsx')))
                    //     .then(async workbook => {

                    //         var i = 3;
                    //         listData?.forEach((item, index) => {

                    //             workbook.sheet("Export").row(i).cell(1).value(Number(index + 1))
                    //             workbook.sheet("Export").row(i).cell(2).value(item.name)
                    //             workbook.sheet("Export").row(i).cell(3).value(item?.phone)
                    //             workbook.sheet("Export").row(i).cell(4).value(item?.email)
                    //             workbook.sheet("Export").row(i).cell(5).value(item?.birthday)
                    //             workbook.sheet("Export").row(i).cell(6).value(Number(item?.type))
                    //             workbook.sheet("Export").row(i).cell(7).value(item?.note)
                    //             workbook.sheet("Export").row(i).cell(8).value(Number(item?.purchasedValue))
                    //             if (item?.getVouchers.length && item?.getVouchers.includes("64378d6618c77f00128abe93")) {
                    //                 workbook.sheet("Export").row(i).cell(9).value('Quan tâm OA')
                    //             }
                    //             workbook.sheet("Export").row(i).cell(10).value(item.modifyAt)

                    //             i++
                    //         });

                    //         const now = new Date();
                    //         const filePath = '../../../files/temporary_uploads/';
                    //         const fileName = `contact_ads${now.getTime()}.xlsx`;
                    //         const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                    //         await workbook.toFileAsync(pathWriteFile);
                    //         const result = await uploadFileS3(pathWriteFile, fileName);

                    //         fs.unlinkSync(pathWriteFile);
                    //         return resolve({ error: false, data: result?.Location, status: 200 });
                    //     });

                    // // return resolve({ error: false, data: listData, status: 200 });
                }
            } catch (error) {
                console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    downloadExcelFile(data) {
        // console.log('Bạn vừa tải data về hệ thống')
        return new Promise(resolve => {
            XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/store_inventory_report.xlsx')))
                .then(async workbook => {

                    let i = 4;
                    data?.forEach((item, index) => {
                        workbook.sheet("Data").row(i).cell(1).value(Number(index + 1));
                        workbook.sheet("Data").row(i).cell(2).value(item.name);
                        workbook.sheet("Data").row(i).cell(3).value(item?.unit);
                        workbook.sheet("Data").row(i).cell(4).value(Number(item?.quantityIncome));
                        workbook.sheet("Data").row(i).cell(5).value(Number(item?.income));
                        workbook.sheet("Data").row(i).cell(6).value(Number(item?.quantityExpense));
                        workbook.sheet("Data").row(i).cell(7).value(Number(item?.expense));
                        workbook.sheet("Data").row(i).cell(8).value(Number(item?.quantityIncome - item?.quantityExpense));
                        workbook.sheet("Data").row(i).cell(9).value(Number(item?.income - item?.expense));
                 
                        i++
                    });

                    const now = new Date();
                    const filePath = '../../../files/temporary_uploads/';
                    const fileName = `store_inventory_report${now.getTime()}.xlsx`;
                    const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                    await workbook.toFileAsync(pathWriteFile);
                    const result = await uploadFileS3(pathWriteFile, fileName);

                    fs.unlinkSync(pathWriteFile);
                    return resolve({ error: false, data: result?.Location, status: 200 });
                });
        })
    }
}

exports.MODEL = new Model