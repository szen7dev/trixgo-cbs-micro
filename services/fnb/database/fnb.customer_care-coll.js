"use strict";
/**
 * CHĂM SÓC KHÁCH HÀNG
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("fnb_customer_care", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Đơn vị cơ sở/Cửa hàng
    funda: {
        type: Schema.Types.ObjectId,
        ref : "funda"
    },
    //_________Đơn hàng gặp lỗi (add lỗi theo từng đơn hàng)
    order: {
        type: Schema.Types.ObjectId,
        ref : "fnb_order"
    },
    //_________Mã khách (để biết các lỗi mà hay gặp ở khách để sau lưu ý)
    customer: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    //_________Lỗi mắc phải
    mistake: {
        type: Schema.Types.ObjectId,
        ref: "doctype"
    },
    //_________Kênh bán hàng
    salesChannel: {
        type: Schema.Types.ObjectId,
        ref: "doctype"
    },
    //_________Người quản lý (lấy từ funda)
    manager: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    //_________Nội dung sự việc
    name: String,
    //_________Diễn giải/cách xử lý
    description: String,
    //_________Ghi chú
    note: String,
    //_________Đánh giá của khách (1-5*)
    rating: {
        type: Number,
        default: 1
    },
    //_________Giá trị bồi thường cho khách
    amount: {
        type: Number,
        default: 0
    },
    /**
     * Tình trạng xử lý
     * 1-Chưa xử lý
     * 2-Hoàn thành
     */
    status: {
        type: Number,
        default: 1
    },
    //_________File/ảnh đính kèm
    files: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
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