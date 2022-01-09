"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 *  Gói thầu/Thư mục hồ sơ dự án
 */
module.exports = DATABASE_MIDDLEWARE("document_package", {
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
    //_________Phần tử cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "document_package"
    },
    /**
     * THÔNG TIN CĂN BẢN
     */
    //_________Nội dung
    name: String,
    //_________Ký hiệu (nếu trùng với ký hiệu Hợp đồng => sẽ hiển thị được hồ sơ theo hợp đồng)
    sign: String,
    //________ Tổng số hồ sơ trong gói thầu
    numberOfDocs: {
        type: Number,
        default: 0
    },
    /**
     * PHÂN QUYỀN TRUY CẬP
     */
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
