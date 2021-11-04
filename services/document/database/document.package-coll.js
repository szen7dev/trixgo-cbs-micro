"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 *  Hồ sơ văn bản
 */
module.exports = DATABASE_MIDDLEWARE("document_package", {
    //_________Mã hiệu bằng số do hệ thống tự phát sinh
    suid: {
        type   : String,
        require:  true,
        unique : true
    },
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Phòng ban/dự án
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"                  
    },
    //_________Hợp đồng
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"                  
    },
    /**
     * CẤU TRÚC ĐỆ QUY
     */
    parent: {
        type: Schema.Types.ObjectId,
        ref: "document_package"
    },
    childs: [{
        type: Schema.Types.ObjectId,
        ref: "document_package"
    }],
    level: {
        type: Number,
        default: 1
    },
    /**
     * THÔNG TIN CĂN BẢN
     */
    //_________Nội dung
    name: String,
    //_________Ký hiệu (nếu trùng với ký hiệu Hợp đồng => sẽ hiển thị được hồ sơ theo hợp đồng)
    sign: String,
    //_________Thành viên gói thầu
    members: [{
        type: Schema.Types.ObjectId,
        ref : "user"
    }],
    /**
     * THÔNG TIN NGƯỜI TẠO/CẬP NHẬT
     */
    author: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : "user"
    }
})
