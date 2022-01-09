"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("contract_bill_group", {
    //_________ Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Hợp đồng
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
    },
    //_________Hạng mục
    parent: {
        type: Schema.Types.ObjectId,
        ref : "contract_bill_group"
    },
    /**
     * THÔNG TIN CĂN BẢN
     */
    //_________Tên công việc
    name: String,
    //_________Mô tả
    description: String,
    //_________Ký hiệu
    sign: String,
    //_________Đơn vị tính
    unit: String,
    //_________Ghi chú
    note: String,
    /**
     * THÔNG TIN VỀ GIÁ TRỊ (PRE-CALCULATE FORM JOB)
     */
    //_________Giá trị trước thuế
    amount: { type: Number, default: 0 }, 
    //_________Giá trị thuế
    vat: { type: Number, default: 0 }, 
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