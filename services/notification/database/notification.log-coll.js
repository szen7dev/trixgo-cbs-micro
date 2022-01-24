"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("notification_log", {
    /**
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
     * -1: Đã tạo, chưa gửi 
     *  1: Đã gửi THÀNH CÔNG
     *  2: Đã gửi THẤT BẠI
     *  3: Đã xem thông báo
     */
    status: {
        type: Number
    },
    /**
     * Thuộc dự án, phòng ban nào (option)
     */
    project: {
        type: Schema.Types.ObjectId,
        ref: 'department'
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    title: {
        type: String
    },
    content: {
        type: String
    },
    path: {
        type: String
    }
})