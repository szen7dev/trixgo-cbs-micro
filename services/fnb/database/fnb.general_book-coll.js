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
    //_________Link (Kho xuất xuống cửa hàng)
    link: {
        type: Schema.Types.ObjectId,
        ref: "fnb_general_book"
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
     * Phân loại doanh thu
     * 1-Offline
     * 2-Grab
     * 3-Shopee
     * 4-Gojek
     * 5-Baemin
     * 6-Loship
     * 7-Bee
     */
    revenueType: {
        type: Number,
        default: 1
    },
    /**
     * Phân loại chi phí (tham khảo báo cáo)
     * 1-Truyền thông và marketing
     * 2-Food App
     * 3-Nguyên liệu
     * 4-Thuê mặt bằng
     * 5-Điện nước
     * 6-Lương nhân viên
     * 7-Khác
     */
    expenseType: {
        type: Number,
        default: 1
    },
     /**
     * Phân loại app
     * 1-Offline
     * 2-Grab
     * 3-Shopee
     * 4-Gojek
     * 5-Baemin
     * 6-Loship
     * 7-Bee
     */
    appExpenseType: {
        type: Number,
        default: 1
    },
    /**
     * Tên chiến dịch (type=20)
     * - Gán chiến dịch đang hiện hành để đo lường
     */
    campaignName: {
        type: Schema.Types.ObjectId,
        ref : 'doctype'
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
    vatAmount: { type: Number, default: 0 }, 
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
    //_________Số lượng phần tử con
    amountChilds: {
        type: Number,
        default: 0 
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