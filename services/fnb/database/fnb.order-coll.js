"use strict";
/**
 * ORDER
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("fnb_order", {
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
    /**
     * CẤU TRÚC ĐỆ QUY
     */
    //_________Cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "fnb_order"
    },
    level: {
        type: Number,
        default: 1
    },
    /**
     * THÔNG TIN
     */
    /**
     * Ca làm việc
     * 1-Sáng
     * 2-Chiều
     * 3-Tối
     */
    shift: {
        type: Number,
        default: 1
    },
    //_________Lỗi mắc phải (type=19)
    mistake: {
        type: Schema.Types.ObjectId,
        ref: "doctype"
    },
     /**
     * Phân loại trong hệ thống hoặc nhượng quyền
     * 1-Trong hệ thống
     * 2-Nhượng quyền => Setup theo tính chất của Funda
     */
    internal: {
        type: Number,
        default: 1
    },   
    /**
     * Phân loại kênh bán hàng
     * 1-Offline
     * 2-Grab
     * 3-Shopee
     * 4-Gojek
     * 5-Baemin
     * 6-Loship
     */
    salesChannel: {
        type: Number,
        default: 1
    },
    /**
     * Phương thức thanh toán
     * 1-Tiền mặt
     * 2-Chuyển khoản
     */
    paymentMethod: {
        type: Number,
        default: 1
    },
    //_________Mã khách
    customer: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    //_________Nội dung
    name: String,
    //_________Mã hiệu
    sign: String,
    //_________Mã đơn app
    appOrderSign: String,
    //_________Đơn vị tính (***cân nhắc bỏ qua)
    // unit: String, 
    //_________Ghi chú
    note: String,
    //_________Số lượng sản phẩm
    numberOfProducts: {
        type: Number,
        default: 1
    },
    //_________Danh mục sản phẩm
    products: [{
        type: Schema.Types.ObjectId,
        ref: "fnb_product"
    }],
    /**
     * GIÁT TRỊ
     */
    // //______Khối lượng
    // quantity: {
    //     type: Number,
    //     default : 0
    // },
    // //______Đơn giá
    // unitPrice: {
    //     type: Number,
    //     default : 0
    // },
    // //______VAT đơn giá
    // vatUnitPrice: {
    //     type: Number,
    //     default : 0
    // },
    //______Thành tiền
    amount: {
        type: Number,
        default : 0
    },
    //______VAT thành tiền
    vatAmount: {
        type: Number,
        default : 0
    },
    /**
     * QUẢN LÝ THÔNG BÁO
     */
    /**
     * Những người được quyền truy cập
     * 1-author (khi tạo việc xong thì add vào)
     * 2-members của funda (thành viên đơn vị cơ sở)
     */
    accessUsers: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    /**
     * Những user chưa xem công việc
     * - Sẽ thêm user khi có thông báo mới => Chưa xem
     * - Sẽ xóa user khi bấm xem => Đã xem
     */
    news: [{
        type: Schema.Types.ObjectId,
        ref: "user"
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