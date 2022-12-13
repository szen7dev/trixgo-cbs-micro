"use strict";
/**
 * CA LÀM VIỆC
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("fnb_shift", {
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
    //_________Nội dung
    name: String,
    //_________Ghi chú
    note: String,
    //_________Nhân viên ca trực
    staffs: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    //_________Số giờ làm việc của ca
    workingHours: {
        type: Number,
        default: 0
    },
    /**
     * GIÁT TRỊ ĐƠN HÀNG CỦA CA
     */
    /**
     * Số đơn hàng
     * => Không tính với product là Topping
     */
    numberOfOrders: {
        type: Number,
        default: 0
    },
    /**
     * Số lượng sản phẩm
     * => Không tính với product là Topping
     */
    numberOfProducts: {
        type: Number,
        default: 0
    },
    //______Tổng giá theo các Product của đơn hàng
    total: {
        type: Number,
        default : 0
    },
    //______Thành tiền (đã trừ giảm giá, triết khấu)
    amount: {
        type: Number,
        default : 0
    },
    //______VAT thành tiền
    vatAmount: {
        type: Number,
        default : 0
    },
    /**
     * Bật chiến dịch truyền thông/marketing
     * 1-Không bật
     * 2-Bật
     */
    campaign: {
        type: Number,
        default: 1
    }, 
    /**
     * Mùa trong năm (theo lịch âm)
     * 1-Xuân
     * 2-Hạ
     * 3-Thu
     * 4-Đông
     */
    seasons: {
        type: Number,
        default: 1
    },
    /**
     * Phân loại ca làm việc (cập nhật theo funda)
     * 1-Sáng
     * 2-Chiều
     * 3-Tối
     */
    shiftType: {
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