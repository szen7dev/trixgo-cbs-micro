"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');

const Schema    = require('mongoose').Schema;
/**
 *  ĐƠN VỊ CƠ SỞ
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