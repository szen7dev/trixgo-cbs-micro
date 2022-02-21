"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("notification_log", {
    /**
     * PHÂN LOẠI THÔNG BÁO ĐỂ PHỤC VỤ CÁC NHU CẦU KHÁC NHAU
     * 1 - InApp (Socket)
     * 2 - Web Push (Service Worker)
     * 3 - App Push (Cloud Messaging)
     * 4 - Email
     * 5 - SMS
     */
    type: {
        type: Number,
        require: true
    },
    /**
     * QUẢN LÝ TRẠNG THÁI CỦA CÁC THÔNG BÁO
     * -1: Đã tạo, chưa gửi 
     *  1: Đã gửi THÀNH CÔNG
     *  2: Đã gửi THẤT BẠI
     *  3: Đã xem thông báo
     */
    status: {
        type: Number
    },
    //_________Thuộc dự án
    project: {
        type: Schema.Types.ObjectId,
        ref: 'department'
    },
    //_________Người gửi
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    //_________Người nhận
    receiver: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    //_________Tiêu đề
    title: {
        type: String
    },
    //_________Nội dung
    content: {
        type: String
    },
    //_________Đường dẫn truy cập
    path: {
        type: String
    },
    //_________Key để xử lý ngôn ngữ
    key: {
        type: String 
    }  
})