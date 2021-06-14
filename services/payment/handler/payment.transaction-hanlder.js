let PAYMENT__TRANSACTION_MODEL                = require('../model/payment.transaction-model').MODEL;

module.exports = {
    // Thêm cuộc hội thoại mới
    insert: {
        params: {
            orderID         : { type: "string" },
            orderInfo       : { type: "string" },
            amount          : { type: "number" },
            bankCode        : { type: "string" },
            orderType       : { type: "string" },
            locale          : { type: "string" },
            userID          : { type: "string" },
        },
        async handler(ctx) {
            try {
                await this.validateEntity(ctx.params);
                let { orderID, orderInfo, amount, bankCode, orderType, locale, userID }        = ctx.params;
                // let { _id : userID }  = ctx.meta.infoUser; //lấy giá trị gán từ request = ctx.meta (gán tại 2auth gateway.service)

                let infoAfterInsert = await PAYMENT__TRANSACTION_MODEL.insert({ orderID, orderInfo, amount, bankCode, orderType, locale, userID });

                return infoAfterInsert;
            } catch (error) {
                return { error:  true, message: error.message };
            }
        }
    },

    getListTransactionsByUserWithStatus: {
        params: {
            userID  : { type: "string" },
            status  : { type: "string" },
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

    updateStatusTransaction: {
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
}