"use strict";

const { template } = require('lodash');
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("crm_habit", {
    //________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Phần tử cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "crm_habit"
    },
    level: {
        type: Number,
        default: 1 
    },
    //_________Mã khách
    contact: {
        type: Schema.Types.ObjectId,
        ref : "contact"
    },
    //_________Phân nhóm habit
    habitCate: {
        type: Schema.Types.ObjectId,
        ref : "crm_habit"
    },
    /**
     * Phân loại
     * 1-Có/không
     * 2-Số phút thực hiện hàng ngày
     */
    type: {
        type: Number,
        default: 1
    },
    //________Trạng thái (1-Active|2-Hủy)
    status: {
        type: Number,
        default: 1
    },
    //________Thời lượng yêu cầu hàng ngày (số phút)
    duration: { type: Number, default: 0 },
    //_________Số ngày thử thách
    dayOfChallenge: { type: Number, default: 0 },
    //________Nội dung
    name: String,
    namecv: String,
    //_______Giờ bắt đầu thực hiện hàng ngày (để push thông báo)
    startTime: Date,
    //_______Ngày hoàn thành
    finishDate: Date,
    //_________Streak days 
    streakDays : { type: Number, default: 0 },
    //________Ghi chú
    note: String,
    //________Màu nền
    color: String,
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