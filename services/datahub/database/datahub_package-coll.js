"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * GÓI THẦU CỦA DỰ ÁN
 */
module.exports  = DATABASE_MIDDLEWARE("datahub_package", {
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
    //_________Dự án
    project: {
        type: Schema.Types.ObjectId,
        ref : "datahub_project"
    },
    //_________Nhóm dự án
    projectType: { type: Number, default: 1 },
    //_________Loại công trình
    buildingType: { type: Number, default: 1 },
    //_________Cấp công trình
    buildingGrade: { type: Number, default: 1 },
    //_________Lĩnh vực (type=1)
    field: {
        type: Schema.Types.ObjectId,
        ref : "datahub_type"
    },
    //_________Nhà thầu
    contractor: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Tên
    name: String,
    //_________Ký hiệu
    sign: String,
    //_________Ghi chú
    note: String,
    //_________Giá trị hợp đồng trước VAT
    value: { type: Number, default: 0 },
    //_________Giá trị phần VAT
    vatValue: { type: Number, default: 0 },
    //_________Số tầng hầm
    basementNumber: { type: Number, default: 0 },
    //_________Diện tích tầng hầm
    basementArea: { type: Number, default: 0 },
    //_________Số tầng cao
    floorNumber: { type: Number, default: 0 },
    //_________Diện tích tầng cao
    floorArea: { type: Number, default: 0 },   
    //_________Ngày ký
    date: { type: Date, default: null },
    //_________Thực hiện từ ngày
    startTime: { type: Date, default: null },
    //_________Thực hiện đến ngày
    endTime: { type: Date, default: null },
    //_________Tình trạng hợp đồng
    status: { type: Number, default: 1 },
    //_________Tài liệu đính kèm
    files: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
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