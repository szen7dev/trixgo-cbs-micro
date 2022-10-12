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
    //_________Hợp đồng/Gói thầu
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
    },
    /**
     * QUẢN LÝ TRẠNG THÁI TRIỂN KHAI
     */
    //_________Khu vực cha (tầng)
    parentArea: {
        type    : Schema.Types.ObjectId,
        ref     : 'inspection_area'
    },
    //_________Khu vực (căn hộ)
    area: {
        type: Schema.Types.ObjectId,
        ref : "inspection_area"
    },
    //_________Nhóm công tác cha (kết cấu, kiến trúc,...)
    parentGroup: {
        type: Schema.Types.ObjectId,
        ref : "inspection_group"
    },    
    //_________Nhóm công tác
    group: {
        type: Schema.Types.ObjectId,
        ref : "inspection_group"
    },
    /**
     * NỘI DUNG KHÁC
     */
    //_________Nội dung
    name: String,
    //_________Mã hiệu hồ sơ
    sign: String,
    //_________Mô tả hồ sơ/Vị trí
    description: String,
    // //_________Hạng mục
    // item: String,
    // //_________Vị trí
    // position: String,
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
    finishedTime: Date,
    /**
    * Trạng thái  
    * 1-Khởi tạo 
    * 2-Đang triển khai
    * 3-Sửa lỗi
    * 4-Hoàn thành
    */
    status: {
        type: Number,
        default: 1
    },
    //_________Người tạo
    author: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    //_________Công ty của người tạo việc
    companyOfAuthor: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Người thực hiện (Thành viên dự án)
    assignee: {
        type    : Schema.Types.ObjectId,
        ref     : 'user'
    },    
    //_________Công ty của người thực hiện
    companyOfAssignee: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },   
    //_________Những người liên quan
    related: [{
        type: Schema.Types.ObjectId,
        ref: "user"
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
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    }
})