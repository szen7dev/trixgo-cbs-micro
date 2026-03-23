"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("expert_timesheet", {
    //________Công ty thuê chuyên gia (*)
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
    //_________Đơn vị cơ sở/Cửa hàng
    funda: {
        type: Schema.Types.ObjectId,
        ref : "funda"
    },
    //_________Ca làm việc
    shift: {
        type: Schema.Types.ObjectId,
        ref : "fnb_shift"
    },
    //________Hạng mục cha
    parent: {
        type: Schema.Types.ObjectId,
        ref : "expert_timesheet"
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
    //________Nội dung công việc (*)
    name: String,
    namecv: String,
    //_________Địa chỉ theo google map
    location: String,
    //_________Khoảng cách tới vị trí quy định (m)
    distance: {
        type: Number,
        default: 0
    },
    /**
     * Thiết bị
     * 1 Web
     * 2 Mobile
     */
    device: Number,
    /**
     * Phân loại
     * 1 quản lý
     * 2 sản xuất
     */
    type: {
        type: Number,
        default: 1
    },
    /**
     * Phân loại lễ tết
     * 1-Thông thường
     * 2-Nghỉ phép: Lương cơ bản
     * 3-Lễ, tết: Lương cơ bản
     * 4-Công tác
     * 5-Du lịch, nghỉ mát: Lương cơ bản
     * 6-Làm thêm giờ
     */
    subtype: {
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
    /**
     * Bảng chấm công convert từ Ca làm việc
     * 1-Bình thường
     * 2-Convert
     */
    convert : {
        type: Number,
        default: 1
    },
    //________Người thực hiện
    assignee: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    //_______Giờ quy định bắt đầu làm việc
    startingTime: Date,
    //_______Ngày hoàn thành
    date: { type: Date, default: Date.now },
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
    //________Trạng thái (1-Active|2-Khóa)
    status: {
        type: Number,
        default: 1
    },
    //_________Người phê duyệt
    approver:{
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    //_________Thời điểm phê duyệt
    timeApproved: { type: Date, default: null },
    //________Link với biểu khối lượng công việc
    task: {
        type: Schema.Types.ObjectId,
        ref : "pcm_plan_task"
    },
    //________Link với biểu khối lượng công việc
    budget: {
        type: Schema.Types.ObjectId,
        ref : "budget"
    },
    //________Link với biểu khối lượng công việc
    budgetItem: {
        type: Schema.Types.ObjectId,
        ref : "budget_item"
    },
    //________Link với biểu khối lượng công việc
    budgetGroup: {
        type: Schema.Types.ObjectId,
        ref : "budget_group"
    },
    //________Link với biểu khối lượng công việc
    budgetWork: {
        type: Schema.Types.ObjectId,
        ref : "budget_work"
    },
    //________Ghi chú
    note: String,
    //________Ghi dữ liệu lịch sử
    history: String,
    //_________File/ảnh đính kèm
    files: [{
        type: Schema.Types.ObjectId,
        ref: "file"
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