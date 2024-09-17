"use strict";
/**
 * ORDER_GOODS
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("store_order_product", {
    /**
     * THÔNG TIN PHÂN LOẠI (LẤY TỪ ORDER)
     */
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
    //_________Dự án, phòng ban
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },
    //_________Hợp đồng
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
    },
    //_________Kho bãi
    warehouse: {
        type: Schema.Types.ObjectId,
        ref : "warehouse"
    },
    //_________Lĩnh vực kinh doanh
    business: {
        type: Schema.Types.ObjectId,
        ref: "doctype"
    },
    //_________Kênh bán hàng
    channel: {
        type: Schema.Types.ObjectId,
        ref: "doctype"
    },
    //_________Phân loại kênh
    parentChannel: {
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    },
    //_________Đơn hàng
    order: {
        type: Schema.Types.ObjectId,
        ref : "store_order"
    },
    //_________Mã khách
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'contact'
    },
    //_________Tài khoản kế toán
    account: {
        type: Schema.Types.ObjectId,
        ref: 'account'
    },
    //_________Vật tư, thiết bị, công cụ dụng cụ
    goods: {
        type: Schema.Types.ObjectId,
        ref : "goods"
    },
    //_________Tài sản/thiết bị dùng để quản lý sửa chữa, tiêu hao
    assets: {
        type: Schema.Types.ObjectId,
        ref : "goods"
    },
    //________Link với ngân sách
    work: {
        type: Schema.Types.ObjectId,
        ref : "budget_work"
    },
    /**
     * Phân loại vào ra
     * 1-Bán ra/Xuất kho
     * 2-Mua vào/Nhập kho
     */
    outin: { type: Number, default: 1 },
    /**
     * Phân loại
     * 1. Mặc định
     * 2. Vật tư chính
     * 3. Vật tư phụ
     * 4. Công cụ dụng cụ
     * 5. Hàng hóa/Cấu kiện/Thành phẩm
     * 6. Văn phòng phẩm
     * 7. Quỹ tiền mặt
     * 8. Quỹ ngân hàng
     */
    type: {
        type: Number,
        default : 1
    },
    /**
     * Trạng thái đơn
     * 1-Khởi tạo
     * 2-Chờ Ship lấy hàng/Mang hàng tới Ship
     * 3-Đang vận chuyển/giao hàng
     * 4-Giao không thành công
     * 5-Đã giao/Hoàn thành
     * 6-Hủy bỏ
     * 7-Trả hàng/Hoàn tiền
     */
    status: {
        type: Number,
        default: 5
    },
    //_________Ngày tháng
    date: { type: Date, default: Date.now },
    //_________Tên
    name: String,
    namecv: String,
    //_________Mã hiệu
    sign: String,
    //_________Ghi chú
    note: String,
    //______Khối lượng/Số lượng
    quantity: {
        type: Number,
        default : 1
    },
    //______Đơn giá
    unitPrice: {
        type: Number,
        default : 0
    },
    //______Thành tiền
    amount: {
        type: Number,
        default : 0
    },
    /**
     * Sản phẩm phụ
     */
    subGoods: [{
        type: Schema.Types.ObjectId,
        ref : "goods"
    }],
    /**
     * DÀNH CHO ĐỒ UỐNG
     */
    /**
     * Màu sắc
     * 1-Đen
     * 2-Trắng
     */
    black: {
        type: Number,
        default : 1
    },
    /**
     * Kích cỡ
     * 1-Size M
     * 2-Size L
     */
    size: {
        type: Number,
        default : 1
    },
    /**
     * Đường
     * 1-100
     * 2-70
     * 3-50
     * 4-30
     * 5-0
     */
    sugar: {
        type: Number,
        default : 1
    },
    /**
     * Đá
     * 1-100
     * 2-70
     * 3-50
     * 4-30
     * 5-0
     */
    ice: {
        type: Number,
        default : 1
    },
    /**
     * THÔNG TIN GIÁ TRỊ
     */
    //______Khối lượng/Số lượng
    quantity: {
        type: Number,
        default : 1
    },
    //______Đơn giá
    unitPrice: {
        type: Number,
        default : 0
    },
    //______Thành tiền
    amount: {
        type: Number,
        default : 0
    },
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