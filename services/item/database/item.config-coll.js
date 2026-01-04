"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 * CẤU HÌNH MÔI TRƯỜNG
 * - Biến môi trường cho Zalo OA
 * - Biến môi trường cho Facebook
 * ...
 */
module.exports  = DATABASE_MIDDLEWARE("config", {
    //_________Công ty của user đang truy cập
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    /**
     * Tên/mô tả
     */
    name: String,
    //_________Trạng thái (1-Hoạt động|2-Hủy)
    status: { type: Number, default: 1 },
    /**
     * Phân loại cấu hình
     * Mỗi type ứng với 1 companyID thì chỉ có 1 mẩu tin duy nhất
     * 1-ZNS (Zalo)
     * 2-Facebook
     * 3-Contact công ty
     *
     */
    type: { type: Number, default: 1 },
    /**
     * ID kênh:
     * ZALO_OA_APP_ID
     * FACEBOOK_PAGE_ID
     * ...
     */
    channel: String,
    /**
     * ID template sử dụng:
     * templateId (ZaloOA)
     * clientId (Facebook)
     */
    template: String,
     /**
     * secretKey
     * ...
     */
    secretKey: String,
    /**
     * key
     * ...
     */
    key: String,
    /**
     * tokenKey
     * ...
     */
    tokenKey: String,
    refreshToken: String,
    //_________Điện thoại
    hotline1: String,
    //_________Điện thoại
    hotline2: String,
    //_________Điện thoại
    hotline3: String,
    //_________Social
    youtube: String,
    //_________Social
    facebook: String,
    //_________Zalo OA
    zalo: String,
    //_________TikTok
    tiktok: String,
    //_________Shopee
    shopee: String,
    //_________Address
    address: String,
    //_________phone
    phone: String,
    //_________email
    email: String,
    //_________email bod
    email1: String,
    //_________email taichinh
    email2: String,
    //_________email cskh
    email3: String,
    //_________email man
    email4: String,
    //_________email Xem giá phiếu kho
    email5: String,
    //_________content
    content: String,
    //_________registration
    registration: String,
    //_________note
    note: String,
    //_________QR1 (app Mobile)
    qrcode1: {
        type: Schema.Types.ObjectId,
        ref: "file"
    },
    //_________QR2 (Zalo OA)
    qrcode2: {
        type: Schema.Types.ObjectId,
        ref: "file"
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    /**
     * Tình trạng
     * 1-Hoạt động (cấu hình chính-1 công ty có thể có nhiều kênh/biến)
     * 2-Tạm dừng
     */
    active: { type: Number, default: 1 },
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
