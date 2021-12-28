"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("notification_logs", {
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
     * -1: đã tạo, chưa gửi
     *  1: đã gửi THÀNH CÔNG
     *  2: đã gửi THẤT BẠI
     */
    status: {
        type: Number
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
})