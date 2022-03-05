"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * KẾ HOẠCH LỰA CHỌN NHÀ THẦU
 * - Áp dụng cho tất cả các ngành của nền kinh tế, không chỉ xây dựng
 * - Được triển khai trên cơ sở ngân sách được duyệt
 * - 
 */
module.exports  = DATABASE_MIDDLEWARE("bidding_plan", {
    /**
     * THÔNG TIN CHUNG
     */    
    /**
     * Phân loại
     * 1-Hồ sơ gói thầu-Thuộc kế hoạch lựa chọn nhà thầu
     * 1.1-Hồ sơ mời thầu (parent)
     * 1.1.1-Hồ sơ dự thầu (parent)
     * 1.1.1.1-Báo cáo đánh giá (parent)
     */
    type: { type: Number, default: 1 },
    //_________Lĩnh vực
    field: {
        type: Schema.Types.ObjectId,
        ref : "datahub_type"
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
    /**
     * THÔNG TIN GÓI THẦU
     */    
    //_________Hồ sơ cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "bidding_plan"
    },
    level: {
        type: Number,
        default: 1
    },
    //_________Tên gói thầu
    name: String,
    //_________Ký hiệu gói thầu
    sign: String,
    //_________Ghi chú
    note: String,
    /**
     * Trạng thái
     * 1-Chưa thực hiện
     * 2-Đang triển khai
     * 3-Đã hoàn thành
     */
    status: { type: Number, default: 1 },
    //_________Kế hoạch bắt đầu chọn
    startTime: { type: Date, default: null },
    //_________Kế hoạch kết thúc chọn
    finishTime: { type: Date, default: null },
    //_________Thực tế bắt đầu chọn
    actualStartTime: { type: Date, default: null },
    //_________Thực tế kết thúc chọn
    actualFinishTime: { type: Date, default: null },
    //_________Hình thức lựa chọn nhà thầu
    form: { type: Number, default: 1 },
    //_________Loại hợp đồng
    contractType: { type: Number, default: 1 },
    //_________Thời gian thực hiện hợp đồng theo mời thầu (ngày)
    duration: { type: Number, default: 0 },
    //_________Progress tiến trình (%)
    progress: { type: Number, default: 0 },   
    /**
     * THÔNG TIN NHÀ THẦU
     */
    //_________Nhà thầu trúng thầu
    bidder: {
        type: Schema.Types.ObjectId,
        ref : "company"
    }, 
    //_________Giá trúng thầu
    tenderPrice: { type: Number, default: 0 },  
    //_________VAT
    tenderPriceAT: { type: Number, default: 0 },
    //_________Link tới hợp đồng
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
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