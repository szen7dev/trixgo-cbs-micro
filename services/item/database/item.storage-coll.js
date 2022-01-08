"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');

const Schema    = require('mongoose').Schema;
/**
 *  Dụng cụ, thiết bị lưu trữ hồ sơ
 */
module.exports  = DATABASE_MIDDLEWARE("storage", {
    //_________Thuộc về công ty nào  
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Phần tử cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "warehouse"
    },
    //_________Tên
    name: String,
    //_________Mô tả
    description: String,
    userCreate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    }
})