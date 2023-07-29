"use strict";

const BaseModel = require('../../../tools/db/base_model');
const { checkObjectIDs, IsJsonString, _getLevelMaxInRecursive, _constructForAny, _getLevelMaxInRecursiveByCompany } = require('../../../tools/utils/utils');
const ObjectID = require('mongoose').Types.ObjectId;

const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_AUTH } 		        = require('../../auth/helper/auth.actions-constant');

const XlsxPopulate                      = require('xlsx-populate');
const fs                                = require('fs');
const path                              = require('path');
const { uploadFileS3 }                  = require('../../../tools/s3');

/**
 * import inter-coll, exter-coll
 */
const FIN__CASH_BOOK_COLL                = require('../database/fin.cash_book-coll');
const ACCOUNT_COLL                       = require('../../item/database/item.account-coll')
const CONTACT_COLL                       = require('../../item/database/item.contact-coll')
const CONTRACT_COLL                      = require('../../item/database/item.contract-coll')
const FINANCIAL_GENERAL_JOURNAL_COLL     = require('../.../../../accounting/database/accounting.financial_general_journal-coll')

const { RANGE_BASE_PAGINATION_V2 } = require('../../../tools/cursor_base/playground/index');
const { KEY_ERROR } = require('../../../tools/keys/index');

/**
 * import inter-model, exter-model
 */
const FINANCIAL_GENERAL_JOURNAL_MODEL   = require('../.../../../accounting/model/accounting.financial_general_journal-model').MODEL
const ACCOUNT_MODEL                     = require('../.../../../item/model/item.account-model').MODEL

class Model extends BaseModel {
    constructor() {
        super(FIN__CASH_BOOK_COLL);
    }

