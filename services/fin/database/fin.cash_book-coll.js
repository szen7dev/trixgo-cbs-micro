"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * SỔ QUỸ/THẺ KHO/...
 */
module.exports  = DATABASE_MIDDLEWARE("cash_book", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Dự án, phòng ban
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },
    //_________Kho bãi
    warehouse: {
        type: Schema.Types.ObjectId,
        ref : "warehouse"
    },
    //_________Phần tử cha
    parent: {
        type: Schema.Types.ObjectId,
        ref : "cash_book"
    },
    //_________Tài khoản kế toán
    account: {
        type: Schema.Types.ObjectId,
        ref: 'account'
    },
    //_________Mã khách
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'contact'
    },
    //_________Hợp đồng
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
    },
    //_________Vật tư, thiết bị, công cụ dụng cụ
    goods: {
        type: Schema.Types.ObjectId,
        ref : "goods"
    },
    //_________Tài sản/thiết bị dùng để quản lý sửa chữa, tiêu hao
    assets: {
        type: Schema.Types.ObjectId,
        ref : "goods"
    },
    //________Link với ngân sách
    work: {
        type: Schema.Types.ObjectId,
        ref : "budget_work"
    },
    //_________Admin (được quyền xem, sửa)
    admins : [{
        type   : Schema.Types.ObjectId,
        ref: 'user'
    }],
    //_________Thành viên (được quyền xem)
    members : [{
        type   : Schema.Types.ObjectId,
        ref: 'user'
    }],
    /**
     * Phân loại vào ra
     * 1-Bán ra
     * 2-Mua vào
     */
    outin: { type: Number, default: 1 },
    /**
     * Phân loại
     * 1. Sổ quỹ
     * 2. Vật tư chính
     * 3. Vật tư phụ
     * 4. Công cụ dụng cụ
     * 5. Hàng hóa/Cấu kiện/Thành phẩm
     */
    type: {
        type: Number,
        default : 1
    },
    //_________Tên
    name: String,
    //_________Ngày tháng
    date: { type: Date, default: Date.now },
    //_________Mã hiệu
    sign: String,
    //_________Ghi chú
    note: String,
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
    /**
     * DÀNH RIÊNG CHO SỔ QUỸ
     */
    //_________Số dư đầu kỳ
    openingBalance: { type: Number, default: 0 },
    //_________Phát sinh trong kỳ
    arising: { type: Number, default: 0 },
    //_________Số dư cuối kỳ
    closingBalance: { type: Number, default: 0 },
    //_________Thu
    income: { type: Number, default: 0 },
    //_________Chi
    expense: { type: Number, default: 0 },
    /**
     * Sổ quỹ đang hoạt động hoặc tạm dừng
     * 1-Hoạt động
     * 2-Tạm dừng
     */
    active: { type: Number, default: 1 },
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