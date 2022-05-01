"use strict";

/**
 * EXTERNAL PACKAGE
 */
 const ObjectID                                 = require('mongoose').Types.ObjectId;

 /**
  * CONSTANTS
  */
const { CF_DOMAIN_SERVICES } 				    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 		                = require('../../auth/helper/auth.actions-constant');
const { CF_ACTIONS_ITEM } 					    = require('../../item/helper/item.actions-constant');
 
 /**
  * TOOLS
  */
const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString, _isValid }= require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION_V2 }              = require('../../../tools/cursor_base/playground/index');
const { KEY_ERROR }                             = require('../../../tools/keys/index')
 
 /**
  * COLLECTIONS
  */
const BIDDING__DOC_COLL                         = require('../database/bidding.doc-coll');
const BIDDING__BILL_ITEM_COLL                   = require('../database/bidding.bill_item-coll');
const BIDDING__BILL_GROUP_COLL                  = require('../database/bidding.bill_group-coll');
const BIDDING__BILL_WORK_COLL                   = require('../database/bidding.bill_work-coll');
const BIDDING__BILL_WORKLINE_COLL               = require('../database/bidding.bill_workline-coll');
const BIDDING__BILL_PRODUCT_COLL                = require('../database/bidding.bill_product-coll');
const BIDDING__QUOTATION_COLL                   = require('../database/bidding.quotation-coll');
 
 /**
  * MODELS
  */
const BIDDING__DOC_MODEL                        = require('./bidding.doc-model').MODEL;
const BIDDING__BILL_ITEM_MODEL                  = require('./bidding.bill_item-model').MODEL;
const BIDDING__BILL_GROUP_MODEL                 = require('./bidding.bill_group-model').MODEL;

class Model extends BaseModel {
    constructor() {
        super(BIDDING__BILL_WORK_COLL);
    }

