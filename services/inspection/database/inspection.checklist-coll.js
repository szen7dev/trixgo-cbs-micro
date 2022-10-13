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
    /**
    * Trạng thái  
    * 1-Đang triển khai
    * 2-Hoàn thành
    */
    description : String,
    status: {
        type: Number,
        default: 1
    },
    //_________Người xác nhận
    approver: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    //_________Thời gian xác nhận
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