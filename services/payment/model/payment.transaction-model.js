"use strict";

const BaseModel                                 = require('../../../tools/db/base_model');
const { checkObjectIDs }                        = require('../../../tools/utils/utils');

/**
 * COLLECTIONS
 */
const PAYMENT__TRANSACTION_COLL            			= require('../database/payment.transaction-coll');

class Model extends BaseModel {
    constructor() {
        super(PAYMENT__TRANSACTION_COLL);
    }

    insert({
      merchantCode, orderID, orderCustomer, orderDescription, description,
      amount, currency, locale, userID, ipAddr, txType, status,
    }) {
        return new Promise(async (resolve) => {
            try {
                locale = locale ? locale.toLowerCase() : 'vi';
                currency = currency ? currency.toUpperCase() : 'VND';

                if(!checkObjectIDs(userID)) {
                  return resolve({ error: true, message: 'user_object_id_invalid' });
                }

                const localeAllow = ['en', 'vi'];
                if(!localeAllow.includes(locale)) {
                  return resolve({ error: true, message: 'locale_not_support' });
                }

                const currencyAllow = ['VND', 'USD'];
                if(!currencyAllow.includes(currency)) {
                  return resolve({ error: true, message: 'currency_not_support' });
                }

                const infoAfterInsert = await this.insertData({
                  orderData: {
                   orderID,
                   orderDescription
                  },
                  orderCustomer,
                  description,
                  amount, currency, locale, merchantCode,
                  userID, status, txType, ipAddr
                });

                if(!infoAfterInsert) {
                  return resolve({ error: true, message: 'cannot_insert' });
                }

                return resolve({ error: false, data: infoAfterInsert });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    // Cập nhật trạng thái thành công khi nhận được url return NEOX
    updateStatus({ txID, status, statusMsg }) {
        return new Promise(async resolve => {
            try {
                /**
                 * Chỉ cho phép cập nhật trạng thái
                 * CHƯA THANH TOÁN -> THANH CÔNG/THẤT BẠI
                 */
                const TRANSACTION_WITH_STATUS_WAITING = -2;
                const isExistsTransaction = await PAYMENT__TRANSACTION_COLL.findById(txID);

                if (!isExistsTransaction)
                    return resolve({ error: true, message: 'transaction_not_exists' });

                if (isExistsTransaction.status !== TRANSACTION_WITH_STATUS_WAITING)
                    return resolve({ error: true, message: 'transaction_not_equal_waiting' });

                const infoAfterUpdateStatus = await PAYMENT__TRANSACTION_COLL.findOneAndUpdate(
                  { _id: isExistsTransaction._id },
                  { $set: { status: +status, statusMsg } }
                );

                if (!infoAfterUpdateStatus)
                    return resolve({ error: true, message: 'cannot_update' });

                return resolve({ error: false, message: 'update_success' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        })
    }

    getListByUserWithStatus({ userID, status='all' }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(userID))
                    return resolve({ error: true, message: 'object_invalid' });

                let conditionObj = {
                    user: userID
                };
                if (status != 'all')
                    conditionObj = {
                        ...conditionObj, status: Number(status)
                    }

                let listTransactionsOfUser = await PAYMENT__TRANSACTION_COLL.find(conditionObj).sort({ createAt: -1 });
                if (!listTransactionsOfUser)
                    return resolve({ error: true, message: 'cannot_find_list_transactions_of_user' });

                return resolve({ error: false, data: listTransactionsOfUser });
            } catch (error) {
                return resolve({ error: true, message: message });
            }
        })
    }

    getListTransactions({ status='all' }) {
        return new Promise(async resolve => {
            try {
                let conditionObj = {};
                if (status != 'all')
                    conditionObj = {
                        ...conditionObj, status: Number(status)
                    }
                let listTransactions = await PAYMENT__TRANSACTION_COLL.find(conditionObj).sort({ createAt: -1 })
                    .lean()
                    .populate({
                        path: 'user',
                        select: 'username fullname'
                    });
                if (!listTransactions)
                    return resolve({ error: true, message: 'cannot_find_list_transactions' });

                return resolve({ error: false, data: listTransactions });
            } catch (error) {
                return resolve({ error: true, message: message });
            }
        })
    }

    getInfo({ userID, txID, txType, status }) {
        return new Promise(async resolve => {
            try {
                if(!checkObjectIDs(txID))
                    return resolve({ error: true, message: 'txID invalid' });

                const filters = {
                  _id: txID,
                  userID,
                };

                if(txType) {
                  filters['txType'] = txType;
                }

                if(status) {
                  filters['status'] = status;
                }

                const transaction = await PAYMENT__TRANSACTION_COLL
                  .findOne(filters)
                  .lean();

                if (!transaction)
                    return resolve({ error: true, message: 'Transaction not found' });

                return resolve({ error: false, data: transaction });
            } catch (error) {
                return resolve({ error: true, message: message });
            }
        })
    }
}

exports.MODEL = new Model;
