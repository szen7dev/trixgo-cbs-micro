"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 * TÀI KHOẢN KẾ TOÁN
 */

module.exports  = DATABASE_MIDDLEWARE("account", { 
     /**
     * Thuộc về công ty nào
     */    
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Tên
    name: String,
    //_________Mô tả
    description: String,
    /**
     * Phân loại
     * - 1: Tài khoản thông thường
     * - 2: Tài khoản công nợ
     * - 3: Tài khoản hàng hóa
     */
    type: {
        type: Number,
        default: 1
    },

    // Cấu hình hiển thị cho báo cáo quản trị (Đang phát triển)
    showInReportMonth: {
        type: Number,
    },
    /**
     * ĐỆ QUY CHA CON
     */
    parent: {
        type: Schema.Types.ObjectId,
        ref: "account"
    },
    childs: [{
        type: Schema.Types.ObjectId,
        ref: "account"
    }],
    // Số lượng phần tử con
    amountChilds: {
        type: Number,
        default: 0 
    },

    level: {
        type: Number,
        default: 1 
    },
    /**
     * Trạng thái sử dụng
     * - 1: Đang sử dụng
     * - 0: Không còn sử dụng
     */
    status: {
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