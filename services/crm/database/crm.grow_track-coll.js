"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("crm_grow_track", {
    //________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Đơn vị cơ sở/Cửa hàng
    funda: {
        type: Schema.Types.ObjectId,
        ref : "funda"
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
    /**
     * Phân loại
     * 1-Quản lý
     * 2-Sản xuất
     */
    type: {
        type: Number,
        default: 1
    },
    /**
     * Phân loại ca làm việc (cập nhật theo funda)
     * 1-Ca ngày
     * 2-Ca đêm
     */
    shiftType: {
        type: Number,
        default: 1
    },
    /**
     * Chính thức/Thử việc
     * 1-Chính thức
     * 2-Thử việc
     */
    official : {
        type: Number,
        default: 1
    },
    //________Trạng thái (1-Active|2-Khóa)
    status: {
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
    /**
     * NGÀY CÔNG
     * Số giờ làm
     * Số ngày làm
     */
    //________Số giờ làm việc (chính thức)
    hours1: {
        type: Number,
        default: 0 
    },
    //________Số giờ nghỉ phép, lễ
    hours2: {
        type: Number,
        default: 0 
    },
    //________Số giờ làm thêm
    hours3: {
        type: Number,
        default: 0 
    },
    //________Số giờ thử việc
    hours4: {
        type: Number,
        default: 0 
    },
    //________Số ngày công đi làm
    nowds: {
        type: Number,
        default: 0 
    },
    //________Số ngày công đi làm vào ngày Chủ nhật
    nowdsos: {
        type: Number,
        default: 0 
    },
    /**
     * LƯƠNG
     */
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
    //________Lương làm thêm
    overtimeSalary: {
        type: Number,
        default: 0 
    },
    //________Thưởng doanh thu/hiệu quả
    revenueBonus: {
        type: Number,
        default: 0 
    },
    //________Thưởng thành tích/đóng góp (KPI gán lỗi)
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
    //________Sub12
    subAllowance12: {
        type: Number,
        default: 0 
    },
    //________Sub13
    subAllowance13: {
        type: Number,
        default: 0 
    },
    //________Sub14
    subAllowance14: {
        type: Number,
        default: 0 
    },
    //________Sub15
    subAllowance15: {
        type: Number,
        default: 0 
    },
    //________Sub16
    subAllowance16: {
        type: Number,
        default: 0 
    },
    //________Sub17
    subAllowance17: {
        type: Number,
        default: 0 
    },
    //________Sub18
    subAllowance18: {
        type: Number,
        default: 0 
    },
    //________Sub19
    subAllowance19: {
        type: Number,
        default: 0 
    },
    //________Sub20
    subAllowance20: {
        type: Number,
        default: 0 
    },
    //________Sub21
    subAllowance21: {
        type: Number,
        default: 0 
    },
    //________Sub22
    subAllowance22: {
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
    //________Điểm vi phạm (KPI gán lỗi)
    punishment: {
        type: Number,
        default: 0 
    },
    //________Bảo hiểm phải nộp
    insurance: {
        type: Number,
        default: 0 
    },
    //________Thuế TNCN phải nộp (Personal income tax)
    pitax: {
        type: Number,
        default: 0 
    },
    //________Công đoàn phải nộp
    union: {
        type: Number,
        default: 0 
    },
    //________Trích quỹ tương thân tương ái
    share: {
        type: Number,
        default: 0 
    },
    //________Trả hộ khác
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
    //_________File/ảnh đính kèm
    files: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
    userCreate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    }
})