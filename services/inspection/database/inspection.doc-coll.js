"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
    
module.exports  = DATABASE_MIDDLEWARE("inspection_doc", {
    //_________Mẫu hồ sơ
    template: {
        type    : Schema.Types.ObjectId,
        ref     : 'datahub_inspection_doc'
    },
    //_________ Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Dự án
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },    
    //_________Hợp đồng
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
    },
    //_________Nội dung
    name: String,
    //_________Mã hiệu hồ sơ
    sign: String,
    //_________Mô tả hồ sơ/Vị trí
    description: String,
    //_________Hạng mục
    item: String,
    //_________Vị trí
    position: String,
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
    //_________Kế hoạch hoàn thành
    expiredTime: Date,
    //_________Ngày hồ sơ hoàn thành thực tế
    date: Date,
    /**
    * Trạng thái   
    * 1-Đang triển khai
    * 2-Hoàn thành
    */
    status: {
        type: Number,
        default: 1
    },
    //_________Người thực hiện (Thành viên dự án)
    assignee: {
        type    : Schema.Types.ObjectId,
        ref     : 'user'
    },       
    //_________Thành viên liên quan (Thành viên dự án)
    members: [{
        type    : Schema.Types.ObjectId,
        ref     : 'user'
    }],             
    //_________Chữ ký xác nhận 
    signatures: [{
        type    : Schema.Types.ObjectId,
        ref     : 'signature'
    }],
    //_________Bình luận cuối cùng của hồ sơ
    lastComment: {
        type    : Schema.Types.ObjectId,
        ref     : 'inspection_doc_comment'   
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