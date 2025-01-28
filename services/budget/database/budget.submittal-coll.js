"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');

const Schema    = require('mongoose').Schema;
/**
 * ĐỆ TRÌNH NGÂN SÁCH
 */
module.exports  = DATABASE_MIDDLEWARE("budget_submittal", {  
    //_________Công ty 
    company: {
        type: Schema.Types.ObjectId,
        ref : "company",
        require: true,
    }, 
    //________Công việc
    task: {
        type:  Schema.Types.ObjectId,
        ref: 'pcm_plan_task'
    },     
    //_________Công việc
    work: {
        type: Schema.Types.ObjectId,
        ref: "budget_work"
    },      
    //_________Nhân sự
    staff: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },    
    //_________Mã khách
    contact: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },    
    /**
     * Nguồn lực/Sản phẩm
     * - Phục vụ duyệt giá
     * - Giá theo lịch sử đã duyệt giá (vật tư, nhân công trước đó)
     * - Giá theo lịch sử nhập vật tư
     */
    goods: {
        type: Schema.Types.ObjectId,
        ref : "goods"
    },  
    //_________Tài sản/thiết bị dùng để quản lý sửa chữa, tiêu hao
    assets: {
        type: Schema.Types.ObjectId,
        ref : "goods"
    }, 
    /**
     * THÔNG TIN NGÂN SÁCH
     */
    /**
     * Phát sinh
     * 1-Không phát sinh
     * 2-Phát sinh hợp lệ
     * 3-Phát sinh không hợp lệ
     */
    plus: { type: Number, default: 1 },        
    //_________Lý do phát sinh
    reason: {
        type: Schema.Types.ObjectId,
        ref: "doctype",
    },       
    //_________Tên
    name: String,
    //_________Mã hiệu
    sign: String,
    //_________Đơn vị tính
    unit: String,    
    //_________Ghi chú
    note: String,
    //______Khối lượng
    quantity: {
        type: Number,
        default : 0
    },
    //______Đơn giá
    unitPrice: {
        type: Number,
        default : 0
    },
    //______VAT đơn giá
    vatUnitPrice: {
        type: Number,
        default : 0
    },
    //______Thành tiền
    amount: {
        type: Number,
        default : 0
    },
    //______VAT thành tiền
    vatAmount: {
        type: Number,
        default : 0
    },
    //______Khối lượng phê duyệt
    approvedQuantity: {
        type: Number,
        default : 0
    },
    //_________Đơn giá phê duyệt
    approvedUnitPrice: {
        type   : Number,
        default: 0
    },
    //_________VAT đơn giá phê duyệt
    approvedVatUnitPrice: {
        type   : Number,
        default: 0
    },
    //______Thành tiền phê duyệt
    approvedAmount: {
        type: Number,
        default : 0
    },
    //______VAT thành tiền phê duyệt
    approvedVatAmount: {
        type: Number,
        default : 0
    }, 
    //_________Từ ngày
    fromDate: Date,
    //_________Đến ngày
    toDate: Date,
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