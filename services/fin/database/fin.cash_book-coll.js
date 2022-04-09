"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * SỔ QUỸ
 */
module.exports  = DATABASE_MIDDLEWARE("fin.cash_book", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Phần tử cha
    parent: {
        type: Schema.Types.ObjectId,
        ref : "cash_flow_plan"
    },
    //_________Tài khoản kế toán
    account: {
        type: Schema.Types.ObjectId,
        ref: 'account'
    },   
    //_________Mã khách
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'contact'
    },   
    //_________Hợp đồng
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
    },    
    //_________lEVEL
    level: {
        type: Number,
        default: 1,
        enum: [1, 2]
    },
    //_________Admin
    admins : [{
        type   : Schema.Types.ObjectId,
        ref: 'user'
    }],
    //_________Thành viên (được quyền xem)
    members : [{
        type   : Schema.Types.ObjectId,
        ref: 'user'
    }],
    //_________Ngày tháng
    date: Date,
    //_________Tên
    name: String,
    //_________Mã hiệu
    sign: String,
    //_________Ghi chú
    note: String, 
    //_________Thu
    income: { type: Number, default: 0 }, 
    //_________Chi
    expense: { type: Number, default: 0 },     
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