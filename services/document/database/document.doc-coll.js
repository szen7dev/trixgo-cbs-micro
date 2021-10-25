"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 *  Hồ sơ văn bản
 */
module.exports  = DATABASE_MIDDLEWARE("document_doc", {
    //_________Mã hiệu bằng số do hệ thống tự phát sinh
    suid : {
        type   : String,
        require:  true,
        unique : true
    },
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Phòng ban/dự án
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"                  
    },
    //_________Gói/Hạng mục (đã link với contact)
    package: {
        type: Schema.Types.ObjectId,
        ref : "document_package"                  
    },
    //_________Hợp đồng
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"                  
    },
    /**
     * THÔNG TIN CĂN BẢN
     */
    //_________Hướng hồ sơ (theo hệ thống)
    direction: { type: Number, default: 1 },
    //_________Nơi ban hành
    sender: {
        type: Schema.Types.ObjectId,
        ref : "contact"
    },
    //_________Nơi nhận
    receiver: {
        type: Schema.Types.ObjectId,
        ref : "contact"
    },
    //_________Phân loại theo lĩnh vực
    field: {
        type: Schema.Types.ObjectId,
        ref : "doctype"
    },
    //_________Phân loại theo tính chất
    property: {
        type: Schema.Types.ObjectId,
        ref : "doctype"
    },
    //_________Phân loại theo khác
    other: {
        type: Schema.Types.ObjectId,
        ref : "doctype"
    },
    //_________Địa chỉ lưu trữ
    storage: {
        type: Schema.Types.ObjectId,
        ref : "storage"          
    },
    //_________Ngày tháng văn bản/Ngày đóng dấu
    date: {
        type: Date,
        default: null
    },
    //_________Ngày nhận văn bản/Ngày tháng đến
    receivedDate: {
        type: Date,
        default: null
    },
    //_________Loại văn bản theo hệ thống quy định
    type: { type: Number, default: 1 },
    //_________Nội dung văn bản
    name: String,
    //_________Mô tả
    description: String,
    //_________Số hiệu văn bản
    sign: String,
    //_________Số hiệu hồ sơ lưu
    storeSign: String,
    //_________Số đến (xem xét chính là số hiệu hồ sơ lưu)
    receivedCount: String,
    //_________Định dạng văn bản
    style: String,
    //_________Tình trạng văn bản
    status: String,
    //_________Ghi chú
    note: String,
    //_________Người phê duyệt
    approver: String,
    //_________Số lượng nhận
    amount: { type: Number, default: 1 },
    //_________Số lượng giao
    amountDelivery: { type: Number, default: 0 },
    //_________Có yêu cầu trả lời/ Phản hồi không (0-Không, 1-Có)
    requestResponse: { type: Number, default: 0 },
    //_________Thời hạn phải trả lời/phản hồi
    expiredResponse: {
        type: Date,
        default: null
    },
    //_________Các văn bản liên đới
    linkDocument: [{
        type: Schema.Types.ObjectId,
        ref: "document_doc"
    }],
    //_________File đính kèm hồ sơ
    files: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
    //_________Công việc cần xử lý
    tasks: [{
        type: Schema.Types.ObjectId,
        ref: "pcm_plan_task"
    }],
    //_________Ký xác nhận
    signatures: [{
        type: Schema.Types.ObjectId,
        ref: "signature"
    }],
    //_________Comment
    comments: [{
        type: Schema.Types.ObjectId,
        ref: "comment"
    }],
    //_________Những người liên quan
    related: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
     /**
     * CẤU TRÚC ĐỆ QUY
     */
    parent: {
        type: Schema.Types.ObjectId,
        ref: "document_doc"
    },
    childs: [{
        type: Schema.Types.ObjectId,
        ref: "document_doc"
    }],
    level: {
        type: Number,
        default: 1
    },
    /**
     * THÔNG TIN NGƯỜI TẠO/CẬP NHẬT
     */
    author: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : "user"
    }
})