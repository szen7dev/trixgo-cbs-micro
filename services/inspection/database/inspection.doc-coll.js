"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
    
module.exports  = DATABASE_MIDDLEWARE("inspection_doc", {
    //_________Template/Loại hồ sơ
    template: {
        type    : Schema.Types.ObjectId,
        ref     : 'inspection_template_doc'
    },
    //_________Thuộc dự án/Công trình 
    project: {
        type    : Schema.Types.ObjectId,
        ref     : 'department' 
    },
    //_________Thuộc hợp đồng/Gói thầu
    contract: {
        type    : Schema.Types.ObjectId,
        ref     : 'contract'
    },
    //_________Nội dung
    name: String,
    //_________Mã hiệu hồ sơ
    sign: String,
    //_________Mô tả hồ sơ/Vị trí
    description: String,
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
    expiredTime: { type: Date, default: null },
    //_________Ngày hồ sơ hoàn thành thực tế
    date: {
        type : Date  
    },
    //_________Ngày hồ sơ đã điều chỉnh
    modifiedDate: {
        type : Date 
    },
    /**
    * Trạng thái   
    * 1-Đang triển khai
    * 2-Hoàn thành
    */
    status: {
        type: Number,
        default: 1
    },
    //_________Công tác trong biểu khối lượng hợp đồng/gói thầu
    job: {
        type    : Schema.Types.ObjectId,
        ref     : 'contract_bill_job'
    },
    //_________Khu vực (Khu vực cấu kiện)
    areas: [{
        type    : Schema.Types.ObjectId,
        ref     : 'inspection_area'
    }],
    //_________Bình luận cuối cùng của hồ sơ
    lastComment: {
        type    : Schema.Types.ObjectId,
        ref     : 'inspection_doc_comment'   
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