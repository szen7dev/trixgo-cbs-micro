"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * NGÂN SÁCH DỰ ÁN/GÓI THẦU
 * - Phục vụ làm Tư vấn giá
 */
module.exports  = DATABASE_MIDDLEWARE("bidding_doc", {
    /**
     * Phân loại
     * 1-Hồ sơ gói thầu-Thuộc kế hoạch lựa chọn nhà thầu
     * 2-Hồ sơ mời thầu (parent)
     * 3-Hồ sơ dự thầu (parent)
     * 4-Báo cáo đánh giá (parent)
     */
    type: { type: Number, default: 1 },
    //_________Công việc cha | Công việc chứa checklist
    parent: {
        type: Schema.Types.ObjectId,
        ref: "pcm_plan_task"
    },
    level: {
        type: Number,
        default: 1
    },
    //_________Khu vực
    area: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Chủ đầu tư
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    }, 
    //_________Dự án
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },
    //_________Nhà thầu trúng thầu (sau thay cho Task)
    bidder: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Tên
    name: String,
    //_________Ký hiệu
    sign: String,
    //_________Ghi chú
    note: String,
    /**
     * HỆ SỐ CHI PHÍ (%)
     */
    //_________Chi phí trực tiếp khác
    factor1: { type: Number, default: 0 },
    //_________Chi phí chung
    factor2: { type: Number, default: 0 },
    //_________Chi phí nhà tạm để ở/Điều hành thi công
    factor3: { type: Number, default: 0 },
    //_________Chi phí khác
    factor4: { type: Number, default: 0 },
    //_________Lợi nhuận
    factor5: { type: Number, default: 0 },
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