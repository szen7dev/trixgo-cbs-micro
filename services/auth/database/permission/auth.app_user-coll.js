"use strict";

const DATABASE_MIDDLEWARE   = require('../../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("app_user", {
    /**
     * Tài khoản
     */
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    /**
     * Ứng dụng được quyền truy cập
     */
    app: {
        type : Schema.Types.ObjectId,
        ref  : 'app'
    },
    /**
     * Công ty chủ quản member (user)
     * -> tiện xử lý lấy danh sách
     */
    company: {
        type : Schema.Types.ObjectId,
        ref  : 'company'
    },
    /**
     * Dùng để phân biệt Admin ứng dụng/thành viên thông thường
     * 0: Admin
     * 1: Thành viên thường
     */
    level: {
        type    : Number,
        default : 1
    },
    /**
     * Số lần truy cập ứng dụng
     */
    numLog:{
        type   : Number,
        default: 0
    },
    /**
     * Người tạo
     */
    userCreate: {
        type : Schema.Types.ObjectId,
        ref  : 'user'
    },
    /**
     * Người cập nhật
     */
    userUpdate: {
        type : Schema.Types.ObjectId,
        ref  : 'user'
    }
})   