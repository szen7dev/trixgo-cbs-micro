"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("crm_grow_track", {
    //________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Người support, chăm sóc
    support: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    //_________Mã khách
    contact: {
        type: Schema.Types.ObjectId,
        ref : "contact"
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
    //_______Ngày đo
    date: { type: Date, default: Date.now },
    //________Họ và tên bố
    parentName: String,
    //________Điện thoại bố
    phone: String,
    //________Email bố
    email: String,
    //_________Chiều cao bố (cm)
    fatherHeight: { type: Number, default: 0 },
    //________Họ và tên mẹ
    motherName: String,
    //________Điện thoại mẹ
    motherPhone: String,
    //________Email mẹ
    motherEmail: String,
    //_________Chiều cao mẹ (cm)
    motherHeight: { type: Number, default: 0 },
    /**
     * CON
     */
    //_______Ngày sinh
    birthday: { type: Date, default: Date.now },
    //_______Ngày dậy thì
    pubertyOnsetDate: { type: Date },
    //_______Tuổi xương thực (dạng số - Đo bằng máy)
    boneAge: { type: Number },
    //_________Giới tính (1-nam/ 2 - nữ/3-khác)
    gender: { type: Number, default: 1 },
    //_________Chiều cao đo (cm)
    height: { type: Number, default: 0 },
    //_________Đường phân vị
    percentile: { type: Number, default: 0 },
    //_________Chiều cao dự toán khi trưởng thành (cm)
    predictedAdultHeight: { type: Number, default: 0 },
    //_________Chiều cao mong muốn
    desiredHeight: { type: Number, default: 0 },
    //_________Cân nặng (kg)
    weight: { type: Number, default: 0 },
    //________Nội dung
    name: String,
    namecv: String,
    //________Lịch sinh hoạt
    routine: String,
    //________Ghi chú
    note: String,
    /**
     * Tài khoản khách hàng yêu cầu
     */
    //_________Social
    facebook: String,
    //_________TikTok
    tiktok: String,
    //_________Thumbnail
    thumbnail: {
        type: Schema.Types.ObjectId,
        ref: 'file'
    },
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