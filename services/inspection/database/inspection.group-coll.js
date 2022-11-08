"use strict";

/**
 * NHÓM CÔNG VIỆC
 * Cấp 1: Kết cấu, kiến trúc, cơ điện,...
 * Cấp 2: Các nhóm công tác của từng bộ môn
 */

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_group", {
    //_________Thuộc dự án
    project: {
        type    : Schema.Types.ObjectId,
        ref     : 'department'
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: "inspection_group"
    },
    //_________Tên
    name: String,
    //_________Mã hiệu
    sign: String,
    //_________Mô tả 
    description: String,
    /**
     * Thứ tự để hiển thị
     */
    order: {
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