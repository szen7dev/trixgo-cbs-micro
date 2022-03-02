"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * HỒ SƠ YÊU CẦU, MỜI THẦU
 */
module.exports  = DATABASE_MIDDLEWARE("bidding_document_apply", {
    /**
     * Phân loại
     * 1-Bảng dữ liệu
     * 2-Năng lực nhân sự
     * 3-Năng lực thiết bị
     * 4-Giải pháp tổ chức thực hiện
     */
    type: { type: Number, default: 1 },
    //_________Công ty Phát hành hồ sơ mời thầu/Công ty tạo ra task
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Công việc phát hành hồ sơ mời thầu
    task: {
        type: Schema.Types.ObjectId,
        ref : "pcm_plan_task"
    },
    //_________Công ty Dự thầu/Thí sinh
    companyBid: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Dự thầu ứng với yêu cầu nào
    document: {
        type: Schema.Types.ObjectId,
        ref : "bidding_document_request"
    },
    /**
     * 2-NĂNG LỰC NHÂN SỰ
     */
    humanAttachs: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
    /**
     * 3-NĂNG LỰC THIẾT BỊ
     */
    //________Tài liệu xác nhận
    machineAttachs: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
    /**
     * 4-GIẢI PHÁP TỔ CHỨC THỰC HIỆN
     */
    //________Tài liệu xác nhận
    solutionAttachs: [{
        type: Schema.Types.ObjectId,
        ref: "file"
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