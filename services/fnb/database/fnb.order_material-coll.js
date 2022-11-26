"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * NGUYÊN LIỆU CỦA ĐƠN HÀNG
 */
module.exports  = DATABASE_MIDDLEWARE("fnb_order_material", {   
    //_________Công ty (***lấy theo orderID)
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Đơn vị cơ sở/Cửa hàng (***lấy theo orderID)
    funda: {
        type: Schema.Types.ObjectId,
        ref : "funda"
    },
    //_________Ca làm việc (***lấy theo orderID)
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
    //______Khối lượng/Số lượng sản phẩm (lấy theo order_product)
    quantityOfProduct: {
        type: Number,
        default : 1
    },
    //_________Nguyên liệu
    goods: {
        type: Schema.Types.ObjectId,
        ref: 'goods'
    },
    //_________Khối lượng định mức (lấy theo định mức Quota)
    quantity: { type: Number, default: 0 },
    //_________Đơn giá (lấy theo đơn giá Goods)
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