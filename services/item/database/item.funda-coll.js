"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');

const Schema    = require('mongoose').Schema;
/**
 *  ĐƠN VỊ CƠ SỞ
 * - Cập nhật khu vực
 * - Cập nhật trong/ngoài hệ thống
 * - Cập nhật member
 * - Cập nhật kế hoạch chi hàng tháng
 */
module.exports  = DATABASE_MIDDLEWARE("funda", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Tên
    name: String,
    //_________Mô tả
    description: String,
    //_________Mã hiệu
    sign: {
        type: String,
        default: 'Sign' 
    },
    /**
     * Khóa dữ liệu trước khoảng thời gian không cho phép can thiệp:
     * - Thêm mới phiếu
     * - Sửa phiếu
     * - Xóa phiếu
     * - Reset phiếu
     * Chỉ cho phép Admin ứng dụng/Owner được phép
     * BA gồm:
     * - Không cho Tạo mới phiếu nếu ngày hiện tại < Ngày khóa
     * - Không cho show form Sửa phiếu
     * - Khóa các nút bấm ở danh sách phiếu, tìm kiếm phiếu và chi tiết phiếu (áp dụng cho cả CC)
     */
    timeAccountingLock: {
        type: Date,
        default: null
    },
    //_________Phần tử cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "funda"
    },
    level: {
        type: Number,
        default: 1 
    },
    amountChilds: {
        type: Number,
        default: 0
    },
    /**
     * Khu vực
     */
    //_________Địa chỉ
    address: String,
    //_________Tỉnh/Thành phố
    area1: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Huyện/Quận
    area2: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Xã/Phường
    area3: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    /**
     * Phân loại trong hệ thống hoặc nhượng quyền (cập nhật theo funda)
     * 1-Trong hệ thống
     * 2-Nhượng quyền => Setup theo tính chất của Funda
     */
    internal: {
        type: Number,
        default: 1
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
     * CẤU TRÚC CHI PHÍ DỰ TRÙ/THÁNG
     */
    //_________Chi phí nguyên liệu (%)
    materialExpenseRate: { type: Number, default: 30 },
    //_________Chi phí nguyên liệu (giá trị)
    materialExpense: { type: Number, default: 0 },
    //_________Chi phí thuê mặt bằng
    planExpense: { type: Number, default: 0 },
    //_________Chi phí điện nước, internet
    utilityExpense: { type: Number, default: 0 },
    //_________Chi phí lương nhân viên
    humanExpense: { type: Number, default: 0 },
    //_________Chi phí khác
    otherExpense: { type: Number, default: 0 },
    /**
     * PHÂN QUYỀN TRUY CẬP
     */
    admins: [{
        type: Schema.Types.ObjectId,
        ref : "user"
    }],
    members: [{
        type: Schema.Types.ObjectId,
        ref : "user"
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
    },
})