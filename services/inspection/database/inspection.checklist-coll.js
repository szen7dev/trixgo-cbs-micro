"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_checklist", {
    //_________Thuộc hồ sơ
    inspection: {
        type    : Schema.Types.ObjectId,
        ref     : 'inspection_doc'
    },
    //_________Tên checklist kiểm tra
    name: String,
    //_________Trạng thái (0-Khởi tạo/1-Không/2-Đạt)
    status: {
        type: Number,
        default: 0
    },
    //_________Người xác nhận cuối cùng
    approver: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    //_________Thời gian xác nhận cuối cùng
    timeApproved: Date,
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