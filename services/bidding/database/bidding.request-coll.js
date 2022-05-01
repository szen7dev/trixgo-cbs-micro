"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * YÊU CẦU KỸ THUẬT
 */
module.exports  = DATABASE_MIDDLEWARE("bidding_request", {
    /**
     * THÔNG TIN CHUNG => LẤY TỪ BIDDING_PLAN SANG
     */
    //_________Chủ đầu tư
    client: {
        type: Schema.Types.ObjectId,
        ref : "company"
    }, 
    //_________Dự án
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },
    //_________Kế hoạch đầu thầu
    plan: {
        type: Schema.Types.ObjectId,
        ref: "bidding_plan"
    },
    //_________Hồ sơ mời thầu
    doc: {
        type: Schema.Types.ObjectId,
        ref : "bidding_doc"
    },
    /**
     * YÊU CẦU KỸ THUẬT
     */
    /**
     * Phân loại
     * 1-Bảng dữ liệu
     * 2-Năng lực nhân sự
     * 3-Năng lực máy móc
     * 4-Yêu cầu vật tư thiết bị
     * 5-Giải pháp tổ chức thực hiện
     * 6-Yêu cầu khác-Bill 2
     * 7-Điều khoản hợp đồng
     */
    type: { type: Number, default: 1 }, 
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
     * CHUNG CHO CÁC YÊU CẦU
     * 2-Yêu cầu nhân sự (Quan hệ 1-n)
     * 3-Yêu cầu thiết bị (Quan hệ 1-n)
     * 4-Yêu cầu vật tư thiết bị (phân nhóm sẽ viết hoa)
     * 5-Giải pháp tổ chức (Quan hệ 1-n)
     * 6-Một số yêu cầu khác (Quan hệ 1-n)
     * 7-Điều khoản hợp đồng (Quan hệ 1-n)
     */
    //_________Thứ tự, dùng để sắp xếp
    order: {
        type: Number,
        default: 1
    }, 
    //_________Nội dung
    name: String,
    //_________Vị trí, khu vực
    position: String,
    //_________Đơn vị
    unit: String,
    //_________Mô tả/Yêu cầu
    description: String,
    //_________Ghi chú/Thương hiệu, xuất xứ
    note: String,
    //_________Tài liệu, ảnh đính kèm
    documentAttachs: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
    /**
     * HỒ SƠ DỰ THẦU CỦA NHÀ THẦU
     * Một yêu cầu sẽ có nhiều nhà thầu tham dự
     */
    details: [{
        type: Schema.Types.ObjectId,
        ref: "bidding_apply"
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