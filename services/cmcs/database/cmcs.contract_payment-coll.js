"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("contract_payment", {
    //_________Phân loại (1-Tạm ứng/2-Thanh toán/3-Quyết toán )(*)
    type: { type: Number, default: 1 },

    //_________Công ty-Được xác định theo IPC(*)
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },

    //_________Dự án-Được xác định theo IPC(*) 
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },

    //_________Hợp đồng-Được xác định theo IPC(*)
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
    },

    //_________IPC(*)
    ipc: {
        type: Schema.Types.ObjectId,
        ref : "contract_ipc"
    },

    //_________Nội dung(*)
    name: String,

    //_________Mã hiệu
    sign: String,
    
    //_________Mô tả
    description: String,

    //_________Ngày chuyển tiền (*)
    date: { type: Date, default: Date.now },

    //_________Giá trị chuyển tiền
    value:  { type: Number, default: 0 },

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