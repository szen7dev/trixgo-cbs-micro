"use strict";
/**
 * VOUCHER-MÃ GIẢM GIÁ
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("store_voucher", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    /**
     * Phân loại
     * 1-Thông thường/các dịp lễ tết
     * 2-Tặng người giới thiệu
     * 3-Tặng người nhận giới thiệu
     * 4-Tổ chức các sự kiện
     * 5-Tặng cho nhân viên, cán bộ
     * 6-Tri ân đối tác
     */
    type: {
        type: Number,
        default: 1
    }, 
    //_________Nội dung
    name: String,
    //_________Mã hiệu
    sign: String,
    //_________Ghi chú đặc tính
    note: String,
    //_________Người nhận
    receivers: [{
        type: Schema.Types.ObjectId,
        ref: "contact"
    }],
    //_________Người sử dụng
    buyers: [{
        type: Schema.Types.ObjectId,
        ref: "contact"
    }],
    //_________Giá trị đơn hàng tối thiểu để được áp dụng voucher
    minOrderAmount: {
        type: Number,
        default: 0
    },  
    //______Giá trị giảm giá của voucher/amount đơn hàng
    salesoffAmount: {
        type: Number,
        default : 0
    },
    //______Tỷ lệ giảm giá (%)/amount đơn hàng
    salesoffRate: {
        type: Number,
        default : 0
    },
    //_________Thời hạn sử dụng Voucher
    expired: Date,
    //_________Thành viên truy cập
    members: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    //_________Lịch sử thay đổi
    history: String,
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