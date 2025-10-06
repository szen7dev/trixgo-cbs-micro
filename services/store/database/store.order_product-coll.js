"use strict";
/**
 * ORDER_GOODS
 */
const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("store_order_product", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Đơn vị cơ sở/Cửa hàng***
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
    /**
     * PHÂN LOẠI KÊNH/KINH DOANH
     */
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
    /**
     * KẾ TOÁN
     */
    //_________Mã khách (dùng cho Nợ và có)
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'contact'
    },
    //_________Tài khoản
    account: {
        type: Schema.Types.ObjectId,
        ref: 'account'
    },
    //_________Tài khoản đối ứng
    contra: {
        type: Schema.Types.ObjectId,
        ref: 'account'
    },
    //_________Hàng hóa/Thành phẩm/Nguyên vật liệu/Tài sản
    goods: {
        type: Schema.Types.ObjectId,
        ref : "goods"
    },
    //_________Phân loại cha
    parentGoods: {
        type: Schema.Types.ObjectId,
        ref : "goods"
    },
    //_________Khoản mục phí (báo cáo theo Khoản mục-Dự án)
    subtype: {
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    },
    //_________Khoản mục phí cha
    parentSubtype: {
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    },
    //_________Tài sản/thiết bị dùng để quản lý sửa chữa, tiêu hao
    assets: {
        type: Schema.Types.ObjectId,
        ref : "goods"
    },
    /**
     * LINK NGÂN SÁCH
     */   
    //_________Ngân sách
    budget: {
        type: Schema.Types.ObjectId,
        ref: 'budget'
    },
    //_________Hạng mục
    budgetItem: {
        type: Schema.Types.ObjectId,
        ref: 'budget_item'
    },
    //_________Nhóm
    budgetGroup: {
        type: Schema.Types.ObjectId,
        ref: 'budget_group'
    },
    //_________Công việc***sửa lại FE và BE cho phù hợp
    budgetWork: {
        type: Schema.Types.ObjectId,
        ref: 'budget_work'
    },
    /**
     * ĐƠN HÀNG
     */
    //_________Đơn hàng
    order: {
        type: Schema.Types.ObjectId,
        ref : "store_order"
    },
    /**
     * Phân loại vào ra
     * 1-Bán ra/Xuất kho/Chi tiền ra
     * 2-Mua vào/Nhập kho/Thu tiền vào
     */
    outin: { type: Number, default: 1 },
    /**
     * Phân loại
     * 1. Mặc định (sử dụng làm kế hoạch)
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
    //_________Ngày chứng từ
    dateInvoice: { type: Date, default: Date.now }, 
    //_________Có phải là phiếu kết chuyển số dư chuyển cuối kỳ hay không
    forward: { type: Number, default: 0 },
    //_________Có phải là phiếu kết chuyển doanh thu chi phí cuối kỳ hay không (Income Statement)
    forwardIs: { type: Number, default: 0 },
    //_________Có phải là phiếu xuất hàng đi mượn hay không (để không chạy giá vốn cho các phiếu này)
    returning: { type: Number, default: 0 },
    /**
     * Trạng thái đơn
     * 1-Khởi tạo
     * 2-Chờ Ship lấy hàng/Mang hàng tới Ship
     * 3-Đang vận chuyển/giao hàng
     * 4-Giao không thành công
     * 5-Đã giao/Hoàn thành
     * 6-Hủy bỏ
     * 7-Trả hàng/Hoàn tiền
     */
    status: {
        type: Number,
        default: 5
    },
    //_________Ngày
    date: { type: Date, default: Date.now },
    //_________Tới ngày
    toDate: { type: Date, default: Date.now },
    //_________Tên
    name: String,
    namecv: String,
    //_________Mã hiệu
    sign: String,
    //_________Ghi chú
    note: String,
    //______Khối lượng/Số lượng
    quantity: {
        type: Number,
        default : 1
    },
    //______Đơn giá
    unitPrice: {
        type: Number,
        default : 0
    },
    //______Thành tiền
    amount: {
        type: Number,
        default : 0
    },
    //_________Trọng lượng
    weight: { type: Number, default: 0 },
    // /**
    //  * Sản phẩm phụ (topping)
    //  */
    // subGoods: [{
    //     type: Schema.Types.ObjectId,
    //     ref : "goods"
    // }],
    /**
     * DÀNH CHO ĐỒ UỐNG
     */
    /**
     * Màu sắc
     * 1-Đen
     * 2-Trắng
     */
    black: {
        type: Number,
        default : 1
    },
    /**
     * Kích cỡ
     * 1-Size M
     * 2-Size L
     */
    size: {
        type: Number,
        default : 1
    },
    /**
     * Đường
     * 1-100
     * 2-70
     * 3-50
     * 4-30
     * 5-0
     */
    sugar: {
        type: Number,
        default : 1
    },
    /**
     * Đá
     * 1-100
     * 2-70
     * 3-50
     * 4-30
     * 5-0
     */
    ice: {
        type: Number,
        default : 1
    },
    /**
     * THÔNG TIN GIÁ TRỊ
     */
    //______Hàng bán (1), Hàng tặng (2)
    classification: {
        type: Number,
        default : 1
    },
    //______Khối lượng/Số lượng
    quantity: {
        type: Number,
        default : 1
    },
    //______Đơn giá xuất bán
    unitPrice: {
        type: Number,
        default : 0
    },
    //_________Đơn giá niêm yết
    listedUnitprice: {
        type: Number,
        default : 0
    },
    //______Thành tiền
    amount: {
        type: Number,
        default : 0
    },
    /**
     * Check kiểm
     * 1-Khởi tạo
     * 2-Checked
     */
    checked: {
        type: Number,
        default: 1
    },
    //_________Lịch sử thay đổi
    history: String,
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