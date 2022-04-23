"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * HỒ SƠ YÊU CẦU, MỜI THẦU
 */
module.exports  = DATABASE_MIDDLEWARE("bidding_apply", {
    /**
     * HỒ SƠ DỰ THẦU
     */
    //_________Tên hồ sơ dự thầu
    name: String,
    //_________Nhà thầu dự thầu
    contractor: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Người thực hiện chào thầu
    assignee: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },    
    //_________Hồ sơ mời thầu
    plan: {
        type: Schema.Types.ObjectId,
        ref : "bidding_plan"
    },
    //_________Của chủ đầu tư
    client: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Những người liên quan
    related: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    //_________Những người đã xem
    viewedUsers: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    /**
     * NỘP THẦU
     */
    //_________Người nộp thầu
    approver:{
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    //_________Thời điểm nộp thầu
    timeApproved: { type: Date, default: null },
    //_________Giá dự thầu
    bidPrice: { type: Number, default: 0 },
    //_________Giảm giá dự thầu
    bidPriceDiscount: { type: Number, default: 0 },
    //_________Giá dự thầu thừa/thiếu
    bidPriceAdjustment: { type: Number, default: 0 },
    /**
     * MỞ THẦU
     */
    //_________User đồng ý mở thầu
    openedUsers: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
     /**
     * Trạng thái mở thầu (0/1)
     * 0-Chưa mở
     * 1-Đã mở
     */
    openedStatus: { type: Number, default: 0 },
    /**
     * THÀNH PHẦN HỒ SƠ DỰ THẦU
     */
    //_________Thuộc hồ sơ dự thầu nào
    parent: {
        type: Schema.Types.ObjectId,
        ref: "bidding_apply"
    },
    /**
     * Phân loại
     * 1-Bảng dữ liệu
     * 2-Năng lực nhân sự
     * 3-Năng lực thiết bị
     * 4-Giải pháp tổ chức thực hiện
     */
    type: { type: Number, default: 1 },
    //_________Dự thầu ứng với yêu cầu nào
    request: {
        type: Schema.Types.ObjectId,
        ref : "bidding_request"
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