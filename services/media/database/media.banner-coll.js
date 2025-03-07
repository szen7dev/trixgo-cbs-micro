"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_banner", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    /**
     * Type: phân loại vị trí
     * 1-5-Banner tĩnh 1-5
     * 6-Slide
     * 7-Các tính năng hay dùng
     * 8-11-Footer cột 1-4
     */
    type: {
        type: Number,
        default: 1 
    },
    //_________Name
    name: String,
    //_________Link
    link: String,
    //_________Thumbnail
    thumbnail: {
        type: Schema.Types.ObjectId,
        ref: 'file'
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