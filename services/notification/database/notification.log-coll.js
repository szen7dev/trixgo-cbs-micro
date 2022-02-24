"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("notification", {
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
    //_________Key để xử lý ngôn ngữ (services\notification\helper\notification.keys-constant.js)
    languageKey: {
        type: String 
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
    /**
     * Đường dẫn truy cập
     * - Phục vụ cho web => truy cập vào thông tin chi tiết
     * (/pcm/home/?taskID=60cc5c65e8e09d4502f4f95b&commentID=6216fe36687c3f576b9ddc12)
     * - Phục vụ cho app => truy cập vào thông tin chi tiết
     * (Làm việc với Tuấn)
     */
    path: {
        type: String
    },
    /**
     * Format: (áp dụng cho mobile)
     * {
     *      app: "",
     *      taskID: ""
     * }
     */
    routers: {
        type: Schema.Types.Mixed
    }
})