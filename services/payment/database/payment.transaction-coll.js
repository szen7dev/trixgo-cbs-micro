"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("payment_transactions", {
    orderID: {
        type: String,
        require: true,
        trim: true
    },

    // Nội dung thanh toán
    orderDescription: {
        type: String,
        require: true,
        trim: true
    },

    // Loại thanh toán
    orderType: {
        type: String,
    },

    orderData: {
      type: Schema.Types.Mixed,
    },

    customerData: {
      type: Schema.Types.Mixed,
    },

    // số tiền thanh toán
    amount: {
        type: Number,
        require: true,
    },

    currency: {
      type: String,
      default: 'VND',
      enum: {
          values: ['VND', 'USD'],
          message: '{VALUE} is not supported'
      }
    },

    locale: {
        type: String,
        default: 'vi',
        enum: {
            values: ['vi', 'en'],
            message: '{VALUE} is not supported'
        }
    },

    paymentMethod: {
      type: String,
      enum: {
          values: ['WALLET', 'ATM', 'CC', 'QR'],
          message: '{VALUE} is not supported'
      }
    },

    merchantCode: {
      type: String,
      require: true
    },

    ipAddr: String,

    userID: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },

    /**
     * -2. khởi tạo transaction (chưa thanh toán)
     * -1. Order is expired
     * 0. đã thanh toán -> thành công
     * 1. đã thanh toán -> thất bại
     * Những status từ payment service:
     * https://docs.neox.vn/docs/payment-gateway/transaction-management/error-codes
     */
    status: {
        type: Number,
        default: -2
    }
})
