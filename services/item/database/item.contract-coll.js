"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');

const Schema    = require('mongoose').Schema;
/**
 * HỢP ĐỒNG KINH TẾ
 * NGÂN SÁCH DỰ ÁN => VỚI CHỦ ĐẦU TƯ (HỢP ĐỒNG MUA VÀO)
 * NGÂN SÁCH HỢP ĐỒNG/THẦU PHỤ => VỚI NHÀ THẦU (HỢP ĐỒNG BÁN RA)
 */
module.exports  = DATABASE_MIDDLEWARE("contract", {
    /**
     * PHÂN QUYỀN TRUY CẬP
     */
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
     * THÔNG TIN QUẢN TRỊ VÀ PHÂN LOẠI
     */
    //_________Công ty 
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Dự án/phòng ban (Thuộc dự án)
    project: {
        type: Schema.Types.ObjectId,
        ref : "department",
        require: true,
    },
    //_________Phần tử cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "contract"
    },
    //_________Cấp của hợp đồng
    level: {
        type: Number,
        default: 1
    },
    /**
     * Phân loại chính thức/nháp
     * 1-Chính thức (đã chuyển thành hợp đồng)
     * 2-Đang là gói thầu
     */
    draft: { type: Number, default: 1 },
    /**
     * Phân loại trạng thái (cân nhắc sử dụng cho cả trạng thái thầu và hợp đồng)
     * 1-Đang triển khai
     * 2-Đang bàn giao
     * 3-Hoàn thành
     * 4-Tạm dừng
     */
    status: { type: Number, default: 1 },
    //_________Phân loại vào ra (1-Hợp đồng bán ra/2-Hợp đồng mua vào) (CONTRACT_OUTIN in cf_constant)
    outin: { type: Number, default: 1 },
    //_________Phân loại NA (Thực/Gửi dấu) (CONTRACT_TA in cf_constant)
    real: { type: Number, default: 1 },
    //_________Phân loại khác (1-Thông thường/2-Đặc biệt) (CONTRACT_SUB_TYPES in cf_constant)
    subType: { type: Number, default: 1 },
    //_________Phân loại theo hình thức hợp đồng (1-Trọn gói/2-Theo tháng/3-Đơn giá/..) (CONTRACT_TYPES in cf_constant)
    type: { type: Number, default: 1 },
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
    //_________Phân loại theo trạng thái công nợ (POSTMAN ITEM -> DOCTYPE (type = 16))
    debtStatus: {
        type: Schema.Types.ObjectId,
        ref : "doctype"
    },
    //_________Phân loại theo kho(POSTMAN ITEM -> WAREHOUSE)
    warehouse: {
        type: Schema.Types.ObjectId,
        ref : 'warehouse'
    },
    
    /**
     * THÔNG TIN KHÁC
     */
    //_________Tên (Tên hợp đồng)
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
    //_________Bên mua (POSTMAN ITEM > CONTACT)
    buyerInfo: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    //_________Ngân hàng bên mua
    buyerBank: String,
    //_________Bên bán (POSTMAN ITEM > CONTACT)
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
     * THÔNG TIN VÀ GIÁ TRỊ THỰC HIỆN
     */
    //_________(1)Giá trị trước VAT
    value: { type: Number, default: 0 },
    //_________2)Giá trị phần VAT
    vatValue: { type: Number, default: 0 },
    //_________(3)Phát sinh trước VAT
    plus: { type: Number, default: 0 },
    //_________(4)Phát sinh phần VAT
    vatPlus: { type: Number, default: 0 },
    //_________(5)Tạm ứng theo hợp đồng
    advancePayment: { type: Number, default: 0 },
    //_________(6)Sản lượng trước VAT
    produce: { type: Number, default: 0 },
    //_________(7)Sản lượng phần VAT
    vatProduce: { type: Number, default: 0 },
    //_________(8)Sản lượng phát sinh trước VAT
    plusProduce: { type: Number, default: 0 },
    //_________(9)Sản lượng phát sinh phần VAT
    vatPlusProduce: { type: Number, default: 0 },
    //_________(10)Giá trị nghiệm thu trước VAT
    acceptance: { type: Number, default: 0 },
    //_________(11)Giá trị nghiệm thu phần VAT
    vatAcceptance: { type: Number, default: 0 },
    //_________(12)Giá trị nghiệm thu phát sinh trước VAT
    plusAcceptance: { type: Number, default: 0 },
    //_________(13)Giá trị nghiệm thu phát sinh phần VAT
    vatPlusAcceptance: { type: Number, default: 0 },
    //_________(14)Giá trị giữ lại
    retainedValue: { type: Number, default: 0 },
    //_________(15)Thu hồi tạm ứng
    advancePaymentDeduction: { type: Number, default: 0 },
    //_________(16)Khấu trừ khác (nếu có)
    otherDeduction: { type: Number, default: 0 },
    //_________(17 = (10 + 11 + 12 + 13) - (14 + 15 + 16))Đề nghị tạm ứng/thanh toán
    recommendedPayment: { type: Number, default: 0 },
    //_________(18)Đã giải ngân tạm ứng
    advancePaymentPaid: { type: Number, default: 0 },
    //_________(19)Đã giải ngân thanh toán
    amountPaid: { type: Number, default: 0 },
    //_________(20 = (17 - 18 - 19))Còn lại chưa giải ngân
    remainingPayment: { type: Number, default: 0 },
    //_________(21 = (5) - (18))Dư ứng
    advancePaymentOverage: { type: Number, default: 0 },
    //_________(22)Giá trị quyết toán
    finalValue: { type: Number, default: 0 },
    //_________Thuế VAT (%)
    vat: { type: Number, default: 10 },
  
    /**
     * USD-NGOẠI TỆ
     */ 
    //_________Tỷ giá hối đoái
    fcuExRate: { type: Number, default: 0 },

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
    //_________Phí quản lý
    managementFee: { type: Number, default: 0 },
    //_________Tỷ lệ giao khoán
    subcontractFee: { type: Number, default: 0 },
    //_________Chi phí
    expenses: { type: Number, default: 0 },
    //_________Lợi nhuận
    profit: { type: Number, default: 0 },

    /**
     * ĐẤU THẦU
     */
    //_______Giá trúng thầu
    tenderPrice: { type: Number, default: 0 },
    //_______VAT trúng thầu
    tenderPriceAT: { type: Number, default: 0 },

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

    //_________Ảnh đại diện
    image: {
        type: String,
        defautl: 'contract_default.png'
    },
    //_________Hình ảnh gần đây
    photos: [{
        type: Schema.Types.ObjectId,
        ref: 'file',
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