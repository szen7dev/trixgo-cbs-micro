"use strict";

const BaseModel = require("../../../tools/db/base_model");
const ObjectID = require("mongoose").Types.ObjectId;
const moment = require("moment");

const { KEY_ERROR } = require("../../../tools/keys");
const stringUtils					    = require('../../../tools/utils/string_utils');
const {
  getRequestAPI,
  checkObjectIDs,
  IsJsonString,
  validateParamsObjectID,
} = require("../../../tools/utils/utils");
const {
  compareTwoTime,
  isValidDate,
  getTimeBetween,
} = require("../../../tools/utils/time_utils");
const { RANGE_BASE_PAGINATION_V2 } = require("../../../tools/cursor_base/playground/index");
const { CF_DOMAIN_SERVICES } = require("../../gateway/helper/domain.constant");
const { CF_ACTIONS_ANALYSIS }  = require('../../analysis/helper/analysis.actions-constant');
const { CF_ACTIONS_ZALO } = require("../../zalo_oa/helper/zalo.actions");
const { CF_ACTIONS_ITEM } 		                = require('../../item/helper/item.actions-constant');

/**s
 * import inter-coll, exter-coll
 */
const ITEM__FUNDA_COLL = require("../../item/database/item.funda-coll");
const ITEM__CONTACT_COLL = require("../../item/database/item.contact-coll");
const ITEM__CONFIG_COLL = require("../../item/database/item.config-coll");
const ITEM__DOCTYPE_COLL = require("../../item/database/item.doctype-coll");
const STORE_ORDER_COLL = require("../database/store.order-coll");
const STORE_ORDER_PRODUCT_COLL = require('../database/store.order_product-coll');
const STORE_VOUCHER_COLL       = require('../database/store.voucher-coll');

const XlsxPopulate = require("xlsx-populate");
const fs = require("fs");
const path = require("path");
const { uploadFileS3 } = require("../../../tools/s3");

const AUTH__APP_USER                    = require('../../auth/model/auth.app_users').MODEL
const STORE_ORDER_PRODUCT_MODEL         = require('../model/store.order_product-model.js').MODEL

class Model extends BaseModel {
  constructor() {
    super(STORE_ORDER_COLL);
  }

/**
 * Name: Insert Basic
 * Author: HiepNH
 * Code: 8/9/2024
 */
insert({ companyID, userID, outin, type, fundaID, projectID, packageID, toPackageID, warehouseID, toWarehouseID, customerID, contractID, date, name, sign, note, linkID }) {
return new Promise(async (resolve) => {
    try {
        if([2,3,4,5,6].includes(Number(type))){
            if (!checkObjectIDs(projectID) || !checkObjectIDs(warehouseID) ||!checkObjectIDs(customerID) ||!name)
                return resolve({error: true, message: "projectID|warehouseID|customerID|name invalid", keyError: KEY_ERROR.PARAMS_INVALID})
        }else{
            if (!checkObjectIDs(projectID) ||!checkObjectIDs(customerID) ||!name)
                return resolve({error: true, message: "projectID|customerID|name invalid", keyError: KEY_ERROR.PARAMS_INVALID})
        }

        let dataInsert = { 
            company: companyID,
            userCreate: userID, 
        }

        if (checkObjectIDs(fundaID)) {
            dataInsert.funda = fundaID;
        }else{
            let infoFunda = await ITEM__FUNDA_COLL.findOne({company: companyID, status: 1})
            if(infoFunda){
                dataInsert.funda = infoFunda._id;
            }
        }

        if (checkObjectIDs(projectID)) {
            dataInsert.project = projectID;
        }
        if (checkObjectIDs(packageID)) {
            dataInsert.package = packageID;
        }
        if (checkObjectIDs(toPackageID)) {
            dataInsert.toPackage = toPackageID;
        }
        if (checkObjectIDs(warehouseID)) {
            dataInsert.warehouse = warehouseID;
        }
        if (checkObjectIDs(toWarehouseID)) {
            dataInsert.toWarehouse = toWarehouseID;
        }
        if (checkObjectIDs(customerID)) {
            dataInsert.customer = customerID;
        }
        if (checkObjectIDs(contractID)) {
            dataInsert.contract = contractID;
        }
        if (checkObjectIDs(linkID)) {
            dataInsert.link = linkID;
        }

        if (!isNaN(outin) && Number(outin) >= 1) {
            dataInsert.outin = Number(outin)
        }
        if (!isNaN(type) && Number(type) >= 1) {
            dataInsert.type = Number(type)
        }

        if (date) {
            dataInsert.date = date;
        }

        let convertStr = ''
        if (name && name != '') {
            dataInsert.name = name;
            convertStr = convertStr + " " + stringUtils.removeAccents(name)
        }
        if (sign && sign != '') {
            dataInsert.sign = sign;
            convertStr = convertStr + " " + stringUtils.removeAccents(sign)
        }
        if (note && note != '') {
            dataInsert.note = note;
            convertStr = convertStr + " " + stringUtils.removeAccents(note)
        }
        if(convertStr != ""){
            dataInsert.namecv = convertStr
        }
        // console.log(dataInsert)

        let infoAfterInsert = await this.insertData(dataInsert);
        if (!infoAfterInsert)
            return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 })

        return resolve({ error: false, data: infoAfterInsert, status: 200 });
    } catch (error) {
        return resolve({ error: true, message: error.message, status: 500 });
    }
})
}

