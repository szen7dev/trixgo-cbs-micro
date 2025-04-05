const dateFormat                                  = require('dateformat');
const uuidv4                                      = require('uuid').v4;
const crypto                                      = require('crypto');
const XlsxPopulate                                = require('xlsx-populate');
const path                                        = require('path');

const { CF_DOMAIN_SERVICES } 		                  = require('../../gateway/helper/domain.constant');
const { CF_ACTIONS_PAYMENT } 	                    = require('../helper/payment.actions-constant');
const PAYMENT__TRANSACTION_MODEL                  = require('../model/payment.transaction-model').MODEL;
const {
  neo_MarchantCode,
  neo_SecretKey,
  neo_OApiUrl,
  neo_ClientId,
  neo_ClientSecret,
  neo_Url,
  neo_ReturnUrl,
  client_Url_Payment_Success,
  client_Url_Payment_Failed,
} = require('../helper/payment.keys-constant');

/**
 * TOOLS
 */
const { redirectToUrl }                           = require('../../../tools/utils/status_code');
const { sortNeoParams }                           = require('../../../tools/utils/utils');
const { nonAccentVietnamese }                     = require('../../../tools/utils/string_utils');
const httpRequest                                 = require('../../../tools/http');

module.exports = {
    getInfoTransaction: {
        params: {
            transactionID: { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                const { transactionID } = ctx.params;

                const tx = await PAYMENT__TRANSACTION_MODEL.getTransactionById({ txId: transactionID });
                return tx;
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

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
            orderID             : { type: "string" },
            orderDescription    : { type: "string", max: 256, min: 3 },
            amount              : { type: "number", positive: true, integer: true },
            orderdata           : { type: "object", optional: true },
            currency            : { type: "string", optional: true },
            locale              : { type: "string", optional: true },
            userID              : { type: "string", optional: true },
            callbackURL         : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);

                const { ipAddr, infoUser } = ctx.meta;
                const { orderID, orderDescription, currency, locale, callbackURL, userID } = ctx.params;
                let authorID = "";
                const amount = 10_000;
                // const orderID = dateFormat(new Date(), 'HHmmss');

                if(!infoUser) {
                  authorID = userID;
                } else {
                  authorID = infoUser._id;
                }

                const txType = 'order_payment';
                const transaction = await PAYMENT__TRANSACTION_MODEL.insert({
                  merchantCode: neo_MarchantCode,
                  orderID, orderDescription,
                  amount, currency, locale, userID: authorID, ipAddr, txType, status: -2
                })

                if(transaction.error) {
                  return transaction;
                }

                const tx = transaction.data;
                const neoParams = {
                  "neo_Amount": `${tx.amount}`,
                  "neo_Command": "PAY",
                  "neo_Currency": tx.currency,
                  "neo_Locale": tx.locale,
                  "neo_MerchantCode": neo_MarchantCode,
                  "neo_MerchantTxnID": tx._id.toString(),
                  "neo_OrderID": orderID,
                  "neo_OrderInfo": orderDescription,
                  // "neo_PaymentMethod": ["WALLET","ATM","CC","QR"],
                  "neo_PaymentMethod": ["QR"],
                  "neo_ReturnURL": callbackURL || neo_ReturnUrl,
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
                  data: {
                    ...neoxResponse.data,
                    txId: tx._id.toString()
                  }
                };
            } catch (error) {
              console.error({ error })
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
                await this.validateEntity(ctx.params);
                const params = ctx.params;

                const {
                  neo_SecureHash,
                  neo_ResponseMsg,
                  neo_ResponseCode,
                  neo_MerchantTxnID,
                  neo_OrderID,
                } = ctx.params;

                delete params['resp'];
                const neoParamsString = sortNeoParams({ ...params }, neo_SecretKey);
                const secureHash = crypto.createHash('sha256').update(neoParamsString).digest('hex').toUpperCase();

                if (neo_SecureHash !== secureHash) {
                  return redirectToUrl({
                    ctx,
                    query: { err: true, msg: 'Transaction invalid' },
                    url: client_Url_Payment_Failed
                  })
                }

                if (neo_ResponseMsg !== 'Success' || neo_ResponseCode !== '0') {
                  return redirectToUrl({
                    ctx,
                    query: { err: true, msg: neo_ResponseCode },
                    url: client_Url_Payment_Failed
                  })
                }

                // TODO:
                // - Check secure hash ✅
                // - Check transaction status ✅
                // - Redirect to success page (FE) ✅

                return redirectToUrl({
                  ctx,
                  query: {
                    err: false,
                    msg: 'Payment Success',
                    orderID: neo_OrderID,
                    txID: neo_MerchantTxnID,
                  },
                  url: client_Url_Payment_Success
                })
            } catch (error) {
                return redirectToUrl({
                  ctx,
                  query: {
                    err: true,
                    msg: error.message
                  },
                  url: `${client_Url}/payment-error`
                })
            }
        }
    },

    // STEP 2.2: url ipn là từ server PAYMENT gọi vào server CBS (server-call-server)
    URL_IPN: {
        params: {
            neo_MerchantTxnID: { type: "string" },
            neo_OrderID: { type: "string", optional: true },
            neo_SecureHash: { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
              console.log({ URL_IPN_PARAMS: ctx.params })
                await this.validateEntity(ctx.params);
                const params = ctx.params;

                const {
                  neo_SecureHash,
                  neo_ResponseMsg,
                  neo_ResponseCode,
                  neo_MerchantTxnID,
                  neo_PaymentMethod,
                } = ctx.params;

                const tx = await PAYMENT__TRANSACTION_MODEL.getTransactionById({ txId: neo_MerchantTxnID });

                // Logic for polling IPN event
                if (!tx.error && tx.data) {
                  const { status, statusMsg } = tx.data;

                  if (status !== -2) {
                    return { respcode: status, respmsg: statusMsg };
                  }
                }

                delete params['neo_TransAmount'];
                delete params['neo_ExtData'];
                delete params['neo_SecureHash'];

                if (typeof neo_PaymentMethod === "string" && neo_PaymentMethod === "BANK_TRANSFER") {

                } else {
                  const neoParamsString = sortNeoParams({ ...params }, neo_SecretKey);
                  const secureHash = crypto.createHash('sha256').update(neoParamsString).digest('hex').toUpperCase();

                  if(neo_SecureHash !== secureHash) {
                    return { respcode: 0, respmsg: "received" };
                  }
                }

                await PAYMENT__TRANSACTION_MODEL.updateStatus({
                  txID: neo_MerchantTxnID,
                  status: neo_ResponseCode, statusMsg: neo_ResponseMsg,
                });

                return { respcode: 0, respmsg: "received" };
            } catch (error) {
              console.error({ error })
              return { respcode: 1, respmsg: error.message };
            }
        }
    },

    requestAccessToken: {
      params: {
        scope: { type: 'string' }
      },
      async handler(ctx) {
        try {
          await this.validateEntity(ctx.params);
          const cacher = this.broker.cacher;
          const { scope } = ctx.params;

          /**
            * Get access token from cache, if not
            * Request token from payment service
            * Cache access token in 1 hour
            */
          let token = await cacher.get(`NEOX:token`);

          if (token) {
            return { token };
          }

          const payload = {
            "client_id": neo_ClientId,
            "client_secret": neo_ClientSecret,
            "scope": scope, // "disbursement",
            "grant_type": "client_credentials"
          };

          const neoxResponse = await httpRequest.post(`${neo_OApiUrl}/auth/oauth2/token`, payload);

          if(neoxResponse.status !== 200 || neoxResponse.statusText !== 'OK') {
              return { error: true, message: "Can't request to neox service" };
          }

          const { access_token, expires_in } = neoxResponse.data;

          await cacher.set(`NEOX:token`, access_token, expires_in);

          return { token: access_token };
        } catch(error) {
          return { error: true, message: error.message }
        }
      }
    },

    inquiryBankAccount: {
      params: {
        bankAccountNumber: { type: "string" },
        bankSwiftCode: { type: "string" },
        accountType: { type: "string", default: 'ACCOUNT' },
      },
      async handler(ctx) {
        try {
          await this.validateEntity(ctx.params);
          const { bankAccountNumber, bankSwiftCode, accountType } = ctx.params;

          const tokenResponse = await ctx.call(
            `${CF_DOMAIN_SERVICES.PAYMENT}.${CF_ACTIONS_PAYMENT.GET_ACCESS_TOKEN}`,
            { scope: 'disbursement' }
          );

          if(tokenResponse.error) {
            return tokenResponse;
          }

          const query = {
            accountNumber: bankAccountNumber,
            swiftCode: bankSwiftCode,
            accountType,
          };

          const searchParams = new URLSearchParams(query);
          const queryString = searchParams.toString();

          const neoxResponse = await httpRequest.get(`${neo_OApiUrl}/dib/bank/accountInquiry?${queryString}`, {
            headers: {
              'Authorization': `Bearer ${tokenResponse.token}`
            }
          });

          if(neoxResponse.status !== 200 || neoxResponse.statusText !== 'OK') {
              return { error: true, message: "Can't request to neox service" };
          }

          const { data: bankAccount, message, code } = neoxResponse.data;

          if(!bankAccount?.fullName || code !== 1) {
            return { error: true, message: message || "Account number not exists" };
          }

          return { error: false, message, code };
        } catch(error) {
          return { error: true, message: error.message }
        }
      }
    },

    disbursementRequest: {
      params: {
          amount: { type: "number" },
          bankAccountName: { type: "string" },
          bankAccountNumber: { type: "string" },
          bankSwiftCode: { type: "string" },
          description: { type: "string" },
      },
      async handler(ctx) {
        try {
            await this.validateEntity(ctx.params);
            const params = ctx.params;
            const { ipAddr, infoUser } = ctx.meta;
            const userID = infoUser._id;

            // Get access token
            const tokenResponse = await ctx.call(
              `${CF_DOMAIN_SERVICES.PAYMENT}.${CF_ACTIONS_PAYMENT.GET_ACCESS_TOKEN}`,
              { scope: 'disbursement' }
            );
            if(tokenResponse.error) {
              return tokenResponse;
            }

            // Inquiry bank account
            const checkInquiryAccount = await ctx.call(
              `${CF_DOMAIN_SERVICES.PAYMENT}.${CF_ACTIONS_PAYMENT.INQUIRY_BANK_ACCOUNT}`,
              {
                "bankAccountNumber": params.bankAccountNumber,
                "bankSwiftCode": params.bankSwiftCode,
              }
            );
            if(checkInquiryAccount.error) {
              return checkInquiryAccount;
            }

            const txType = 'disbursement_request';
            const transaction = await PAYMENT__TRANSACTION_MODEL.insert({
              merchantCode: neo_MarchantCode,
              customerData: {
                userID,
                bankAccountName: params.bankAccountName,
                bankAccountNumber: params.bankAccountNumber,
                bankSwiftCode: params.bankSwiftCode,
              },
              description: nonAccentVietnamese(params.description),
              amount: params.amount,
              userID, ipAddr, txType, status: -2
            })

            return transaction;
        } catch (error) {
            return { error: true, message: error.message };
        }
      }
    },

    disbursementConfirm: {
      params: {
          txID: { type: "string" },
          userID: { type: "string" },
          isConfirm: { type: "boolean" },
      },
      async handler(ctx) {
        try {
            await this.validateEntity(ctx.params);
            const { txID, userID, isConfirm } = ctx.params;
            console.log({ params: ctx.params });

            const tx = await PAYMENT__TRANSACTION_MODEL.getInfo({
              txID,
              userID,
              txType: 'disbursement_request',
              status: -2
            });

            if(tx.error) {
              return tx;
            }

            if(!isConfirm) {
              return { message: 'request disbursement rejected!' }
            }

            // Get access token
            const tokenResponse = await ctx.call(
              `${CF_DOMAIN_SERVICES.PAYMENT}.${CF_ACTIONS_PAYMENT.GET_ACCESS_TOKEN}`,
              { scope: 'disbursement' }
            );
            if(tokenResponse.error) {
              return tokenResponse;
            }

            const { bankAccountName, bankAccountNumber, bankSwiftCode } = tx.customerData;
            const payload = {
              "requestId": uuidv4(),
              "transactions": [
                {
                  "amount": tx.amount,
                  "bankAccountName": bankAccountName,
                  "bankAccountNumber": bankAccountNumber,
                  "bankSwiftCode": bankSwiftCode,
                  "description": tx.description,
                  "requestTransId": uuidv4()
                }
              ]
            };

            const neoxResponse = await httpRequest.post(`${neo_OApiUrl}/dib/disbursementRequests`, payload, {
              headers: {
                'Authorization': `Bearer ${tokenResponse.token}`
              }
            });

            if(neoxResponse.status !== 200 || neoxResponse.statusText !== 'OK') {
              return { error: true, message: "Can't request to neox service" };
            }

            return neoxResponse.data;
        } catch (error) {
            return { error: true, message: error.message };
        }
      }
    },

    getListBanks: {
      async handler() {
        return new Promise(async resolve => {
          try {
            const cacher = this.broker.cacher;
            const listBanks = await cacher.get(`NEOX:banks`);

            if (listBanks) {
              return resolve({ data: listBanks, error: false });
            }

            const pathFile = path.resolve(__dirname, ('../../../files/templates/excels/template_ycch.xlsx'));

            XlsxPopulate.fromFileAsync(pathFile)
              .then(async workbook => {
                const values = workbook.sheet("List Bank").usedRange().value()

                values.shift();
                const banks = values.map(value => {
                  return {
                    bankName: value[1],
                    swiftCode: value[2],
                    bankShortName: value[3],
                  }
                })

                if(banks.length) {
                  await cacher.set(`NEOX:banks`, banks, 3600);
                }

                return resolve({ data: banks, error: false });
              });
          } catch (error) {
              return resolve({ error: true, message: error.message });
          }
        })
      }
    }

    // end
}
