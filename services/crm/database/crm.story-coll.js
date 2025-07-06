"use strict";

const { child } = require('winston');
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 * Sử dụng bài viết Media
 */

module.exports  = DATABASE_MIDDLEWARE("crm_story", {
    //________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Mã khách (bố mẹ)
    contact: {
        type: Schema.Types.ObjectId,
        ref : "contact"
    },
    //_________Con của bố mẹ
    child: {
        type: Schema.Types.ObjectId,
        ref : "contact"
    },
    //________Trạng thái (1-Active|2-Hủy)
    status: {
        type: Number,
        default: 1
    },
    //________Nội dung
    name: String,
    namecv: String,
    //________Ghi chú
    note: String,
    //_________File/ảnh đính kèm
    files: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
    userCreate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    }
})