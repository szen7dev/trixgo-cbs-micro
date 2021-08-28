"use strict";

/**
 * KHU VỰC/CẤU KIỆN TRONG DỰ ÁN
 * - Do Admin dự án tạo ra
 * - Sử dụng chung cho tất cả các gói thầu
 */

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_area", {
    //_________Thuộc dự án
    project: {
        type    : Schema.Types.ObjectId,
        ref     : 'department'
    },
    //_________Tên checklist kiểm tra
    name: String,
    //_________Mã hiệu
    sign: String,
    //_________Mô tả
    description: String,
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