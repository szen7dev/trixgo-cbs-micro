"use strict";
/**
 * ORDER
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("fnb_order", {
    // //_________Mã hiệu đơn hàng (phát sinh tăng)
    // sign: {
    //     type: Number,
    //     default: 1
    // },
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Dự án
    project: {
        type: Schema.Types.ObjectId,
        ref : "datahub_project"
    },
    /**
     * CẤU TRÚC ĐỆ QUY
     */
    //_________Cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "fnb_order"
    },
    level: {
        type: Number,
        default: 1
    },
    //_________Nội dung
    name: String,
    //_________Ký hiệu
    sign: String,
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