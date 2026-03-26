"use strict";

const { template } = require('lodash');
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 * BA
 * Family Group
 * Cuộc thi
 */

module.exports  = DATABASE_MIDDLEWARE("crm_family_group", {
    //________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //________Nội dung/Tên nhóm
    name: String,
    //_________Admin
    admins : [{
        type   : Schema.Types.ObjectId,
        ref: 'user'
    }],
    //_________Thành viên
    members : [{
        type   : Schema.Types.ObjectId,
        ref: 'user'
    }],
    //_________Hình ảnh
    images: [{
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