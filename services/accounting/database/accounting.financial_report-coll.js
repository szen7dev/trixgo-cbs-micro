"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 * BÁO CÁO
 */
module.exports  = DATABASE_MIDDLEWARE("financial_report", {
    //_________Công ty      
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Cơ sở     
    funda: [{
        type: Schema.Types.ObjectId,
        ref: 'funda'
    }],
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