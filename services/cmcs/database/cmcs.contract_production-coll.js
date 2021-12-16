"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("contract_production", {

    //_________ Công ty(*)
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },

    //_________ Dự án(*)
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },

    //_________Hợp đồng(*)
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
    },
    
    //_________Tên(*)
    name: String,
    
    //_________Ký hiệu
    sign: String,

    //_________Mô tả
    description: String,

    //_________Ngày hoạch toán(*)
    date: { type: Date, default: Date.now },

    /**
     * Sản lượng thực hiện
     */
   
    //_________Sản lượng trước VAT
    produce: { type: Number, default: 0 },

    //_________Sản lượng phần VAT
    vatProduce: { type: Number, default: 0 },

    //_________Sản lượng phát sinh trước VAT
    plusProduce: { type: Number, default: 0 },

    //_________Sản lượng phát sinh phần VAT
    vatPlusProduce: { type: Number, default: 0 },
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