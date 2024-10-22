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

const ITEM__ACCOUNT_COLL                = require('../../item/database/item.account-coll')
const ITEM__DOCTYPE_COLL                = require('../../item/database/item.doctype-coll')
const ITEM_FUNDA_COLL                   = require('../../item/database/item.funda-coll')
const CONTRACT_COLL                     = require('../../item/database/item.contract-coll')
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
                        funda: item._id,
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
                        "name" : infoAfterUpdate.name,
                        "note" : infoAfterUpdate.note,
                        "fromDate" : infoAfterUpdate.fromDate,
                        "toDate" : infoAfterUpdate.toDate
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
        return new Promise(async (resolve) => {
            try {
                let info = await FINANCIAL_REPORT_COLL.findById(reportID)

                let listFunda = await ITEM_FUNDA_COLL.find({company: companyID, members: {$in: [userID]}}).select('_id')

                let conditionDebitObj1 = {funda : {$in : listFunda.map(item=>ObjectID(item._id)) }}
                let conditionCreditObj1 = {funda : {$in : listFunda.map(item=>ObjectID(item._id)) }}
                let conditionDebitObj2 = {funda : {$in : listFunda.map(item=>ObjectID(item._id)) }}
                let conditionCreditObj2 = {funda : {$in : listFunda.map(item=>ObjectID(item._id)) }}

                let conditionProject = {}, conditionMatch = {}, conditionGroupDebit = {}, conditionGroupCredit = {}
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

                // console.log(listData1)
                // console.log(listData2)
                // console.log(listData1[0]._debit)
                // console.log(listData1[0]._credit)

                let revenue = 0, expense = 0
                if(listData1[0]._credit.length){
                    revenue = Number(revenue) + listData1[0]._credit.reduce((accumulator, currentItem) => {
                        return accumulator + currentItem.amount
                      }, 0)
                }
                if(listData1[0]._debit.length){
                    revenue = Number(revenue) - listData1[0]._debit.reduce((accumulator, currentItem) => {
                        return accumulator + currentItem.amount
                      }, 0)
                }

                if(listData2[0]._debit.length){
                    expense = Number(expense) + listData2[0]._debit.reduce((accumulator, currentItem) => {
                        return accumulator + currentItem.amount
                      }, 0)
                }
                if(listData2[0]._credit.length){
                    expense = Number(expense) - listData2[0]._credit.reduce((accumulator, currentItem) => {
                        return accumulator + currentItem.amount
                      }, 0)
                }

                // console.log({revenue})
                // console.log({expense})

                await FINANCIAL_REPORT_COLL.findByIdAndUpdate(reportID, {
                    revenue: Number(revenue).toFixed(0),
                    expense: Number(expense).toFixed(0),
                    profit: Number(revenue - expense).toFixed(0)
                }, { new: true });

                /**
                 * CẬP NHẬT CHO CÁC CƠ SỞ
                 */
                for(const item of listFunda){
                    let revenueFunda = 0, expenseFunda = 0

                    if(listData1[0]._credit.length){
                        revenueFunda = Number(revenueFunda) + listData1[0]._credit.reduce((accumulator, currentItem) => {
                            if(currentItem._id.funda.toString() === item._id.toString()  ){
                                return accumulator + currentItem.amount
                            }
                            return accumulator;
                          }, 0)
                    }
                    if(listData1[0]._debit.length){
                        revenueFunda = Number(revenueFunda) - listData1[0]._debit.reduce((accumulator, currentItem) => {
                            if(currentItem._id.funda.toString() === item._id.toString()  ){
                                return accumulator + currentItem.amount
                            }
                            return accumulator;
                          }, 0)
                    }

                    if(listData2[0]._debit.length){
                        expenseFunda = Number(expenseFunda) + listData2[0]._debit.reduce((accumulator, currentItem) => {
                            if(currentItem._id.funda.toString() === item._id.toString()  ){
                                return accumulator + currentItem.amount
                            }
                            return accumulator;
                          }, 0)
                    }

                    if(listData2[0]._credit.length){
                        expenseFunda = Number(expenseFunda) - listData2[0]._credit.reduce((accumulator, currentItem) => {
                            if(currentItem._id.funda.toString() === item._id.toString()  ){
                                return accumulator + currentItem.amount
                            }
                            return accumulator;
                          }, 0)
                    }

                    // console.log({revenueFunda})
                    // console.log({expenseFunda})
                    // console.log('===================')

                    await FINANCIAL_REPORT_COLL.findOneAndUpdate({ parent: reportID, funda: item._id}, { 
                        userUpdate: userID, 
                        modifyAt: new Date(),
                        revenue: Number(revenueFunda).toFixed(0),
                        expense: Number(expenseFunda).toFixed(0),
                        profit: Number(revenueFunda - expenseFunda).toFixed(0)
                    }, { new: true })
                }

                return resolve({ error: false, message: 'Đồng bộ thành công' })

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
    getListByProperty({ companyID, option, reportID, accountID }) {
        return new Promise(async resolve => {
            try {
                let infoReport = await FINANCIAL_REPORT_COLL.findById(reportID).populate({
                    path: 'funda',
                    select: '_id name sign'
                })
                // console.log(infoReport)
                if(!accountID){
                    let conditionProject = {}, conditionMatch = {}, conditionGroupDebit = {}, conditionGroupCredit = {}
                    let conditionDebitObj1 = {funda: ObjectID(infoReport.funda._id)}
                    let conditionDebitObj2 = {funda: ObjectID(infoReport.funda._id)}
                    let conditionCreditObj1 = {funda: ObjectID(infoReport.funda._id)}
                    let conditionCreditObj2 = {funda: ObjectID(infoReport.funda._id)}
    
                    let conditionPopulate = {
                        path: '_id.account',
                        select: '_id name description',
                        model: 'account'
                    }
    
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
                        debit: 1,
                        credit: 1
                    }
    
                    conditionMatch = {
                        "forward": 0,
                        "cancel": 0,
                        "date": {
                            $gte: moment(infoReport.fromDate).toDate(),
                            $lte: moment(infoReport.toDate).toDate(),
                        }
                    }
    
                    conditionGroupDebit = {
                        _id: { account: "$debit" },
                        amount: { $sum: "$amount" }
                    }
                    conditionGroupCredit = {
                        _id: { account: "$credit" },
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
                                    {
                                        $sort: {
                                            "_id.account": 1
                                        }
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
                                    },
                                    {
                                        $sort: {
                                            "_id.account": 1
                                        }
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
                                    },
                                    {
                                        $sort: {
                                            "_id.account": 1
                                        }
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
                                    },
                                    {
                                        $sort: {
                                            "_id.account": 1
                                        }
                                    }
                                ],
    
                            }
                        }
                    ])
    
                    await FINANCIAL_GENERAL_JOURNAL_COLL.populate(listData1[0]._debit, conditionPopulate)
                    await FINANCIAL_GENERAL_JOURNAL_COLL.populate(listData1[0]._credit, conditionPopulate)
                    await FINANCIAL_GENERAL_JOURNAL_COLL.populate(listData2[0]._debit, conditionPopulate)
                    await FINANCIAL_GENERAL_JOURNAL_COLL.populate(listData2[0]._credit, conditionPopulate)
    
                    // console.log(listData1[0]._debit)
                    // console.log(listData1[0]._credit)
                    // console.log(listData2[0]._debit)
                    // console.log(listData2[0]._credit)
    
                    return resolve({ error: false, data: {infoReport, listData1, listData2} })
                }else{
                    let conditionObj = {
                        forward: 0,
                        cancel: 0,
                        funda: ObjectID(infoReport.funda._id),
                        date: {
                            $gte: moment(infoReport.fromDate).toDate(),
                            $lte: moment(infoReport.toDate).toDate(),
                        },
                        $or: [
                            { debit: ObjectID(accountID) },
                            { credit: ObjectID(accountID) },
                        ]
                    }
    
                    let listData = await FINANCIAL_GENERAL_JOURNAL_COLL.find(conditionObj)
                    .select('quantity unitprice amount debit credit date voucher note name')
                    .populate({
                        path: 'debit credit voucher',
                        select: 'name description type note'
                    })
                    .sort({date: 1})
                    // console.log(listData)

                    let infoAccount = await ITEM__ACCOUNT_COLL.findById(accountID)
    
                    return resolve({ error: false, data: {infoReport, infoAccount, listData}  })
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
}

exports.MODEL = new Model