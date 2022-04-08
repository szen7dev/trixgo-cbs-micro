"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');

const Schema    = require('mongoose').Schema;
/**
 * HỢP ĐỒNG KINH TẾ
 * NGÂN SÁCH DỰ ÁN => VỚI CHỦ ĐẦU TƯ (HỢP ĐỒNG MUA VÀO)
 * NGÂN SÁCH HỢP ĐỒNG/THẦU PHỤ => VỚI NHÀ THẦU (HỢP ĐỒNG BÁN RA)
 */
module.exports  = DATABASE_MIDDLEWARE("budget", {
    /**
     * Phân loại
     * 1-Ngân sách cho chiến dịch
     * 2-Ngân sách cho dự án
     * 3-Ngân sách cho hợp đồng
     */
    type: { type: Number, default: 1, enum: [1,2,3] },    
    //_________Công ty 
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Dự án/phòng ban (Thuộc dự án)
    project: {
        type: Schema.Types.ObjectId,
        ref : "department",
    },
    //_________Hợp đồng
    contract: {
        type: Schema.Types.ObjectId,
        ref: "contract"
    },
    //_________Quản trị
    admins: [{
        type: Schema.Types.ObjectId,
        ref : "user"
    }],
    //_________Thành viên
    members: [{
        type: Schema.Types.ObjectId,
        ref : "user"
    }],
    /**
     * THÔNG TIN KHÁC
     */
    //_________Tên (Tên hợp đồng)
    name: String,
    //_________Mã hiệu
    sign: String,
    //_________Mô tả
    description: String,
    //_________Ghi chú
    note: String,
    //_________Khóa cập nhật(1-Open/2-Khóa)
    lock: { type: Number, default: 1 },
    /**
     * DOANH THU
     */
    //______Doanh thu
    revenue: {
        type: Number,
        default : 0
    },
    //______Doanh thu VAT
    vatRevenue: {
        type: Number,
        default : 0
    },
    //______Dự báo doanh thu tới khi kết thúc
    forecastRevenue: {
        type: Number,
        default : 0
    },
    //______VAT
    forecastVatRevenue: {
        type: Number,
        default : 0
    },
    //______Doanh thu thực tế
    finalRevenue: {
        type: Number,
        default : 0
    },
    //______VAT
    finalVatRevenue: {
        type: Number,
        default : 0
    },
    /**
     * NGÂN SÁCH/CHI PHÍ
     */
    //_________Ngân sách/Tổng mức đầu tư/Chi phí
    budget: {
        type   : Number,
        default: 0
    },
    //_________VAT
    vatBudget: {
        type   : Number,
        default: 0
    },
    //______Dự báo ngân sách
    forecastBudget: {
        type: Number,
        default : 0
    },
    //______VAT
    forecastVatBudget: {
        type: Number,
        default : 0
    },    
    //______Ngân sách thực tế
    finalBudget: {
        type: Number,
        default : 0
    },
    //______VAT
    finalVatBudget: {
        type: Number,
        default : 0
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