"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');

const Schema    = require('mongoose').Schema;
/**
 *  PHÂN LOẠI KHÁC
 */
module.exports  = DATABASE_MIDDLEWARE("doctype", {
    /**
     * PHÂN LOẠI
     * 1-Theo Lĩnh vực hồ sơ
     * 2-Theo Tính chất hồ sơ
     * 3-Theo lĩnh vực kinh doanh
     * 4-Theo Loại khách hàng
     * 5-Theo bộ môn
     */
    type: { type: Number, default: 1 },
    //_________Do hệ thống quy định hay không (giá trị 1 hoặc trường company = null)
    belongSystem: { type: Number, default: 0 },
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
    //_________Phần tử cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "doctype"
    },    
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