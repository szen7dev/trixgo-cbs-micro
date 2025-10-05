"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("crm_point_transaction", {
    //________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    /**
     * Phân loại
     * 1. Mua hàng
     * 2. Tham gia khảo sát
     * 3. Redeem
     */
    type: {
        type: Number,
        default: 1
    },
    //_________Mã khách
    contact: {
        type: Schema.Types.ObjectId,
        ref : "contact"
    },
    //________Điện thoại (lấy từ mã khách)
    phone: String,
    //_________Đơn hàng tham chiếu
    order: {
        type: Schema.Types.ObjectId,
        ref : "store_order"
    },
    //_________Voucher đổi điểm
    voucher: {
        type: Schema.Types.ObjectId,
        ref : "store_voucher"
    },
    /**
     * Hướng
     * 1-Tích điểm
     * 2-Sử dụng
     */
    direction: {
        type: Number,
        default: 1
    },
    // Số điểm
    points: {
        type: Number,
        default: 0
    },
    //_________Thời hạn sử dụng
    expired: Date,
    //________Trạng thái (1-Chưa sử dụng |2-Đã sử dụng)
    status: {
        type: Number,
        default: 1
    },
    //________Ghi chú
    note: String,
    userCreate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    }
})