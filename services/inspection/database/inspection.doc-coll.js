"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("inspection_doc", {
    //_________Template
    template: {
        type    : Schema.Types.ObjectId,
        ref     : 'inspection_template_doc'
    },
    //_________Thuộc dự án
    project: {
        type    : Schema.Types.ObjectId,
        ref     : 'department'
    },
    //_________Thuộc hợp đồng
    contract: {
        type    : Schema.Types.ObjectId,
        ref     : 'contract'
    },
    //_________Tên hồ sơ
    name: String,
    //_________Mã hiệu hồ sơ
    sign: String,
    //_________Mô tả hồ sơ
    description: String,
    //_________Số lượng tương tác
    numLike: Number,
    //_________Số lượng comment
    numComment: Number,
    //_________Số lượng share
    numShare: Number,
    //_________Số lượng view
    numView: Number,
    //_________Ngày hồ sơ
    date: {
        type : Date
    },
    //_________Ngày hồ sơ đã điều chỉnh
    modifiedDate: {
        type : Date
    },
    //_________Trạng thái (1-Đang triển khai/2-Đã hoàn thành)
    status: {
        type: Number,
        default: 1
    },
    //_________Công tác trong biểu khối lượng hợp đồng/gói thầu
    job: {
        type    : Schema.Types.ObjectId,
        ref     : 'contract'
    },
    //_________Liên quan tới các khu vực
    areas: [{
        type    : Schema.Types.ObjectId,
        ref     : 'inspection_area'
    }],
    //_________Bình luận cuối cùng của hồ sơ
    lastComment: {
        type    : Schema.Types.ObjectId,
        ref     : 'comment'
    }, 
    //_________Người thực hiện
    assignee: {
        type    : Schema.Types.ObjectId,
        ref     : 'user'
    },       
    //_________Thành viên liên quan
    members: [{
        type    : Schema.Types.ObjectId,
        ref     : 'user'
    }],  
    //_________Chữ ký xác nhận
    signatures: [{
        type    : Schema.Types.ObjectId,
        ref     : 'signature'
    }],
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