"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * ĐỊNH MỨC NGUYÊN LIỆU
 * Mỗi nguyên liệu chỉ tồn tại trong 1 sản phẩm/mặt hàng 1 lần duy nhất
 */
module.exports  = DATABASE_MIDDLEWARE("fnb_quota", {    
    //_________Sản phẩm
    product: {
        type: Schema.Types.ObjectId,
        ref : "fnb_product"
    },
    /**
     * Kích cỡ
     * 1-Size M
     * 2-Size L
     */
    size: {
        type: Number,
        default : 1
    },
    /**
     * Đường
     * 1-100
     * 2-70
     * 3-50
     * 4-30
     */
    sugar: {
        type: Number,
        default : 1
    },
    /**
     * Đá
     * 1-100
     * 2-70
     * 3-50
     * 4-30
     */
    ice: {
        type: Number,
        default : 1
    },
    //_________Nguyên liệu
    goods: {
        type: Schema.Types.ObjectId,
        ref: 'goods'
    },
    //_________Khối lượng
    quantity: { type: Number, default: 0 },
    //_________Đơn giá (lấy từ goods)
    unitPrice: { type: Number, default: 0 },
    //_________Thành tiền
    amount: { type: Number, default: 0 },
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