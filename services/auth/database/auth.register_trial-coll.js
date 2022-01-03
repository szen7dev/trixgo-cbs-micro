"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * KHÁCH HÀNG ĐĂNG KÝ TRẢI NGHIỆM
 */
module.exports  = DATABASE_MIDDLEWARE("register_trial", {
    //_______Họ và tên
    fullname: String,

    //_______công ty/tổ chức
    organization: {
        type: Schema.Types.ObjectId,
        ref: "company"
    },
    
    //_______Loại hình doanh nghiệp(1-Doanh nghiệp/2-Cơ quan hành chính công/3-Đại học, cao đẳng/ 4- Khác)
    type: { 
        type: Number, default: 1,
    },

    //_______email
    email: String,

    //_______Số điện thoại
    phone: String,

    //_______Ghi chú
    note: String,
})
