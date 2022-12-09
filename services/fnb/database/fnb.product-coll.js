"use strict";
/**
 * PRODUCT
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("fnb_product", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Đơn vị cơ sở/Cửa hàng
    funda: {
        type: Schema.Types.ObjectId,
        ref : "funda"
    },
    //_________Cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "fnb_product"
    },
    level: {
        type: Number,
        default: 1
    },
    /**
     * THÔNG TIN
     */
    /**
     * Phân loại
     * 1-Thông thường
     * 2-Topping
     */
    type: {
        type: Number,
        default : 1
    },
    //_________Nội dung
    name: String,
    //_________Mã hiệu
    sign: String,
    //_________Đơn vị tính
    unit: String, 
    //_________Ghi chú
    note: String,
    /**
     * GIÁT TRỊ
     */
    //______Khối lượng
    quantity: {
        type: Number,
        default : 0
    },
    //______Đơn giá
    unitPrice: {
        type: Number,
        default : 0
    },
    //______Đơn giá 2
    unitPrice2: {
        type: Number,
        default : 0
    },
    //______Thành tiền
    amount: {
        type: Number,
        default : 0
    },
    //_________Ảnh đại diện
    images: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
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