    /**
     * Name: Insert 
     * Author: Hiepnh
     * Date: 28/4/2022
     */
    insert({ userID, groupID, datahubJobID, name, sign, unit, description, note, plus, quantity, quantity2, unitprice1, unitprice2, unitprice3, unitprice, amount }) {
        const that = this
        return new Promise(async (resolve) => {
            try {
                let infoGroup = await BIDDING__BILL_GROUP_COLL.findById(groupID);
                if(!infoGroup)
                    return resolve({ error: true, message: "infoGroup không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID, status: 400 });

                let dataInsert = { 
                    userCreate: userID, 
                    area: infoGroup.area, 
                    client: infoGroup.client, 
                    project: infoGroup.project, 
                    doc: infoGroup.doc,
                    item: infoGroup.item,
                    group: groupID,
                    name
                };

                // if (checkObjectIDs(datahubJobID)) {
                //     dataInsert.datahubJob = datahubJobID;
                // }
                
                if (sign) {
                    dataInsert.sign = sign;
                }

                if (unit) {
                    dataInsert.unit = unit;
                }

                if (description) {
                    dataInsert.description = description;
                }

                if (note) {
                    dataInsert.note = note;
                }

                if (!isNaN(plus) && Number(plus) > 0) {
                    dataInsert.plus = plus;
                }

                if (!isNaN(quantity) && Number(quantity) >= 0) {
                    dataInsert.quantity = quantity;
                }

                if (!isNaN(quantity2) && Number(quantity2) >= 0) {
                    dataInsert.quantity2 = quantity2;
                }

                if (!isNaN(unitprice1) && Number(unitprice1) >= 0) {
                    dataInsert.unitprice1 = unitprice1;
                }

                if (!isNaN(unitprice2) && Number(unitprice2) >= 0) {
                    dataInsert.unitprice2 = unitprice2;
                }

                if (!isNaN(unitprice3) && Number(unitprice3) >= 0) {
                    dataInsert.unitprice3 = unitprice3;
                }

                if (!isNaN(unitprice) && Number(unitprice) >= 0) {
                    dataInsert.unitprice = unitprice;
                    dataInsert.amount = Number(quantity | 0) * Number(unitprice | 0)
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if (!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 });

                /**
                 * CẬP NHẬT LẠI GROUP, ITEM VÀ DOC
                 */
                let infoGoup = await BIDDING__BILL_GROUP_MODEL.updateValue({ option: 1, groupID, userID })
                let infoItem = await BIDDING__BILL_ITEM_MODEL.updateValue({ option: 1, itemID: infoGroup.item, userID })
                let infoDoc = await BIDDING__DOC_MODEL.updateValue({ option: 1, docID: infoGroup.doc, userID })
                console.log(infoGoup)
                console.log(infoItem)
                console.log(infoDoc)

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Update 
     * Author: Hiepnh
     * Date: 28/4/2022
     */
    update({ userID, workID, datahubJobID, name, sign, unit, description, note, plus, quantity, quantity2, unitprice1, unitprice2, unitprice3, unitprice, amount }) {
        const that = this
        return new Promise(async (resolve) => {
            try {
                let infoWork = await BIDDING__BILL_WORK_COLL.findById(workID);
                if(!infoWork)
                    return resolve({ error: true, message: "infoWork không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID, status: 400 })
                
                let groupID = infoWork.group
                let itemID = infoWork.item
                let docID = infoWork.doc

                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { 
                    userUpdate: userID,
                };

                // if (checkObjectIDs(datahubJobID)) {
                //     dataInsert.datahubJob = datahubJobID;
                // }

                if (name) {
                    dataUpdate.name = name;
                }

                if (sign) {
                    dataUpdate.sign = sign;
                }

                if (unit) {
                    dataUpdate.unit = unit;
                }

                if (description) {
                    dataUpdate.description = description;
                }

                if (note) {
                    dataUpdate.note = note;
                }

                if (!isNaN(plus) && Number(plus) > 0) {
                    dataUpdate.plus = plus;
                }

                if (!isNaN(quantity) && Number(quantity) >= 0) {
                    dataUpdate.quantity = quantity;
                }

                if (!isNaN(quantity2) && Number(quantity2) >= 0) {
                    dataUpdate.quantity2 = quantity2;
                }

                if (!isNaN(unitprice1) && Number(unitprice1) >= 0) {
                    dataUpdate.unitprice1 = unitprice1;
                }

                if (!isNaN(unitprice2) && Number(unitprice2) >= 0) {
                    dataUpdate.unitprice2 = unitprice2;
                }

                if (!isNaN(unitprice3) && Number(unitprice3) >= 0) {
                    dataUpdate.unitprice3 = unitprice3;
                }

                if (!isNaN(unitprice) && Number(unitprice) >= 0) {
                    dataUpdate.unitprice = unitprice;
                    dataUpdate.amount = Number(quantity | 0) * Number(unitprice | 0)
                }

                let infoAfterUpdate = await BIDDING__BILL_WORK_COLL.findByIdAndUpdate(workID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update", status: 403 });

                /**
                 * CẬP NHẬT LẠI GROUP, ITEM VÀ DOC
                 */
                let infoGoup = await BIDDING__BILL_GROUP_MODEL.updateValue({ option: 1, groupID, userID })
                let infoItem = await BIDDING__BILL_ITEM_MODEL.updateValue({ option: 1, itemID, userID })
                let infoDoc = await BIDDING__DOC_MODEL.updateValue({ option: 1, docID, userID })
                console.log(infoGoup)
                console.log(infoItem)
                console.log(infoDoc)

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Remove
     * Author: Hiepnh
     * Date: 28/4/2022
     */

    /**
     * Name: Get info 
     * Author: Hiepnh
     * Date: 28/4/2022
     */
    getInfo({ workID, select, populates }) {
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(workID))
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

                let info = await BIDDING__BILL_WORK_COLL.findById(workID)
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
     * Date: 28/4/2022
     */
    getList({ groupID,
        keyword, limit = 50, lastestID, select, populates = {}, sortKey }) {
        return new Promise(async (resolve) => {
            try {
                if (limit > 50) {
                    limit = 50
                } else {
                    limit = +limit;
                }

                /**
                 * DECALARTION VARIABLE (1)
                 */
                // Chỉ hiển thị sổ quỹ mà user là member
                let sortBy;
                let conditionObj = { };
                let keys = ['createAt__-1', '_id__-1'];

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

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

                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                if (checkObjectIDs(groupID)) {
                    conditionObj.group = groupID
                }
                console.log(conditionObj)

                if (keyword) {
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regExpSearch = RegExp(keyword, 'i');
                    conditionObj.name = regExpSearch;
                }
                let conditionObjOrg = { ...conditionObj };

                // PHÂN TRANG KIỂU MỚI
                if (lastestID && checkObjectIDs(lastestID)) {
                    let infoData = await BIDDING__BILL_WORK_COLL.findById(lastestID);
                    if (!infoData)
                        return resolve({ error: true, message: "Can't get info lastest", status: 400 });

                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: infoData, objectQuery: conditionObjOrg });
                    if (!dataPagingAndSort || dataPagingAndSort.error)
                        return resolve({ error: true, message: "Can't get range pagination", status: 400 });

                    conditionObj = dataPagingAndSort.data.find;
                    sortBy = dataPagingAndSort.data.sort;
                } else {
                    let dataPagingAndSort = await RANGE_BASE_PAGINATION_V2({ keys, latestRecord: null, objectQuery: conditionObjOrg });
                    sortBy = dataPagingAndSort.data.sort;
                }

                let infoDataAfterGet = await BIDDING__BILL_WORK_COLL.find(conditionObj)
                    .limit(limit + 1)
                    .sort(sortBy)
                    .select(select)
                    .populate(populates)
                    .lean();

                // GET TOTAL RECORD
                if (!infoDataAfterGet)
                    return resolve({ error: true, message: "Can't get data", status: 403 });

                let nextCursor = null;
                if (infoDataAfterGet && infoDataAfterGet.length) {
                    if (infoDataAfterGet.length > limit) {
                        nextCursor = infoDataAfterGet[limit - 1]._id;
                        infoDataAfterGet.length = limit;
                    }
                }

                let totalRecord = await BIDDING__BILL_WORK_COLL.count(conditionObjOrg);
                let totalPage = Math.ceil(totalRecord / limit);

                return resolve({
                    error: false, data: {
                        listRecords: infoDataAfterGet,
                        limit: +limit,
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

exports.MODEL = new Model;