"use strict";
/**
 * QUẢN LÝ LỖI GẶP PHẢI CỦA CÁC ĐƠN HÀNG
 * 1-Lỗi do kiểm soát nội bộ phát hiện ra
 * 2-Lỗi do khách hàng phát hiện ra
 * 2.1-Nằm theo đơn hàng
 * 2.2-Nằm theo từng sản phẩm cụ thể
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
    //_________Lỗi mắc phải (type=19: cập nhật sau khi tạo đơn)
    mistake: {
        type: Schema.Types.ObjectId,
        ref: "doctype"
    },
    //_________Đơn hàng gặp lỗi (add lỗi theo từng đơn hàng)
    order: {
        type: Schema.Types.ObjectId,
        ref : "fnb_order"
    },
    //_________Sản phẩm gặp lỗi (add lỗi theo từng sản phẩm)
    product: {
        type: Schema.Types.ObjectId,
        ref : "fnb_product"
    },
    /**
     * PHÂN LOẠI ĐỂ KIỂM SOÁT LỖI
     */
    /**
     * Phân loại lỗi
     * 1-Do hệ thống kiểm soát phát hiện
     * 2-Do khách hàng phát hiện
     */
    type: {
        type: Number,
        default: 1
    },
    /**
     * Người mắc lỗi
     */
    executor: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    //_________Mã khách (để biết các lỗi mà hay gặp ở khách để sau lưu ý)
    customer: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    //_________Phân loại trong hệ thống hoặc nhượng quyền
    internal: {
        type: Number,
        default: 1
    },
    //_________Tỉnh/Thành phố (lấy theo orderID)
    area1: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Huyện/Quận (lấy theo orderID)
    area2: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Xã/Phường (lấy theo orderID)
    area3: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Mùa trong năm (theo lịch âm)
    seasons: {
        type: Number,
        default: 1
    },
    //_________Ca làm việc
    shift: {
        type: Schema.Types.ObjectId,
        ref: "fnb_shift"
    },
    //_________Phân loại ca làm việc (cập nhật theo funda)
    shiftType: {
        type: Number,
        default: 1
    },
    //_________Phân loại kênh bán hàng
    salesChannel: {
        type: Number,
        default: 1
    },
    //_________Hình thức phục vụ
    service: {
        type: Number,
        default: 1
    },
    //_________Ghi chú xử lý lỗi
    note: String,
    /**
     * Tình trạng xử lý
     * 1-Khởi tạo ghi nhận
     * 2-Hoàn thành
     */
    status: {
        type: Number,
        default: 1
    },
    /**
     * Phạt lỗi
     */
    amount: {
        type: Number,
        default: 0
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