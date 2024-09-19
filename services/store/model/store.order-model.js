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

/**s
 * import inter-coll, exter-coll
 */
const ITEM__FUNDA_COLL = require("../../item/database/item.funda-coll");
const ITEM__CONTACT_COLL = require("../../item/database/item.contact-coll");
const ITEM__CONFIG_COLL = require("../../item/database/item.config-coll");
const ITEM__DOCTYPE_COLL = require("../../item/database/item.doctype-coll");
const STORE_ORDER_COLL = require("../database/store.order-coll");
const STORE_ORDER_PRODUCT_COLL                 = require('../database/store.order_product-coll');

const XlsxPopulate = require("xlsx-populate");
const fs = require("fs");
const path = require("path");
const { uploadFileS3 } = require("../../../tools/s3");

const AUTH__APP_USER                    = require('../../auth/model/auth.app_users').MODEL

class Model extends BaseModel {
  constructor() {
    super(STORE_ORDER_COLL);
  }

  /**
   * Name: Insert Basic
   * Author: HiepNH
   * Code: 8/9/2024
   */
  insert({ companyID, userID, outin, type, fundaID, projectID, warehouseID, customerID, contractID, date, name, sign, note }) {
    // console.log({ companyID, userID, outin, type, fundaID, projectID, warehouseID, customerID, contractID, date, name, sign, note })
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
              admins: [userID], 
              members: [userID] 
            }

            if (checkObjectIDs(fundaID)) {
                dataInsert.funda = fundaID;
            }else{
                let infoFunda = await ITEM__FUNDA_COLL.findOne({company: companyID})
                console.log(infoFunda)
                if(infoFunda){
                    dataInsert.funda = infoFunda._id;
                }
            }

