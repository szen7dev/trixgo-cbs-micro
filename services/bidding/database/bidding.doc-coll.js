"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * HỒ SƠ GÓI THẦU
 */
module.exports  = DATABASE_MIDDLEWARE("bidding_doc", {
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
    //_________Nhà thầu trúng thầu
    bidder: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Công việc phát hành hồ sơ mời thầu
    task: {
        type: Schema.Types.ObjectId,
        ref : "pcm_plan_task"
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