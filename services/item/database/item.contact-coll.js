"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 * DANH BẠ (Nhân viên, Khách hàng, Đối tác)
 * https://insider.tophr.vn/4-loai-bao-cao-nhan-su-quan-trong-hr-can-biet-co-vi-du/
 * 1. Báo cáo về biến động nhân sự
 * Báo cáo biến động theo thâm niên
 * Báo cáo biến động theo thời gian
 * Báo cáo biến động theo vị trí công việc
 * 2. Báo cáo về chấp hành qui định về công, ca
 * 3. Báo cáo hiệu quả sử dụng lao động
 * 4. Báo cáo hiệu quả tuyển dụng
 */
module.exports  = DATABASE_MIDDLEWARE("contact", {
    //_________Điện thoại (***)
    phone : String,
    //_________Email
    email : String,
    //_________Công ty   
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    level: {
        type: Number,
        default: 1 
    },
    /**
     * KHAI BÁO SỬ DỤNG
     */
    //_________Sử dụng CRM (Customer relationship management)
    inCRM: { type: Number, default: 1 },
    //_________Sử dụng Nhân sự
    inHuman: { type: Number, default: 1 },
    //_________Sử dụng Chấm công
    inTimesheet: { type: Number, default: 1 },
    //_________Sử dụng Tài chính
    inFinancial: { type: Number, default: 1 },
    //_________Sử dụng Văn bản
    inDocument: { type: Number, default: 1 },
    /**
     * THÔNG TIN CHUNG/CĂN BẢN
     */
    //_________Phân loại (1-Nhân viên/2-Khách hàng/3-Nhà cung cấp)
    type: { type: Number, default: 1 },
    //_________Phân loại nhân sự (1-Nhân viên, 2-Cộng tác viên, 3-Chuyên gia)
    subtype: { type: Number, default: 1 },
    //_________Trạng thái giao dịch (Chưa GD-1, Đang GD-2, Ngừng GD-3)
    status: { type: Number, default: 1 },
    //_________Thuộc phòng ban bộ phận
    department: {
        type: Schema.Types.ObjectId,
        ref : 'department' 
    },
    //_________Vị trí chức vụ là gì
    position: {
        type: Schema.Types.ObjectId,
        ref : "position"
    },
    //_________Phân loại theo Lĩnh vực/ngành nghề
    field: {
        type: Schema.Types.ObjectId,
        ref : "doctype"
    },
    //_________Phân loại theo tính chất/loại khách hàng
    property: {
        type: Schema.Types.ObjectId,
        ref : "doctype"
    },
    //_________Tên/họ và tên
    name: String,
    //_________Tên tra cứu
    namecv: String,
    //_________Mã hiệu
    sign: String,  
    //_________Mô tả (Thông tin khác)
    description: String,
    //_________Ghi chú
    note: String,
    //_________Giới tính(1-nam/ 0 - nữ)
    gender: { type: Number, default: 1 },
    //_________Ngày sinh
    birthday: { type: Date, default: null },
    //_________Căn cước/Chứng minh thư (Số định danh)
    identity: String,
    //_________Ngày cấp
    dateProvice: { type: Date, default: null },
    //_________Nơi cấp
    place: String,
    //_________Mã số thuế
    taxid: String,
    //_________Năm tốt nghiệp
    graduationYear: { type: Date, default: null },
    //_________Địa chỉ thường trú (Nơi ở)
    address: String,
    //_________Khu vực thường trú (Nơi ở)
    area: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Nơi sinh
    area1: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Nguyên quán
    area2: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Sale/CSKH
    sale: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    //_________Link với nhân viên sale
    linkSale: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    //_________Link với tài khoản
    linkUser: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    //_________Quê quán (bỏ không dùng)
    province: { type: Number, default: 1 },
    //_________Tài khoản ngân hàng (tên ngân hàng, số tài khoản, người hưởng)
    bankAccount: String,
    //_________Thông tin gia đình (Tên, quan hệ, điện thoại, email, địa chỉ)
    family: String,
    //_________Chính sách gia đình thương binh liệt sỹ
    familyPolicy:{ type: Number, default: 1 },
    /**
     * QUÁ TRÌNH LÀM VIỆC VÀ HỢP ĐỒNG LAO ĐỘNG
     */
    //_________Trạng thái thực ảo của nhân sự
    realStatus:{ type: Number, default: 1 },
    //_________Ngày bắt đầu làm việc
    workStartDate: { type: Date, default: null },
    //_________Ngày nghỉ việc
    dayOff: { type: Date, default: null },
    //_________Tình trạng làm việc
    workingStatus:{
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    },
    //_________Loại hợp đồng lao động()
    contractType:{
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    },
    //_________Số hợp đồng
    contractSign: String,
    //_________Ngày ký hợp đồng
    contractDate: { type: Date, default: null },
    //_________Ngày hiệu lực của hợp đồng
    contractValid: { type: Date, default: null },
    //_________Thời hạn hợp đồng
    contractExpire: { type: Date, default: null },
    //_________Ngày bổ nhiệm/miễn nhiệm
    appointDate: { type: Date, default: null },
    //_________Ngày thay đổi lương gần nhất
    changeSallaryDate: { type: Date, default: null },
    /**
     * BẢO HIỂM XÃ HỘI
     */
    //_________Tình trạng sổ bảo hiểm xã hội
    insuranceStatus: { type: Number, default: 1 },
    //_________Số số bảo hiểm xã hội 	
    insuranceNumber: String,
    //_________Mã số bảo hiểm xã hội (Số bảo hiểm)	
    insuranceSign: String, 
    //_________Ngày nộp sổ (Ngày nộp bảo hiểm)
    insuranceDate: { type: Date, default: null },
    //_________Hệ số lương
    sallaryFactor: { type: Number, default: 1 },
    //_________Phụ cấp
    sallarySubFactor: { type: Number, default: 0 },
    //_________Lương căn bản (Mức đóng BH)
    sallaryBasic: { type: Number, default: 0 },
    /**
     * HỒ SƠ CHI TIẾT
     */
    //_________Nơi làm việc hiện tại
    workplace:[{
        type: Schema.Types.ObjectId,
        ref: 'department'
    }],
    //_________Trình độ học vấn
    educationalBackground:[{
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    }],
    //_________Chuyên ngành đào tạo
    major:[{
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    }],
    //_________Chi tiết hồ sơ tài liệu liên đới
    documents: [{
        type: Schema.Types.ObjectId,
        ref: 'contact_document'
    }],
    //_________Phân loại thâm niên
    seniority:{
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    },
    //_________Khác
    other:{
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    },
    //_________Tài liệu đính kèm
    files: [{
        type: Schema.Types.ObjectId,
        ref: 'file'
    }],
    //_________Ảnh đại diện
    image: {
        type: String,
        default: 'contact_default.png'
    },
    //_________Người ký xác nhận vào (Người ký nhận)
    signerIn: String,
    /**
    * _______Người ký xác nhận chấm dứt (Người ký xa thải)
    */
    signerOut: String,
    
    // Số lượng lịch sử làm việc tai các đơn vị (type = 1)
    amountWorkHistory:{
        type: Number,
        default: 0
    },
    // Số lượng kinh nghiệm thự tế tham gia các dự án (type = 2)
    amountProjectHistory:{
        type: Number,
        default: 0
    },
    // Số lượng kinh nghiệm theo quyết định bổ nhiệm (type = 3)
    amountContractHistory:{
        type: Number,
        default: 0
    },
    // Số lượng trình độ học vấn (type = 4)
    amountEducationHistory:{
        type: Number,
        default: 0
    },
    // Số lượng chứng chỉ hồ sơ khác (type = 5)
    amountCertificateHistory:{
        type: Number,
        default: 0
    },
    // Số lượng danh bạ con
    amountChilds:  {
        type: Number,
        default : 0
    },
    /**
     * FNB
     */
    //_________Phân loại chiến dịch
    campaignType: {
        type: Schema.Types.ObjectId,
        ref : 'fnb_voucher' 
    },
    //_________Thành tích giới thiệu
    achievements: [{
        type: Schema.Types.ObjectId,
        ref: "contact"
    }],
    //_________Người giới thiệu
    referrer: {
        type: Schema.Types.ObjectId,
        ref : 'contact' 
    },
    //_________Voucher nhận được
    getVouchers: [{
        type: Schema.Types.ObjectId,
        ref: "fnb_voucher"
    }],
    //_________Voucher đã sử dụng
    usedVouchers: [{
        type: Schema.Types.ObjectId,
        ref: "fnb_voucher"
    }],
    /**
     * Khách biết tên hay vãng lai
     * 1-Biết tên
     * 2-Vãng lai
     */
    nonResident: {
        type: Number,
        default: 1
    },
    //_________Đơn vị cơ sở
    funda: {
        type: Schema.Types.ObjectId,
        ref : 'funda' 
    },
    //_________Tỉnh, Thành phố (lấy theo funda)
    sector1: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Huyện quận (lấy theo funda)
    sector2: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Phường xã (lấy theo funda)
    sector3: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    /**
     * Khách mới hay cũ
     * 1-Mới
     * 2-Cũ
     */
    new: {
        type: Number,
        default: 1
    },
    //_________Ngày bắt đầu tham gia mua hàng
    joinedDate: { type: Date, default: Date.now },
    //_________Số đơn hàng đã Mua
    numberOfOrders: {
        type: Number,
        default: 0
    },
    //_________Tổng giá trị đơn hàng đã mua
    total: {
        type: Number,
        default: 0
    },
    //_________Giá trị tiền hàng đã thanh toán
    purchasedValue: {
        type: Number,
        default: 0
    },
    //_________Số đơn hàng đã Hủy
    numberOfCancelOrders: {
        type: Number,
        default: 0
    },
    //_________Tổng giá trị đơn hàng đã Hủy
    totalOfCancelOrders: {
        type: Number,
        default: 0
    },
    //_________Giá trị đơn hàng Off
    purchasedOffValue: {
        type: Number,
        default: 0
    },
    //______Tổng tiền tích lũy
    totalLoyaltyPoints: {
        type: Number,
        default : 0
    },
    //______Tiền đã sử dụng
    usedLoyaltyPoints: {
        type: Number,
        default : 0
    },
    //______Tiền còn lại
    remainLoyaltyPoints: {
        type: Number,
        default : 0
    },
    /**
     * Hạng thành viên
     * 1-Bạc
     * 2-Vàng
     * 3-Kim Cương
     */
    membershipLevel: {
        type: Number,
        default: 1 
    },
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