/**
 * Name: Insert Full
 * Sử dụng cho Tạo đơn hàng
 * Author: HiepNH
 * Code: 20/2/2025
 */
insertFull({ outin, type, companyID, fundaID, businessID, channelID, shiftID, customerID, affiliateID, voucherID, userID, date, toDate, name, sign, note, total, discount, salesoff, credit, shippingFee, paymentMethod, buyerName, buyerPhone, buyerEmail, recipientName, recipientPhone, recipientAddress, feedbackNotes, products }) {
    return new Promise(async (resolve) => {
        try {            
            let infoCustomer = await ITEM__CONTACT_COLL.findById(customerID).select('remainLoyaltyPoints name phone')
            if(!name || !infoCustomer)
                return resolve({ error: true, message: "customer|name invalid", keyError: KEY_ERROR.PARAMS_INVALID })

            // Tính số lượng đơn hàng của phân vùng hiện tại
            let numberOfOrder = await STORE_ORDER_COLL.count({
                company: companyID,
            })
            // console.log({numberOfOrder})

            let nameNew = `${name}-Đơn hàng ${infoCustomer.name}-${infoCustomer.phone}-C${Number(numberOfOrder + 1)}`

            let dataInsert = {
                company: companyID,
                paymentMethod,
                name: nameNew,
                sign: `C${Number(numberOfOrder + 1)}`,
                total: Number(total),
                userCreate: userID,
            }

            if (checkObjectIDs(fundaID)) {
                dataInsert.funda = fundaID;
            }else{
                let infoFunda = await ITEM__FUNDA_COLL.findOne({company: companyID, status: 1})
                if(infoFunda){
                    dataInsert.funda = infoFunda._id;
                }
            }

            /**
             * BA-Trình tự tính toán giá trị thanh toán Amount
             * total-salesoff-credit => ưu đãi voucher nếu được giảm giá % sẽ tính theo trình tự này
             */
            let amount = 0

            // Giảm giá Food App
            if(!isNaN(discount)){
                amount = Number(total - discount)
            }

            // Giảm giá trực tiếp theo đơn hàng/theo sản phẩm
            if(!isNaN(salesoff)){
                amount = Number(amount) - Number(salesoff)
            }

            // Trừ tích điểm
            if (!isNaN(credit) && Number(credit) >= 0) {
                
                let creditRound = 0
                // Fix việc bị hack FE
                if(Number(credit) >= Number(infoCustomer.remainLoyaltyPoints)){
                    creditRound = 1000 * Math.round(infoCustomer.remainLoyaltyPoints / 1000);
                }else{
                    creditRound = 1000 * Math.round(credit / 1000);
                }
    
                if (Number(amount) <= Number(creditRound)) {
                  creditRound = amount;
                  amount = 0;
                } else {
                  amount = Number(amount) - Number(creditRound);
                }
    
                dataInsert.credit = Number(creditRound);
            }

            // Giảm giá voucher
            if (voucherID && checkObjectIDs(voucherID)) {
                let noticeVoucherErr = '', countVoucherErr = 0, offer = 0

                let infoVoucher = await STORE_VOUCHER_COLL.findById(voucherID);
                if (!infoVoucher){
                    // console.log('111111111111')
                    noticeVoucherErr = noticeVoucherErr + "Voucher không tồn tại"
                    countVoucherErr++
                }

                // Kiểm tra xem đúng VoucherID của customerID hay không
                if (!infoVoucher.receivers.includes(customerID)){
                    // console.log('222222222222222')
                    noticeVoucherErr = noticeVoucherErr + "Voucher không hợp lệ với khách hàng"
                    countVoucherErr++
                }

                // Kiểm tra thời hạn VoucherID
                let currentTime = new Date();
                let checkExpired = compareTwoTime(currentTime, infoVoucher.expired);
                if (checkExpired == 1){
                    // console.log('33333333333333')
                    noticeVoucherErr = noticeVoucherErr + "Voucher đã hết hạn"
                    countVoucherErr++
                }

                // Kiểm tra giá trị đơn hàng xem có được áp dụng Voucher hay không
                if (Number(amount) < Number(infoVoucher.minOrderAmount)){
                    // console.log('44444444444444')
                    noticeVoucherErr = noticeVoucherErr + `Đơn hàng không đủ điều kiện áp dụng (Giá trị phải >= ${infoVoucher.minOrderAmount})`
                    countVoucherErr++
                }

                // Kiểm tra xem khách hàng đã sử dụng voucherID hay chưa
                if (infoVoucher.buyers.includes(customerID)){
                    // console.log('5555555555555')
                    noticeVoucherErr = noticeVoucherErr + `Khách hàng đã sử dụng voucher`
                    countVoucherErr++
                }

                if(countVoucherErr > 0)
                    return resolve({ error: true, message: noticeVoucherErr, keyError: KEY_ERROR.INSERT_FAILED, status: 403 })

                /**
                 * Kiểm tra nếu Giá trị Voucher
                 */
                if (Number(infoVoucher.salesoffAmount) > 0) {
                    offer = Number(infoVoucher.salesoffAmount)
                } else {
                    offer = Number((Number(infoVoucher.salesoffRate) * Number(amount)) / 100).toFixed(0);
                }

                if (Number(amount) <= Number(offer)) {
                    offer = amount; // Set Offer
                    amount = 0; // Set Amount về 0
                } else {
                    amount = Number(amount) - Number(offer);
                }

                dataInsert.voucher = voucherID;
                dataInsert.voucherType = Number(infoVoucher.type);
                dataInsert.offer = Number(offer);
            }

            // Phí vận chuyển
            if (!isNaN(shippingFee)) {
                dataInsert.shippingFee = Number(shippingFee);
                amount = Number(amount) + Number(shippingFee);
            }

            dataInsert.amount = amount

            if (checkObjectIDs(businessID)) {
                dataInsert.business = businessID;
            }
            if (checkObjectIDs(channelID)) {
                dataInsert.channel = channelID;
            }
            if (checkObjectIDs(shiftID)) {
                dataInsert.shift = shiftID;
            }

            if (checkObjectIDs(customerID)) {
                dataInsert.customer = customerID;
            }
            if (checkObjectIDs(affiliateID)) {
                dataInsert.affiliate = affiliateID;
            }

            if (!isNaN(outin) && Number(outin) >= 1) {
                dataInsert.outin = Number(outin)
            }
            if (!isNaN(type) && Number(type) >= 1) {
                dataInsert.type = Number(type)
            }

            if (date) {
                dataInsert.date = date;
            }
            if (toDate) {
                dataInsert.toDate = toDate;
            }

            if (buyerName && buyerName != '') {
                dataInsert.buyerName = buyerName;
            }
            if (buyerPhone && buyerPhone != '') {
                dataInsert.buyerPhone = buyerPhone;
            }
            if (buyerEmail && buyerEmail != '') {
                dataInsert.buyerEmail = buyerEmail;
            }
            if (recipientName && recipientName != '') {
                dataInsert.recipientName = recipientName;
            }
            if (recipientPhone && recipientPhone != '') {
                dataInsert.recipientPhone = recipientPhone;
            }
            if (recipientAddress && recipientAddress != '') {
                dataInsert.recipientAddress = recipientAddress;
            }

            let convertStr = ''
            if (nameNew && nameNew != '') {
                convertStr = convertStr + " " + stringUtils.removeAccents(nameNew)
            }
            if (sign && sign != '') {
                dataInsert.sign = sign;
                convertStr = convertStr + " " + stringUtils.removeAccents(sign)
            }
            if (note && note != '') {
                dataInsert.note = note;
                convertStr = convertStr + " " + stringUtils.removeAccents(note)
            }
            if(convertStr != ""){
                dataInsert.namecv = convertStr
            }
            // console.log(dataInsert)

            let infoAfterInsert = await this.insertData(dataInsert);
            if (!infoAfterInsert)
                return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 })

            // console.log(infoAfterInsert)
            const orderID = infoAfterInsert._id

            /**
             * CẦN TỐI ƯU HÀM TẠO SẢN PHẨM
             * - Tạo một hàm khác để dùng riêng cho khách hàng đặt hàng
             */
            if (products && products.length) {
                const productsAsync = products.map((item) => {
                const dataInsertProduct = {
                    userID, 
                    fundaID: infoAfterInsert.funda, 
                    orderID, 
                    customerID, 
                    goodsID: item.productID, 
                    name: item.name, 
                    note: item.note, 
                    quantity: Number(item.quantity), 
                    unitPrice: Number(item.unitPrice),
                    listedUnitprice: Number(item.listedUnitprice),
                }

                    return STORE_ORDER_PRODUCT_MODEL.insert(dataInsertProduct)
                })

                await Promise.all(productsAsync)
            }

            return resolve({ error: false, data: infoAfterInsert, status: 200 });
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
update({ userID, orderID, filesID, fundaID, projectID, packageID, toPackageID, warehouseID, toWarehouseID, accountID, customerID, contractID, goodsID, assetsID, workID, name, sign, note, linkID, date, toDate, members, admins, outin, type, status, isAddSignature, forward, ctx }) {
    return new Promise(async (resolve) => {
        try {
            const infoOrder = await STORE_ORDER_COLL.findById(orderID)
            if(!infoOrder) {
                return resolve({
                    error: true,
                    message: 'Order không tồn tại',
                    keyError: "order_not_exists",
                    status: 400
                });
            }

            let dataUpdate = { 
                userUpdate: userID, 
                modifyAt: new Date() 
            }

            let dataAddToset = {};

            if (checkObjectIDs(filesID)) {
                dataAddToset = { files: filesID };
            }

            if (checkObjectIDs(fundaID)) {
                dataUpdate.funda = fundaID;
            }
            if (checkObjectIDs(projectID)) {
                dataUpdate.project = projectID;
            }
            if (checkObjectIDs(packageID)) {
                dataUpdate.package = packageID;
            }
            if (checkObjectIDs(toPackageID)) {
                dataUpdate.toPackage = toPackageID;
            }
            if (checkObjectIDs(warehouseID)) {
                dataUpdate.warehouse = warehouseID;
            }
            if (checkObjectIDs(toWarehouseID)) {
                dataUpdate.toWarehouse = toWarehouseID;
            }
            if (checkObjectIDs(accountID)) {
                dataUpdate.account = accountID;
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
            if (checkObjectIDs(linkID)) {
                dataUpdate.link = linkID;
            }

            if (date) {
                dataUpdate.date = date;
            }

            if (toDate) {
                dataUpdate.toDate = toDate;
            }

            let convertStr = ''
            if (name && name != '') {
                dataUpdate.name = name;
                convertStr = convertStr + " " + stringUtils.removeAccents(name)
            }
            if (sign && sign != '') {
                dataUpdate.sign = sign;
                convertStr = convertStr + " " + stringUtils.removeAccents(sign)
            }
            if (note && note != '') {
                dataUpdate.note = note;
                convertStr = convertStr + " " + stringUtils.removeAccents(note)
            }
            if(convertStr != ""){
                dataUpdate.namecv = convertStr
            }

            if (!isNaN(outin) && Number(outin) >= 1) {
                dataUpdate.outin = Number(outin)
            }

            if (!isNaN(type) && Number(type) >= 1) {
                dataUpdate.type = Number(type)
            }

            if (status && !isNaN(status) && Number(status) > 0) {
                dataUpdate.status = status;
            }

            if ([0,1].includes(Number(forward))) {
                dataUpdate.forward = Number(forward);
            }

            /**
             * KÝ XÁC NHẬN
             */
            if(isAddSignature) {
                const infoSignature = await ctx.call(`${CF_DOMAIN_SERVICES.ITEM}.${CF_ACTIONS_ITEM.SIGNATURE_INSERT}`, {
                    companyID: infoOrder?.company?.toString(),
                    projectID: infoOrder?.project?._id?.toString(),
                    coll: {
                        kind: 'store_order',
                        item: orderID
                    }
                });
                if(infoSignature.error) return resolve(infoSignature);

                const { _id } = infoSignature.data;
                dataAddToset = { ...dataAddToset, signatures: _id }

                dataUpdate.approver = userID
                dataUpdate.timeApproved = Date.now()
            }

            if(dataAddToset){
                dataUpdate.$addToSet = dataAddToset;
            }
            // console.log(dataUpdate)

            let infoAfterUpdate = await STORE_ORDER_COLL.findByIdAndUpdate(orderID, dataUpdate, { new: true });
            if (!infoAfterUpdate)
                return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 });
            // console.log(infoAfterUpdate)

            /**
             * Cập nhật lại các phần tử con
             * - Xét riêng cho Sổ Quỹ => vì khi copy phiếu/sửa => bị chạy hết theo phiếu
             * - Xét riêng cho Thẻ kho
             */
            if(infoAfterUpdate.type == 7 || infoAfterUpdate.type == 8){
                // Sổ quỹ: Không update cơ sở và mã khách mà chỉ cho update trong chi tiết phiếu
                await STORE_ORDER_PRODUCT_COLL.updateMany(
                    { 
                        order: ObjectID(orderID),
                    },
                    { $set: { 
                        "status" : infoAfterUpdate.status,
                        "forward" : infoAfterUpdate.forward,
                        "project" : infoAfterUpdate.project,
                        "package" : infoAfterUpdate.package,
                        "toPackage" : infoAfterUpdate.toPackage,
                        "outin" : infoAfterUpdate.outin,
                        "type" : infoAfterUpdate.type,
                        "date" : infoAfterUpdate.date,
                        "toDate" : infoAfterUpdate.toDate,
                        "warehouse" : infoAfterUpdate.warehouse,
                        "toWarehouse" : infoAfterUpdate.toWarehouse,
                    } }
                )
            }else{
                await STORE_ORDER_PRODUCT_COLL.updateMany(
                    { 
                        order: ObjectID(orderID),
                    },
                    { $set: { 
                        "status" : infoAfterUpdate.status,
                        "forward" : infoAfterUpdate.forward,
                        "project" : infoAfterUpdate.project,
                        "package" : infoAfterUpdate.package,
                        "toPackage" : infoAfterUpdate.toPackage,
                        "outin" : infoAfterUpdate.outin,
                        "type" : infoAfterUpdate.type,
                        "date" : infoAfterUpdate.date,
                        "toDate" : infoAfterUpdate.toDate,
                        "warehouse" : infoAfterUpdate.warehouse,
                        "toWarehouse" : infoAfterUpdate.toWarehouse,
                        "customer" : infoAfterUpdate.customer,
                        "contract" : infoAfterUpdate.contract,
                    } }
                )
            }

            return resolve({ error: false, data: infoAfterUpdate, status: 200 });
        } catch (error) {
            return resolve({ error: true, message: error.message, status: 500 });
        }
    })
}

/**
 * Name  : Cập nhật giá trị khi chi tiết thay đổi 
 * Code: Hiepnh
 * Date  : 14/4/2022
 */
updateValue({
    orderID, userID
}){
    return new Promise(async (resolve) => {
        try {
            if(!checkObjectIDs(orderID))
                return resolve({ error: true, message: "Mã hiệu không đúng", keyError: "orderID_invalid" })
            let infoCashBook = await STORE_ORDER_COLL.findById(orderID)

            let dataUpdate = { userUpdate: userID, modifyAt: new Date() };

            let listData = await STORE_ORDER_COLL.aggregate([
                {
                    $match: {
                        parent: ObjectID(orderID),
                    }
                },
                {
                    $group: {
                        _id: { },
                        amount: { $sum: "$amount" },
                        income: { $sum: "$income" },
                        expense: { $sum: "$expense" },
                    }
                },
            ])
            if(listData && listData.length){

                let arising = Number(listData[0].income) - Number(listData[0].expense)
                let closingBalance = Number(infoCashBook.openingBalance) + Number(arising)

                dataUpdate.arising = Number(arising)
                dataUpdate.closingBalance = Number(closingBalance)
                dataUpdate.income = Number(listData[0].income)
                dataUpdate.expense = Number(listData[0].expense)
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
 * Name: Get info 
 * Author: Hiepnh
 * Date: 9/4/2022
 */
getInfo({ orderID, select, populates = '{"path":"assignee project userCreate userUpdate members admins files signatures","select":"_id fullname bizfullname name sign image path nameOrg author createAt size","populate":{"path":"author","select":"_id fullname email phone image signature"}}' }) {
// console.log({orderID, select, populates})
    return new Promise(async resolve => {
        try {
            if (!checkObjectIDs(orderID))
                return resolve({ error: true, message: 'param_invalid' });

            if (populates && typeof populates === 'string') {
                if (!IsJsonString(populates))
                    return resolve({ error: true, message: 'Request params populates invalid', status: 400 });
                populates = JSON.parse(populates);
            } else {
                populates = {
                    path: "",
                    select: ""
                }
            }

            let info = await STORE_ORDER_COLL.findById(orderID)
                .select(select)
                .populate(populates)

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
getList({ option, status, arrType, outin, type, userID, companyID, projectID, packageID, toPackageID, warehouseID, accountID, customerID, goodsID, assetsID, userCreateID, keyword, limit = 50, lastestID, select, populates, sortKey, fromDate, toDate }) {
    // console.log({option, userCreateID, userID})
      return new Promise(async (resolve) => {
          try {
              let sortBy;
              let conditionObj = {};
              let keys = ['createAt__-1', '_id__-1'];

              if (limit > 50) {
                  limit = 50
              } else {
                  limit = +limit;
              }

              if (populates && typeof populates === 'string') {
                  if (!IsJsonString(populates))
                      return resolve({ error: true, message: 'Request params populates invalid', status: 400 });

                  populates = JSON.parse(populates);
              } else {
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

              if(!option){
                conditionObj.company = companyID;
              }else{
                    // Đơn hàng của userID đang truy cập
                    if(option == 1){
                        conditionObj.userCreate = userID
                    }
              }

              // Chọn nhiều phân loại
              arrType && arrType.length && (conditionObj.type = { $in: arrType })

              if(fromDate && toDate){
                  if(fromDate != 'Invalid Date' && toDate != 'Invalid Date'){
                      let startTime   = moment(fromDate).startOf('day').format();// <=== fix ISODate here
                      let endTime     = moment(toDate).endOf('day').format();// <=== fix ISODate here
                      conditionObj.date  = { 
                          $gte: moment(startTime).toDate(),
                          $lte: moment(endTime).toDate(),
                        //   $gte: moment(fromDate).toDate(),
                        //   $lte: moment(toDate).toDate(),
                        //   $gte: new Date(fromDate),
                        //   $lte: new Date(toDate),
                      }
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

              // // Lấy dòng tiền vào ra (có giá trị income > 0)
              // if(Number(outin) === 1){
              //     conditionObj.income = { $gt: 0 }
              // }

              // // Lấy dòng tiền vào ra (có giá trị income > 0)
              // if(Number(outin) === 2){
              //     conditionObj.expense = { $gt: 0 }
              // }

              if (keyword) {
                  keyword = keyword.split(" ");
                  keyword = '.*' + keyword.join(".*") + '.*';
                  conditionObj.name = RegExp(keyword, 'i');
              }
            //   console.log(conditionObj)

              let conditionObjOrg = { ...conditionObj };

              // PHÂN TRANG KIỂU MỚI
              if (lastestID && checkObjectIDs(lastestID)) {
                  let infoData = await STORE_ORDER_COLL.findById(lastestID);
                  if (!infoData)
                      return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                  let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
                  if (!dataPagingAndSort || dataPagingAndSort.error)
                      return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                  conditionObj = dataPagingAndSort.data.find;
                  sortBy = dataPagingAndSort.data.sort;
              } else {
                  let dataPagingAndSort = RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                  sortBy = dataPagingAndSort.data.sort;
              }
              // console.log(sortBy)

              let infoDataAfterGet = await STORE_ORDER_COLL.find(conditionObj)
                  .limit(limit + 1)
                  .sort(sortBy)
                  .select(select)
                  .populate(populates)
                  .lean();

              if (!infoDataAfterGet)
                  return resolve({ error: true, message: "Can't get data", status: 403 });

              let nextCursor = null;
              if (infoDataAfterGet && infoDataAfterGet.length) {
                  if (infoDataAfterGet.length > limit) {
                      nextCursor = infoDataAfterGet[limit - 1]._id;
                      infoDataAfterGet.length = limit;
                  }
              }

              let totalRecord = await STORE_ORDER_COLL.count(conditionObjOrg);
              let totalPage = Math.ceil(totalRecord / limit);

              return resolve({
                  error: false, data: {
                      listRecords: infoDataAfterGet,
                      limit,
                      totalRecord,
                      totalPage,
                      nextCursor,
                  }, status: 200
              });

          } catch (error) {
              return resolve({ error: true, message: error.message, status: 500 });
          }
      })
    } 
}

exports.MODEL = new Model();