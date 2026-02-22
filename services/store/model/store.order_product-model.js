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
// const ITEM__FUNDA_COLL            		= require('../../item/database/item.funda-coll'); 
const STORE_ORDER_COLL                  = require('../database/store.order-coll');
const STORE_ORDER_PRODUCT_COLL          = require('../database/store.order_product-coll');
const ITEM__GOODS_COLL            		= require('../../item/database/item.goods-coll')
const ITEM__ACCOUNT_COLL            	= require('../../item/database/item.account-coll')
// const ITEM__CONTACT_COLL            	= require('../../item/database/item.contact-coll')
const ITEM__DOCTYPE_COLL            	= require('../../item/database/item.doctype-coll')
const BUDGET_WORK_COLL                  = require('../../budget/database/budget.work-coll')
const ITEM__CONFIG_COLL                 = require("../../item/database/item.config-coll");

/**
 * import inter-model, exter-model
 */
const XlsxPopulate                      = require('xlsx-populate');
const fs                                = require('fs');
const path                              = require('path');
const { uploadFileS3 }                  = require('../../../tools/s3');

const BUDGET__WORK_MODEL                = require('../../budget/model/budget.work-model').MODEL

class Model extends BaseModel {

    constructor() {
        super(STORE_ORDER_PRODUCT_COLL);
    }

