"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');

const Schema    = require('mongoose').Schema;
/**
 *  Hợp đồng kinh tế
 */
module.exports  = DATABASE_MIDDLEWARE("contract", {
    /**
     * THÔNG TIN VÀ GIÁ TRỊ THỰC HIỆN
     */
    //_________(1)Giá trị hợp đồng
    value: { type: Number, default: 0 },
    //_________(2)Giá trị phát sinh
    plus: { type: Number, default: 0 },
    //_________(3)VAT GIÁ TRỊ
    vatValue: { type: Number, default: 0 },

    //_________(4)Giá trị tạm ứng
    advancePayment: { type: Number, default: 0 },
    
    //_________(5)Sản lượng đã thực hiện
    produce: { type: Number, default: 0 },
    //_________(6)Sản lượng phát sinh trước VAT
    plusProduce: { type: Number, default: 0 },
    //_________(7)Vat sản lượng
    vatProduce: { type: Number, default: 0 },

    //_________(8)Nghiệm thu trước VAT
    acceptance: { type: Number, default: 0 },
    //_________(9)Nghiệm thu phát sinh trước VAT
    plusAcceptance: { type: Number, default: 0 },

    //_________(10)VAT nghiệm thu
    vatAcceptance: { type: Number, default: 0 },
    //_________(11)Giá trị giữ lại
    retainedValue: { type: Number, default: 0 },
    //_________(12)Thu hồi tạm ứng
    advancePaymentDeduction: { type: Number, default: 0 },
    //_________(13)Khấu trừ khác (nếu có)
    otherDeduction: { type: Number, default: 0 },
    //_________(14 = (8 + 9+10) - (11 + 12 + 13))Đề nghị tạm ứng/thanh toán
    recommendedPayment: { type: Number, default: 0 },

    //_________(15)Đã giải ngân tạm ứng
    advancePaymentPaid: { type: Number, default: 0 },

    //_________(16)Đã giải ngân thanh toán
    amountPaid: { type: Number, default: 0 },

    //_________(17)Còn lại chưa giải ngân
    remainingPayment: { type: Number, default: 0 },

    //_________(18 = (4) - (15))Dư ứng
    advancePaymentOverage: { type: Number, default: 0 },

    //_________(19)Giá trị quyết toán
    finalValue: { type: Number, default: 0 },

    //_________Thuế VAT (%)
    vat: { type: Number, default: 10 },
  
    /**
     * USD-NGOẠI TỆ
     */ 
    //_________Loại ngoại tệ (1/USD)
    fcuType: { type: Number, default: 1 },  
    //_________Tỷ giá hối đoái
    fcuExRate: { type: Number, default: 0 },
    //_________Giá trị gói thầu
    fcuPackagePrice: { type: Number, default: 0 },
    //_________Giá trị hợp đồng
    fcuValue: { type: Number, default: 0 },
    //_________Giá trị phát sinh
    fcuPlus: { type: Number, default: 0 },
    //_________Giá trị tạm ứng
    fcuAdvancePayment: { type: Number, default: 0 },
    //_________Giá trị quyết toán
    fcuFinalValue: { type: Number, default: 0 },
    //_________Bảo lãnh hợp đồng (performance security/bank guarantee hay bon)
    fcuCgValue: { type: Number, default: 0 },
    //_________Bảo lãnh tạm ứng (Advance Payment Bond hay Advance Payment Guarantee)
    fcuAgValue: { type: Number, default: 0 },

    /**
     * THÔNG TIN NGÂN SÁCH
     */
    //_______Ngân sách
    budget: { type: Number, default: 0 },

    //_______VAT ngân sách
    budgetVAT: { type: Number, default: 0 },

    //_______Dự báo ngân sách
    forecastBudget: { type: Number, default: 0 },

    //_______VAT dự báo
    forecastBudgetVAT: { type: Number, default: 0 },

    //_________Phí quản lý (%)
    managementFee: { type: Number, default: 0 },
     
    //_________Tỷ lệ giao khoán (%)
    subcontractFee: { type: Number, default: 0 },

    //_________Chi phí
    expenses: { type: Number, default: 0 },

    //_________Lợi nhuận
    profit: { type: Number, default: 0 },

    /**
     * THÔNG TIN QUẢN TRỊ
     */
    //_________Công ty 
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Dự án/phòng ban
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },
    //_________Hợp đồng cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "contract"
    },
    //_________Cấp của hợp đồng
    level: {
        type: Number,
        default: 1
    },

    //_________Quản trị của hợp đồng
    admins: [{
        type: Schema.Types.ObjectId,
        ref : "user"
    }],

    //_________Thành viên của hợp đồng
    members: [{
        type: Schema.Types.ObjectId,
        ref : "user"
    }],


    /**
     * THÔNG TIN CỦA HỢP ĐỒNG
     */
    //_________Phân loai(1-Chính thưc/2-Nháp) 
    draft: {
        type: Number,
        default: 1
    },
   
    //_________Phân loại vào ra (1-Hợp đồng bán ra/2-Hợp đồng mua vào)
    outin: { type: Number, default: 1 },
    
    //_________Trạng thái triển khai (1-Đang triển khai/2-Đang bàn giao/3-Hoàn thành/4-Tạm dừng)
    status: { type: Number, default: 1 },
    
    //_________Thực/gửi dấu (1-Hợp đồng thực/2-Gửi dấu ~ Với dự án thì là các Gói chi phí sẽ triển khai/Thực tế đã ký/Thực-ảo/Chính thức-Nháp)
    real: { type: Number, default: 1 },

    //_________Phân loại khác (Thông thường-Đặc biệt)
    subType: { type: Number, default: 1 },

    //_________Phân loại theo hình thức (1-Trọn gói/2-Theo tháng/3-Đơn giá/..)
    type: { type: Number, default: 1 },

    //_________Phân loại theo lĩnh vực
    field: {
        type: Schema.Types.ObjectId,
        ref : "doctype"
    },

    //_________Chủ trì thực hiện hợp đồng
    chair: {
        type: Schema.Types.ObjectId,
        ref : 'contact'
    },

    //_________Phụ trách
    personInCharge: {
        type: Schema.Types.ObjectId,
        ref : 'contact'
    },

    //_________Tình trạng công nợ
    debtStatus: {
        type: Schema.Types.ObjectId,
        ref : "doctype"
    },

    //_________Kho vật tư lưu trữ
    warehouse: {
        type: Schema.Types.ObjectId,
        ref : 'warehouse'
    },

    /**
     * THÔNG TIN KHÁC
     */
    //_________Tên
    name: String,
    //_________Mã hiệu
    sign: String,
    //_________Mã hiệu nội bộ
    storeSign: String,
    //_________Mô tả
    description: String,
    //_________Ghi chú
    note: String,
    //_________Ghi chú khác (thứ tự,...)
    note1: String,
    //_________Ngày ký
    date: { type: Date, default: null },
    //_________Bắt đầu thực hiện
    startTime: { type: Date, default: null },
    //_________Kết thúc thực hiện
    endTime: { type: Date, default: null },
    //_________Bên mua
    buyerInfo: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    //_________Ngân hàng bên mua
    buyerBank: String,
    //_________Bên bán
    sellerInfo: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    //_________Ngân hàng bên bán
    sellerBank: String,

    //_________Tên gói thầu
    packageName: String,

    //_________Khóa cập nhật(1-Open/2-Khóa)
    lock: { type: Number, default: 0 },

    /**
     * BẢO LÃNH
     */
    //_________Bảo lãnh hợp đồng (performance security/bank guarantee hay bon)
    cgValue: { type: Number, default: 0 },
    //_________Thời hạn bảo lãnh hợp đồng
    expiredCg: { type: Date, default: null },
    //_________Bảo lãnh tạm ứng (Advance Payment Bond hay Advance Payment Guarantee)
    agValue: { type: Number, default: 0 },
    //_________Thời hạn bảo lãnh tạm ứng
    expiredAg: { type: Date, default: null },
    
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