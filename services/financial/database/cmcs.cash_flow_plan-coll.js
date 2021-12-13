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
    //_________ Công ty(*)
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
        default: 1
    },

    //_________Phân loại theo tính chất(1-Kế hoạch năm/2-Kế hoạch bán hàng/3-Kế hoạch nhập hàng/4-Kế hoạch ngắn hạn)(*)
    type: {
        type: Number,
        default: 1
    },
    //_________Tên(*)
    name: String,

    //_________Mã hiệu(*)
    sign: String,

    //_________Ghi chú(*)
    note: String,
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
        type: Schema.Types.ObjectId,
        ref : "user"
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
    income: {
        type: Number,
        default: 0
    },

    //__________Thực tế thu
    realIncome: {
        type: Number,
        default: 0
    },

    //__________Dự kiến chi
    expense: {
        type: Number,
        default: 0
    },

    //__________Thực tế chi
    realExpense: {
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