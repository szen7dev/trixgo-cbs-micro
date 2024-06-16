"use strict";
/**
 * ORDER_PRODUCT
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("fnb_order_goods_doc", {
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
    //_________Đơn hàng
    order: {
        type: Schema.Types.ObjectId,
        ref : "fnb_order"
    },
    //_________Sản phẩm
    goods: {
        type: Schema.Types.ObjectId,
        ref : "goods"
    },
    //_________Đơn hàng, sản phẩm
    orderGoods: {
        type: Schema.Types.ObjectId,
        ref : "fnb_order_goods"
    },
    /**
     * THÔNG TIN GIÁ TRỊ/ĐƠN THUỐC KÊ KHAI
     */
    //______Khối lượng/Số lượng
    quantity: {
        type: Number,
        default : 1
    },
    //______Đơn giá
    unitPrice: {
        type: Number,
        default : 0
    },
    //______Thành tiền
    amount: {
        type: Number,
        default : 0
    },
    //_________Mã khách
    customer: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    //_________Ghi chú
    note: String,
    //_________Tệp đính kèm
    files: [{
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