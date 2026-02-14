"use strict";
const BaseModel                         = require('../../../tools/db/base_model');
const ObjectID                          = require('mongoose').Types.ObjectId;
const { checkObjectIDs,  IsJsonString}
                                        = require('../../../tools/utils/utils');
const { KEY_ERROR }			            = require('../../../tools/keys');
const moment                            = require("moment");
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');

const ITEM__ACCOUNT_COLL                = require('../../item/database/item.account-coll')
const ITEM_FUNDA_COLL                   = require('../../item/database/item.funda-coll')
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
    exportExcel({ option, companyID, userID, parentID, reportID, accountID }) {
        return new Promise(async resolve => {
            try {
                if(!option){
                    // Thông tin báo cáo
                    let infoParent = await FINANCIAL_REPORT_COLL.findById(parentID).populate({
                        path: 'funda',
                        select: '_id name sign'
                    })

                    // Danh sách cơ sở
                    let listData = await FINANCIAL_REPORT_COLL.find({parent: parentID}).populate({
                        path: 'funda',
                         select: '_id name sign'
                    })

                    let conditionProject = {}, conditionMatch = {}, conditionGroupDebit = {}, conditionGroupCredit = {}
                    
                    // Tài khoản doanh thu chi phí
                    let arrAccounts = []
                    let listAccs = await ITEM__ACCOUNT_COLL.find({ company: companyID, "name": { $regex: "^[5768]" } })
                    .select('_id')
                    if(listAccs){
                        arrAccounts = listAccs.map(item=>ObjectID(item._id))
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
                            $gte: moment(infoParent.fromDate).toDate(),
                            $lte: moment(infoParent.toDate).toDate(),
                        }
                    }
    
                    conditionGroupDebit = {
                        _id: { account: "$debit", funda: "$funda" },
                        amount: { $sum: "$amount" }
                    }
                    conditionGroupCredit = {
                        _id: { account: "$credit", funda: "$funda" },
                        amount: { $sum: "$amount" }
                    }

                    // https://chatgpt.com/share/6739ef43-56c0-8008-a6a8-3a01ac809f23
                    let listData2 = await FINANCIAL_GENERAL_JOURNAL_COLL.aggregate([
                        {
                          $facet: {
                            debits: [
                                {
                                    $match: {
                                        funda: {$in: listData.map(item => ObjectID(item.funda._id))},
                                        debit: {$in: arrAccounts}
                                    }
                                },
                                {
                                    $project: conditionProject
                                },
                                {
                                    $match: conditionMatch
                                },
                                {
                                    $group: {
                                    _id: { funda: "$funda", account: "$debit" }, // Gom nhóm theo funda và debit
                                    totalDebit: { $sum: "$amount" } // Tổng amount của debit
                                    }
                                }
                            ],
                            credits: [
                                {
                                    $match: {
                                        funda: {$in: listData.map(item => ObjectID(item.funda._id))},
                                        credit: {$in: arrAccounts}
                                    }
                                },
                                {
                                    $project: conditionProject
                                },
                                {
                                    $match: conditionMatch
                                },
                                {
                                  $group: {
                                    _id: { funda: "$funda", account: "$credit" }, // Gom nhóm theo funda và credit
                                    totalCredit: { $sum: "$amount" } // Tổng amount của credit
                                  }
                                }
                            ],
                          }
                        },
                        {
                          $project: {
                            credits: 1,
                            debits: 1
                          }
                        },
                        {
                          $project: {
                            merged: {
                              $setUnion: ["$credits", "$debits"] // Gộp chung danh sách debit và credit
                            }
                          }
                        },
                        {
                          $unwind: "$merged"
                        },
                        {
                          $group: {
                            _id: { funda: "$merged._id.funda", account: "$merged._id.account" },
                            totalDebit: { $sum: { $ifNull: ["$merged.totalDebit", 0] } },
                            totalCredit: { $sum: { $ifNull: ["$merged.totalCredit", 0] } },
                          }
                        },
                        {
                          $project: {
                            funda: "$_id.funda",
                            account: "$_id.account",
                            total: { $subtract: ["$totalDebit", "$totalCredit"] }
                          }
                        }
                    ])
                    
                    let conditionPopulate = {
                        path: 'account',
                        select: '_id name description',
                        model: 'account'
                    }
                    await FINANCIAL_GENERAL_JOURNAL_COLL.populate(listData2, conditionPopulate)
                    // console.log(listData2)

                    let arr = []
                    for(const item of listData2){
                        arr.push(item.account)
                    }
                    
                    let listAcc1s = await ITEM__ACCOUNT_COLL.find({ company: companyID, "name": { $regex: "^[57]" }, _id: {$in: listData2.map(item=>item.account)} }) // Doanh thu
                    .select('_id name description')

                    let listAcc2s = await ITEM__ACCOUNT_COLL.find({ company: companyID, "name": { $regex: "^[68]" }, _id: {$in: listData2.map(item=>item.account)} }) // Chi phí
                    .select('_id name description')

                    // CHI TIẾT BÚT TOÁN
                    let listDetail = await FINANCIAL_GENERAL_JOURNAL_COLL.find({
                        forward: 0,
                        cancel: 0,
                        date: {
                            $gte: moment(infoParent.fromDate).toDate(),
                            $lte: moment(infoParent.toDate).toDate(),
                        },
                        $or: [
                            { debit:   {
                                $in: listAccs.map(item=>ObjectID(item._id))
                            }},
                            { credit:  {
                                $in: listAccs.map(item=>ObjectID(item._id))
                            } }
                        ]
                    })
                    .populate({
                        path: 'funda voucher warehouse goods subtype parentSubtype debit credit customerDebit customerCredit',
                         select: '_id name sign unit'
                    })
                    // console.log(listDetail.length)

                    // Modify the workbook.
                    XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/accounting_fin_report.xlsx')))
                    .then(async workbook => {
                        workbook.sheet("BaoCao1").row(2).cell(1).value(infoParent.name);
                        workbook.sheet("BaoCao2").row(2).cell(1).value(infoParent.name);

                        workbook.sheet("BaoCao1").row(2).cell(1).value(`Từ: ${moment(infoParent.fromDate).format('DD/MM/YYYY')}-Đến: ${moment(infoParent.toDate).format('DD/MM/YYYY')}`);
                        workbook.sheet("BaoCao2").row(2).cell(1).value(`Từ: ${moment(infoParent.fromDate).format('DD/MM/YYYY')}-Đến: ${moment(infoParent.toDate).format('DD/MM/YYYY')}`);

                        var i = 4;
                        listData?.forEach((item, index) => {
                            workbook.sheet("BaoCao1").row(i).cell(2).value(item?.funda?.name);
                            workbook.sheet("BaoCao1").row(i).cell(3).value(Number(item.revenue))
                            workbook.sheet("BaoCao1").row(i).cell(4).value(Number(item.expense))
                            workbook.sheet("BaoCao1").row(i).cell(5).value(Number(item.profit))
                            workbook.sheet("BaoCao1").row(i).cell(6).value(item.note)

                            workbook.sheet("BaoCao2").row(2).cell(i+2).value(`${item?.funda?._id}`);
                            workbook.sheet("BaoCao2").row(3).cell(i+2).value(item?.funda?.name)

                            i++
                        })

                        var i = 5;
                        workbook.sheet("BaoCao2").row(4).cell(3).value('DOANH THU').style({
                            bold: true,
                        })
                        listAcc1s?.forEach((item, index) => {
                            workbook.sheet("BaoCao2").row(i).cell(2).value(item?.name);
                            workbook.sheet("BaoCao2").row(i).cell(3).value(item?.description)
                            workbook.sheet("BaoCao2").row(i).cell(4).value(`${item?._id}`)

                            i++
                        })
                        workbook.sheet("BaoCao2").row(15).cell(3).value('CHI PHÍ')
                        .style({
                            bold: true,
                        })

                        var i = 16;
                        listAcc2s?.forEach((item, index) => {
                            workbook.sheet("BaoCao2").row(i).cell(2).value(item?.name);
                            workbook.sheet("BaoCao2").row(i).cell(3).value(item?.description)
                            workbook.sheet("BaoCao2").row(i).cell(4).value(`${item?._id}`)

                            i++
                        })

                        var i = 4;
                        listData2?.forEach((item, index) => {
                            workbook.sheet("Combine").row(i).cell(2).value(`${item?.account._id}`)
                            workbook.sheet("Combine").row(i).cell(3).value(`${item?.account.name}`)
                            workbook.sheet("Combine").row(i).cell(4).value(`${item?.account.description}`)
                            workbook.sheet("Combine").row(i).cell(5).value(`${item?.funda}`)
                            workbook.sheet("Combine").row(i).cell(6).value(Number(item.total))

                            i++
                        })

                        var i = 4;
                        listDetail?.forEach((item, index) => {
                            workbook.sheet("Detail").row(i).cell(1).value(item.date)
                            workbook.sheet("Detail").row(i).cell(2).value(item?.funda?.name)
                            workbook.sheet("Detail").row(i).cell(3).value(item?.subtype?.name)
                            workbook.sheet("Detail").row(i).cell(4).value(item?.parentSubtype?.name)
                            workbook.sheet("Detail").row(i).cell(5).value(item?.voucher?.name)
                            workbook.sheet("Detail").row(i).cell(6).value(item?.voucher?.sign)
                            workbook.sheet("Detail").row(i).cell(7).value(item?.customerDebit?.name)
                            workbook.sheet("Detail").row(i).cell(8).value(item?.customerCredit?.name)
                            workbook.sheet("Detail").row(i).cell(9).value(item?.debit?.name)
                            workbook.sheet("Detail").row(i).cell(10).value(item?.credit?.name)
                            workbook.sheet("Detail").row(i).cell(11).value(Number(item?.quantity))
                            workbook.sheet("Detail").row(i).cell(12).value(Number(item?.unitprice))
                            workbook.sheet("Detail").row(i).cell(13).value(Number(item?.amount))
                            workbook.sheet("Detail").row(i).cell(14).value(item?.goods?.name)
                            workbook.sheet("Detail").row(i).cell(15).value(item?.warehouse?.name)
                            workbook.sheet("Detail").row(i).cell(16).value(item?.note)

                            i++
                        })

                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `BaoCaoLaiLo_${now.getTime()}.xlsx`;
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