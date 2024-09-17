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
const { CF_ACTIONS_ITEM } 		        = require('../../item/helper/item.actions-constant');
const { RANGE_BASE_PAGINATION_V2 } 	    = require('../../../tools/cursor_base/playground/index');

const ITEM__FUNDA_COLL            		= require('../../item/database/item.funda-coll'); 
const STORE_ORDER_COLL                  = require('../database/store.order-coll');
const STORE_ORDER_PRODUCT_COLL          = require('../database/store.order_product-coll');
const ITEM__GOODS_COLL            		= require('../../item/database/item.goods-coll')
const ITEM__ACCOUNT_COLL            	= require('../../item/database/item.account-coll')
const ITEM__CONTACT_COLL            	= require('../../item/database/item.contact-coll')

/**
 * import inter-model, exter-model
 */
const XlsxPopulate                      = require('xlsx-populate');
const fs                                = require('fs');
const path                              = require('path');
const { uploadFileS3 }                  = require('../../../tools/s3');

class Model extends BaseModel {

    constructor() {
        super(STORE_ORDER_PRODUCT_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 24/11/2022
     */
    insert({ userID, orderID, accountID, contraID, customerID, contractID, goodsID, assetsID, workID, name, note, quantity, unitPrice }) {
        // console.log({ userID, orderID, accountID, contraID, customerID, contractID, goodsID, assetsID, workID, name, note, quantity, unitPrice })
        const that = this
        return new Promise(async resolve => {
            try {
                /**
                 * BA-Mục đích
                 * 1. Tạo sổ quỹ
                 * 2. Tạo thẻ kho
                 * 3. Theo dõi công nợ
                 * 4. Quản lý đơn hàng bán ra
                 * 5. Đồng bộ doanh thu, nhập xuất với Kế toán
                 */
                const infoParent = await STORE_ORDER_COLL
                .findById(orderID)
                .select('company project warehouse customer contract outin type date')
                .lean();
                if(!infoParent)
                    return resolve({error: true, message: "Phiếu không tồn tại", keyError: KEY_ERROR.PARAMS_INVALID});

                if (!name)
                    return resolve({error: true, message: "name invalid", keyError: KEY_ERROR.PARAMS_INVALID});

                let dataInsert = { 
                    order: orderID,
                    company: infoParent.company,
                    project: infoParent.project,
                    warehouse: infoParent.warehouse,
                    customer: infoParent.customer,
                    contract: infoParent.contract,
                    outin: infoParent.outin,
                    type: infoParent.type,
                    date: infoParent.date,
                    userCreate: userID, 
                    userCreate: userID, 
                    admins: [userID], 
                    members: [userID],
                    name,
                }

                if (checkObjectIDs(accountID)) {
                    dataInsert.account = accountID;
                }
                if (checkObjectIDs(contraID)) {
                    dataInsert.contra = contraID;
                }
                if (checkObjectIDs(customerID)) {
                    dataInsert.customer = customerID;
                }
                if (checkObjectIDs(contractID)) {
                    dataInsert.contract = contractID;
                }
                if (checkObjectIDs(goodsID)) {
                    dataInsert.goods = goodsID;
                }
                if (checkObjectIDs(assetsID)) {
                    dataInsert.assets = assetsID;
                }
                if (checkObjectIDs(workID)) {
                    dataInsert.work = workID;
                }

                let convertStr = name
                if (note && note != '') {
                    dataInsert.note = note;
                    convertStr = convertStr + " " + stringUtils.removeAccents(note)
                }
                if(convertStr != ""){
                    dataInsert.namecv = convertStr
                }

                let unitPrice2 = 0
                if (unitPrice != 0) {
                    unitPrice2 = Number(unitPrice)
                }
                if (quantity) {
                    dataInsert.quantity = Number(quantity)
                }
                if(unitPrice2 >= 0){
                    let amount  = Number(quantity * unitPrice2).toFixed(0)

                    dataInsert.unitPrice = unitPrice2
                    dataInsert.amount = amount
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if (!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 });

                // Cập nhật lại thông tin Order
                await that.updateValue({orderID, userID})

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
    updateValue({ orderID, userID }){
        return new Promise(async (resolve) => {
            try {    
                let dataUpdate = { 
                    userUpdate: userID, 
                    modifyAt: new Date() 
                };

                let listData = await STORE_ORDER_PRODUCT_COLL.aggregate([
                    {
                        $match: {
                            order: ObjectID(orderID),
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

                let infoAfterUpdate = await STORE_ORDER_COLL.findByIdAndUpdate(orderID, dataUpdate, { new: true });
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
    update({ userID, orderProductID, accountID, contraID, customerID, contractID, goodsID, assetsID, workID, name, note, quantity, unitPrice }) {
        const that = this
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(orderProductID))
                    return resolve({ error: true, message: 'orderProductID__invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                let dataUpdate = { 
                    userUpdate: userID, 
                    modifyAt: new Date() 
                };

                if (checkObjectIDs(accountID)) {
                    dataUpdate.account = accountID;
                }
                if (checkObjectIDs(contraID)) {
                    dataUpdate.contra = contraID;
                }
                if (checkObjectIDs(customerID)) {
                    dataUpdate.customer = customerID;
                }
                if (checkObjectIDs(contractID)) {
                    dataUpdate.contract = contractID;
                }
                if (checkObjectIDs(goodsID)) {
                    dataUpdate.goods = goodsID;
                }
                if (checkObjectIDs(assetsID)) {
                    dataUpdate.assets = assetsID;
                }
                if (checkObjectIDs(workID)) {
                    dataUpdate.work = workID;
                }

                let convertStr = ''
                if (name && name != '') {
                    dataUpdate.name = name;
                    convertStr = convertStr + " " + stringUtils.removeAccents(name)
                }
                if (note && note != '') {
                    dataUpdate.note = note;
                    convertStr = convertStr + " " + stringUtils.removeAccents(note)
                }
                if(convertStr != ""){
                    dataUpdate.namecv = convertStr
                }

                let unitPrice2 = 0
                if (unitPrice != 0) {
                    unitPrice2 = Number(unitPrice)
                }
                if (quantity) {
                    dataUpdate.quantity = Number(quantity)
                }
                if(unitPrice2 >= 0){
                    let amount  = Number(quantity * unitPrice2).toFixed(0)

                    dataUpdate.unitPrice = unitPrice2
                    dataUpdate.amount = amount
                }
                // console.log({ dataUpdate })

                let infoAfterUpdate = await STORE_ORDER_PRODUCT_COLL.findByIdAndUpdate(orderProductID, dataUpdate, { new: true })
                if (!infoAfterUpdate)
                    return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED })

                // Cập nhật lại thông tin Order
                await that.updateValue({orderID: infoAfterUpdate.order, userID})

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        });
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

                let infoPlanGroup = await STORE_ORDER_PRODUCT_COLL.findById(orderProductID)
                                    .select(select)
                                    .populate(populates)

                if (!infoPlanGroup) return resolve({ error: true, message: 'cannot_get', keyError: KEY_ERROR.GET_INFO_FAILED });

                return resolve({ error: false, data: infoPlanGroup });
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
    getList({  option, status, outin, type, userID, companyID, fundaID, projectID, warehouseID, accountID, contraID, customerID, goodsID, assetsID, orderID, userCreateID, fromDate, toDate, keyword, limit = 50, lastestID, select, populates = {}, sortKey }) {
        // console.log({ option, status, outin, type, userID, companyID, fundaID, projectID, warehouseID, accountID, contraID, customerID, goodsID, assetsID, orderID, userCreateID, fromDate, toDate, keyword })
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) > 50){
                    limit = 50;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = {}
                let sortBy;
                let keys	 = ['createAt__1', '_id__1'];

                // Gom nhóm theo đơn vị cơ sở
                if(orderID ){
                    conditionObj.order = ObjectID(orderID)
                }else{
                    if(fundaID ){
                        conditionObj.funda = ObjectID(fundaID)
                    }else{
                        // Thẻ kho
                        if(option == 1){
                            conditionObj.company = companyID
                            conditionObj.goods = { $exists: true, $ne: null }
                        }

                        // Sổ quỹ
                        if(option == 2){
                            conditionObj.company = companyID
                            conditionObj.account = { $exists: true, $ne: null }
                        }

                        // Công nợ
                        if(option == 3){
                            conditionObj.company = companyID
                            conditionObj.customer = { $exists: true, $ne: null }
                        }
                    }
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

                if (checkObjectIDs(projectID)) {
                    conditionObj.project = projectID;
                }

                if (checkObjectIDs(warehouseID)) {
                    conditionObj.warehouse = warehouseID;
                }

                if (checkObjectIDs(accountID)) {
                    conditionObj.account = accountID;
                }

                if (checkObjectIDs(contraID)) {
                    conditionObj.contra = contraID;
                }

                if (checkObjectIDs(customerID)) {
                    conditionObj.customer = customerID;
                }

                if (checkObjectIDs(userCreateID)) {
                    conditionObj.userCreate = userCreateID;
                }

                if (checkObjectIDs(goodsID)) {
                    conditionObj.goods = goodsID;
                }

                if (checkObjectIDs(assetsID)) {
                    conditionObj.assets = assetsID;
                }

                if (!isNaN(status) && Number(status) >= 1) {
                    conditionObj.status = Number(status)
                }

                if (!isNaN(outin) && Number(outin) >= 1) {
                    conditionObj.outin = Number(outin)
                }

                if (!isNaN(type) && Number(type) >= 1) {
                    conditionObj.type = Number(type)
                }

                if (keyword) {
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = RegExp(keyword, 'i');
                }
                // console.log(conditionObj)
                
                let conditionObjOrg = { ...conditionObj };
                if(lastestID && checkObjectIDs(lastestID)){
                    let infoData = await STORE_ORDER_PRODUCT_COLL.findById(lastestID);
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

                let infoDataAfterGet = await STORE_ORDER_PRODUCT_COLL.find(conditionObj)
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
                let totalRecord = await STORE_ORDER_PRODUCT_COLL.count(conditionObjOrg);
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
    getListByProperty({ companyID, option, outin, type, projectID, warehouseID, accountID, contraID, customerID, goodsID, assetsID, userCreateID, fromDate, toDate }) {
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
                    outin: 1, // Xuất ra
                }
                let conditionObj2 = {
                    company: ObjectID(companyID),
                    status: 5, // Hoàn thành
                    outin: 2, // Nhập vào
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

                let listData1 = await STORE_ORDER_PRODUCT_COLL.aggregate([
                    {
                        $match: conditionObj1
                    },
                    {
                        $group: conditionGroup
                    },
                ])

                let listData2 = await STORE_ORDER_PRODUCT_COLL.aggregate([
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

                    return resolve({ error: false, data: arrCombine })
                }

                // Sổ quỹ
                else if(option == 2){
                    let listItem = await ITEM__ACCOUNT_COLL.find({_id: {$in: arr.map(item => item._id.account)}})
                    .select('name description')

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

                    let listData  = await STORE_ORDER_COLL.find(conditionObj)
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

                    let listData2 = await STORE_ORDER_PRODUCT_COLL.aggregate([
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

                    await STORE_ORDER_PRODUCT_COLL.populate(listData2, conditionPopulate1)
                    await STORE_ORDER_PRODUCT_COLL.populate(listData2, conditionPopulate2)
                    // console.log(listData2)

                    let listData3 = await STORE_ORDER_PRODUCT_COLL.aggregate([
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
                    await STORE_ORDER_PRODUCT_COLL.populate(listData3, conditionPopulate1)

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