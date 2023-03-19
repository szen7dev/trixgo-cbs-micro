"use strict";
/**
 * VOUCHER-MÃ GIẢM GIÁ
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("fnb_voucher", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Người giới thiệu (nếu có)
    referrer: {
        type: Schema.Types.ObjectId,
        ref : 'contact' 
    },
    //_________Dành cho khách hàng
    customer: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    //_________Mã hiệu voucher
    suid : {
        type   : String,
        require:  true,
        unique : true
    },
    //_________Nội dung
    name: String,
    //_________Ghi chú đặc tính
    note: String,
    //_________Giá trị đơn hàng tối thiểu
    minOrderAmount: {
        type: Number,
        default: 0
    },  
    //______Giá trị giảm giá
    salesoffAmount: {
        type: Number,
        default : 0
    },
    //______Tỷ lệ giảm giá (%)
    salesoffRate: {
        type: Number,
        default : 0
    },
    //_________Thời hạn Voucher
    expired: Date,
    /**
     * Trạng thái đơn
     * 1-Đang mở
     * 2-Đã hết hạn
     */
    status: {
        type: Number,
        default: 1
    },
    /**
     * THÔNG TIN NGƯỜI TẠO/CẬP NHẬT
     */
    userCreate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    }
})