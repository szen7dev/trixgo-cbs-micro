"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * KẾ HOẠCH DÒNG TIỀN
 */
module.exports  = DATABASE_MIDDLEWARE("cash_flow_plan", {
    /**
     * THÔNG TIN CHUNG
     */
    //_________Công ty(*)
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Đơn vị cơ sở(*)
    funda : {
        type: Schema.Types.ObjectId,
        ref : "funda"
    },
    //_________Dự án (option)
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },
    //_________Hợp đồng (option)
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
    },
    //_________ID cash_flow_plan cha
    parent: {
        type: Schema.Types.ObjectId,
        ref : "cash_flow_plan"
    },
    //_________Số cấp
    level: {
        type: Number,
        default: 1,
        enum: [1, 2]
    },
    /**
     * Phân loại:
     * 1-Kế hoạch năm
     * 2-Kế hoạch bán hàng
     * 3-Kế hoạch nhập hàng
     * 4-Kế hoạch theo vòng đời dự án
     * 5-Kế hoạch theo hợp đồng/dự án
     * 6-Kế hoạch khác
     */
    type: {
        type: Number,
        default: 5
    },
    /**
     * Tính chất
     * 1-Sản lượng
     * 2-Doanh thu
     * 3-Tiền về
     */
    property: {
        type: Number,
        default: 3
    },
    /**
     * Dòng tiền vào ra
     * 1-Mua vào
     * 2-Bán ra
     */
    outin: {
        type: Number,
        default: 3
    },
    //_________Tên(*)
    name: String,
    //_________Mã hiệu
    sign: String,
    //_________Ghi chú
    note: String,
    /**
     * Ưu tiên
     * 1-Bình thường
     * 2-Ưu tiên
     */
    priority: {
        type: Number,
        default: 3
    },    
    //_________Trạng thái phê duyệt(1-Chưa phê duyệt/2-Đã phê duyệt)
    status: {
        type: Number,
        default: 1
    },
    //_________Người phê duyệt
    approver: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    //_________Thời gian phê duyệt
    timeApproved: {
        type: Date
    },
    //_________Thành viên truy cập
    members: [{
        type: Schema.Types.ObjectId,
        ref : "user"
    }],
    //_________Ngày dự kiến/kế hoạch
    date: Date,
    //_________Ngày thực tế
    realDate: Date,
    /**
     * CHI TIẾT BÚT TOÁN THU
     * Nhập liệu chi tiết ở cấp 3
     */
    //__________Dự kiến thu
    planValue: {
        type: Number,
        default: 0
    },
    //__________Thực tế thu
    realValue: {
        type: Number,
        default: 0
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