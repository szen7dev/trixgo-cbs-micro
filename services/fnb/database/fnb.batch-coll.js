"use strict";
/**
 * QUẢN LÝ LÔ SẢN PHẨM
 * - CO, CQ
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("fnb_batch", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    // //_________Đơn vị cơ sở
    // funda: {
    //     type: Schema.Types.ObjectId,
    //     ref : "funda"
    // },
    //_________Phân nhóm sản phẩm
    goods: {
        type: Schema.Types.ObjectId,
        ref : "goods"
    },
    //_________Nơi sản xuất
    name: String,
    //_________Mã hiệu lô
    sign: String,
    // //_________Mã hiệu CO
    // co: String,
    // //_________Mã hiệu CQ
    // cq: String,
    //_________Ngày
    date: { type: Date, default: Date.now },
    //_________Thời hạn
    expired: Date,
    //______Số lượng hàng hóa
    number: {
        type: Number,
        default : 0
    },
    //______Khối lượng hàng hóa
    quantity: {
        type: Number,
        default : 0
    },
    //_________Ghi chú
    note: String,
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