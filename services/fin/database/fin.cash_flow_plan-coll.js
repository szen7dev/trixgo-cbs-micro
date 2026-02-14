"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * KẾ HOẠCH DÒNG TIỀN
 */
module.exports  = DATABASE_MIDDLEWARE("cash_flow_plan", {
    //_________Công ty (*)
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Đơn vị cơ sở (*)
    funda : {
        type: Schema.Types.ObjectId,
        ref : "funda"
    },
    //_________
    parent: {
        type: Schema.Types.ObjectId,
        ref : "cash_flow_plan"
    },
    //_________Admin (được quyền xem, sửa)
    admins : [{
        type   : Schema.Types.ObjectId,
        ref: 'user'
    }],
    //_________Thành viên (được quyền xem)
    members : [{
        type   : Schema.Types.ObjectId,
        ref: 'user'
    }],
    //_________Phân loại khác
    subtype: {
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    },
    //_________Phân loại khác (parent)
    parentSubtype: {
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    },
    //_________Tên(*)
    name: String,
    //_________Ghi chú
    note: String,
    //_________Doanh thu kế hoạch
    revenue: { type: Number, default: 0 },
    //_________Chi phí kế hoạch
    expense: { type: Number, default: 0 },
    //_________Doanh thu thực tế
    actualRevenue: { type: Number, default: 0 },
    //_________Chi phí thực tế
    actualExpense: { type: Number, default: 0 },
    //_________Từ ngày
    fromDate: { type: Date, default: Date.now },
    //_________Tới ngày
    toDate: { type: Date, default: Date.now },
    /**
     * Trạng thái
     * 1-Chưa phê duyệt
     * 2-Đã phê duyệt
     */   
    status: {
        type: Number,
        default: 1
    },
    userCreate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    }
})