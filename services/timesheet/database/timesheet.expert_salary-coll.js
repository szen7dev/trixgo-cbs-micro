"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("expert_salary", {
    //________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //________Dự án/Phòng ban
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },
    //_______Chức vụ/vị trí/Bộ phận
    position: {
        type: Schema.Types.ObjectId,
        ref : "position"
    },
    //________Hạng mục cha
    parent: {
        type: Schema.Types.ObjectId,
        ref : "expert_salary"
    },
    //_________Admin (được quyền xem, sửa)
    admins : [{
        type   : Schema.Types.ObjectId,
        ref: 'user'
    }],
    //_________Thành viên (được quyền xem)
    members : [{
        type   : Schema.Types.ObjectId,
        ref: 'user'
    }],
    //________Phân loại
    type: {
        type: Number,
        default: 1
    },
    //________Nội dung (*)
    name: String,
    namecv: String,
    //________Nhân sự hưởng lương
    human: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    //________Tổng số nhân sự
    numberOfHuman: {
        type: Number,
        default: 0 
    },
    //_______Ngày tháng
    date: { type: Date, default: Date.now },
    //________Số giờ làm việc
    hours1: {
        type: Number,
        default: 0 
    },
    //________Số giờ nghỉ phép, lễ
    hours2: {
        type: Number,
        default: 0 
    },
    //________Lương
    salary: {
        type: Number,
        default: 0 
    },
    //________Lương phép
    onLeaveSalary: {
        type: Number,
        default: 0 
    },
    //________Thưởng doanh thu/hiệu quả
    revenueBonus: {
        type: Number,
        default: 0 
    },
    //________Thưởng thành tích/đóng góp
    reward: {
        type: Number,
        default: 0 
    },
    //________Tổng phụ cấp
    mealAllowance: {
        type: Number,
        default: 0 
    },
    //________Sub1
    subAllowance1: {
        type: Number,
        default: 0 
    },
    //________Sub2
    subAllowance2: {
        type: Number,
        default: 0 
    },
    //________Sub3
    subAllowance3: {
        type: Number,
        default: 0 
    },
    //________Sub4
    subAllowance4: {
        type: Number,
        default: 0 
    },
    //________Sub5
    subAllowance5: {
        type: Number,
        default: 0 
    },
    //________Sub6
    subAllowance6: {
        type: Number,
        default: 0 
    },
    //________Sub7
    subAllowance7: {
        type: Number,
        default: 0 
    },
    //________Sub8
    subAllowance8: {
        type: Number,
        default: 0 
    },
    //________Sub9
    subAllowance9: {
        type: Number,
        default: 0 
    },
    //________Sub10
    subAllowance10: {
        type: Number,
        default: 0 
    },
    //________Sub11
    subAllowance11: {
        type: Number,
        default: 0 
    },

    //_________Hệ số chuyển đổi KPI (KPI => giá trị)
    convertFactor: {
        type: Number,
        default: 1
    },
    //_________Hệ số đánh giá
    kpiFactor: {
        type: Number,
        default: 1
    },
    //________Trừ vi phạm
    punishment: {
        type: Number,
        default: 0 
    },
    //________Trừ bảo hiểm
    insurance: {
        type: Number,
        default: 0 
    },
    //________Trừ thuế TNCN (Personal income tax)
    pitax: {
        type: Number,
        default: 0 
    },
    //________Trừ công đoàn
    union: {
        type: Number,
        default: 0 
    },
    //________Chia sẻ, cho đi
    share: {
        type: Number,
        default: 0 
    },
    //________Trừ khác
    other: {
        type: Number,
        default: 0 
    },
    //________Đã tạm ứng
    advance: {
        type: Number,
        default: 0 
    },
    //_________Đã chi trả
    paid:  { type: Number, default: 0},
    //________Phải thanh toán
    remaining: {
        type: Number,
        default: 0 
    },
    //________Ghi chú
    note: String,
    userCreate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    }
})