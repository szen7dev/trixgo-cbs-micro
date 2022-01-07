"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 *  Hồ sơ văn bản
 */
module.exports  = DATABASE_MIDDLEWARE("financial_voucher", {
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
    //_________Thuộc dự án phòng ban
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
    //_________Khoản mục phí
    fee: {
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    }, 
    //_________Mã khách/khách hàng
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'contact'
    },
    //_________Kho bãi (sử dụng để gán vào tất cả chi tiết cho nhanh)
    warehouse: {
        type: Schema.Types.ObjectId,
        ref: 'warehouse'
    },
    //_________Địa chỉ lưu trữ
    storage: {
        type: Schema.Types.ObjectId,
        ref : 'storage'
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
    /**
     * THÔNG TIN CĂN BẢN
     */    
    //_________Loại chứng từ (phiếu kế toán, thu, chi, nhập, xuất,...)
    type: { type: Number, default: 1 },  
    //_________Ngày hoạch toán
    date: { type: Date, default: Date.now },
    //_________Có phải là hóa đơn VAT hay không
    vat: { type: Number, default: 0 },  
    //_________Ngày hóa đơn (phục vụ bảng kê VAT)
    dateInvoice: { type: Date, default: null },   
    //_________Số hóa đơn
    signInvoice: String,  
    //_________Trạng thái đơn hàng
    status: { type: Number, default: 1 },   
    //_________Khóa phiếu
    lock: { type: Number, default: 0 }, 
    //_________Tên chứng từ
    name: String,  
    //_________Số chứng từ/hóa đơn VAT
    sign: { type: String, default: 'sign' },
    //_________ Người nhận tiền
    receiver: String,    
    //_________Mô tả chung về mặt hàng => kê khai vào hóa đơn
    commodity: String,
    //_________Ghi chú   
    note: String,
    //_________Tỷ giá hối đoái
    fcuExRate: { type: Number, default: 0 },
     /**
     * DÀNH RIÊNG CHO BÁN HÀNG
     */    
    //_________Nhân viên thực hiện đơn hàng
    staff: [{
        type: Schema.Types.ObjectId,
        ref: 'contact'
    }],
    //_________Nguồn đến của khách hàng (Facebook, website, zalo, khác)
    source: { type: Number, default: 1 }, 
    //_________Đơn hàng cũ/mới (cũ là đã từng bán cho khách 1 lần rồi)
    orderNew: { type: Number, default: 1 }, 
    //_________Chính sách giá bán (buôn/lẻ)
    pricePolicy: { type: Number, default: 1 }, 
    //_________Chiết khấu
    discountCost: { type: Number, default: 0 }, 
    //_________Chi phí khách phải trả khác (giao hàng, phụ phí)
    otherCost: { type: Number, default: 0 }, 
    //_________Đơn vị giao vận
    shipperName: String, 
    //_________Chi phí thuê giao vận
    shipperCost: { type: Number, default: 0 }, 
    /**
     * DÀNH RIÊNG CHO LƯU TRỮ
     */  
    //_________Tình trạng hồ sơ nghiệm thu
    inspection: String,
    //_________Tình trạng hồ sơ thanh lý
    termination: String,
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
