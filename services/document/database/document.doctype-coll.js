"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 *  Phân loại hồ sơ
 */
module.exports = DATABASE_MIDDLEWARE("document_doctype", {
    //_________Công ty 
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Phòng ban/dự án
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"                  
    },
    /**
     * CẤU TRÚC ĐỆ QUY
     */
    parent: {
        type: Schema.Types.ObjectId,
        ref: "document_doctype"
    },
    childs: [{
        type: Schema.Types.ObjectId,
        ref: "document_doctype"
    }],
    level: {
        type: Number,
        default: 1
    },
    /**
     * HỆ THỐNG QUẢN LÝ
     */
    //_________Do hệ thống quy định hay không (giá trị 1 hoặc trường company = null)
    belongSystem: { type: Number, default: 0 },
    /**
     * THÔNG TIN CĂN BẢN
     */
    /**
     * Phân loại
     * 1-Theo Lĩnh vực hồ sơ
     * 2-Theo Tính chất hồ sơ
     * 3-Theo lĩnh vực kinh doanh
     * 4-Theo Loại khách hàng
     * 5-Theo bộ môn
     */
    type: { type: Number, default: 1 },
    //_________Tên
    name: String,
    //_________Mô tả
    description: String,
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
