"use strict";

/**
 * EXTERNAL PACKAGE
 */
const ObjectID = require('mongoose').Types.ObjectId;

/**
 * CONSTANTS
 */
const { CF_DOMAIN_SERVICES } 		    = require('../../gateway/helper/domain.constant')
const { CF_ACTIONS_AUTH } 		        = require('../../auth/helper/auth.actions-constant')
const { VOUCHER_TYPES }                 = require('../config/accounting.financial_config')

/**
 * TOOLS
 */
const BaseModel                             = require('../../../tools/db/base_model')
const { checkObjectIDs, IsJsonString }      = require('../../../tools/utils/utils')
const { RANGE_BASE_PAGINATION_V2 }          = require('../../../tools/cursor_base/playground/index')
const { KEY_ERROR }                         = require('../../../tools/keys/index')

/**
 * COLLECTIONS
 */
const FUNDA_COLL                                   = require('../../item/database/item.funda-coll'); // Kiểm tra fix lại, không Import trực tiếp
const ACCOUNTING__FINANCIAL_VOUCHER_COLL           = require('../database/accounting.financial_voucher-coll')
const ACCOUNTING__FINANCIAL_GENERAL_JOURNAL_COLL   = require('../database/accounting.financial_general_journal-coll')

/**
 * MODELS
 */
class Model extends BaseModel {
    constructor() {
        super(ACCOUNTING__FINANCIAL_VOUCHER_COLL);
    }

    /**
     * Name: Insert 
     * Author: Hiepnh
     * Date: 30/4/2022
     */
    insert({ 
        authorID, 
        companyID, 
        fundaID, 
        customerID,
        contractID, 
        storageID, 
        projectID,
        type, date, name, sign, signInvoice, dateInvoice, vat,
        receiver, note,
        forward, forwardIs, returning, advancePayment, cancel, 
        fcuExRate, 
        selectedJournals,
        ctx
     }) {
        //  console.log({authorID, 
        //     companyID, 
        //     fundaID, 
        //     customerID,
        //     contractID, 
        //     storageID, 
        //     projectID,
        //     type, date, name, sign, signInvoice, dateInvoice, vat,
        //     receiver, note,
        //     forward, forwardIs, returning, advancePayment, cancel, 
        //     fcuExRate})
        const that = this
        return new Promise(async (resolve) => {
            try {
                /**
                 * BA-Author: HiepNH - 23/4/2022
                 * 1. Khi thêm phiếu có gán budgetWorkID => Cập nhật Ngân sách thực hiện cho work, group, item, budget
                 * 2. Khi sửa bút toán budgetWorkID => Cập nhật Ngân sách thực hiện cho work, group, item, budget của:
                 * +++budgetWorkID cũ
                 * +++budgetWorkID mới
                */

                //_________Kiểm tra dữ liệu đầu vào
                if(!date || !name || Number.isNaN(Number(type)) ||!checkObjectIDs(authorID) || !checkObjectIDs(fundaID) || !checkObjectIDs(customerID) || !checkObjectIDs(companyID))
                    return resolve({ error: true, message: 'date|name|type|authorID|customerID|companyID invalid', keyError: KEY_ERROR.PARAMS_INVALID, status: 400 })

                /**
                 * TỰ ĐỘNG GHI SỐ HIỆU PHIẾU
                 */
                //_________Lấy số lượng phiếu hiện tại của công ty/đơn vị cơ sở
                let number          = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.count({ funda: fundaID, type: type })
                let infoFunda       = await FUNDA_COLL.findById(fundaID)

                let voucherSign = `${infoFunda.sign}.${VOUCHER_TYPES[Number(type)-1].sign}${Number(number+1)}`
                if(sign && sign != ""){
                    // Kiểm tra xem đã tồn tại mã hiệu đó hay chưa
                    let infoVoucher = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findOne({
                        funda: fundaID, 
                        sign: sign
                    }).select('_id')

                    if(!infoVoucher){
                        voucherSign = sign
                    }
                }

                /**
                 * THỰC HIỆN INSERT PHIẾU
                 */
                 const dataInsertVoucher = {
                    userCreate: authorID, 
                    company: companyID, 
                    funda: fundaID, 
                    customer: customerID,
                    modifyAt: Date.now(),
                    type, date, name, sign, signInvoice, dateInvoice, vat,
                    receiver, note,
                    forward, forwardIs, returning, advancePayment, cancel, 
                    fcuExRate, 
                    selectedJournals
                }

                if (checkObjectIDs(contractID)) {
                    dataInsert.contract = contractID;
                }

                if (checkObjectIDs(storageID)) {
                    dataInsert.storage = storageID;
                }

                if (checkObjectIDs(projectID)) {
                    dataInsert.project = projectID;
                }

                console.log('=======data')
                console.log(dataInsertVoucher)

                const infoAfterInsert = await this.insertData(dataInsertVoucher)
                if (!infoAfterInsert)
                    return resolve({ error: true, message: "Thêm thất bại", keyError: KEY_ERROR.INSERT_FAILED, status: 403 })

                /**
                 * CẬP NHẬT BÚT TOÁN VÀO PHIẾU
                 */

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
    update({ cashBookID, accountID, customerID, contractID, name, sign, note, date, income, expense, active, userID }) {
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

                let infoAfterUpdate = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findByIdAndUpdate(cashBookID, dataUpdate, { new: true });
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

                let infoContractIPC = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findById(cashBookID)
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
    getList({ outin, userID, companyID, accountID, customerID, contractID, parentID,
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
                if (checkObjectIDs(parentID)) {
                    conditionObj.parent = parentID

                    if (checkObjectIDs(accountID)) {
                        conditionObj.account = accountID
                    }
                } else {
                    conditionObj = { members: { $in: [userID] } }  // Lấy theo công ty
                    conditionObj.company = companyID
                    conditionObj.parent = { $exists: false } // Lấy theo công ty
                }

                // Lấy dòng tiền vào ra (có giá trị income > 0)
                if(Number(outin) === 1){
                    conditionObj.income = { $gt: 0 }
                }

                // Lấy dòng tiền vào ra (có giá trị income > 0)
                if(Number(outin) === 2){
                    conditionObj.expense = { $gt: 0 }
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
                    let infoData = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.findById(lastestID);
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

                let infoDataAfterGet = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.find(conditionObj)
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

                let totalRecord = await ACCOUNTING__FINANCIAL_VOUCHER_COLL.count(conditionObjOrg);
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