"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * HỒ SƠ DỰ THẦU TÀI CHÍNH
 * - Mỗi 1 công việc, 1 nhà thầu chỉ tồn tại 1 mẩu tin duy nhất (job + finOne)
 * - Trường hợp cập nhật chào giá bổ sung => tạo thêm hồ sơ dự thầu mới trong Hồ sơ mời thầu
 */
module.exports  = DATABASE_MIDDLEWARE("bidding_quotation", {
    /**
     * CẤU HÌNH PHÂN LOẠI
     */ 
    //_________Công ty Phát hành hồ sơ mời thầu/Công ty tạo ra task
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Công việc phát hành hồ sơ mời thầu
    task: {
        type: Schema.Types.ObjectId,
        ref : "pcm_plan_task"
    }, 
    //_________Mã công tác trong datahub (phục vụ thống kê)
    datahubJob: {
        type: Schema.Types.ObjectId,
        ref : "datahub_job"
    },
    /**
     * DỮ LIỆU DỰ THẦU
     */ 
    //_________Hạng mục
    item: {
        type: Schema.Types.ObjectId,
        ref : "bidding_group"
    }, 
    //_________Nhóm dữ liệu
    group: {
        type: Schema.Types.ObjectId,
        ref : "bidding_group"
    },  
    //_________Công việc mời thầu
    job: {
        type: Schema.Types.ObjectId,
        ref : "bidding_job"
    }, 
    //_________Công ty dự thầu
    companyBid: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Công ty dự thầu (sau thay cho companyBid)
    bidder: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Hồ sơ dự thầu
    bidsDocument: {
        type: Schema.Types.ObjectId,
        ref : "pcm_plan_task"
    },
    //_________Khối lượng chào thầu
    quantity: { type: Number, default: 0 },
    //_________Đơn giá chào thầu nhân công
    laborUnitPrice: { type: Number, default: 0 },
    //_________Đơn giá chào thầu máy móc/thiết bị
    machineUnitPrice: { type: Number, default: 0 },
    //_________Đơn giá chào thầu vật tư
    materialUnitPrice: { type: Number, default: 0 },
    //_________Đơn giá chào thầu
    unitPrice: { type: Number, default: 0 },
    //_________Thuế giá trị gia tăng (VAT-%)
    vat: { type: Number, default: 10 },
    //_________Thuế giá trị gia tăng (VAT-giá trị)
    vatValue: { type: Number, default: 0 },
    /**
     * USD-NGOẠI TỆ
     */  
    //_________Tỷ giá hối đoái
    fcuExRate: { type: Number, default: 0 },
    //_________Đơn giá chào thầu nhân công
    fcuLaborUnitPrice: Number,
    //_________Đơn giá chào thầu máy móc/thiết bị
    fcuMachineUnitPrice: Number,
    //_________Đơn giá chào thầu vật tư
    fcuMaterialUnitPrice: Number,
    //_________Đơn giá chào thầu
    fcuUnitPrice: Number,
    //_________Thuế giá trị gia tăng (VAT-giá trị)
    fcuVatValue: Number,
    /**
     * VIỆC PHÁT SINH
     */  
    //_________Tên công việc
    name: String,
    //_________Đơn vị tính
    unit: String,
    //_________Ghi chú
    note: String,
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