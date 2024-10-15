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
const { CF_ACTIONS_ITEM } 		                = require('../../item/helper/item.actions-constant');

/**s
 * import inter-coll, exter-coll
 */
const MEDIA_MENU_COLL               = require("../database/media.menu-coll")
const MEDIA_CATE_COLL               = require('../database/media.cate-coll')

class Model extends BaseModel {
  constructor() {
    super(MEDIA_MENU_COLL);
  }

  /**
   * Name: Insert Basic
   * Author: HiepNH
   * Code: 8/9/2024
   */
  insert({ companyID, userID, outin, type, fundaID, projectID, packageID, toPackageID, warehouseID, toWarehouseID, customerID, contractID, date, name, sign, note, linkID }) {
    // console.log({ companyID, userID, outin, type, fundaID, projectID, packageID, toPackageID, warehouseID, toWarehouseID, customerID, contractID, date, name, sign, note })
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
                let infoFunda = await ITEM__FUNDA_COLL.findOne({company: companyID, status: 1})
                // console.log(infoFunda)
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
   * Name: Update 
   * Author: Hiepnh
   * Date: 9/4/2022
   */
  update({ userID, orderID, filesID, fundaID, projectID, packageID, toPackageID, warehouseID, toWarehouseID, accountID, customerID, contractID, goodsID, assetsID, workID, name, sign, note, linkID, date, members, admins, outin, type, status, isAddSignature, ctx }) {
      const that = this
      return new Promise(async (resolve) => {
          try {
            const infoOrder = await MEDIA_MENU_COLL.findById(orderID)

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

            let infoAfterUpdate = await MEDIA_MENU_COLL.findByIdAndUpdate(orderID, dataUpdate, { new: true });
            if (!infoAfterUpdate)
                return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 });

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

              let info = await MEDIA_MENU_COLL.findById(orderID)
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
  getList({ option, status, arrType, outin, type, userID, companyID, projectID, packageID, toPackageID, warehouseID, accountID, customerID, goodsID, assetsID, parentID, userCreateID, companyOfUser, keyword, limit = 50, lastestID, select, populates = '{"path":"assignee funda project contract warehouse customer userCreate userUpdate parent link","select":"fullname name sign phone image"}', sortKey, isCompanyOther, fromDate, toDate }) {
    //   console.log({ option, status, arrType, outin, type, userID, companyID, accountID, customerID, goodsID, assetsID, projectID, packageID, toPackageID, userCreateID, companyOfUser, keyword, limit, lastestID, select, populates, sortKey, isCompanyOther })
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
                    conditionObj.company = companyID;
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
                  let infoData = await MEDIA_MENU_COLL.findById(lastestID);
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

              let infoDataAfterGet = await MEDIA_MENU_COLL.find(conditionObj)
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

              let totalRecord = await MEDIA_MENU_COLL.count(conditionObjOrg);
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