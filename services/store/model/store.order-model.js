"use strict";

const BaseModel = require("../../../tools/db/base_model");
const ObjectID = require("mongoose").Types.ObjectId;
const moment = require("moment");

const { KEY_ERROR } = require("../../../tools/keys");
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

const XlsxPopulate = require("xlsx-populate");
const fs = require("fs");
const path = require("path");
const { uploadFileS3 } = require("../../../tools/s3");

class Model extends BaseModel {
  constructor() {
    super(STORE_ORDER_COLL);
  }

  /**
   * Name: Insert Basic
   * Author: HiepNH
   * Code: 8/9/2024
   */
  insert({ companyID, userID, outin, type, projectID, warehouseID, customerID, contractID, date, name, sign, note }) {
    return new Promise(async (resolve) => {
        try {
            if(!parentID){
                if (!checkObjectIDs(projectID) || !checkObjectIDs(warehouseID) ||!checkObjectIDs(customerID) ||!name)
                    return resolve({error: true, message: "projectID|warehouseID|customerID|name invalid", keyError: KEY_ERROR.PARAMS_INVALID})
            }

            let dataInsert = { 
              company: companyID,
              userCreate: userID, 
              admins: [userID], 
              members: [userID] 
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
            if (name) {
                dataInsert.name = name;
            }
            if (sign) {
                dataInsert.sign = sign;
            }
            if (note) {
                dataInsert.note = note;
            }

            let infoAfterInsert = await this.insertData(dataInsert);
            if (!infoAfterInsert)
                return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 })

            return resolve({ error: false, data: infoAfterInsert, status: 200 });
        } catch (error) {
            return resolve({ error: true, message: error.message, status: 500 });
        }
    })
  }

}

exports.MODEL = new Model();