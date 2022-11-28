"use strict";
/**
 * BÀN GIAO CA
 * 1-Đầu ca sẽ cân
 * 2-Cuối ca sẽ cân
 * 3-Cập nhật định mức sử dụng vào trong ca
 * (Mỗi vật tư chỉ xuất hiện 1 mẩu tin ứng với 1 ca)
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("fnb_shift_handover", {
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
    //_________Vật tư
    goods: {
        type: Schema.Types.ObjectId,
        ref : "goods"
    },
    //_________Khối lượng đầu kỳ
    openingQuantity: { type: Number, default: 0 },
    //_________Khối lượng sử dụng trong kỳ
    usedQuantity: { type: Number, default: 0 },
    //_________Khối lượng cuối kỳ
    closingQuantity: { type: Number, default: 0 },
    //_________Khối lượng theo định mức
    quotaQuantity: { type: Number, default: 0 },
    //_________Khối lượng thất thoát
    lostQuantity: { type: Number, default: 0 },
    //_________Đơn giá
    unitPrice: { type: Number, default: 0 },
    //______Thành tiền đầu kỳ
    openingAmount: {
        type: Number,
        default : 0
    },
    //______Thành tiền trong kỳ
    usedAmount: {
        type: Number,
        default : 0
    },
    //______Thành tiền cuối kỳ
    closingAmount: {
        type: Number,
        default : 0
    },
    //______Thành tiền theo định mức
    quotaAmount: {
        type: Number,
        default : 0
    },
    //______Thành tiền thất thoát
    lostAmount: {
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