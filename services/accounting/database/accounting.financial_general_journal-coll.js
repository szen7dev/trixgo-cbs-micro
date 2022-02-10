"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 *  Hồ sơ văn bản
 */
module.exports  = DATABASE_MIDDLEWARE("financial_general_journal", {
    //_________Công ty      
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Đơn vị cơ sở (khai báo danh mục)
    funda: {
        type: Schema.Types.ObjectId,
        ref: 'funda'
    }, 
    //_________Thuộc dự án phòng ban (NEW***)
    project: {
        type: Schema.Types.ObjectId,
        ref: 'department'
    }, 
    //_________Hợp đồng
    contract: {
        type: Schema.Types.ObjectId,
        ref: 'contract'
    }, 
    //_________Kỳ thanh toán
    ipc: {
        type: Schema.Types.ObjectId,
        ref: 'contract_ipc'
    }, 
    /**
     * Loại khoản mục (NEW***)
     * 1-Chung
     * 2-Chi phí
     * 3-Doanh thu
     */
    feeType: { type: Number, default: 1 },
    //_________Khoản mục phí (NEW***)
    fee: {
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    },
    //_________Ngân sách-Thuộc nhóm khoản mục phí nào (BUDGET)
    group: {
        type: Schema.Types.ObjectId,
        ref: 'budget_group'
    },
    //_________Ngân sách-Thuộc khoản mục phí nào (BUDGET)
    job: {
        type: Schema.Types.ObjectId,
        ref: 'budget_job'
    },
    //_________Phiếu/chứng từ
    voucher: {
        type: Schema.Types.ObjectId,
        ref: 'financial_voucher'
    }, 
    //_________Tài khoản nợ
    debit: {
        type: Schema.Types.ObjectId,
        ref: 'account'
    },   
    //_________Tài khoản có
    credit: {
        type: Schema.Types.ObjectId,
        ref: 'account'
    },
    //_________Mã khách nợ (dùng cho phiên bản update)
    customerDebit: {
        type: Schema.Types.ObjectId,
        ref: 'contact'
    },
    //_________Mã khách có (dùng cho phiên bản update)
    customerCredit: {
        type: Schema.Types.ObjectId,
        ref: 'contact'
    },   
    //_________Kho bãi
    warehouse: {
        type: Schema.Types.ObjectId,
        ref: 'warehouse'
    },
    //_________Hàng hóa/Thành phẩm/Nguyên vật liệu
    goods: {
        type: Schema.Types.ObjectId,
        ref: 'goods'
    }, 
    //_________Ngày hoạch toán (mặc định lấy theo ngày của Voucher) (NEW***)
    date: { type: Date, default: Date.now },
    //_________Diễn giải nội dung
    name: String,
    //_________Ghi chú
    note: String,   
    //_________Ghi nhận thực hiện ngân sách hoặc giảm trừ thực hiện ngân sách (1/-1)
    updown: { type: Number, default: 1 }, 
    /**
     * Phân biệt phiếu tạm ứng hay thanh toán
     * 0-Thanh toán
     * 1-Tạm ứng
     */
    advancePayment: { type: Number, default: 0 }, 
    //_________Khối lượng/Số lượng (mặc định là 0 để phục vụ việc hạch toán chi phí vào trực tiếp hàng hoá: lô đất, căn hộ)
    quantity: { type: Number, default: 0 },  
    //_________Đơn giá (được tính dự theo thành tiền/khối lượng)
    // Khi chạy được giá vốn => nhân ra thành tiền và update cho trường Amount
    unitprice: { type: Number, default: 0 },   
    //_________Thành tiền
    amount: { type: Number, default: 0 }, 
    //_________Tiền về thực tế (áp dụng theo dõi cho các hoá đơn VAT)
    amountPayment: { type: Number, default: 0 }, 
    /**
     * USD-NGOẠI TỆ
     */ 
    //_________Loại ngoại tệ (1/USD)
    fcuType: { type: Number, default: 1 },  
    //_________Tỷ giá hối đoái
    fcuExRate: { type: Number, default: 0 },
    //_________Thành tiền ngoại tệ
    fcuAmount: { type: Number, default: 0 }, 
    //_________Có in ra trên phiếu để tính giá trị hay không
    cash: { type: Number, default: 1 },    
    //_________Có hóa đơn hay không
    vat: { type: Number, default: 0 },  
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
    },
    /**
     * KẾT CHUYỂN CUỐI KỲ (31/12)/PHIẾU HỦY
     */ 
    //_________Có phải là phiếu kết chuyển số dư chuyển cuối kỳ hay không
    forward: { type: Number, default: 0 },
    //_________Có phải là phiếu kết chuyển doanh thu chi phí cuối kỳ hay không (Income Statement)
    forwardIs: { type: Number, default: 0 },
    //_________Có phải là phiếu xuất hàng đi mượn hay không (để không chạy giá vốn cho các phiếu này)
    returning: { type: Number, default: 0 },
     /**
     * Phân biệt phiếu tạm ứng hay thanh toán
     * 0-Thanh toán
     * 1-Tạm ứng
     */
    advancePayment: { type: Number, default: 0 },
    //_________Phiếu có hủy hay không
    cancel: { type: Number, default: 0 },
})