    /**
     * Name: Insert
     * Author: HiepNH
     * Code: 24/11/2022
     */
    insert({ option, userID, fundaID, orderID, accountID, contraID, customerID, contractID, goodsID, assetsID, workID, subtypeID, name, note, quantity, weight, unitPrice, listedUnitprice, classification, outin, date, type }) {
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
                if (!name)
                    return resolve({error: true, message: "name invalid", keyError: KEY_ERROR.PARAMS_INVALID});
                
                let dataInsert = {}

                if (checkObjectIDs(orderID)) {
                    const infoParent = await STORE_ORDER_COLL
                    .findById(orderID)
                    .select('company funda project package toPackage warehouse customer contract outin type date toDate forward')
                    .lean();
                    if(!infoParent)
                        return resolve({error: true, message: "Phiếu không tồn tại", keyError: KEY_ERROR.PARAMS_INVALID})

                    dataInsert = { 
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
                        forward: infoParent.forward,
                        outin: infoParent.outin,
                        type: infoParent.type,
                        date: infoParent.date,
                        toDate: infoParent.toDate,
                        userCreate: userID, 
                        admins: [userID], 
                        members: [userID],
                        name,
                    }
                }
                
                if (checkObjectIDs(accountID)) {
                    let infoAcc = await ITEM__ACCOUNT_COLL.findById(accountID)
                    if(!infoAcc)
                        return resolve({error: true, message: "Tài khoản không tồn tại", keyError: KEY_ERROR.PARAMS_INVALID})
                    
                    dataInsert = { 
                        userCreate: userID, 
                        admins: [userID], 
                        members: [userID],
                        company: infoAcc.company,
                        account: accountID,
                        name,
                    }
                }

                if (type && !isNaN(type)) {
                    dataInsert.type = Number(type)
                }

                if (outin && !isNaN(outin)) {
                    dataInsert.outin = Number(outin)
                }

                if(listedUnitprice >= 0){
                    dataInsert.listedUnitprice = listedUnitprice
                }

                if(listedUnitprice >= 1){
                    dataInsert.classification = classification
                }

                if (checkObjectIDs(fundaID)) {
                    dataInsert.funda = fundaID;
                }
                // if (checkObjectIDs(accountID)) {
                //     dataInsert.account = accountID;
                // }
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

                if(date){
                    dataInsert.date = date
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if (!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 })

                if (checkObjectIDs(orderID)) {
                    await STORE_ORDER_COLL.findByIdAndUpdate(orderID, { 
                        $addToSet: { products: infoAfterInsert._id } 
                    }, { new: true })

                    // Cập nhật Giá trị cho Order
                    if(!option){
                        await that.updateValue({orderID, userID})
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
    updateValue({ orderID, userID }){
        return new Promise(async (resolve) => {
            try {    
                let info = await STORE_ORDER_COLL.findById(orderID)

                if (!info) {
                    return resolve({ error: true, message: 'Không tìm thấy thông tin', keyError: KEY_ERROR.GET_INFO_FAILED });
                }

                let dataUpdate = { 
                    userUpdate: userID, 
                    modifyAt: new Date() 
                }
    
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
                    dataUpdate.history = `${info?.history} | ${new Date()}, U_${userID}, Thành tiền: ${Number(listData[0].amount)}`
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
     * Name  : Cập nhật
     * Code  : HiepNH
     * Date  : 28/1/2025
     */
    update({ userID, orderProductID, fundaID, filesID, checked, accountID, contraID, customerID, contractID, goodsID, assetsID, workID, subtypeID, name, note, quantity, weight, unitPrice, date, status, forward }) {
        const that = this
        return new Promise(async resolve => {
            try {
                let infoJournal = await STORE_ORDER_PRODUCT_COLL.findById(orderProductID)

                if (!infoJournal) {
                    return resolve({ error: true, message: 'Không tìm thấy thông tin', keyError: KEY_ERROR.GET_INFO_FAILED });
                }
                
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

                if (forward && !isNaN(forward)) {
                    dataUpdate.forward = forward;
                } 

                if (status && !isNaN(status) && Number(status) > 0) {
                    dataUpdate.status = status;
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

                if (date && !isNaN(date)) {
                    dataUpdate.date = date
                }

                // Gán ngân sách
                if (checkObjectIDs(workID)) {
                    dataUpdate.budgetWork = workID;

                    // Lấy thông tin phần tử cha để đưa sang
                    let infoWork = await BUDGET_WORK_COLL.findById(workID).select('unitPrice budget item group')
                    if(infoWork){
                        unitPrice2 = Number(infoWork.unitPrice) // Bỏ đi để không bị ảnh hưởng: vì đơn giá đôi khi theo thực tế

                        dataUpdate.budget = infoWork.budget;
                        dataUpdate.budgetItem = infoWork.item;
                        dataUpdate.budgetGroup = infoWork.group;``
                    }
                }

                if(unitPrice2 >= 0){
                    let amount  = Number(quantity * unitPrice2).toFixed(0)

                    dataUpdate.unitPrice = unitPrice2
                    dataUpdate.amount = amount

                    dataUpdate.history = `${infoJournal.history} | ${new Date()}, U_${userID}, Khối lượng: ${quantity}, Đơn giá: ${unitPrice2}, Thành tiền: ${amount}, Ghi chú: ${note}`
                }
                // console.log({ dataUpdate })

                let infoAfterUpdate = await STORE_ORDER_PRODUCT_COLL.findByIdAndUpdate(orderProductID, dataUpdate, { new: true })
                
                if (!infoAfterUpdate)
                    return resolve({ error: true, message: 'Cập nhật thất bại', keyError: KEY_ERROR.UPDATE_FAILED })

                // Cập nhật ngân sách đã thực hiện
                if(checkObjectIDs(infoAfterUpdate.budgetWork)){
                    if(checkObjectIDs(workID)){
                        // console.log('11111111111111111111111111111111111')
                        // Cập nhật với Công việc cũ
                        let infoBudget2 = await BUDGET__WORK_MODEL.updateValueFromTimeSheetStore({option: 1, workID: infoAfterUpdate.budgetWork, userID})
                        // console.log(infoBudget2)
    
                        // Cập nhật với Công việc mới
                        let infoBudget = await BUDGET__WORK_MODEL.updateValueFromTimeSheetStore({option: 1, workID, userID})
                        // console.log(infoBudget)
                    }else{
                        // console.log('222222222222222222')
                        // Cập nhật với Công việc cũ: áp dụng cho thay đổi Khối lượng, đơn giá
                        let infoBudget2 = await BUDGET__WORK_MODEL.updateValueFromTimeSheetStore({option: 1, workID: infoAfterUpdate.budgetWork, userID})
                        // console.log(infoBudget2)
                    }
                }

                // Cập nhật lại thông tin Order
                await that.updateValue({orderID: infoAfterUpdate.order, userID})

                return resolve({ error: false, data: infoAfterUpdate });
            } catch (error) {
                console.error({ error });
                return resolve({ error: true, message: error.message })
            }
        });
    }

    /**
     * Name: getInfo
     * Author: HiepNH
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
    getList({  option, status, outin, type, userID, companyID, fundaID, projectID, packageID, toPackageID, warehouseID, accountID, contraID, customerID, goodsID, parentGoodsID, assetsID, workID, subtypeID, orderID, userCreateID, fromDate, toDate, keyword, limit = 50, lastestID, select, populates, sortKey }) {
        return new Promise(async (resolve) => {
            try {
                if(Number(limit) >= 100){
                    limit = 100;
                } else{
                    limit = +Number(limit);
                }

                let conditionObj = { company: companyID }
                let sortBy;
                let keys	 = ['createAt__-1', '_id__-1'];

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

                if (checkObjectIDs(accountID)) {
                    conditionObj = { account: accountID }
                    // conditionObj.account = accountID;
                }
            
                if(fromDate && toDate){
                    conditionObj.date = {
                        $gte: moment(fromDate).toDate(),
                        $lte: moment(toDate).toDate(),
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
    getListByProperty({ companyID, option, type, projectID, warehouseID, accountID, contraID, customerID, goodsID, assetsID, workID, subtypeID, userCreateID, fromDate, toDate }) {
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * 1. Ban đầu query tổng tất cả dữ liệu
                 * 2. Sau bổ sung các phiếu đầu kỳ/kết chuyển số dư
                 */
                let conditionGroup = {}, conditionDebitObj = {}, conditionCreditObj = {}, conditionProject = {}
                let conditionMatchO = {}, conditionMatchOF = {}, conditionMatchFT = {}
                let listDataO, listDataOF, listDataFT

                /**
                 * Lấy năm của ngày đầu kỳ
                 */
                let year = moment(new Date()).toDate().getFullYear()
                if(fromDate && toDate){
                    year = moment(fromDate).toDate().getFullYear()
                }
                // let firstDayOfYear = `${Number(year)}-01-01T00:00:00.000Z`
                let firstDayOfYear = `${Number(year)}-01-01T00:00:00.000+07:00`

                conditionProject = {
                    year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                    goods: 1, 
                    warehouse: 1,
                    account: 1, 
                    forward: 1, 
                    status: 1,
                    date: 1,
                    quantity: 1,
                    amount: 1,
                }

                conditionDebitObj = {
                    company: ObjectID(companyID),
                    status: {$in: [1,2,3,5]}, // Không gồm phiếu Hủy
                    outin: 2,
                }

                conditionCreditObj = {
                    company: ObjectID(companyID),
                    status: {$in: [1,2,3,5]}, // Không gồm phiếu Hủy
                    outin: 1,
                }

                // Kết chuyển cuối kỳ năm trước sang đầu kỳ năm sau (Original)
                conditionMatchO = {
                    "forward": 1,
                    "status": 5,
                    "year": Number(year)
                }

                // Từ đầu năm tới ngày đầu kỳ (fromDate)
                conditionMatchOF = {
                    "forward": 0,
                    "status": 5,
                    "date": {
                        $gte: moment(firstDayOfYear).toDate(),
                        $lt: moment(fromDate).toDate(), // $lte (<=), $lt (<)
                    },
                }
                // console.log(conditionMatchOF)
                // console.log('======================')

                // Từ đầu kỳ tới cuối kỳ (fromDate-toDate)
                conditionMatchFT = {
                    "forward": 0,
                    "status": 5,
                    "date": {
                        $gte: moment(fromDate).startOf('day').toDate(),
                        $lte: moment(toDate).endOf('day').toDate(),
                    }
                }
                // console.log(conditionMatchFT)

                // Thẻ kho
                if(option == 1){
                    conditionDebitObj.goods = { $exists: true, $ne: null }
                    conditionCreditObj.goods = { $exists: true, $ne: null }
                }

                // Sổ quỹ
                else if(option == 2){
                    conditionDebitObj.account = { $exists: true, $ne: null }
                    conditionCreditObj.account = { $exists: true, $ne: null }

                    conditionDebitObj.type = {$in: [7, 8]}
                    conditionCreditObj.type = {$in: [7, 8]}
                }

                // Công nợ
                else if(option == 3){
                    conditionDebitObj.customer = { $exists: true, $ne: null }
                    conditionCreditObj.customer = { $exists: true, $ne: null }
                }

                if (checkObjectIDs(projectID)) {
                    conditionDebitObj.project = ObjectID(projectID);
                    conditionCreditObj.project = ObjectID(projectID);
                }

                if (checkObjectIDs(warehouseID)) {
                    conditionDebitObj.warehouse = ObjectID(warehouseID);
                    conditionCreditObj.warehouse = ObjectID(warehouseID);
                }

                if (checkObjectIDs(accountID)) {
                    conditionDebitObj.account = ObjectID(accountID);
                    conditionCreditObj.account = ObjectID(accountID);
                }

                if (checkObjectIDs(contraID)) {
                    conditionDebitObj.contra = ObjectID(contraID);
                    conditionCreditObj.contra = ObjectID(contraID);
                }

                if (checkObjectIDs(customerID)) {
                    conditionDebitObj.customer = ObjectID(customerID);
                    conditionCreditObj.customer = ObjectID(customerID);
                }

                if (checkObjectIDs(userCreateID)) {
                    conditionDebitObj.userCreate = ObjectID(userCreateID);
                    conditionCreditObj.userCreate = ObjectID(userCreateID);
                }

                if (checkObjectIDs(goodsID)) {
                    conditionDebitObj.goods = ObjectID(goodsID);
                    conditionCreditObj.goods = ObjectID(goodsID);
                }

                if (checkObjectIDs(assetsID)) {
                    conditionDebitObj.assets = ObjectID(assetsID);
                    conditionCreditObj.assets = ObjectID(assetsID);
                }

                if (checkObjectIDs(workID)) {
                    conditionDebitObj.budgetWork = ObjectID(workID);
                    conditionCreditObj.budgetWork = ObjectID(workID);
                }

                if (checkObjectIDs(subtypeID)) {
                    conditionDebitObj.subtype = ObjectID(subtypeID);
                    conditionCreditObj.subtype = ObjectID(subtypeID);
                }

                if (!isNaN(type) && Number(type) >= 1) {
                    conditionDebitObj.type = Number(type)
                    conditionCreditObj.type = Number(type)
                }

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
                        quantity: { $sum: "$quantity" },
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

                /**
                 * DATA KẾT CHUYỂN/ĐẦU NĂM
                 */
                listDataO = await STORE_ORDER_PRODUCT_COLL.aggregate([
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
                                    $group: conditionGroup
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
                                    $group: conditionGroup
                                }
                            ],

                        }
                    }
                ])
                // console.log('=========MỐC ĐẦU NĂM=========')
                // console.log({_____No: listDataO[0]._debit})
                // console.log({_____Co: listDataO[0]._credit})

                listDataOF = await STORE_ORDER_PRODUCT_COLL.aggregate([
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
                                    $match: conditionMatchOF
                                },
                                {
                                    $group: conditionGroup
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
                                    $match: conditionMatchOF
                                },

                                {
                                    $group: conditionGroup
                                }
                            ],

                        }
                    }
                ])
                // console.log('=========ĐẦU NĂM - ĐẦU KỲ=========')
                // console.log({_____No: listDataOF[0]._debit})
                // console.log({_____Co: listDataOF[0]._credit})

