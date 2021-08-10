"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
module.exports  = DATABASE_MIDDLEWARE("user", {
    /**
     * index: {fullname: text}
     */
    //_______Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : 'company' 
    },
    //_______Username: sử dụng cho chatting slash
    username: {
        type: String,
        trim: true,
        unique : true,
        require: true
    },
     /**
     * xem thông tin file https://docs.google.com/spreadsheets/d/1jIOpvNxEaVx1kuKIkgQ9BRrex_3m6CIa31X2TPUkvM8/edit#gid=1029627505&range=D15
     */
    platform: {
        type: Number,
        enum: [1, 2]
    },
    //_______Email
    email: {
        type   : String,
        require:  true,
        unique : true
    },
    //_______Mật khẩu
    password: String,
    //_______Điện thoại
    phone: String,
    //_______Tên
    name: String,
    //_______Tên
    firstname: String,
    //_______Họ
    lastname: String,
    //_______Họ và tên
    fullname: String,
    //_______Mã hiệu công ty
    companysign: String,  
    //_______Ngày sinh
    birthDay: {
        type   : Date,
        default: null
    },
    //_______Giới tính (1-Nam/2-Nữ/3-Khác)
    gender: {
        type: Number,
        default: 1
    },
    //_______Thuộc về phòng ban/dự án nào
    department: {
        type: Schema.Types.ObjectId,
        ref : 'department' 
    },
    //_______Chức vụ/vị trí
    position: {
        type: Schema.Types.ObjectId,
        ref : "position"
    },
    //_______Ảnh đại diện
    image: {
        type: String,
        default: 'user_default.png'
    },
    //_______Ảnh chữ ký tay
    signature: {
        type: String,
        default: 'signature_default.png'
    },
    /**
     * Trạng thái hoạt động.
     * 1. Hoạt động
     * -1: Chưa xác thực mail
     * 0. Khóa
     */
    status: {
        type: Number,
        default: 1
    },
    /**
     * Dùng để phân biệt Admin công ty/thành viên thông thường
     * 0: Admin công ty  (Owner Company)
     * 1: Thành viên Thường (User)
     * 100: Supper Admin (Hiệp vs Khánh) 
     */
    level: {
        type: Number,
        default: 1
    },
    //_______Số lần đăng nhập hệ thống
    numLog: {
        type: Number,
        default: 0
    },
    //_______Lần truy cập cuối cùng
    lastLog: {
        type   : Date,
        default: null
    },
    /**
     * Cấu hình nhận email thông báo
     * 1: Nhận email
     * 0: Không nhận email
     */
    emailConfig: {
        type   : Number,
        default: 1
    },
    /**
     * Cấu hình nhận thông báo trên hệ thống
     * 1: Nhận thông báo.
     * 0: Không nhận thông báo.
     */
    noticeConfig: {
        type   : Number,
        default: 1
    },
	/**
     * Danh sách pin cuộc hội thoại
    */
	conversationsPin: [{
        type: Schema.Types.ObjectId,
        ref: 'message_conversation'
    }],
    /**
     * Cấu hình hiển thị view mặc định ở trang chủ
     * 1: Văn hoá doanh nghiệp
     * 2: Báo cáo quản trị theo phân quyền truy cập
     */
    // displayHomeConfig: {
    //     type   : Number,
    //     default: 1
    // },
    /**
     * Cấu hình giao diện chi tiết công việc
     * 1: Giao diện đơn giản
     * 2: Giao diện đầy đủ
     */
    // displayPcmConfig: {
    //     type   : Number,
    //     default: 1
    // },
    //_______Ngôn ngữ hiển thị (đồng bộ với moment.js)
    lang: {
        type   : String,
        default: "vi"
    },
    //_______Ghi chú
    // note: String,
    //_______Các link thường xuyên truy cập
    // bookmarks: [
    //     { 
    //         type: String 
    //     }
    // ],
    //_______Yêu cầu gửi đi tới người khác
    // sendToFriends: [{ 
    //     type: Schema.Types.ObjectId,
    //     ref: 'user'
    // }],
    //_______Yêu cầu nhận được từ người khác gửi đến
    // receiveFromFriends: [{ 
    //     type: Schema.Types.ObjectId,
    //     ref: 'user'
    // }],
    //_______Danh sách bạn bè
    // friends: [{ 
    //     type: Schema.Types.ObjectId,
    //     ref: 'user'
    // }],
    //_______Bạn bè liên lạc gần đây
    // recentlyFriends: [{ 
    //     type: Schema.Types.ObjectId,
    //     ref: 'user'
    // }],
    /**
     * Số lượng app user được dùng
     * khi record user_app insert -> amountAppUse ++ (increment)
     */
    // amountAppUse: {
    //     type: Number,
    //     default: 0
    // },
    /**
     * Dung lượng sử dụng trong tất cả các ứng dụng
     * khi record của các ứng dụng insert file thì sẽ ++ (increment)
     */
    // storageUse: {
    //     type: Number,
    //     default: 0
    // }, 
    // //_______Cuộc hộp thoại bị mis tin nhắn
    // converMiss:[{ 
    //     type: Schema.Types.ObjectId,
    //     ref: 'message_conversation'
    // }],
    //_______Code reset mật khẩu
    // codeReset: String,
    /**
     * Quản lý thông tin Device Mobile
     */
    devices : [{
        deviceName      :{ type : String }, 
        deviceID        :{ type : String },
        registrationID  :{ type : String }
    }],
    
    /**
     * THÔNG TIN NGƯỜI TẠO/CẬP NHẬT
     */
    userCreate: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    // //________Các trường sau này config mặc định.
    // config: {
    //     groupTask: {
    //         type: Schema.Types.ObjectId,
    //         ref: 'pcm_plan_group'
    //     },
    //     // Phục vụ để hiển thị trên mobile
    //     nameGroup: String,
    // },
    // //________dùng để lấy thông tin user trong dự án
    // departmentContacts: [{
    //     department: {
    //         type: Schema.Types.ObjectId,
    //         ref: 'department'
    //     },
    //     departmentContact:  {
    //         type: Schema.Types.ObjectId,
    //         ref: 'department_contact'
    //     },
    // }]
})