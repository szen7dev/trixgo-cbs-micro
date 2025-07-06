"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("crm_survey_result", {
    //________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Mã khách
    contact: {
        type: Schema.Types.ObjectId,
        ref : "contact"
    },
    //________Trạng thái (1-Active|2-Hủy)
    status: { type: Number, default: 1 },
    //_________Trải nghiệm khách hay gặp
    cx: {
        type: Schema.Types.ObjectId,
        ref: "doctype",
    },
    /**
     * Kết quả khảo sát
     * 1-Có
     * 2-Không
     */
    result: { type: Number, default: 1 },
    //________Tên
    name: String,
    //________Điện thoại
    phone: String,
    //________Địa chỉ
    address: String,
    //________Ghi chú
    note: String,
    // //_________File/ảnh đính kèm
    // files: [{
    //     type: Schema.Types.ObjectId,
    //     ref: "file"
    // }],
    userCreate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    }
})