                listDataFT = await STORE_ORDER_PRODUCT_COLL.aggregate([
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
                                    $match: conditionMatchFT
                                },
                                {
                                    $group: conditionGroup
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
                                    $match: conditionMatchFT
                                },

                                {
                                    $group: conditionGroup
                                }
                            ],

                        }
                    }
                ])
                // console.log('=========ĐẦU KỲ - CUỐI KỲ=========')
                // console.log({_____No: listDataFT[0]._debit})
                // console.log({_____Co: listDataFT[0]._credit})

                if(option == 1){
                    let arrGoods = [], arrCombine = []

                    for(const item of listDataO[0]._debit){
                        arrGoods.push(item._id.goods)
                    }
                    for(const item of listDataO[0]._credit){
                        arrGoods.push(item._id.goods)
                    }
                    for(const item of listDataOF[0]._debit){
                        arrGoods.push(item._id.goods)
                    }
                    for(const item of listDataOF[0]._credit){
                        arrGoods.push(item._id.goods)
                    }
                    for(const item of listDataFT[0]._debit){
                        arrGoods.push(item._id.goods)
                    }
                    for(const item of listDataFT[0]._credit){
                        arrGoods.push(item._id.goods)
                    }
                    // console.log(arrGoods)

                    let listGoods = await ITEM__GOODS_COLL.find({_id: {$in: arrGoods}}).select('name unit note')
                    // console.log(listGoods)

                    let arrDebitO = [], arrCreditO = [], arrDebitOF = [], arrCreditOF = [], arrDebitFT = [], arrCreditFT = []

                    listDataO[0]._debit.forEach(element=>{
                        let key = element._id.goods;
                        if (!Array.isArray(arrDebitO[key])) {
                            arrDebitO[key] = [];
                        }
                        arrDebitO[key].push(element)
                    })

                    listDataO[0]._credit.forEach(element=>{
                        let key = element._id.goods;
                        if (!Array.isArray(arrCreditO[key])) {
                            arrCreditO[key] = [];
                        }
                        arrCreditO[key].push(element)
                    })

                    listDataOF[0]._debit.forEach(element=>{
                        let key = element._id.goods;
                        if (!Array.isArray(arrDebitOF[key])) {
                            arrDebitOF[key] = [];
                        }
                        arrDebitOF[key].push(element)
                    })

                    listDataOF[0]._credit.forEach(element=>{
                        let key = element._id.goods;
                        if (!Array.isArray(arrCreditOF[key])) {
                            arrCreditOF[key] = [];
                        }
                        arrCreditOF[key].push(element)
                    })

                    listDataFT[0]._debit.forEach(element=>{
                        let key = element._id.goods;
                        if (!Array.isArray(arrDebitFT[key])) {
                            arrDebitFT[key] = [];
                        }
                        arrDebitFT[key].push(element)
                    })

                    listDataFT[0]._credit.forEach(element=>{
                        let key = element._id.goods;
                        if (!Array.isArray(arrCreditFT[key])) {
                            arrCreditFT[key] = [];
                        }
                        arrCreditFT[key].push(element)
                    })

                    for(const item of listGoods){
                        let kcNoDauKy = 0, klKcNoDauKy = 0
                        let kcCoDauKy = 0, klKcCoDauKy = 0
                        let noDauKy = 0, klNoDauKy = 0
                        let coDauKy = 0, klCoDauKy = 0
                        let noTrongKy = 0, klNoTrongKy = 0
                        let coTrongKy = 0, klCoTrongKy = 0

                        if(arrDebitO[item._id]){
                            kcNoDauKy = arrDebitO[item._id][0].amount
                            klKcNoDauKy = arrDebitO[item._id][0].quantity
                        }
                        if(arrCreditO[item._id]){
                            kcCoDauKy = arrCreditO[item._id][0].amount
                            klKcCoDauKy = arrCreditO[item._id][0].quantity
                        }
                        if(arrDebitOF[item._id]){
                            noDauKy = arrDebitOF[item._id][0].amount
                            klNoDauKy = arrDebitOF[item._id][0].quantity
                        }
                        if(arrCreditOF[item._id]){
                            coDauKy = arrCreditOF[item._id][0].amount
                            klCoDauKy = arrCreditOF[item._id][0].quantity
                        }
                        if(arrDebitFT[item._id]){
                            noTrongKy = arrDebitFT[item._id][0].amount
                            klNoTrongKy = arrDebitFT[item._id][0].quantity
                        }
                        if(arrCreditFT[item._id]){
                            coTrongKy = arrCreditFT[item._id][0].amount
                            klCoTrongKy = arrCreditFT[item._id][0].quantity
                        }

                        arrCombine.push({
                            _id: item._id,
                            name: item.name,
                            unit: item.unit,
                            kcNoDauKy: Number(kcNoDauKy),
                            kcCoDauKy: Number(kcCoDauKy),
                            noDauKy: Number(noDauKy),
                            coDauKy: Number(coDauKy),
                            noTrongKy: Number(noTrongKy),
                            coTrongKy: Number(coTrongKy),

                            klKcNoDauKy: Number(klKcNoDauKy),
                            klKcCoDauKy: Number(klKcCoDauKy),
                            klNoDauKy: Number(klNoDauKy),
                            klCoDauKy: Number(klCoDauKy),
                            klNoTrongKy: Number(klNoTrongKy),
                            klCoTrongKy: Number(klCoTrongKy),
                        })
                    }
                    // console.log(arrCombine)

                    return resolve({ error: false, data: arrCombine })
                }
                
                // Sổ quỹ
                else if(option == 2){
                    let arrAccounts = [], arrCombine = []

                    for(const item of listDataO[0]._debit){
                        arrAccounts.push(item._id.account)
                    }
                    for(const item of listDataO[0]._credit){
                        arrAccounts.push(item._id.account)
                    }
                    for(const item of listDataOF[0]._debit){
                        arrAccounts.push(item._id.account)
                    }
                    for(const item of listDataOF[0]._credit){
                        arrAccounts.push(item._id.account)
                    }
                    for(const item of listDataFT[0]._debit){
                        arrAccounts.push(item._id.account)
                    }
                    for(const item of listDataFT[0]._credit){
                        arrAccounts.push(item._id.account)
                    }
                    // console.log(arrAccounts)

                    let listAccounts = await ITEM__ACCOUNT_COLL.find({_id: {$in: arrAccounts}}).select('name description')
                    // console.log(listAccounts)

                    let arrDebitO = [], arrCreditO = [], arrDebitOF = [], arrCreditOF = [], arrDebitFT = [], arrCreditFT = []

                    listDataO[0]._debit.forEach(element=>{
                        let key = element._id.account;
                        if (!Array.isArray(arrDebitO[key])) {
                            arrDebitO[key] = [];
                        }
                        arrDebitO[key].push(element)
                    })

                    listDataO[0]._credit.forEach(element=>{
                        let key = element._id.account;
                        if (!Array.isArray(arrCreditO[key])) {
                            arrCreditO[key] = [];
                        }
                        arrCreditO[key].push(element)
                    })

                    listDataOF[0]._debit.forEach(element=>{
                        let key = element._id.account;
                        if (!Array.isArray(arrDebitOF[key])) {
                            arrDebitOF[key] = [];
                        }
                        arrDebitOF[key].push(element)
                    })

                    listDataOF[0]._credit.forEach(element=>{
                        let key = element._id.account;
                        if (!Array.isArray(arrCreditOF[key])) {
                            arrCreditOF[key] = [];
                        }
                        arrCreditOF[key].push(element)
                    })

                    listDataFT[0]._debit.forEach(element=>{
                        let key = element._id.account;
                        if (!Array.isArray(arrDebitFT[key])) {
                            arrDebitFT[key] = [];
                        }
                        arrDebitFT[key].push(element)
                    })

                    listDataFT[0]._credit.forEach(element=>{
                        let key = element._id.account;
                        if (!Array.isArray(arrCreditFT[key])) {
                            arrCreditFT[key] = [];
                        }
                        arrCreditFT[key].push(element)
                    })

                    for(const item of listAccounts){
                        let kcNoDauKy = 0, klKcNoDauKy = 0
                        let kcCoDauKy = 0, klKcCoDauKy = 0
                        let noDauKy = 0, klNoDauKy = 0
                        let coDauKy = 0, klCoDauKy = 0
                        let noTrongKy = 0, klNoTrongKy = 0
                        let coTrongKy = 0, klCoTrongKy = 0

                        if(arrDebitO[item._id]){
                            kcNoDauKy = arrDebitO[item._id][0].amount
                            klKcNoDauKy = arrDebitO[item._id][0].quantity
                        }
                        if(arrCreditO[item._id]){
                            kcCoDauKy = arrCreditO[item._id][0].amount
                            klKcCoDauKy = arrCreditO[item._id][0].quantity
                        }
                        if(arrDebitOF[item._id]){
                            noDauKy = arrDebitOF[item._id][0].amount
                            klNoDauKy = arrDebitOF[item._id][0].quantity
                        }
                        if(arrCreditOF[item._id]){
                            coDauKy = arrCreditOF[item._id][0].amount
                            klCoDauKy = arrCreditOF[item._id][0].quantity
                        }
                        if(arrDebitFT[item._id]){
                            noTrongKy = arrDebitFT[item._id][0].amount
                            klNoTrongKy = arrDebitFT[item._id][0].quantity
                        }
                        if(arrCreditFT[item._id]){
                            coTrongKy = arrCreditFT[item._id][0].amount
                            klCoTrongKy = arrCreditFT[item._id][0].quantity
                        }

                        arrCombine.push({
                            _id: item._id,
                            name: item.name,
                            description: item.description,
                            kcNoDauKy: Number(kcNoDauKy),
                            kcCoDauKy: Number(kcCoDauKy),
                            noDauKy: Number(noDauKy),
                            coDauKy: Number(coDauKy),
                            noTrongKy: Number(noTrongKy),
                            coTrongKy: Number(coTrongKy),

                            klKcNoDauKy: Number(klKcNoDauKy),
                            klKcCoDauKy: Number(klKcCoDauKy),
                            klNoDauKy: Number(klNoDauKy),
                            klCoDauKy: Number(klCoDauKy),
                            klNoTrongKy: Number(klNoTrongKy),
                            klCoTrongKy: Number(klCoTrongKy),
                        })
                    }
                    // console.log(arrCombine)

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
    getAmountByProperty({ companyID, month, option, projectID, subtypeID, fromDate, toDate, ctx }){
        return new Promise(async resolve => {
            try {
                let conditionObj = {}, conditionPlanObj = {}, conditionGroup = {}, conditionProject = {}, sort = {"-id.company":1}
                let conditionMatchO = {}, conditionMatchIn = {}
                if(!option){
                    // Tổng hợp các công ty mà user được quyền truy cập báo cáo quản trị: QUỸ
                    let listCompany = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.APP_MENU_GET_LIST_COMPANY}`, {
                        appID: "5dfe4bf251dc622100bb9d8c", // Ứng dụng Quỹ
                        menuID: "66ecc9166748e0001242a36c", // Báo cáo quản trị: 66ecc9166748e0001242a36c
                        type: "1"
                    })
                    // console.log(listCompany?.data)

                    // Lấy theo dữ liệu của năm hiện tại
                    let date = new Date()
                    let year = date.getFullYear()
                    if(fromDate){
                        let startDate = new Date(fromDate)
                        year = startDate.getFullYear()
                    }

                    conditionProject = {
                        forward: 1,
                        status: 1,
                        year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                        type: 1,
                        outin: 1,
                        company: 1,
                        account: 1,
                        amount: 1,
                    }

                    // Kết chuyển cuối kỳ năm trước sang đầu kỳ năm sau (Original)
                    conditionMatchO = {
                        "forward": 1,
                        "status": 5,
                        "type": {$in: [7, 8]}, // Tiền mặt và Ngân hàng
                        "company": {$in: listCompany.data.map(item=> ObjectID(item._id.company._id))},
                        "account": { $exists: true, $ne: null },
                        "year": Number(year),
                    }
    
                    // Từ đầu năm tới đầu kỳ (áp dụng lấy dữ liệu 1 mạch)
                    conditionMatchIn = {
                        "forward": 0,
                        "status": 5,
                        "type": {$in: [7, 8]}, // Tiền mặt và Ngân hàng
                        "company": {$in: listCompany.data.map(item=> ObjectID(item._id.company._id))},
                        "account": { $exists: true, $ne: null },
                        "year": Number(year),
                    }

                    conditionGroup = {
                        _id: { company: "$company" },
                        total1: { $sum: { $cond: [{ $eq: ["$outin", 1] }, "$amount", 0] } }, // Chi ra
                        total2: { $sum: { $cond: [{ $eq: ["$outin", 2] }, "$amount", 0] } }, // Thu vào
                    }

                    // Số dư đầu năm
                    let listDataO = await STORE_ORDER_PRODUCT_COLL.aggregate([
                        {
                            $project: conditionProject
                        },
                        {
                            $match: conditionMatchO
                        },
                        {
                            $group: conditionGroup
                        }
                    ])

                    let listDataIn = await STORE_ORDER_PRODUCT_COLL.aggregate([
                        {
                            $project: conditionProject
                        },
                        {
                            $match: conditionMatchIn
                        },
                        {
                            $group: conditionGroup
                        }
                    ])

                    await STORE_ORDER_PRODUCT_COLL.populate(listCompany, {
                        path: '_id.company._id',
                        select: '_id name sign image',
                        model: 'company'
                    })
                    // console.log(listDataO)
                    // console.log(listDataIn)
                    // console.log(listCompany)

                    let arrO = [], arrIn = []

                    listDataO.forEach(element=>{
                        let key = element._id.company;
                        if (!Array.isArray(arrO[key])) {
                            arrO[key] = [];
                        }
                        arrO[key].push(element)
                    })

                    listDataIn.forEach(element=>{
                        let key = element._id.company;
                        if (!Array.isArray(arrIn[key])) {
                            arrIn[key] = [];
                        }
                        arrIn[key].push(element)
                    })

                    for(var i=0; i < listCompany.data.length; i++ ){
                        listCompany.data[i].totalO1 = 0
                        listCompany.data[i].totalO2 = 0
                        listCompany.data[i].totalIn1 = 0
                        listCompany.data[i].totalIn2 = 0
                    }
                    // console.log(listCompany.data)

                    listCompany.data.forEach((item, index)=>{
                        let key = item._id.company._id
                        // console.log(key)

                        if(arrO[key]){
                            listCompany.data[index].totalO1 = listCompany.data[index].totalO1 + Number(arrO[key][0].total1)
                            listCompany.data[index].totalO2 = listCompany.data[index].totalO2 + Number(arrO[key][0].total2)
                        }

                        if(arrIn[key]){
                            listCompany.data[index].totalIn1 = listCompany.data[index].totalIn1 + Number(arrIn[key][0].total1)
                            listCompany.data[index].totalIn2 = listCompany.data[index].totalIn2 + Number(arrIn[key][0].total2)
                        }
                    })

                    return resolve({ error: false, data: listCompany?.data})
                }else{
                    // Tổng hợp theo các tài khoản của công ty
                    if(Number(option) === 1){
                        // Lấy theo dữ liệu của năm hiện tại
                        let date = new Date()
                        let year = date.getFullYear()

                        conditionProject = {
                            forward: 1,
                            status: 1,
                            year : {$year: { date: "$date", timezone: "Asia/Ho_Chi_Minh" }},
                            type: 1,
                            outin: 1,
                            company: 1,
                            account: 1,
                            amount: 1,
                        }

                        // Kết chuyển cuối kỳ năm trước sang đầu kỳ năm sau (Original)
                        conditionMatchO = {
                            "forward": 1,
                            "status": 5,
                            "type": {$in: [7, 8]}, // Tiền mặt và Ngân hàng
                            "company": ObjectID(companyID),
                            "account": { $exists: true, $ne: null },
                            "year": Number(year),
                        }
        
                        // Từ đầu năm tới đầu kỳ (áp dụng lấy dữ liệu 1 mạch)
                        conditionMatchIn = {
                            "forward": 0,
                            "status": 5,
                            "type": {$in: [7, 8]}, // Tiền mặt và Ngân hàng
                            "company": ObjectID(companyID),
                            "account": { $exists: true, $ne: null },
                            "year": Number(year),
                        }

                        conditionGroup = {
                            _id: { account: "$account" },
                            total1: { $sum: { $cond: [{ $eq: ["$outin", 1] }, "$amount", 0] } }, // Chi ra
                            total2: { $sum: { $cond: [{ $eq: ["$outin", 2] }, "$amount", 0] } }, // Thu vào
                        }

                        // Số dư đầu năm
                        let listDataO = await STORE_ORDER_PRODUCT_COLL.aggregate([
                            {
                                $project: conditionProject
                            },
                            {
                                $match: conditionMatchO
                            },
                            {
                                $group: conditionGroup
                            }
                        ])

                        let listDataIn = await STORE_ORDER_PRODUCT_COLL.aggregate([
                            {
                                $project: conditionProject
                            },
                            {
                                $match: conditionMatchIn
                            },
                            {
                                $group: conditionGroup
                            }
                        ])

                        // Bước 1: Trích xuất tất cả các ID từ listDataO và listDataIn
                        let allAccountIdsO = listDataO.map(item => item._id.account);
                        let allAccountIdsIn = listDataIn.map(item => item._id.account);

                        // Bước 2: Gộp hai mảng ID lại
                        let combinedIds = [...allAccountIdsO, ...allAccountIdsIn];

                        // Bước 3: Sử dụng Set để lọc bỏ các ID trùng lặp và chuyển lại thành mảng
                        let uniqueAccountIds = [...new Set(combinedIds)];

                        let listAccount = await ITEM__ACCOUNT_COLL.find({_id: {$in: uniqueAccountIds}}).select('_id name description')
                       
                        let arrO = [], arrIn = []

                        listDataO.forEach(element=>{
                            let key = element._id.account;
                            if (!Array.isArray(arrO[key])) {
                                arrO[key] = [];
                            }
                            arrO[key].push(element)
                        })

                        listDataIn.forEach(element=>{
                            let key = element._id.account;
                            if (!Array.isArray(arrIn[key])) {
                                arrIn[key] = [];
                            }
                            arrIn[key].push(element)
                        })

                        // Thêm các biến giá trị vào mảng (khác với trường hợp company)
                        const plainListAccount = listAccount.map(doc => doc.toObject ? doc.toObject() : doc);
                        const newListAcc = plainListAccount.map(item => {
                            return {
                                ...item,
                                totalO1: 0, 
                                totalO2: 0,
                                totalIn1: 0,
                                totalIn2: 0,
                            };
                        })

                        newListAcc.forEach((item, index)=>{
                            let key = item._id
                            if(arrO[key]){
                                newListAcc[index].totalO1 = newListAcc[index].totalO1 + Number(arrO[key][0].total1)
                                newListAcc[index].totalO2 = newListAcc[index].totalO2 + Number(arrO[key][0].total2)
                            }

                            if(arrIn[key]){
                                newListAcc[index].totalIn1 = newListAcc[index].totalIn1 + Number(arrIn[key][0].total1)
                                newListAcc[index].totalIn2 = newListAcc[index].totalIn2 + Number(arrIn[key][0].total2)
                            }
                        })

                        return resolve({ error: false, data: newListAcc })
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
                    type: {$in: [1,2,3,4,5,6]}, // Làm rõ lại, chỉ chạy giá vốn cho việc Xuất hàng nội bộ. Còn bán ra bên ngoài???
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
                for(const voucher of listVouchers) {
                    await queue.add("price_analyze", {
                        option: 2,
                        voucher,
                        companyID,
                        userID,
                    }, {
                        backoff: 3,
                        attempts: 3
                    })
                }

                return resolve({ error: false, data: listVouchers, status: 200 });

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
        return new Promise(async resolve => {
            try {
                let configEmails = [], arr1 = [], arr2 = [], arr3 = [], arr4 = []
                let infoCF = await ITEM__CONFIG_COLL.findOne({company: companyID, type: 4})
                if(infoCF){
                    if(infoCF.email1){
                    arr1 = infoCF.email1.split(',').map(item => item.trim());
                    }
                    if(infoCF.email2){
                    arr2 = infoCF.email2.split(',').map(item => item.trim());
                    }
                    if(infoCF.email3){
                    arr3 = infoCF.email3.split(',').map(item => item.trim());
                    }
                    if(infoCF.email4){
                    arr4 = infoCF.email4.split(',').map(item => item.trim());
                    }
                    configEmails = [...arr1,...arr2,...arr3,...arr4]
                }

                if (configEmails.includes(email.toString())) {
                    
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
        return new Promise(async resolve => {
            try {
                if (Number(option) === 1) {
                    const { data, error } = await this.getListByProperty({
                        ...filterParams,
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
                
                // Thẻ kho
                else if (Number(option) === 2) {
                    const year = (new Date()).getFullYear(filterParams?.toDate)

                    let listData = await STORE_ORDER_PRODUCT_COLL.find({
                        company: companyID,
                        goods: filterParams.goodsID,
                        $where: `return this.date.getFullYear() === ${Number(year)}`
                    })
                    .select('outin type forward quantity unitPrice amount order date goods')
                    .populate({
                        path: 'order goods',
                        select: 'name date unit'
                    })
                    .sort({date: 1})
                    // console.log(listData)

                    XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/store_detail_report.xlsx')))
                    .then(async workbook => {

                        let i = 3;
                        if(listData && listData.length){
                            listData?.forEach((item, index) => {
                                workbook.sheet("Data").row(i).cell(1).value(item.date);
                                workbook.sheet("Data").row(i).cell(2).value(item?.order?.name);
                                if(item.forward == 1){
                                    workbook.sheet("Data").row(i).cell(3).value('Đầu kỳ');
                                }else{
                                    workbook.sheet("Data").row(i).cell(3).value('Trong kỳ');
                                }
                                workbook.sheet("Data").row(i).cell(4).value(Number(item?.outin));
                                workbook.sheet("Data").row(i).cell(5).value(item?.goods?.name);
                                workbook.sheet("Data").row(i).cell(6).value(item?.goods?.unit);
                                workbook.sheet("Data").row(i).cell(7).value(Number(item.quantity));
                                workbook.sheet("Data").row(i).cell(8).value(Number(item.unitPrice));
                                workbook.sheet("Data").row(i).cell(9).value(Number(item.amount));
                        
                                i++
                            })
                        }

                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `BaoCaoChiTiet_${now.getTime()}.xlsx`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                        await workbook.toFileAsync(pathWriteFile);
                        const result = await uploadFileS3(pathWriteFile, fileName);

                        fs.unlinkSync(pathWriteFile);
                        return resolve({ error: false, data: result?.Location, status: 200 });
                    });
                }

                // Sổ quỹ
                else if (Number(option) === 3) {
                    let year = new Date().getFullYear()
                    let conditionObj = { company: companyID, status: 5 }

                    conditionObj.$where = `return this.date.getFullYear() === ${Number(year)}`

                    if (checkObjectIDs(filterParams.accountID)) {
                        conditionObj.account = filterParams.accountID;
                    }

                    let listData = await STORE_ORDER_PRODUCT_COLL.find(conditionObj)
                    .select('name outin amount date account customer')
                    .populate({
                        path: 'account customer subtype',
                        select: 'name phone description'
                    })
                    .sort({date: -1})
                    // console.log(listData)

                    let listDoctye = await ITEM__DOCTYPE_COLL.find({_id: {$in: listData.map(item => item?.subtype?._id)}}).select('name')
                    // console.log(listDoctye)

                    XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/cash_detail_report.xlsx')))
                    .then(async workbook => {

                        var i = 3, tonQuy = 0
                        if(listData && listData.length){
                            listData?.forEach((item, index) => {
                                workbook.sheet("Data").row(i).cell(1).value(item.date);
                                workbook.sheet("Data").row(i).cell(2).value(`${item?.account?.name}-${item?.account?.description}`);
                                workbook.sheet("Data").row(i).cell(3).value(item?.name);
                                workbook.sheet("Data").row(i).cell(4).value(`${item?.customer?.name}-${item?.customer?.phone}`);

                                if(item.outin == 2){
                                    // tonQuy = Number(tonQuy) + Number(item?.amount)
                                    workbook.sheet("Data").row(i).cell(5).value(Number(item?.amount));
                                }else{
                                    // tonQuy = Number(tonQuy) - Number(item?.amount)
                                    workbook.sheet("Data").row(i).cell(6).value(Number(item?.amount));
                                }

                                workbook.sheet("Data").row(i).cell(7).value(item?.subtype?.name);

                                workbook.sheet("Data").row(i).cell(8).value(`T${Number(item.date.getMonth() + 1)}_${item.date.getFullYear()}`);
                        
                                i++
                            })
                        }

                        var i = 3
                        workbook.sheet("BaoCao").row(1).cell(2).value(year);
                        if(listDoctye && listDoctye.length){
                            listDoctye?.forEach((item, index) => {
                                // workbook.sheet("Data").row(i).cell(1).value(index + 1)
                                workbook.sheet("BaoCao").row(i).cell(2).value(item?.name)
                        
                                i++
                            })
                        }                

                        const now = new Date();
                        const filePath = '../../../files/temporary_uploads/';
                        const fileName = `BaoCaoChiTiet_${now.getTime()}.xlsx`;
                        const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                        await workbook.toFileAsync(pathWriteFile);
                        const result = await uploadFileS3(pathWriteFile, fileName);

                        fs.unlinkSync(pathWriteFile);
                        return resolve({ error: false, data: result?.Location, status: 200 });
                    });
                }
            } catch (error) {
                console.log({ error })
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    downloadExcelFile(data) {
        return new Promise(resolve => {
            XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/store_inventory_report.xlsx')))
                .then(async workbook => {

                    let i = 4;
                    data?.forEach((item, index) => {
                        let donGiaTonDauKy = 0, donGiaNhapTrongKy = 0, donGiaXuatTrongKy = 0, donGiaTonCuoiKy = 0

                        if(Number(item.klKcNoDauKy + item.klNoDauKy - item.klKcCoDauKy - item.klCoDauKy) != 0){
                          donGiaTonDauKy = Number(item.kcNoDauKy + item.noDauKy - item.kcCoDauKy - item.coDauKy)/Number(item.klKcNoDauKy + item.klNoDauKy - item.klKcCoDauKy - item.klCoDauKy)
                        }
                        if(Number(item.klNoTrongKy) != 0){
                          donGiaNhapTrongKy = Number(item.noTrongKy)/Number(item.klNoTrongKy)
                        }
                        if(Number(item.klCoTrongKy) != 0){
                          donGiaXuatTrongKy = Number(item.coTrongKy)/Number(item.klCoTrongKy)
                        }
                        if(Number(item.klKcNoDauKy + item.klNoDauKy + item.klNoTrongKy - item.klKcCoDauKy - item.klCoDauKy - item.klCoTrongKy) != 0){
                          donGiaTonCuoiKy = Number(item.kcNoDauKy + item.noDauKy + item.noTrongKy - item.kcCoDauKy - item.coDauKy - item.coTrongKy)/Number(item.klKcNoDauKy + item.klNoDauKy + item.klNoTrongKy - item.klKcCoDauKy - item.klCoDauKy - item.klCoTrongKy)
                        }

                        workbook.sheet("Data").row(i).cell(1).value(Number(index + 1));
                        workbook.sheet("Data").row(i).cell(2).value(item.name);
                        workbook.sheet("Data").row(i).cell(3).value(item?.unit);
                        workbook.sheet("Data").row(i).cell(4).value(Number(item.klKcNoDauKy + item.klNoDauKy - item.klKcCoDauKy - item.klCoDauKy));
                        workbook.sheet("Data").row(i).cell(5).value(Number(donGiaTonDauKy));
                        workbook.sheet("Data").row(i).cell(6).value(Number(item.kcNoDauKy + item.noDauKy - item.kcCoDauKy - item.coDauKy));
                        workbook.sheet("Data").row(i).cell(7).value(Number(item.klNoTrongKy));
                        workbook.sheet("Data").row(i).cell(8).value(Number(donGiaNhapTrongKy));
                        workbook.sheet("Data").row(i).cell(9).value(Number(item.noTrongKy));
                        workbook.sheet("Data").row(i).cell(10).value(Number(item.klCoTrongKy));
                        workbook.sheet("Data").row(i).cell(11).value(Number(donGiaXuatTrongKy));
                        workbook.sheet("Data").row(i).cell(12).value(Number(item.coTrongKy));
                        workbook.sheet("Data").row(i).cell(13).value(Number(item.klKcNoDauKy + item.klNoDauKy + item.klNoTrongKy - item.klKcCoDauKy - item.klCoDauKy - item.klCoTrongKy));
                        workbook.sheet("Data").row(i).cell(14).value(Number(donGiaTonCuoiKy));
                        workbook.sheet("Data").row(i).cell(15).value(Number(item.kcNoDauKy + item.noDauKy + item.noTrongKy - item.kcCoDauKy - item.coDauKy - item.coTrongKy));
                 
                        i++
                    });

                    const now = new Date();
                    const filePath = '../../../files/temporary_uploads/';
                    const fileName = `BaoCaoTonKho_${now.getTime()}.xlsx`;
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