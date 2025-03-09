"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_tag", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //________Trạng thái (1-Active|2-Hủy)
    status: {
        type: Number,
        default: 1
    },
    /**
     * Phân loại
     */
    type: {
        type: Number,
        default: 1
    },
    //_________Tên
    name: String,
    //_________Slug/URL
    slug: String,
    //_________Thời hạn
    expired: Date,
    //________Ghi chú
    note: String,
    //_________Hình ảnh
    images: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
    userCreate: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref: "user"
    }
})   