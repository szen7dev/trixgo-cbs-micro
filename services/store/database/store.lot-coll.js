"use strict";
/**
 * QUẢN LÝ SỐ LÔ
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("store_lot", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Đơn vị cơ sở
    funda: {
        type: Schema.Types.ObjectId,
        ref : "funda"
    },
    //_________Hồ sơ
    document: {
        type: Schema.Types.ObjectId,
        ref : "document_doc"
    },   
    //_________Ngày
    date: { type: Date, default: Date.now },
    //_________Thời hạn
    expired: Date,
    //_________Nội dung
    name: String,
    namecv: String,
    //_________Mã hiệu
    sign: String,
    //_________Ghi chú
    note: String,
    //_________Số lượng sản phẩm
    total: { type: Number, default: 0 },
    //_________Số lượng còn lại
    remaining : { type: Number, default: 0 },
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