"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("crm_combo", {
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
    status: {
        type: Number,
        default: 1
    },
    //_______Ngày sinh
    birthday: { type: Date, default: Date.now },
    //_________Giới tính(1-nam/ 2 - nữ/3-khác)
    gender: { type: Number, default: 1 },
    //_________Chiều cao (cm)
    height: { type: Number, default: 0 },
    //_________Cân nặng (kg)
    weight: { type: Number, default: 0 },
    //________Nội dung
    name: String,
    namecv: String,
    //________Điện thoại liên hệ
    phone: String,
    //________Ghi chú
    note: String,
    //_________File/ảnh đính kèm
    files: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
    userCreate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    }
})