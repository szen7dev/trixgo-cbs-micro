"use strict";
/**
 * PRODUCT
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
    //_________Mã khách (để biết khách hay dùng đồ gì)
    customer: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    //_________Ca làm việc
    shift: {
        type: Schema.Types.ObjectId,
        ref: "fnb_shift"
    },
    //_________Có up size hay không-Thông kê doanh số (1/2)
    upsize: {
        type: Number,
        default: 1
    },
    //_________Có thêm topping hay không-Thống kê doanh số (1/2)
    topping: {
        type: Number,
        default: 1
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
    //_________Phương thức thanh toán
    paymentMethod: {
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