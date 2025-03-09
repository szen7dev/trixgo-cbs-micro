"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("crm_habit_track", {
    //________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Mã khách
    contact: {
        type: Schema.Types.ObjectId,
        ref : "contact"
    },
    //_________Habit
    habit: {
        type: Schema.Types.ObjectId,
        ref : "crm_habit"
    },
    /**
     * Phân loại
     */
    type: {
        type: Number,
        default: 1
    },
    //________Trạng thái (1-Khởi tạo|2-Hoàn thành)
    status: {
        type: Number,
        default: 1
    },
    //_________Ngày thực hiện
    date: { type: Date, default: Date.now },
    //_________Số phút thực hiện
    duration: { type: Number, default: 0 },
    //_________Streak days 
    streakDays : { type: Number, default: 0 },
    //________Nội dung
    name: String,
    namecv: String,
    //________Ghi chú
    note: String,
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