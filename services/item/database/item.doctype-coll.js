"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema    = require('mongoose').Schema;

/**
 *  PHÂN LOẠI KHÁC
 */
module.exports  = DATABASE_MIDDLEWARE("doctype", {
    /** PHÂN LOẠI
        1-Văn Bản Lĩnh vực hồ sơ
        2-Văn Bản Tính chất hồ sơ
        3-Lĩnh vực kinh doanh
        4-Khách hàng phân loại
        5-Công việc, Phân loại khác
        6-Nhân sự, Trình độ
        7-Nhân sự, Chuyên ngành
        8-Nhận sự, Loại HDLD
        9-Nhân sự tình trạng làm việc
        10-Nhân sự Thâm niên
        11-CRM, Phân loại lao động
        12-CRM-Hồ sơ chi tiết của giai đoạn
        13-Nhân sự, chúc vụ
        14-Nhân sự loại chứng chỉ
        15-Nhân sự, Nội dung chứng chỉ
        16-Hợp đồng phân loại công nợ
        17-Hợp đồng nguyên nhân phát sinh
        18-Chung-Nguyên nhân thất bại
        19-Chung các lỗi hay gặp
        20- Công việc, Đánh giá chất lượng
        21-NPS Dịch vụ (áp dụng cho message nps)
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
    level: {
        type: Number,
        default: 1
    },
    //_________Phần tử con (Sử dụng dụng cho phân loại của Message NPS)
    childs: [{
        type: Schema.Types.ObjectId,
        ref: "doctype"
    }],
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