"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');

const Schema    = require('mongoose').Schema;
/**
 *  Hợp đồng kinh tế
 */
module.exports  = DATABASE_MIDDLEWARE("contract", {
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
    /**
     * PHÂN LOẠI THEO TÍNH NĂNG/ỨNG DỤNG
     */
    //_________Nhóm điều khoản
    contractGroups: [{
        type: Schema.Types.ObjectId,
        ref: "contract_condition"
    }],
    //_________Nhóm công việc
    contractGroups: [{
        type: Schema.Types.ObjectId,
        ref: "contract_group"
    }],
    //_________Công việc (Đệ trình phê duyệt/workflow)
    task: [{
        type: Schema.Types.ObjectId,
        ref: "pcm_plan_task"
    }],
    /**
     * CẤU TRÚC ĐỆ QUY
     */
    parent: {
        type: Schema.Types.ObjectId,
        ref: "contract"
    },
    childs: [{
        type: Schema.Types.ObjectId,
        ref: "contract"
    }],
    level: {
        type: Number,
        default: 1
    },
    /**
     * PHÂN QUYỀN TRUY CẬP
     */
    admins: [{
        type: Schema.Types.ObjectId,
        ref : "user"
    }],
    members: [{
        type: Schema.Types.ObjectId,
        ref : "user"
    }],
    //_________Tài khoản kế toán được quyền truy cập
    accounts: [{
        type: Schema.Types.ObjectId,
        ref : "account"
    }],
    /**
     * THÔNG TIN CĂN BẢN
     */
    //_________Thực/gửi dấu (1-Hợp đồng thực/2-Gửi dấu ~ Với dự án thì là các Gói chi phí sẽ triển khai/Thực tế đã ký/Thực-ảo/Chính thức-Nháp)
    real: { type: Number, default: 1 },
    //_________Phân loại khác (Thông thường-Đặc biệt)
    subType: { type: Number, default: 1 },
    //_________Phân loại (1-Hợp đồng bán ra/2-Hợp đồng mua vào)
    outin: { type: Number, default: 1 },
    //_________Phân loại theo lĩnh vực
    field: {
        type: Schema.Types.ObjectId,
        ref : "doctype"
    },
    //_________Phân loại theo hình thức (1-Trọn gói/2-Theo tháng/3-Đơn giá/..)
    type: { type: Number, default: 1 },
    // Trạng thái triển khai (1-Đang triển khai/2-Đang bàn giao/3-Hoàn thành/4-Tạm dừng)
    status: { type: Number, default: 1 },
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
    /**
     * KHI LẬP NGÂN SÁCH CHO DỰ ÁN-CỦA CHỦ ĐẦU TƯ
     */
    //_________Tên gói thầu
    packageName: String,
    //_________Giá trị gói thầu (khi lập NGÂN SÁCH DỰ ÁN CHO CHỦ ĐẦU TƯ)
    packagePrice: { type: Number, default: 0 },
    /**
     * KHI CHỌN THẦU VÀ KÝ HỢP ĐỒNG
     */
    //_________Giá trị hợp đồng
    value: { type: Number, default: 0 },
    //_________Giá trị phát sinh
    plus: { type: Number, default: 0 },
    //_________Giá trị tạm ứng
    advancePayment: { type: Number, default: 0 },
    //_________Giá trị quyết toán
    finalValue: { type: Number, default: 0 },
    /**
     * KHI LẬP NGÂN SÁCH TỰ THỰC HIỆN
     */
    //_________Giá trị Quản lý ngân sách ban đầu
    valueNetOrg: { type: Number, default: 0 },
    //_________Giá trị Quản lý ngân sách hiện tại
    valueNet: { type: Number, default: 0 },
    //_________Sản lượng đã thực hiện
    produce: { type: Number, default: 0 },
    //_________Ngân sách dự phòng
    backupBudget: { type: Number, default: 0 },
    //_________Phí quản lý (%)
    managementFee: { type: Number, default: 0 },
    //_________Tỷ lệ giao khoán (%)
    subcontractFee: { type: Number, default: 0 },
    //_________Thuế VAT (%)
    vat: { type: Number, default: 10 },
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
     * KHÁC
     */ 
    //_________Link theo dõi thị trường
    linkCrm: {
        type: Schema.Types.ObjectId,
        ref: 'crm_reach'
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
    //_________Khóa cập nhật
    lock: { type: Number, default: 0 },
    //_________Kho vật tư lưu trữ
    warehouse: {
        type: Schema.Types.ObjectId,
        ref : 'warehouse'
    },
    //_________File đính kèm hợp đồng
    documents: [{
        type: Schema.Types.ObjectId,
        ref : "document_doc"
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