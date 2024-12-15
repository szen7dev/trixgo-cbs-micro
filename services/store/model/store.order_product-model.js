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

const ITEM__DEPARTMENT_COLL             = require('../../item/database/item.department-coll'); 
const ITEM__FUNDA_COLL            		= require('../../item/database/item.funda-coll'); 
const STORE_ORDER_COLL                  = require('../database/store.order-coll');
const STORE_ORDER_PRODUCT_COLL          = require('../database/store.order_product-coll');
const ITEM__GOODS_COLL            		= require('../../item/database/item.goods-coll')
const ITEM__ACCOUNT_COLL            	= require('../../item/database/item.account-coll')
const ITEM__CONTACT_COLL            	= require('../../item/database/item.contact-coll')
const ITEM__DOCTYPE_COLL            	= require('../../item/database/item.doctype-coll')
const BUDGET_WORK_COLL                  = require('../../budget/database/budget.work-coll')

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
    insert({ userID, fundaID, orderID, accountID, contraID, customerID, contractID, goodsID, assetsID, workID, subtypeID, name, note, quantity, weight, unitPrice }) {
        // console.log({ userID, fundaID, orderID, accountID, contraID, customerID, contractID, goodsID, assetsID, workID, subtypeID, name, note, quantity, weight, unitPrice })
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
                .select('company funda project package toPackage warehouse customer contract outin type date toDate')
                .lean();
                if(!infoParent)
                    return resolve({error: true, message: "Phiếu không tồn tại", keyError: KEY_ERROR.PARAMS_INVALID});

                if (!name)
                    return resolve({error: true, message: "name invalid", keyError: KEY_ERROR.PARAMS_INVALID});

                let dataInsert = { 
                    order: orderID,
                    company: infoParent.company,
                    funda: infoParent.funda,
                    project: infoParent.project,
                    package: infoParent.package,
                    toPackage: infoParent.toPackage,
                    warehouse: infoParent.warehouse,
                    toWarehouse: infoParent.toWarehouse,
                    customer: infoParent.customer,
                    contract: infoParent.contract,
                    outin: infoParent.outin,
                    type: infoParent.type,
                    date: infoParent.date,
                    toDate: infoParent.toDate,
                    userCreate: userID, 
                    admins: [userID], 
                    members: [userID],
                    name,
                }

                if (checkObjectIDs(fundaID)) {
                    dataInsert.funda = fundaID;
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
                    let infoGoods = await ITEM__GOODS_COLL.findById(goodsID)
                    dataInsert.goods = goodsID;

                    if(infoGoods && infoGoods.parent){
                        dataInsert.parentGoods = infoGoods.parent;
                    }
                }
                if (checkObjectIDs(assetsID)) {
                    dataInsert.assets = assetsID;
                }
                if (checkObjectIDs(workID)) {
                    dataInsert.budgetWork = workID;
                    
                    // Lấy thông tin phần tử cha để đưa sang
                    let infoWork = await BUDGET_WORK_COLL.findById(workID)
                    if(infoWork){
                        if(infoWork.budget){
                            dataInsert.budget = infoWork.budget;
                        }
                        if(infoWork.item){
                            dataInsert.budgetItem = infoWork.item;
                        }
                        if(infoWork.group){
                            dataInsert.budgetGroup = infoWork.group;
                        }
                    }
                }

                if (checkObjectIDs(subtypeID)) {
                    dataInsert.subtype = subtypeID;

                    // Lấy thông tin phần tử cha để đưa sang
                    let infoDoctype = await ITEM__DOCTYPE_COLL.findById(subtypeID)
                    if(infoDoctype){
                        if(infoDoctype.parent){
                            dataInsert.parentSubtype = infoDoctype.parent;
                        }
                    }
                }

                let convertStr = name
                if (note && note != '') {
                    dataInsert.note = note;
                    convertStr = convertStr + " " + stringUtils.removeAccents(note)
                }
                if(convertStr != ""){
                    dataInsert.namecv = convertStr
                }

                let unitPrice2 = 0, quantity2 = 1
                if (unitPrice != 0 && !isNaN(unitPrice)) {
                    unitPrice2 = Number(unitPrice)
                }
                if (quantity && !isNaN(quantity)) {
                    quantity2 = Number(quantity)
                }
                // console.log({quantity2, unitPrice2})

                if (weight && !isNaN(weight)) {
                    dataInsert.weight = weight
                }

                if(unitPrice2 >= 0){
                    let amount  = Number(quantity2 * unitPrice2).toFixed(0)

                    dataInsert.quantity = quantity2
                    dataInsert.unitPrice = unitPrice2
                    dataInsert.amount = amount
                }
                // console.log(dataInsert)

                let infoAfterInsert = await this.insertData(dataInsert);
                if (!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 });

                // Cập nhật lại thông tin Order
                await that.updateValue({orderID, userID})

                await STORE_ORDER_COLL.findByIdAndUpdate(orderID, { 
                    $addToSet: { products: infoAfterInsert._id } 
                }, { new: true });

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
    update({ userID, orderProductID, fundaID, filesID, checked, accountID, contraID, customerID, contractID, goodsID, assetsID, workID, subtypeID, name, note, quantity, weight, unitPrice }) {
        // console.log({ userID, orderProductID, fundaID, filesID, checked, accountID, contraID, customerID, contractID, goodsID, assetsID, workID, subtypeID, name, note, quantity, weight, unitPrice })
        const that = this
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(orderProductID))
                    return resolve({ error: true, message: 'orderProductID__invalid', keyError: KEY_ERROR.PARAMS_INVALID });

                let dataUpdate = { 
                    userUpdate: userID, 
                    modifyAt: new Date() 
                };

                if (checkObjectIDs(filesID)) {
                    dataUpdate.$addToSet = { files: filesID };
                }

                if (checkObjectIDs(fundaID)) {
                    dataUpdate.funda = fundaID;
                }
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
                    let infoGoods = await ITEM__GOODS_COLL.findById(goodsID)
                    dataUpdate.goods = goodsID;

                    if(infoGoods && infoGoods.parent){
                        dataUpdate.parentGoods = infoGoods.parent;
                    }else{
                        dataUpdate.parentGoods = null;
                    }
                }

                if (checkObjectIDs(assetsID)) {
                    dataUpdate.assets = assetsID;
                }
                if (checkObjectIDs(workID)) {
                    dataUpdate.budgetWork = workID;

                    // Lấy thông tin phần tử cha để đưa sang
                    let infoWork = await BUDGET_WORK_COLL.findById(workID)
                    if(infoWork){
                        if(infoWork.budget){
                            dataUpdate.budget = infoWork.budget;
                        }
                        if(infoWork.item){
                            dataUpdate.budgetItem = infoWork.item;
                        }
                        if(infoWork.group){
                            dataUpdate.budgetGroup = infoWork.group;
                        }
                    }
                }

                if (checkObjectIDs(subtypeID)) {
                    dataUpdate.subtype = subtypeID;

                    // Lấy thông tin phần tử cha để đưa sang
                    let infoDoctype = await ITEM__DOCTYPE_COLL.findById(subtypeID)
                    if(infoDoctype){
                        if(infoDoctype.parent){
                            dataUpdate.parentSubtype = infoDoctype.parent;
                        }
                    }
                }
                
                if (checked && !isNaN(checked) && Number(checked) > 0) {
                    dataUpdate.checked = checked;
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
                if (quantity && !isNaN(quantity)) {
                    dataUpdate.quantity = Number(quantity)
                }

                if (weight && !isNaN(weight)) {
                    dataUpdate.weight = weight
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

                let info = await STORE_ORDER_PRODUCT_COLL.findById(orderProductID)
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
    getList({  option, status, outin, type, userID, companyID, fundaID, projectID, packageID, toPackageID, warehouseID, accountID, contraID, customerID, goodsID, parentGoodsID, assetsID, workID, subtypeID, orderID, userCreateID, fromDate, toDate, keyword, limit = 50, lastestID, select, populates = '{"path":"account contra goods assets funda customer work budgetWork userCreate userUpdate order project package toPackage contract subtype parentSubtype","select":"name sign phone unit note fullname description image"}', sortKey }) {
        // console.log({ option, status, outin, type, userID, companyID, fundaID, populates, projectID, packageID, toPackageID, warehouseID, accountID, contraID, customerID, goodsID, assetsID, workID, orderID, userCreateID, fromDate, toDate, keyword })
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
                            conditionObj.type = {$in: [7, 8]}
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

                if (checkObjectIDs(packageID)) {
                    conditionObj.package = packageID;
                }

                if (checkObjectIDs(toPackageID)) {
                    conditionObj.toPackage = toPackageID;
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

                if (checkObjectIDs(parentGoodsID)) {
                    conditionObj.parentGoods = parentGoodsID;
                }

                if (checkObjectIDs(assetsID)) {
                    conditionObj.assets = assetsID;
                }

                if (checkObjectIDs(workID)) {
                    conditionObj.budgetWork = workID;
                }

                if (checkObjectIDs(subtypeID)) {
                    conditionObj.subtype = subtypeID;
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

                    let listDataCompany = await STORE_ORDER_PRODUCT_COLL.aggregate([
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
                    
                    let listDataAccount = await STORE_ORDER_PRODUCT_COLL.aggregate([
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

                    await STORE_ORDER_PRODUCT_COLL.populate(listDataCompany, {
                        path: '_id.company',
                        select: '_id name sign image',
                        model: 'company'
                    })

                    await STORE_ORDER_PRODUCT_COLL.populate(listDataAccount, {
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
                        let listData = await STORE_ORDER_PRODUCT_COLL.aggregate([
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
                        let listData = await STORE_ORDER_PRODUCT_COLL.aggregate([
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

                    let listData1 = await STORE_ORDER_PRODUCT_COLL.aggregate([
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

                    let listData2 = await STORE_ORDER_PRODUCT_COLL.aggregate([
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

                    let listData1 = await STORE_ORDER_PRODUCT_COLL.aggregate([
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

                    let listData2 = await STORE_ORDER_PRODUCT_COLL.aggregate([
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
     * Name: Cập nhật giá vốn cho hàng hóa cho 01 phiếu xuất
     * Code: Hiepnh
     * Date: 15/12/2024
     */
    getPrimeCost({ goodsID, warehouseID, exportQuantity, toDate }) {
        return new Promise(async resolve => {
            try {
                /**
                 * BA: CÁC NGUYÊN NHÂN DẪN ĐẾN SAI SÓT KHI CHẠY GIÁ VỐN
                 * 1. Giá vốn được tính cho 1 phiếu xuất, tính tới thời điểm của phiếu đó (ví dụ phiếu xuất ngày 30/6/2020)
                 *  Giá vốn = (Tổng giá trị nhập - Tổng giá trị xuất)/(Tổng KL nhập - Tổng KL xuất)
                 * 2. Số liệu về nhập hàng tính tới ngày của phiếu (30/6/2020)
                 * 3. Số liệu xuất hàng tính tới trước thời điểm xuất kho của phiếu (29/6/2020)
                 * 4. Với các phiếu nhập hàng trả lại thì cần điền đầy đủ cả giá nhập hàng (không được bỏ trống)
                 * 5. Khi xuất hàng mà trong kho không có (xuất hàng âm) thì sẽ không chạy được giá vốn
                 * 6. Nhập hàng trả lại thì giá nhập = giá vốn xuất ra của phiếu tương ứng/cùng mã hàng
                 */
                let conditionDebitObj = {
                    outin: 2, // Nhập kho
                    warehouse: ObjectID(warehouseID),
                    goods: ObjectID(goodsID),
                }
                let conditionCreditObj = {
                    outin: 1, // Xuất kho
                    warehouse: ObjectID(warehouseID),
                    goods: ObjectID(goodsID),
                }

                let conditionGroupDebit = {
                    _id: { goods: "$goods" },
                    quantity: { $sum: "$quantity" },
                    amount: { $sum: "$amount" }
                }
                let conditionGroupCredit = {
                    _id: { goods: "$goods" },
                    quantity: { $sum: "$quantity" },
                    amount: { $sum: "$amount" }
                }

                let conditionProject = {
                    year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                    forward: 1,
                    status: 1,
                    date: 1,
                    quantity: 1,
                    amount: 1,
                    goods: 1,
                    warehouse: 1,
                }

                // Lấy năm của ngày đầu kỳ
                let year = moment(toDate).toDate().getFullYear()
                // let firstDayOfYear = `${Number(year)}-01-01T00:00:00.000Z` // Cũ bên kế toán
                let firstDayOfYear = `${Number(year)}-01-01T00:00:00.000+07:00`

                // Kết chuyển cuối kỳ năm trước sang đầu kỳ năm sau (Original)
                let conditionMatchO = {
                    "forward": 1,
                    "status": 5,
                    "year": Number(year)
                }

                // Từ đầu năm tới đầu kỳ***
                let conditionMatchDebitIn = {
                    "forward": 0,
                    "status": 5,
                    "date": {
                        $gte: moment(firstDayOfYear).toDate(), // Tính từ firstDayOfYear | fromDate
                        $lte: moment(toDate).toDate(),
                    },
                }

                let conditionMatchCreditIn = {
                    "forward": 0,
                    "status": 5,
                    "date": {
                        $gte: moment(firstDayOfYear).toDate(), // Tính từ firstDayOfYear | fromDate
                        $lt: moment(toDate).toDate(), // Không lấy dữ liệu các phiếu xuất cùng ngày (toDate) vì đang chờ để chạy giá vốn
                    },
                }

                // console.log(conditionDebitObj)
                // console.log(conditionCreditObj)
                // console.log(conditionProject)
                // console.log(conditionMatchDebitIn)
                // console.log(conditionMatchCreditIn)

                /**
                * DATA KẾT CHUYỂN/ĐẦU NĂM
                * Không lấy dữ liệu các phiếu xuất cùng ngày (toDate) vì đang chờ để chạy giá vốn
                * Nếu lấy vào thì sẽ bị hiện tượng:
                * - Số lượng xuất hàng bị cộng vào
                * - Giá trị xuất hàng thì = 0 (do chưa gán giá vốn)
                * ===> dẫn đến dữ liệu không chính xác
                * Yennt: Trong cùng ngày thì giá xuất vẫn tính cả giá nhập của ngày đó
                */
                let listDataO = await STORE_ORDER_PRODUCT_COLL.aggregate([
                    {
                        $facet: {
                            _debit:[
                                {
                                    $match: conditionDebitObj
                                },
                                {
                                    $project: conditionProject
                                },
                                {
                                    $match: conditionMatchO
                                },
                                {
                                    $group: conditionGroupDebit
                                }
                            ],
                            _credit:[
                                {
                                    $match: conditionCreditObj
                                },
                                {
                                    $project: conditionProject
                                },
                                {
                                    $match: conditionMatchO
                                },
                                {
                                    $group: conditionGroupCredit
                                }
                            ],

                        }
                    }
                ])
                // console.log('=========MỐC ĐẦU NĂM=========')
                // console.log({_____: listDataO})
                // console.log({_____No: listDataO[0]._debit})
                // console.log({_____Co: listDataO[0]._credit})

                let listDataIn = await STORE_ORDER_PRODUCT_COLL.aggregate([
                    {
                        $facet: {
                            _debit:[
                                {
                                    $match: conditionDebitObj
                                },
                                {
                                    $project: conditionProject
                                },
                                {
                                    $match: conditionMatchDebitIn
                                },
                                {
                                    $group: conditionGroupDebit
                                }
                            ],

                            _credit:[
                                {
                                    $match: conditionCreditObj
                                },
                                {
                                    $project: conditionProject
                                },
                                {
                                    $match: conditionMatchCreditIn
                                },
                                {
                                    $group: conditionGroupCredit
                                }
                            ],

                        }
                    }
                ])
                // console.log('=========ĐẦU NĂM-CUỐI KỲ=========')
                // console.log( {
                //     $match: conditionDebitObj
                // },
                // {
                //     $project: conditionProject
                // },
                // {
                //     $match: conditionMatchDebitIn
                // },
                // {
                //     $group: conditionGroupDebit
                // })
                // console.log({_____: listDataIn})
                // console.log({_____No: listDataIn[0]._debit})
                // console.log({_____Co: listDataIn[0]._credit})
                
                let importNum = 0, importVal = 0, exportNum = 0, exportVal = 0;

                if(listDataO[0]._debit.length > 0){
                    importNum = Number(importNum + listDataO[0]._debit[0].quantity)
                    importVal = Number(importVal + listDataO[0]._debit[0].amount)
                }
                if(listDataO[0]._credit.length > 0){
                    exportNum = Number(exportNum + listDataO[0]._credit[0].quantity)
                    exportVal = Number(exportVal + listDataO[0]._credit[0].amount)
                }

                if(listDataIn[0]._debit.length > 0){
                    importNum = Number(importNum + listDataIn[0]._debit[0].quantity)
                    importVal = Number(importVal + listDataIn[0]._debit[0].amount)
                }


                if(listDataIn[0]._credit.length > 0){
                    exportNum = Number(exportNum + listDataIn[0]._credit[0].quantity)
                    exportVal = Number(exportVal + listDataIn[0]._credit[0].amount)
                }

                let primeCost = 0, errGoods = false;

                /**
                 * Kiểm tra điều kiện để xuất được hàng:
                 * - Số lượng hàng tồn > 0
                 * - Số lượng xuất hàng <= số lượng hàng tồn
                 */

                // Chỉ tiến hành chạy giá vốn cho trường hợp hợp lệ
                if(Number(importNum-exportNum) > 0){
                    // Không làm tròn ở đây để giá trị nguyên bản => khi nhân ra thành tiền mới đúng, sau đó mới làm tròn
                    primeCost = Number((importVal-exportVal)/(importNum-exportNum))
                }

                // Lấy hàng hóa bị xuất hàng âm để thông báo
                if(Number((Number(importNum) - Number(exportNum) - Number(exportQuantity)).toFixed(3)) < 0){
                    errGoods = true
                }

                return resolve({ error: false, data: {value: importVal-exportVal, number: importNum-exportNum, primeCost, errGoods } })
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }  

    /**
     * Name: Cập nhật giá vốn cho hàng hóa cho 01 phiếu xuất
     * Code: Hiepnh
     * Date: 15/12/2024
     */
    updatePrimeCost({ voucherID, voucherDate }){
        const that = this;
        return new Promise(async resolve => {
            try {
                /**
                 * Khai báo arr hứng các hàng hóa có việc xuất bị sai
                 */
                let arrGoodsFailed = [];

                /**
                 * Lấy danh sách hàng hóa thuộc phiếu xuất
                 * Hàng hoá phải được gắn kèm thuộc kho bãi cụ thể
                 */
                let listJournal = await STORE_ORDER_PRODUCT_COLL.find({
                    order: voucherID,
                    goods: { $exists: true, $ne: null },
                    warehouse: { $exists: true, $ne: null }
                }).select('goods warehouse quantity date')
                // console.log(listJournal.length)
                // console.log(listJournal)

                let totalAmount = 0
                for(const item of listJournal){
                    let info = null;
                    let unitPrice = null;
                    let amount = null;

                    /**
                     * Lần lượt cập nhật giá vốn cho từng hàng hóa trong phiếu
                     * Giá vốn được tính tới thời điểm là ngày của phiếu đang xét
                     */
                    // Kiểm tra chỉ chạy giá vốn khi tồn tại cả item.goods và item.warehouse
                    info = await that.getPrimeCost({ goodsID: item.goods, warehouseID: item.warehouse, exportQuantity: item.quantity, toDate: voucherDate });
                    // console.log(info)

                    // Cập nhật giá vốn cho hàng hóa vào trong phiếu xuất
                    unitPrice = info.data.primeCost

                    amount = Number(+item.quantity * +unitPrice)  // Bỏ làm tròn đi vì sẽ bị sai số cộng dồn

                    totalAmount = Number(totalAmount) + Number(amount)

                    await STORE_ORDER_PRODUCT_COLL.findByIdAndUpdate(item._id, {
                        unitPrice, // Sau này bỏ trường này đi
                        amount
                    }, { new: true })

                    // Ghi nhận dữ liệu lỗi
                    if(info.data.errGoods){
                        arrGoodsFailed.push(item.goods)
                    }
                }

                await STORE_ORDER_COLL.findByIdAndUpdate(voucherID, {
                    amount: totalAmount
                }, { new: true })

                /**
                 * B3: Lấy thông tin các hàng hóa xuất lỗi để hiển thị cho người dùng
                 */
                let listGoodsFailed = await ITEM__GOODS_COLL.find({ _id: { $in: arrGoodsFailed }})

                return resolve({ error: false, listGoodsFailed })
            } catch (error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    analysePrimeCostOfAllVouchers({ companyID, fromDate, toDate, userID, queue }){
		const that = this;
		return new Promise(async resolve => {
			try {
                let conditionOb = { 
                    company: companyID,
                    type: {$in: [1,2,3,4,5,6]}, // Vật tư....
                    // returning: 0, // Không chạy cho các Phiếu trả lại hàng mượn
                    forward: 0, // Không chạy cho các Phiếu kết chuyển cuối kỳ
                    status: 5, // Không chạy cho các Phiếu hủy
                    outin: 1, // 5 là Phiếu xuất (cần check lại chỗ này vì đôi khi người dùng chọn nhầm Tên phiếu)
                    date: { 
                        $gte: moment(fromDate).toDate(),
                        $lte: moment(toDate).toDate() 
                    }
                }
                // console.log(conditionOb)

                let listVouchers = await STORE_ORDER_COLL
                    .find(conditionOb)
                    .sort({ date: 1 })
                    .select('_id date name')
                    .lean();

                // console.log(listVouchers)
                console.log(listVouchers.length)

                if(!listVouchers.length) {
                    return resolve({ error: false, data: [] })
                }

                /**
                 * Xử lý Worker
                 */
                // for(const voucher of listVouchers) {
                //     await queue.add("price_analyze", {
                //         voucher,
                //         fundaID,
                //         companyID,
                //         userID,
                //         arrObjectID
                //     }, {
                //         backoff: 3,
                //         attempts: 3
                //     })
                // }

                // return resolve({ error: false, data: listVouchers, status: 200 });

                /**
                 * Khai báo arr hứng các hàng hóa có việc xuất bị sai
                 */
                let arrGoodsFailed = [];
                for(const voucher of listVouchers){
                    let voucherID = voucher._id

                    let listJournal = await STORE_ORDER_PRODUCT_COLL.find({
                        order: voucherID,
                        goods: { $exists: true, $ne: null },
                        warehouse: { $exists: true, $ne: null }
                    }).select('goods warehouse quantity date')

                    let totalAmount = 0
                    for(const item of listJournal){
                        let info = null;
                        let unitPrice = null;
                        let amount = null;

                        info = await that.getPrimeCost({ goodsID: item.goods, warehouseID: item.warehouse, exportQuantity: item.quantity, toDate: voucher.date })
                        unitPrice = info.data.primeCost
                        amount = Number(+item.quantity * +unitPrice)
                        totalAmount = Number(totalAmount) + Number(amount)

                        await STORE_ORDER_PRODUCT_COLL.findByIdAndUpdate(item._id, {
                            unitPrice, // Sau này bỏ trường này đi
                            amount
                        }, { new: true })

                        // Ghi nhận dữ liệu lỗi
                        if(info.data.errGoods){
                            arrGoodsFailed.push(item.goods)
                        }
                    }

                    await STORE_ORDER_COLL.findByIdAndUpdate(voucherID, {
                        amount: totalAmount
                    }, { new: true })
                }

                let listGoodsFailed = await ITEM__GOODS_COLL.find({ _id: { $in: arrGoodsFailed }})

                return resolve({ error: false, message: 'Cập nhật thành công', listGoodsFailed })
			} catch (error) {
                console.error({ error })
				return resolve({ error: true, message: error.message });
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