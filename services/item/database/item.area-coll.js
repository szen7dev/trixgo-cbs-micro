"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 * KHU VỰC ĐỊA LÝ
 */

module.exports  = DATABASE_MIDDLEWARE("area", {
    /**
     * CẤU TRÚC ĐỆ QUY
     */
    parent: {
        type: Schema.Types.ObjectId,
        ref: "area"
    },
    childs: [{
        type: Schema.Types.ObjectId,
        ref: "area"
    }],
    level: {
        type: Number,
        default: 1
    },
    /**
     * THÔNG TIN CĂN BẢN
     */
    //_________Tên
    name: String,
    //_________Mã hiệu
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