    /**
     * Name: Insert 
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    insert({ companyID, userID, parentID, accountID, customerID, contractID, name, sign, note, date, income, expense, arising, openingBalance, closingBalance }) {
        const that = this
        return new Promise(async (resolve) => {
            try {
                let dataInsert = { userCreate: userID, admins: [userID], members: [userID] };

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

                // Cập nhật company theo company của parent: áp dụng cho user phân vùng khác thêm sửa mẩu tin
                if(checkObjectIDs(parentID)) {
                    const infoParentCashbook = await FIN__CASH_BOOK_COLL
                        .findById(parentID)
                        .select('company')
                        .lean();

                    dataInsert.company = infoParentCashbook.company;
                } else{
                    dataInsert.company = companyID;
                }

                let infoAfterInsert = await this.insertData(dataInsert);
                if (!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 });

                // Cập nhật lại phần tử cha
                if(checkObjectIDs(parentID)){
                    await that.updateValue({cashBookID: parentID, userID})
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
    update({ cashBookID, accountID, customerID, contractID, name, sign, note, date, income, expense, active, members, admins, userID }) {
        const that = this
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
                }else{
                    dataUpdate.contract = null
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

                if (income >= 0) {
                    dataUpdate.income = income;
                }

                if (expense >= 0) {
                    dataUpdate.expense = expense;
                }

                if (!isNaN(active) && Number(active) > 0) {
                    dataUpdate.active = active;
                }

                const infoCashBook = await FIN__CASH_BOOK_COLL.findById(cashBookID)
                .populate('parent')
                .lean();
                // console.log(infoCashBook)

                if(!infoCashBook) {
                    return resolve({
                        error: true,
                        message: 'Cashbook không tồn tại',
                        keyError: "cashbook_not_exists",
                        status: 400
                    });
                }

                // Cập nhật company theo company của parent: áp dụng cho user phân vùng khác thêm sửa mẩu tin
                if(infoCashBook.parent && infoCashBook.parent.company){
                    dataUpdate.company = infoCashBook.parent.company
                }
                // console.log(dataUpdate)

                const adminsID = [...infoCashBook.admins?.map(item => item.toString()), infoCashBook.userCreate?.toString()];

                if(adminsID.includes(userID.toString())) {
                    if(admins && admins.length) {
                        if(checkObjectIDs(admins)) {
                            admins = [...new Set(admins)];
                            dataUpdate.admins = admins;
                        } else{
                            dataUpdate.admins = [];
                        }
                    }

                    if(members && members.length) {
                        if(checkObjectIDs(members)) {
                            members = [...new Set(members)];
                            dataUpdate.members = members;
                        } else{
                            dataUpdate.members = [];
                        }
                    }
                } else{
                    if(checkObjectIDs(admins)) {
                        return resolve({
                            error: true,
                            message: 'Bạn không có quyền chia sẻ',
                            keyError: "permission_denined",
                            status: 403
                        });
                    }

                    if(checkObjectIDs(members)) {
                        return resolve({
                            error: true,
                            message: 'Bạn không có quyền chia sẻ',
                            keyError: "permission_denined",
                            status: 403
                        });
                    }
                }

                let infoAfterUpdate = await FIN__CASH_BOOK_COLL.findByIdAndUpdate(cashBookID, dataUpdate, { new: true });
                if (!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: KEY_ERROR.UPDATE_FAILED, status: 403 });

                // Cập nhật lại phần tử cha
                if(checkObjectIDs(infoAfterUpdate.parent)){
                    await that.updateValue({cashBookID: infoAfterUpdate.parent, userID})
                }

                return resolve({ error: false, data: infoAfterUpdate, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /**
     * Name  : Cập nhật giá trị khi chi tiết thay đổi 
     * Author: Hiepnh
     * Date  : 14/4/2022
     */
    updateValue({
        cashBookID, userID
    }){
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA
                 * 1-Cập nhật kế hoạch
                 * 2-Cập nhật thực tế
                 */
                if(!checkObjectIDs(cashBookID))
                    return resolve({ error: true, message: "Mã hiệu không đúng", keyError: "cashBookID_invalid" })

                let infoCashBook = await FIN__CASH_BOOK_COLL.findById(cashBookID)
                // console.log(infoCashBook)

                /**
                 * DECALARTION VARIABLE (1)
                 */
                let dataUpdate = { userUpdate: userID };

                /**
                 * VALIDATION STEP (2)
                 *  - Kiểm tra valid từ các input
                 *  - Kiểm tra valid từ database (ví dụ: đảm bảo foreign_key hoặc các điều kiện của coll)
                 */

                /**
                 * LOGIC STEP (3)
                 * 3.1: Convert type + update name (ví dụ: string -> number)
                 * 3.2: Operation database
                 */
                 let listData = await FIN__CASH_BOOK_COLL.aggregate([
                    {
                        $match: {
                            parent: ObjectID(cashBookID),
                        }
                    },
                    {
                        $group: {
                            _id: { },
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
                }

                let infoAfterUpdate = await FIN__CASH_BOOK_COLL.findByIdAndUpdate(cashBookID, dataUpdate, { new: true });
                if(!infoAfterUpdate)
                    return resolve({ error: true, message: "Cập nhật thất bại", keyError: "can't_update_budget", status: 403 });

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
     * Name: Get info 
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
     * Name  : Get list 
     * Author: Hiepnh
     * Date: 9/4/2022
     */
    getList({ outin, userID, companyID, accountID, parentID, companyOfUser,
        keyword, limit = 30, lastestID, select, populates = {}, sortKey, isCompanyOther }) {
        return new Promise(async (resolve) => {
            try {
                let sortBy;
                let conditionObj = {};
                let keys = ['createAt__-1', '_id__-1'];

                if (limit > 30) {
                    limit = 30
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

                    if (checkObjectIDs(accountID)) {
                        conditionObj.account = accountID;
                    }
                } else {
                    // Chỉ hiển thị sổ quỹ mà user là member
                    conditionObj = { members: { $in: [userID] } }  // Lấy theo công ty
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

                // Lấy dòng tiền vào ra (có giá trị income > 0)
                if(Number(outin) === 1){
                    conditionObj.income = { $gt: 0 }
                }

                // Lấy dòng tiền vào ra (có giá trị income > 0)
                if(Number(outin) === 2){
                    conditionObj.expense = { $gt: 0 }
                }

                if (keyword) {
                    keyword = keyword.split(" ");
                    keyword = '.*' + keyword.join(".*") + '.*';
                    conditionObj.name = RegExp(keyword, 'i');
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
    * Name  : Lấy tổng thu và chi theo sổ
    * Author: MinhVH
    * Date  : 18/4/2022
    */
    getAmountIncomeAndExpenseByParent({ parentID }) {
        return new Promise(async (resolve) => {
            try {
                if (!checkObjectIDs(parentID))
                    return resolve({ error: true, message: "Tham số parentID không hợp lệ", keyError: "parentID_invalid" });

                let listData = await FIN__CASH_BOOK_COLL.aggregate([
                    {
                        $match: {
                            parent: ObjectID(parentID),
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            income: { $sum: "$income" },
                            expense: { $sum: "$expense" },
                        }
                    },
                ])

                if (listData && listData.length) {
                    listData = {
                        income: Number(listData[0].income),
                        expense: Number(listData[0].expense)
                    }
                } else{
                    listData = null;
                }

                return resolve({ error: false, data: listData, status: 200 });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    /*
     * Name: Gom nhóm theo thuộc tính 
     * Author: Hiepnh
     * Date: 17/04/2022
     */
    getAmountByProperty({ userID, companyID, parentID, accountID, year, option, ctx }){
        console.log({ userID, companyID, parentID, accountID, year, option })
        return new Promise(async resolve => {
            try {
                /**
                 * BA
                 * Tham số của option:
                 * 1-Tổng hợp các công ty mà user được quyền truy cập báo cáo quản trị
                 * 2-Tổng hợp của công ty user
                 * 3-Tổng hợp theo sổ quỹ cụ thể
                 */
                let conditionObj = {}, conditionGroup = {}, conditionObjYear = {}, conditionPopulate = {}, sortBy = {"income": -1}

                if (!option || isNaN(option) || ![1,2,3,4].includes(Number(option)))
                    return resolve({ error: true, message: "Tham số option không hợp lệ", keyError: "option_invalid" })

                // Cấu hình gom nhóm mặc định
                conditionGroup = {
                    _id: {},
                    income: { $sum: "$income" },
                    expense: { $sum: "$expense" },
                    date: { $first: "$date" },
                }

                // 1-Tổng hợp các công ty mà user được quyền truy cập báo cáo quản trị
                if(Number(option) === 1){
                    // console.log('1-Tổng hợp các công ty mà user được quyền truy cập báo cáo quản trị 556688')
                    let listCompany = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.APP_MENU_GET_LIST_COMPANY}`, {
                        appID: "5dfe4bc751dc622100bb9d8a",
                        menuID: "623f2465e998e94feda0cdaa",
                        type: "1"
                    })

                    let listActiveParent = await FIN__CASH_BOOK_COLL.find({
                        active: 1,
                        parent: {$exists: false},
                        company: {$in: listCompany.data.map(item=>item._id.company._id)}
                    })

                    conditionObj.parent = {$in: listActiveParent.map(item=>item._id)}

                    conditionGroup = {
                        _id: { account: "$account", company: "$company" },
                        income: { $sum: "$income" },
                        expense: { $sum: "$expense" },
                        date: { $first: "$date" },
                    }

                    conditionPopulate = {
                        path: '_id.account',
                        select: '_id name description company',
                        model: 'account'
                    }

                    sortBy = {
                        "_id.account": 1,
                    }
                }

                // 2-Tổng hợp theo công ty cụ thể
                if(Number(option) === 2){
                    // console.log('2-Tổng hợp của công ty user')
                    let listActiveParent = await FIN__CASH_BOOK_COLL.find({
                        active: 1,
                        parent: {$exists: false},
                        company: companyID
                    })
                    conditionObj.parent = {$in: listActiveParent.map(item=>item._id)}

                    conditionGroup = {
                        _id: { account: "$account" },
                        income: { $sum: "$income" },
                        expense: { $sum: "$expense" },
                        date: { $first: "$date" },
                    }

                    conditionPopulate = {
                        path: '_id.account',
                        select: '_id name description',
                        model: 'account'
                    }

                    sortBy = {
                        "_id.account": 1,
                    }
                }

                // 3-Tổng hợp theo sổ quỹ cụ thể
                if(Number(option) === 3){
                    // console.log('3-Tổng hợp theo sổ quỹ cụ thể')
                    if(parentID && checkObjectIDs(parentID)){
                        conditionObj.parent = ObjectID(parentID)

                        // Gom nhóm theo các loại tài khoản
                        if(accountID && checkObjectIDs(accountID)){
                            conditionObj.account = ObjectID(accountID)
                        }
                    }

                    conditionGroup = {
                        _id: { account: "$account" },
                        income: { $sum: "$income" },
                        expense: { $sum: "$expense" },
                        date: { $first: "$date" },
                    }

                    conditionPopulate = {
                        path: '_id.account',
                        select: '_id name description',
                        model: 'account'
                    }

                    sortBy = {
                        "_id.account": 1,
                    }
                }

                /**
                 * TỔNG HỢP THEO CÁC CÔNG TY MÀ USER ĐƯỢC TRUY CẬP
                 */
                if(Number(option) === 4){
                    let listCompany = await ctx.call(`${CF_DOMAIN_SERVICES.AUTH}.${CF_ACTIONS_AUTH.APP_MENU_GET_LIST_COMPANY}`, {
                        appID: "5dfe4bc751dc622100bb9d8a",
                        menuID: "623f2465e998e94feda0cdaa",
                        type: "1"
                    })

                    // Danh sách các sổ quỹ còn hoạt động thuộc các công ty user được truy cập
                    let listActiveParent = await FIN__CASH_BOOK_COLL.find({
                        active: 1,
                        parent: {$exists: false},
                        company: {$in: listCompany.data.map(item=>item._id.company._id)}
                    })

                    conditionObj.parent = {$in: listActiveParent.map(item=>item._id)}

                    conditionGroup = {
                        _id: { company: "$company" },
                        income: { $sum: "$income" },
                        expense: { $sum: "$expense" }
                    }

                    conditionPopulate = {
                        path: '_id.company',
                        select: '_id name sign image',
                        model: 'company'
                    }

                    sortBy = {
                        "_id.company": 1,
                    }
                }

                // Thống kê theo biểu đồ (tháng/năm)
                if(!isNaN(year) && Number(year) > 0){
                    conditionObjYear = {
                        "year": Number(year),
                    }

                    conditionGroup = {
                        _id: { month: "$month", year: "$year" },
                        income: { $sum: "$income" },
                        expense: { $sum: "$expense" },
                        date: { $first: "$date" },
                    }
                }

                let listData = await FIN__CASH_BOOK_COLL.aggregate([
                    {
                        $match: conditionObj
                    },
                    {
                        $project : {
                            year : {$year : "$date"},
                            month : {$month : "$date"},
                            parent: 1,
                            company: 1,
                            account: 1,
                            income: 1,
                            expense: 1,
                            date: 1,
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
                // listData.map(item => console.log({ item }))
                // console.log(conditionObj)

                // Pop lấy thông tin tài khoản
                if(!isNaN(option) && Number(option) > 0){
                    await FIN__CASH_BOOK_COLL.populate(listData, conditionPopulate)
                }
                // console.log(listData)

                return resolve({ error: false, data: listData });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    /**
     * Name: Download Template Excel
     * Author: Hiepnh
     * Date: 25/7/2023
     */
    // downloadTemplateExcel({ option, companyID, parentID, userID }) {
    //     // console.log({ option, companyID, parentID, userID })
    //     return new Promise(async resolve => {
    //         try {

    //             let listItems1 = await ACCOUNT_COLL.find({company: companyID})
    //             .limit(200)
    //             .select('name')
    //             // .populate({
    //             //     path: 'members',
    //             //     select: 'fullname'
    //             // })
    //             // console.log(listItems1)

    //             let listItems2 = await CONTACT_COLL.find({company: companyID})
    //             .limit(200)
    //             .select('name phone taxid')

    //             let listItems3 = await CONTRACT_COLL.find({company: companyID})
    //             .limit(200)
    //             .select('name sign')

    //             /**
    //              * DỮ LIỆU SỔ QUỸ
    //              */
    //             let listData = await FIN__CASH_BOOK_COLL.find({parent: parentID})
    //             .limit(2000)
    //             .select('date name account customer contract income expense note')
    //             .populate({
    //                 path: 'account customer contract',
    //                 select: 'name phone'
    //             })
    //             .sort({date: 1})
    //             // console.log(listData)

    //             // Modify the workbook.
    //             XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/fin_cashbook_import.xlsm')))
    //             .then(async workbook => {
    //                 var i = 3
    //                 listItems1?.forEach((item, index) => {
    //                     workbook.sheet("Export").row(i).cell(1).value(`${item._id}`)
    //                     workbook.sheet("Export").row(i).cell(2).value(`${item.name}`)
    //                     i++
    //                 })

    //                 var i = 3
    //                 listItems2?.forEach((item, index) => {
    //                     workbook.sheet("Export").row(i).cell(3).value(`${item._id}`)
    //                     workbook.sheet("Export").row(i).cell(4).value(`${item.name}_${item?.phone}_${item?.taxid}`)
    //                     i++
    //                 })

    //                 var i = 3
    //                 listItems3?.forEach((item, index) => {
    //                     workbook.sheet("Export").row(i).cell(5).value(`${item._id}`)
    //                     workbook.sheet("Export").row(i).cell(6).value(`${item.name}_${item?.sign}`)
    //                     i++
    //                 })

    //                 var i = 3
    //                 listData?.forEach((item, index) => {
    //                     workbook.sheet("DataImport").row(i).cell(1).value(Number(index+1))
    //                     workbook.sheet("DataImport").row(i).cell(2).value(item.date)
    //                     workbook.sheet("DataImport").row(i).cell(3).value(`${item.name}`)
    //                     workbook.sheet("DataImport").row(i).cell(4).value(`${item?.account?.name}`)
    //                     workbook.sheet("DataImport").row(i).cell(5).value(`${(item?.customer && item?.customer != null) ? item.customer.name : ""}`)
    //                     workbook.sheet("DataImport").row(i).cell(6).value(`${(item?.contract && item?.contract != null) ? item.contract.name : ""}`)
    //                     workbook.sheet("DataImport").row(i).cell(7).value(Number(item.income))
    //                     workbook.sheet("DataImport").row(i).cell(8).value(Number(item.expense))
    //                     workbook.sheet("DataImport").row(i).cell(9).value(`${(item?.note && item?.note != "") ? item?.note : ""}`)
    //                     i++
    //                 })

    //                 const now = new Date();
    //                 const filePath = '../../../files/temporary_uploads/';
    //                 const fileName = `fin_cashbook_import_${now.getTime()}.xlsm`;
    //                 const pathWriteFile = path.resolve(__dirname, filePath, fileName);

    //                 await workbook.toFileAsync(pathWriteFile);
    //                 const result = await uploadFileS3(pathWriteFile, fileName);

    //                 fs.unlinkSync(pathWriteFile);
    //                 return resolve({ error: false, data: result?.Location, status: 200 });
    //             });

    //         } catch (error) {
    //             console.log({ error })
    //             return resolve({ error: true, message: error.message, status: 500 });
    //         }
    //     })
    // }

    downloadTemplateExcel({ option, companyID, parentID, userID }) {
        const that = this
        // console.log({ option, companyID, parentID, userID })
        return new Promise(async resolve => {
            try {
                // //__________Lấy levelMax của các phần tử
                // let levelForRecursive = await _getLevelMaxInRecursiveByCompany(ACCOUNT_COLL, companyID)
                // console.log({levelForRecursive})

                // let arrObjectID = []
                // //__________Khai báo mảng chứa phần tử cha và các con
                // let getListIDRecursiveForAny = (arr) => {
                //     for(const item of arr){
                //         arrObjectID.push(item._id)
                //         // console.log(arrObjectID)

                //         if (Array.isArray(item.childs) && item.childs.length) {
                //             getListIDRecursiveForAny(item.childs)
                //         }
                //     }
                // }

                // let accountID = "64c0ca9af8a43a0011a3435d"

                // //__________Lấy thông tin phần tử kèm theo populate vào bên trong các phần tử con
                // let infoItemOrigin = await ACCOUNT_COLL.findById(accountID)
                // .populate(
                //     _constructForAny(levelForRecursive, 'childs') 
                // )
                // console.log(infoItemOrigin)

                // //__________Gọi hàm đệ quy để lấy mảng nestedArray
                // getListIDRecursiveForAny([infoItemOrigin], levelForRecursive)

                // console.log(arrObjectID)

                /**
                 * NHẬT KÝ CHUNG
                 */
                let listData = await FINANCIAL_GENERAL_JOURNAL_COLL.find({ company: companyID })
                // .select('')
                .populate({
                    path: 'funda contract debit credit customerDebit customerCredit goods warehouse budgetWork',
                    select: 'name'
                })


                /**
                 * DANH SÁCH CÂY TÀI KHOẢN
                 */
                let listAccounts = await ACCOUNT_MODEL.getListRecursive({ companyID })
                let listAppMenuParent = listAccounts.data

                let option = 2

            //    let listDataCombine = await FINANCIAL_GENERAL_JOURNAL_MODEL.getListByProperty({ option, optionAccount, optionTerm, arrAccNames, arrAccIDs, arrCompanyIDs, arrFundaIDs, name, companyID, fundaID, projectID, contractID, contactID, fromDate, toDate, userID })

                // Modify the workbook.
                XlsxPopulate.fromFileAsync(path.resolve(__dirname, ('../../../files/templates/excels/fin_financial_report.xlsm')))
                .then(async workbook => {

                    // NHẬT KÝ CHUNG
                    var i = 4
                    listData.forEach((item, index) =>{
                        workbook.sheet("NhatKyChung").row(i).cell(1).value(Number(index+1))
                        workbook.sheet("NhatKyChung").row(i).cell(2).value(`${item?.funda?.name}`)
                        workbook.sheet("NhatKyChung").row(i).cell(3).value()
                        workbook.sheet("NhatKyChung").row(i).cell(4).value(item.date)
                        workbook.sheet("NhatKyChung").row(i).cell(5).value(item.name)
                        workbook.sheet("NhatKyChung").row(i).cell(6).value(item?.debit?.name)
                        workbook.sheet("NhatKyChung").row(i).cell(7).value(item?.credit?.name)
                        workbook.sheet("NhatKyChung").row(i).cell(8).value(item?.customerDebit?.name)
                        workbook.sheet("NhatKyChung").row(i).cell(9).value(item?.customerCredit?.name)
                        workbook.sheet("NhatKyChung").row(i).cell(10).value(item?.goods?.name)
                        workbook.sheet("NhatKyChung").row(i).cell(11).value(item?.warehouse?.name)
                        workbook.sheet("NhatKyChung").row(i).cell(12).value(item?.contract?.name)
                        workbook.sheet("NhatKyChung").row(i).cell(13).value(item?.goods?.unit)
                        workbook.sheet("NhatKyChung").row(i).cell(14).value(Number(item.quantity))
                        workbook.sheet("NhatKyChung").row(i).cell(15).value(Number(item.unitprice))
                        workbook.sheet("NhatKyChung").row(i).cell(16).value(Number(item.amount))
                        workbook.sheet("NhatKyChung").row(i).cell(17).value(item?.budgetWork?.name)
                        workbook.sheet("NhatKyChung").row(i).cell(18).value(Number(item.updown))
                        workbook.sheet("NhatKyChung").row(i).cell(19).value(item?.note)
                        i++
                    })

                    // BẢNG CÂN ĐỐI TÀI KHOẢN
                    var i = 4
                    let recursive = (arr) => {
                        for(const item of arr){
                            workbook.sheet("BangCDTaiKhoan").row(i).cell(1).value(`${item.name}`)
                            workbook.sheet("BangCDTaiKhoan").row(i).cell(2).value(`${item.description}`)
                            i++
    
                            if (item.childs && item.childs.length) {
                                recursive(item.childs)
                            }
                        }
                    }
                    recursive(listAppMenuParent)

                    const now = new Date();
                    const filePath = '../../../files/temporary_uploads/';
                    const fileName = `fin_financial_report${now.getTime()}.xlsm`;
                    const pathWriteFile = path.resolve(__dirname, filePath, fileName);

                    await workbook.toFileAsync(pathWriteFile);
                    const result = await uploadFileS3(pathWriteFile, fileName);

                    fs.unlinkSync(pathWriteFile);
                    return resolve({ error: false, data: result?.Location, status: 200 });
                });

            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    // /**
    //  * DANH SÁCH CÂY TÀI KHOẢN ĐỆ QUY CỦA CÔNG TY
    //  */
    // getListByCompany({ companyID, status }){
    //     return new Promise(async (resolve) => {
    //         try {
    //             if( !ObjectID.isValid(companyID))
    //                 return resolve({ error: true, message: 'param_not_valid' })

    //             let pathOrigin;
    //             let constructPopulateConfigObj = (level, path) => {
    //                 pathOrigin  = `${path}`
    //                 const oneLevel = () => ({ 
    //                     path: pathOrigin, options: { sort: { 'name': 1 } }
    //                 })
    //                 let obj = oneLevel()

    //                 while (level) {
    //                     if (level !== 1) {
    //                         obj.populate = Object.assign({}, obj)
    //                     }
    //                     obj = Object.assign({}, obj)
    //                     --level
    //                 }
                    
    //                 return obj
    //             }

    //             let levelMax = await ACCOUNT_COLL.aggregate(
    //                 [
    //                     {
    //                         $match: {
    //                             company: ObjectID(companyID)
    //                         }
    //                     },
    //                     {
    //                         $group:
    //                         {
    //                             _id: null,
    //                             maxLevel: { $max: "$level" }
    //                         }
    //                     }
    //                 ]
    //             )
    //             let ObjectQuery = { 
    //                 company: ObjectID(companyID),   
    //                 $or: [
    //                     { parent: { $exists: false} },
    //                     { parent: null }
    //                 ]
    //             }
                
    //             if(status){
    //                 ObjectQuery.status  = Number(status)
    //             }

    //             //_____Lấy các tài khoản cha (có parent = null hoặc không tồn tại)
    //             let listAppMenuParent = await ACCOUNT_COLL.find(ObjectQuery)
    //             .populate(
    //                 constructPopulateConfigObj(Number(levelMax[0].maxLevel), 'childs')
    //             )
    //             .sort({name: 1})

    //             return resolve({ error: false, data: listAppMenuParent, maxLevel: Number(levelMax[0].maxLevel) })
    //         } catch (error) {
    //             return resolve({ error: true, message: error.message })
    //         }
    //     })
    // }

    /**
     * Name: Import Excel
     * Author: Hiepnh
     * Date: 25/7/2023
     */
    importFromExcel({ option, companyID, parentID, dataImport, userID, ctx }) {
        // console.log({option, companyID, parentID, userID})
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(parentID))
                    return resolve({ error: true, message: 'parentID_invalid', status: 400 })

                const dataImportJSON = JSON.parse(dataImport);
                let index = 0;
                let errorNumber = 0;
                
                for (const data of dataImportJSON) {
                    if(index > 0){
                        // console.log('===================')
                        // console.log(data)
                        let dataInsert = {
                            companyID, 
                            userID, 
                            parentID, 
                            accountID: data?.__EMPTY_14,
                            customerID: data?.__EMPTY_15, 
                            contractID: data?.__EMPTY_16, 
                            name: data?.__EMPTY_1,
                            note: data?.__EMPTY_7, 
                            date: data?.__EMPTY_13, 
                            income: data?.__EMPTY_5, 
                            expense: data?.__EMPTY_6
                        }
                        // console.log(dataInsert)

                        let infoAfterInsert = await this.insert(dataInsert);
                        // console.log(infoAfterInsert)
                        if(infoAfterInsert.error){
                            errorNumber++;
                        }
                    }
                    index ++;
                }

                if(errorNumber != 0)
                    return resolve({ error: true, message: "import field" });

                // Update timeImportExcel trick reload việc con
                // await FIN__CASH_BOOK_COLL.findByIdAndUpdate(parentID, { $set: { timeImportExcel: new Date() }}, { new: true });

                return resolve({ error: false, message: "import success" });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;