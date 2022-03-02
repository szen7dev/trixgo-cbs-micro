"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * HỒ SƠ YÊU CẦU, MỜI THẦU
 */
module.exports  = DATABASE_MIDDLEWARE("bidding_document_request", {
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
    /**
     * 1-BẢNG DỮ LIỆU
     */
    //________Số hiệu thư mời thầu
    invitationLetter: String,
    //________Tên bên mời thầu
    procuringEntity: String,
    //________Tên chủ đầu tư
    client: String,
    //________Tên dự án
    project: String,
    //________Tên gói thầu
    package: String,
    //________Địa điểm dự án
    projectAddress: String,
    //________Thông tin dự án
    projectInfo: String,
    //________Phạm vi công việc gói thầu
    scopeOfPackage: String,
    //________Thời gian thực hiện hợp đồng (ngày)
    duration: Number,
    //________Loại hợp đồng
    contractType: String,
    //________Hồ sơ đính kèm (video, bản vẽ, spec,...)
    documentIntroduction: String,
    //________Ngôn ngữ hồ sơ dự thầu
    language: String,
    //________Đồng tiền dự thầu	
    currency: String,
    //________Cách thức tổ chức và chuẩn bị hồ sơ dự thầu	
    method: String,
    //________Hiệu lực của hồ sơ dự thầu	
    validity: { type: Date, default: null },
    //________Giá trị đảm bảo dự thầu	
    security: Number,
    //________Thời gian hiệu lực của đảm bảo dự thầu	
    securityValidity: { type: Date, default: null },
    //________Về việc làm rõ hồ sơ mời thầu	
    bidsClarification: String,
    //________Về việc làm rõ hồ sơ dự thầu trong quá trình chấm thầu	
    documentsClarification: String,
    //________Về việc đề xuất phương án thay thế	
    alternative: String,
    //________Về việc sử dụng thầu phụ	
    subcontractor: String,
    //________Thời hạn nộp hồ sơ dự thầu	
    deadline: { type: Date, default: null },
    //________Nguyên tắc lựa chọn nhà thầu của chủ đầu tư	
    evaluation: String,
    //________Về việc thương thảo hợp đồng	
    negotiation: String,
    //________Về cách thức
    biddingSolution: String,
    //________Về chi phí tham dự thầu
    biddingExpense: Number,
    //________Về thông tin/yêu cầu khác
    biddingOther: String,
    //_________Điều khoản hợp đồng
    contractCondition: String,
    /**
     * Tài liệu đính kèm
     * - Bản vẽ
     * - Spec
     * - Mẫu đơn tham gia
     * - Mẫu bảo lãnh,...
     */
    documentAttachs: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
    /**
     * 2-NĂNG LỰC NHÂN SỰ
     */
    //_________Điều kiện về nhân sự
    humanCondition: String,
    /**
     * 3-NĂNG LỰC THIẾT BỊ
     */
    //_________Điều kiện về máy móc thiết bị
    machineCondition: String,
    /**
     * 4-GIẢI PHÁP TỔ CHỨC
     */
    //_________Nội dung
    solutionContent: String,
    //_________Nội dung cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "bidding_document_request"
    },
    //_________Nội dung con
    childs: [{
        type: Schema.Types.ObjectId,
        ref: "bidding_document_request"
    }],
    level: {
        type: Number,
        default: 1
    }, 
    /**
     * HỒ SƠ DỰ THẦU CỦA NHÀ THẦU
     */
    details: [{
        type: Schema.Types.ObjectId,
        ref: "bidding_document_apply"
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