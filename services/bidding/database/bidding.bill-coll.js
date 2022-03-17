"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * 1. HẠNG MỤC
 * 2. NHÓM DỮ LIỆU
 * 3. CÔNG VIỆC MỜI THẦU
 */
module.exports  = DATABASE_MIDDLEWARE("bidding_bill", {
    //_________Khu vực
    area: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Chủ đầu tư (lấy từ task mời thầu => thuộc phân vùng của Chủ đầu tư)
    client: {
        type: Schema.Types.ObjectId,
        ref : "company"
    }, 
    //_________Nhà thầu trúng thầu
    bidder: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Thuộc hồ sơ gói thầu
    doc: {
        type: Schema.Types.ObjectId,
        ref : "bidding_doc"
    },
    /**
     * CẤU TRÚC ĐỆ QUY
     */
    //_________Hạng mục
    item: {
        type: Schema.Types.ObjectId,
        ref : "bidding_bill"
    },
    //_________Nhóm dữ liệu
    group: {
        type: Schema.Types.ObjectId,
        ref : "bidding_bill"
    },
    //_________Level
    level: {
        type: Number,
        default: 1
    },
    /**
     * THÔNG TIN CĂN BẢN
     */
    //_________Mã công tác trong DataHub (xét sau)
    datahubJob: {
        type: Schema.Types.ObjectId,
        ref : "datahub_job"
    },
    //_________Tên
    name: String,
    //_________Mô tả
    description: String,
    //_________Ký hiệu
    sign: String,
    //_________Đơn vị
    unit: String,
    //_________Chỉ dẫn kỹ thuật
    spec: String,
    //_________Ghi chú
    note: String,
    /**
     * Loại phát sinh
     * 1 - Không phát sinh
     * 2 - PS được tính với CĐT
     * 3 - PS không được tính với CĐT
     */
    plus: { type: Number, default: 1},
    //_________Khối lượng
    quantity: { type: Number, default: 0 },
    //_________Khối lượng cập nhật sau chào thầu
    quantity2: { type: Number, default: 0 },
    /**
     * ĐƠN GIÁ NET
     * - Tính từ DataHub đưa sang
     */
    //_________Đơn giá chào thầu vật tư
    materialUnitPrice: { type: Number, default: 0 },
    //_________Đơn giá chào thầu nhân công
    laborUnitPrice: { type: Number, default: 0 },
    //_________Đơn giá chào thầu máy móc/thiết bị
    machineUnitPrice: { type: Number, default: 0 },
    //_________Đơn giá tính toán từ Datahub
    unitPrice: { type: Number, default: 0 },
    //_________Thuế giá trị gia tăng (VAT-%)
    vat: { type: Number, default: 10 },
    //_________Thuế giá trị gia tăng (VAT-giá trị)
    vatValue: { type: Number, default: 0 },
    //_________Thành tiền tính toán từ Datahub
    amount: { type: Number, default: 0 },
    //_________Hệ số chi phí khác
    factor: { type: Number, default: 1 }, 
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