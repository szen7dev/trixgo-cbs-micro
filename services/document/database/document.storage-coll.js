"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 *  Dụng cụ lưu trữ hồ sơ
 */
module.exports = DATABASE_MIDDLEWARE("document_storage", {
    /**
     * Thuộc về công ty nào
     */
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    // ______Tên
    name: String,
    // ______Mô tả
    description: String,
    /**
     * Cha (sử dụng để hiển thị theo quy tắc đệ quy)
     */
    parent: {
        type: Schema.Types.ObjectId,
        ref: "document_storage"
    },
    /**
     * Con
     */
    childs: [{
        type: Schema.Types.ObjectId,
        ref: "document_storage"
    }],
    level: {
        type: Number,
        default: 1 
    },
    /**
     * Người tạo
     */
    userCreate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
     /**
     * Người cập nhật
     */
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
})
