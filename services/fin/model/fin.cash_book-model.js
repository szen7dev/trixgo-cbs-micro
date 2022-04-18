"use strict";
const BaseModel = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString } = require('../../../tools/utils/utils');
const ObjectID = require('mongoose').Types.ObjectId;
const { CF_DOMAIN_SERVICES } = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_ITEM } = require('../../item/helper/item.actions-constant');

/**
 * import inter-coll, exter-coll
 */
const FIN__CASH_BOOK_COLL = require('../database/fin.cash_book-coll');

const { RANGE_BASE_PAGINATION_V2 } = require('../../../tools/cursor_base/playground/index');
const { KEY_ERROR } = require('../../../tools/keys/index');

/**
 * import inter-model, exter-model
 */
class Model extends BaseModel {
    constructor() {
        super(FIN__CASH_BOOK_COLL);
    }

    /**
     * Name: Insert ✅
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    insert({ companyID, userID, parentID, accountID, customerID, contractID, name, sign, note, date, income, expense, arising, openingBalance, closingBalance }) {
        return new Promise(async (resolve) => {
            try {
                let dataInsert = { userCreate: userID, company: companyID, admins: [userID], members: [userID] };

                if (checkObjectIDs(parentID)) {
                    dataInsert.parent = parentID;
                }

                if (checkObjectIDs(accountID)) {
                    dataInsert.account = accountID;
                }

                if (checkObjectIDs(customerID)) {
                    dataInsert.customer = customerID;
                }

                if (checkObjectIDs(contractID)) {
                    dataInsert.contract = contractID;
                }

                if (name) {
                    dataInsert.name = name;
                }

                if (date) {
                    dataInsert.date = date;
                }

                if (sign) {
                    dataInsert.sign = sign;
                }

                if (note) {
                    dataInsert.note = note;
                }

                if (!isNaN(arising) && Number(arising) >= 0) {
                    dataInsert.arising = arising;
                }

                if (!isNaN(openingBalance) && Number(openingBalance) >= 0) {
                    dataInsert.openingBalance = openingBalance;
                }

                if (!isNaN(closingBalance) && Number(closingBalance) >= 0) {
                    dataInsert.closingBalance = closingBalance;
                }

                if (!isNaN(income) && Number(income) >= 0) {
                    dataInsert.income = income;
                }

                if (!isNaN(expense) && Number(expense) >= 0) {
                    dataInsert.expense = expense;
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if (!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 });

                return resolve({ error: false, data: infoAfterInsert, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Update ✅
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    update({ cashBookID, accountID, customerID, contractID, name, sign, note, date, income, expense, userID }) {
        return new Promise(async (resolve) => {
            try {
                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID };

                if (!checkObjectIDs(cashBookID))
                    return resolve({ error: true, message: "Mã không hợp lệ", keyError: KEY_ERROR.PARAMS_INVALID })

                if (checkObjectIDs(accountID)) {
                    dataUpdate.account = accountID;
                }

                if (checkObjectIDs(customerID)) {
                    dataUpdate.customer = customerID;
                }

                if (checkObjectIDs(contractID)) {
                    dataUpdate.contract = contractID;
                }

                if (name) {
                    dataUpdate.name = name;
                }

                if (date) {
                    dataUpdate.date = date;
                }

                if (sign) {
                    dataUpdate.sign = sign;
                }

                if (note) {
                    dataUpdate.note = note;
                }

                if (!isNaN(income) && Number(income) >= 0) {
                    dataUpdate.income = income;
                }

                if (!isNaN(expense) && Number(expense) >= 0) {
                    dataUpdate.expense = expense;
                }

                let infoAfterUpdate = await FIN__CASH_BOOK_COLL.findByIdAndUpdate(cashBookID, dataUpdate, { new: true });
                if (!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 });

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name: Remove
     * Author: Hiepnh
     * Date: 9/4/2022
     */

