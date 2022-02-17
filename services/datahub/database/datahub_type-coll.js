"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * DATAHUB-PHÂN LOẠI CỦA HỆ THỐNG
 * 1-Lĩnh vực hoạt động
 * 2-Chủ đề bài viết cộng đồng
 */
module.exports  = DATABASE_MIDDLEWARE("datahub_type", {
    //_________Phân loại
    type: { type: Number, default: 1 },
    //_________Cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "datahub_type"
    },
    //_________Level (1,2,3..)
    level: { type: Number, default: 1 },
    //_________Tên
    name: String,
    //_________Mô tả
    description: String,   
    //_________Số lượng nhà thầu tham gia
    numberOfContractors: { type: Number, default: 0 },
    //_________Ảnh đại diện
    image: {
        type: Schema.Types.ObjectId,
        ref: "file"
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