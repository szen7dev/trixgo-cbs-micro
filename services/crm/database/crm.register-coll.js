"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("crm_register", {
    //________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Mã khách đăng ký
    contact: {
        type: Schema.Types.ObjectId,
        ref : "contact"
    },
    /**
     * Phân loại
     * 1-Đăng ký mẫu dùng thử
     * 2-Đăng ký cộng tác viên/Nhà bán hàng
     * 3-Đăng ký chia sẻ câu chuyện
     */
    type: {
        type: Number,
        default: 1
    },
    //________Trạng thái (1-Active|2-Hủy)
    status: {
        type: Number,
        default: 1
    },
    //________Nội dung
    name: String,
    namecv: String,
    //_______Ngày sinh
    birthday: { type: Date, default: Date.now },
    //________Điện thoại
    phone: String,
    //________Email
    email: String,
    //________Liên hệ
    address: String,
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