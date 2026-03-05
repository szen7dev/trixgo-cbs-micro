"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 * DANH BẠ (Nhân viên, Khách hàng, Đối tác)
 */
module.exports  = DATABASE_MIDDLEWARE("contact", {
    //_________Mã hiệu bằng số do hệ thống tự phát sinh: sử dụng làm mã giới thiệu luôn
    suid : {
        type   : String,
        require:  true,
        unique : true
    },
    //_________Là danh bạ mặc định của công ty (2)
    isDefault: {
        type: Number,
        default: 1 
    },
    //_________Công ty   
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    childs: [{
        type: Schema.Types.ObjectId,
        ref: "contact"
    }],
    level: {
        type: Number,
        default: 1 
    },
    //_________Thành viên được quyền truy cập
    members : [{
        type   : Schema.Types.ObjectId,
        ref: 'user'
    }],
    /**
     * ĐỆ QUY ĐỂ XỬ LÝ SỐ LIỆU AFFILIATE
     */
    //_________Toàn bộ các cấp cha bên trên => Dùng để tạo được nestedChilds
    nestedParents: [{
        type: Schema.Types.ObjectId,
        ref: "contact"
    }],
    //_________Toàn bộ các cấp con bên dưới
    nestedChilds: [{
        type: Schema.Types.ObjectId,
        ref: "contact"
    }],
    //_________Hồ sơ danh bạ
    documents: [{
        type: Schema.Types.ObjectId,
        ref: "contact_document"
    }],
    /**
     * Phân loại
     * 1-Nhân viên
     * 2-Khách hàng
     * 3-Cộng tác, chuyên gia
     * 4-Đơn vị cơ sở
     * 5-Ba mẹ
     * 6-Các bé
     */
    type: { type: Number, default: 1 },
    //_________Phân loại nhân sự (1-Nhân viên, 2-Cộng tác viên, 3-Chuyên gia)
    subtype: { type: Number, default: 1 },
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
    //_________Lĩnh vực chuyên ngành
    field: {
        type: Schema.Types.ObjectId,
        ref : "doctype"
    },
    //_________Phân loại theo tính chất/loại khách hàng
    property: {
        type: Schema.Types.ObjectId,
        ref : "doctype"
    },
    //_________Trạng thái: 1-Đang hoạt động, 2-Không hoạt động
    status: { type: Number, default: 1 },
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
    //_________Điện thoại (***)
    phone : String,
    //_________Email
    email : String,
    //_________Giới tính (1-Nam/2-Nữ/3-Khác)
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
    //_________Khu vực Nơi sinh
    area1: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Khu vực Nguyên quán
    area2: {
        type: Schema.Types.ObjectId,
        ref : "area"
    },
    //_________Nguồn dữ liệu (từ Marketing mang về)
    dataSource: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    //_________Người support, chăm sóc
    support: {
        type: Schema.Types.ObjectId,
        ref: "contact"
    },
    //_________Link với tài khoản
    linkUser: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    //_________Số dư tài khoản: trả trước (nạp vào ví trả trước tiêu sau)
    balance: { type: Number, default: 0 },
    //_________Tài khoản ngân hàng
    bankAccount: String,
    //_________Thuộc ngân hàng
    bank: String,
    //_________Thông tin gia đình (Tên, quan hệ, điện thoại, email, địa chỉ)
    family: String,
    //_________Chính sách gia đình thương binh liệt sỹ
    familyPolicy:{ type: Number, default: 1 },
    /**
     * QUÁ TRÌNH LÀM VIỆC VÀ HỢP ĐỒNG LAO ĐỘNG
     */
    //_________Trạng thái thực ảo của nhân sự
    realStatus:{ type: Number, default: 1 },
    //_________Người ký xác nhận vào (Người ký nhận)
    signerIn: String,
    //_________Người ký xác nhận chấm dứt (Người ký xa thải)
    signerOut: String,
    //_________Ngày bắt đầu làm việc
    workStartDate: { type: Date, default: null },
    //_________Ngày nghỉ việc
    dayOff: { type: Date, default: null },
    //_________Tình trạng làm việc
    workingStatus:{
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    },
    //_________Loại hợp đồng lao động
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
    //_________Số giờ quy định làm việc/1 năm: =(365-52 tuần*1 ngày nghỉ/tuần)*8
    annualWorkingHours: { type: Number, default: 2504 },
    //_________Lương
    sallary: { type: Number, default: 0 },
    //_________Hệ số lương
    sallaryFactor: { type: Number, default: 1 },
    //_________Phụ cấp
    sallarySubFactor: { type: Number, default: 0 },
    //_________Lương căn bản (Mức đóng BH)
    sallaryBasic: { type: Number, default: 0 },
    //_________Số ngày được nghỉ phép tối đa trong năm
    numberOnLeave: { type: Number, default: 12 },
    //_________Số ngày được nghỉ phép phát sinh: người thân mất, việc hiếu, hỉ
    numberOnLeavePlus: { type: Number, default: 0 },
    //_________Số người phụ thuộc
    nods: { type: Number, default: 0 },
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
    //_________Số tiền đóng BH
    insuranceFee: { type: Number, default: 0 },
    //_________Trừ công đoàn
    union: { type: Number, default: 0 },
    //_________Trừ quỹ tương thân tương ái
    share: { type: Number, default: 0 },
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
    //_________Số lượng lịch sử làm việc tai các đơn vị (type = 1)
    amountWorkHistory:{
        type: Number,
        default: 0
    },
    //_________Số lượng kinh nghiệm thự tế tham gia các dự án (type = 2)
    amountProjectHistory:{
        type: Number,
        default: 0
    },
    //_________Số lượng kinh nghiệm theo quyết định bổ nhiệm (type = 3)
    amountContractHistory:{
        type: Number,
        default: 0
    },
    //_________Số lượng trình độ học vấn (type = 4)
    amountEducationHistory:{
        type: Number,
        default: 0
    },
    //_________Số lượng chứng chỉ hồ sơ khác (type = 5)
    amountCertificateHistory:{
        type: Number,
        default: 0
    },
    //_________Số lượng danh bạ con
    amountChilds:  {
        type: Number,
        default : 0
    },
    /**
     * PHỤC VỤ ĐƠN HÀNG
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
    //_________Voucher nhận được
    getStoreVouchers: [{
        type: Schema.Types.ObjectId,
        ref: "store_voucher"
    }],
    //_________Voucher đã sử dụng
    usedStoreVouchers: [{
        type: Schema.Types.ObjectId,
        ref: "store_voucher"
    }],
    //_________Tỷ lệ tích điểm (%)
    earningRate: {
        type: Number,
        default: 3
    },
    //_________Hoa hồng affiliate (%)
    affiliateCommission: {
        type: Number,
        default: 10
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
    //_________Ngày bắt đầu tham gia
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
    //_______Chiều cao
    height: { 
        type: Number,
        default : 0
     },
    //_______Ngày dậy thì
    pubertyOnsetDate: { type: Date, default: null },
    //_______Tuổi xương thực (dạng số - Đo bằng máy)
    boneAge: { type: Number },
    /**
     * Hạng thành viên (để được ưu đãi khi mua hàng)
     * 1-Đồng
     * 2-Bạc
     * 3-Vàng
     * 4-Kim Cương
     * 5-Vương miện
     */
    membershipLevel: {
        type: Number,
        default: 1 
    },
    //______Điểm thành tích
    xp: {
        type: Number,
        default: 0
    },
    //______Ngày duy trì liên tục
    streak : {
        type: Number,
        default: 0
    },
    //______Trái tim
    hearts : {
        type: Number,
        default: 0,
        min: 0,
        max: 5, // Giới hạn tối đa
    },
    //______Gems tiền tệ trong app
    gems : {
        type: Number,
        default: 0,
    },
    //______Huy hiệu
    /**
     * 1-Đồng
     * 2-Bạc
     * 3-Vàng
     * 4-Kim Cương
     * 5-Vương miện
     */
    badges : {
        type: Number,
        default: 1,
        min: 1,
        max: 5, // Giới hạn tối đa
    },
    /**
     * Giảm giá mã người giới thiệu
     * Sẽ tùy thuộc theo từng Level của người giới thiệu
     */
    referralDiscountRate: {
        type: Number,
        default: 20,
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