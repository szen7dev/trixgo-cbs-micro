"use strict";

const { template } = require('lodash');
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("crm_award", {
    //________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    /**
     * Phân loại giải
     * 1-Giải 1: vàng
     * 2-Giải 2: bạc
     * 3-Giải 3: đồng
     */
    awardType: {
        type: Number,
        default: 1
    },
    /**
     * Phân loại Tuần/Tháng/Năm
     * 1-Tuần
     * 2-Tháng
     * 3-Năm
     */
    periodType: {
        type: Number,
        default: 1
    },
    /**
     * Điểm
     */
    score: {
        type: Number,
        default: 0
    },
    //_________Ba mẹ
    parent: {
        type: Schema.Types.ObjectId,
        ref : "contact"
    },
    //_________Danh bạ/Thành viên được ghi nhận
    contact: {
        type: Schema.Types.ObjectId,
        ref : "contact"
    },
    //_______Ngày ghi nhận
    date: { type: Date, default: Date.now },
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