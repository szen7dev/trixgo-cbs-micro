"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
    
module.exports  = DATABASE_MIDDLEWARE("inspection_doc", {
    //_________Mã hiệu bằng số do hệ thống tự phát sinh
    suid : {
        type   : String,
        require:  true,
        unique : true
    },
    /**
     * THUỘC VỀ TEMPLATE HỆ THỐNG
     * 1-Thuộc về doanh nghiệp
     * 2-Thuộc về hệ thống
     */
    belongSystem: { type: Number, default: 1 },
    //_________Mẫu hồ sơ
    template: {
        type    : Schema.Types.ObjectId,
        ref     : 'inspection_doc'
    },
    //_________ Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Dự án
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },    
    //_________Hợp đồng/Gói thầu
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
    },
    /**
     * QUẢN LÝ TRẠNG THÁI TRIỂN KHAI
     */
    //_________Khu vực cha (tầng)
    parentArea: {
        type    : Schema.Types.ObjectId,
        ref     : 'inspection_area'
    },
    //_________Khu vực (căn hộ)
    area: {
        type: Schema.Types.ObjectId,
        ref : "inspection_area"
    },
    //_________Nhóm công tác cha (kết cấu, kiến trúc,...)
    parentGroup: {
        type: Schema.Types.ObjectId,
        ref : "inspection_group"
    },    
    //_________Nhóm công tác
    group: {
        type: Schema.Types.ObjectId,
        ref : "inspection_group"
    },
    /**
     * NỘI DUNG KHÁC
     */
    //_________Nội dung
    name: String,
    //_________Mã hiệu hồ sơ
    sign: String,
    //_________Mô tả hồ sơ/Vị trí
    description: String,
    // //_________Hạng mục
    // item: String,
    // //_________Vị trí
    // position: String,
    /**
     * Các việc có liên quan kèm theo
     * Khi link việc A vào việc B thì ở trong việc B, links cũng chứa A
     */
    links: [{
        type: Schema.Types.ObjectId,
        ref: "inspection_doc"
    }],
    linksDocs: [{
        type: Schema.Types.ObjectId,
        ref: "document_doc"
    }],
    //_________File của người tạo việc (Đi kèm đưa sang phản hồi liên quan với type=5)
    authorAttachs: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
    //_________Số lượng tương tác
    numLike: {
        type: Number,
        default: 0
    },
    //_________Số lượng comment
    numComment: {
        type: Number,
        default: 0
    },
    //_________Số lượng share
    numShare: {
        type: Number,
        default: 0
    },
    //_________Số lượng view
    numView: {
        type: Number,
        default: 0
    },   
    //_________Kế hoạch hoàn thành
    expiredTime: Date,
    //_________Ngày hồ sơ hoàn thành thực tế
    finishedTime: Date,
    /**
    * Trạng thái  
    * 1-Khởi tạo 
    * 2-Đang triển khai
    * 3-Sửa lỗi
    * 4-Hoàn thành
    */
    status: {
        type: Number,
        default: 1
    },
    //_________% hoàn thành (max = 100)
    percentage: { type: Number, default: 0, max: 100 },
    //_________Người tạo
    author: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    //_________Công ty của người tạo việc
    companyOfAuthor: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Người thực hiện (Thành viên dự án)
    assignee: {
        type    : Schema.Types.ObjectId,
        ref     : 'user'
    },    
    //_________Công ty của người thực hiện
    companyOfAssignee: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },   
    //_________Những người liên quan
    related: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],  
    /**
     * Những người được quyền truy cập
     * 1-author (khi tạo việc xong thì add vào)
     * 2-assignee (khi tạo việc xong thì add vào)
     * 3-related (khi thêm người liên quan thì add vào)
     * 4-người được gửi tới khi tạo phản hồi liên quan của chủ đề
     */
    accessUsers: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    /**
     * Những user chưa xem công việc
     * - Sẽ thêm user khi có thông báo mới => Chưa xem
     * - Sẽ xóa user khi bấm xem => Đã xem
     */
    news: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    /**
     * Những người đã xem: dùng để theo dõi những ai đã truy cập vào Task
     * - Không được xóa phần tử đã thêm
     */
    viewedUsers: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],          
    //_________Chữ ký xác nhận 
    signatures: [{
        type    : Schema.Types.ObjectId,
        ref     : 'signature'
    }],
    //_______Mảng user xoá tạm vào thùng rác
    usersDelete: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    /**
     * Mảng user xoá vĩnh viễn công việc
     * Đồng nghĩa với việc giảm dung lượng sử dụng
     */
    usersPermanentDelete: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    //_________Bình luận cuối cùng của hồ sơ
    lastComment: {
        type    : Schema.Types.ObjectId,
        ref     : 'inspection_doc_comment'   
    },     
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    }
})