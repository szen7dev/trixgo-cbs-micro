"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_menu", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Phần tử cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "media_menu"
    },
    childs: [{
        type: Schema.Types.ObjectId,
        ref: "media_menu"
    }],
    //_________Level
    level: {
        type: Number,
        default: 1
    },
    /**
     * Phân loại
     * 1-Trang sản phẩm
     * 2-Trang bài viết
     * 3-Khác còn lại
     */
    type: {
        type: Number,
        default: 1
    },
    //_________Tên
    name: String,
    //_________Slug/URL
    slug: String,
    //_________Thứ tự hiển thị
    order: {
        type: Number,
        default: 1
    },
    //________Trạng thái (1-Active|2-Hủy)
    status: {
        type: Number,
        default: 1
    },
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