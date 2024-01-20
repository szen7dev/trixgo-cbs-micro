"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 * CẤU HÌNH MÔI TRƯỜNG
 * - Biến môi trường cho Zalo OA
 * - Biến môi trường cho Facebook
 * ...
 */

module.exports  = DATABASE_MIDDLEWARE("config", {
    /**
     * Phân loại
     * 1-Zalo OA
     * 2-Facebook
     * 3-...
     * 1 type ứng với 1 companyID thì chỉ có 1 mẩu tin duy nhất
     */
    type: { type: Number, default: 1 },
    //_________Phân vùng hoạt động: của user đang truy cập
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Tên biến
    name: String,
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