            if (checkObjectIDs(projectID)) {
                dataInsert.project = projectID;
            }
            if (checkObjectIDs(warehouseID)) {
                dataInsert.warehouse = warehouseID;
            }
            if (checkObjectIDs(customerID)) {
                dataInsert.customer = customerID;
            }
            if (checkObjectIDs(contractID)) {
                dataInsert.contract = contractID;
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
   * Name: Update 
   * Author: Hiepnh
   * Date: 9/4/2022
   */
  update({ userID, orderID, fundaID, projectID, warehouseID, accountID, customerID, contractID, goodsID, assetsID, workID, name, sign, note, date, members, admins, outin, type, status }) {
      // console.log({ })
      const that = this
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

            // //___________Quyền truy cập ứng dụng Store
            // let infoAppUser = await AUTH__APP_USER.checkPermissionsAccessApp({
            //     appID: "5f52341f880c2f26c8df8c10",
            //     userID
            // })

            let dataUpdate = { 
                userUpdate: userID, 
                modifyAt: new Date() 
            }

            if (checkObjectIDs(projectID)) {
                dataUpdate.project = projectID;
            }
            if (checkObjectIDs(warehouseID)) {
                dataUpdate.warehouse = warehouseID;
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

            if (date) {
                dataUpdate.date = date;
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

            // console.log(dataUpdate)

            let infoAfterUpdate = await STORE_ORDER_COLL.findByIdAndUpdate(orderID, dataUpdate, { new: true });
            if (!infoAfterUpdate)
                return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 });

            // console.log(infoAfterUpdate)

            // Cập nhật lại các phần tử con
            await STORE_ORDER_PRODUCT_COLL.updateMany(
                { 
                    order: ObjectID(orderID),
                },
                { $set: { 
                    "status" : infoAfterUpdate.status,
                    "project" : infoAfterUpdate.project,
                    "warehouse" : infoAfterUpdate.warehouse,
                    "customer" : infoAfterUpdate.customer,
                    "contract" : infoAfterUpdate.contract,
                    "outin" : infoAfterUpdate.outin,
                    "type" : infoAfterUpdate.type,
                    "date" : infoAfterUpdate.date,
                } }
            )

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
  getInfo({ orderID, select, populates }) {
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

              let infoContractIPC = await STORE_ORDER_COLL.findById(orderID)
                  .select(select)
                  .populate(populates)

              if (!infoContractIPC) return resolve({ error: true, message: 'cannot_get' });

              return resolve({ error: false, data: infoContractIPC });
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
  getList({ option, status, outin, type, userID, companyID, projectID, warehouseID, accountID, customerID, goodsID, assetsID, parentID, userCreateID, companyOfUser, keyword, limit = 50, lastestID, select, populates = {}, sortKey, isCompanyOther, fromDate, toDate }) {
    //   console.log({ option, status, outin, type, userID, companyID, accountID, customerID, goodsID, assetsID, parentID, userCreateID, companyOfUser, keyword, limit, lastestID, select, populates, sortKey, isCompanyOther })
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

              if (checkObjectIDs(parentID)) {
                  conditionObj.parent = parentID;
              } else {
                  if(!option){
                      // Chỉ hiển thị sổ quỹ mà user là member
                      // conditionObj = { members: { $in: [userID] } }  // Lấy theo công ty
                      conditionObj.parent = { $exists: false } // Lấy theo công ty

                      // Lấy sổ quỹ khác (không thuộc công ty của user hiện tại)
                      if(isCompanyOther === 'true') {
                          conditionObj.company = {
                              $nin: [companyOfUser]
                          }
                      } else{
                          conditionObj.company = companyID;
                      }
                  }
                  // Báo cáo chi tiết theo Goods
                  else{
                      if(option == 1){
                          conditionObj.company = companyID
                          conditionObj.parent = { $exists: true, $ne: null }
                          conditionObj.goods = { $exists: true, $ne: null }
                      }
                  }
              }

              // if(fromDate && toDate){
              //     if(fromDate != 'Invalid Date' && toDate != 'Invalid Date'){
              //         let startTime   = moment(fromDate).startOf('day').format();// <=== fix ISODate here
              //         let endTime     = moment(toDate).endOf('day').format();// <=== fix ISODate here
              //         conditionObj.date  = { 
              //             $gte: moment(startTime).toDate(),
              //             $lte: moment(endTime).toDate()
              //         }
              //     }
              // }

              if (checkObjectIDs(projectID)) {
                  conditionObj.project = projectID;
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
              // console.log(conditionObj)

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

  /**
   * Name  : getListByProperty
   * Author: HiepNH
   * Date: 2/9/2024
   */
//   getListByProperty({ companyID, option, outin, type, projectID, warehouseID, accountID, customerID, goodsID, assetsID, userCreateID, fromDate, toDate }) {
//       return new Promise(async resolve => {
//           try {
//               /**
//                * BA
//                * 1. Ban đầu query tổng tất cả dữ liệu
//                * 2. Sau bổ sung các phiếu đầu kỳ/kết chuyển số dư
//                */
//               let conditionObj1 = {
//                   company: ObjectID(companyID),
//                   goods: { $exists: true, $ne: null },
//                   status: 5,
//                   outin: 1,
//               }
//               let conditionObj2 = {
//                   company: ObjectID(companyID),
//                   goods: { $exists: true, $ne: null },
//                   status: 5,
//                   outin: 2,
//               }

//               // if(fromDate && toDate){
//               //     if(fromDate != 'Invalid Date' && toDate != 'Invalid Date'){
//               //         let startTime   = moment(fromDate).startOf('day').format();// <=== fix ISODate here
//               //         let endTime     = moment(toDate).endOf('day').format();// <=== fix ISODate here
//               //         conditionObj1.date  = { 
//               //             $gte: moment(startTime).toDate(),
//               //             $lte: moment(endTime).toDate()
//               //         }
//               //         conditionObj2.date  = { 
//               //             $gte: moment(startTime).toDate(),
//               //             $lte: moment(endTime).toDate()
//               //         }
//               //     }
//               // }

//               if (checkObjectIDs(projectID)) {
//                   conditionObj1.project = ObjectID(projectID);
//                   conditionObj2.project = ObjectID(projectID);
//               }

//               if (checkObjectIDs(warehouseID)) {
//                   conditionObj1.warehouse = ObjectID(warehouseID);
//                   conditionObj2.warehouse = ObjectID(warehouseID);
//               }

//               if (checkObjectIDs(accountID)) {
//                   conditionObj1.account = ObjectID(accountID);
//                   conditionObj2.account = ObjectID(accountID);
//               }

//               if (checkObjectIDs(customerID)) {
//                   conditionObj1.customer = ObjectID(customerID);
//                   conditionObj2.customer = ObjectID(customerID);
//               }

//               if (checkObjectIDs(userCreateID)) {
//                   conditionObj1.userCreate = ObjectID(userCreateID);
//                   conditionObj2.userCreate = ObjectID(userCreateID);
//               }

//               if (checkObjectIDs(goodsID)) {
//                   conditionObj1.goods = ObjectID(goodsID);
//                   conditionObj2.goods = ObjectID(goodsID);
//               }
//               if (checkObjectIDs(assetsID)) {
//                   conditionObj1.assets = ObjectID(assetsID);
//                   conditionObj2.assets = ObjectID(assetsID);
//               }

//               // if (!isNaN(outin) && Number(outin) >= 1) {
//               //     conditionObj1.outin = Number(outin)
//               //     conditionObj2.outin = Number(outin)
//               // }

//               if (!isNaN(type) && Number(type) >= 1) {
//                   conditionObj1.type = Number(type)
//                   conditionObj2.type = Number(type)
//               }

//               let conditionGroup = {}, conditionPopulate = {}

//               conditionGroup = {
//                   _id: { goods: "$goods" },
//                   quantity: { $sum: "$quantity" },
//                   amount: { $sum: "$amount" }
//               }
              
//               let listData1 = await STORE_ORDER_COLL.aggregate([
//                   {
//                       $match: conditionObj1
//                   },
//                   {
//                       $group: conditionGroup
//                   },
//               ])

//               let listData2 = await STORE_ORDER_COLL.aggregate([
//                   {
//                       $match: conditionObj2
//                   },
//                   {
//                       $group: conditionGroup
//                   }
//               ])

//               let arr = [...listData1,...listData2]

//               let arrCombine = [], arr1 = [], arr2 = []
//               listData1.forEach(item=>{
//                   let key = item._id.goods;
//                   if (!Array.isArray(arr1[key])) {
//                       arr1[key] = [];
//                   }
//                   arr1[key].push(item)
//               })

//               listData2.forEach(item=>{
//                   let key = item._id.goods;
//                   if (!Array.isArray(arr2[key])) {
//                       arr2[key] = [];
//                   }
//                   arr2[key].push(item)
//               })
//               // console.log(arr1)
//               // console.log(arr2)

//               let listGoods = await ITEM__GOODS_COLL.find({_id: {$in: arr.map(item => item._id.goods)}})
//               .select('name sign unit')

//               listGoods.forEach(item =>{
//                   let quantityIncome = 0, income = 0, quantityExpense = 0, expense = 0

//                   if(arr1[item._id]){
//                       quantityExpense = arr1[item._id][0].quantity
//                       expense = arr1[item._id][0].amount
//                   }
                  
//                   if(arr2[item._id]){
//                       quantityIncome = arr2[item._id][0].quantity
//                       income = arr2[item._id][0].amount
//                   }

//                   arrCombine.push({
//                       _id: item._id,
//                       name: item.name,
//                       unit: item.unit,
//                       quantityIncome: Number(quantityIncome),
//                       income: Number(income),
//                       quantityExpense: Number(quantityExpense),
//                       expense: Number(expense),
//                   })
//               })

//               return resolve({ error: false, data: arrCombine })
//           } catch (error) {
//               return resolve({ error: true, message: error.message })
//           }
//       })
//   }


}

exports.MODEL = new Model();