"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * KẾ HOẠCH DÒNG TIỀN (CHƯA UPATE THEO CẤU TRÚC MỚI)
 */
module.exports  = DATABASE_MIDDLEWARE("financial_planning_detail", {
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
    //_________Kỳ kế hoạch
    planning: {
        type: Schema.Types.ObjectId,
        ref: 'financial_planning'
    }, 
    //_________Nội dung
    name: String, 
    //_________Ghi chú
    note: String,
    //_________Ngày dự kiến
    date: { type: Date, default: null },
    /**
     * BÁN RA-NGUỒN THU
     */
    //_________Ước tính doanh thu (Bán ra)
    revenue: { type: Number, default: 0 },
    //_________Ước tính giá trị thực hiện (Bán ra)
    production: { type: Number, default: 0 },
    //_________Khối lượng thu-tiền về (Bán ra)
    incomeQuantity: { type: Number, default: 0 },  
    //_________Giá trị thu-tiền về (Bán ra)
    income: { type: Number, default: 0 },  
    /**
     * MUA VÀO-NGUỒN CHI
     */
    //_________Ước tính doanh thu (Mua vào)
    revenueIn: { type: Number, default: 0 },
    //_________Ước tính giá trị thực hiện (Mua vào)
    productionIn: { type: Number, default: 0 },
    //_________Khối lượng chi
    expenseQuantity: { type: Number, default: 0 },      
    //_________Dự trù chi
    expense: { type: Number, default: 0 },
    //_________Duyệt chi
    approved: { type: Number, default: 0 }, 
    //_________Hoàn thành hay chưa
    completed: { type: Number, default: 0 },
    //_________Dự án/phòng ban/bộ phận
    department: {
        type: Schema.Types.ObjectId,
        ref: 'department'
    },
    //_________Người mua (Khách hàng)
    buyerInfo: {
        type: Schema.Types.ObjectId,
        ref: 'contact'
    }, 
    //_________Người bán (Nhà cung cấp)
    sellerInfo: {
        type: Schema.Types.ObjectId,
        ref: 'contact'
    }, 
    //_________Hợp đồng (thuộc dự án/liên quan tới khách hàng)
    contract: {
        type: Schema.Types.ObjectId,
        ref: 'contract'
    },
    //_________Sản phẩm
    goods: {
        type: Schema.Types.ObjectId,
        ref: 'goods'
    },
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