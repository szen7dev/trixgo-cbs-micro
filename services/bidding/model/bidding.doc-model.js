"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID = require('mongoose').Types.ObjectId;

/**
 * CONSTANTS
 */
const { CF_ACTIONS_AUTH } 		                = require('../../auth/helper/auth.actions-constant');
const { CF_DOMAIN_SERVICES } 				    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } 					    = require('../../item/helper/item.actions-constant');

/**
 * TOOLS
 */
const { checkObjectIDs, IsJsonString }         = require('../../../tools/utils/utils');
const BaseModel                                = require('../../../tools/db/base_model');
const { RANGE_BASE_PAGINATION_V2 }             = require('../../../tools/cursor_base/playground/index');
const { KEY_ERROR }                            = require('../../../tools/keys/index')

/**
 * COLLECTIONS
 */
const BIDDING__PLAN_COLL                       = require('../database/bidding.plan-coll');
const BIDDING__DOC_COLL                        = require('../database/bidding.doc-coll');

/**
 * MODELS
 */

class Model extends BaseModel {
    constructor() {
        super(BIDDING__DOC_COLL);
    }

    /**
     * Name: Insert 
     * Author: Hiepnh
     * Date: 30/4/2022
     */
    insert({ userID, planID, parentID, name, sign, note, releaseTime, closingTime, bidderID, tenderPrice, vatTenderPrice, factor1, factor2, factor3, factor4, factor5, ctx }) {
        const that = this
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(userID) || !checkObjectIDs(planID))
                    return resolve({ error: true, message: 'Request params planID|userID invalid', status: 400 })
                
                // Thông tin Kế hoạch
                let infoPlan = await BIDDING__PLAN_COLL.findById(planID)
                console.log(infoPlan)

                if (!infoPlan)
                    return resolve({ error: true, message: 'Can not get infoPlan', status: 400 })

                let dataInsert = { userCreate: userID, 
                    field: infoPlan.field,
                    area: infoPlan.area,
                    client: infoPlan.client,
                    project: infoPlan.project,
                    contract: infoPlan.contract,
                    admins: [userID], 
                    members: [userID],
                    plan: planID
                }

                if (checkObjectIDs(parentID)) {
                    // let infoParent = await BIDDING__PLAN_COLL.findById(parentID)
                    dataInsert.parent = parentID;
                }

                if (checkObjectIDs(bidderID)) {
                    dataInsert.bidder = bidderID;
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

                if (releaseTime) {
                    dataInsert.releaseTime = releaseTime;
                }
                
                if (closingTime) {
                    dataInsert.closingTime = closingTime;
                }

                if (!isNaN(tenderPrice) && Number(tenderPrice) >= 0) {
                    dataInsert.tenderPrice = tenderPrice;
                }

                if (!isNaN(vatTenderPrice) && Number(vatTenderPrice) >= 0) {
                    dataInsert.vatTenderPrice = vatTenderPrice;
                }

                if (!isNaN(factor1) && Number(factor1) >= 0) {
                    dataInsert.factor1 = factor1;
                }
                if (!isNaN(factor2) && Number(factor2) >= 0) {
                    dataInsert.factor2 = factor2;
                }
                if (!isNaN(factor3) && Number(factor3) >= 0) {
                    dataInsert.factor3 = factor3;
                }
                if (!isNaN(factor4) && Number(factor4) >= 0) {
                    dataInsert.factor4 = factor4;
                }
                if (!isNaN(factor5) && Number(factor5) >= 0) {
                    dataInsert.factor5 = factor5;
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

    /**
     * Name: Update 
     * Author: Hiepnh
     * Date: 30/4/2022
     */
    update({ docID, userID, ctx, name, sign, note, releaseTime, closingTime, bidderID, tenderPrice, vatTenderPrice, factor1, factor2, factor3, factor4, factor5 }) {
        const that = this
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID };

                if (!checkObjectIDs(docID))
                    return resolve({ error: true, message: "Mã không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID })

                if (checkObjectIDs(bidderID)) {
                    dataUpdate.bidder = bidderID;
                }

                if (name) {
                    dataUpdate.name = name;
                }

                if (sign) {
                    dataUpdate.sign = sign;
                }

                if (note) {
                    dataUpdate.note = note;
                }

                if (releaseTime) {
                    dataUpdate.releaseTime = releaseTime;
                }
                
                if (closingTime) {
                    dataUpdate.closingTime = closingTime;
                }

                if (!isNaN(tenderPrice) && Number(tenderPrice) >= 0) {
                    dataUpdate.tenderPrice = tenderPrice;
                }

                if (!isNaN(vatTenderPrice) && Number(vatTenderPrice) >= 0) {
                    dataUpdate.vatTenderPrice = vatTenderPrice;
                }

                if (!isNaN(factor1) && Number(factor1) >= 0) {
                    dataUpdate.factor1 = factor1;
                }
                if (!isNaN(factor2) && Number(factor2) >= 0) {
                    dataUpdate.factor2 = factor2;
                }
                if (!isNaN(factor3) && Number(factor3) >= 0) {
                    dataUpdate.factor3 = factor3;
                }
                if (!isNaN(factor4) && Number(factor4) >= 0) {
                    dataUpdate.factor4 = factor4;
                }
                if (!isNaN(factor5) && Number(factor5) >= 0) {
                    dataUpdate.factor5 = factor5;
                }
              
                let infoAfterUpdate = await BIDDING__DOC_COLL.findByIdAndUpdate(docID, dataUpdate, { new: true })
                if (!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 })

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Remove
     * Author: Hiepnh
     * Date: 30/4/2022
     */

    /**
     * Name: Get info 
     * Author: Hiepnh
     * Date: 30/4/2022
     */
    getInfo({ docID, select, populates }) {
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(docID))
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

                let info = await BIDDING__DOC_COLL.findById(docID)
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
     * Date: 30/4/2022
     */
    getList({ clientID, projectID, planID, parentID, bidderID, contractID,
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
                // Hồ sơ mời thầu của Kế hoạch đấu thầu
                if (checkObjectIDs(planID)) {
                    conditionObj.plan = planID
                }else{
                    // Hồ sơ dự thầu của Hồ sơ mời thầu
                    if (checkObjectIDs(parentID)) {
                        conditionObj.parent = parentID
                    }else{
                        if (checkObjectIDs(bidderID)) {
                            conditionObj.bidder = bidderID
                        }
        
                        if (checkObjectIDs(contractID)) {
                            conditionObj.contract = contractID
                        }
    
                        if (projectID && checkObjectIDs(projectID)) {
                            conditionObj.project = projectID
                        }else{
                            if (checkObjectIDs(clientID)) {
                                conditionObj.client = clientID
                            }
                        }
                    }
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
                    let infoData = await BIDDING__DOC_COLL.findById(lastestID);
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

                let infoDataAfterGet = await BIDDING__DOC_COLL.find(conditionObj)
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

                let totalRecord = await BIDDING__DOC_COLL.count(conditionObjOrg);
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