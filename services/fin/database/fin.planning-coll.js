"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * KẾ HOẠCH DÒNG TIỀN (CHƯA UPATE THEO CẤU TRÚC MỚI)
 */
module.exports  = DATABASE_MIDDLEWARE("financial_planning", {
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
    //_________Thuộc dự án phòng ban
    project: {
        type: Schema.Types.ObjectId,
        ref: 'department'
    }, 
    //_________Thuộc hợp đồng
    contract: {
        type: Schema.Types.ObjectId,
        ref: 'contract'
    }, 
    /**
     * Phân loại
     * 1-Kế hoạch năm
     * 2-Kế hoạch bán hàng
     * 3-Kế hoạch nhập hàng
     * 4-Kế hoạch theo hợp đồng
     * 5-Ước sản lượng hợp đồng
     */
    type: { type: Number, default: 1 },
    //_________Mua vào/Bán ra (1/2)
    outin: { type: Number, default: 1 }, 
    //_________Nội dung    
    name: String,
    //_________Ký hiệu   
    sign: { type: String, default: 'sign' }, 
    //_________Ngày đầu kỳ 
    startDate: { type: Date, default: null },
    //_________Ngày cuối kỳ
    endDate: { type: Date, default: null },
    //_________Trạng thái phê duyệt (1/2)
    status: { type: Number, default: 1 }, 
    //_________Ghi chú   
    note: String,
    //_________Người phê duyệt
    approver:{
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    //_________Thời điểm phê duyệt
    timeApproved: { type: Date, default: null },
    //_________Chi tiết (BỎ)
    details: [{
        type: Schema.Types.ObjectId,
        ref: 'financial_planning_detail'
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