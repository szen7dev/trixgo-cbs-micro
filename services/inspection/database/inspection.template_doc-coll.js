"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_template_doc", {
    //_________Phân loại (kết cấu, kiến trúc,...) cf_constant
    type: {
        type: Number,
        default: 1   
    },
    //_________Tên
    name: String,
    //_________Mã hiệu
    sign: {
        type: String,
        trim: true,
        unique : true,
        require: true  
    }, 
    //_________Mô tả hồ sơ
    description: String,
    //_________Số lượng tương tác
    numLike: {
        type: Number,
        default: 0
    },
    //_________Số lượng comment
    numComment: {
        type: Number,
        default: 0
    },
    //_________Số lượng share
    numShare: {
        type: Number,
        default: 0
    },
    //_________Số lượng view
    numView: {
        type: Number,
        default: 0
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