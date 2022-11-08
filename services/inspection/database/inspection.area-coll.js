"use strict";

/**
 * KHU VỰC/CẤU KIỆN TRONG DỰ ÁN
 * - Do Admin dự án tạo ra
 * - Sử dụng chung cho tất cả các gói thầu
 * - Cấu trúc gồm 2 cấp: cấp 1, cấp 2
 * - Các hồ sơ sẽ được gán kèm area cấp 2
 */

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_area", {
    //_________Thuộc dự án
    project: {
        type    : Schema.Types.ObjectId,
        ref     : 'department'
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: "inspection_area"
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