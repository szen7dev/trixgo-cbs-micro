"use strict";
/**
 * CHỦ ĐỀ
 * 1-Công việc
 * 2-Checklist
 * 3-Bài viết
 * 4...
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("pcm_plan_task", {
    //_________Mã hiệu bằng số do hệ thống tự phát sinh
    suid : {
        type   : String,
        require:  true,
        unique : true
    },
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Công ty của người tạo việc
    companyOfAuthor: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },

    //_________Công ty của người thực hiện
    companyOfAssignee: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    /**
     * CẤU TRÚC ĐỆ QUY
     */
    //_________Công việc cha | Công việc chứa checklist
    parent: {
        type: Schema.Types.ObjectId,
        ref: "pcm_plan_task"
    },
    level: {
        type: Number,
        default: 1
    },
    /**
     * PHÂN QUYỀN TRUY CẬP
     */
    //_________Người tạo
    author: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    //_________Người thực hiện
    assignee: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    //_________Những người liên quan
    related: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    /**
     * PHÂN LOẠI PHỤC VỤ BÁO CÁO
     */ 
    /**
     * Phân loại công việc mẫu/thông thường
     * 0-Việc thông thường
     * 1-Việc mẫu
     */
    template: { type: Number, default: 0 },
    /**
     * Phân loại việc Nháp hay Chính thức
     * 0-Chính thức
     * 1-Nháp
     */
    draft: { type: Number, default: 0 },
    /**
     * Phân loại checklist và công việc/việc con
     * 1-Công việc
     * 2-Checklist
     */
    type: { type: Number, default: 1 },
    /**
     * Phân loại tính chất công việc
     * 0-Việc thông thường
     * 1-Yêu cầu thông tin
     * 2-Yêu cầu phê duyệt
     * 3-Thanh toán/Chi phí
     * 4-Đấu thầu
     * 5-Nghiệm thu chất lượng
     * 6-Yêu cầu sửa chữa
     * 7-Yêu cầu thay đổi
     * 8-Yêu cầu thực hiện
     * 9-Báo cáo
     * 10-Tiến độ
     * 11-Biên bản họp
     */
    subtype: { type: Number, default: 0 }, // Thay thế cho isproposal để tiện cho việc xử lý code
    /**
     * Phân loại tiến độ
     * 0-Việc thông thường
     * 1-Tiến độ thông thường
     * 2-Mốc tiến độ
     * 3-Tiến độ gói/nhóm
     */
    progressType: Number,
    //_________Phân loại mức độ quan trọng (cao, bình thường, thấp, siêu cao)
    priority: { type: Number, default: 2 },
    //_________Phân loại trạng thái (6 trạng thái)
    status: { type: Number, default: 1 },
    //_________Khoá/Mở
    lock: { type: Number, default: 0 },
    /**
     * PHÂN LOẠI KHÁC
     */
    //_________Dự án/phòng ban
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"                  
    },
    //_________Nhóm dữ liệu
    group: {
        type: Schema.Types.ObjectId,
        ref : "pcm_plan_group"                  
    },
    //_________Thuộc hợp đồng
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"                  
    },
    //_________Xử lý việc cho văn bản tài liệu nào
    document: {
        type: Schema.Types.ObjectId,
        ref : "document_doc"
    },
    //_________Tính chất (Phân loại khác TYPE = 2)
    field: {
        type: Schema.Types.ObjectId,
        ref : "doctype"
    },
    //_________Kanban
    board: {
        type: Schema.Types.ObjectId,
        ref : "pcm_plan_board"
    },
    //_________Link template (WORKFLOW)
    linkTemplate: {
        type: Schema.Types.ObjectId,
        ref : "pcm_plan_task"
    },
    //_________Loại template sử dụng (IN ẤN)
    templateApply: {
        type: Schema.Types.ObjectId,
        ref : "template"
    },
    /**
     * THÔNG TIN CĂN BẢN
     */
    //_________Tên công việc
    name: String,
    //_________Mã hiệu do người dùng tự đặt
    sign: String,
    //_________Mô tả
    description: String,
    //_________Ghi chú
    note: String,
    //_________Thứ tự của công việc
    order: { type: Number, default: 1 },
    //_________Tổng số lượng check list
    amountChecklist: {
        type: Number, default: 0
    },
    //_________Tổng số lượng check list đã hoàn thành
    amountFinishedChecklist: {
        type: Number, default: 0
    },
    //_________Tổng số lượng việc con
    amountSubtask: {
        type: Number, default: 0
    },
    //_________Tổng số lượng việc con đã hoàn thành
    amountFinishedSubtask: {
        type: Number, default: 0
    },
    //_________Tổng số lượng phản hồi liên quan
    amountResponse: {
        type: Number, default: 0
    },
    //_________Tổng số lượng phản hồi liên quan đã đánh dấu
    amountMarkedResponse: {
        type: Number, default: 0
    },
    //_________Ký duyệt xác nhận
    signatures: [{
        type: Schema.Types.ObjectId,
        ref: "signature"
    }],
    //_________Các việc có liên quan kèm theo
    links: [{
        type: Schema.Types.ObjectId,
        ref: "pcm_plan_task"
    }],
    //_________File của người tạo việc
    authorAttachs: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
    //_________File của người thực hiện
    assigneeAttachs: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
    //_________Hoạt động cuối cùng(bỏ thay bằng history_log)
    lastLog: {
        type   : Schema.Types.ObjectId,
        ref: 'history_log'
    },
    /**
     * THÔNG TIN VỀ THỜI HẠN
     */
    //_________Kế hoạch ban đầu
    startTime: { type: Date, default: null },
    //_________Kế hoạch ban đầu
    expiredTime: { type: Date, default: null },
    //_________Kế hoạch thực tế
    actualStartTime: { type: Date, default: null },
    //_________Kế hoạch thực tế
    actualFinishTime: { type: Date, default: null },
    //_________Hẹn gửi theo lịch biểu (chuyển việc nháp thành chính thức)
    schedule: { type: Date, default: null },
    //_________Thông báo trước thời hạn (h)
    alert: { type: Number, default: 0 },
    //_________Thời hạn được phép thêm người liên quan (!!!)
    addRelatedExpired: { type: Date, default: null },
    /**
     * ĐÁNH GIÁ CÔNG VIỆC
     */
    //_________% hoàn thành (max = 100)
    percentage: { type: Number, default: 0, max: 100 },
    //_________Nhận xét
    judgement: String,
    //_________Tiến độ
    overdue: { type: Number, default: 1 },
    //_________Chất lượng
    score: { type: Number, default: 1, max: 5 },
    //_________Mức độ cấp bách
    urgent: { type: Number, default: 1 },
    //_________Mức độ phức tạp
    difficult: { type: Number, default: 1 },
    //_________Kết thúc thực tế
    finishTime: { type: Date, default: null },
    //_________Giá trị bị phạt
    punish: { type: Number, default: 0 },
    //_________Dự kiến thời lượng (h)
    amountoftime: { type: Number, default: 0 },
    //________Thực tế thời lượng (h)
    executiontime: { type: Number, default: 0 },
    //_________Đơn giá cho 1 giờ làm
    amountPerHour: { type: Number, default: 0 }, 
    //_________Khác
    quality: {
        type: Schema.Types.ObjectId,
        ref : "doctype"
    },
    /**
     * THÔNG TIN VỀ QUẢN LÝ TIẾN ĐỘ/CỘT MỐC-XEM LẠI DÙNG Ở ĐÂU ?????
     */
    // milestone: { type: Number, default: 0 },
    /**
     * THÔNG TIN ĐỆ TRÌNH/PHÊ DUYỆT
     * http://thongtindauthau.com/17116/thuat-ngu-tieng-anh-trong-dau-thau-va-hop-dong/
     */
    //_________Người phê duyệt
    approver:{
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    //_________Thời điểm phê duyệt
    timeApproved: { type: Date, default: null },
    //_________Giá trị phê duyệt/Giá phê duyệt trúng thầu
    valueApproved: { type: Number, default: 0 },
    /**
     * THÔNG TIN DỰ THẦU
     */
    //_________Giá dự thầu
    bidPrice: { type: Number, default: 0 },
    //_________Giảm giá dự thầu
    bidPriceDiscount: { type: Number, default: 0 },
    //_________Giá dự thầu thừa/thiếu
    bidPriceAdjustment: { type: Number, default: 0 },
    //_________User đồng ý mở thầu
    openedUsers: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    /**
     * Hồ sơ thầu đã được mở hay chưa (0/1)
     */
    openedStatus: { type: Number, default: 0 },
    /**
     * THÔNG TIN TƯƠNG TÁC
     */
    // Lưu lại tin nhắn đang soạn
    responsesTyping : [{
        user:  {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        content : {
            type : String
        }
    }],
    //_________Những người đã xem
    viewedUsers: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    //_______Những người chưa xem task (hiển thị là new task)
    news: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    //_________Những user đánh dấu quan tâm/start/bookmark
    flags: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    //_______Mảng user xoá tạm vào thùng rác
    usersDelete: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    //_______Mảng user xoá vĩnh viễn công việc
    usersPermanentDelete: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : "user"
    }
})