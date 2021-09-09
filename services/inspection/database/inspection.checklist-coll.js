"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_checklist", {
    //_________Thuộc hồ sơ
    inspection: {
        type    : Schema.Types.ObjectId,
        ref     : 'inspection_doc'
    },
    //_________Template
    template: {
        type    : Schema.Types.ObjectId,
        ref     : 'inspection_template_checklist'
    },
    //_________Tên checklist kiểm tra
    name: String,
    //_________Trạng thái (1-Đang triển khai/2-Đã hoàn thành)
    status: {
        type: Number,
        default: 1
    },
    //_________Người xác nhận hoàn thành
    approver: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    //_________Thời gian phê duyệt
    timeApproved: {
        type : Date,
        default: null
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