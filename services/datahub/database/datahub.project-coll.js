"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * HỒ SƠ GÓI THẦU
 */
module.exports  = DATABASE_MIDDLEWARE("datahub_project", {
    /**
     * Khu vực dự án
     * - Thuộc mục kê khai Kinh nghiệm thực tế tham gia tại các Dự án
     * - Phân ra làm 3 object để phục vụ việc query gom nhóm cho tiện
     */
    //_________Tỉnh/Thành phố
    area1: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Huyện/Quận
    area2: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Xã/Phường
    area3: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Chủ đầu tư
    client: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Tên
    name: String,
    //_________Ký hiệu
    sign: String,
    //_________Ghi chú
    note: String,
    //_________Địa chỉ
    address: String,
    //_________Nhóm dự án
    projectType: { type: Number, default: 1 },
    //_________Cấp công trình
    grade: { type: Number, default: 0 },
    /**
     * THÔNG TIN NGƯỜI TẠO/CẬP NHẬT
     */
    userCreate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    }
})