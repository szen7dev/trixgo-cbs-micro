"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("contract_bill_job", {
    //_________ Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Dự án
    project: {
        type: Schema.Types.ObjectId,
        ref : "project"
    },    
    //_________Hợp đồng
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
    },
    //_________Hạng mục
    item: {
        type: Schema.Types.ObjectId,
        ref : "contract_bill_item"
    },
    //_________Nhóm dữ liệu
    group: {
        type: Schema.Types.ObjectId,
        ref : "contract_bill_group"
    },
    /**
     * THÔNG TIN CĂN BẢN
     */
    /**
     * Có phát sinh hay không
     * 0 - Không phát sinh
     * 1 - PS được thanh toán
     * 2 - PS không được thanh toán
     */
    plus: { type: Number, default: 0},
    //_________Tên công việc
    name: String,
    //_________Mô tả
    description: String,
    //_________Ký hiệu
    sign: String,
    //_________Đơn vị tính
    unit: String,
    //_________Ghi chú
    note: String,
    /**
     * KHỐI LƯỢNG
     */
    //_________Khối lượng ban đầu
    orgQuantity: { type: Number, default: 0 },
    //_________Khối lượng cập nhật triển khai
    planQuantity: { type: Number, default: 0 },
    //_________Khối lượng dự kiến còn lại
    estimateQuantity: { type: Number, default: 0 },
    /**
     * ĐƠN GIÁ
     */
    //_________Đơn giá ban đầu (chưa gồm VAT)
    orgUnitPrice: { type: Number, default: 0 },
    orgVatValue: { type: Number, default: 0 }, 
    //_________Đơn giá cập nhật triển khai (chưa gồm VAT)
    planUnitPrice: { type: Number, default: 0 },
    planVatValue: { type: Number, default: 0 }, 
    //_________Đơn giá ước tính còn lại (chưa gồm VAT)
    estimateUnitPrice: { type: Number, default: 0 },
    estimateVatValue: { type: Number, default: 0 }, 
    //_________Đơn giá Thuế giá trị gia tăng (%)
    vat: { type: Number, default: 10 },
    /**
     * USD-NGOẠI TỆ
     */ 
    //_________Tỷ giá hối đoái
    fcuExRate: Number,
    //_________Đơn giá ban đầu (chưa gồm VAT)
    fcuOrgUnitPrice: Number,
    fcuOrgVatValue: Number, 
    //_________Đơn giá cập nhật triển khai (chưa gồm VAT)
    fcuPlanUnitPrice: Number,
    fcuPlanVatValue: Number, 
    //_________Đơn giá ước tính còn lại (chưa gồm VAT)
    fcuEstimateUnitPrice: Number,
    fcuEstimateVatValue: Number, 
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