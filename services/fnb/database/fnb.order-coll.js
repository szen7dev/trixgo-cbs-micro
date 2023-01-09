"use strict";
/**
 * ORDER
 * ---Doanh số phân theo tổng doanh số/Doanh số đơn hủy
 * Tiêu đề CloudMSS: Đơn hàng Winggo Thái Thịnh
 * Đơn hàng T11225, mã hiệu 22556688, giá trị 42.000 VND, đã được thanh toán thành công bởi Winggo Thái Thịnh
 * https://www.mongodb.com/docs/manual/reference/operator/aggregation/dayOfWeek/
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
    //_________Mã khách
    customer: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    /**
     * Khách biết tên hay vãng lai
     * 1-Biết tên
     * 2-Vãng lai
     */
    nonResident: {
        type: Number,
        default: 1
    },
    /**
     * Khách mới hay cũ
     * 1-Mới
     * 2-Cũ
     * 3-Khách vãng lai
     */
    new: {
        type: Number,
        default: 1
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
     * Tên chiến dịch (type=20)
     * - Gán chiến dịch đang hiện hành để đo lường
     */
    activeCampaign: {
        type: Schema.Types.ObjectId,
        ref : 'doctype'
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
     * Ca làm việc
     * - Chấm công theo ca
     * - Tính vật tư theo ca
     */
    shift: {
        type: Schema.Types.ObjectId,
        ref: "fnb_shift"
    },
    /**
     * Phân loại ca làm việc (cập nhật theo Shift)
     * 1-Sáng
     * 2-Chiều
     * 3-Tối
     */
    shiftType: {
        type: Number,
        default: 1
    },
    /**
     * Mùa trong năm (cập nhật theo Shift)
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
     * Phân loại kênh bán hàng
     * 1-Offline
     * 2-Grab
     * 3-Shopee
     * 4-Gojek
     * 5-Baemin
     * 6-Loship
     * 7-Bee
     */
    salesChannel: {
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
     * Hình thức phục vụ
     * 1-Tại quán
     * 2-Giao hàng (App)
     * 3-Mang đi (Mua mang đi)
     */
    service: {
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
     * SẢN PHẨM VÀ SIZE
     */
    //______Số size M sử dụng trong ca
    numberOfSizeM: {
        type: Number,
        default: 0
    },
    //______Số size L sử dụng trong ca
    numberOfSizeL: {
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
    //______Tổng giá theo các Product của đơn hàng (tổng doanh số)
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
    //______Sử dụng credit (tích điểm quy đổi)
    credit: {
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
     * THƯỞNG DOANH SỐ
     */
    //______Số lượng sản phẩm trung bình của mỗi nhân viên
    avgQuantityPerStaff: {
        type: Number,
        default : 0
    },
    //______Doanh số trung bình tính cho 1 nhân viên
    avgTotalPerStaff: {
        type: Number,
        default : 0
    },
    /**
     * KHÁCH HÀNG
     */
    //_________Giới tính
    gender: { type: Number, default: 1 },
    //______Độ tuổi: lấy Năm hiện tại (khi tạo đơn hàng) - Ngày sinh của khách hàng
    age: { type: Number, default: 1 },
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