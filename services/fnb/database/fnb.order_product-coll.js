"use strict";
/**
 * ORDER_PRODUCT
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("fnb_order_product", {
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
    //_________Sản phẩm
    product: {
        type: Schema.Types.ObjectId,
        ref : "fnb_product"
    },
    //_________Sản phẩm phụ/Topping kèm theo
    subProducts: [{
        type: Schema.Types.ObjectId,
        ref : "fnb_product"
    }],
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
     * THÔNG TIN PHÂN LOẠI (LẤY TỪ ORDER)
     */
    /**
     * Phân loại khách hàng
     * 1-Học sinh
     * 2-Sinh viên
     * 3-Phụ nữ
     * 4-Đàn ông
     * 5-Người lớn (phụ nữ + đàn ông)
     */
    customerType: {
        type: Number,
        default : 1
    },
    //_________Mã khách (để biết khách hay dùng đồ gì)
    customer: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    //_________Phân loại trong hệ thống hoặc nhượng quyền
    internal: {
        type: Number,
        default: 1
    },
    //_________Tỉnh/Thành phố (lấy theo Funda)
    area1: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Huyện/Quận (lấy theo Funda)
    area2: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Xã/Phường (lấy theo Funda)
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
    //_________Phương thức thanh toán
    paymentMethod: {
        type: Number,
        default: 1
    },
    /**
     * Có up size hay không
     * 1-Không upsize
     * 2-Có upsize
     */
    upsize: {
        type: Number,
        default: 1
    },
    /**
     * Có thêm topping hay không
     * 1-Không topping
     * 2-Có topping
     */
    topping: {
        type: Number,
        default: 1
    },
    //_________Ghi chú
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