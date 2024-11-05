"use strict";
/**
 * ORDER
 * Stock card
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("store_order", {
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
    //_________Dự án, phòng ban
    project: {
        type: Schema.Types.ObjectId,
        ref : "department"
    },
    //_________Gói thầu giao
    package: {
        type: Schema.Types.ObjectId,
        ref : "document_package",
    },
    //_________Gói thầu nhận
    toPackage: {
        type: Schema.Types.ObjectId,
        ref : "document_package",
    },
    //_________Hợp đồng
    contract: {
        type: Schema.Types.ObjectId,
        ref : "contract"
    },
    //_________Kho bãi (kho của công ty)
    warehouse: {
        type: Schema.Types.ObjectId,
        ref : "warehouse"
    },
    //_________Kho bãi giao đi (kho của đối tác sẽ nhận)
    toWarehouse: {
        type: Schema.Types.ObjectId,
        ref : "warehouse"
    },
    //_________Lĩnh vực kinh doanh
    business: {
        type: Schema.Types.ObjectId,
        ref: "doctype"
    },
    //_________Kênh bán hàng
    channel: {
        type: Schema.Types.ObjectId,
        ref: "doctype"
    },
    //_________Phân loại kênh
    parentChannel: {
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    },
    //_________Mã khách
    customer: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    // /**
    //  * Phân quyền truy cập order (BỎ)
    //  */
    // //_________Admin (được quyền xem, sửa)
    // admins : [{
    //     type   : Schema.Types.ObjectId,
    //     ref: 'user'
    // }],
    // //_________Thành viên (được quyền xem)
    // members : [{
    //     type   : Schema.Types.ObjectId,
    //     ref: 'user'
    // }],
    /**
     * Link tới phiếu
     * Sử dụng để tính giá xuất theo Nhập (linkID) xuất đích danh
     */
    link: {
        type: Schema.Types.ObjectId,
        ref: "store_order"
    },
    /**
     * Phân loại vào ra
     * 1-Bán ra/Xuất kho/Thu tiền vào
     * 2-Mua vào/Nhập kho/Chi tiền ra
     */
    outin: { type: Number, default: 1 },
    /**
     * Phân loại
     * 1. Mặc định
     * 2. Vật tư chính
     * 3. Vật tư phụ
     * 4. Công cụ dụng cụ
     * 5. Hàng hóa/Cấu kiện/Thành phẩm
     * 6. Văn phòng phẩm
     * 7. Quỹ tiền mặt
     * 8. Quỹ ngân hàng
     */
    type: {
        type: Number,
        default : 1
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
     * Phân biệt khách hàng hay nhân viên
     * 1-Nhân viên
     * 2-Khách hàng
     */
    customerType: {
        type: Number,
        default: 2
    },   
    /**
     * Người thực hiện
     */
    //_________Ca nhiều người (chuỗi/đồ uống)
    assignee: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    //_________Ca 1 người (trị liệu)
    doer: {
        type: Schema.Types.ObjectId,
        ref: "user"
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
     * Phân loại nguồn***
     * 1-Thông thường
     * 2-Video
     * 3-Affiliate
     * 4-Live stream
     * 5-Quảng cáo
     */
    sources: {
        type: Number,
        default: 1
    },
    /**
     * Nhân viên chốt sale/kinh doanh***
     * Người chăm sóc Affiliate
     * Người live stream
     * Người quảng cáo
     * ....
     */
    sale: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    //_________Affiliate mang lại doanh số***
    affiliate: {
        type: Schema.Types.ObjectId,
        ref : "contact"
    },
    //_________Người giới thiệu
    referrer: {
        type: Schema.Types.ObjectId,
        ref : 'contact'
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
     * 1-Khởi tạo
     * 2-Chờ Ship lấy hàng/Mang hàng tới Ship
     * 3-Đang vận chuyển/giao hàng
     * 4-Giao không thành công
     * 5-Đã giao/Hoàn thành
     * 6-Đã hủy (cũ là 4)
     * 7-Trả hàng/Hoàn tiền
     */
    status: {
        type: Number,
        default: 5
    },
    //_________Ngày tháng đơn hàng
    date: { type: Date, default: Date.now },
    //_________Nội dung
    name: String,
    namecv: String,
    //_________Mã hiệu
    sign: String,
    //_________Ghi chú
    note: String,
    //_________
    buyerName: String,
    //_________
    buyerPhone: String,
    //_________
    buyerEmail: String,
    //_________
    recipientName: String,
    //_________
    recipientPhone: String,
    //_________
    recipientAddress: String,
    //_________Product
    products : [{
        type   : Schema.Types.ObjectId,
        ref: 'store_order_product'
    }],
    /**
     * QUẢN LÝ LỖI
     */
    //_________Người quản lý
    manager: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    /**
     * Số sao đánh giá đơn app
     * 1-5 sao dành cho Food App
     */
    starRating: {
        type: Number,
        default: 5
    },
    //_________Số khiếu nại
    complaint: {
        type: Number,
        default: 0
    },  
    // /**
    //  * Phân loại lý do hủy đơn***
    //  * Phân loại phản hồi của khách
    //  */
    // complaints: [{
    //     type: Schema.Types.ObjectId,
    //     ref: "doctype"
    // }],
    //_________Ghi chú nội dung feedback
    feedbackNotes: String,
    //_________Số lỗi mắc phải (cập nhật sau khi tạo đơn)
    numberOfMistakes: {
        type: Number,
        default: 0
    },  
    //_________Danh mục lỗi
    mistakes: [{
        type: Schema.Types.ObjectId,
        ref: "doctype"
    }],
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
    /**
     * GIÁT TRỊ
     */
    //_________Có sử dụng Voucher hay không
    voucher: {
        type: Schema.Types.ObjectId,
        ref: "fnb_voucher"
    },
    /**
     * Phân loại voucher
     * 1-Thông thường/các dịp lễ tết
     * 2-Tặng người giới thiệu
     * 3-Tặng người nhận giới thiệu
     * 4-Tổ chức các sự kiện
     * 5-Tặng cho nhân viên, cán bộ
     * 6-Tri ân đối tác
     */
    voucherType: {
        type: Number,
        default: 1
    }, 
    //______Tổng giá theo các Product của đơn hàng (tổng doanh số)
    total: {
        type: Number,
        default : 0
    },
    //______Chiết khấu (chỉ áp dụng cho đơn App)
    discount: {
        type: Number,
        default : 0
    },
    //______Giảm giá (áp dụng cho đơn Off)
    salesoff: {
        type: Number,
        default : 0
    },
    /**
     * Sử dụng credit (tích điểm quy đổi-áp dụng cho đơn Off)
     * Giảm giá bằng Credit
     */
    credit: {
        type: Number,
        default : 0
    },
    //______Sử dụng offer từ voucher (áp dụng cho đơn Off)
    offer: {
        type: Number,
        default : 0
    },
    /**
     * Thành tiền (phải thanh toán) -  Chưa gồm VAT
     * amount = total - discount - salesoff - credit - offer
     */
    amount: {
        type: Number,
        default : 0
    },
    //______Tổng phí ship
    shippingFeeTotal: {
        type: Number,
        default : 0
    },
    //______Phí ship khách phải
    shippingFee: {
        type: Number,
        default : 0
    },
    //______paid tiền khách trả tại quán
    paid: {
        type: Number,
        default : 0
    },
    //______Tỷ lệ VAT
    vatRate: {
        type: Number,
        default : 10
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
    //_________Người phê duyệt
    approver:{
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    //_________Thời điểm phê duyệt
    timeApproved: { type: Date, default: null },
    //_________Ký duyệt xác nhận
    signatures: [{
        type: Schema.Types.ObjectId,
        ref: "signature"
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