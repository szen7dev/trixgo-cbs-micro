"use strict";
/**
 * KHÁCH HÀNG QUAN TÂM ZALO OA
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("fnb_zalooa", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________ID kênh Zalo OA
    oa_id: String,
    //_________ID người dùng zalo
    user_id: String,
    //_________Tên khách hàng
    name: String,
    //_________Số điện thoại
    phone: String,
    //_________Giới tính
    gender: String,
    //_________Ghi chú
    note: String,
    /**
     * Trạng thái
     * 1-Bấm quan tâm
     * 2-Bỏ quan tâm
     */
    status: {
        type: Number,
        default: 1
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