/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }           = require('../../../tools/utils/status_code');
let AUTH__COMPANY_MODEL                         = require('../model/auth.company-model.js').MODEL;

module.exports = {
    insert: {
        params: {
            status : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { status }        = ctx.params;
                let listTransactions  = await PAYMENT__TRANSACTION_MODEL.getListTransactions({ status });
                return listTransactions;
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },

    updateInfo: {
        params: {
            userID  : { type: "string" },
            status  : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { userID, status }        = ctx.params;

                let listTransactions = await PAYMENT__TRANSACTION_MODEL.getListByUserWithStatus({ userID, status });
                return listTransactions;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    updateStatus: {
        params: {
            transactionID   : { type: "string" },
            status          : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { transactionID, status }        = ctx.params;

                let infoTransactionAfterUpdateStatus = await PAYMENT__TRANSACTION_MODEL.updateStatus({ transactionID, status });
                return infoTransactionAfterUpdateStatus;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    // STEP 1: tạo url payemnt (window và href chuyển sang cổng thanh toán)
    getInfo: {
        params: {
            orderType           : { type: "string" },
            amount              : { type: "string" },
            orderDescription    : { type: "string", optional: true },
            bankCode            : { type: "string", optional: true },
            language            : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { orderType, amount, orderDescription, bankCode, language }        = ctx.params;
                let ipAddr          = ctx.meta.ipAddr;
                let tmnCode         = vnp_TmnCode;
                let secretKey       = vnp_HashSecret;
                let vnpUrl          = vnp_Url;
                let returnUrl       = vnp_ReturnUrl;
                let date            = new Date();

                let createDate      = dateFormat(date, 'yyyymmddHHmmss');
                let orderId         = dateFormat(date, 'HHmmss');
                // let amount       = req.body.amount;
                // let bankCode     = req.body.bankCode;
                let orderInfo       = orderDescription;
                // let orderType    = req.body.orderType;
                let locale          = language || 'vn';

                let currCode        = 'VND';
                let vnp_Params      = {};
                vnp_Params['vnp_Version']   = '2';
                vnp_Params['vnp_Command']   = 'pay';
                vnp_Params['vnp_TmnCode']   = tmnCode;
                // vnp_Params['vnp_Merchant'] = ''
                vnp_Params['vnp_Locale']    = locale;
                vnp_Params['vnp_CurrCode']  = currCode;
                vnp_Params['vnp_TxnRef']    = orderId;
                vnp_Params['vnp_OrderInfo'] = orderInfo;
                vnp_Params['vnp_OrderType'] = orderType;
                vnp_Params['vnp_Amount']    = amount * 100;
                vnp_Params['vnp_ReturnUrl'] = returnUrl;
                vnp_Params['vnp_IpAddr']    = ipAddr;
                vnp_Params['vnp_CreateDate'] = createDate;
                if(bankCode !== null && bankCode !== '')
                    vnp_Params['vnp_BankCode'] = bankCode;
                vnp_Params                  = sortObject(vnp_Params);
                let signData                = secretKey + querystring.stringify(vnp_Params, { encode: false });
                let secureHash              = sha256(signData);
            
                vnp_Params['vnp_SecureHashType']    =  'SHA256';
                vnp_Params['vnp_SecureHash']        = secureHash;
                vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: true });

                /**
                 * DB TRANSACTION
                 */
                let USER_FAKE_ID = '5e60f58cf63b8a4e196a1942';
                let infoTransactionAfterInsert = await PAYMENT__TRANSACTION_MODEL.insert({ orderID: orderId, orderInfo, amount, bankCode, orderType, locale, userID: USER_FAKE_ID, ipAddr });

                return {
                    error: false, data: {
                        url: vnpUrl,
                        infoTransaction: infoTransactionAfterInsert
                    }
                };
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    /**
	 * Dev: Depv ✅
	 * Func: Lấy thông tin hoặc danh sách công ty
	 */
    getInfoAndGetListCompany: {
        auth: "required",
        params: {
            // Field bổ sung
            companyID       : { type: "string", optional: true },
            // Field mặc định
            limit           : { type: "string", optional: true },
            lastestID       : { type: "string", optional: true },
            keyword         : { type: "string", optional: true },
            select          : { type: "string", optional: true },
            filter          : { type: "string", optional: true },
            populates       : { type: "string", optional: true },
            populates1      : { type: "string", optional: true },
            populates2      : { type: "string", optional: true },
            populates3      : { type: "string", optional: true },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { 
                    companyID,
                    keyword, limit, lastestID, select, filter, populates, populates1, populates2, populates3 } = ctx.params;
				const { _id: userID } = ctx.meta.infoUser;

                let resultAfterCallHandler;
                if(companyID){
                    resultAfterCallHandler = await AUTH__COMPANY_MODEL.getInfoV2({
                        companyID, select, populates, populates1, populates2, populates3
                    });
                }else{
                    resultAfterCallHandler = await AUTH__COMPANY_MODEL.getListV2({
                        userID, keyword, limit, lastestID, filter, populates, populates1, populates2, populates3
                    });
                }

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return { error: true, message: error.message };
            }
        }
    },
}