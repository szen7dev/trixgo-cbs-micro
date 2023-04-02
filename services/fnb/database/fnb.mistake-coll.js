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
    /**
     * Phân loại lỗi
     * 1-Hệ thống phát hiện
     * 2-Khách hàng phát hiện
     */
    type: {
        type: Number,
        default: 1
    },
    //_________Lỗi mắc phải (type=19: cập nhật sau khi tạo đơn)
    mistake: {
        type: Schema.Types.ObjectId,
        ref: "doctype"
    },
    //_________Người mắc lỗi
    executor: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    //_________Lần mắc lỗi/cùng một lỗi
    number: {
        type: Number,
        default: 1
    },
    //_________Ghi chú xử lý lỗi
    note: String,
    /**
     * Tình trạng xử lý
     * 1-Chưa xử lý
     * 2-Hoàn thành
     */
    status: {
        type: Number,
        default: 1
    },
    //_________Giá trị phạt
    amount: {
        type: Number,
        default: 0
    },
    //_________Giá trị thưởng
    bonus: {
        type: Number,
        default: 0
    },
    /**
     * KPI NHÂN VIÊN TRONG THÁNG
     */
    //_________Tháng
    month: {
        type: Number,
        default: 0
    },
    //_________Năm
    year: {
        type: Number,
        default: 0
    },
    //_________Số giờ làm việc trong tháng
    workingHours: {
        type: Number,
        default: 0
    },
    //_________Số lượng sản phẩm trong tháng (cốc)
    quantity: {
        type: Number,
        default: 0
    },
    //_________Số lỗi mắc phải trong tháng
    numberOfMistakes: {
        type: Number,
        default: 0
    },
    /**
     * Điểm số tích lũy trong tháng
     * 1-Theo số giờ làm việc trong tháng x đơn giá
     * 2-Theo số lượng sản phẩm trong tháng x đơn giá
     * 3-Theo số lỗi mắc phải
     */
    score: {
        type: Number,
        default: 0
    },
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
    //_________Mã khách (để biết các lỗi mà hay gặp ở khách để sau lưu ý)
    customer: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    //_________Ca làm việc
    shift: {
        type: Schema.Types.ObjectId,
        ref: "fnb_shift"
    },
    //_________Phân loại trong hệ thống hoặc nhượng quyền
    internal: Number,
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
    seasons: Number,
    //_________Phân loại ca làm việc (cập nhật theo funda)
    shiftType: Number,
    //_________Phân loại kênh bán hàng
    salesChannel: Number,
    //_________Hình thức phục vụ
    service: Number,
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