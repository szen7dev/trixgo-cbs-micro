"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * DATAHUB-GÓI THẦU CỦA DỰ ÁN
 */
module.exports  = DATABASE_MIDDLEWARE("datahub_package", {
    //_________Dự án
    project: {
        type: Schema.Types.ObjectId,
        ref : "datahub_project"
    },
    //_________Chủ đầu tư => được lấy theo trường "client" của project trong datahub_project
    client: { 
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Tỉnh/Thành phố => được lấy theo thông tin của project trong của datahub_project
    area1: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Huyện/Quận => được lấy theo thông tin của project trong của datahub_project
    area2: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Xã/Phường => được lấy theo thông tin của project trong của datahub_project
    area3: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Nhóm dự án => được lấy theo thông tin của project trong của datahub_project
    projectType: { type: Number, default: 1 },
    //_________Loại công trình => được lấy theo thông tin của project trong của datahub_project
    buildingType: { type: Number, default: 1 },
    //_________Cấp công trình => được lấy theo thông tin của project trong của datahub_project
    buildingGrade: { type: Number, default: 1 },
    //_________Số tầng hầm => được lấy theo thông tin của project trong của datahub_project
    basementNumber: { type: Number, default: 0 },
    //_________Diện tích tầng hầm => được lấy theo thông tin của project trong của datahub_project
    basementArea: { type: Number, default: 0 },
    //_________Số tầng cao => được lấy theo thông tin của project trong của datahub_project
    floorNumber: { type: Number, default: 0 },
    //_________Diện tích tầng cao => được lấy theo thông tin của project trong của datahub_project
    floorArea: { type: Number, default: 0 }, 
    //_________Lĩnh vực (type=1) => được lấy theo thông tin của project trong của datahub_project
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