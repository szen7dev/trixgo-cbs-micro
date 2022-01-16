"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("expert_timesheet", {
    //________Công ty thuê chuyên gia (*)
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    
    //________Dự án của công ty thuê chuyên giá (*)
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },
    //________Hạng mục cha
    parent: {
        type: Schema.Types.ObjectId,
        ref : "expert_timesheet"
    },

    //________Nội dung công việc (*)
    name: String,

    //________Loại chyên gia
    type: {
        type: Number,
        default: 1
    },

    //________Người thực hiện
    assignee: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },

    //________Số giờ hoàn thành
    hours: {
        type: Number,
        default: 0 
    },

    //________Đơn giá
    unitprice: {
        type: Number,
        default: 0
    },

    //________Thành tiền
    amount: {
        type: Number,
        default: 0
    },

    //________Trạng thái (1- Hoàn thành/ 0 Chưa hoàn thành)
    status: {
        type: Number,
        default: 0
    },

    //_________Người phê duyệt
    approver:{
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    
    //_________Thời điểm phê duyệt
    timeApproved: { type: Date, default: null },

    //________Ghi chú
    note: String,

    //_______Giờ vào 1
    dateIn1: Date,
    
    //_______Giờ ra 1
    dateOut1: Date,

    //_______Giờ vào 2
    dateIn2: Date,

    //_______Giờ ra 2
    dateOut2: Date,

    //_______Giờ vào 3
    dateIn3: Date,
    
    //_______Giờ ra 3
    dateOut3: Date,
    
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
});
