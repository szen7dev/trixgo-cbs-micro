"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 * BÁO CÁO
 * 1. Tạo báo cáo
 * 2. Dựa vào cơ sở và ngày tháng => ra được doanh thu và chi phí
 * 3. Từ đó ra được báo cáo lãi lỗ
 */
module.exports  = DATABASE_MIDDLEWARE("financial_report", {
    //_________Công ty      
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Phần tử cha
    parent: {
        type: Schema.Types.ObjectId,
        ref : "financial_report"
    },
    childs : [{
        type   : Schema.Types.ObjectId,
        ref: 'financial_report'
    }],
    //_________Cơ sở     
    funda: {
        type: Schema.Types.ObjectId,
        ref: 'funda'
    },
    //_________Tên
    name: String,  
    //_________Ghi chú   
    note: String,
    //_________Từ ngày
    fromDate: { type: Date, default: Date.now },
    //_________Tới ngày
    toDate: { type: Date, default: Date.now },
    //_________Doanh thu
    revenue: { type: Number, default: 0 },
    //_________Chi phí
    expense: { type: Number, default: 0 },
    //_________Lợi nhuận
    profit: { type: Number, default: 0 },
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