    /**
     * Name: Get info ✅
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getInfo({ cashBookID, select, populates }) {
        return new Promise(async resolve => {
            try {
                if (!checkObjectIDs(cashBookID))
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

                let infoContractIPC = await FIN__CASH_BOOK_COLL.findById(cashBookID)
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
     * Name  : Get list ✅
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getList({ userID, companyID, accountID, customerID, contractID, parentID,
        keyword, limit = 50, lastestID, select, populates = {} }) {
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
                let conditionObj = {};
                let keys = ['date__1', 'createAt__-1'];

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                // POPULATE
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
                /**
                 * LOGIC STEP (3)
                 *  3.1: Convert type + update name (ví dụ: string -> number)
                 *  3.2: Operation database
                 */
                if (checkObjectIDs(companyID)) {
                    conditionObj.company = companyID
                }
                if (checkObjectIDs(accountID)) {
                    conditionObj.account = accountID
                }
                if (checkObjectIDs(customerID)) {
                    conditionObj.customer = customerID
                }
                if (checkObjectIDs(contractID)) {
                    conditionObj.contract = contractID
                }
                if (checkObjectIDs(parentID)) {
                    conditionObj.parent = parentID
                } else {
                    conditionObj.parent = { $exists: false }
                }

                // Chỉ hiển thị sổ quỹ mà user là member
                conditionObj.members = { $in: [userID] }

                if (keyword) {
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    let regExpSearch = RegExp(keyword, 'i');
                    conditionObj.name = regExpSearch;
                }
                let conditionObjOrg = { ...conditionObj };

                // PHÂN TRANG KIỂU MỚI
                if (lastestID && checkObjectIDs(lastestID)) {
                    let infoData = await FIN__CASH_BOOK_COLL.findById(lastestID);
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

                let infoDataAfterGet = await FIN__CASH_BOOK_COLL.find(conditionObj)
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

                let totalRecord = await FIN__CASH_BOOK_COLL.count(conditionObjOrg);
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

    /**
     * Name: Gom nhóm theo thuộc tính ✅
     * Author: Hiepnh
     * Date: 17/04/2022
     */
     getAmountByProperty({ userID, companyID, parentID, accountID, year, option, ctx }){
        console.log({ userID, companyID, parentID, accountID, year, option })
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * Lấy sổ quỹ hiện tại của Công ty đang truy cập
                 */

                let conditionObj = {}, conditionGroup = {}, conditionObjYear = {}, conditionPopulate = {}, sortBy

                if(parentID && checkObjectIDs(parentID)){
                    conditionObj.parent = ObjectID(parentID) 
                }else{
                    // Tính tổng theo công ty
                }

                if(accountID && checkObjectIDs(accountID)){
                    conditionObj.account = ObjectID(accountID)
                }

                conditionGroup = {
                    _id: {  },
                    income: { $sum: "$income" },
                    expense: { $sum: "$expense" },
                }

                if(option && Number(option) === 1){
                    conditionGroup = {
                        _id: { account: "$account" },
                        income: { $sum: "$income" },
                        expense: { $sum: "$expense" },
                    }

                    conditionPopulate = {
                        path: '_id.account',
                        select: '_id name description',
                        model: 'account'
                    }
                }

                sortBy = {
                    "_id.account": 1,
                }

                // Thống kê theo biểu đồ (tháng/năm)
                if(!isNaN(year) && Number(year) >= 0){
                    conditionObjYear = {
                        "year": Number(year),
                    }

                    conditionGroup = {
                        _id: { month: "$month", year: "$year" },
                        income: { $sum: "$income" },
                        expense: { $sum: "$expense" },
                    }
                }

                console.log(conditionObj)
                console.log(conditionGroup)

                let listData = await FIN__CASH_BOOK_COLL.aggregate([
                    {
                        $match: conditionObj
                    }, 
                    {
                        $project : { 
                            year : {$year : "$date"},
                            month : {$month : "$date"},
                            parent: 1,
                            account: 1,
                            // customer: 1,
                            // contract: 1,
                            // arising: 1,
                            // closingBalance: 1,
                            income: 1,
                            expense: 1,
                        }
                    },
                    {
                        $match: conditionObjYear
                    }, 
                    {
                        $group: conditionGroup
                    }, 
                    {
                        $sort: sortBy
                    } 
                ])

                if(!isNaN(option) && Number(option) > 0){
                    await FIN__CASH_BOOK_COLL.populate(listData, conditionPopulate)
                }

                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }
    
    
}

exports.MODEL = new Model;