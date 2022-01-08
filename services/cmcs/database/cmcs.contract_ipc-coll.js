"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("contract_ipc", {
    //_________Phân loại(1-Tạm ứng/2-Thanh toán/3-Quyết toán )(*)
    type: { type: Number, default: 1 },

    //_________ Công ty(*)
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },

    //_________ Dự án(*)
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },

    //_________Hợp đồng(*)
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
    },
    
    //_________Tên(*)
    name: String,
    
    //_________Ký hiệu
    sign: String,

    //_________Mô tả
    description: String,

    //_________Ngày tháng IPC(*)
    date: { type: Date, default: Date.now },

    //_________Ghi chú
    note: String,

    //_________(1)Nghiệm thu trước VAT
    acceptance:  { type: Number, default: 0},

    //_________(2)VAT nghiệm thu
    vatAcceptance:  { type: Number, default: 0},

    //_________(3)Nghiệm thu phát sinh trước VAT
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
    timeForPayment:  { type: Number, default: 0},

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