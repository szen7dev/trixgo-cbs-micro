"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("company", {
    //_________Tên công ty
    name: String,
    /**
     * xem thông tin file https://docs.google.com/spreadsheets/d/1jIOpvNxEaVx1kuKIkgQ9BRrex_3m6CIa31X2TPUkvM8/edit#gid=1029627505&range=D15
     */
    platform:{
        type: Number,
        enum: [1, 2]
    },
    //_________Ký hiệu công ty không được bỏ trống, không được trùng
    sign: {
        type   : String,
    },
    //_________Mã số thuế công ty
    taxid: String,
    //_________Sử dụng để gửi tin nhắn
    phone: String,
    //_________Email
    email: String,
    //_________Lĩnh vực hoạt động (SẼ BỎ KHÔNG DÙNG)
    field: {
        type   : Number,
        default: 1 //ko thuộc lĩnh vực nào
    },
    //_________Lĩnh vực hoạt động (NEW)
    type: [{
        type: Schema.Types.ObjectId,
        ref : "doctype"
    }],
    //_________Quy mô hoạt động
    scale: { type   : Number, default: 1 },
    //_________Địa chỉ công ty
    address: String,
    //_________Khu vực (Tỉnh thành/Quận huyện/Phường xã)
    area: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Slogan công ty
    slogan: String,
    //_________Mô tả
    description: String,
    //_________Giới thiệu về công ty
    intro: String,
    //_________Website
    website: String,
    //_________Ảnh bìa
    cover: {
        type: String,
        defautl: 'cover_default.png'
    },
    //_________Logo
    image: {
        type: String,
        defautl: 'company_default.png'
    },
    //_________Cho phép hiển thị thông tin (0/1)
    show: {
        type   : Number,
        default: 0 
    },
    //_________Admin công ty
    owners: [
        {
            type: Schema.Types.ObjectId,
            ref : 'user'
        }
    ],
    //_________Supporter của hệ thống phụ trách
    supporters: [
        {
            type: Schema.Types.ObjectId,
            ref : 'user'
        }
    ],
    //_________Thời gian bắt đầu tham gia Trixgo
    timeActive: {
        type: Date,
        default: Date.now
    },
    /**
     * BÁO CÁO QUẢN TRỊ
     */
    //_________Cho phép các thành viên công ty khác xem Báo cáo quản trị tài chính
    adreport: [{
        type: Schema.Types.ObjectId,
        ref : 'user'
    }],
    //_________Cho phép các thành viên công ty khác xem Báo cáo nhân sự
    humanreport: [{
        type: Schema.Types.ObjectId,
        ref : 'user'
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
});