"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("contract_ipc", {
/**
     * START THÔNG TIN LẤY TỪ HỢP ĐỒNG
     */
    //_________Phân loại (1-Tạm ứng/2-Thanh toán/3-Quyết toán )(*)
    type: { type: Number, default: 1 },

    //_________Phân loại vào ra (1-Hợp đồng bán ra/2-Hợp đồng mua vào) (CONTRACT_OUTIN in cf_constant)
    outin: { type: Number, default: 1 },

    //_________Phân loại NA (Thực/Gửi dấu) (CONTRACT_TA in cf_constant)
    real: { type: Number, default: 1 },

    //_________Phân loại theo lĩnh vực (type = 3) (POSTMAN -> ITEM - > DOCTYPE)
    field: {
        type: Schema.Types.ObjectId,
        ref : "doctype"
    },  
    
    //_________Phân loại theo chủ trì (POSTMAN ITEM -> CONTACT)
    chair: {
        type: Schema.Types.ObjectId,
        ref : 'contact'
    },
    
    //_________Phân loại theo phụ trách (POSTMAN ITEM -> CONTACT)
    personInCharge: {
        type: Schema.Types.ObjectId,
        ref : 'contact'
    },    

    //_________Bên mua (POSTMAN ITEM > CONTACT)
    buyerInfo: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },

    //_________Bên bán (POSTMAN ITEM > CONTACT)
    sellerInfo: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },

    //_________Công ty-Được xác định theo IPC(*)
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },

    //_________Dự án-Được xác định theo IPC(*) 
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },

    //_________Hợp đồng-Được xác định theo IPC(*)
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
    },

    /**
     * END THÔNG TIN LẤY TỪ HỢP ĐỒNG
     */

    //_________Nội dung(*)
    name: String,
    
    //_________Mã hiệu
    sign: String,

    //_________Mô tả
    description: String,

    //_________Ngày hoạch toán(*)
    date: { type: Date, default: Date.now },

    //_________Ghi chú
    note: String,

    //_________(1)Giá trị nghiệm thu trước VAT
    acceptance:  { type: Number, default: 0},

    //_________(2)Giá trị nghiệm thu phần VAT
    vatAcceptance:  { type: Number, default: 0},

    //_________(3)Giá trị nghiệm thu phát sinh trước VAT
    plusAcceptance:  { type: Number, default: 0},

    //_________(4)Giá trị nghiệm thu phát sinh phần VAT
    vatPlusAcceptance:  { type: Number, default: 0},

    //_________(5)Giá trị giữ lại
    retainedValue:  { type: Number, default: 0},

    //_________(6)Thu hồi tạm ứng
    advancePaymentDeduction:  { type: Number, default: 0},

    //_________(7)Khấu trừ khác (nếu có)
    otherDeduction:  { type: Number, default: 0},

    //_________((8) = (1 + 2 + 3 + 4) - (5 + 6 + 7))Đề nghị tạm ứng/thanh toán
    recommendedPayment: { type: Number, default: 0},

    //_________(9)Thời hạn thanh toán
    timeForPayment:  { type: Date, default: 0},

    //_________(10)Đã giải ngân
    amountPaid:  { type: Number, default: 0},

    //_________((11) = 8- 10) Còn lại chưa giải ngân
    remainingPayment:  { type: Number, default: 0},

    /**
     * USD-NGOẠI TỆ
     */
    //_________Tỷ giá hối đoái
    fcuExRate: { type: Number, default: 0 },
    //_________Giá trị thực hiện
    fcuProduction: { type: Number, default: 0},
    //_________Thuế giá trị gia tăng
    fcuVatValue: { type: Number, default: 0 }, 
    //_________Giá trị giữ lại
    fcuRetainedValue: { type: Number, default: 0 },
    //_________Khấu trừ tạm ứng
    fcuAdvancePaymentDeduction: { type: Number, default: 0 },
    //_________Khấu trừ khác
    fcuOtherDeduction: { type: Number, default: 0 },

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