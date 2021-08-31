"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_template_checklist", {
    //_________Thuộc biên bản
    inspection: {
        type    : Schema.Types.ObjectId,
        ref     : 'inspection_template_doc'
    },
    //_________Tên checklist kiểm tra
    name: String,
    //_________Mô tả
    description: String,
    
    /**
     * Trạng thái hoạt động
     * 1: Hoạt động
     * 2: Đã xóa
     */
    stage: {
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