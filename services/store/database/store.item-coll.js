"use strict";
/**
 * QUẢN LÝ SẢN PHẨM
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("store_item", {
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
    //_________Thuộc lô
    lot: {
        type: Schema.Types.ObjectId,
        ref : "store_lot"
    },
    //_________Link sản phẩm
    goods: {
        type: Schema.Types.ObjectId,
        ref : "goods"
    },
    //_________Ngày
    date: { type: Date, default: Date.now },
    //_________Thời hạn
    expired: Date,
    //_________Nội dung
    name: String,
    namecv: String,
    //_________Mã hiệu
    sign: String,
    //_________Ghi chú
    note: String,
    //_________Trạng thái kích hoạt: 1 chưa, 2 kích hoạt
    status: { type: Number, default: 1 },
    //_________Ngày kích hoạt
    activationDate: Date,
    //_________Họ và tên khách
    customerName: String,
    //_________Số điện thoại khách
    customerPhone: String,
    //_________Giá mua
    amount: { type: Number, default: 0 },
    //_________Tỉnh
    area1: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Huyện
    area2: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Xã
    area3: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    /**
     * Các phân loại
     */
    //_________Kênh bán hàng: 1-TikTok, 2-Shopee, 3-Facebook, 4-Website, 5-Nhà thuốc
    channelType: { type: Number, default: 1 },
    //_________Lý do khách mua hàng: 1-Giải pháp/sản phẩm tốt, 2-Dịch vụ tốt, 3-Bạn bè giới thiệu
    reasonType: { type: Number, default: 1 },
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