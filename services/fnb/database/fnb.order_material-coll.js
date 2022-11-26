"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * NGUYÊN LIỆU CỦA ĐƠN HÀNG
 */
module.exports  = DATABASE_MIDDLEWARE("fnb_order_material", {   
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
    //_________Ca làm việc
    shift: {
        type: Schema.Types.ObjectId,
        ref : "fnb_shift"
    },
    //_________Đơn hàng
    order: {
        type: Schema.Types.ObjectId,
        ref : "fnb_order"
    },
    //_________Sản phẩm
    product: {
        type: Schema.Types.ObjectId,
        ref : "fnb_product"
    },
    //_________Nguyên liệu
    goods: {
        type: Schema.Types.ObjectId,
        ref: 'goods'
    },
    //_________Khối lượng
    quantity: { type: Number, default: 0 },
    //_________Đơn giá
    unitPrice: { type: Number, default: 0 },
    //_________Thành tiền
    amount: { type: Number, default: 0 },
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