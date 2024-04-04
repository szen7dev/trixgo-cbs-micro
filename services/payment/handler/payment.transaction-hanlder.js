const dateFormat                                  = require('dateformat');
const querystring                                 = require('qs');
const sha256                                      = require('sha256');
const uuidv4                                      = require('uuid').v4;
const crypto                                      = require('crypto');

const PAYMENT__TRANSACTION_MODEL                  = require('../model/payment.transaction-model').MODEL;
const {
  neo_MarchantCode,
  neo_SecretKey,
  neo_Url,
  neo_ReturnUrl
} = require('../helper/payment.keys-constant');

const { sortNeoParams }                           = require('../../../tools/utils/utils');
const httpRequest                                 = require('../../../tools/http');

module.exports = {
    getListTransactions: {
        params: {
            status: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { status } = ctx.params;

                const listTransactions = await PAYMENT__TRANSACTION_MODEL.getListTransactions({ status });
                return listTransactions;
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    getListTransactionsByUser: {
        params: {
            userID: { type: "string" },
            status: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { userID, status } = ctx.params;

                const listTransactions = await PAYMENT__TRANSACTION_MODEL.getListByUserWithStatus({
                  userID, status
                });
                return listTransactions;
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    updateStatusTransaction: {
        params: {
            transactionID   : { type: "string" },
            status          : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { transactionID, status } = ctx.params;

                const infoTransactionAfterUpdateStatus = await PAYMENT__TRANSACTION_MODEL.updateStatus({ transactionID, status });
                return infoTransactionAfterUpdateStatus;
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    // STEP 1: tạo url payemnt từ neox
    createURLPayment: {
        params: {
            orderDescription    : { type: "string", max: 256, min: 3 },
            amount              : { type: "number", positive: true, integer: true },
            orderdata           : { type: "object", optional: true },
            currency            : { type: "string", optional: true },
            locale              : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);

                const { ipAddr, infoUser } = ctx.meta;
                const { orderDescription, amount, currency, locale } = ctx.params;
                const userID = infoUser._id;
                const orderID = dateFormat(new Date(), 'HHmmss');
                // const orderID = uuidv4();

                const transaction = await PAYMENT__TRANSACTION_MODEL.insert({
                  merchantCode: neo_MarchantCode,
                  orderID, orderDescription,
                  amount, currency, locale, userID, ipAddr
                })

                if(transaction.error) {
                  return transaction;
                }

                const tx = transaction.data;
                const neoParams = {
                  "neo_Amount": tx.amount,
                  "neo_Command": "PAY",
                  "neo_Currency": tx.currency,
                  "neo_Locale": tx.locale,
                  "neo_MerchantCode": neo_MarchantCode,
                  "neo_MerchantTxnID": tx._id.toString(),
                  "neo_OrderID": tx.orderID,
                  "neo_OrderInfo": tx.orderDescription,
                  "neo_PaymentMethod": ["WALLET","ATM","CC","QR"],
                  "neo_ReturnURL": neo_ReturnUrl,
                  "neo_Title": "Payment",
                  "neo_Version": "1",
                }

                const neoParamsString = sortNeoParams({ ...neoParams }, neo_SecretKey);
                const secureHash = crypto.createHash('sha256').update(neoParamsString).digest('hex');
                neoParams['neo_SecureHash'] = secureHash;

                const neoxResponse = await httpRequest.post(neo_Url, neoParams, {
                  headers: {
                    'Accept-Language': 'en'
                  }
                })

                if(neoxResponse.status !== 200 || neoxResponse.statusText !== 'OK') {
                    return resolve({ error: true, message: "Can't request to payment service" });
                }

                return {
                  error: false,
                  data: neoxResponse.data
                };
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    // STEP 2.1: url trả về từ payment return url nếu thanh toán thành công/thất bại
    URL_RETURN: {
        params: {
          neo_MerchantCode: { type: "string" },
          neo_Currency: { type: "string" },
          neo_Locale: { type: "string" },
          neo_Version: { type: "string" },
          neo_Command: { type: "string" },
          neo_Amount: { type: "string" },
          neo_MerchantTxnID: { type: "string" },
          neo_OrderID: { type: "string" },
          neo_OrderInfo: { type: "string" },
          neo_TransactionID: { type: "string" },
          neo_SecureHash: { type: "string" },
        },
        async handler(ctx) {
            try {
                const params = ctx.params;
                console.log({ params })
                await this.validateEntity(ctx.params);
                // params: {
                //     neo_MerchantCode: 'XASUKU',
                //     neo_Currency: 'VND',
                //     neo_Locale: 'vi',
                //     neo_Version: '1',
                //     neo_Command: 'PAY',
                //     neo_Amount: '100000',
                //     neo_MerchantTxnID: '660a8fcc0efba67698fd7984',
                //     neo_OrderID: '170424',
                //     neo_OrderInfo: 'Thanh toán với neox',
                //     neo_TransactionID: '15947',
                //     neo_ResponseCode: '0',
                //     neo_ResponseMsg: 'Success',
                //     neo_ResponseData: '',
                //     neo_HoldingStep: 'null',
                //     neo_SecureHash: '253B41EBBD0DFA85946ACEDBED0B58773F36A7AB43474230893DD966A0DE625F',
                //     resp: ''
                //   }
                const {
                  neo_ResponseMsg,
                  neo_ResponseCode,
                  neo_Amount,
                  neo_Command,
                  neo_Currency,
                  neo_Locale,
                  neo_MerchantCode: merchantCode,
                  neo_MerchantTxnID,
                  neo_OrderID,
                  neo_OrderInfo,
                  neo_Title,
                  neo_SecureHash,
                  neo_Version,
                } = ctx.params;

                const neoParams = {
                  "neo_Amount": neo_Amount,
                  "neo_Command": neo_Command,
                  "neo_Currency": neo_Currency,
                  "neo_Locale": neo_Locale,
                  "neo_MerchantCode": merchantCode,
                  "neo_MerchantTxnID": neo_MerchantTxnID,
                  "neo_OrderID": neo_OrderID,
                  "neo_OrderInfo": neo_OrderInfo,
                  "neo_PaymentMethod": ["WALLET","ATM","CC","QR"],
                  "neo_ReturnURL": neo_ReturnUrl,
                  "neo_Title": neo_Title,
                  "neo_Version": neo_Version,
                }

                const neoParamsString = sortNeoParams({ ...neoParams }, neo_SecretKey);
                const secureHash = crypto.createHash('sha256').update(neoParamsString).digest('hex');
                console.log({ secureHash, neo_SecureHash })

                if(neo_SecureHash !== secureHash) {
                  return { error: true, message: `Transaction invalid` };
                }

                if (neo_ResponseMsg !== 'Success' || neo_ResponseCode !== '0') {
                  return { error: true, message: `Transaction Failed` };
                }

                const txUpdateStatus = await PAYMENT__TRANSACTION_MODEL.updateStatus({
                  txID: neo_MerchantTxnID, orderID: neo_OrderID, status: neo_ResponseCode
                });
                console.log({ txUpdateStatus })

                // TODO:
                // - Check secure hash ✅
                // - Check transaction status ✅
                // - Update transaction status ✅

                return txUpdateStatus;
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    // STEP 2.2: url ipn là từ server PAYMENT gọi vào server CBS (server-call-server)
    URL_IPN: {
        params: {
            neo_SecureHash: { type: "string" },
        },
        async handler(ctx) {
            try {
                const params = ctx.params;
                console.log({ params })
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    }
}
