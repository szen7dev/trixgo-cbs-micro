"use strict";

const PAYMENT__TRANSACTION_COLL                 = require('../database/payment.transaction-coll');
const AUTH__USER_COLL                           = require('../../auth/database/auth.user-coll');

const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs }                        = require('../../../tools/utils/utils');
const { RANGE_BASE_PAGINATION }                 = require('../../../tools/cursor_base/playground/index');

class Model extends BaseModel {
    constructor() {
        super(require('../database/payment.transaction-coll'));
    }

    // tạo order transaction ngay lập tức khi user chọn thông tin thanh toán ngay màn hình CBS
    insert({ orderID, orderInfo, amount, bankCode, orderType, locale, userID, status=0 }) {
        //orderID: là ID random, ko phải là OBJECTID
        const that = this;
        return new Promise(async (resolve) => {
            try {
                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'invalid_object_id' });

                let infoAfterInsert = await that.insertData({ orderID, orderInfo, amount, bankCode, orderType, locale, user: userID, status });

                if(!infoAfterInsert)
                    return resolve({ error: true, message: 'cannot_insert' });
                
                return resolve({ error: false, data: infoAfterInsert});
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    // cập nhật trạng thái thành công khi nhận được url return VNPAY
    updateStatus({ transactionID, status }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(transactionID))
                    return resolve({ error: true, message: 'invalid_object_id' });

                let isExistsTransaction = await PAYMENT__TRANSACTION_COLL.findById(transactionID);
                if (!isExistsTransaction)
                    return resolve({ error: true, message: 'transaction_not_exists' });

                let infoAfterUpdateStatus = await PAYMENT__TRANSACTION_COLL.findByIdAndUpdate(transactionID, {
                    status: +status
                }, { new: true });
                if (!infoAfterUpdateStatus)
                    return resolve({ error: true, message: 'cannot_update' });

                return resolve({ error: false, data: infoAfterUpdateStatus });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getListByUserWithStatus({ userID, status=1 }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'invalid_object_id' });
                if(Number.isNaN(Number(status)))
                    return resolve({ error: true, message: 'status_invalid' });
                
                let listTransactionsOfUser = await PAYMENT__TRANSACTION_COLL.find({
                    user: userID,
                    status: status
                });
                if (!listTransactionsOfUser)
                    return resolve({ error: true, message: 'cannot_find_list_transactions_of_user' });

                return resolve({ error: false, data: listTransactionsOfUser });
            } catch (error) {
                return resolve({ error: true, message: message });
            }
        })
    }

}

exports.MODEL = new Model;