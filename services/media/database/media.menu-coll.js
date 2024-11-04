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
    //_________Tên
    name: String,
    //_________Slug/URL
    slug: String,
    //_________Thứ tự để hiển thị giữa các menu cùng cấp
    order: {
        type: Number,
        default: 1
    },
    userCreate: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref: "user"
    }
})