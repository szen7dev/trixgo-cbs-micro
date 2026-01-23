"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 *  BÚT TOÁN (PRODUCT)
 */
module.exports  = DATABASE_MIDDLEWARE("financial_general_journal", {
    //_________Công ty      
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Đơn vị cơ sở
    funda: {
        type: Schema.Types.ObjectId,
        ref: 'funda'
    }, 
    //_________Dự án/Phòng ban
    project: {
        type: Schema.Types.ObjectId,
        ref: 'department'
    }, 
    //_________Hợp đồng
    contract: {
        type: Schema.Types.ObjectId,
        ref: 'contract'
    }, 
    //_________Kho bãi
    warehouse: {
        type: Schema.Types.ObjectId,
        ref: 'warehouse'
    },
    //_________Hàng hóa/Thành phẩm/Nguyên vật liệu/Tài sản
    goods: {
        type: Schema.Types.ObjectId,
        ref: 'goods'
    }, 
    //_________Khoản mục phí
    subtype: {
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    },
    //_________Khoản mục phí cha
    parentSubtype: {
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    },
    /**
     * LINK NGÂN SÁCH
     */   
    //_________Ngân sách
    budget: {
        type: Schema.Types.ObjectId,
        ref: 'budget'
    },
    //_________Hạng mục
    budgetItem: {
        type: Schema.Types.ObjectId,
        ref: 'budget_item'
    },
    //_________Nhóm
    budgetGroup: {
        type: Schema.Types.ObjectId,
        ref: 'budget_group'
    },
    //_________Công việc
    budgetWork: {
        type: Schema.Types.ObjectId,
        ref: 'budget_work'
    },
    /**
     * Ghi nhận thực hiện ngân sách
     * 1-Ghi nhận tăng ngân sách thực hiện
     * 2-Ghi nhận giảm ngân sách thực hiện (hoàn ứng,...)
     */
    // updown: { type: Number, default: 1 }, 
    /**
     * LINK TỪ PHIẾU
     */
    //_________Phiếu/chứng từ
    voucher: {
        type: Schema.Types.ObjectId,
        ref: 'financial_voucher'
    }, 
    //_________Loại chứng từ (phiếu kế toán, thu, chi, nhập, xuất,...)
    type: { type: Number, default: 1 },  
    //_________Ngày hoạch toán (mặc định lấy theo ngày của Voucher)
    date: { type: Date, default: Date.now },
    //_________Ngày chứng từ
    dateInvoice: { type: Date, default: Date.now }, 
    //_________Có phải là phiếu kết chuyển số dư chuyển cuối kỳ hay không
    forward: { type: Number, default: 0 },
    //_________Có phải là phiếu kết chuyển doanh thu chi phí cuối kỳ hay không (Income Statement)
    forwardIs: { type: Number, default: 0 },
    //_________Có phải là phiếu xuất hàng đi mượn hay không (để không chạy giá vốn cho các phiếu này)
    returning: { type: Number, default: 0 },
    //_________Hạn thanh toán
    paymentDeadline: Date,
    //_________Phiếu có hủy hay không
    cancel: { type: Number, default: 0 },
    //_________Có chứng từ hay không: 1-Có,0-Không
    isDocumented: { type: Number, default: 1 },
    //_________Đã thanh toán hay chưa: 0-Chưa | 1-Có
    isPaid: { type: Number, default: 0 },
    /**
     * DÀNH RIÊNG CHO BÁN HÀNG
     */    
    //_________Trạng thái đơn hàng
    status: { type: Number, default: 1 }, 
    //_________Đơn hàng cũ/mới (cũ là đã từng bán cho khách 1 lần rồi)
    orderNew: { type: Number, default: 1 }, 
    //_________Người giới thiệu
    referrer: {
        type: Schema.Types.ObjectId,
        ref : 'contact'
    }, 
    //_________Sale
    sales: {
        type: Schema.Types.ObjectId,
        ref : "contact"
    },
    //_________Có phải là hàng tặng không
    gift: { type: Number, default: 0 },
    /**
     * KẾ TOÁN
     */
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
    //_________Diễn giải nội dung
    name: String,
    //_________Ghi chú
    note: String,   
    //_________Khối lượng/Số lượng (mặc định là 0 để phục vụ việc hạch toán chi phí vào trực tiếp hàng hoá: lô đất, căn hộ)
    quantity: { type: Number, default: 0 },  
    /**
     * Đơn giá
     * - Được tính dự theo thành tiền/khối lượng
     * - Khi chạy được giá vốn => nhân ra thành tiền và update cho trường Amount
     */
    unitprice: { type: Number, default: 0 },   
    //_________Thành tiền
    amount: { type: Number, default: 0 }, 
    //_________Có in ra trên phiếu để tính giá trị hay không
    cash: { type: Number, default: 1 },
    //_________Lịch sử thay đổi
    history: String,
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
})