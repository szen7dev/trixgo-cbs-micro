"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');

const Schema    = require('mongoose').Schema;
/**
 *  ĐƠN VỊ CƠ SỞ
 * - Cập nhật khu vực
 * - Cập nhật trong/ngoài hệ thống
 * - Cập nhật member
 * - Cập nhật kế hoạch chi hàng tháng
 */
module.exports  = DATABASE_MIDDLEWARE("funda", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Ngày bắt đầu
    initialDay: {
        type: Date,
        default: null
    },
    //_________Tên
    name: String,
    //_________Mô tả
    description: String,
    //_________Mã hiệu
    sign: {
        type: String,
        default: 'Sign' 
    },
    /**
     * Khóa dữ liệu trước khoảng thời gian không cho phép can thiệp:
     * - Thêm mới phiếu
     * - Sửa phiếu
     * - Xóa phiếu
     * - Reset phiếu
     * Chỉ cho phép Admin ứng dụng/Owner được phép
     * BA gồm:
     * - Không cho Tạo mới phiếu nếu ngày hiện tại < Ngày khóa
     * - Không cho show form Sửa phiếu
     * - Khóa các nút bấm ở danh sách phiếu, tìm kiếm phiếu và chi tiết phiếu (áp dụng cho cả CC)
     */
    timeAccountingLock: {
        type: Date,
        default: null
    },
    //_________Phần tử cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "funda"
    },
    level: {
        type: Number,
        default: 1 
    },
    amountChilds: {
        type: Number,
        default: 0
    },
    /**
     * Khu vực
     */
    //_________Địa chỉ
    address: String,
    //_________Tỉnh/Thành phố
    area1: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Huyện/Quận
    area2: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Xã/Phường
    area3: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    /**
     * Phân loại trong hệ thống hoặc nhượng quyền (cập nhật theo funda)
     * 1-Trong hệ thống
     * 2-Nhượng quyền => Setup theo tính chất của Funda
     */
    internal: {
        type: Number,
        default: 1
    },  
    /**
     * Bật chiến dịch truyền thông/marketing
     * 1-Không bật
     * 2-Bật
     */
    campaign: {
        type: Number,
        default: 1
    },  
    /**
     * Tên chiến dịch (type=20)
     * - Gán chiến dịch đang hiện hành để đo lường
     */
    campaignName: {
        type: Schema.Types.ObjectId,
        ref : 'doctype'
    }, 
    /**
     * CẤU TRÚC CHI PHÍ DỰ TRÙ/THÁNG
     */
    //_________Chi phí Food App
    appExpense: { type: Number, default: 0 },
    //_________Chi phí nguyên liệu (%)
    materialExpenseRate: { type: Number, default: 30 },
    //_________Chi phí nguyên liệu (giá trị)
    materialExpense: { type: Number, default: 0 },
    //_________Chi phí thuê mặt bằng
    planExpense: { type: Number, default: 0 },
    //_________Chi phí điện nước, internet
    utilityExpense: { type: Number, default: 0 },
    //_________Chi phí lương nhân viên
    humanExpense: { type: Number, default: 0 },
    //_________Chi phí khác
    otherExpense: { type: Number, default: 0 },
    /**
     * THỐNG KÊ FNB
     */
    //_________Số lượng khách hàng của quán
    numberOfCustomers: { type: Number, default: 0 },
    //_________Số lượng khách hàng cũ
    numberOfOldCustomers: { type: Number, default: 0 },
    //_________Số lượng khách hàng mới
    numberOfNewCustomers: { type: Number, default: 0 },
    //______Tổng doanh số
    total: {
        type: Number,
        default : 0
    },
    //______Thành tiền (đã trừ giảm giá, triết khấu)
    amount: {
        type: Number,
        default : 0
    },
    //______VAT thành tiền
    vatAmount: {
        type: Number,
        default : 0
    },
    //______Số lượng sản phẩm (Không tính với product là Topping)
    numberOfProducts: {
        type: Number,
        default: 0
    },
    //______Số đơn hàng
    numberOfOrders: {
        type: Number,
        default: 0
    },
    //______Tiền mặt
    cash: {
        type: Number,
        default : 0
    },
    //______Số đơn Off
    numberOfOrders1: {
        type: Number,
        default: 0
    },
    //______Số đơn Grab
    numberOfOrders2: {
        type: Number,
        default: 0
    },
    //______Số đơn Shopee
    numberOfOrders3: {
        type: Number,
        default: 0
    },
    //______Số đơn Gojek
    numberOfOrders4: {
        type: Number,
        default: 0
    },
    //______Số đơn Baemin
    numberOfOrders5: {
        type: Number,
        default: 0
    },
    //______Số đơn Loship
    numberOfOrders6: {
        type: Number,
        default: 0
    },
    //______Số đơn Bee
    numberOfOrders7: {
        type: Number,
        default: 0
    },
    total1: {
        type: Number,
        default : 0
    },
    total2: {
        type: Number,
        default : 0
    },
    total3: {
        type: Number,
        default : 0
    },
    total4: {
        type: Number,
        default : 0
    },
    total5: {
        type: Number,
        default : 0
    },
    total6: {
        type: Number,
        default : 0
    },
    total7: {
        type: Number,
        default : 0
    },
    /**
     * PHÂN QUYỀN TRUY CẬP
     */
    admins: [{
        type: Schema.Types.ObjectId,
        ref : "user"
    }],
    members: [{
        type: Schema.Types.ObjectId,
        ref : "user"
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
    },
})