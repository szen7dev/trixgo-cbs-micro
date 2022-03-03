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
    client: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Công việc phát hành hồ sơ mời thầu
    task: {
        type: Schema.Types.ObjectId,
        ref : "pcm_plan_task"
    }, 
    // //_________Hồ sơ dự thầu
    // bidsDocument: {
    //     type: Schema.Types.ObjectId,
    //     ref : "pcm_plan_task"
    // },
    /**
     * DỮ LIỆU DỰ THẦU
     */ 
    //_________Công ty dự thầu
    contractor: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
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
    //_________Công việc mời thầu
    job: {
        type: Schema.Types.ObjectId,
        ref : "bidding_bill"
    }, 
    //_________Mã công tác trong datahub (phục vụ thống kê)
    datahubJob: {
        type: Schema.Types.ObjectId,
        ref : "datahub_job"
    },
    //_________Khối lượng chào thầu
    quantity: { type: Number, default: 0 },
    //_________Đơn giá chào thầu nhân công
    laborUnitPrice: { type: Number, default: 0 },
    //_________Đơn giá chào thầu máy móc/thiết bị
    machineUnitPrice: { type: Number, default: 0 },
    //_________Đơn giá chào thầu vật tư
    materialUnitPrice: { type: Number, default: 0 },
    /**
     * Đơn giá chào thầu
     * Tính = laborUnitPrice+machineUnitPrice+materialUnitPrice
     */
    unitPrice: { type: Number, default: 0 },
    //_________Thuế giá trị gia tăng (VAT-%)
    vat: { type: Number, default: 10 },
    /**
     * Thuế giá trị gia tăng (VAT-giá trị)
     * - Tính = (unitPrice)*vat%
     */
    vatValue: { type: Number, default: 0 },
    /**
     * USD-NGOẠI TỆ
     * - Xử lý sau
     */  
    /**
     * CHÀO VIỆC PHÁT SINH
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