"use strict";
/**
 * QUẢN LÝ LỖI GẶP PHẢI CỦA CÁC ĐƠN HÀNG
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("fnb_mistake", {
    //_________Công ty (Lấy từ orderID)
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Đơn vị cơ sở/Cửa hàng (Lấy từ orderID)
    funda: {
        type: Schema.Types.ObjectId,
        ref : "funda"
    },
    //_________Đơn hàng
    order: {
        type: Schema.Types.ObjectId,
        ref : "fnb_order"
    },
    //_________Lỗi mắc phải (type=19: cập nhật sau khi tạo đơn)
    mistake: {
        type: Schema.Types.ObjectId,
        ref: "doctype"
    },
    /**
     * PHÂN LOẠI ĐỂ KIỂM SOÁT LỖI
     */
    //_________Mã khách (để biết các lỗi mà hay gặp ở khách để sau lưu ý)
    customer: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    //_________Ca làm việc (để biết lỗi hay mắc ở ca nào)
    shift: {
        type: Schema.Types.ObjectId,
        ref: "fnb_shift"
    },
    //_________Phân loại ca sáng/chiều/tối
    shiftType: {
        type: Number,
        default: 1
    },
    //_________Phân loại trong hệ thống hoặc nhượng quyền
    internal: {
        type: Number,
        default: 1
    },   
    //_________Phân loại kênh bán hàng
    salesChannel: {
        type: Number,
        default: 1
    },
    //_________Ghi chú xử lý lỗi
    note: String,
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