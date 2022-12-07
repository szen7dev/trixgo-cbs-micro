"use strict";
/**
 * SỔ CHUNG
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("fnb_general_book", {
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
    /**
     * Phân biệt phiếu và chi tiết
     */
    //_________Cha (phiếu)
    parent: {
        type: Schema.Types.ObjectId,
        ref: "fnb_general_book"
    },
    level: {
        type: Number,
        default: 1
    },
    /**
     * Doanh thu, chi phí
     * 1-Doanh thu
     * 2-Chi phí
     */
    outin: {
        type: Number,
        default: 1
    },
    /**
     * Phân loại doanh thu (tham khảo order)
     */
    revenueType: {
        type: Number,
        default: 1
    },
    /**
     * Phân loại chi phí (tham khảo báo cáo)
     */
    expenseType: {
        type: Number,
        default: 1
    },
    //_________Ngày hoạch toán
    date: { type: Date, default: Date.now },
    //_________Diễn giải nội dung
    name: String,
    //_________Ghi chú
    note: String,  
    //_________Mã khách
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'contact'
    },
    //_________Hàng hóa/Thành phẩm/Nguyên vật liệu
    goods: {
        type: Schema.Types.ObjectId,
        ref: 'goods'
    }, 
    //_________Khối lượng/Số lượng
    quantity: { type: Number, default: 0 },  
    /**
     * Đơn giá (được tính dự theo thành tiền/khối lượng)
     * Khi chạy được giá vốn => nhân ra thành tiền và update cho trường Amount
     */
    unitPrice: { type: Number, default: 0 },   
    //_________Thành tiền
    amount: { type: Number, default: 0 }, 
    //_________Vat
    vat: { type: Number, default: 0 }, 
    /**
     * TK hạch toán
     */
    //_________Tài khoản nợ
    debit: {
        type: Schema.Types.ObjectId,
        ref: 'account'
    },   
    //_________Tài khoản có
    credit: {
        type: Schema.Types.ObjectId,
        ref: 'account'
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