"use strict";
/**
 * ORDER
 * ---Doanh số phân theo tổng doanh số/Doanh số đơn hủy
 * Tiêu đề CloudMSS: Đơn hàng Winggo Thái Thịnh
 * Đơn hàng T11225, mã hiệu 22556688, giá trị 42.000 VND, đã được thanh toán thành công bởi Winggo Thái Thịnh
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("fnb_order", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Đơn vị cơ sở/Cửa hàng
    funda: {
        type: Schema.Types.ObjectId,
        ref : "funda"
    },
    /**
     * CẤU TRÚC ĐỆ QUY
     */
    //_________Cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "fnb_order"
    },
    level: {
        type: Number,
        default: 1
    },
    /**
     * THÔNG TIN
     */
    /**
     * Phân loại khách hàng
     * 1-Học sinh
     * 2-Sinh viên
     * 3-Phụ nữ
     * 4-Đàn ông
     * 5-Người lớn (phụ nữ + đàn ông)
     */
    customerType: {
        type: Number,
        default : 1
    },
    //_________Mã khách
    customer: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    //_________Người thực hiện
    assignee: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    /**
     * Bật chiến dịch truyền thông/marketing
     * 1-Không bật
     * 2-Bật
     */
    campaign: {
        type: Number,
        default: 1
    }, 
    /**
     * Phân loại trong hệ thống hoặc nhượng quyền (cập nhật theo funda)
     * 1-Trong hệ thống
     * 2-Nhượng quyền => Setup theo tính chất của Funda
     */
    internal: {
        type: Number,
        default: 1
    }, 
    /**
     * Khu vực
     */
    //_________Tỉnh/Thành phố (lấy theo Funda)
    area1: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Huyện/Quận (lấy theo Funda)
    area2: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Xã/Phường (lấy theo Funda)
    area3: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    /**
     * Mùa trong năm (theo lịch âm)
     * 1-Xuân
     * 2-Hạ
     * 3-Thu
     * 4-Đông
     */
    seasons: {
        type: Number,
        default: 1
    },
    /**
     * Ca làm việc
     * - Chấm công theo ca
     * - Tính vật tư theo ca
     */
    shift: {
        type: Schema.Types.ObjectId,
        ref: "fnb_shift"
    },
    /**
     * Phân loại ca làm việc (cập nhật theo funda)
     * 1-Sáng
     * 2-Chiều
     * 3-Tối
     */
    shiftType: {
        type: Number,
        default: 1
    },
    /**
     * Phân loại kênh bán hàng
     * 1-Offline
     * 2-Grab
     * 3-Shopee
     * 4-Gojek
     * 5-Baemin
     * 6-Loship
     */
    salesChannel: {
        type: Number,
        default: 1
    },
    /**
     * Hình thức phục vụ
     * 1-Tại quán
     * 2-Mang đi
     * 3-Giao hàng
     */
    service: {
        type: Number,
        default: 1
    },
    /**
     * Phương thức thanh toán
     * 1-Tiền mặt
     * 2-Chuyển khoản
     */
    paymentMethod: {
        type: Number,
        default: 1
    },
    /**
     * Trạng thái đơn
     * 1-Đang giao hàng/Phục vụ
     * 2-Hoàn tiền một phần
     * 3-Hoàn tiền toàn bộ
     * 4-Đã hủy (không tính vào doanh số)
     * 5-Hoàn thành
     */
    status: {
        type: Number,
        default: 5
    },
    //_________Nội dung
    name: String,
    //_________Mã hiệu
    sign: String,
    //_________Mã đơn app
    appOrderSign: String,
    //_________Ghi chú
    note: String,
    //_________Số lỗi mắc phải (cập nhật sau khi tạo đơn)
    numberOfMistakes: {
        type: Number,
        default: 0
    },  
    /**
     * Số lượng sản phẩm
     * => Không tính với product là Topping
     */
    numberOfProducts: {
        type: Number,
        default: 1
    },
    //_________Danh mục sản phẩm
    products: [{
        type: Schema.Types.ObjectId,
        ref: "fnb_product"
    }],
    /**
     * GIÁT TRỊ
     */
    //______Tổng giá theo các Product của đơn hàng
    total: {
        type: Number,
        default : 0
    },
    //______Chiết khấu
    discount: {
        type: Number,
        default : 0
    },
    //______Giảm giá
    salesoff: {
        type: Number,
        default : 0
    },
    //______Thành tiền (phải thanh toán)
    amount: {
        type: Number,
        default : 0
    },
    //______VAT thành tiền (10%*amount)
    vatAmount: {
        type: Number,
        default : 0
    },
    /**
     * KHÁCH HÀNG THÂN THIẾT
     */
    //______Điểm tích lũy
    loyaltyPoints: {
        type: Number,
        default : 0
    },
    /**
     * QUẢN LÝ THÔNG BÁO
     */
    /**
     * Những người được quyền truy cập
     * 1-author (khi tạo việc xong thì add vào)
     * 2-members của funda (thành viên đơn vị cơ sở)
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