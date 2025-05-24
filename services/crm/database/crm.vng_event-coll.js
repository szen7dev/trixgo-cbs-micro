"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("crm_vng_event", {
    //________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_______Ngày
    date: { type: Date, default: Date.now },
    //________Nội dung
    name: String,
    namecv: String,
    //________Địa chỉ
    address: String,
    //______Thu
    income: {
        type: Number,
        default : 0
    },
    //______Chi
    expense: {
        type: Number,
        default : 0
    },
    //________Ghi chú
    note: String,
    //_________Hình ảnh
    images: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
    /**
     * Trạng thái
    * 1-Hoạt động
     *2-Hủy
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